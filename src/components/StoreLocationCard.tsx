import { useState } from 'react';
import { Check, Clock, Copy, MapPin, Navigation, Phone, Store } from 'lucide-react';
import { STORE_INFO } from '../data/seedData';
import { formatMad } from '../utils/storeLogic';

interface StoreLocationCardProps {
  compact?: boolean;
}

export function StoreLocationCard({ compact = false }: StoreLocationCardProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showDirections, setShowDirections] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(`${STORE_INFO.nameAr} — ${STORE_INFO.addressAr}`);
    } catch {
      // Fallback safely in restricted clipboard contexts
    }
    setCopiedAddress(true);
    window.setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <section
      aria-labelledby="store-location-heading"
      className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden"
    >
      <div className={`grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-12'} items-stretch`}>
        {/* Store Address & Info Column */}
        <div className={`${compact ? '' : 'lg:col-span-6'} p-5 md:p-6 flex flex-col justify-between gap-5`}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-emerald-900 font-semibold">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              <span>موقع المحل والاستلام المباشر</span>
            </div>

            <h2 id="store-location-heading" className="font-display text-xl font-bold text-zinc-950">
              {STORE_INFO.addressAr}
            </h2>

            <p className="text-xs text-zinc-600 leading-relaxed">
              نقع في قلب حي {STORE_INFO.neighborhoodAr} ({STORE_INFO.landmarkAr}). يمكنك استلام طلبك
              جاهزاً خلال 15 دقيقة من المحل مجاناً، أو طلب التوصيل السريع إلى باب منزلك في{' '}
              {STORE_INFO.deliveryZonesAr}.
            </p>

            <div className="pt-2 space-y-2 text-xs text-zinc-700 border-t border-zinc-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-800 shrink-0" aria-hidden="true" />
                <span>{STORE_INFO.openHours}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-800 shrink-0" aria-hidden="true" />
                <span className="tabular-nums font-medium" dir="ltr">
                  {STORE_INFO.phone}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-800 shrink-0" aria-hidden="true" />
                <span className="tabular-nums">
                  التوصيل خلال {STORE_INFO.estimatedDeliveryMinutes} دقيقة · مجاناً فوق{' '}
                  {formatMad(STORE_INFO.freeDeliveryThresholdMad)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowDirections((v) => !v)}
              aria-expanded={showDirections}
              className="min-h-[42px] px-4 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showDirections ? 'إخفاء خطوات الوصول' : 'عرض خطوات الوصول'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAddress}
              className="min-h-[42px] px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedAddress ? (
                <Check className="w-3.5 h-3.5 text-emerald-800" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{copiedAddress ? 'تم نسخ العنوان' : 'نسخ العنوان'}</span>
            </button>
          </div>

          {showDirections && (
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 space-y-2 text-xs text-zinc-700 animate-view-enter">
              <p className="font-bold text-zinc-950">وصف الوصول من جامع القدس:</p>
              <ol className="space-y-1 list-decimal list-inside leading-relaxed">
                <li>انطلق من الساحة الرئيسية لجامع القدس في اتجاه الشارع التجاري للعين القليعة.</li>
                <li>تقدّم مسافة قصيرة (~40 متراً) باتجاه المحور السكني القريب.</li>
                <li>تجد واجهة محل رشيد على اليمين مع موقف مخصص لاستلام الطلبات السريعة.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Architectural Neighborhood Schematic (Al-Qulai'ah & Masjid Al-Quds) */}
        <div
          className={`${compact ? 'h-48 border-t border-zinc-100' : 'lg:col-span-6 min-h-[240px] border-t lg:border-t-0 lg:border-s border-zinc-100'} bg-[#F2F5F3] relative overflow-hidden p-5 flex items-center justify-center`}
        >
          <svg
            viewBox="0 0 420 220"
            className="w-full h-full max-w-md"
            role="img"
            aria-label="خريطة توضيحية لموقع محل رشيد في العين القليعة بالقرب من جامع القدس"
          >
            {/* Neighborhood blocks */}
            <rect x="16" y="16" width="388" height="188" rx="16" fill="#FFFFFF" stroke="#E4E4E7" />
            <rect x="34" y="34" width="110" height="58" rx="8" fill="#F4F4F5" />
            <rect x="276" y="34" width="110" height="58" rx="8" fill="#F4F4F5" />
            <rect x="34" y="132" width="130" height="54" rx="8" fill="#F4F4F5" />
            <rect x="256" y="132" width="130" height="54" rx="8" fill="#F4F4F5" />

            {/* Main roads */}
            <path d="M22 110 H398" stroke="#D4D4D8" strokeWidth="14" strokeLinecap="round" />
            <path d="M210 24 V196" stroke="#D4D4D8" strokeWidth="12" strokeLinecap="round" />
            <path
              d="M118 110 H288"
              stroke="#065F46"
              strokeWidth="3"
              strokeDasharray="6 5"
              strokeLinecap="round"
            />

            {/* Masjid Al-Quds Landmark */}
            <g transform="translate(88, 66)">
              <rect x="0" y="0" width="88" height="30" rx="8" fill="#FEF3C7" stroke="#F59E0B" />
              <text
                x="44"
                y="19"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#78350F"
              >
                جامع القدس
              </text>
            </g>

            {/* Rachid Store Pin */}
            <g transform="translate(242, 62)">
              <rect x="0" y="0" width="102" height="34" rx="10" fill="#064E3B" />
              <text
                x="51"
                y="21"
                textAnchor="middle"
                fontSize="12"
                fontWeight="800"
                fill="#FFFFFF"
              >
                محل رشيد
              </text>
            </g>

            {/* Area Label */}
            <text
              x="210"
              y="188"
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#52525B"
            >
              العين القليعة · بالقرب من جامع القدس
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
