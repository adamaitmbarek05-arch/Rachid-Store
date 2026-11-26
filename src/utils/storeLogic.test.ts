import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyOrderLoyaltyReward,
  buildReorderItems,
  calculateCartSummary,
  filterAndSortProducts,
  findAccountByIdentifier,
  formatMad,
  getLoyaltyTierInfo,
  getOrderTimelineSteps,
  getOutOfStockCartProductIds,
  mergeItemsIntoCart,
  normalizeArabicSearch,
  removeSavedAddressFromList,
  upsertSavedAddressList,
  validateCheckoutForm,
  validateProfileForm,
  validateSignUpForm,
} from './storeLogic';
import { INITIAL_BUNDLES, INITIAL_PRODUCTS, INITIAL_STATE, STORE_INFO } from '../data/seedData';
import {
  AuthStatus,
  FulfillmentType,
  OrderStatus,
  ProductCategory,
  SubstitutionPreference,
} from '../types/store';

test('formatMad formats whole and fractional Moroccan Dirhams cleanly', () => {
  assert.equal(formatMad(68), '68 درهم');
  assert.equal(formatMad(8.5), '8.50 درهم');
  assert.equal(formatMad(107.0), '107 درهم');
});

test('calculateCartSummary computes subtotal, savings, delivery fee threshold, and loyalty discount', () => {
  const cart = [
    {
      productId: 'p-olive-oil',
      quantity: 1,
      substitution: SubstitutionPreference.CALL_FIRST,
    },
    {
      productId: 'p-fresh-milk',
      quantity: 2,
      substitution: SubstitutionPreference.SIMILAR_PRICE,
    },
  ];
  // 68 + (8.5 * 2 = 17) = 85 MAD (< 150 free threshold => 10 MAD delivery)
  const belowThreshold = calculateCartSummary(cart, INITIAL_PRODUCTS, {
    fulfillment: FulfillmentType.DELIVERY,
    redeemPoints: false,
    availablePoints: 140,
    storeInfo: STORE_INFO,
  });

  assert.equal(belowThreshold.subtotalMad, 85);
  assert.equal(belowThreshold.savingsMad, 10); // 78 - 68
  assert.equal(belowThreshold.deliveryFeeMad, 10);
  assert.equal(belowThreshold.totalMad, 95);
  assert.equal(belowThreshold.pointsEarned, 9);

  // With pickup & loyalty points redeemed (140 pts => 14 MAD discount)
  const pickupWithPoints = calculateCartSummary(cart, INITIAL_PRODUCTS, {
    fulfillment: FulfillmentType.PICKUP,
    redeemPoints: true,
    availablePoints: 140,
    storeInfo: STORE_INFO,
  });

  assert.equal(pickupWithPoints.deliveryFeeMad, 0);
  assert.equal(pickupWithPoints.pointsDiscountMad, 14);
  assert.equal(pickupWithPoints.totalMad, 71);
});

test('calculateCartSummary waives delivery fee at or above 150 MAD threshold', () => {
  const cart = [
    {
      productId: 'p-olive-oil',
      quantity: 3, // 204 MAD
      substitution: SubstitutionPreference.CALL_FIRST,
    },
  ];
  const summary = calculateCartSummary(cart, INITIAL_PRODUCTS, {
    fulfillment: FulfillmentType.DELIVERY,
    redeemPoints: false,
    availablePoints: 0,
    storeInfo: STORE_INFO,
  });

  assert.equal(summary.subtotalMad, 204);
  assert.equal(summary.deliveryFeeMad, 0);
  assert.equal(summary.totalMad, 204);
});

test('filterAndSortProducts filters by search query, category, stock, offers, and price sort', () => {
  const byCategoryAndStock = filterAndSortProducts(INITIAL_PRODUCTS, {
    searchQuery: '',
    category: ProductCategory.DAIRY_BAKERY,
    inStockOnly: true,
    offersOnly: false,
    maxPriceMad: null,
    sortBy: 'price_asc',
  });

  assert.ok(byCategoryAndStock.length >= 3);
  assert.ok(byCategoryAndStock.every((p) => p.inStock && p.category === ProductCategory.DAIRY_BAKERY));
  assert.ok(byCategoryAndStock[0].priceMad <= byCategoryAndStock[1].priceMad);

  const bySearch = filterAndSortProducts(INITIAL_PRODUCTS, {
    searchQuery: 'زيتون',
    category: 'all',
    inStockOnly: false,
    offersOnly: true,
    maxPriceMad: null,
    sortBy: 'featured',
  });

  assert.equal(bySearch.some((p) => p.id === 'p-olive-oil'), true);
});

