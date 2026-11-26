import { Heart, Minus, Plus } from 'lucide-react';
import { CATEGORY_LABELS } from '../data/seedData';
import { Product } from '../types/store';
import { formatMad } from '../utils/storeLogic';
import { StoreImage } from './StoreImage';

interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  isFavorite: boolean;
  onOpenDetail: (product: Product) => void;
  onAddToCart: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onToggleFavorite: (productId: string) => void;
}

export function ProductCard({
  product,
  cartQuantity,
  isFavorite,
  onOpenDetail,
  onAddToCart,
  onUpdateQuantity,
  onToggleFavorite,
}: ProductCardProps) {
  const hasDiscount =
    product.originalPriceMad !== undefined && product.originalPriceMad > product.priceMad;

  return (
    <article
      className="group bg-white border border-zinc-200/80 rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          aria-label={`عرض تفاصيل ${product.name}`}
          className="w-full h-full block text-start cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-800"
        >
          <StoreImage
            src={product.imageUrl}
            alt={product.name}
            fallbackLabel={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </button>

        <button
          type="button"
          onClick={() => onToggleFavorite(product.id)}
          aria-label={
            isFavorite ? `إزالة ${product.name} من المفضلة` : `إضافة ${product.name} للمفضلة`
          }
          aria-pressed={isFavorite}
          className="absolute top-2.5 start-2.5 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200/70 flex items-center justify-center text-zinc-700 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2.5">
        {/* Unboxed metadata line */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 truncate">
          <span>{CATEGORY_LABELS[product.category]}</span>
          <span aria-hidden="true">·</span>
          <span>{product.unitLabel}</span>
          {!product.inStock && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-rose-700 font-medium">غير متوفر حالياً</span>
            </>
          )}
          {product.inStock && product.isDailyDeal && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700 font-medium">عرض اليوم</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          className="text-start font-semibold text-base text-zinc-900 hover:text-emerald-900 transition-colors line-clamp-2 leading-snug cursor-pointer"
        >
          {product.name}
        </button>

        <div className="mt-auto pt-2 border-t border-zinc-100 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-bold text-base text-emerald-950 tabular-nums">
              {formatMad(product.priceMad)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-zinc-400 line-through tabular-nums">
                {formatMad(product.originalPriceMad!)}
              </span>
            )}
          </div>

          {!product.inStock ? (
            <button
              type="button"
              onClick={() => onOpenDetail(product)}
              className="min-h-[40px] px-3 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
            >
              التفاصيل
            </button>
          ) : cartQuantity > 0 ? (
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, cartQuantity + 1)}
                aria-label={`زيادة كمية ${product.name}`}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
              <span
                key={cartQuantity}
                className="min-w-[24px] text-center text-sm font-bold text-emerald-950 tabular-nums animate-stepper-pop"
                aria-label={`الكمية في السلة: ${cartQuantity}`}
              >
                {cartQuantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, cartQuantity - 1)}
                aria-label={`إنقاص كمية ${product.name}`}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(product.id)}
              aria-label={`أضف ${product.name} إلى السلة`}
              className="min-h-[40px] px-4 bg-emerald-900 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              أضف للسلة
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
