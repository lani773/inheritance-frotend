/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Avatar Component
   Props: initials, src, size, online, color
   ═══════════════════════════════════════════════════════════════════ */
import React from 'react';

export function Avatar({ initials = '?', src, size = 40, online, color, style = {} }) {
  const fontSize = Math.max(10, size * 0.32);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, ...style }}>
      <div style={{
        width:  size, height: size, borderRadius: '50%',
        background: src ? 'transparent' : `linear-gradient(135deg, ${color || 'var(--gold)'}22, ${color || 'var(--gold)'}55)`,
        border: `2px solid ${color || 'var(--gold)'}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-heading)', fontWeight: 700,
        fontSize, color: color || 'var(--gold)',
        overflow: 'hidden', flexShrink: 0,
        boxShadow: `0 0 0 1px var(--border-subtle)`,
      }}>
        {src
          ? <img src={src} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials}
      </div>
      {online !== undefined && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: Math.max(8, size * 0.22), height: Math.max(8, size * 0.22),
          borderRadius: '50%',
          background: online ? 'var(--color-success)' : 'var(--text-muted)',
          border: `2px solid var(--bg-card)`,
        }} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Badge / Chip                                                    */
/* Props: children, color, bg, size                               */
/* ─────────────────────────────────────────────────────────────── */
export function Badge({ children, color = 'var(--gold)', bg, size = 'sm', style = {} }) {
  const fz = size === 'xs' ? 9 : size === 'sm' ? 10 : 12;
  const py = size === 'xs' ? '1px' : '3px';
  const px = size === 'xs' ? '6px' : '9px';
  return (
    <span style={{
      background: bg || `${color}18`,
      color,
      border: `1px solid ${color}35`,
      borderRadius: 'var(--radius-full)',
      padding: `${py} ${px}`,
      fontSize: fz, fontFamily: 'var(--font-mono)',
      letterSpacing: '0.06em', fontWeight: 500,
      whiteSpace: 'nowrap', display: 'inline-block',
      lineHeight: 1.4, ...style,
    }}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Spinner                                                         */
/* ─────────────────────────────────────────────────────────────── */
export function Spinner({ size = 24, color = 'var(--gold)' }) {
  return (
    <div role="status" aria-label="Loading" style={{
      width: size, height: size, borderRadius: '50%',
      border: `${Math.max(2, size * 0.1)}px solid ${color}30`,
      borderTopColor: color,
      animation: 'spin 0.75s linear infinite',
      flexShrink: 0,
    }} />
  );
}

export const LoadingSpinner = Spinner;

/* ─────────────────────────────────────────────────────────────── */
/* Skeleton — shimmer loading placeholder                         */
/* ─────────────────────────────────────────────────────────────── */
export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, var(--bg-raised) 25%, var(--border-subtle) 50%, var(--bg-raised) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeletonPulse 1.4s ease infinite',
      ...style,
    }} aria-hidden="true" />
  );
}

export function SkeletonCard({ rows = 3, padding = 20 }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Skeleton width={44} height={44} borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={11} />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={12} style={{ marginBottom: 8, width: i === rows - 1 ? '70%' : '100%' }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* EmptyState                                                      */
/* ─────────────────────────────────────────────────────────────── */
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
      gap: 12,
    }}>
      <div style={{ fontSize: 56, opacity: 0.5, marginBottom: 4 }}>{icon}</div>
      {title && (
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h3>
      )}
      {description && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: 360, margin: 0 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* ProgressBar                                                     */
/* ─────────────────────────────────────────────────────────────── */
export function ProgressBar({ value = 0, max = 100, color = 'var(--gold)', height = 6, showLabel = false, animate = true }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>PROGRESS</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, fontWeight: 600 }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div style={{ background: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', height, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: color, borderRadius: 'var(--radius-full)',
          transition: animate ? 'width 0.6s ease' : 'none',
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* StatCard — KPI dashboard card                                   */
/* ─────────────────────────────────────────────────────────────── */
export function StatCard({ icon, value, label, color = 'var(--gold)', trend, subtitle, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid var(--border-subtle)`,
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      ...style,
    }}>
      {/* Accent top */}
      <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
      <div style={{ padding: '18px 20px' }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 30, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color, marginTop: 2 }}>{subtitle}</div>
        )}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>
          {label}
        </div>
        {trend !== undefined && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, color: trend >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Select                                                          */
/* ─────────────────────────────────────────────────────────────── */
export function Select({ label, value, onChange, options = [], placeholder = 'Select…', error, required, disabled, style = {} }) {
  return (
    <div style={{ ...style }}>
      {label && (
        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}{required && <span style={{ color: 'var(--color-error)', marginLeft: 3 }}>*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled}
        required={required}
        style={{
          width: '100%', background: 'var(--bg-input)',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
          outline: 'none', cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235A6B85' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: 36,
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value ?? opt.id ?? opt} value={opt.value ?? opt.id ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p style={{ marginTop: 5, fontSize: 11, color: 'var(--color-error)' }}>{error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Tabs                                                            */
/* ─────────────────────────────────────────────────────────────── */
export function Tabs({ tabs = [], active, onChange, style = {} }) {
  return (
    <div style={{
      display: 'flex', gap: 4,
      borderBottom: '1px solid var(--border-subtle)',
      marginBottom: 24, ...style,
    }}>
      {tabs.map(tab => {
        const isActive = (tab.id ?? tab.value) === active;
        return (
          <button
            key={tab.id ?? tab.value}
            onClick={() => onChange?.(tab.id ?? tab.value)}
            style={{
              padding: '10px 16px', background: 'none', border: 'none',
              borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
              color: isActive ? 'var(--gold)' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)',
              cursor: 'pointer', transition: 'all var(--transition-fast)',
              marginBottom: -1, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <Badge color={isActive ? 'var(--gold)' : 'var(--text-muted)'} size="xs">
                {tab.count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* ConfirmDialog                                                   */
/* ─────────────────────────────────────────────────────────────── */
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

export { Modal, Button, Input };

export function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', confirmVariant = 'danger', loading }) {
  return (
    <Modal
      isOpen={isOpen} onClose={onClose}
      title={title} size="sm"
      accent={confirmVariant === 'danger' ? 'var(--color-error)' : 'var(--gold)'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* SearchInput                                                     */
/* ─────────────────────────────────────────────────────────────── */
export function SearchInput({ value, onChange, placeholder = 'Search…', style = {} }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--text-muted)', pointerEvents: 'none' }}>
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: 'var(--bg-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '9px 14px 9px 38px',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)',
          outline: 'none',
          transition: 'border-color var(--transition-fast)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--border-gold)'}
        onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
      />
      {value && (
        <button
          onClick={() => onChange?.('')}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}
        >
          ×
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Divider                                                         */
/* ─────────────────────────────────────────────────────────────── */
export function Divider({ text, style = {} }) {
  if (!text) return <div style={{ height: 1, background: 'var(--border-subtle)', margin: '20px 0', ...style }} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', ...style }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* PageHeader                                                      */
/* ─────────────────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, actions, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {icon && <span style={{ fontSize: 28 }}>{icon}</span>}
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--text-secondary)', margin: '4px 0 0', fontStyle: 'italic' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* InfoBox — colored alert/info box                               */
/* ─────────────────────────────────────────────────────────────── */
export function InfoBox({ type = 'info', title, children, style = {} }) {
  const colors = {
    info:    { c: 'var(--color-info)',    bg: 'var(--bg-info)'    },
    success: { c: 'var(--color-success)', bg: 'var(--bg-success)' },
    warning: { c: 'var(--color-warning)', bg: 'var(--bg-warning)' },
    error:   { c: 'var(--color-error)',   bg: 'var(--bg-error)'   },
    gold:    { c: 'var(--gold)',          bg: 'var(--gold-alpha-10)' },
  };
  const { c, bg } = colors[type] || colors.info;
  return (
    <div style={{
      background: bg, border: `1px solid ${c}40`,
      borderLeft: `4px solid ${c}`,
      borderRadius: 'var(--radius-md)', padding: '14px 16px',
      fontFamily: 'var(--font-body)', lineHeight: 1.6, ...style,
    }}>
      {title && <strong style={{ color: c, display: 'block', marginBottom: 4 }}>{title}</strong>}
      <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{children}</span>
    </div>
  );
}
