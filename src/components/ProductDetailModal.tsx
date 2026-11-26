import { useEffect, useState } from 'react';
import { Heart, ListPlus, Minus, Plus, X } from 'lucide-react';
import { CATEGORY_LABELS, SUBSTITUTION_LABELS } from '../data/seedData';
import { Product, SubstitutionPreference } from '../types/store';
import { formatMad } from '../utils/storeLogic';
import { StoreImage } from './StoreImage';

interface ProductDetailModalProps {
  product: Product | null;
  initialSubstitution: SubstitutionPreference;
  isFavorite: boolean;
  isInRecurringList: boolean;
  onClose: () => void;
  onAddToCart: (
    productId: string,
    quantity: number,
    substitution: SubstitutionPreference
  ) => void;
  onToggleFavorite: (productId: string) => void;
  onAddToRecurringList: (productId: string) => void;
}

export function ProductDetailModal({
  product,
  initialSubstitution,
  isFavorite,
  isInRecurringList,
  onClose,
  onAddToCart,
  onToggleFavorite,
  onAddToRecurringList,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [substitution, setSubstitution] = useState<SubstitutionPreference>(initialSubstitution);

  useEffect(() => {
    setQuantity(1);
    setSubstitution(initialSubstitution);
  }, [product?.id, initialSubstitution]);

  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  if (!product) return null;

  const hasDiscount =
    product.originalPriceMad !== undefined && product.originalPriceMad > product.priceMad;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Mobile sheet drag affordance */}
        <div className="md:hidden w-10 h-1.5 bg-zinc-300 rounded-full mx-auto mt-3" aria-hidden="true" />

        <div className="p-5 md:p-6 flex items-center justify-between border-b border-zinc-100">
          <div className="text-xs text-zinc-500 flex items-center gap-2">
            <span>{CATEGORY_LABELS[product.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{product.unitLabel}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق تفاصيل المنتج"
            className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100">
            <StoreImage
              src={product.imageUrl}
              alt={product.name}
              fallbackLabel={product.name}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 id="pdp-title" className="font-display text-xl font-bold text-zinc-950">
                {product.name}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">{product.packInfo}</p>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-emerald-950 tabular-nums">
                {formatMad(product.priceMad)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-zinc-400 line-through tabular-nums">
                  {formatMad(product.originalPriceMad!)}
                </span>
              )}
              <span
                className={`text-xs font-semibold ${
                  product.inStock ? 'text-emerald-800' : 'text-rose-700'
                }`}
              >
                {product.inStock ? 'متوفر للتوصيل السريع' : 'نفد من المخزون مؤقتاً'}
              </span>
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed">{product.description}</p>

            {/* Substitution preference */}
            <fieldset className="border-t border-zinc-100 pt-4">
              <legend className="text-xs font-semibold text-zinc-800 mb-2">
                تفضيل البديل عند نفاد الصنف أثناء التجهيز
              </legend>
              <div className="flex flex-col gap-2">
                {Object.values(SubstitutionPreference).map((pref) => (
                  <label
                    key={pref}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      substitution === pref
                        ? 'border-emerald-800 bg-emerald-50/70 text-emerald-950 font-medium'
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="substitution"
                      value={pref}
                      checked={substitution === pref}
                      onChange={() => setSubstitution(pref)}
                      className="accent-emerald-800"
                    />
                    <span>{SUBSTITUTION_LABELS[pref]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Secondary quick actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onToggleFavorite(product.id)}
                className={`flex-1 min-h-[42px] px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isFavorite
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`}
                  aria-hidden="true"
                />
                <span>{isFavorite ? 'في المفضلة' : 'حفظ بالمفضلة'}</span>
              </button>

              <button
                type="button"
                onClick={() => onAddToRecurringList(product.id)}
                className={`flex-1 min-h-[42px] px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isInRecurringList
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <ListPlus className="w-4 h-4" aria-hidden="true" />
                <span>{isInRecurringList ? 'في القائمة الدورية' : 'أضف للقائمة الدورية'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sticky purchase bar */}
        <div className="p-4 md:p-6 border-t border-zinc-200 bg-zinc-50 flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="زيادة الكمية"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-800 hover:bg-zinc-100 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="min-w-[28px] text-center font-bold text-sm tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="إنقاص الكمية"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-800 hover:bg-zinc-100 cursor-pointer"
            >
              <Minus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => {
              onAddToCart(product.id, quantity, substitution);
              onClose();
            }}
            className="flex-1 min-h-[48px] px-5 bg-emerald-900 hover:bg-emerald-800 disabled:bg-zinc-300 disabled:text-zinc-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-between cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{product.inStock ? 'أضف إلى السلة' : 'غير متوفر حالياً'}</span>
            <span className="tabular-nums font-bold">
              {formatMad(product.priceMad * quantity)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
