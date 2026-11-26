import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_STATE, STORE_INFO } from '../data/seedData';
import {
  AuthStatus,
  FulfillmentType,
  Order,
  OrderItemSnapshot,
  OrderStatus,
  PersistedStoreState,
  SavedAddress,
  SubstitutionPreference,
  SupportTicket,
  SupportTicketStatus,
  SupportTicketType,
  UserAccount,
} from '../types/store';
import {
  applyOrderLoyaltyReward,
  buildReorderItems,
  calculateCartSummary,
  findAccountByIdentifier,
  getPointsToSpend,
  mergeItemsIntoCart,
  removeSavedAddressFromList,
  upsertSavedAddressList,
} from '../utils/storeLogic';

const STORAGE_KEY = 'rachid_store_state_v3';

function createCleanInitialState(): PersistedStoreState {
  return {
    ...INITIAL_STATE,
    products: INITIAL_STATE.products.map((p) => ({ ...p, tags: [...p.tags] })),
    bundles: INITIAL_STATE.bundles.map((b) => ({
      ...b,
      items: b.items.map((item) => ({ ...item })),
    })),
    cart: [],
    orders: [],
    favorites: [],
    recurringList: [],
    loyaltyPoints: 0,
    loyaltyStamps: 0,
    completedRewardsCount: 0,
    awardedActionKeys: [],
    tickets: [],
    accounts: [],
    guestSavedAddresses: [],
  };
}

function loadInitialState(): PersistedStoreState {
  const fresh = createCleanInitialState();
  if (typeof window === 'undefined') {
    return fresh;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Partial<PersistedStoreState>;
    if (!parsed || typeof parsed !== 'object') {
      return fresh;
    }
    return {
      ...fresh,
      ...parsed,
      products: fresh.products,
      bundles: fresh.bundles,
      loyaltyPoints: typeof parsed.loyaltyPoints === 'number' ? Math.max(0, parsed.loyaltyPoints) : 0,
      loyaltyStamps: typeof parsed.loyaltyStamps === 'number' ? Math.max(0, parsed.loyaltyStamps) : 0,
      completedRewardsCount:
        typeof parsed.completedRewardsCount === 'number'
          ? Math.max(0, parsed.completedRewardsCount)
          : 0,
      awardedActionKeys: Array.isArray(parsed.awardedActionKeys) ? parsed.awardedActionKeys : [],
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      recurringList: Array.isArray(parsed.recurringList) ? parsed.recurringList : [],
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      guestSavedAddresses: Array.isArray(parsed.guestSavedAddresses)
        ? parsed.guestSavedAddresses
        : [],
    };
  } catch {
    return fresh;
  }
}

export interface PlaceOrderPayload {
  fulfillment: FulfillmentType;
  customerName: string;
  phone: string;
  neighborhood: string;
  address: string;
  notes: string;
  redeemPoints: boolean;
}

