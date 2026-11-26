import { useId, useRef, useState } from 'react';
import { Award, Check, ChevronDown, ChevronUp, Gift, ShieldCheck } from 'lucide-react';
import { STORE_INFO } from '../data/seedData';
import {
  formatMad,
  getLoyaltyTierInfo,
  STAMPS_PER_REWARD_CYCLE,
  STAMP_CYCLE_BONUS_POINTS,
} from '../utils/storeLogic';

interface LoyaltyCardProps {
  memberName: string | null;
  loyaltyPoints: number;
  loyaltyStamps: number;
  completedRewardsCount: number;
  compact?: boolean;
  onOpenFullCard?: () => void;
}

export function LoyaltyCard({
  memberName,
  loyaltyPoints,
  loyaltyStamps,
  completedRewardsCount,
  compact = false,
  onOpenFullCard,
}: LoyaltyCardProps) {
  const patternId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const tier = getLoyaltyTierInfo(loyaltyPoints);
  const discountMad = Math.floor(loyaltyPoints / 10);
  const clampedStamps = Math.max(0, Math.min(STAMPS_PER_REWARD_CYCLE, loyaltyStamps));

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 9;
    const rotateX = (0.5 - py) * 7;
    el.style.setProperty('--rx', `${rotateX.toFixed(2)}deg`);
    el.style.setProperty('--ry', `${rotateY.toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '50%');
  };

  return (
    <div className="space-y-3">
      {/* Interactive Tilting Loyalty Card */}
      <div
        ref={cardRef}
        onPointerEnter={() => setIsHovered(true)}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        aria-label="بطاقة وفاء محل رشيد"
        className={`loyalty-card-surface relative overflow-hidden rounded-2xl border text-white select-none ${
          tier.id === 'gold'
            ? 'bg-gradient-to-br from-emerald-950 via-[#0d2d23] to-amber-950 border-amber-500/40'
            : tier.id === 'silver'
              ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-zinc-900 border-emerald-500/30'
              : 'bg-gradient-to-br from-[#06241b] via-emerald-950 to-zinc-900 border-emerald-800/60'
        } ${compact ? 'p-5' : 'p-6'}`}
      >
        {/* Subtle geometric tile hairline */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id={patternId} width="36" height="36" patternUnits="userSpaceOnUse">
              <path
                d="M18 0 L36 18 L18 36 L0 18 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>

        {/* Pointer-responsive sheen + ambient sweep */}
        <div
          aria-hidden="true"
          className={`loyalty-card-sheen absolute inset-0 pointer-events-none ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          aria-hidden="true"
          className="loyalty-card-sweep absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none"
        />

        <div className="relative z-10 space-y-5">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-200/90">
                <span>بطاقة الوفاء</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300 font-semibold">{tier.labelAr}</span>
              </div>
              <p className="font-display text-lg font-bold text-white mt-0.5">
                {memberName ? memberName : 'زائر محل رشيد'}
              </p>
              <p className="text-[11px] text-emerald-200/75 mt-0.5">
                {STORE_INFO.nameAr} · {STORE_INFO.neighborhoodAr}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Award
                className={`w-6 h-6 ${tier.id === 'gold' ? 'text-amber-300' : 'text-emerald-200'}`}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Points & MAD Equivalent */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-y border-white/10 py-3.5">
            <div>
              <span className="text-[11px] text-emerald-200/80 block">الرصيد الحالي</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  key={loyaltyPoints}
                  className="font-display text-3xl font-extrabold tabular-nums text-white animate-stepper-pop"
                >
                  {loyaltyPoints}
                </span>
                <span className="text-xs font-medium text-emerald-200">نقطة وفاء</span>
              </div>
            </div>

            <div className="text-end">
              <span className="text-[11px] text-emerald-200/80 block">قيمة الخصم الفوري</span>
              <span className="font-display text-lg font-bold text-amber-300 tabular-nums mt-0.5 block">
                {formatMad(discountMad)}
              </span>
            </div>
          </div>

          {/* 5-Stamp Reward Tracker */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-100 font-medium">
                أختام الطلبات ({clampedStamps} من {STAMPS_PER_REWARD_CYCLE})
              </span>
              <span className="text-amber-300 tabular-nums">
                مكافأة +{STAMP_CYCLE_BONUS_POINTS} نقطة عند الختم 5
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2" aria-label={`أختام الوفاء: ${clampedStamps} من ${STAMPS_PER_REWARD_CYCLE}`}>
              {Array.from({ length: STAMPS_PER_REWARD_CYCLE }).map((_, idx) => {
                const isStamped = idx < clampedStamps;
                return (
                  <div
                    key={idx}
                    className={`h-10 rounded-xl border flex items-center justify-center transition-all ${
                      isStamped
                        ? 'bg-amber-400 text-emerald-950 border-amber-300 animate-stamp-unlock'
                        : 'bg-white/[0.06] text-white/40 border-white/15'
                    }`}
                  >
                    {isStamped ? (
                      <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                    ) : (
                      <span className="text-xs font-bold tabular-nums">{idx + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-emerald-200/90 tabular-nums">
              <span>
                {tier.nextTierLabelAr
                  ? `باقي ${tier.pointsToNextTier} نقطة للوصول إلى ${tier.nextTierLabelAr}`
                  : 'وصلت إلى أعلى مستوى للعضوية الذهبية'}
              </span>
              {completedRewardsCount > 0 && (
                <span className="text-amber-300 font-semibold">
                  مكافآت مكتملة: {completedRewardsCount}
                </span>
              )}
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-l from-amber-300 to-emerald-400 transition-all duration-500"
                style={{ width: `${tier.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowRules((v) => !v)}
              aria-expanded={showRules}
              className="text-xs font-semibold text-emerald-100 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>قواعد كسب واستبدال النقاط</span>
              {showRules ? (
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>

            {compact && onOpenFullCard && (
              <button
                type="button"
                onClick={onOpenFullCard}
                className="min-h-[34px] px-3 bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                عرض بطاقتي
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transparent Rules & Rewards Drawer */}
      {showRules && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 space-y-2 text-xs text-zinc-700 animate-view-enter">
          <div className="flex items-center gap-2 font-bold text-zinc-950">
            <ShieldCheck className="w-4 h-4 text-emerald-800" aria-hidden="true" />
            <span>كيف تجمع وتستفيد من بطاقة الوفاء؟</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-zinc-600 leading-relaxed">
            <li className="tabular-nums">
              تربح <strong className="text-zinc-900">1 نقطة وفاء</strong> عن كل{' '}
              <strong className="text-zinc-900">10 درهم</strong> من قيمة أي طلب تؤكده.
            </li>
            <li className="tabular-nums">
              كل طلب يمنحك <strong className="text-zinc-900">ختماً واحداً</strong>؛ عند إتمام 5 أختام
              تحصل فوراً على مكافأة <strong className="text-emerald-800">+25 نقطة إضافية</strong>.
            </li>
            <li className="tabular-nums">
              تربح <strong className="text-zinc-900">+5 نقاط ترحيبية</strong> عند إنشاء حساب شخصي و
              <strong className="text-zinc-900">+5 نقاط</strong> عند تجهيز قائمة مشتريات دورية من 3
              منتجات فأكثر.
            </li>
            <li className="tabular-nums">
              كل <strong className="text-zinc-900">10 نقاط = 1 درهم</strong> خصم مباشر يمكنك
              تفعيله في السلة عند إتمام الطلب.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