test('mergeItemsIntoCart and buildReorderItems handle duplicates and out-of-stock skips', () => {
  const merged = mergeItemsIntoCart(
    [
      {
        productId: 'p-fresh-milk',
        quantity: 1,
        substitution: SubstitutionPreference.CALL_FIRST,
      },
    ],
    [
      {
        productId: 'p-fresh-milk',
        quantity: 2,
        substitution: SubstitutionPreference.SIMILAR_PRICE,
      },
      {
        productId: 'p-khobz',
        quantity: 3,
      },
    ]
  );

  assert.equal(merged.length, 2);
  assert.equal(merged[0].quantity, 3);
  assert.equal(merged[0].substitution, SubstitutionPreference.SIMILAR_PRICE);

  const reorder = buildReorderItems(
    [
      {
        productId: 'p-fresh-milk',
        name: 'حليب',
        unitLabel: '1 لتر',
        priceMad: 8.5,
        quantity: 2,
        substitution: SubstitutionPreference.CALL_FIRST,
      },
      {
        productId: 'p-croissant', // out of stock in seedData
        name: 'كرواسون',
        unitLabel: '4 قطع',
        priceMad: 16,
        quantity: 1,
        substitution: SubstitutionPreference.REMOVE_ITEM,
      },
    ],
    INITIAL_PRODUCTS
  );

  assert.equal(reorder.itemsToAdd.length, 1);
  assert.equal(reorder.skippedCount, 1);
});

test('validateCheckoutForm enforces required delivery fields and allows pickup without address', () => {
  const invalidDelivery = validateCheckoutForm({
    customerName: 'س',
    phone: '123',
    neighborhood: '',
    address: '',
    fulfillment: FulfillmentType.DELIVERY,
  });
  assert.equal(invalidDelivery.valid, false);
  assert.ok(invalidDelivery.errors.customerName);
  assert.ok(invalidDelivery.errors.phone);
  assert.ok(invalidDelivery.errors.neighborhood);
  assert.ok(invalidDelivery.errors.address);

  const validPickup = validateCheckoutForm({
    customerName: 'سلمى بناني',
    phone: '0661324418',
    neighborhood: '',
    address: '',
    fulfillment: FulfillmentType.PICKUP,
  });
  assert.equal(validPickup.valid, true);
});

test('getOrderTimelineSteps returns ordered steps for delivery and pickup fulfillment', () => {
  assert.deepEqual(getOrderTimelineSteps(FulfillmentType.DELIVERY), [
    OrderStatus.RECEIVED,
    OrderStatus.PREPARING,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
  ]);
  assert.deepEqual(getOrderTimelineSteps(FulfillmentType.PICKUP), [
    OrderStatus.RECEIVED,
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.DELIVERED,
  ]);
});

test('expanded catalog contains 240 unique products across all 8 categories with valid prices and bundles', () => {
  assert.equal(INITIAL_PRODUCTS.length, 240);
  const uniqueIds = new Set(INITIAL_PRODUCTS.map((p) => p.id));
  assert.equal(uniqueIds.size, 240);

  for (const cat of Object.values(ProductCategory)) {
    const count = INITIAL_PRODUCTS.filter((p) => p.category === cat).length;
    assert.equal(count, 30, `Expected 30 products in category ${cat}`);
  }

  for (const product of INITIAL_PRODUCTS) {
    assert.ok(product.priceMad > 0, `Expected positive MAD price for ${product.id}`);
    assert.ok(product.name.trim().length >= 3, `Expected Arabic title for ${product.id}`);
  }

  for (const bundle of INITIAL_BUNDLES) {
    for (const item of bundle.items) {
      assert.ok(
        uniqueIds.has(item.productId),
        `Bundle ${bundle.id} references valid product ${item.productId}`
      );
    }
  }
});

test('findAccountByIdentifier matches by email or normalized phone digits', () => {
  const sampleAccounts = [
    { id: 'acc-1', phone: '0661-32-44-18', email: 'salma@example.ma' },
    { id: 'acc-2', phone: '0663-19-82-05', email: 'youssef.alami@example.ma' },
  ];
  const byPhone = findAccountByIdentifier(sampleAccounts, '0661324418');
  assert.equal(byPhone?.id, 'acc-1');

  const byEmail = findAccountByIdentifier(sampleAccounts, 'YOUSSEF.ALAMI@EXAMPLE.MA');
  assert.equal(byEmail?.id, 'acc-2');

  const missing = findAccountByIdentifier(sampleAccounts, 'unknown@test.ma');
  assert.equal(missing, undefined);
});

test('validateSignUpForm validates name, phone, email, neighborhood, and address', () => {
  const invalid = validateSignUpForm({
    name: 'أ',
    phone: '123',
    email: 'invalid-email',
    neighborhood: '',
    address: '',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.phone);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.neighborhood);
  assert.ok(invalid.errors.address);

  const valid = validateSignUpForm({
    name: 'أمينة التازي',
    phone: '0661001122',
    email: 'amina@example.ma',
    neighborhood: 'العين القليعة',
    address: 'بالقرب من جامع القدس رقم 8',
  });
  assert.equal(valid.valid, true);
});

