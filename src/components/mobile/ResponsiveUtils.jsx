/**
 * INHERITANCE CHOIR — Mobile Responsive Utilities
 * Hooks and components for consistent mobile experience across all pages.
 */
import React, { useState, useEffect, useCallback } from 'react';

// ── Breakpoints ────────────────────────────────────────────────
export const BREAKPOINTS = { xs:480, sm:640, md:768, lg:1024, xl:1280, '2xl':1400 };

// ── useBreakpoint hook ─────────────────────────────────────────
export function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    width,
    isMobile:  width < BREAKPOINTS.md,
    isTablet:  width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isXS:      width < BREAKPOINTS.xs,
    isSM:      width < BREAKPOINTS.sm,
    lt: (bp) => width < BREAKPOINTS[bp],
    gte:(bp) => width >= BREAKPOINTS[bp],
  };
}

// ── Responsive grid ────────────────────────────────────────────
export function ResponsiveGrid({
  children,
  cols = { xs:1, sm:1, md:2, lg:3, xl:4 },
  gap  = 16,
  style = {},
}) {
  const { width } = useBreakpoint();
  let numCols = cols.xl || cols.lg || 3;
  if (width < BREAKPOINTS['2xl']) numCols = cols.xl || numCols;
  if (width < BREAKPOINTS.xl)    numCols = cols.lg  || numCols;
  if (width < BREAKPOINTS.lg)    numCols = cols.md  || 2;
  if (width < BREAKPOINTS.md)    numCols = cols.sm  || 1;
  if (width < BREAKPOINTS.sm)    numCols = cols.xs  || 1;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${numCols}, 1fr)`,
      gap,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Responsive stack (horizontal on desktop, vertical on mobile) ─
export function ResponsiveStack({
  children, gap = 12, reverseOnMobile = false, style = {},
}) {
  const { isMobile } = useBreakpoint();
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? (reverseOnMobile ? 'column-reverse' : 'column') : 'row',
      gap,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Bottom navigation for mobile ───────────────────────────────
export function MobileBottomNav({ items = [], activePath }) {
  const { isMobile } = useBreakpoint();
  if (!isMobile) return null;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: 'linear-gradient(180deg, rgba(10,22,40,0.95), rgba(10,22,40,1))',
      borderTop: '1px solid #1E2D4A',
      backdropFilter: 'blur(20px)',
      display: 'flex', justifyContent: 'space-around',
      padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
    }}>
      {items.map(item => {
        const active = activePath?.startsWith(item.path);
        return (
          <a
            key={item.path}
            href={item.path}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 16px', textDecoration: 'none',
              color: active ? '#C9A84C' : '#64748B',
              transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            {item.badge && (
              <div style={{
                position: 'absolute', top: 2, right: 10,
                width: 16, height: 16, borderRadius: '50%',
                background: '#EF4444', fontSize: 9, fontWeight: 800,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'DM Mono, monospace',
              }}>
                {item.badge > 9 ? '9+' : item.badge}
              </div>
            )}
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: '0.03em', fontWeight: active ? 700 : 400 }}>
              {item.label}
            </span>
            {active && (
              <div style={{ position: 'absolute', bottom: -8, width: 20, height: 2, borderRadius: 1, background: '#C9A84C' }} />
            )}
          </a>
        );
      })}
    </nav>
  );
}

// ── Swipeable card ─────────────────────────────────────────────
export function SwipeableCard({ onSwipeLeft, onSwipeRight, children, style = {} }) {
  const [startX, setStartX] = useState(null);
  const [offset,  setOffset]  = useState(0);
  const [swiping, setSwiping] = useState(false);
  const THRESHOLD = 80;

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!startX) return;
    const dx = e.touches[0].clientX - startX;
    setOffset(dx);
  };

  const handleTouchEnd = () => {
    if (offset < -THRESHOLD && onSwipeLeft)  onSwipeLeft();
    if (offset > THRESHOLD  && onSwipeRight) onSwipeRight();
    setOffset(0);
    setSwiping(false);
    setStartX(null);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${offset * 0.3}px)`,
        transition: swiping ? 'none' : 'transform 0.3s ease',
        opacity: 1 - Math.abs(offset) / 400,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Pull-to-refresh ────────────────────────────────────────────
export function PullToRefresh({ onRefresh, children }) {
  const [pulling,    setPulling]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullY,      setPullY]      = useState(0);
  const THRESHOLD = 70;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) setPulling(true);
  };

  const handleTouchMove = (e) => {
    if (!pulling) return;
    const dy = e.touches[0].clientY - (e.touches[0].clientY - pullY);
    setPullY(Math.max(0, Math.min(dy, 120)));
  };

  const handleTouchEnd = async () => {
    if (pullY >= THRESHOLD && onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPulling(false);
    setPullY(0);
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {(pulling || refreshing) && pullY > 10 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          height: pullY, overflow: 'hidden', transition: 'height 0.2s',
        }}>
          <div style={{
            width: 28, height: 28, border: '2px solid #1E2D4A',
            borderTop: `2px solid ${refreshing ? '#22C55E' : '#C9A84C'}`,
            borderRadius: '50%',
            animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
            transform: `rotate(${pullY * 3}deg)`,
          }} />
        </div>
      )}
      {children}
    </div>
  );
}

// ── Safe area inset padding ────────────────────────────────────
export function SafeAreaWrapper({ children, style = {} }) {
  return (
    <div style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Truncate with read more ────────────────────────────────────
export function TruncatedText({ text = '', lines = 3, style = {} }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > lines * 60;

  return (
    <div>
      <p style={{
        margin: 0,
        display: expanded ? 'block' : '-webkit-box',
        WebkitLineClamp: expanded ? 'unset' : lines,
        WebkitBoxOrient: 'vertical',
        overflow: expanded ? 'visible' : 'hidden',
        ...style,
      }}>
        {text}
      </p>
      {isLong && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontSize: 12, padding: '4px 0 0' }}
        >
          Read more…
        </button>
      )}
    </div>
  );
}
