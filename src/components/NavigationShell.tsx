import { useEffect, useState } from 'react';
import {
  Download,
  Home,
  LayoutGrid,
  ShoppingBasket,
  User,
} from 'lucide-react';
import { AppTab } from '../types/store';
import { ScrollDirection } from '../hooks/useScrollDirection';
import { formatMad } from '../utils/storeLogic';
import { ScrollProgressBar } from './ScrollMotion';

interface NavigationShellProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  cartCount: number;
  cartSubtotalMad: number;
  onOpenDownloadModal: () => void;
  scrollDirection: ScrollDirection;
  isScrolled: boolean;
}

const NAV_ITEMS: Array<{ id: AppTab; label: string; mobileLabel: string }> = [
  { id: 'home', label: 'الرئيسية', mobileLabel: 'الرئيسية' },
  { id: 'catalog', label: 'الكتالوج', mobileLabel: 'الكتالوج' },
  { id: 'cart', label: 'السلة والطلبات', mobileLabel: 'السلة' },
  { id: 'account', label: 'حسابي', mobileLabel: 'حسابي' },
];

function getTabIcon(id: AppTab, isActive: boolean) {
  const cls = `w-5 h-5 ${isActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`;
  switch (id) {
    case 'home':
      return <Home className={cls} aria-hidden="true" />;
    case 'catalog':
      return <LayoutGrid className={cls} aria-hidden="true" />;
    case 'cart':
      return <ShoppingBasket className={cls} aria-hidden="true" />;
    case 'account':
      return <User className={cls} aria-hidden="true" />;
  }
}

export function NavigationShell({
  activeTab,
  onSelectTab,
  cartCount,
  cartSubtotalMad,
  onOpenDownloadModal,
  scrollDirection,
  isScrolled,
}: NavigationShellProps) {
  const [badgeBounceKey, setBadgeBounceKey] = useState(0);

  useEffect(() => {
    if (cartCount > 0) {
      setBadgeBounceKey((k) => k + 1);
    }
  }, [cartCount]);

  return (
    <>
      {/* Desktop Top Bar: strictly 3 zones separated by gap-8 */}
      <header
        className={`hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 transition-shadow duration-200 ${
          isScrolled ? (scrollDirection === 'up' ? 'shadow-md' : 'shadow-sm') : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="font-display text-xl font-extrabold tracking-tight text-emerald-950 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-800 rounded"
          >
            محل رشيد
          </button>

          {/* Zone 2: 4 concise single-line navigation links */}
          <nav aria-label="التنقل الرئيسي" className="flex items-center gap-6">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-800 rounded ${
                    isActive
                      ? 'text-emerald-900 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-800 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA action */}
          <button
            type="button"
            onClick={() => onSelectTab('cart')}
            aria-label={`عرض السلة (${cartCount} منتجات)`}
            className="px-4 py-2 min-h-[40px] bg-emerald-900 hover:bg-emerald-800 active:scale-[0.98] text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
          >
            <ShoppingBasket className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>السلة</span>
            <span
              key={badgeBounceKey}
              className="tabular-nums text-emerald-100 text-xs inline-block animate-badge-bounce"
            >
              ({cartCount}) · {formatMad(cartSubtotalMad)}
            </span>
          </button>
        </div>
        <ScrollProgressBar />
      </header>

      {/* Mobile Compact Top App Bar (52px) */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
        <div className="h-[50px] px-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="font-display text-lg font-extrabold text-emerald-950 whitespace-nowrap shrink-0 cursor-pointer"
          >
            محل رشيد
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenDownloadModal}
              aria-label="تنزيل التطبيق"
              className="min-h-[44px] px-2.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-emerald-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>التطبيق</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('cart')}
              aria-label={`السلة (${cartCount} منتجات)`}
              className="min-h-[44px] px-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBasket className="w-4 h-4" aria-hidden="true" />
              <span key={badgeBounceKey} className="tabular-nums animate-badge-bounce">
                {cartCount} · {formatMad(cartSubtotalMad)}
              </span>
            </button>
          </div>
        </div>
        <ScrollProgressBar />
      </header>

      {/* Mobile Bottom Thumb-Zone Tab Bar (64px; 52.5+64=116.5px <= 15% of 844px) */}
      <nav
        aria-label="شريط التنقل السفلي"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 grid grid-cols-4 items-center px-1"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                isActive ? 'text-emerald-900' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <div className="relative">
                {getTabIcon(item.id, isActive)}
                {item.id === 'cart' && cartCount > 0 && (
                  <span
                    key={badgeBounceKey}
                    className="absolute -top-1.5 -start-2 min-w-[18px] h-[18px] px-1 bg-emerald-800 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums animate-badge-bounce"
                  >
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium whitespace-nowrap leading-none">
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
