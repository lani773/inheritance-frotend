/**
 * INHERITANCE CHOIR — RBAC Visual Components
 * Permission-aware UI building blocks.
 */
import React, { useState } from 'react';
import { usePermissions } from '../../context/PermissionsContext';

// ── Permission Gate (re-export enhanced) ──────────────────────
export { Gate } from '../../context/PermissionsContext';

// ── Role Badge ─────────────────────────────────────────────────
const ROLE_STYLES = {
  president:       { bg: '#C9A84C22', border: '#C9A84C', color: '#C9A84C', icon: '♛', label: 'President' },
  vp_welfare:      { bg: '#EC489922', border: '#EC4899', color: '#EC4899', icon: '♡', label: 'VP Welfare' },
  secretary:       { bg: '#8B5CF622', border: '#8B5CF6', color: '#8B5CF6', icon: '✎', label: 'Secretary' },
  treasurer:       { bg: '#22C55E22', border: '#22C55E', color: '#22C55E', icon: '◇', label: 'Treasurer' },
  choir_director:  { bg: '#06B6D422', border: '#06B6D4', color: '#06B6D4', icon: '♩', label: 'Choir Director' },
  attendance_lead: { bg: '#F59E0B22', border: '#F59E0B', color: '#F59E0B', icon: '✅', label: 'Attendance Lead' },
  section_lead:    { bg: '#3B82F622', border: '#3B82F6', color: '#3B82F6', icon: '◈', label: 'Section Lead' },
  member:          { bg: '#94A3B822', border: '#94A3B8', color: '#94A3B8', icon: '◎', label: 'Member' },
};

export function RoleBadge({ role, size = 'sm', showLabel = true }) {
  const style = ROLE_STYLES[role] || ROLE_STYLES.member;
  const sz = size === 'lg' ? { px: 14, py: 6, fontSize: 13, iconSize: 16 }
           : size === 'md' ? { px: 10, py: 4, fontSize: 12, iconSize: 14 }
           :                 { px:  8, py: 3, fontSize: 11, iconSize: 12 };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: `${sz.py}px ${sz.px}px`,
      background: style.bg,
      border: `1px solid ${style.border}44`,
      borderRadius: 8,
      fontSize: sz.fontSize,
      color: style.color,
      fontWeight: 600,
      letterSpacing: '0.03em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: sz.iconSize }}>{style.icon}</span>
      {showLabel && style.label}
    </span>
  );
}

// ── Permission Status Panel (for settings/debug) ───────────────
export function PermissionPanel() {
  const { role, permissions, isAdmin } = usePermissions();
  const [open, setOpen] = useState(false);

  const grouped = {};
  permissions.forEach(p => {
    const [resource] = p.split(':');
    if (!grouped[resource]) grouped[resource] = [];
    grouped[resource].push(p.split(':').slice(1).join(':'));
  });

  return (
    <div style={{ fontFamily: 'DM Mono, monospace' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 8, padding: '8px 14px', color: '#C9A84C',
          fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <span>🔐</span>
        <span>Your Permissions ({permissions.size} grants)</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          marginTop: 8, background: '#0A1628', border: '1px solid #1E2D4A',
          borderRadius: 12, padding: 20,
        }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <RoleBadge role={role} size="md" />
            {isAdmin && (
              <span style={{
                background: '#C9A84C22', border: '1px solid #C9A84C44',
                borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#C9A84C',
              }}>
                ADMIN OVERRIDE
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {Object.entries(grouped).map(([resource, actions]) => (
              <div key={resource} style={{
                background: '#141E33', borderRadius: 8, padding: '10px 12px',
                border: '1px solid #1E2D4A',
              }}>
                <div style={{ color: '#C9A84C', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {resource}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {actions.map(a => (
                    <span key={a} style={{
                      background: '#0F172A', border: '1px solid #22C55E33',
                      borderRadius: 4, padding: '1px 6px', fontSize: 10, color: '#22C55E',
                    }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Action Button with Permission Check ────────────────────────
export function PermissionButton({
  permission, children, onClick,
  style = {}, disabled = false,
  tooltip = 'You do not have permission for this action',
  ...props
}) {
  const { can } = usePermissions();
  const allowed = !permission || can(permission);

  if (!allowed) {
    return (
      <button
        disabled
        title={tooltip}
        style={{
          opacity: 0.35, cursor: 'not-allowed', position: 'relative',
          ...style,
        }}
        {...props}
      >
        {children}
        <span style={{
          position: 'absolute', top: -2, right: -2,
          width: 14, height: 14, borderRadius: '50%',
          background: '#EF4444', fontSize: 9, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          🔒
        </span>
      </button>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} style={style} {...props}>
      {children}
    </button>
  );
}

// ── Role Switcher (dev tool) ───────────────────────────────────
export function RoleIndicator() {
  const { role, isAdmin } = usePermissions();
  const style = ROLE_STYLES[role] || ROLE_STYLES.member;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px',
      background: `${style.color}11`,
      border: `1px solid ${style.color}33`,
      borderRadius: 20,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: style.color,
        boxShadow: `0 0 6px ${style.color}`,
      }} />
      <span style={{ fontSize: 12, color: style.color, fontWeight: 600 }}>
        {style.icon} {style.label}
      </span>
      {isAdmin && (
        <span style={{ fontSize: 10, color: '#C9A84C', opacity: 0.8 }}>★ Admin</span>
      )}
    </div>
  );
}
