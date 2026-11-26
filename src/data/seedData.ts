import {
  AndroidAppInfo,
  AuthStatus,
  Bundle,
  Order,
  OrderStatus,
  PersistedStoreState,
  Product,
  ProductCategory,
  StoreInfo,
  SubstitutionPreference,
  SupportTicketType,
  UserAccount,
} from '../types/store';
import { createExpandedCatalog } from './expandedCatalog';

export const STORE_IMAGES = {
  hero: '/src/assets/images/hero_rachid_store_1795720544735.jpg',
  breakfastBundle: '/src/assets/images/bundle_moroccan_breakfast_1795720545203.jpg',
  dairyBakery: '/src/assets/images/cat_dairy_bakery_1795720546881.jpg',
  pantryBeverages: '/src/assets/images/cat_pantry_beverages_1795720547578.jpg',
  cleaningHousehold: '/src/assets/images/cat_cleaning_household_1795720547957.jpg',
  spicesLegumes: '/src/assets/images/cat_spices_legumes_1795721210255.jpg',
  personalCareSnacks: '/src/assets/images/cat_personal_care_snacks_1795721211898.jpg',
};

export const STORE_INFO: StoreInfo = {
  nameAr: 'محل رشيد',
  creatorAttributionAr: 'تم الصنع بواسطة سبيكتروم ستوديو',
  neighborhoodAr: 'العين القليعة',
  landmarkAr: 'بالقرب من جامع القدس',
  addressAr: 'العين القليعة، بالقرب من جامع القدس',
  deliveryZonesAr: 'العين القليعة، محيط جامع القدس، والأحياء المجاورة',
  phone: '0522-48-19-30',
  openHours: 'يومياً من 07:30 صباحاً حتى 23:00 ليلاً',
  estimatedDeliveryMinutes: 25,
  freeDeliveryThresholdMad: 150,
  deliveryFeeMad: 10,
};

export const ANDROID_APP_INFO: AndroidAppInfo = {
  appNameAr: 'محل رشيد — متجر الحي المغربي',
  packageId: 'ma.spectrumstudio.rachidstore',
  versionName: '2.4.0',
  apkSizeLabel: '18.4 MB',
  minAndroidVersion: 'Android 8.0+',
  apkFileName: 'rachid-store-v2.4.0.apk',
  creatorAttributionAr: 'تم الصنع بواسطة سبيكتروم ستوديو',
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.GROCERIES]: 'مواد غذائية',
  [ProductCategory.DAIRY_BAKERY]: 'ألبان ومخبوزات',
  [ProductCategory.BEVERAGES]: 'مشروبات وعصائر',
  [ProductCategory.CLEANING]: 'مواد التنظيف',
  [ProductCategory.PERSONAL_CARE]: 'العناية والنظافة الشخصية',
  [ProductCategory.HOUSEHOLD]: 'مستلزمات المنزل',
  [ProductCategory.SNACKS]: 'حلويات ومقرمشات',
  [ProductCategory.SPICES_LEGUMES]: 'توابل وقطاني',
};

export const SUBSTITUTION_LABELS: Record<SubstitutionPreference, string> = {
  [SubstitutionPreference.CALL_FIRST]: 'اتصل بي أولاً قبل الاستبدال',
  [SubstitutionPreference.SIMILAR_PRICE]: 'اختر أقرب بديل بنفس السعر',
  [SubstitutionPreference.REMOVE_ITEM]: 'إلغاء الصنف فقط عند النفاد',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.RECEIVED]: 'تم استلام الطلب',
  [OrderStatus.PREPARING]: 'قيد التجهيز في المحل',
  [OrderStatus.OUT_FOR_DELIVERY]: 'في الطريق إليك',
  [OrderStatus.READY_FOR_PICKUP]: 'جاهز للاستلام من المحل',
  [OrderStatus.DELIVERED]: 'تم التسليم بنجاح',
  [OrderStatus.CANCELLED]: 'طلب ملغى',
};

export const SUPPORT_TYPE_LABELS: Record<SupportTicketType, string> = {
  [SupportTicketType.INQUIRY]: 'استفسار عام',
  [SupportTicketType.COMPLAINT]: 'شكوى حول منتج أو فاتورة',
  [SupportTicketType.DELIVERY_REPORT]: 'بلاغ عن التوصيل',
  [SupportTicketType.PRODUCT_REQUEST]: 'طلب توفير منتج جديد',
};

export const INITIAL_ACCOUNTS: UserAccount[] = [];

export const INITIAL_PRODUCTS: Product[] = createExpandedCatalog(STORE_IMAGES);

export const INITIAL_BUNDLES: Bundle[] = [
  {
    id: 'b-breakfast',
    title: 'باقة الفطور المغربي المتكاملة',
    subtitle: 'زيت زيتون 1 لتر + عسل 500 غ + حليب طازج + خبز بلدي + مسمن + بيض',
    priceMad: 149,
    originalPriceMad: 166.5,
    imageUrl: STORE_IMAGES.breakfastBundle,
    items: [
      { productId: 'p-olive-oil', quantity: 1 },
      { productId: 'p-honey', quantity: 1 },
      { productId: 'p-fresh-milk', quantity: 1 },
      { productId: 'p-khobz', quantity: 2 },
      { productId: 'p-msemen', quantity: 1 },
      { productId: 'p-eggs', quantity: 1 },
    ],
  },
  {
    id: 'b-tea-time',
    title: 'باقة الشاي والضيافة',
    subtitle: 'شاي أخضر مغربي + تمر مجهول 500 غ + لوز محمص + بسكويت شاي',
    priceMad: 102,
    originalPriceMad: 114,
    imageUrl: STORE_IMAGES.pantryBeverages,
    items: [
      { productId: 'p-atay', quantity: 1 },
      { productId: 'p-dates', quantity: 1 },
      { productId: 'p-almonds-snack', quantity: 1 },
      { productId: 'p-tea-biscuits', quantity: 1 },
    ],
  },
  {
    id: 'b-pantry-spices',
    title: 'باقة القطاني والتوابل الأسبوعية',
    subtitle: 'عدس بلدي + حمص ممتاز + كسكس سوس + كمون بلدي + راس الحانوت',
    priceMad: 92,
    originalPriceMad: 103,
    imageUrl: STORE_IMAGES.spicesLegumes,
    items: [
      { productId: 'p-lentils', quantity: 1 },
      { productId: 'p-chickpeas', quantity: 1 },
      { productId: 'p-couscous', quantity: 1 },
      { productId: 'p-cumin', quantity: 1 },
      { productId: 'p-ras-el-hanout', quantity: 1 },
    ],
  },
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_STATE: PersistedStoreState = {
  products: INITIAL_PRODUCTS,
  bundles: INITIAL_BUNDLES,
  cart: [],
  orders: INITIAL_ORDERS,
  favorites: [],
  recurringList: [],
  loyaltyPoints: 0,
  loyaltyStamps: 0,
  completedRewardsCount: 0,
  awardedActionKeys: [],
  tickets: [],
  authStatus: AuthStatus.GUEST,
  activeAccountId: null,
  accounts: INITIAL_ACCOUNTS,
  guestSavedAddresses: [],
  defaultNeighborhood: 'العين القليعة',
  defaultAddress: '',
  defaultCustomerName: '',
  defaultPhone: '',
};
