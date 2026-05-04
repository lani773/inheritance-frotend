/**
 * INHERITANCE CHOIR — API Key Manager
 * Create, view, rotate, and revoke API keys for external integrations.
 * Keys are scoped with granular permissions.
 */
import React, { useState, useCallback } from 'react';
import { useNotifications } from '../../context/NotificationsContext';
import { Gate } from '../../context/PermissionsContext';

// ── Permission scopes ──────────────────────────────────────────
const SCOPES = [
  { id: 'members:read',        label: 'Read Members',        category: 'Members' },
  { id: 'members:write',       label: 'Write Members',       category: 'Members' },
  { id: 'events:read',         label: 'Read Events',         category: 'Events'  },
  { id: 'events:write',        label: 'Write Events',        category: 'Events'  },
  { id: 'contributions:read',  label: 'Read Contributions',  category: 'Finance' },
  { id: 'contributions:write', label: 'Write Contributions', category: 'Finance' },
  { id: 'attendance:read',     label: 'Read Attendance',     category: 'Attendance' },
  { id: 'attendance:write',    label: 'Write Attendance',    category: 'Attendance' },
  { id: 'analytics:read',      label: 'Read Analytics',      category: 'Reports' },
  { id: 'reports:generate',    label: 'Generate Reports',    category: 'Reports' },
  { id: 'notifications:send',  label: 'Send Notifications',  category: 'Comms'   },
  { id: 'webhooks:manage',     label: 'Manage Webhooks',     category: 'Webhooks'},
];

const SCOPE_CATEGORIES = [...new Set(SCOPES.map(s => s.category))];

// ── Sample keys ────────────────────────────────────────────────
const SAMPLE_KEYS = [
  {
    id: 'key_1',
    name: 'Church Website Integration',
    key: 'ic_live_sk_a3f8b2c1d9e4f5a6b7c8d9e0f1a2b3c4',
    maskedKey: 'ic_live_sk_a3f8•••••••••••••••b3c4',
    scopes: ['members:read', 'events:read', 'contributions:read'],
    status: 'active',
    lastUsed: new Date(Date.now() - 3600000).toISOString(),
    createdAt: '2026-01-15',
    expiresAt: '2027-01-15',
    requestCount: 2847,
    rateLimit: '1000/hour',
  },
  {
    id: 'key_2',
    name: 'WhatsApp Bot',
    key: 'ic_live_sk_b4c9d0e5f6a7b8c9d0e1f2a3b4c5d6e7',
    maskedKey: 'ic_live_sk_b4c9•••••••••••••••d6e7',
    scopes: ['members:read', 'notifications:send', 'attendance:read'],
    status: 'active',
    lastUsed: new Date(Date.now() - 86400000).toISOString(),
    createdAt: '2026-02-01',
    expiresAt: null,
    requestCount: 14923,
    rateLimit: '500/hour',
  },
  {
    id: 'key_3',
    name: 'Legacy SMS Gateway',
    key: 'ic_live_sk_c5d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
    maskedKey: 'ic_live_sk_c5d0•••••••••••••••e3f4',
    scopes: ['notifications:send'],
    status: 'revoked',
    lastUsed: new Date(Date.now() - 30 * 86400000).toISOString(),
    createdAt: '2025-12-01',
    expiresAt: null,
    requestCount: 891,
    rateLimit: '100/hour',
  },
];

const RATE_LIMITS = ['100/hour', '500/hour', '1000/hour', '5000/hour', 'Unlimited'];
const EXPIRY_OPTIONS = [
  { label: 'No expiry',  value: null },
  { label: '30 days',   value: 30   },
  { label: '90 days',   value: 90   },
  { label: '1 year',    value: 365  },
  { label: '2 years',   value: 730  },
];

