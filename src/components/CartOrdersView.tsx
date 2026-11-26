import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShoppingBasket,
  Store,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import {
  ORDER_STATUS_LABELS,
  STORE_INFO,
  SUBSTITUTION_LABELS,
} from '../data/seedData';
import {
  CartItem,
  FulfillmentType,
  Order,
  OrderStatus,
  Product,
  SavedAddress,
  SubstitutionPreference,
} from '../types/store';
import {
  calculateCartSummary,
  formatMad,
  getOrderTimelineSteps,
  getOutOfStockCartProductIds,
  validateCheckoutForm,
} from '../utils/storeLogic';
import { ScrollReveal } from './ScrollMotion';
import { StoreImage } from './StoreImage';

interface CartOrdersViewProps {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  loyaltyPoints: number;
  savedAddresses: SavedAddress[];
  defaultCustomerName: string;
  defaultPhone: string;
  defaultNeighborhood: string;
  defaultAddress: string;
  initialSubTab?: 'cart' | 'orders';
  reorderNotice?: { addedCount: number; skippedCount: number } | null;
  onDismissReorderNotice?: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdateSubstitution: (productId: string, sub: SubstitutionPreference) => void;
  onClearCart: () => void;
  onRemoveOutOfStock: () => void;
  onPlaceOrder: (payload: {
    fulfillment: FulfillmentType;
    customerName: string;
    phone: string;
    neighborhood: string;
    address: string;
    notes: string;
    redeemPoints: boolean;
  }) => Order | null;
  onReorder: (orderId: string) => { addedCount: number; skippedCount: number };
  onBrowseCatalog: () => void;
}

