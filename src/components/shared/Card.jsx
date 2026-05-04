/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Card Component
   
   Props: accent (color), style, children, padding, hoverable, onClick
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';

/**
 * Card — main content container with optional color accent stripe.
 */
export function Card({
  children,
  accent    = null,   // top border accent color (e.g. '#C9A84C')
  padding   = 20,
  hoverable = false,
  onClick,
  style     = {},
  className = '',
}) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: hoverable ? 'all var(--transition-normal)' : 'none',
        ...style,
      }}
      onMouseEnter={hoverable && onClick ? e => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      } : undefined}
      onMouseLeave={hoverable && onClick ? e => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      } : undefined}
    >
      {/* Top accent stripe */}
      {accent && (
        <div
          aria-hidden="true"
          style={{
            height: 3,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />
      )}
      {/* Content */}
      <div style={{ padding }}>
        {children}
      </div>
    </div>
  );
}

/**
 * CardHeader — standard card header with title and optional action.
 */
export function CardHeader({ title, subtitle, action, icon, accentColor }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
        <div>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: accentColor || 'var(--gold)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              margin: '2px 0 0',
              fontFamily: 'var(--font-body)',
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

export default Card;
