import {
  CartItem,
  FulfillmentType,
  OrderCostBreakdown,
  OrderItemSnapshot,
  OrderStatus,
  Product,
  ProductCategory,
  SortOption,
  StoreInfo,
  SubstitutionPreference,
} from '../types/store';

export function roundMad(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatMad(amount: number): string {
  const rounded = roundMad(amount);
  const formatted = Number.isInteger(rounded)
    ? rounded.toString()
    : rounded.toFixed(2).replace(/\.00$/, '');
  return `${formatted} درهم`;
}

export interface CartCalculationOptions {
  fulfillment: FulfillmentType;
  redeemPoints: boolean;
  availablePoints: number;
  storeInfo: Pick<StoreInfo, 'deliveryFeeMad' | 'freeDeliveryThresholdMad'>;
}

export function calculateCartSummary(
  cart: CartItem[],
  products: Product[],
  options: CartCalculationOptions
): OrderCostBreakdown {
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotalMad = 0;
  let savingsMad = 0;

  for (const item of cart) {
    const product = productMap.get(item.productId);
    if (!product || item.quantity <= 0) continue;

    subtotalMad += product.priceMad * item.quantity;
    if (product.originalPriceMad && product.originalPriceMad > product.priceMad) {
      savingsMad += (product.originalPriceMad - product.priceMad) * item.quantity;
    }
  }

  subtotalMad = roundMad(subtotalMad);
  savingsMad = roundMad(savingsMad);

  const isEmpty = subtotalMad === 0;
  const deliveryFeeMad =
    isEmpty ||
    options.fulfillment === FulfillmentType.PICKUP ||
    subtotalMad >= options.storeInfo.freeDeliveryThresholdMad
      ? 0
      : options.storeInfo.deliveryFeeMad;

  // 100 loyalty points = 10 MAD discount (1 point = 0.1 MAD), capped at subtotal
  const maxPointsRedeemableMad = Math.floor(Math.max(0, options.availablePoints) / 10);
  const pointsDiscountMad =
    options.redeemPoints && !isEmpty
      ? roundMad(Math.min(maxPointsRedeemableMad, subtotalMad))
      : 0;

  const totalMad = roundMad(Math.max(0, subtotalMad + deliveryFeeMad - pointsDiscountMad));
  const pointsEarned = Math.floor(totalMad / 10);

  return {
    subtotalMad,
    savingsMad,
    deliveryFeeMad,
    pointsDiscountMad,
    totalMad,
    pointsEarned,
  };
}

export function getPointsToSpend(pointsDiscountMad: number): number {
  return Math.round(pointsDiscountMad * 10);
}

export interface CatalogFilterOptions {
  searchQuery: string;
  category: ProductCategory | 'all';
  inStockOnly: boolean;
  offersOnly: boolean;
  maxPriceMad: number | null;
  sortBy: SortOption;
}

export function normalizeArabicSearch(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

export function filterAndSortProducts(
  products: Product[],
  filters: CatalogFilterOptions
): Product[] {
  const query = normalizeArabicSearch(filters.searchQuery);

  const filtered = products.filter((product) => {
    if (filters.category !== 'all' && product.category !== filters.category) {
      return false;
    }
    if (filters.inStockOnly && !product.inStock) {
      return false;
    }
    if (
      filters.offersOnly &&
      !product.isDailyDeal &&
      !(product.originalPriceMad && product.originalPriceMad > product.priceMad)
    ) {
      return false;
    }
    if (filters.maxPriceMad !== null && product.priceMad > filters.maxPriceMad) {
      return false;
    }
    if (query.length > 0) {
      const haystack = normalizeArabicSearch(
        [product.name, product.description, product.unitLabel, ...product.tags].join(' ')
      );
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered];
  if (filters.sortBy === 'price_asc') {
    sorted.sort((a, b) => a.priceMad - b.priceMad);
  } else if (filters.sortBy === 'price_desc') {
    sorted.sort((a, b) => b.priceMad - a.priceMad);
  } else {
    sorted.sort((a, b) => {
      const scoreA = (a.inStock ? 4 : 0) + (a.isDailyDeal ? 2 : 0) + (a.isBestSeller ? 1 : 0);
      const scoreB = (b.inStock ? 4 : 0) + (b.isDailyDeal ? 2 : 0) + (b.isBestSeller ? 1 : 0);
      return scoreB - scoreA;
    });
  }

  return sorted;
}

export function mergeItemsIntoCart(
  currentCart: CartItem[],
  itemsToAdd: Array<{
    productId: string;
    quantity: number;
    substitution?: SubstitutionPreference;
  }>
): CartItem[] {
  const next = currentCart.map((item) => ({ ...item }));

  for (const incoming of itemsToAdd) {
    if (incoming.quantity <= 0) continue;
    const existing = next.find((item) => item.productId === incoming.productId);
    if (existing) {
      existing.quantity += incoming.quantity;
      if (incoming.substitution) {
        existing.substitution = incoming.substitution;
      }
    } else {
      next.push({
        productId: incoming.productId,
        quantity: incoming.quantity,
        substitution: incoming.substitution ?? SubstitutionPreference.CALL_FIRST,
      });
    }
  }

  return next;
}

export function buildReorderItems(
  orderItems: OrderItemSnapshot[],
  products: Product[]
): { itemsToAdd: CartItem[]; skippedCount: number } {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const itemsToAdd: CartItem[] = [];
  let skippedCount = 0;

  for (const item of orderItems) {
    const liveProduct = productMap.get(item.productId);
    if (!liveProduct || !liveProduct.inStock) {
      skippedCount += 1;
      continue;
    }
    itemsToAdd.push({
      productId: liveProduct.id,
      quantity: item.quantity,
      substitution: item.substitution,
    });
  }

  return { itemsToAdd, skippedCount };
}

export interface CheckoutFormInput {
  customerName: string;
  phone: string;
  neighborhood: string;
  address: string;
  fulfillment: FulfillmentType;
}

export interface CheckoutValidationResult {
  valid: boolean;
  errors: Partial<Record<'customerName' | 'phone' | 'neighborhood' | 'address', string>>;
}

export function validateCheckoutForm(input: CheckoutFormInput): CheckoutValidationResult {
  const errors: CheckoutValidationResult['errors'] = {};

  if (input.customerName.trim().length < 2) {
    errors.customerName = 'يرجى إدخال الاسم الكامل';
  }
  const digits = input.phone.replace(/\D/g, '');
  if (digits.length < 9) {
    errors.phone = 'يرجى إدخال رقم هاتف مغربي صحيح';
  }
  if (input.fulfillment === FulfillmentType.DELIVERY) {
    if (input.neighborhood.trim().length < 2) {
      errors.neighborhood = 'يرجى تحديد الحي';
    }
    if (input.address.trim().length < 5) {
      errors.address = 'يرجى إدخال العنوان التفصيلي للتوصيل';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getOrderTimelineSteps(fulfillment: FulfillmentType): OrderStatus[] {
  return fulfillment === FulfillmentType.DELIVERY
    ? [
        OrderStatus.RECEIVED,
        OrderStatus.PREPARING,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
      ]
    : [
        OrderStatus.RECEIVED,
        OrderStatus.PREPARING,
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.DELIVERED,
      ];
}

export interface SignInInput {
  identifier: string;
}

export function findAccountByIdentifier<
  T extends { phone: string; email: string }
>(accounts: T[], identifier: string): T | undefined {
  const normalized = identifier.trim().toLowerCase();
  const digits = identifier.replace(/\D/g, '');
  if (!normalized) return undefined;
  return accounts.find((acc) => {
    const accEmail = acc.email.trim().toLowerCase();
    const accDigits = acc.phone.replace(/\D/g, '');
    return (
      accEmail === normalized ||
      (digits.length >= 6 && accDigits === digits)
    );
  });
}

export interface SignUpInput {
  name: string;
  phone: string;
  email: string;
  neighborhood: string;
  address: string;
}

export function validateSignUpForm(input: SignUpInput): {
  valid: boolean;
  errors: Partial<Record<keyof SignUpInput, string>>;
} {
  const errors: Partial<Record<keyof SignUpInput, string>> = {};
  if (input.name.trim().length < 2) {
    errors.name = 'يرجى إدخال الاسم الكامل';
  }
  if (input.phone.replace(/\D/g, '').length < 9) {
    errors.phone = 'يرجى إدخال رقم هاتف صحيح';
  }
  if (input.email.trim().length > 0 && !input.email.includes('@')) {
    errors.email = 'يرجى إدخال بريد إلكتروني صحيح';
  }
  if (input.neighborhood.trim().length < 2) {
    errors.neighborhood = 'يرجى إدخال الحي';
  }
  if (input.address.trim().length < 4) {
    errors.address = 'يرجى إدخال عنوان التوصيل';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateProfileForm(input: {
  name: string;
  phone: string;
  email: string;
  neighborhood: string;
  address: string;
}): {
  valid: boolean;
  error: string;
} {
  if (input.name.trim().length < 2) {
    return { valid: false, error: 'يرجى إدخال الاسم الكامل (حرفان على الأقل).' };
  }
  if (input.phone.replace(/\D/g, '').length < 9) {
    return { valid: false, error: 'يرجى إدخال رقم هاتف مغربي صحيح (9 أرقام على الأقل).' };
  }
  const trimmedEmail = input.email.trim();
  if (trimmedEmail.length > 0 && (!trimmedEmail.includes('@') || !trimmedEmail.includes('.'))) {
    return { valid: false, error: 'يرجى إدخال بريد إلكتروني صحيح أو تركه فارغاً.' };
  }
  if (input.neighborhood.trim().length < 2) {
    return { valid: false, error: 'يرجى تحديد الحي الافتراضي.' };
  }
  if (input.address.trim().length > 0 && input.address.trim().length < 4) {
    return { valid: false, error: 'يرجى إدخال عنوان تفصيلي واضح أو تركه فارغاً.' };
  }
  return { valid: true, error: '' };
}

export function getOutOfStockCartProductIds(cart: CartItem[], products: Product[]): string[] {
  const productMap = new Map(products.map((p) => [p.id, p]));
  return cart
    .filter((item) => {
      const product = productMap.get(item.productId);
      return !product || !product.inStock;
    })
    .map((item) => item.productId);
}

export function upsertSavedAddressList<T extends { id: string; isDefault: boolean }>(
  addresses: T[],
  incoming: T
): T[] {
  const exists = addresses.some((a) => a.id === incoming.id);
  const base = exists
    ? addresses.map((a) => (a.id === incoming.id ? incoming : a))
    : [incoming, ...addresses];

  if (incoming.isDefault || base.length === 1) {
    return base.map((a) => ({
      ...a,
      isDefault: a.id === incoming.id,
    }));
  }
  return base;
}

export function removeSavedAddressFromList<T extends { id: string; isDefault: boolean }>(
  addresses: T[],
  addressId: string
): T[] {
  const remaining = addresses.filter((a) => a.id !== addressId);
  if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
    return remaining.map((a, idx) => ({ ...a, isDefault: idx === 0 }));
  }
  return remaining;
}

export interface LoyaltyTierInfo {
  id: 'starter' | 'silver' | 'gold';
  labelAr: string;
  nextTierLabelAr: string | null;
  nextTierPoints: number | null;
  progressPercent: number;
  pointsToNextTier: number;
}

export function getLoyaltyTierInfo(points: number): LoyaltyTierInfo {
  const safePoints = Math.max(0, Math.floor(points));
  if (safePoints >= 300) {
    return {
      id: 'gold',
      labelAr: 'العضوية الذهبية',
      nextTierLabelAr: null,
      nextTierPoints: null,
      progressPercent: 100,
      pointsToNextTier: 0,
    };
  }
  if (safePoints >= 100) {
    return {
      id: 'silver',
      labelAr: 'العضوية الفضية',
      nextTierLabelAr: 'العضوية الذهبية',
      nextTierPoints: 300,
      progressPercent: Math.min(100, Math.round(((safePoints - 100) / 200) * 100)),
      pointsToNextTier: 300 - safePoints,
    };
  }
  return {
    id: 'starter',
    labelAr: 'بطاقة البداية',
    nextTierLabelAr: 'العضوية الفضية',
    nextTierPoints: 100,
    progressPercent: Math.min(100, safePoints),
    pointsToNextTier: 100 - safePoints,
  };
}

export const STAMPS_PER_REWARD_CYCLE = 5;
export const STAMP_CYCLE_BONUS_POINTS = 25;

export function applyOrderLoyaltyReward(
  currentPoints: number,
  currentStamps: number,
  currentCompletedRewards: number,
  pointsSpent: number,
  pointsEarnedFromOrder: number
): {
  nextPoints: number;
  nextStamps: number;
  nextCompletedRewards: number;
  stampBonusAwarded: number;
} {
  const rawStamps = Math.max(0, currentStamps) + 1;
  const completedNewCycle = rawStamps >= STAMPS_PER_REWARD_CYCLE;
  const nextStamps = completedNewCycle ? rawStamps % STAMPS_PER_REWARD_CYCLE : rawStamps;
  const stampBonusAwarded = completedNewCycle ? STAMP_CYCLE_BONUS_POINTS : 0;
  const nextCompletedRewards = currentCompletedRewards + (completedNewCycle ? 1 : 0);

  const nextPoints =
    Math.max(0, currentPoints - Math.max(0, pointsSpent)) +
    Math.max(0, pointsEarnedFromOrder) +
    stampBonusAwarded;

  return {
    nextPoints,
    nextStamps,
    nextCompletedRewards,
    stampBonusAwarded,
  };
}