export function CartOrdersView({
  products,
  cart,
  orders,
  loyaltyPoints,
  savedAddresses,
  defaultCustomerName,
  defaultPhone,
  defaultNeighborhood,
  defaultAddress,
  initialSubTab,
  reorderNotice,
  onDismissReorderNotice,
  onUpdateQuantity,
  onUpdateSubstitution,
  onClearCart,
  onRemoveOutOfStock,
  onPlaceOrder,
  onReorder,
  onBrowseCatalog,
}: CartOrdersViewProps) {
  const [subTab, setSubTab] = useState<'cart' | 'orders'>(
    initialSubTab ?? (cart.length > 0 || orders.length === 0 ? 'cart' : 'orders')
  );
  const [fulfillment, setFulfillment] = useState<FulfillmentType>(FulfillmentType.DELIVERY);
  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [phone, setPhone] = useState(defaultPhone);
  const [neighborhood, setNeighborhood] = useState(defaultNeighborhood);
  const [address, setAddress] = useState(defaultAddress);
  const [notes, setNotes] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [checkoutBannerError, setCheckoutBannerError] = useState('');
  const [justConfirmedOrderId, setJustConfirmedOrderId] = useState<string | null>(null);
  const [localReorderNotice, setLocalReorderNotice] = useState<{
    addedCount: number;
    skippedCount: number;
  } | null>(null);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    setCustomerName(defaultCustomerName);
    setPhone(defaultPhone);
    setNeighborhood(defaultNeighborhood);
    setAddress(defaultAddress);
    setFormErrors({});
  }, [defaultCustomerName, defaultPhone, defaultNeighborhood, defaultAddress]);

  useEffect(() => {
    if (orders.length === 0) {
      setJustConfirmedOrderId(null);
    }
  }, [orders.length]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const outOfStockIds = getOutOfStockCartProductIds(cart, products);
  const hasOutOfStockItems = outOfStockIds.length > 0;
  const activeReorderNotice = localReorderNotice ?? reorderNotice ?? null;

  useEffect(() => {
    if (!hasOutOfStockItems && checkoutBannerError) {
      setCheckoutBannerError('');
    }
  }, [hasOutOfStockItems, checkoutBannerError]);

  const breakdown = calculateCartSummary(cart, products, {
    fulfillment,
    redeemPoints,
    availablePoints: loyaltyPoints,
    storeInfo: STORE_INFO,
  });

  const amountRemainingForFreeDelivery = Math.max(
    0,
    STORE_INFO.freeDeliveryThresholdMad - breakdown.subtotalMad
  );

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasOutOfStockItems) {
      setCheckoutBannerError('تحتوي سلتك على أصناف نفدت من المخزون. يرجى حذفها أولاً لإتمام الطلب.');
      return;
    }
    const validation = validateCheckoutForm({
      customerName,
      phone,
      neighborhood,
      address,
      fulfillment,
    });
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    setFormErrors({});
    setCheckoutBannerError('');
    const order = onPlaceOrder({
      fulfillment,
      customerName,
      phone,
      neighborhood,
      address,
      notes,
      redeemPoints,
    });
    if (order) {
      setJustConfirmedOrderId(order.id);
      setLocalReorderNotice(null);
      onDismissReorderNotice?.();
      setNotes('');
      setRedeemPoints(false);
      setSubTab('orders');
    }
  };

  const handleTriggerReorder = (orderId: string) => {
    const result = onReorder(orderId);
    setLocalReorderNotice(result);
    if (result.addedCount > 0) {
      setSubTab('cart');
    }
  };

  const activeOrder = orders.find(
    (o) => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-950">السلة والطلبات</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            مراجعة سلة المشتريات بالدرهم المغربي وتتبع طلباتك الحالية والسابقة
          </p>
        </div>

        <div
          role="tablist"
          aria-label="التبديل بين السلة والطلبات"
          className="inline-flex items-center p-1 bg-zinc-200/70 rounded-xl self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'cart'}
            onClick={() => setSubTab('cart')}
            className={`min-h-[40px] px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              subTab === 'cart'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            السلة الحالية ({cart.reduce((sum, i) => sum + i.quantity, 0)})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'orders'}
            onClick={() => setSubTab('orders')}
            className={`min-h-[40px] px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              subTab === 'orders'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            التتبع والسجل ({orders.length})
          </button>
        </div>
      </div>

      {activeReorderNotice && (
        <div
          role="status"
          className={`rounded-2xl p-4 border flex items-center justify-between gap-3 text-xs ${
            activeReorderNotice.addedCount > 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {activeReorderNotice.addedCount > 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
            )}
            <span className="font-medium tabular-nums">
              {activeReorderNotice.addedCount === 0
                ? 'تعذر إعادة إضافة الطلب لأن جميع أصنافه نفدت حالياً من المخزون.'
                : activeReorderNotice.skippedCount > 0
                  ? `تمت إضافة ${activeReorderNotice.addedCount} أصناف للسلة، وتخطي ${activeReorderNotice.skippedCount} أصناف غير متوفرة حالياً.`
                  : `تمت إعادة إضافة ${activeReorderNotice.addedCount} أصناف إلى السلة بنجاح.`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLocalReorderNotice(null);
              onDismissReorderNotice?.();
            }}
            aria-label="إغلاق التنبيه"
            className="w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {subTab === 'cart' ? (
        cart.length === 0 ? (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
              <ShoppingBasket className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-lg font-bold text-zinc-950">سلة المشتريات فارغة</h2>
              <p className="text-sm text-zinc-500">
                أضف احتياجاتك اليومية من البقالة أو اختر إحدى الباقات الجاهزة.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onBrowseCatalog}
                className="min-h-[44px] px-6 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl cursor-pointer"
              >
                تصفح الكتالوج
              </button>
              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleTriggerReorder(orders[0].id)}
                  className="min-h-[44px] px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-sm font-medium rounded-xl cursor-pointer"
                >
                  إعادة آخر طلب (<span dir="ltr">{orders[0].id}</span>)
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-7 space-y-4">
              {hasOutOfStockItems && (
                <div
                  role="status"
                  className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-900"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />
                    <span className="font-semibold">
                      بعض المنتجات في سلتك لم تعد متوفرة بالمخزون ({outOfStockIds.length}).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveOutOfStock}
                    className="min-h-[36px] px-3 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-xl cursor-pointer"
                  >
                    حذف الأصناف غير المتوفرة
                  </button>
                </div>
              )}

              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 md:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h2 className="font-display text-base font-bold text-zinc-950">
                    المنتجات المختارة ({cart.length})
                  </h2>
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-xs font-medium text-rose-700 hover:underline cursor-pointer"
                  >
                    إفراغ السلة
                  </button>
                </div>

                <ul className="divide-y divide-zinc-100">
                  {cart.map((item) => {
                    const product = productMap.get(item.productId);
                    if (!product) return null;

                    return (
                      <li key={item.productId} className="py-4 first:pt-0 last:pb-0 space-y-3">
                        <div className="flex items-start gap-3.5">
                          <div className="w-20 h-16 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                            <StoreImage
                              src={product.imageUrl}
                              alt={product.name}
                              fallbackLabel={product.name}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-sm font-semibold text-zinc-950 line-clamp-1">
                                  {product.name}
                                </h3>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  {product.unitLabel} ·{' '}
                                  <span className="tabular-nums">
                                    {formatMad(product.priceMad)}
                                  </span>
                                  {!product.inStock && (
                                    <span className="text-rose-700 font-semibold ms-2">
                                      · نفد من المخزون
                                    </span>
                                  )}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.productId, 0)}
                                aria-label={`حذف ${product.name} من السلة`}
                                className="w-9 h-9 rounded-lg text-zinc-400 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center shrink-0 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateQuantity(item.productId, item.quantity + 1)
                                  }
                                  aria-label={`زيادة كمية ${product.name}`}
                                  className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-800 hover:bg-white cursor-pointer"
                                >
                                  <Plus className="w-4 h-4" aria-hidden="true" />
                                </button>
                                <span className="min-w-[26px] text-center text-sm font-bold tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateQuantity(item.productId, item.quantity - 1)
                                  }
                                  aria-label={`إنقاص كمية ${product.name}`}
                                  className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-800 hover:bg-white cursor-pointer"
                                >
                                  <Minus className="w-4 h-4" aria-hidden="true" />
                                </button>
                              </div>

                              <span className="font-bold text-sm text-emerald-950 tabular-nums">
                                {formatMad(product.priceMad * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Inline Substitution Preference */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-zinc-50 rounded-xl px-3 py-2">
                          <label
                            htmlFor={`sub-${item.productId}`}
                            className="text-xs text-zinc-600 shrink-0"
                          >
                            عند نفاد الصنف:
                          </label>
                          <select
                            id={`sub-${item.productId}`}
                            value={item.substitution}
                            onChange={(e) =>
                              onUpdateSubstitution(
                                item.productId,
                                e.target.value as SubstitutionPreference
                              )
                            }
                            className="flex-1 bg-transparent text-xs font-medium text-zinc-900 outline-none cursor-pointer"
                          >
                            {Object.values(SubstitutionPreference).map((pref) => (
                              <option key={pref} value={pref}>
                                {SUBSTITUTION_LABELS[pref]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Checkout & MAD Cost Breakdown */}
            <form
              onSubmit={handleCheckoutSubmit}
              noValidate
              className="lg:col-span-5 lg:sticky lg:top-24 bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-5"
            >
              <h2 className="font-display text-lg font-bold text-zinc-950">
                تفاصيل الاستلام والتوصيل
              </h2>

              {/* Delivery / Pickup Toggle */}
              <div
                role="group"
                aria-label="طريقة الاستلام"
                className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl"
              >
                <button
                  type="button"
                  aria-pressed={fulfillment === FulfillmentType.DELIVERY}
                  onClick={() => setFulfillment(FulfillmentType.DELIVERY)}
                  className={`min-h-[44px] px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    fulfillment === FulfillmentType.DELIVERY
                      ? 'bg-white text-emerald-950 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Truck className="w-4 h-4" aria-hidden="true" />
                  <span>توصيل للحي</span>
                </button>
                <button
                  type="button"
                  aria-pressed={fulfillment === FulfillmentType.PICKUP}
                  onClick={() => setFulfillment(FulfillmentType.PICKUP)}
                  className={`min-h-[44px] px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    fulfillment === FulfillmentType.PICKUP
                      ? 'bg-white text-emerald-950 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Store className="w-4 h-4" aria-hidden="true" />
                  <span>استلام من المحل</span>
                </button>
              </div>

              {fulfillment === FulfillmentType.DELIVERY && amountRemainingForFreeDelivery > 0 && (
                <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 tabular-nums">
                  أضف منتجات بقيمة {formatMad(amountRemainingForFreeDelivery)} للحصول على توصيل
                  مجاني.
                </p>
              )}

              <div className="space-y-3">
                <div>
                  <label htmlFor="checkout-name" className="block text-xs font-medium text-zinc-700 mb-1">
                    الاسم الكامل
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none"
                  />
                  {formErrors.customerName && (
                    <p className="text-xs text-rose-700 mt-1">{formErrors.customerName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="checkout-phone" className="block text-xs font-medium text-zinc-700 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm text-end tabular-nums outline-none"
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-rose-700 mt-1">{formErrors.phone}</p>
                  )}
                </div>

                {fulfillment === FulfillmentType.DELIVERY ? (
                  <>
                    {savedAddresses.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="block text-xs font-medium text-zinc-700">
                          العناوين المحفوظة
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {savedAddresses.map((saved) => {
                            const isSelected =
                              neighborhood === saved.neighborhood &&
                              address === saved.streetAddress;
                            return (
                              <button
                                key={saved.id}
                                type="button"
                                onClick={() => {
                                  setNeighborhood(saved.neighborhood);
                                  setAddress(saved.streetAddress);
                                  if (saved.notes) setNotes(saved.notes);
                                }}
                                className={`min-h-[36px] px-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-semibold'
                                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-300'
                                }`}
                              >
                                {saved.label} · {saved.neighborhood}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="checkout-neighborhood"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        الحي
                      </label>
                      <input
                        id="checkout-neighborhood"
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none"
                      />
                      {formErrors.neighborhood && (
                        <p className="text-xs text-rose-700 mt-1">{formErrors.neighborhood}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-address"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        العنوان التفصيلي
                      </label>
                      <input
                        id="checkout-address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="الشارع، رقم العمارة، الشقة..."
                        className="w-full min-h-[44px] px-3.5 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none"
                      />
                      {formErrors.address && (
                        <p className="text-xs text-rose-700 mt-1">{formErrors.address}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 text-xs text-zinc-700 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-zinc-900">{STORE_INFO.nameAr}</p>
                      <p className="mt-0.5">{STORE_INFO.addressAr}</p>
                      <p className="text-zinc-500 mt-0.5">جاهز للاستلام خلال 15 دقيقة</p>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="checkout-notes" className="block text-xs font-medium text-zinc-700 mb-1">
                    ملاحظات التوصيل أو التجهيز (اختياري)
                  </label>
                  <textarea
                    id="checkout-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: الجرس الأيمن، الدفع نقداً عند الاستلام..."
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none resize-none"
                  />
                </div>
              </div>

              {/* Loyalty points toggle */}
              {loyaltyPoints >= 10 && (
                <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50 cursor-pointer">
                  <div className="text-xs">
                    <p className="font-semibold text-zinc-900">استخدام نقاط الوفاء</p>
                    <p className="text-zinc-500 tabular-nums">
                      لديك {loyaltyPoints} نقطة (خصم حتى{' '}
                      {formatMad(Math.floor(loyaltyPoints / 10))})
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.checked)}
                    className="w-5 h-5 accent-emerald-800"
                  />
                </label>
              )}

              {/* MAD Cost Breakdown */}
              <div className="border-t border-zinc-200 pt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>المجموع الفرعي</span>
                  <span className="tabular-nums font-medium">{formatMad(breakdown.subtotalMad)}</span>
                </div>

                {breakdown.savingsMad > 0 && (
                  <div className="flex items-center justify-between text-emerald-800">
                    <span>التوفير من العروض</span>
                    <span className="tabular-nums font-medium">
                      - {formatMad(breakdown.savingsMad)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-zinc-600">
                  <span>رسوم التوصيل</span>
                  <span className="tabular-nums font-medium">
                    {breakdown.deliveryFeeMad === 0 ? 'مجاني' : formatMad(breakdown.deliveryFeeMad)}
                  </span>
                </div>

                {breakdown.pointsDiscountMad > 0 && (
                  <div className="flex items-center justify-between text-emerald-800">
                    <span>خصم نقاط الوفاء</span>
                    <span className="tabular-nums font-medium">
                      - {formatMad(breakdown.pointsDiscountMad)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-base font-extrabold text-zinc-950">
                  <span>الإجمالي المستحق (عند الاستلام)</span>
                  <span className="tabular-nums text-emerald-950">
                    {formatMad(breakdown.totalMad)}
                  </span>
                </div>

                <p className="text-xs text-emerald-900 font-medium tabular-nums">
                  ستربح {breakdown.pointsEarned} نقطة وفاء + ختم واحد في بطاقة الوفاء مع هذا الطلب
                </p>
              </div>

              {checkoutBannerError && (
                <p className="text-xs text-rose-700 font-medium">{checkoutBannerError}</p>
              )}

              <button
                type="submit"
                disabled={hasOutOfStockItems}
                className="w-full min-h-[48px] px-5 bg-emerald-900 hover:bg-emerald-800 disabled:bg-zinc-300 disabled:text-zinc-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                تأكيد الطلب ({formatMad(breakdown.totalMad)})
              </button>
            </form>
          </div>
        )
      ) : (
        /* Live Order Tracking & Order History */
        <div className="space-y-6">
          {justConfirmedOrderId && (
            <div
              role="status"
              className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-950"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0" aria-hidden="true" />
              <div className="text-sm">
                <span className="font-bold">
                  تم تأكيد طلبك رقم <span dir="ltr">{justConfirmedOrderId}</span> بنجاح.
                </span>{' '}
                <span>يمكنك متابعة حالة التجهيز والتوصيل مباشرة هنا.</span>
              </div>
            </div>
          )}

          {/* Live Tracking for Active Order */}
          {activeOrder && (
            <section
              aria-labelledby="live-tracking-heading"
              className="bg-white border border-zinc-200/80 rounded-2xl p-5 md:p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>تتبع مباشر</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums font-semibold text-zinc-800">
                      رقم <span dir="ltr">{activeOrder.id}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {activeOrder.fulfillment === FulfillmentType.DELIVERY
                        ? 'توصيل للمنزل'
                        : 'استلام من المحل'}
                    </span>
                  </div>
                  <h2
                    id="live-tracking-heading"
                    className="font-display text-xl font-bold text-emerald-950 mt-1"
                  >
                    {ORDER_STATUS_LABELS[activeOrder.status]}
                  </h2>
                </div>

                <div className="text-end">
                  <span className="block text-xs text-zinc-500">الإجمالي</span>
                  <span className="text-lg font-extrabold text-zinc-950 tabular-nums">
                    {formatMad(activeOrder.breakdown.totalMad)}
                  </span>
                </div>
              </div>

              {/* Timeline Steps */}
              <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {getOrderTimelineSteps(activeOrder.fulfillment).map((step, index, arr) => {
                  const currentIdx = arr.indexOf(activeOrder.status);
                  const isDone = index <= currentIdx;
                  const isCurrent = index === currentIdx;

                  return (
                    <li
                      key={step}
                      className={`p-3 rounded-xl border text-xs transition-colors ${
                        isCurrent
                          ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-semibold'
                          : isDone
                            ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-400'
                      }`}
                    >
                      <span className="block tabular-nums text-[11px] mb-1">
                        المرحلة {index + 1}
                      </span>
                      <span>{ORDER_STATUS_LABELS[step]}</span>
                    </li>
                  );
                })}
              </ol>

              <div className="text-xs text-zinc-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  العنوان: {activeOrder.neighborhood} — {activeOrder.address}
                </span>
                {activeOrder.notes && <span>ملاحظات: {activeOrder.notes}</span>}
              </div>
            </section>
          )}

          {/* Order History */}
            <section aria-labelledby="history-heading" className="space-y-4">
            <h2 id="history-heading" className="font-display text-lg font-bold text-zinc-950">
              سجل الطلبات ({orders.length})
            </h2>

            {orders.length === 0 ? (
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 text-center text-sm text-zinc-500">
                لا توجد طلبات سابقة بعد.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, idx) => {
                  const dateText = new Date(order.createdAt).toLocaleDateString('ar-MA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <ScrollReveal key={order.id} delayMs={(idx % 3) * 45}>
                    <article
                      className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                              <span className="font-bold text-zinc-900 tabular-nums">
                                رقم <span dir="ltr">{order.id}</span>
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{dateText}</span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={`font-semibold ${
                                  order.status === OrderStatus.CANCELLED
                                    ? 'text-rose-700'
                                    : 'text-emerald-800'
                                }`}
                              >
                                {ORDER_STATUS_LABELS[order.status]}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {order.neighborhood} ·{' '}
                              {order.fulfillment === FulfillmentType.DELIVERY
                                ? 'توصيل'
                                : 'استلام من المحل'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-base text-zinc-950 tabular-nums">
                            {formatMad(order.breakdown.totalMad)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTriggerReorder(order.id)}
                            className="min-h-[40px] px-4 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>إعادة الطلب</span>
                          </button>
                        </div>
                      </div>

                      <ul className="border-t border-zinc-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600">
                        {order.items.map((item) => (
                          <li
                            key={`${order.id}-${item.productId}`}
                            className="flex items-center justify-between gap-2 bg-zinc-50 rounded-lg px-3 py-2"
                          >
                            <span className="truncate">
                              {item.name} × <span className="tabular-nums">{item.quantity}</span>
                            </span>
                            <span className="tabular-nums font-medium text-zinc-900 shrink-0">
                              {formatMad(item.priceMad * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </article>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
