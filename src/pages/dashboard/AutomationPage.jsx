/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Automation & Workflows Page  (Task 10)

   Features:
   • Pre-built automation rules (seeded, toggleable)
   • Custom IF → THEN rule builder
   • Execution history log
   • Rule categories: Attendance, Finance, Communication, Events
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react';
import { useToast }  from '../../context/ToastContext';
import Storage       from '../../storage/engine';
import {
  PageHeader, Badge, EmptyState, InfoBox, Tabs,
} from '../../components/shared/index';
import Button from '../../components/shared/Button';
import Input  from '../../components/shared/Input';
import Modal  from '../../components/shared/Modal';
import { Select } from '../../components/shared/index';
import { formatDate } from '../../utils/index';

/* ── Storage helpers ─────────────────────────────────────────── */
const RULES_KEY = 'choir_automation_rules';
const LOGS_KEY  = 'choir_automation_logs';

const defaultRules = [
  {
    id: 1, name: 'Event Reminder — 24h Before',
    category: 'events', active: true,
    trigger: 'event.24h_before',
    condition: 'is_mandatory = true',
    action: 'send_email',
    actionLabel: 'Send EMAIL_REMINDER_24H to all targeted members',
    runCount: 12, lastRun: new Date(Date.now() - 86400000).toISOString(),
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 2, name: 'Attendance Confirmation',
    category: 'attendance', active: true,
    trigger: 'attendance.saved',
    condition: 'status = present',
    action: 'send_email',
    actionLabel: 'Send ATTEND_PRESENT email to member',
    runCount: 48, lastRun: new Date(Date.now() - 3600000).toISOString(),
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 3, name: 'Monthly Tithe Reminder',
    category: 'finance', active: true,
    trigger: 'month.day_5',
    condition: 'no_contribution_this_month',
    action: 'send_email',
    actionLabel: 'Send CONTRIB_REMINDER to non-contributors',
    runCount: 3, lastRun: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 4, name: 'New Registration Alert',
    category: 'communication', active: true,
    trigger: 'member.registered',
    condition: 'email_verified = true',
    action: 'create_notification',
    actionLabel: 'Create notification for all admins',
    runCount: 2, lastRun: new Date(Date.now() - 86400000 * 7).toISOString(),
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 5, name: 'Birthday Greeting',
    category: 'communication', active: false,
    trigger: 'member.birthday',
    condition: 'is_active = true',
    action: 'send_email',
    actionLabel: 'Send birthday email to member',
    runCount: 0, lastRun: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 6, name: 'Low Attendance Alert',
    category: 'attendance', active: false,
    trigger: 'event.attendance_rate_below',
    condition: 'rate < 70% AND is_mandatory = true',
    action: 'create_notification',
    actionLabel: 'Notify president of low attendance',
    runCount: 0, lastRun: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 7, name: 'Excuse Request Alert',
    category: 'attendance', active: true,
    trigger: 'excuse.submitted',
    condition: 'status = pending',
    action: 'send_notification',
    actionLabel: 'Notify all committee with manage_excuses permission',
    runCount: 8, lastRun: new Date(Date.now() - 7200000).toISOString(),
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 8, name: 'Urgent Welfare Alert',
    category: 'communication', active: true,
    trigger: 'welfare.created',
    condition: 'priority = urgent',
    action: 'send_notification',
    actionLabel: 'Immediately notify president + welfare committee',
    runCount: 1, lastRun: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

/* ── Trigger / Action config ─────────────────────────────────── */
const TRIGGERS = [
  { value:'event.24h_before',           label:'Event — 24 hours before'           },
  { value:'event.1h_before',            label:'Event — 1 hour before'             },
  { value:'event.created',              label:'Event — Created'                    },
  { value:'event.cancelled',            label:'Event — Cancelled'                  },
  { value:'attendance.saved',           label:'Attendance — Saved'                 },
  { value:'attendance.absent',          label:'Attendance — Member marked absent'  },
  { value:'excuse.submitted',           label:'Excuse — Request submitted'         },
  { value:'excuse.approved',            label:'Excuse — Request approved'          },
  { value:'excuse.rejected',            label:'Excuse — Request rejected'          },
  { value:'contribution.recorded',      label:'Contribution — Recorded'            },
  { value:'member.registered',          label:'Member — Registered'                },
  { value:'member.approved',            label:'Member — Approved'                  },
  { value:'member.birthday',            label:'Member — Birthday'                  },
  { value:'welfare.created',            label:'Welfare — Case created'             },
  { value:'month.day_5',                label:'Schedule — 5th of every month'      },
  { value:'month.last_day',             label:'Schedule — Last day of month'       },
];

const ACTIONS = [
  { value:'send_email',        label:'Send Email'              },
  { value:'send_notification', label:'Send In-App Notification'},
  { value:'create_notification',label:'Create Notification'   },
  { value:'send_broadcast',    label:'Send Broadcast Message'  },
];

const CAT_COLOR = {
  events:       'var(--gold)',
  attendance:   'var(--color-violet)',
  finance:      'var(--color-emerald)',
  communication:'var(--color-info)',
};

const CAT_ICON = {
  events: '📅', attendance: '✅', finance: '💰', communication: '📢',
};

/* ── Rule card ───────────────────────────────────────────────── */
function RuleCard({ rule, onToggle, onEdit, onDelete, onRun }) {
  const color = CAT_COLOR[rule.category] || 'var(--gold)';
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${rule.active ? `${color}25` : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      opacity: rule.active ? 1 : 0.65,
      transition: 'all var(--transition-normal)',
    }}
      onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity=rule.active?1:0.65; e.currentTarget.style.transform='translateY(0)'; }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:16 }}>{CAT_ICON[rule.category]}</span>
              <div style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>
                {rule.name}
              </div>
            </div>
            <Badge color={color} size="xs">{rule.category.toUpperCase()}</Badge>
          </div>
          {/* Toggle */}
          <div onClick={() => onToggle(rule.id)}
            style={{
              width:48, height:26, borderRadius:13, padding:3, flexShrink:0,
              background: rule.active ? 'var(--color-success)' : 'var(--border-default)',
              cursor:'pointer', transition:'background 0.25s', position:'relative',
            }}
          >
            <div style={{
              width:20, height:20, borderRadius:'50%', background:'white',
              position:'absolute', top:3,
              left: rule.active ? 25 : 3,
              transition:'left 0.25s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </div>
        </div>

        {/* IF → THEN display */}
        <div style={{
          background:'var(--bg-raised)', borderRadius:'var(--radius-md)',
          padding:'10px 14px', marginBottom:12,
          fontFamily:'var(--font-mono)', fontSize:10,
        }}>
          <div style={{ marginBottom:5 }}>
            <span style={{ color:'var(--color-info)', fontWeight:700 }}>IF  </span>
            <span style={{ color:'var(--text-secondary)' }}>{rule.trigger}</span>
          </div>
          {rule.condition && (
            <div style={{ marginBottom:5 }}>
              <span style={{ color:'var(--color-warning)', fontWeight:700 }}>AND </span>
              <span style={{ color:'var(--text-secondary)' }}>{rule.condition}</span>
            </div>
          )}
          <div>
            <span style={{ color:'var(--color-success)', fontWeight:700 }}>THEN </span>
            <span style={{ color:'var(--text-secondary)' }}>{rule.actionLabel}</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:16, marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase' }}>RUN COUNT</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:900, color }}>
              {rule.runCount}
            </div>
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase' }}>LAST RUN</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)', marginTop:2 }}>
              {rule.lastRun ? formatDate(rule.lastRun, 'relative') : 'Never'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:6 }}>
          <Button size="xs" variant="secondary" icon="▶" onClick={() => onRun(rule)}>Run Now</Button>
          <Button size="xs" variant="secondary" onClick={() => onEdit(rule)}>✏️ Edit</Button>
          <Button size="xs" variant="danger"    onClick={() => onDelete(rule.id)}>🗑</Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function AutomationPage() {
  const { success: toastOK, info: toastInfo } = useToast();

  /* ── Rules state ─────────────────────────────────────────── */
  const [rules, setRules] = useState(() => {
    const stored = Storage.get(RULES_KEY);
    if (!stored || stored.length === 0) {
      Storage.set(RULES_KEY, defaultRules);
      return defaultRules;
    }
    return stored;
  });

  const [logs, setLogs] = useState(() => Storage.get(LOGS_KEY, []));
  const [tab,   setTab]  = useState('rules');
  const [createOpen, setCreateOpen] = useState(false);
  const [editRule,   setEditRule]   = useState(null);
  const [catFilter,  setCatFilter]  = useState('all');

  const saveRules = (updated) => { setRules(updated); Storage.set(RULES_KEY, updated); };
  const saveLogs  = (updated) => { setLogs(updated);  Storage.set(LOGS_KEY,  updated); };

  /* ── Filtered rules ──────────────────────────────────────── */
  const filtered = useMemo(() =>
    catFilter === 'all' ? rules : rules.filter(r => r.category === catFilter),
    [rules, catFilter]
  );

  const activeCount = rules.filter(r => r.active).length;

  /* ── Rule actions ────────────────────────────────────────── */
  const handleToggle = (id) => {
    const updated = rules.map(r => r.id === id ? { ...r, active: !r.active } : r);
    saveRules(updated);
    const rule = updated.find(r => r.id === id);
    toastInfo(`"${rule.name}" ${rule.active ? 'enabled' : 'paused'}`);
  };

  const handleDelete = (id) => {
    saveRules(rules.filter(r => r.id !== id));
    toastInfo('Rule deleted');
  };

  const handleSave = (data, isEdit) => {
    if (isEdit) {
      saveRules(rules.map(r => r.id === data.id ? data : r));
      toastOK('Rule updated');
    } else {
      const newId = Math.max(0, ...rules.map(r => r.id)) + 1;
      saveRules([...rules, { ...data, id: newId, runCount: 0, lastRun: null, createdAt: new Date().toISOString() }]);
      toastOK('Automation rule created!');
    }
    setCreateOpen(false);
    setEditRule(null);
  };

  const handleRun = (rule) => {
    const log = {
      id: Date.now(),
      ruleId: rule.id, ruleName: rule.name,
      triggeredAt: new Date().toISOString(),
      status: 'success',
      details: `Manually triggered: ${rule.actionLabel}`,
    };
    saveLogs([log, ...logs].slice(0, 100));
    saveRules(rules.map(r => r.id === rule.id
      ? { ...r, runCount: r.runCount + 1, lastRun: log.triggeredAt }
      : r
    ));
    toastOK(`Rule "${rule.name}" executed`);
  };

  const tabList = [
    { id:'rules',  label:'Rules',         icon:'⚡', count: activeCount },
    { id:'log',    label:'Execution Log', icon:'📜', count: logs.length > 0 ? logs.length : undefined },
  ];

  const categories = ['all','events','attendance','finance','communication'];

  return (
    <div style={{ animation:'fadeUp 0.35s ease both' }}>
      <PageHeader
        title="Automation & Workflows"
        subtitle={`${activeCount} active rules · ${rules.length} total`}
        icon="⚡"
        actions={
          <Button variant="primary" icon="+" onClick={() => setCreateOpen(true)}>
            Create Rule
          </Button>
        }
      />

      <InfoBox type="info" style={{ marginBottom:20 }}>
        Automation rules run automatically in the background when their trigger conditions are met.
        Toggle rules on/off without deleting them. Use "Run Now" to test a rule manually.
      </InfoBox>

      <Tabs tabs={tabList} active={tab} onChange={setTab} />

      {/* ══════════════════════════════════════════════════════
          RULES TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'rules' && (
        <div>
          {/* Category filter pills */}
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {categories.map(cat => {
              const color  = CAT_COLOR[cat] || 'var(--gold)';
              const count  = cat === 'all' ? rules.length : rules.filter(r => r.category === cat).length;
              const active = catFilter === cat;
              return (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  style={{
                    padding:'5px 14px', borderRadius:'var(--radius-full)', cursor:'pointer',
                    background: active ? (cat==='all'?'var(--gold)': `${color}18`) : 'var(--bg-raised)',
                    color:      active ? (cat==='all'?'var(--text-inverse)':color) : 'var(--text-muted)',
                    border:     `1px solid ${active ? (cat==='all'?'var(--gold)':color) : 'var(--border-subtle)'}`,
                    fontFamily:'var(--font-mono)', fontSize:9, fontWeight:600,
                    letterSpacing:'0.06em', textTransform:'uppercase',
                    transition:'all var(--transition-fast)',
                    display:'flex', alignItems:'center', gap:5,
                  }}
                >
                  {cat!=='all' && <span>{CAT_ICON[cat]}</span>}
                  {cat==='all'?'All':cat.charAt(0).toUpperCase()+cat.slice(1)} ({count})
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="⚡" title="No rules yet"
              description="Create automation rules to send reminders, notifications, and messages automatically."
              action={<Button variant="primary" onClick={() => setCreateOpen(true)}>+ Create Rule</Button>}
            />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
              {filtered.map(rule => (
                <RuleCard
                  key={rule.id} rule={rule}
                  onToggle={handleToggle}
                  onEdit={r => setEditRule(r)}
                  onDelete={handleDelete}
                  onRun={handleRun}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          EXECUTION LOG TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'log' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', letterSpacing:'0.08em' }}>
              LAST {Math.min(logs.length, 100)} EXECUTIONS
            </div>
            {logs.length > 0 && (
              <Button size="sm" variant="subtle" onClick={() => { saveLogs([]); toastInfo('Log cleared'); }}>
                Clear Log
              </Button>
            )}
          </div>

          {logs.length === 0 ? (
            <EmptyState icon="📜" title="No executions yet"
              description="Automation execution history will appear here once rules have run."
            />
          ) : (
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
                  <thead>
                    <tr style={{ background:'var(--bg-raised)' }}>
                      {['Status','Rule','Triggered','Details'].map(h => (
                        <th key={h} style={{ padding:'9px 14px', fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', textAlign:'left', borderBottom:'2px solid var(--border-subtle)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log.id || i}
                        style={{ borderBottom:'1px solid var(--border-subtle)' }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      >
                        <td style={{ padding:'9px 14px' }}>
                          <Badge
                            color={log.status==='success'?'var(--color-success)':log.status==='failed'?'var(--color-error)':'var(--color-warning)'}
                            size="xs"
                          >
                            {log.status==='success'?'✅':'❌'} {log.status?.toUpperCase()}
                          </Badge>
                        </td>
                        <td style={{ padding:'9px 14px', fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-primary)', fontWeight:600 }}>
                          {log.ruleName}
                        </td>
                        <td style={{ padding:'9px 14px', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                          {formatDate(log.triggeredAt, 'relative')}
                        </td>
                        <td style={{ padding:'9px 14px', fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)' }}>
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create / Edit rule modal ──────────────────────── */}
      {(createOpen || editRule) && (
        <RuleModal
          isOpen rule={editRule}
          onClose={() => { setCreateOpen(false); setEditRule(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

/* ── Rule create / edit modal ────────────────────────────────── */
function RuleModal({ isOpen, rule, onClose, onSave }) {
  const isEdit = !!rule;
  const [form, setForm] = useState({
    name:        rule?.name        || '',
    category:    rule?.category    || 'communication',
    trigger:     rule?.trigger     || '',
    condition:   rule?.condition   || '',
    action:      rule?.action      || 'send_notification',
    actionLabel: rule?.actionLabel || '',
    active:      rule?.active      ?? true,
  });
  const [loading, setLoading] = useState(false);
  const set = f => v => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.trigger) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 250));
    onSave({ ...rule, ...form }, isEdit);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={isEdit ? `Edit — ${rule.name}` : 'Create Automation Rule'}
      accent="var(--gold)" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit} disabled={!form.name.trim() || !form.trigger}>
            {isEdit ? '💾 Save' : '⚡ Create Rule'}
          </Button>
        </>
      }
    >
      <Input label="Rule Name" value={form.name} onChange={set('name')} placeholder="e.g. Monthly Reminder" required style={{ marginBottom:14 }} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <Select label="Category" value={form.category} onChange={set('category')}
          options={[
            {value:'events',       label:'📅 Events'       },
            {value:'attendance',   label:'✅ Attendance'   },
            {value:'finance',      label:'💰 Finance'      },
            {value:'communication',label:'📢 Communication'},
          ]}
        />
        <Select label="Action Type" value={form.action} onChange={set('action')} options={ACTIONS} />
      </div>

      {/* IF-THEN visual builder */}
      <div style={{ background:'var(--bg-raised)', borderRadius:'var(--radius-md)', padding:'16px', marginBottom:14 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>⚡ RULE LOGIC</div>

        {/* Trigger */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700, color:'var(--color-info)', minWidth:36 }}>IF</div>
          <div style={{ flex:1 }}>
            <Select value={form.trigger} onChange={set('trigger')} options={[{value:'',label:'Select trigger…'},...TRIGGERS]} />
          </div>
        </div>

        {/* Condition */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700, color:'var(--color-warning)', minWidth:36 }}>AND</div>
          <Input value={form.condition} onChange={set('condition')} placeholder="Optional condition (e.g. status = present)" style={{ flex:1, marginBottom:0 }} />
        </div>

        {/* Action description */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700, color:'var(--color-success)', minWidth:36, marginTop:10 }}>THEN</div>
          <Input label="" value={form.actionLabel} onChange={set('actionLabel')} placeholder="Describe what this rule does…" multiline rows={2} style={{ flex:1, marginBottom:0 }} />
        </div>
      </div>

      {/* Active toggle */}
      <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'10px 12px', background: form.active?'rgba(34,197,94,0.06)':'var(--bg-raised)', border:`1px solid ${form.active?'rgba(34,197,94,0.25)':'var(--border-subtle)'}`, borderRadius:'var(--radius-md)' }}>
        <input type="checkbox" checked={form.active} onChange={e => set('active')(e.target.checked)} style={{ accentColor:'var(--color-success)', width:16, height:16 }} />
        <div>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:13, fontWeight:700, color: form.active?'var(--color-success)':'var(--text-primary)' }}>
            {form.active ? '✅ Rule Active' : '⏸ Rule Paused'}
          </div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)' }}>
            {form.active ? 'This rule will execute automatically' : 'Rule is saved but will not execute'}
          </div>
        </div>
      </label>
    </Modal>
  );
}
