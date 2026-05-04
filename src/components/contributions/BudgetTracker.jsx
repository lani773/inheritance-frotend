/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Budget Tracker  (Task 6)
   Set annual goals per contribution type, track progress.
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react';
import Button from '../shared/Button';
import Input  from '../shared/Input';
import { ProgressBar, InfoBox } from '../shared/index';
import { CONTRIBUTION_TYPES } from '../../config/constants';
import { formatCurrency } from '../../utils/index';
import Storage, { KEYS } from '../../storage/engine';

export default function BudgetTracker({ contributions }) {
  const STORAGE_KEY = 'budget_goals';
  const currentYear = new Date().getFullYear();

  const [goals, setGoals] = useState(() =>
    Storage.get(STORAGE_KEY, {})
  );
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState({});

  /* ── Actual totals this year ─────────────────────────────── */
  const actuals = useMemo(() => {
    const totals = {};
    contributions
      .filter(c => c.date?.startsWith(String(currentYear)))
      .forEach(c => { totals[c.type] = (totals[c.type]||0) + parseFloat(c.amount||0); });
    return totals;
  }, [contributions, currentYear]);

  const totalGoal   = Object.values(goals).reduce((s,v) => s + (parseFloat(v)||0), 0);
  const totalActual = Object.values(actuals).reduce((s,v) => s + v, 0);
  const overallPct  = totalGoal ? Math.round((totalActual / totalGoal) * 100) : 0;

  const handleEdit = () => {
    setDraft({ ...goals });
    setEditMode(true);
  };

  const handleSave = () => {
    const clean = {};
    Object.entries(draft).forEach(([k,v]) => { const n = parseFloat(v); if (n > 0) clean[k] = n; });
    setGoals(clean);
    Storage.set(STORAGE_KEY, clean);
    setEditMode(false);
  };

  return (
    <div>
      {/* Overall progress card */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 20,
      }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,var(--gold),transparent)' }} />
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                🎯 {currentYear} BUDGET OVERVIEW
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                {overallPct}% of annual goal reached
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: overallPct >= 100 ? 'var(--color-success)' : overallPct >= 75 ? 'var(--color-warning)' : 'var(--text-primary)' }}>
                {overallPct}%
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                {formatCurrency(totalActual,'RWF')} / {formatCurrency(totalGoal,'RWF')}
              </div>
            </div>
          </div>
          <ProgressBar
            value={totalActual} max={totalGoal || 1}
            color={overallPct >= 100 ? 'var(--color-success)' : overallPct >= 75 ? 'var(--color-warning)' : 'var(--gold)'}
            height={8} animate
          />
        </div>
      </div>

      {/* Set goals button */}
      {!editMode && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button variant="ghost" icon="✏️" onClick={handleEdit}>
            Set Annual Goals
          </Button>
        </div>
      )}

      {/* Edit mode */}
      {editMode && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
            ✏️ SET {currentYear} GOALS (RWF)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12, marginBottom: 16 }}>
            {CONTRIBUTION_TYPES.slice(0, -1).map(t => (
              <Input key={t.id}
                label={`${t.icon} ${t.label}`}
                type="number"
                value={String(draft[t.id] || '')}
                onChange={v => setDraft(p => ({ ...p, [t.id]: v }))}
                placeholder="0"
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>💾 Save Goals</Button>
          </div>
        </div>
      )}

      {/* Per-type rows */}
      {totalGoal === 0 && !editMode && (
        <InfoBox type="info">
          No budget goals set yet. Click "Set Annual Goals" to define targets for each contribution type.
        </InfoBox>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CONTRIBUTION_TYPES.slice(0, -1).map(t => {
          const goal   = parseFloat(goals[t.id] || 0);
          const actual = actuals[t.id] || 0;
          const pct    = goal ? Math.round((actual / goal) * 100) : 0;
          const over   = goal > 0 && actual >= goal;
          const at_risk= goal > 0 && pct < 70;

          return (
            <div key={t.id} style={{
              background: 'var(--bg-card)', border: `1px solid ${over ? 'rgba(34,197,94,0.25)' : at_risk && goal ? 'rgba(239,68,68,0.15)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-lg)', padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{t.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                      {formatCurrency(actual,'RWF')} collected {goal ? `of ${formatCurrency(goal,'RWF')} goal` : '(no goal set)'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {goal > 0 && (
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 900, color: over ? 'var(--color-success)' : at_risk ? 'var(--color-error)' : t.color }}>
                      {pct}%
                    </div>
                  )}
                  {over && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-success)', letterSpacing: '0.06em' }}>GOAL MET ✓</div>}
                  {at_risk && goal > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-error)', letterSpacing: '0.06em' }}>AT RISK</div>}
                </div>
              </div>
              {goal > 0 && (
                <ProgressBar
                  value={Math.min(actual, goal)} max={goal}
                  color={over ? 'var(--color-success)' : at_risk ? 'var(--color-error)' : t.color}
                  height={5} animate
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