export function useStorePersistence() {
  const [state, setState] = useState<PersistedStoreState>(loadInitialState);
  const stateRef = useRef<PersistedStoreState>(state);
  stateRef.current = state;

  const commitState = useCallback(
    (updater: (prev: PersistedStoreState) => PersistedStoreState): PersistedStoreState => {
      const next = updater(stateRef.current);
      stateRef.current = next;
      setState(next);
      return next;
    },
    []
  );

  useEffect(() => {
    try {
      const { products: _p, bundles: _b, ...persistable } = state;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [state]);

  const activeAccount: UserAccount | null =
    state.authStatus === AuthStatus.AUTHENTICATED
      ? state.accounts.find((a) => a.id === state.activeAccountId) ?? null
      : null;

  const activeSavedAddresses: SavedAddress[] = activeAccount
    ? activeAccount.savedAddresses
    : state.guestSavedAddresses;

  const addToCart = useCallback(
    (
      productId: string,
      quantity = 1,
      substitution: SubstitutionPreference = SubstitutionPreference.CALL_FIRST
    ) => {
      commitState((prev) => ({
        ...prev,
        cart: mergeItemsIntoCart(prev.cart, [{ productId, quantity, substitution }]),
      }));
    },
    [commitState]
  );

  const addBundleToCart = useCallback(
    (bundleId: string): { addedCount: number; skippedCount: number } => {
      let addedCount = 0;
      let skippedCount = 0;
      commitState((prev) => {
        const bundle = prev.bundles.find((b) => b.id === bundleId);
        if (!bundle) return prev;
        const availableItems = bundle.items.filter((bi) =>
          prev.products.some((p) => p.id === bi.productId && p.inStock)
        );
        addedCount = availableItems.length;
        skippedCount = bundle.items.length - availableItems.length;
        if (availableItems.length === 0) return prev;
        return {
          ...prev,
          cart: mergeItemsIntoCart(prev.cart, availableItems),
        };
      });
      return { addedCount, skippedCount };
    },
    [commitState]
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      commitState((prev) => {
        if (quantity <= 0) {
          return {
            ...prev,
            cart: prev.cart.filter((item) => item.productId !== productId),
          };
        }
        return {
          ...prev,
          cart: prev.cart.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        };
      });
    },
    [commitState]
  );

  const updateCartSubstitution = useCallback(
    (productId: string, substitution: SubstitutionPreference) => {
      commitState((prev) => ({
        ...prev,
        cart: prev.cart.map((item) =>
          item.productId === productId ? { ...item, substitution } : item
        ),
      }));
    },
    [commitState]
  );

  const clearCart = useCallback(() => {
    commitState((prev) => ({ ...prev, cart: [] }));
  }, [commitState]);

  const removeOutOfStockFromCart = useCallback(() => {
    commitState((prev) => {
      const productMap = new Map(prev.products.map((p) => [p.id, p]));
      return {
        ...prev,
        cart: prev.cart.filter((item) => {
          const p = productMap.get(item.productId);
          return Boolean(p && p.inStock);
        }),
      };
    });
  }, [commitState]);

  const placeOrder = useCallback(
    (payload: PlaceOrderPayload): Order | null => {
      let createdOrder: Order | null = null;

      commitState((prev) => {
        if (prev.cart.length === 0) return prev;
        const productMap = new Map(prev.products.map((p) => [p.id, p]));
        const items: OrderItemSnapshot[] = [];

        for (const item of prev.cart) {
          const product = productMap.get(item.productId);
          if (!product || !product.inStock) continue;
          items.push({
            productId: product.id,
            name: product.name,
            unitLabel: product.unitLabel,
            priceMad: product.priceMad,
            quantity: item.quantity,
            substitution: item.substitution,
          });
        }

        if (items.length === 0) return prev;

        const breakdown = calculateCartSummary(prev.cart, prev.products, {
          fulfillment: payload.fulfillment,
          redeemPoints: payload.redeemPoints,
          availablePoints: prev.loyaltyPoints,
          storeInfo: STORE_INFO,
        });

        const spentPoints = getPointsToSpend(breakdown.pointsDiscountMad);
        const rewardUpdate = applyOrderLoyaltyReward(
          prev.loyaltyPoints,
          prev.loyaltyStamps,
          prev.completedRewardsCount,
          spentPoints,
          breakdown.pointsEarned
        );

        const orderNumber = 1001 + prev.orders.length;
        createdOrder = {
          id: `RS-${orderNumber}`,
          createdAt: new Date().toISOString(),
          status: OrderStatus.RECEIVED,
          fulfillment: payload.fulfillment,
          customerName: payload.customerName.trim(),
          phone: payload.phone.trim(),
          neighborhood:
            payload.fulfillment === FulfillmentType.DELIVERY
              ? payload.neighborhood.trim()
              : STORE_INFO.neighborhoodAr,
          address:
            payload.fulfillment === FulfillmentType.DELIVERY
              ? payload.address.trim()
              : `استلام مباشر من محل رشيد (${STORE_INFO.addressAr})`,
          notes: payload.notes.trim(),
          items,
          breakdown,
        };

        return {
          ...prev,
          cart: [],
          orders: [createdOrder, ...prev.orders],
          loyaltyPoints: rewardUpdate.nextPoints,
          loyaltyStamps: rewardUpdate.nextStamps,
          completedRewardsCount: rewardUpdate.nextCompletedRewards,
          defaultCustomerName: payload.customerName.trim(),
          defaultPhone: payload.phone.trim(),
          defaultNeighborhood:
            payload.fulfillment === FulfillmentType.DELIVERY
              ? payload.neighborhood.trim()
              : prev.defaultNeighborhood,
          defaultAddress:
            payload.fulfillment === FulfillmentType.DELIVERY
              ? payload.address.trim()
              : prev.defaultAddress,
        };
      });

      return createdOrder;
    },
    [commitState]
  );

  const reorderFromOrder = useCallback(
    (orderId: string): { addedCount: number; skippedCount: number } => {
      let addedCount = 0;
      let skippedCount = 0;

      commitState((prev) => {
        const order = prev.orders.find((o) => o.id === orderId);
        if (!order) return prev;
        const result = buildReorderItems(order.items, prev.products);
        addedCount = result.itemsToAdd.length;
        skippedCount = result.skippedCount;
        return {
          ...prev,
          cart: mergeItemsIntoCart(prev.cart, result.itemsToAdd),
        };
      });

      return { addedCount, skippedCount };
    },
    [commitState]
  );

  const toggleFavorite = useCallback(
    (productId: string) => {
      commitState((prev) => {
        const exists = prev.favorites.includes(productId);
        return {
          ...prev,
          favorites: exists
            ? prev.favorites.filter((id) => id !== productId)
            : [productId, ...prev.favorites],
        };
      });
    },
    [commitState]
  );

  const addToRecurringList = useCallback(
    (productId: string, quantity = 1) => {
      commitState((prev) => {
        const exists = prev.recurringList.some((r) => r.productId === productId);
        const nextList = exists
          ? prev.recurringList.map((r) =>
              r.productId === productId ? { ...r, quantity: r.quantity + quantity } : r
            )
          : [{ productId, quantity }, ...prev.recurringList];

        const bonusEligible =
          nextList.length >= 3 && !prev.awardedActionKeys.includes('recurring_list_ready');

        return {
          ...prev,
          recurringList: nextList,
          loyaltyPoints: bonusEligible ? prev.loyaltyPoints + 5 : prev.loyaltyPoints,
          awardedActionKeys: bonusEligible
            ? [...prev.awardedActionKeys, 'recurring_list_ready']
            : prev.awardedActionKeys,
        };
      });
    },
    [commitState]
  );

  const updateRecurringQuantity = useCallback(
    (productId: string, quantity: number) => {
      commitState((prev) => {
        if (quantity <= 0) {
          return {
            ...prev,
            recurringList: prev.recurringList.filter((r) => r.productId !== productId),
          };
        }
        return {
          ...prev,
          recurringList: prev.recurringList.map((r) =>
            r.productId === productId ? { ...r, quantity } : r
          ),
        };
      });
    },
    [commitState]
  );

  const addRecurringListToCart = useCallback((): {
    addedCount: number;
    skippedCount: number;
  } => {
    let addedCount = 0;
    let skippedCount = 0;
    commitState((prev) => {
      const available = prev.recurringList.filter((item) =>
        prev.products.some((p) => p.id === item.productId && p.inStock)
      );
      addedCount = available.length;
      skippedCount = prev.recurringList.length - available.length;
      if (available.length === 0) return prev;
      return {
        ...prev,
        cart: mergeItemsIntoCart(prev.cart, available),
      };
    });
    return { addedCount, skippedCount };
  }, [commitState]);

  const submitSupportTicket = useCallback(
    (payload: {
      type: SupportTicketType;
      orderId?: string;
      subject: string;
      message: string;
    }) => {
      commitState((prev) => {
        const nextTicket: SupportTicket = {
          id: `TK-${101 + prev.tickets.length}`,
          createdAt: new Date().toISOString(),
          type: payload.type,
          orderId: payload.orderId || undefined,
          subject: payload.subject.trim(),
          message: payload.message.trim(),
          status: SupportTicketStatus.OPEN,
        };
        return {
          ...prev,
          tickets: [nextTicket, ...prev.tickets],
        };
      });
    },
    [commitState]
  );

  const signInWithIdentifier = useCallback(
    (identifier: string): boolean => {
      let matched = false;
      commitState((prev) => {
        const found = findAccountByIdentifier(prev.accounts, identifier);
        if (!found) return prev;
        matched = true;
        const defaultAddr =
          found.savedAddresses.find((a) => a.isDefault) ?? found.savedAddresses[0];
        return {
          ...prev,
          authStatus: AuthStatus.AUTHENTICATED,
          activeAccountId: found.id,
          defaultCustomerName: found.name,
          defaultPhone: found.phone,
          defaultNeighborhood: defaultAddr?.neighborhood ?? found.neighborhood,
          defaultAddress: defaultAddr?.streetAddress ?? found.address,
        };
      });
      return matched;
    },
    [commitState]
  );

  const switchAccountById = useCallback(
    (accountId: string) => {
      commitState((prev) => {
        const found = prev.accounts.find((a) => a.id === accountId);
        if (!found) return prev;
        const defaultAddr =
          found.savedAddresses.find((a) => a.isDefault) ?? found.savedAddresses[0];
        return {
          ...prev,
          authStatus: AuthStatus.AUTHENTICATED,
          activeAccountId: found.id,
          defaultCustomerName: found.name,
          defaultPhone: found.phone,
          defaultNeighborhood: defaultAddr?.neighborhood ?? found.neighborhood,
          defaultAddress: defaultAddr?.streetAddress ?? found.address,
        };
      });
    },
    [commitState]
  );

  const signUpAccount = useCallback(
    (payload: {
      name: string;
      phone: string;
      email: string;
      neighborhood: string;
      address: string;
    }): UserAccount => {
      const newAccount: UserAccount = {
        id: `acc-${Date.now()}`,
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        email: payload.email.trim(),
        neighborhood: payload.neighborhood.trim(),
        address: payload.address.trim(),
        savedAddresses: [
          {
            id: `addr-${Date.now()}`,
            label: 'المنزل',
            neighborhood: payload.neighborhood.trim(),
            streetAddress: payload.address.trim(),
            isDefault: true,
          },
        ],
      };

      commitState((prev) => {
        const grantSignupBonus = !prev.awardedActionKeys.includes('signup_bonus');
        return {
          ...prev,
          accounts: [newAccount, ...prev.accounts],
          authStatus: AuthStatus.AUTHENTICATED,
          activeAccountId: newAccount.id,
          loyaltyPoints: grantSignupBonus ? prev.loyaltyPoints + 5 : prev.loyaltyPoints,
          awardedActionKeys: grantSignupBonus
            ? [...prev.awardedActionKeys, 'signup_bonus']
            : prev.awardedActionKeys,
          defaultCustomerName: newAccount.name,
          defaultPhone: newAccount.phone,
          defaultNeighborhood: newAccount.neighborhood,
          defaultAddress: newAccount.address,
        };
      });

      return newAccount;
    },
    [commitState]
  );

  const continueAsGuest = useCallback(() => {
    commitState((prev) => ({
      ...prev,
      authStatus: AuthStatus.GUEST,
      activeAccountId: null,
    }));
  }, [commitState]);

  const updateActiveProfile = useCallback(
    (payload: {
      name: string;
      phone: string;
      email: string;
      neighborhood: string;
      address: string;
    }) => {
      commitState((prev) => {
        if (prev.authStatus !== AuthStatus.AUTHENTICATED || !prev.activeAccountId) {
          return {
            ...prev,
            defaultCustomerName: payload.name.trim(),
            defaultPhone: payload.phone.trim(),
            defaultNeighborhood: payload.neighborhood.trim(),
            defaultAddress: payload.address.trim(),
          };
        }
        return {
          ...prev,
          accounts: prev.accounts.map((acc) =>
            acc.id === prev.activeAccountId
              ? {
                  ...acc,
                  name: payload.name.trim(),
                  phone: payload.phone.trim(),
                  email: payload.email.trim(),
                  neighborhood: payload.neighborhood.trim(),
                  address: payload.address.trim(),
                }
              : acc
          ),
          defaultCustomerName: payload.name.trim(),
          defaultPhone: payload.phone.trim(),
          defaultNeighborhood: payload.neighborhood.trim(),
          defaultAddress: payload.address.trim(),
        };
      });
    },
    [commitState]
  );

  const saveAddress = useCallback(
    (address: SavedAddress) => {
      commitState((prev) => {
        if (prev.authStatus === AuthStatus.AUTHENTICATED && prev.activeAccountId) {
          const nextAccounts = prev.accounts.map((acc) =>
            acc.id === prev.activeAccountId
              ? {
                  ...acc,
                  savedAddresses: upsertSavedAddressList(acc.savedAddresses, address),
                }
              : acc
          );
          return {
            ...prev,
            accounts: nextAccounts,
            defaultNeighborhood: address.isDefault
              ? address.neighborhood
              : prev.defaultNeighborhood,
            defaultAddress: address.isDefault
              ? address.streetAddress
              : prev.defaultAddress,
          };
        }
        return {
          ...prev,
          guestSavedAddresses: upsertSavedAddressList(prev.guestSavedAddresses, address),
          defaultNeighborhood: address.isDefault
            ? address.neighborhood
            : prev.defaultNeighborhood,
          defaultAddress: address.isDefault
            ? address.streetAddress
            : prev.defaultAddress,
        };
      });
    },
    [commitState]
  );

  const deleteSavedAddress = useCallback(
    (addressId: string) => {
      commitState((prev) => {
        if (prev.authStatus === AuthStatus.AUTHENTICATED && prev.activeAccountId) {
          return {
            ...prev,
            accounts: prev.accounts.map((acc) =>
              acc.id === prev.activeAccountId
                ? {
                    ...acc,
                    savedAddresses: removeSavedAddressFromList(
                      acc.savedAddresses,
                      addressId
                    ),
                  }
                : acc
            ),
          };
        }
        return {
          ...prev,
          guestSavedAddresses: removeSavedAddressFromList(
            prev.guestSavedAddresses,
            addressId
          ),
        };
      });
    },
    [commitState]
  );

  const resetStoreState = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage access restrictions
    }
    const fresh = createCleanInitialState();
    stateRef.current = fresh;
    setState(fresh);
  }, []);

  return {
    state,
    activeAccount,
    activeSavedAddresses,
    addToCart,
    addBundleToCart,
    updateCartQuantity,
    updateCartSubstitution,
    clearCart,
    removeOutOfStockFromCart,
    placeOrder,
    reorderFromOrder,
    toggleFavorite,
    addToRecurringList,
    updateRecurringQuantity,
    addRecurringListToCart,
    submitSupportTicket,
    signInWithIdentifier,
    switchAccountById,
    signUpAccount,
    continueAsGuest,
    updateActiveProfile,
    saveAddress,
    deleteSavedAddress,
    resetStoreState,
  };
}
