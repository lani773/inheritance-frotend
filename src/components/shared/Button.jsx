/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Button Component
   
   Props:
   - variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'gold'
   - size:    'sm' | 'md' | 'lg'
   - fullWidth, loading, disabled, icon, iconRight, type, onClick
   ═══════════════════════════════════════════════════════════════════ */

import React, { useRef } from 'react';

/* ── Variant Styles ───────────────────────────────────────────── */
const VARIANTS = {
  primary: {
    background: 'linear-gradient(135deg, var(--gold-deep), var(--gold))',
    color: 'var(--text-inverse)',
    border: 'none',
    hoverBg: 'linear-gradient(135deg, var(--gold), var(--gold-bright))',
    shadow: '0 4px 16px rgba(201,168,76,0.35)',
  },
  secondary: {
    background: 'var(--bg-raised)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    hoverBg: 'var(--border-subtle)',
    shadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--gold)',
    border: '1px solid var(--border-gold)',
    hoverBg: 'var(--gold-alpha-10)',
    shadow: 'none',
  },
  danger: {
    background: 'var(--bg-error)',
    color: 'var(--color-error)',
    border: '1px solid rgba(239,68,68,0.35)',
    hoverBg: 'rgba(239,68,68,0.2)',
    shadow: 'none',
  },
  subtle: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
    hoverBg: 'rgba(255,255,255,0.05)',
    shadow: 'none',
  },
  success: {
    background: 'var(--bg-success)',
    color: 'var(--color-success)',
    border: '1px solid rgba(34,197,94,0.35)',
    hoverBg: 'rgba(34,197,94,0.2)',
    shadow: 'none',
  },
};

/* ── Size Styles ──────────────────────────────────────────────── */
const SIZES = {
  xs: { padding: '5px 10px', fontSize: '11px', height: '28px', borderRadius: 'var(--radius-sm)' },
  sm: { padding: '7px 14px', fontSize: '12px', height: '34px', borderRadius: 'var(--radius-md)' },
  md: { padding: '10px 20px', fontSize: '13px', height: '42px', borderRadius: 'var(--radius-lg)' },
  lg: { padding: '13px 28px', fontSize: '15px', height: '50px', borderRadius: 'var(--radius-xl)' },
};

/**
 * Button — reusable, accessible button with ripple effect.
 */
function Button({
  children,
  variant   = 'primary',
  size      = 'md',
  type      = 'button',
  fullWidth = false,
  loading   = false,
  disabled  = false,
  icon      = null,      // icon on the left
  iconRight = null,      // icon on the right
  onClick,
  style     = {},
  className = '',
  ...rest
}) {
  const btnRef = useRef(null);
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size]       || SIZES.md;

  // ── Ripple Effect ────────────────────────────────────────────
  const handleClick = (e) => {
    if (disabled || loading) return;

    // Ripple animation
    const btn   = btnRef.current;
    const rect  = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const x     = e.clientX - rect.left;
    const y     = e.clientY - rect.top;

    ripple.style.cssText = `
      position: absolute;
      width: 20px; height: 20px;
      border-radius: 50%;
      background: rgba(255,255,255,0.25);
      transform: translate(-50%, -50%) scale(0);
      animation: ripple 0.6s ease-out forwards;
      left: ${x}px; top: ${y}px;
      pointer-events: none;
    `;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);

    if (onClick) onClick(e);
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      className={className}
      aria-busy={loading}
      style={{
        // Base styles
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        overflow: 'hidden',
        // Variant
        background: v.background,
        color: v.color,
        border: v.border,
        boxShadow: v.shadow,
        // Size
        ...s,
        // Other
        width: fullWidth ? '100%' : 'auto',
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.55 : 1,
        transition: 'all var(--transition-normal)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        // Custom overrides
        ...style,
      }}
      onMouseEnter={e => {
        if (!isDisabled && v.hoverBg) {
          e.currentTarget.style.background = v.hoverBg;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        if (!isDisabled) {
          e.currentTarget.style.background = v.background;
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
      {...rest}
    >
      {/* Left icon */}
      {icon && !loading && (
        <span style={{ fontSize: '1.1em', lineHeight: 1, flexShrink: 0 }}>
          {icon}
        </span>
      )}

      {/* Loading spinner */}
      {loading && (
        <span
          aria-hidden="true"
          style={{
            width: 14,
            height: 14,
            border: `2px solid currentColor`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            flexShrink: 0,
          }}
        />
      )}

      {/* Label */}
      {children && (
        <span>{loading ? 'Loading…' : children}</span>
      )}

      {/* Right icon */}
      {iconRight && !loading && (
        <span style={{ fontSize: '1.1em', lineHeight: 1, flexShrink: 0 }}>
          {iconRight}
        </span>
      )}
    </button>
  );
}

export default Button;
