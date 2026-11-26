import { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Download,
  PackageCheck,
  RotateCcw,
  Smartphone,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  ANDROID_APP_INFO,
  CATEGORY_LABELS,
  ORDER_STATUS_LABELS,
  STORE_IMAGES,
  STORE_INFO,
} from '../data/seedData';
import { Bundle, CartItem, Order, Product, ProductCategory } from '../types/store';
import { formatMad } from '../utils/storeLogic';
import { LoyaltyCard } from './LoyaltyCard';
import { ProductCard } from './ProductCard';
import { ScrollParallaxFrame, ScrollReveal } from './ScrollMotion';
import { StoreImage } from './StoreImage';
import { StoreLocationCard } from './StoreLocationCard';

interface HomeViewProps {
  products: Product[];
  bundles: Bundle[];
  cart: CartItem[];
  orders: Order[];
  favorites: string[];
  activeUserName: string | null;
  loyaltyPoints: number;
  loyaltyStamps: number;
  completedRewardsCount: number;
  onNavigateToCatalog: (category?: ProductCategory | 'all', offersOnly?: boolean) => void;
  onNavigateToCart: (subTab?: 'cart' | 'orders') => void;
  onNavigateToAccount: () => void;
  onOpenProductDetail: (product: Product) => void;
  onAddToCart: (productId: string) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onAddBundleToCart: (bundleId: string) => { addedCount: number; skippedCount: number };
  onToggleFavorite: (productId: string) => void;
  onQuickReorder: (orderId: string) => void;
  onOpenDownloadModal: () => void;
  onOpenAuthModal: () => void;
}

