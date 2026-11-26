export enum ProductCategory {
  GROCERIES = 'groceries',
  DAIRY_BAKERY = 'dairy_bakery',
  BEVERAGES = 'beverages',
  CLEANING = 'cleaning',
  PERSONAL_CARE = 'personal_care',
  HOUSEHOLD = 'household',
  SNACKS = 'snacks',
  SPICES_LEGUMES = 'spices_legumes',
}

export enum SubstitutionPreference {
  CALL_FIRST = 'call_first',
  SIMILAR_PRICE = 'similar_price',
  REMOVE_ITEM = 'remove_item',
}

export enum FulfillmentType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
}

export enum OrderStatus {
  RECEIVED = 'received',
  PREPARING = 'preparing',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  READY_FOR_PICKUP = 'ready_for_pickup',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum SupportTicketType {
  INQUIRY = 'inquiry',
  COMPLAINT = 'complaint',
  DELIVERY_REPORT = 'delivery_report',
  PRODUCT_REQUEST = 'product_request',
}

export enum SupportTicketStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

export enum AuthStatus {
  AUTHENTICATED = 'authenticated',
  GUEST = 'guest',
}

export type AppTab = 'home' | 'catalog' | 'cart' | 'account';

export type SortOption = 'featured' | 'price_asc' | 'price_desc';

export interface SavedAddress {
  id: string;
  label: string;
  neighborhood: string;
  streetAddress: string;
  notes?: string;
  isDefault: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  neighborhood: string;
  address: string;
  savedAddresses: SavedAddress[];
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  priceMad: number;
  originalPriceMad?: number;
  unitLabel: string;
  packInfo: string;
  description: string;
  imageUrl: string;
  inStock: boolean;
  isDailyDeal: boolean;
  isBestSeller: boolean;
  tags: string[];
}

export interface BundleItem {
  productId: string;
  quantity: number;
}

export interface Bundle {
  id: string;
  title: string;
  subtitle: string;
  priceMad: number;
  originalPriceMad: number;
  imageUrl: string;
  items: BundleItem[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  substitution: SubstitutionPreference;
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  unitLabel: string;
  priceMad: number;
  quantity: number;
  substitution: SubstitutionPreference;
}

export interface OrderCostBreakdown {
  subtotalMad: number;
  savingsMad: number;
  deliveryFeeMad: number;
  pointsDiscountMad: number;
  totalMad: number;
  pointsEarned: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  fulfillment: FulfillmentType;
  customerName: string;
  phone: string;
  neighborhood: string;
  address: string;
  notes: string;
  items: OrderItemSnapshot[];
  breakdown: OrderCostBreakdown;
}

export interface RecurringListItem {
  productId: string;
  quantity: number;
}

export interface SupportTicket {
  id: string;
  createdAt: string;
  type: SupportTicketType;
  orderId?: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  ownerReply?: string;
}

export interface StoreInfo {
  nameAr: string;
  creatorAttributionAr: string;
  neighborhoodAr: string;
  landmarkAr: string;
  addressAr: string;
  deliveryZonesAr: string;
  phone: string;
  openHours: string;
  estimatedDeliveryMinutes: number;
  freeDeliveryThresholdMad: number;
  deliveryFeeMad: number;
}

export interface AndroidAppInfo {
  appNameAr: string;
  packageId: string;
  versionName: string;
  apkSizeLabel: string;
  minAndroidVersion: string;
  apkFileName: string;
  creatorAttributionAr: string;
}

export interface PersistedStoreState {
  products: Product[];
  bundles: Bundle[];
  cart: CartItem[];
  orders: Order[];
  favorites: string[];
  recurringList: RecurringListItem[];
  loyaltyPoints: number;
  loyaltyStamps: number;
  completedRewardsCount: number;
  awardedActionKeys: string[];
  tickets: SupportTicket[];
  authStatus: AuthStatus;
  activeAccountId: string | null;
  accounts: UserAccount[];
  guestSavedAddresses: SavedAddress[];
  defaultNeighborhood: string;
  defaultAddress: string;
  defaultCustomerName: string;
  defaultPhone: string;
}
