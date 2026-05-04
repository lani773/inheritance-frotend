/**
 * INHERITANCE CHOIR — Financial Module: Budget Planner + Mobile Money
 */
import React, { useState, useMemo } from 'react';

// ══════════════════════════════════════════════════════════════
// BUDGET PLANNER
// ══════════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: 'tithe',       label: 'Tithes',         color: '#C9A84C', icon: '🏛️' },
  { id: 'offering',    label: 'Offerings',      color: '#3B82F6', icon: '💝' },
  { id: 'welfare',     label: 'Welfare Fund',   color: '#EC4899', icon: '❤️' },
  { id: 'fundraiser',  label: 'Fundraising',    color: '#22C55E', icon: '🌿' },
  { id: 'operations',  label: 'Operations',     color: '#8B5CF6', icon: '⚙️' },
  { id: 'outreach',    label: 'Outreach',       color: '#06B6D4', icon: '🌍' },
];

export function BudgetPlanner() {
  const year = new Date().getFullYear();
  const [budgets, setBudgets] = useState({
    tithe:      { target: 1200000, actual: 890000 },
    offering:   { target:  480000, actual: 312000 },
    welfare:    { target:  240000, actual: 180000 },
    fundraiser: { target:  600000, actual: 415000 },
    operations: { target:  180000, actual: 210000 },
    outreach:   { target:  120000, actual:  60000 },
  });

  const [editing, setEditing]   = useState(null);
  const [editVal, setEditVal]   = useState('');
  const [expenses, setExpenses] = useState([
    { id: 1, category: 'operations', description: 'Sound equipment maintenance', amount: 45000, date: '2026-03-15' },
    { id: 2, category: 'outreach',   description: 'Community outreach transport',amount: 28000, date: '2026-03-10' },
  ]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: 'operations', description: '', amount: '', date: '' });

  const totals = useMemo(() => {
    const target = Object.values(budgets).reduce((s, b) => s + b.target, 0);
    const actual = Object.values(budgets).reduce((s, b) => s + b.actual, 0);
    const surplus = actual - Object.values(expenses).reduce((s, e) => s + e.amount, 0);
    return { target, actual, surplus };
  }, [budgets, expenses]);

  const saveTarget = (catId) => {
    const val = parseInt(editVal.replace(/,/g, '')) || 0;
    setBudgets(b => ({ ...b, [catId]: { ...b[catId], target: val } }));
    setEditing(null);
  };

  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    setExpenses(e => [...e, { ...newExpense, id: Date.now(), amount: parseInt(newExpense.amount) }]);
    setNewExpense({ category: 'operations', description: '', amount: '', date: '' });
    setShowAddExpense(false);
  };

  return (
    <div style={{ color: '#F0F4FF', fontFamily: 'Crimson Pro, serif' }}>
      {/* Year header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
            {year} Budget Overview
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Track income targets vs actuals
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <StatPill label="Target"  value={`RWF ${(totals.target/1000).toFixed(0)}K`} color="#C9A84C" />
          <StatPill label="Actual"  value={`RWF ${(totals.actual/1000).toFixed(0)}K`} color="#22C55E" />
          <StatPill label={totals.surplus >= 0 ? 'Surplus' : 'Deficit'}
                    value={`RWF ${(Math.abs(totals.surplus)/1000).toFixed(0)}K`}
                    color={totals.surplus >= 0 ? '#22C55E' : '#EF4444'} />
        </div>
      </div>

      {/* Budget categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
        {CATEGORIES.map(cat => {
          const b    = budgets[cat.id];
          const pct  = Math.min(100, Math.round((b.actual / b.target) * 100));
          const over = b.actual > b.target;

          return (
            <div key={cat.id} style={{
              background: '#0F172A', border: `1px solid ${over ? '#EF4444' : '#1E2D4A'}`,
              borderRadius: 16, padding: '20px 22px',
              borderLeft: `3px solid ${cat.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{cat.label}</span>
                </div>
                {over && <span style={{ fontSize: 10, color: '#EF4444', background: '#EF444411', border: '1px solid #EF444433', borderRadius: 4, padding: '2px 6px' }}>OVER BUDGET</span>}
              </div>

              {/* Progress bar */}
              <div style={{ height: 8, background: '#1E2D4A', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: over ? 'linear-gradient(90deg, #EF4444, #F87171)' : `linear-gradient(90deg, ${cat.color}aa, ${cat.color})`,
                  transition: 'width 0.6s ease',
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>Actual</p>
                  <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: over ? '#EF4444' : '#22C55E', fontFamily: 'DM Mono, monospace' }}>
                    {b.actual.toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>Target</p>
                  {editing === cat.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input
                        type="number" value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveTarget(cat.id)}
                        style={{
                          width: 100, background: '#141E33', border: `1px solid ${cat.color}44`,
                          borderRadius: 6, padding: '4px 8px',
                          color: cat.color, fontSize: 13, outline: 'none',
                        }}
                        autoFocus
                      />
                      <button onClick={() => saveTarget(cat.id)} style={{
                        background: cat.color, border: 'none', borderRadius: 4,
                        padding: '4px 8px', cursor: 'pointer', color: '#080C14', fontSize: 11,
                      }}>✓</button>
                    </div>
                  ) : (
                    <p
                      onClick={() => { setEditing(cat.id); setEditVal(String(b.target)); }}
                      style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: cat.color, fontFamily: 'DM Mono, monospace', cursor: 'pointer' }}
                      title="Click to edit target"
                    >
                      {b.target.toLocaleString()} ✎
                    </p>
                  )}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#64748B', textAlign: 'right' }}>{pct}% of target</p>
            </div>
          );
        })}
      </div>

      {/* Expenses */}
      <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1E2D4A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontFamily: 'Cinzel, serif' }}>Expenses</h3>
          <button
            onClick={() => setShowAddExpense(s => !s)}
            style={{
              padding: '7px 14px', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
              color: '#EF4444', fontSize: 12, cursor: 'pointer',
            }}
          >
            + Add Expense
          </button>
        </div>

        {showAddExpense && (
          <div style={{ padding: '16px 20px', background: '#141E33', borderBottom: '1px solid #1E2D4A' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 4 }}>Category</label>
                <select
                  value={newExpense.category}
                  onChange={e => setNewExpense(x => ({ ...x, category: e.target.value }))}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 8, padding: '8px 12px', color: '#F0F4FF', fontSize: 13 }}
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 4 }}>Description</label>
                <input
                  value={newExpense.description}
                  onChange={e => setNewExpense(x => ({ ...x, description: e.target.value }))}
                  placeholder="Expense description"
                  style={{ width: '100%', background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 8, padding: '8px 12px', color: '#F0F4FF', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 4 }}>Amount (RWF)</label>
                <input
                  type="number" value={newExpense.amount}
                  onChange={e => setNewExpense(x => ({ ...x, amount: e.target.value }))}
                  placeholder="0"
                  style={{ width: '100%', background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 8, padding: '8px 12px', color: '#F0F4FF', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <button onClick={addExpense} style={{
                padding: '9px 16px', background: '#EF4444', border: 'none',
                borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer',
              }}>
                Add
              </button>
            </div>
          </div>
        )}

        {expenses.map((ex, i) => {
          const cat = CATEGORIES.find(c => c.id === ex.category);
          return (
            <div key={ex.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 20px', borderBottom: i < expenses.length - 1 ? '1px solid #0A1628' : 'none',
            }}>
              <span style={{ fontSize: 18 }}>{cat?.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#F0F4FF' }}>{ex.description}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>{cat?.label} · {ex.date}</p>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', fontFamily: 'DM Mono, monospace' }}>
                − RWF {ex.amount.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      background: `${color}11`, border: `1px solid ${color}33`,
      borderRadius: 10, padding: '8px 14px', textAlign: 'center',
    }}>
      <p style={{ margin: 0, fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color, fontFamily: 'DM Mono, monospace' }}>{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MOBILE MONEY PAYMENT BUTTON
// ══════════════════════════════════════════════════════════════

const PROVIDERS = [
  { id: 'mtn',    label: 'MTN MoMo',    color: '#FFCB00', bg: '#FFCB0011', icon: '📱', code: '182' },
  { id: 'airtel', label: 'Airtel Money',color: '#EF4444', bg: '#EF444411', icon: '📲', code: '*185#' },
];

export function MobileMoneyButton({ amount, description, memberId, onSuccess }) {
  const [step, setStep]       = useState('select'); // select | enter | confirm | success
  const [provider, setProvider] = useState(null);
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [txRef, setTxRef]     = useState('');

  const handleConfirm = async () => {
    if (!phone || phone.length < 10) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    const ref = `TXN-${Date.now().toString(36).toUpperCase()}`;
    setTxRef(ref);
    setStep('success');
    setLoading(false);
    onSuccess?.({ txRef: ref, provider: provider.id, phone, amount });
  };

  return (
    <div style={{ fontFamily: 'Crimson Pro, serif' }}>
      {step === 'select' && (
        <div>
          <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 14 }}>
            Pay RWF <strong style={{ color: '#C9A84C', fontFamily: 'DM Mono, monospace' }}>
              {amount?.toLocaleString()}
            </strong> via:
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => { setProvider(p); setStep('enter'); }}
                style={{
                  flex: 1, padding: '14px', background: p.bg,
                  border: `1.5px solid ${p.color}44`, borderRadius: 12,
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{p.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'enter' && provider && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button onClick={() => setStep('select')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 18 }}>←</button>
            <span style={{ fontSize: 14, color: provider.color, fontWeight: 700 }}>{provider.label}</span>
          </div>
          <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6 }}>
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+250 7XX XXX XXX"
            style={{
              width: '100%', background: '#141E33', border: `1px solid ${provider.color}33`,
              borderRadius: 10, padding: '12px 16px', color: '#F0F4FF', fontSize: 14,
              outline: 'none', boxSizing: 'border-box', marginBottom: 16,
            }}
          />
          <div style={{
            background: '#141E33', borderRadius: 10, padding: '12px 16px', marginBottom: 16,
            border: '1px solid #1E2D4A',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>Amount</span>
              <span style={{ fontSize: 14, color: '#C9A84C', fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>RWF {amount?.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>For</span>
              <span style={{ fontSize: 12, color: '#F0F4FF' }}>{description}</span>
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={loading || phone.length < 10}
            style={{
              width: '100%', padding: '12px',
              background: loading || phone.length < 10 ? '#1E2D4A' : `linear-gradient(135deg, ${provider.color}cc, ${provider.color})`,
              border: 'none', borderRadius: 10,
              color: '#080C14', fontSize: 14, fontWeight: 700,
              cursor: loading || phone.length < 10 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
            }}
          >
            {loading ? '⏳ Processing…' : `Pay with ${provider.label}`}
          </button>
        </div>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h4 style={{ color: '#22C55E', margin: '0 0 8px', fontFamily: 'Cinzel, serif' }}>Payment Successful!</h4>
          <p style={{ color: '#94A3B8', fontSize: 13 }}>
            RWF {amount?.toLocaleString()} paid via {provider?.label}
          </p>
          <p style={{ fontSize: 11, color: '#64748B', fontFamily: 'DM Mono, monospace', marginTop: 4 }}>
            Ref: {txRef}
          </p>
        </div>
      )}
    </div>
  );
}