export function HomeView({
  products,
  bundles,
  cart,
  orders,
  favorites,
  activeUserName,
  loyaltyPoints,
  loyaltyStamps,
  completedRewardsCount,
  onNavigateToCatalog,
  onNavigateToCart,
  onNavigateToAccount,
  onOpenProductDetail,
  onAddToCart,
  onUpdateCartQuantity,
  onAddBundleToCart,
  onToggleFavorite,
  onQuickReorder,
  onOpenDownloadModal,
  onOpenAuthModal,
}: HomeViewProps) {
  const [showcaseMode, setShowcaseMode] = useState<'deals' | 'bestsellers'>('deals');
  const [bundleFeedback, setBundleFeedback] = useState<{
    id: string;
    addedCount: number;
    skippedCount: number;
  } | null>(null);

  const cartQtyMap = new Map(cart.map((c) => [c.productId, c.quantity]));
  const inStockIds = new Set(products.filter((p) => p.inStock).map((p) => p.id));
  const dailyDeals = products.filter((p) => p.isDailyDeal && p.inStock).slice(0, 6);
  const bestSellers = products.filter((p) => p.isBestSeller && p.inStock).slice(0, 6);
  const visibleProducts = showcaseMode === 'deals' ? dailyDeals : bestSellers;

  const latestOrder = orders[0];

  const handleAddBundle = (bundleId: string) => {
    const result = onAddBundleToCart(bundleId);
    setBundleFeedback({ id: bundleId, ...result });
    window.setTimeout(() => {
      setBundleFeedback((curr) => (curr?.id === bundleId ? null : curr));
    }, 2200);
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Hero Showcase: single dominant visual anchor */}
      <section
        aria-label="ترحيب وعروض محل رشيد"
        className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
      >
        <div className="lg:col-span-6 p-6 md:p-10 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="animate-hero-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="font-semibold text-emerald-900">{STORE_INFO.addressAr}</span>
              <span aria-hidden="true">·</span>
              <span>توصيل خلال {STORE_INFO.estimatedDeliveryMinutes} دقيقة</span>
              <span aria-hidden="true">·</span>
              <span>مجاناً فوق {formatMad(STORE_INFO.freeDeliveryThresholdMad)}</span>
            </div>

            <h1 className="animate-hero-2 font-display text-3xl md:text-4xl font-extrabold text-zinc-950 leading-tight text-start">
              تموينك اليومي الطازج من محل رشيد إلى باب منزلك
            </h1>

            <p className="animate-hero-2 text-sm md:text-base text-zinc-600 leading-relaxed max-w-xl">
              منتجات البقالة المغربية، الألبان والخبز الساخن، المشروبات ومواد التنظيف في{' '}
              <strong className="font-semibold text-zinc-800">{STORE_INFO.addressAr}</strong> بأسعار
              واضحة بالدرهم المغربي وتوصيل سريع أو استلام من المحل.
            </p>
          </div>

          <div className="animate-hero-3 flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToCatalog('all', true)}
              className="min-h-[48px] px-6 bg-emerald-900 hover:bg-emerald-800 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>تصفح عروض اليوم</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateToCatalog('all', false)}
              className="min-h-[48px] px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              كل المنتجات
            </button>

            <button
              type="button"
              onClick={onOpenAuthModal}
              className="min-h-[48px] px-4 bg-white border border-zinc-200 hover:border-emerald-800 text-zinc-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-emerald-800" aria-hidden="true" />
              <span>{activeUserName ? `مرحباً، ${activeUserName}` : 'تسجيل الدخول / زائر'}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 relative min-h-[240px] lg:min-h-[360px] bg-zinc-100 overflow-hidden">
          <ScrollParallaxFrame className="w-full h-full" intensity={18}>
            <StoreImage
              src={STORE_IMAGES.hero}
              alt="واجهة محل رشيد للمواد الغذائية الطازجة في العين القليعة"
              fallbackLabel="محل رشيد"
              className="w-full h-full object-cover scale-[1.06]"
            />
          </ScrollParallaxFrame>
        </div>
      </section>

      {/* Quick Reorder & Live Status Strip */}
      {latestOrder && (
        <ScrollReveal>
          <section
            aria-label="إعادة الطلب السريع ومتابعة آخر طلب"
            className="bg-white border border-zinc-200/80 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center shrink-0">
              <PackageCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="font-semibold text-zinc-800 tabular-nums">
                  طلب رقم <span dir="ltr">{latestOrder.id}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-800 font-medium">
                  {ORDER_STATUS_LABELS[latestOrder.status]}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{formatMad(latestOrder.breakdown.totalMad)}</span>
              </div>
              <p className="text-sm text-zinc-700 mt-1 line-clamp-1">
                {latestOrder.items.map((i) => `${i.name} (${i.quantity})`).join('، ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToCart('orders')}
              className="min-h-[42px] px-4 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>تتبع الطلب</span>
            </button>

            <button
              type="button"
              onClick={() => onQuickReorder(latestOrder.id)}
              className="min-h-[42px] px-4 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>إعادة الطلب السريع</span>
            </button>
          </div>
          </section>
        </ScrollReveal>
      )}

      {/* Quick Categories */}
      <ScrollReveal>
        <section aria-labelledby="quick-cats-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="quick-cats-heading" className="font-display text-xl font-bold text-zinc-950">
              التصنيفات السريعة
            </h2>
            <button
              type="button"
              onClick={() => onNavigateToCatalog('all', false)}
              className="text-xs font-semibold text-emerald-900 hover:underline cursor-pointer"
            >
              عرض الكل
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onNavigateToCatalog(cat, false)}
                className="min-h-[44px] px-4 bg-white border border-zinc-200/90 hover:border-emerald-800 hover:text-emerald-900 text-zinc-800 text-sm font-medium rounded-xl whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Daily Deals & Best-Sellers Segmented Showcase */}
      <section aria-labelledby="featured-products-heading" className="space-y-5">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2
              id="featured-products-heading"
              className="font-display text-xl md:text-2xl font-bold text-zinc-950"
            >
              {showcaseMode === 'deals' ? 'عروض اليوم في محل رشيد' : 'الأكثر طلباً في الحي'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              أسعار محدثة يومياً مع إمكانية اختيار البديل المفضل لكل منتج
            </p>
          </div>

          <div
            role="tablist"
            aria-label="تبديل العرض المميز"
            className="inline-flex items-center p-1 bg-zinc-200/70 rounded-xl self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={showcaseMode === 'deals'}
              onClick={() => setShowcaseMode('deals')}
              className={`min-h-[38px] px-4 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                showcaseMode === 'deals'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              عروض اليوم ({dailyDeals.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={showcaseMode === 'bestsellers'}
              onClick={() => setShowcaseMode('bestsellers')}
              className={`min-h-[38px] px-4 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                showcaseMode === 'bestsellers'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              الأكثر مبيعاً ({bestSellers.length})
            </button>
          </div>
          </div>
        </ScrollReveal>

        {visibleProducts.length === 0 ? (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 text-center text-sm text-zinc-500">
            لا توجد منتجات محددة في هذا القسم حالياً. تصفح الكتالوج الكامل للاطلاع على كل الأصناف.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleProducts.map((product, index) => (
              <ScrollReveal key={product.id} delayMs={(index % 3) * 40}>
                <ProductCard
                  product={product}
                  cartQuantity={cartQtyMap.get(product.id) ?? 0}
                  isFavorite={favorites.includes(product.id)}
                  onOpenDetail={onOpenProductDetail}
                  onAddToCart={onAddToCart}
                  onUpdateQuantity={onUpdateCartQuantity}
                  onToggleFavorite={onToggleFavorite}
                />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* Ready Bundles */}
      <section aria-labelledby="bundles-heading" className="space-y-5">
        <ScrollReveal>
          <div>
            <h2 id="bundles-heading" className="font-display text-xl md:text-2xl font-bold text-zinc-950">
              باقات جاهزة بسعر مخفض
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              أضف باقة كاملة بنقرة واحدة لتوفير الوقت والمال
            </p>
          </div>
        </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {bundles.map((bundle, index) => {
              const savings = Math.round((bundle.originalPriceMad - bundle.priceMad) * 100) / 100;
              const availableItemsCount = bundle.items.filter((bi) =>
                inStockIds.has(bi.productId)
              ).length;
              const feedback = bundleFeedback?.id === bundle.id ? bundleFeedback : null;

              return (
                <ScrollReveal key={bundle.id} delayMs={index * 55}>
                  <article
                    className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden flex flex-col h-full"
                  >
                <div className="aspect-[4/3] bg-zinc-100 overflow-hidden">
                  <StoreImage
                    src={bundle.imageUrl}
                    alt={bundle.title}
                    fallbackLabel={bundle.title}
                  />
                </div>
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="tabular-nums">توفير {formatMad(savings)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-zinc-500 tabular-nums">
                      {bundle.items.length} أصناف
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-zinc-950">{bundle.title}</h3>
                  <p className="text-xs text-zinc-600 leading-relaxed flex-1">{bundle.subtitle}</p>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-lg font-extrabold text-emerald-950 tabular-nums">
                        {formatMad(bundle.priceMad)}
                      </span>
                      <span className="block text-xs text-zinc-400 line-through tabular-nums">
                        {formatMad(bundle.originalPriceMad)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={availableItemsCount === 0}
                      onClick={() => handleAddBundle(bundle.id)}
                      className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed ${
                        feedback && feedback.addedCount > 0
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                          : 'bg-emerald-900 hover:bg-emerald-800 text-white'
                      }`}
                    >
                      {availableItemsCount === 0
                        ? 'غير متوفر حالياً'
                        : feedback && feedback.addedCount > 0
                          ? feedback.skippedCount > 0
                            ? `أضيفت ${feedback.addedCount} أصناف`
                            : 'تمت إضافة الباقة'
                          : 'أضف الباقة للسلة'}
                    </button>
                  </div>
                </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </section>

      {/* Loyalty Card & Store Location in Al-Qulai'ah near Masjid Al-Quds */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <LoyaltyCard
              memberName={activeUserName}
              loyaltyPoints={loyaltyPoints}
              loyaltyStamps={loyaltyStamps}
              completedRewardsCount={completedRewardsCount}
              compact
              onOpenFullCard={onNavigateToAccount}
            />
          </div>
          <div className="lg:col-span-7">
            <StoreLocationCard compact />
          </div>
        </div>
      </ScrollReveal>

      {/* Android App Download & Spectrum Studio Attribution Promo */}
      <ScrollReveal>
        <section
          aria-label="عن تطبيق محل رشيد وتنزيل نسخة أندرويد"
          className="bg-emerald-950 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-200">
              <Smartphone className="w-4 h-4" aria-hidden="true" />
              <span>نسخة أندرويد الرسمية</span>
              <span aria-hidden="true">·</span>
              <span dir="ltr" className="tabular-nums">
                v{ANDROID_APP_INFO.versionName}
              </span>
              <span aria-hidden="true">·</span>
              <span>{STORE_INFO.creatorAttributionAr}</span>
            </div>
            <h2 className="font-display text-xl md:text-2xl font-bold">
              احصل على تطبيق محل رشيد على هاتفك الأندرويد
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              اطلب تموينك اليومي بضغطة واحدة مع تتبع فوري للطلبات وإعادة الطلب السريع في أي وقت.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenDownloadModal}
            className="min-h-[48px] px-6 bg-white hover:bg-emerald-50 text-emerald-950 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>تنزيل التطبيق</span>
          </button>
        </section>
      </ScrollReveal>
    </div>
  );
}
