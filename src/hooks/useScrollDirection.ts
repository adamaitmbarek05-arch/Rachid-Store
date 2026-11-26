import { useEffect, useRef, useState } from 'react';

export type ScrollDirection = 'down' | 'up';

export interface ScrollMotionState {
  direction: ScrollDirection;
  isScrolled: boolean;
  showScrollTop: boolean;
}

const scrollDirectionRef = { current: 'down' as ScrollDirection };

export function getCurrentScrollDirection(): ScrollDirection {
  return scrollDirectionRef.current;
}

export function useScrollDirection(): ScrollMotionState {
  const [state, setState] = useState<ScrollMotionState>({
    direction: 'down',
    isScrolled: false,
    showScrollTop: false,
  });
  const lastYRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateCssVars = (y: number, dir: ScrollDirection) => {
      const docEl = document.documentElement;
      const maxScroll = Math.max(1, docEl.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, y / maxScroll));
      docEl.style.setProperty('--scroll-progress', progress.toFixed(4));
      docEl.style.setProperty('--scroll-y', `${Math.round(y)}px`);
      docEl.dataset.scrollDir = dir;
    };

    lastYRef.current = window.scrollY || 0;
    updateCssVars(lastYRef.current, 'down');

    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const currentY = Math.max(0, window.scrollY || 0);
        const delta = currentY - lastYRef.current;

        let nextDir = scrollDirectionRef.current;
        if (delta > 3) {
          nextDir = 'down';
        } else if (delta < -3) {
          nextDir = 'up';
        }

        scrollDirectionRef.current = nextDir;
        lastYRef.current = currentY;
        updateCssVars(currentY, nextDir);

        const nextScrolled = currentY > 24;
        const nextShowTop = currentY > 420;

        setState((prev) => {
          if (
            prev.direction === nextDir &&
            prev.isScrolled === nextScrolled &&
            prev.showScrollTop === nextShowTop
          ) {
            return prev;
          }
          return {
            direction: nextDir,
            isScrolled: nextScrolled,
            showScrollTop: nextShowTop,
          };
        });
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return state;
}