function fmtRelTime(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

// ── Key card ──────────────────────────────────────────────────
function KeyCard({ keyObj, onRevoke, onRotate, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  const [showing,  setShowing]  = useState(false);
  const isRevoked  = keyObj.status === 'revoked';
  const isExpired  = keyObj.expiresAt && new Date(keyObj.expiresAt) < new Date();

  const statusColor = isRevoked || isExpired ? '#EF4444' : '#22C55E';
  const statusLabel = isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active';

  return (
    <div style={{
      background: isRevoked ? 'rgba(239,68,68,0.03)' : '#0F172A',
      border: `1px solid ${isRevoked ? '#EF444422' : '#1E2D4A'}`,
      borderRadius: 16, overflow: 'hidden',
      opacity: isRevoked ? 0.7 : 1,
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer' }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: isRevoked ? '#EF444411' : 'rgba(201,168,76,0.1)',
          border: `1px solid ${isRevoked ? '#EF444433' : 'rgba(201,168,76,0.25)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          🔑
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF' }}>{keyObj.name}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: statusColor,
              background: `${statusColor}11`, border: `1px solid ${statusColor}33`,
              borderRadius: 4, padding: '1px 6px',
            }}>
              {statusLabel}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#374151', fontFamily: 'DM Mono, monospace' }}>
              {keyObj.maskedKey}
            </span>
            <span style={{ fontSize: 11, color: '#64748B' }}>
              {keyObj.requestCount.toLocaleString()} requests
            </span>
            <span style={{ fontSize: 11, color: '#64748B' }}>
              Last used {fmtRelTime(keyObj.lastUsed)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {!isRevoked && (
            <>
              <button
                onClick={e => { e.stopPropagation(); onCopy(keyObj.key); }}
                style={{ background: 'none', border: '1px solid #1E2D4A', borderRadius: 6, padding: '4px 10px', color: '#94A3B8', cursor: 'pointer', fontSize: 11 }}
              >
                Copy
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRotate(keyObj.id); }}
                style={{ background: 'none', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '4px 10px', color: '#F59E0B', cursor: 'pointer', fontSize: 11 }}
              >
                Rotate
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRevoke(keyObj.id); }}
                style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 10px', color: '#EF4444', cursor: 'pointer', fontSize: 11 }}
              >
                Revoke
              </button>
            </>
          )}
          <span style={{ color: '#374151', fontSize: 14 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #1E2D4A' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, margin: '16px 0' }}>
            {[
              { label: 'Rate Limit',   value: keyObj.rateLimit },
              { label: 'Created',      value: keyObj.createdAt },
              { label: 'Expires',      value: keyObj.expiresAt || 'Never' },
              { label: 'Total Requests', value: keyObj.requestCount.toLocaleString() },
            ].map(s => (
              <div key={s.label} style={{ background: '#141E33', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ margin: 0, fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#F0F4FF', fontFamily: 'DM Mono, monospace' }}>{s.value}</p>
              </div>
            ))}
          </div>

          <p style={{ margin: '0 0 8px', fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scopes</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {keyObj.scopes.map(scope => (
              <span key={scope} style={{
                fontSize: 11, color: '#C9A84C', background: 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.25)', borderRadius: 6, padding: '2px 8px',
                fontFamily: 'DM Mono, monospace',
              }}>
                {scope}
              </span>
            ))}
          </div>

          {/* Full key (with toggle) */}
          {!isRevoked && (
            <div style={{ marginTop: 16 }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Full API Key
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{
                  flex: 1, background: '#141E33', border: '1px solid #1E2D4A',
                  borderRadius: 8, padding: '8px 12px',
                  fontFamily: 'DM Mono, monospace', fontSize: 12,
                  color: showing ? '#C9A84C' : '#374151',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {showing ? keyObj.key : keyObj.maskedKey}
                </div>
                <button
                  onClick={() => setShowing(s => !s)}
                  style={{ background: 'none', border: '1px solid #1E2D4A', borderRadius: 8, padding: '6px 10px', color: '#94A3B8', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
                >
                  {showing ? '🙈' : '👁'}
                </button>
                <button
                  onClick={() => onCopy(keyObj.key)}
                  style={{ background: 'none', border: '1px solid #1E2D4A', borderRadius: 8, padding: '6px 10px', color: '#C9A84C', cursor: 'pointer', fontSize: 11, flexShrink: 0 }}
                >
                  Copy
                </button>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 10, color: '#374151' }}>
                ⚠ Keep this key secret. Never expose it in frontend code or version control.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Create Key Modal ──────────────────────────────────────────
function CreateKeyModal({ onClose, onCreate }) {
  const [name,        setName]        = useState('');
  const [selectedScopes, setSelectedScopes] = useState([]);
  const [rateLimit,   setRateLimit]   = useState('1000/hour');
  const [expiry,      setExpiry]      = useState(null);
  const [creating,    setCreating]    = useState(false);
  const [newKey,      setNewKey]      = useState(null);

  const toggleScope = (scope) => setSelectedScopes(s =>
    s.includes(scope) ? s.filter(x => x !== scope) : [...s, scope]
  );

  const selectCategory = (cat) => {
    const catScopes = SCOPES.filter(s => s.category === cat).map(s => s.id);
    const allSelected = catScopes.every(s => selectedScopes.includes(s));
    setSelectedScopes(prev =>
      allSelected ? prev.filter(s => !catScopes.includes(s)) : [...new Set([...prev, ...catScopes])]
    );
  };

  const handleCreate = async () => {
    if (!name || selectedScopes.length === 0) return;
    setCreating(true);
    await new Promise(r => setTimeout(r, 800));

    const key = `ic_live_sk_${Array.from({length:32}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('')}`;
    const keyObj = {
      id: `key_${Date.now()}`,
      name, key,
      maskedKey: `${key.slice(0, 16)}•••••••••••••••${key.slice(-4)}`,
      scopes: selectedScopes,
      status: 'active',
      lastUsed: null,
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: expiry ? new Date(Date.now() + expiry * 86400000).toISOString().split('T')[0] : null,
      requestCount: 0,
      rateLimit,
    };
    setNewKey({ ...keyObj });
    onCreate(keyObj);
    setCreating(false);
  };

  if (newKey) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
          <h3 style={{ color: '#22C55E', fontFamily: 'Cinzel, serif', margin: '0 0 8px' }}>API Key Created!</h3>
          <p style={{ color: '#94A3B8', fontSize: 13 }}>Copy this key now — it won't be shown again.</p>
        </div>
        <div style={{
          background: '#141E33', border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 10, padding: '14px 16px', marginBottom: 16,
          fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#C9A84C',
          wordBreak: 'break-all', lineHeight: 1.6,
        }}>
          {newKey.key}
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(newKey.key); }}
          style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #A07820, #C9A84C)', border: 'none', borderRadius: 10, color: '#080C14', fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}
        >
          📋 Copy API Key
        </button>
        <button onClick={onClose} style={{ width: '100%', padding: '10px', background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 10, color: '#94A3B8', cursor: 'pointer' }}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Crimson Pro, serif', color: '#F0F4FF' }}>
      <h3 style={{ margin: '0 0 20px', fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>Create API Key</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Key Name *
          </label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Church Website Integration"
            style={{ width: '100%', background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 10, padding: '10px 14px', color: '#F0F4FF', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Permission Scopes * ({selectedScopes.length} selected)
          </label>
          {SCOPE_CATEGORIES.map(cat => {
            const catScopes = SCOPES.filter(s => s.category === cat);
            const allSelected = catScopes.every(s => selectedScopes.includes(s.id));
            return (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <button onClick={() => selectCategory(cat)} style={{
                    fontSize: 11, color: allSelected ? '#C9A84C' : '#64748B',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700,
                  }}>
                    {allSelected ? '☑' : '☐'} {cat}
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 16 }}>
                  {catScopes.map(scope => {
                    const selected = selectedScopes.includes(scope.id);
                    return (
                      <button key={scope.id} onClick={() => toggleScope(scope.id)} style={{
                        padding: '4px 10px', borderRadius: 6, border: 'none',
                        background: selected ? 'rgba(201,168,76,0.15)' : '#141E33',
                        color: selected ? '#C9A84C' : '#64748B',
                        fontSize: 11, cursor: 'pointer', fontFamily: 'DM Mono, monospace',
                        boxShadow: selected ? '0 0 0 1px rgba(201,168,76,0.3)' : 'none',
                        transition: 'all 0.15s',
                      }}>
                        {scope.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rate Limit</label>
            <select value={rateLimit} onChange={e => setRateLimit(e.target.value)} style={{ width: '100%', background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 8, padding: '9px 10px', color: '#F0F4FF', fontSize: 13 }}>
              {RATE_LIMITS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Expiry</label>
            <select value={expiry} onChange={e => setExpiry(e.target.value ? Number(e.target.value) : null)} style={{ width: '100%', background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 8, padding: '9px 10px', color: '#F0F4FF', fontSize: 13 }}>
              {EXPIRY_OPTIONS.map(o => <option key={o.label} value={o.value ?? ''}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 10, color: '#94A3B8', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name || selectedScopes.length === 0 || creating}
            style={{
              flex: 2, padding: '10px',
              background: name && selectedScopes.length > 0 ? 'linear-gradient(135deg, #A07820, #C9A84C)' : '#1E2D4A',
              border: 'none', borderRadius: 10, color: '#080C14', fontSize: 13, fontWeight: 700,
              cursor: name && selectedScopes.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {creating ? '⏳ Creating…' : '🔑 Create API Key'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function APIKeyManager() {
  const [keys,      setKeys]      = useState(SAMPLE_KEYS);
  const [showCreate, setShowCreate] = useState(false);
  const { toast }                 = useNotifications();

  const handleRevoke = useCallback((id) => {
    setKeys(ks => ks.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
    toast('API key revoked', { type: 'warning' });
  }, [toast]);

  const handleRotate = useCallback((id) => {
    const newKey = `ic_live_sk_${Array.from({length:32}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('')}`;
    setKeys(ks => ks.map(k => k.id === id ? {
      ...k, key: newKey,
      maskedKey: `${newKey.slice(0, 16)}•••••••••••••••${newKey.slice(-4)}`,
    } : k));
    navigator.clipboard.writeText(newKey).catch(() => {});
    toast('Key rotated — new key copied to clipboard', { type: 'success' });
  }, [toast]);

  const handleCopy = useCallback((key) => {
    navigator.clipboard.writeText(key).catch(() => {});
    toast('Copied to clipboard', { type: 'success' });
  }, [toast]);

  const handleCreate = useCallback((keyObj) => {
    setKeys(ks => [keyObj, ...ks]);
  }, []);

  const active  = keys.filter(k => k.status === 'active').length;
  const revoked = keys.filter(k => k.status === 'revoked').length;

  return (
    <div style={{ fontFamily: 'Crimson Pro, serif', color: '#F0F4FF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>🔑 API Key Management</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            {active} active · {revoked} revoked · Integrate external systems securely
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #A07820, #C9A84C)', border: 'none', borderRadius: 10, color: '#080C14', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          + Create Key
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
          onClick={e => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div style={{
            background: '#0F172A', border: '1px solid #1E2D4A',
            borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
            animation: 'scaleIn 0.2s ease',
          }}>
            <CreateKeyModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
          </div>
        </div>
      )}

      {/* Security notice */}
      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚠</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>Security best practices</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>
            Never expose API keys in frontend code or public repositories. Use environment variables on your server. Rotate keys every 90 days.
          </p>
        </div>
      </div>

      {/* Keys list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {keys.map(k => (
          <KeyCard key={k.id} keyObj={k} onRevoke={handleRevoke} onRotate={handleRotate} onCopy={handleCopy} />
        ))}
      </div>
    </div>
  );
}
