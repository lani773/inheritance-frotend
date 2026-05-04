/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Modal Component
   Accessible, animated dialog overlay.
   Props: isOpen, onClose, title, size, children, footer, noCloseBtn
   ═══════════════════════════════════════════════════════════════════ */
import React, { useEffect, useRef } from 'react';

const SIZES = {
  sm:   480,
  md:   600,
  lg:   780,
  xl:   980,
  full: '95vw',
};

function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size       = 'md',
  children,
  footer,
  noCloseBtn = false,
  accent     = null,
  style      = {},
}) {
  const panelRef = useRef(null);

  /* ── Close on Escape ──────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  /* ── Focus trap ───────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const maxW = typeof SIZES[size] === 'number' ? `${SIZES[size]}px` : SIZES[size];

  return (
    /* Backdrop */
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position:   'fixed',
        inset:      0,
        background: 'var(--bg-overlay)',
        zIndex:     'var(--z-modal)',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:    '20px 16px',
        animation:  'fadeIn 0.2s ease both',
        backdropFilter: 'blur(4px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        style={{
          background:   'var(--bg-card)',
          border:       '1px solid var(--border-default)',
          borderRadius: 'var(--radius-2xl)',
          width:        '100%',
          maxWidth:     maxW,
          maxHeight:    '90vh',
          display:      'flex',
          flexDirection:'column',
          overflow:     'hidden',
          animation:    'scaleIn 0.25s ease both',
          outline:      'none',
          boxShadow:    'var(--shadow-lg)',
          ...style,
        }}
      >
        {/* Accent stripe */}
        {accent && (
          <div style={{
            height: 3,
            background: `linear-gradient(90deg,transparent,${accent},transparent)`,
            flexShrink: 0,
          }} />
        )}

        {/* Header */}
        {(title || !noCloseBtn) && (
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '20px 24px 0',
            flexShrink:     0,
          }}>
            <div>
              {title && (
                <h2 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize:   'var(--text-xl)',
                  fontWeight: 700,
                  color:      'var(--text-primary)',
                  margin:     0,
                }}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize:   'var(--text-sm)',
                  color:      'var(--text-secondary)',
                  margin:     '4px 0 0',
                }}>
                  {subtitle}
                </p>
              )}
            </div>
            {!noCloseBtn && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                style={{
                  width:        36,
                  height:       36,
                  borderRadius: 'var(--radius-md)',
                  border:       '1px solid var(--border-subtle)',
                  background:   'var(--bg-raised)',
                  color:        'var(--text-secondary)',
                  cursor:       'pointer',
                  fontSize:     18,
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  transition:   'all var(--transition-fast)',
                  flexShrink:   0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--color-error)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'var(--color-error)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-raised)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{
          flex:       1,
          overflowY:  'auto',
          padding:    '20px 24px',
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding:    '16px 24px 20px',
            borderTop:  '1px solid var(--border-subtle)',
            display:    'flex',
            justifyContent: 'flex-end',
            gap:        10,
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