test('upsertSavedAddressList and removeSavedAddressFromList maintain single default address', () => {
  const initial = [
    { id: 'a1', isDefault: true, label: 'المنزل' },
    { id: 'a2', isDefault: false, label: 'العمل' },
  ];
  const updated = upsertSavedAddressList(initial, {
    id: 'a3',
    isDefault: true,
    label: 'منزل العائلة',
  });
  assert.equal(updated.length, 3);
  assert.equal(updated.filter((a) => a.isDefault).length, 1);
  assert.equal(updated.find((a) => a.id === 'a3')?.isDefault, true);

  const afterRemove = removeSavedAddressFromList(updated, 'a3');
  assert.equal(afterRemove.length, 2);
  assert.equal(afterRemove.some((a) => a.isDefault), true);
});

test('INITIAL_STATE starts clean with zero progress and Al-Qulai\'ah location', () => {
  assert.equal(INITIAL_STATE.cart.length, 0);
  assert.equal(INITIAL_STATE.orders.length, 0);
  assert.equal(INITIAL_STATE.favorites.length, 0);
  assert.equal(INITIAL_STATE.recurringList.length, 0);
  assert.equal(INITIAL_STATE.loyaltyPoints, 0);
  assert.equal(INITIAL_STATE.loyaltyStamps, 0);
  assert.equal(INITIAL_STATE.completedRewardsCount, 0);
  assert.equal(INITIAL_STATE.authStatus, AuthStatus.GUEST);
  assert.ok(STORE_INFO.addressAr.includes('العين القليعة'));
  assert.ok(STORE_INFO.addressAr.includes('جامع القدس'));
});

test('getLoyaltyTierInfo and applyOrderLoyaltyReward calculate tiers and 5-stamp bonus cycle', () => {
  assert.equal(getLoyaltyTierInfo(0).id, 'starter');
  assert.equal(getLoyaltyTierInfo(100).id, 'silver');
  assert.equal(getLoyaltyTierInfo(300).id, 'gold');

  const fourthOrder = applyOrderLoyaltyReward(40, 3, 0, 0, 12);
  assert.equal(fourthOrder.nextStamps, 4);
  assert.equal(fourthOrder.stampBonusAwarded, 0);
  assert.equal(fourthOrder.nextPoints, 52);

  const fifthOrder = applyOrderLoyaltyReward(52, 4, 0, 10, 15);
  assert.equal(fifthOrder.nextStamps, 0);
  assert.equal(fifthOrder.stampBonusAwarded, 25);
  assert.equal(fifthOrder.nextCompletedRewards, 1);
  assert.equal(fifthOrder.nextPoints, 52 - 10 + 15 + 25);
});

test('normalizeArabicSearch normalizes hamza, ta marbuta, alif maqsura, and diacritics in search', () => {
  assert.equal(normalizeArabicSearch(' أَتَايْ مَغْرِبِي '), 'اتاي مغربي');
  assert.equal(normalizeArabicSearch('قهوة محمصة'), normalizeArabicSearch('قهوه محمصه'));
  assert.equal(normalizeArabicSearch('حلوى'), normalizeArabicSearch('حلوي'));

  const teaMatches = filterAndSortProducts(INITIAL_PRODUCTS, {
    searchQuery: 'اتاي',
    category: 'all',
    inStockOnly: false,
    offersOnly: false,
    maxPriceMad: null,
    sortBy: 'featured',
  });
  assert.ok(teaMatches.some((p) => p.name.includes('أتاي') || p.tags.some((t) => t.includes('أتاي'))));
});

test('validateProfileForm enforces name, phone, email, neighborhood, and optional detailed address', () => {
  const invalidName = validateProfileForm({
    name: 'أ',
    phone: '0661324418',
    email: '',
    neighborhood: 'العين القليعة',
    address: '',
  });
  assert.equal(invalidName.valid, false);
  assert.ok(invalidName.error.length > 0);

  const invalidEmail = validateProfileForm({
    name: 'سلمى بناني',
    phone: '0661324418',
    email: 'not-an-email',
    neighborhood: 'العين القليعة',
    address: '',
  });
  assert.equal(invalidEmail.valid, false);

  const shortAddress = validateProfileForm({
    name: 'سلمى بناني',
    phone: '0661324418',
    email: 'salma@example.ma',
    neighborhood: 'العين القليعة',
    address: 'رقم',
  });
  assert.equal(shortAddress.valid, false);

  const valid = validateProfileForm({
    name: 'سلمى بناني',
    phone: '0661324418',
    email: 'salma@example.ma',
    neighborhood: 'العين القليعة',
    address: 'قرب جامع القدس رقم 12',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.error, '');
});

test('getOutOfStockCartProductIds identifies out-of-stock or missing products in cart', () => {
  const cart = [
    {
      productId: 'p-fresh-milk',
      quantity: 1,
      substitution: SubstitutionPreference.CALL_FIRST,
    },
    {
      productId: 'p-croissant',
      quantity: 2,
      substitution: SubstitutionPreference.CALL_FIRST,
    },
    {
      productId: 'p-nonexistent',
      quantity: 1,
      substitution: SubstitutionPreference.REMOVE_ITEM,
    },
  ];
  const outIds = getOutOfStockCartProductIds(cart, INITIAL_PRODUCTS);
  assert.deepEqual(outIds, ['p-croissant', 'p-nonexistent']);
});

