import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORY_LABELS } from '../data/seedData';
import { CartItem, Product, ProductCategory, SortOption } from '../types/store';
import { filterAndSortProducts } from '../utils/storeLogic';
import { ProductCard } from './ProductCard';
import { ScrollReveal } from './ScrollMotion';

const PAGE_BATCH_SIZE = 24;

interface CatalogViewProps {
  products: Product[];
  cart: CartItem[];
  favorites: string[];
  searchQuery: string;
  selectedCategory: ProductCategory | 'all';
  inStockOnly: boolean;
  offersOnly: boolean;
  maxPriceMad: number | null;
  sortBy: SortOption;
  onSearchChange: (q: string) => void;
  onCategoryChange: (cat: ProductCategory | 'all') => void;
  onInStockChange: (val: boolean) => void;
  onOffersOnlyChange: (val: boolean) => void;
  onMaxPriceChange: (val: number | null) => void;
  onSortChange: (val: SortOption) => void;
  onResetFilters: () => void;
  onOpenProductDetail: (product: Product) => void;
  onAddToCart: (productId: string) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onToggleFavorite: (productId: string) => void;
}

export function CatalogView({
  products,
  cart,
  favorites,
  searchQuery,
  selectedCategory,
  inStockOnly,
  offersOnly,
  maxPriceMad,
  sortBy,
  onSearchChange,
  onCategoryChange,
  onInStockChange,
  onOffersOnlyChange,
  onMaxPriceChange,
  onSortChange,
  onResetFilters,
  onOpenProductDetail,
  onAddToCart,
  onUpdateCartQuantity,
  onToggleFavorite,
}: CatalogViewProps) {
  const [visibleLimit, setVisibleLimit] = useState(PAGE_BATCH_SIZE);

  useEffect(() => {
    setVisibleLimit(PAGE_BATCH_SIZE);
  }, [searchQuery, selectedCategory, inStockOnly, offersOnly, maxPriceMad, sortBy]);

  const cartQtyMap = useMemo(
    () => new Map(cart.map((c) => [c.productId, c.quantity])),
    [cart]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(
    () =>
      filterAndSortProducts(products, {
        searchQuery,
        category: selectedCategory,
        inStockOnly,
        offersOnly,
        maxPriceMad,
        sortBy,
      }),
    [products, searchQuery, selectedCategory, inStockOnly, offersOnly, maxPriceMad, sortBy]
  );

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleLimit),
    [filteredProducts, visibleLimit]
  );

  const hasMore = visibleLimit < filteredProducts.length;
  const remainingCount = filteredProducts.length - visibleProducts.length;

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'all' ||
    inStockOnly ||
    offersOnly ||
    maxPriceMad !== null ||
    sortBy !== 'featured';

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-950">كتالوج محل رشيد</h1>
            <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">
              عرض {visibleProducts.length} من أصل {filteredProducts.length} منتج مطابق (إجمالي
              الكتالوج {products.length} منتج)
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-96">
            <label htmlFor="catalog-search" className="sr-only">
              ابحث في المنتجات
            </label>
            <Search
              className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="catalog-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن حليب، زيت زيتون، شاي، منظف..."
              className="w-full min-h-[44px] ps-10 pe-10 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="مسح البحث"
                className="absolute top-1/2 -translate-y-1/2 end-2 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div
          role="group"
          aria-label="تصفية حسب القسم"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
        >
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            aria-pressed={selectedCategory === 'all'}
            className={`min-h-[40px] px-4 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer tabular-nums ${
              selectedCategory === 'all'
                ? 'bg-emerald-900 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            كل الأقسام ({products.length})
          </button>

          {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              aria-pressed={selectedCategory === cat}
              className={`min-h-[40px] px-4 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer tabular-nums ${
                selectedCategory === cat
                  ? 'bg-emerald-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {CATEGORY_LABELS[cat]} ({categoryCounts[cat] ?? 0})
            </button>
          ))}
        </div>

        {/* Attribute & Price Filters */}
        <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 me-1">
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>تصفية:</span>
            </span>

            <button
              type="button"
              onClick={() => onInStockChange(!inStockOnly)}
              aria-pressed={inStockOnly}
              className={`min-h-[38px] px-3.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                inStockOnly
                  ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-semibold'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
              }`}
            >
              المتوفر فقط
            </button>

            <button
              type="button"
              onClick={() => onOffersOnlyChange(!offersOnly)}
              aria-pressed={offersOnly}
              className={`min-h-[38px] px-3.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                offersOnly
                  ? 'bg-amber-50 border-amber-700 text-amber-950 font-semibold'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
              }`}
            >
              العروض فقط
            </button>

            <label className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="sr-only">الحد الأقصى للسعر</span>
              <select
                aria-label="الحد الأقصى للسعر"
                value={maxPriceMad === null ? 'all' : String(maxPriceMad)}
                onChange={(e) =>
                  onMaxPriceChange(e.target.value === 'all' ? null : Number(e.target.value))
                }
                className="min-h-[38px] px-3 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-700 outline-none focus:border-emerald-800 cursor-pointer"
              >
                <option value="all">كل الأسعار</option>
                <option value="20">أقل من 20 درهم</option>
                <option value="35">أقل من 35 درهم</option>
                <option value="60">أقل من 60 درهم</option>
                <option value="100">أقل من 100 درهم</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="catalog-sort" className="text-xs text-zinc-500">
              الترتيب:
            </label>
            <select
              id="catalog-sort"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="min-h-[38px] px-3 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-700 outline-none focus:border-emerald-800 cursor-pointer"
            >
              <option value="featured">الأكثر ملاءمة</option>
              <option value="price_asc">السعر: من الأقل للأعلى</option>
              <option value="price_desc">السعر: من الأعلى للأقل</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="min-h-[38px] px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 rounded-xl cursor-pointer"
              >
                إعادة ضبط
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Grid or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-10 text-center space-y-3">
          <p className="font-display text-lg font-bold text-zinc-900">
            لا توجد منتجات مطابقة لخيارات البحث الحالية
          </p>
          <p className="text-sm text-zinc-500">
            جرّب تعديل كلمات البحث أو إزالة بعض الفلاتر لعرض كل منتجات محل رشيد.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="min-h-[44px] px-5 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            عرض جميع المنتجات
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleProducts.map((product, idx) => (
              <ScrollReveal
                key={product.id}
                immediate={idx < 6}
                delayMs={(idx % 3) * 35}
                className="h-full"
              >
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

          {hasMore && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVisibleLimit((curr) => curr + PAGE_BATCH_SIZE)}
                className="min-h-[46px] px-6 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer tabular-nums"
              >
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
                <span>
                  عرض المزيد ({Math.min(PAGE_BATCH_SIZE, remainingCount)} من أصل{' '}
                  {remainingCount} متبقية)
                </span>
              </button>

              {remainingCount > PAGE_BATCH_SIZE && (
                <button
                  type="button"
                  onClick={() => setVisibleLimit(filteredProducts.length)}
                  className="min-h-[46px] px-5 bg-white border border-zinc-200 hover:border-emerald-800 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer tabular-nums"
                >
                  عرض جميع النتائج ({filteredProducts.length})
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
