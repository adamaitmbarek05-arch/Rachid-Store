import { ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { getCurrentScrollDirection, ScrollDirection } from '../hooks/useScrollDirection';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  immediate?: boolean;
}

export function ScrollReveal({
  children,
  className = '',
  delayMs = 0,
  immediate = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(immediate);
  const [enterDir, setEnterDir] = useState<ScrollDirection>('down');

  useEffect(() => {
    const el = ref.current;
    if (!el || immediate) return;

    // Elements already in or near initial viewport appear immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.96 && rect.bottom > 0) {
      setVisible(true);
    }

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEnterDir(getCurrentScrollDirection());
            setVisible(true);
          } else {
            // Re-arm reveal cleanly only when completely outside viewport
            setEnterDir(getCurrentScrollDirection());
            setVisible(false);
          }
        }
      },
      {
        threshold: 0,
        rootMargin: '120px 0px 120px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate]);

  return (
    <div
      ref={ref}
      data-reveal={visible ? 'shown' : enterDir}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`scroll-reveal ${
        visible
          ? 'scroll-reveal-visible'
          : enterDir === 'up'
            ? 'scroll-reveal-hidden-up'
            : 'scroll-reveal-hidden-down'
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface ScrollParallaxFrameProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export function ScrollParallaxFrame({
  children,
  className = '',
  intensity = 16,
}: ScrollParallaxFrameProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let rafId: number | null = null;
    const updateParallax = () => {
      rafId = null;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      const centerProgress = (rect.top + rect.height / 2 - vh / 2) / vh;
      const clamped = Math.max(-1, Math.min(1, centerProgress));
      const shiftY = clamped * -intensity;
      el.style.setProperty('--parallax-y', `${shiftY.toFixed(1)}px`);
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [intensity]);

  return (
    <div ref={ref} className={`scroll-parallax-layer ${className}`}>
      {children}
    </div>
  );
}

export function ScrollProgressBar() {
  return (
    <div
      aria-hidden="true"
      className="h-[2.5px] w-full bg-zinc-200/50 overflow-hidden pointer-events-none"
    >
      <div className="scroll-progress-fill h-full w-full bg-gradient-to-l from-emerald-900 via-emerald-700 to-amber-500 origin-right" />
    </div>
  );
}

interface ScrollToTopButtonProps {
  visible: boolean;
  direction: ScrollDirection;
}

export function ScrollToTopButton({ visible, direction }: ScrollToTopButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="العودة إلى أعلى الصفحة"
      className={`fixed bottom-20 md:bottom-6 start-4 md:start-6 z-30 min-h-[44px] px-3.5 rounded-xl bg-emerald-900/95 hover:bg-emerald-800 text-white text-xs font-semibold shadow-lg backdrop-blur-sm flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
        visible
          ? direction === 'up'
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-85 translate-y-0 scale-95'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-4 h-4" aria-hidden="true" />
      <span>للأعلى</span>
    </button>
  );
}
