/**
 * INHERITANCE CHOIR — Member Self-Service Portal
 * Profile completeness, leave requests, pledge tracking, document uploads.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionsContext';
import { useNotifications } from '../../context/NotificationsContext';

const VOICE_COLORS = { Soprano: '#EC4899', Alto: '#8B5CF6', Tenor: '#3B82F6', Bass: '#10B981' };

export default function SelfServicePage() {
  const { session, updateSession } = useAuth();
  const { toast } = useNotifications();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile',     label: 'My Profile',    icon: '👤' },
    { id: 'attendance',  label: 'My Attendance',  icon: '✅' },
    { id: 'contribs',    label: 'Contributions',  icon: '💰' },
    { id: 'leave',       label: 'Leave Request',  icon: '📋' },
    { id: 'pledges',     label: 'Pledges',        icon: '🤝' },
    { id: 'documents',   label: 'Documents',      icon: '📂' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#080C14', fontFamily: 'Crimson Pro, serif' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A, #141E33)',
        borderBottom: '1px solid #1E2D4A',
        padding: '28px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <MemberAvatar member={session} size={64} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Cinzel, serif' }}>
              {session?.fullName || 'My Account'}
            </h1>
            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: 14 }}>
              {session?.role?.replace('_', ' ')} · {session?.voicePart} Section
            </p>
            <ProfileCompletenessBar member={session} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', overflowX: 'auto', padding: '0 32px',
        background: '#0F172A', borderBottom: '1px solid #1E2D4A',
        gap: 0,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === t.id ? '#C9A84C' : 'transparent'}`,
              padding: '14px 20px', cursor: 'pointer',
              color: activeTab === t.id ? '#C9A84C' : '#64748B',
              fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400,
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 7,
              transition: 'all 0.2s',
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px' }}>
        {activeTab === 'profile'    && <ProfileEditor member={session} onSave={() => toast('Profile updated', { type: 'success' })} />}
        {activeTab === 'attendance' && <AttendanceHistory memberId={session?.id} />}
        {activeTab === 'contribs'   && <ContributionHistory memberId={session?.id} />}
        {activeTab === 'leave'      && <LeaveRequestForm memberId={session?.id} toast={toast} />}
        {activeTab === 'pledges'    && <PledgeTracker memberId={session?.id} toast={toast} />}
        {activeTab === 'documents'  && <DocumentVault memberId={session?.id} toast={toast} />}
      </div>
    </div>
  );
}

// ── Profile Completeness Bar ───────────────────────────────────
function ProfileCompletenessBar({ member }) {
  if (!member) return null;
  const fields = ['fullName','email','phone','dateOfBirth','gender','maritalStatus','bio','avatarUrl','voicePart'];
  const filled  = fields.filter(f => member[f]).length;
  const pct     = Math.round((filled / fields.length) * 100);

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
        <div style={{ flex: 1, height: 4, background: '#1E2D4A', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: pct >= 80 ? 'linear-gradient(90deg, #22C55E, #4ADE80)' :
                        pct >= 50 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' :
                                    'linear-gradient(90deg, #EF4444, #F87171)',
            transition: 'width 0.8s ease',
            borderRadius: 2,
          }} />
        </div>
        <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Mono, monospace' }}>
          {pct}% complete
        </span>
      </div>
      {pct < 100 && (
        <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>
          Complete your profile to help the choir team know you better
        </p>
      )}
    </div>
  );
}

// ── Member Avatar ─────────────────────────────────────────────
function MemberAvatar({ member, size = 48 }) {
  const vp     = member?.voicePart || 'member';
  const color  = VOICE_COLORS[vp] || '#94A3B8';
  const initials = member?.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}33, ${color}11)`,
      border: `2px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color,
      fontFamily: 'Cinzel, serif', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Profile Editor ─────────────────────────────────────────────
function ProfileEditor({ member, onSave }) {
  const [form, setForm] = useState({
    fullName:      member?.fullName      || '',
    phone:         member?.phone         || '',
    dateOfBirth:   member?.dateOfBirth   || '',
    gender:        member?.gender        || '',
    maritalStatus: member?.maritalStatus || '',
    bio:           member?.bio           || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    onSave?.();
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{
        background: '#0F172A', border: '1px solid #1E2D4A',
        borderRadius: 20, padding: 28,
      }}>
        <h3 style={{ margin: '0 0 24px', fontSize: 16, color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
          Personal Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { key: 'fullName',      label: 'Full Name',     type: 'text' },
            { key: 'phone',         label: 'Phone Number',  type: 'tel'  },
            { key: 'dateOfBirth',   label: 'Date of Birth', type: 'date' },
            { key: 'gender',        label: 'Gender',        type: 'select',
              options: ['Male','Female','Prefer not to say'] },
            { key: 'maritalStatus', label: 'Marital Status',type: 'select',
              options: ['Single','Married','Widowed','Divorced'] },
          ].map(field => (
            <FieldInput
              key={field.key}
              {...field}
              value={form[field.key]}
              onChange={v => setForm(f => ({ ...f, [field.key]: v }))}
            />
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Bio / About Me
          </label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            maxLength={500}
            rows={4}
            placeholder="Tell the choir about yourself…"
            style={{
              width: '100%', background: '#141E33',
              border: '1px solid #1E2D4A', borderRadius: 10,
              padding: '12px 16px', color: '#F0F4FF', fontSize: 14,
              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'Crimson Pro, serif',
            }}
          />
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#374151', textAlign: 'right' }}>
            {form.bio.length}/500
          </p>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 28px',
              background: 'linear-gradient(135deg, #A07820, #C9A84C)',
              border: 'none', borderRadius: 10,
              color: '#080C14', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '💾 Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ label, type, options, value, onChange }) {
  const baseStyle = {
    width: '100%', background: '#141E33',
    border: '1px solid #1E2D4A', borderRadius: 10,
    padding: '10px 14px', color: '#F0F4FF', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </label>
      {type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={baseStyle}>
          <option value="">Select…</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          style={baseStyle}
        />
      )}
    </div>
  );
}

// ── Attendance History ─────────────────────────────────────────
function AttendanceHistory({ memberId }) {
  const [data] = useState([
    { event: 'Weekly Rehearsal', date: '2026-03-28', status: 'present', type: 'rehearsal' },
    { event: 'Sunday Service',   date: '2026-03-24', status: 'present', type: 'service' },
    { event: 'Directors Meeting',date: '2026-03-20', status: 'late',    type: 'meeting' },
    { event: 'Voice Workshop',   date: '2026-03-15', status: 'excused', type: 'workshop' },
    { event: 'Sunday Service',   date: '2026-03-10', status: 'absent',  type: 'service' },
  ]);

  const STATUS = {
    present: { color: '#22C55E', label: 'Present' },
    late:    { color: '#F59E0B', label: 'Late'    },
    excused: { color: '#3B82F6', label: 'Excused' },
    absent:  { color: '#EF4444', label: 'Absent'  },
  };

  const total    = data.length;
  const attended = data.filter(d => ['present','late'].includes(d.status)).length;
  const rate     = Math.round((attended / total) * 100);

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Events', value: total, color: '#C9A84C' },
          { label: 'Attended',     value: attended, color: '#22C55E' },
          { label: 'Rate',         value: `${rate}%`, color: rate >= 80 ? '#22C55E' : rate >= 60 ? '#F59E0B' : '#EF4444' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#0F172A', border: '1px solid #1E2D4A',
            borderRadius: 16, padding: '20px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'DM Mono, monospace' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Records */}
      <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E2D4A' }}>
          <h3 style={{ margin: 0, fontSize: 15, color: '#F0F4FF', fontFamily: 'Cinzel, serif' }}>
            Attendance History
          </h3>
        </div>
        {data.map((record, i) => {
          const s = STATUS[record.status];
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 20px', borderBottom: i < data.length - 1 ? '1px solid #0F172A' : 'none',
              borderLeft: `3px solid ${s.color}`,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#F0F4FF', fontWeight: 500 }}>{record.event}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>{record.date}</p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: s.color,
                background: `${s.color}11`, border: `1px solid ${s.color}33`,
                borderRadius: 6, padding: '3px 10px',
              }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Contribution History ───────────────────────────────────────
function ContributionHistory({ memberId }) {
  const [data] = useState([
    { type: 'Tithe',         amount: 10000, date: '2026-03-05', status: 'verified', receiptNo: 'RC-20260305-A1B2' },
    { type: 'Offering',      amount: 2500,  date: '2026-03-01', status: 'verified', receiptNo: 'RC-20260301-C3D4' },
    { type: 'Welfare Fund',  amount: 5000,  date: '2026-02-28', status: 'pending',  receiptNo: 'RC-20260228-E5F6' },
    { type: 'Special Gift',  amount: 15000, date: '2026-02-14', status: 'verified', receiptNo: 'RC-20260214-G7H8' },
  ]);

  const total = data.filter(d => d.status === 'verified').reduce((s, d) => s + d.amount, 0);

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{
        background: 'linear-gradient(135deg, #0F172A, #141E33)',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 20, padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Contributions</p>
          <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: '#C9A84C', fontFamily: 'DM Mono, monospace' }}>
            RWF {total.toLocaleString()}
          </p>
        </div>
        <button style={{
          padding: '10px 20px',
          background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 10, color: '#C9A84C', fontSize: 13,
          cursor: 'pointer', fontWeight: 600,
        }}>
          📄 Export Statement
        </button>
      </div>

      <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 20, overflow: 'hidden' }}>
        {data.map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '14px 20px', borderBottom: i < data.length - 1 ? '1px solid #0A1628' : 'none',
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#F0F4FF', fontWeight: 500 }}>{c.type}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#374151', fontFamily: 'DM Mono, monospace' }}>
                {c.receiptNo} · {c.date}
              </p>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C', fontFamily: 'DM Mono, monospace' }}>
              RWF {c.amount.toLocaleString()}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: c.status === 'verified' ? '#22C55E' : '#F59E0B',
              background: c.status === 'verified' ? '#22C55E11' : '#F59E0B11',
              border: `1px solid ${c.status === 'verified' ? '#22C55E33' : '#F59E0B33'}`,
              borderRadius: 6, padding: '2px 8px',
            }}>
              {c.status === 'verified' ? '✓ Verified' : '⏳ Pending'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Leave Request Form ─────────────────────────────────────────
function LeaveRequestForm({ memberId, toast }) {
  const [form, setForm] = useState({ type: 'annual', startDate: '', endDate: '', reason: '', notify: true });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate || !form.reason) {
      toast('Please fill in all required fields', { type: 'warning' });
      return;
    }
    await new Promise(r => setTimeout(r, 700));
    setSubmitted(true);
    toast('Leave request submitted for admin review', { type: 'success' });
  };

  const LEAVE_TYPES = [
    { id: 'annual',    label: 'Annual Leave' },
    { id: 'medical',   label: 'Medical Leave' },
    { id: 'family',    label: 'Family Event' },
    { id: 'travel',    label: 'Travel / Relocation' },
    { id: 'other',     label: 'Other' },
  ];

  if (submitted) {
    return (
      <div style={{ maxWidth: 480, textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
        <h3 style={{ color: '#22C55E', fontFamily: 'Cinzel, serif' }}>Request Submitted</h3>
        <p style={{ color: '#94A3B8' }}>Your leave request has been sent to the admin for review.</p>
        <button
          onClick={() => setSubmitted(false)}
          style={{ marginTop: 16, padding: '10px 24px', background: '#1E2D4A', border: 'none', borderRadius: 10, color: '#94A3B8', cursor: 'pointer' }}
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 20, padding: 28 }}>
        <h3 style={{ margin: '0 0 24px', fontSize: 16, color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
          Request Leave of Absence
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Leave Type *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {LEAVE_TYPES.map(t => (
                <label key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  background: form.type === t.id ? 'rgba(201,168,76,0.1)' : '#141E33',
                  border: `1px solid ${form.type === t.id ? '#C9A84C44' : '#1E2D4A'}`,
                  borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <input
                    type="radio" name="leaveType" value={t.id}
                    checked={form.type === t.id}
                    onChange={() => setForm(f => ({ ...f, type: t.id }))}
                    style={{ accentColor: '#C9A84C' }}
                  />
                  <span style={{ fontSize: 13, color: form.type === t.id ? '#C9A84C' : '#94A3B8' }}>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { key: 'startDate', label: 'Start Date *' },
              { key: 'endDate',   label: 'End Date *'   },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {f.label}
                </label>
                <input
                  type="date"
                  value={form[f.key]}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                  style={{
                    width: '100%', background: '#141E33', border: '1px solid #1E2D4A',
                    borderRadius: 10, padding: '10px 14px', color: '#F0F4FF',
                    fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Reason / Details *
            </label>
            <textarea
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              rows={4}
              placeholder="Briefly explain your reason for the leave request…"
              style={{
                width: '100%', background: '#141E33', border: '1px solid #1E2D4A',
                borderRadius: 10, padding: '10px 14px', color: '#F0F4FF',
                fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                fontFamily: 'Crimson Pro, serif',
              }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox" checked={form.notify}
              onChange={e => setForm(f => ({ ...f, notify: e.target.checked }))}
              style={{ accentColor: '#C9A84C', width: 16, height: 16 }}
            />
            <span style={{ fontSize: 13, color: '#94A3B8' }}>
              Notify section lead and choir director
            </span>
          </label>

          <button onClick={handleSubmit} style={{
            padding: '12px', background: 'linear-gradient(135deg, #A07820, #C9A84C)',
            border: 'none', borderRadius: 12,
            color: '#080C14', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            📤 Submit Leave Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pledge Tracker ─────────────────────────────────────────────
function PledgeTracker({ memberId, toast }) {
  const [pledges, setPledges] = useState([
    { id: 1, title: 'Annual Fundraiser Pledge', amount: 50000, paid: 20000, dueDate: '2026-06-30', category: 'fundraiser' },
    { id: 2, title: 'Welfare Fund Commitment',  amount: 10000, paid: 10000, dueDate: '2026-03-31', category: 'welfare'    },
  ]);
  const [showNew, setShowNew] = useState(false);
  const [newPledge, setNewPledge] = useState({ title: '', amount: '', dueDate: '', category: 'fundraiser' });

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: '#F0F4FF', fontFamily: 'Cinzel, serif' }}>My Pledges</h3>
        <button
          onClick={() => setShowNew(s => !s)}
          style={{
            padding: '8px 16px', background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10,
            color: '#C9A84C', fontSize: 13, cursor: 'pointer',
          }}
        >
          + New Pledge
        </button>
      </div>

      {pledges.map(p => {
        const progress = Math.min(100, Math.round((p.paid / p.amount) * 100));
        const fulfilled = progress >= 100;
        return (
          <div key={p.id} style={{
            background: '#0F172A', border: `1px solid ${fulfilled ? '#22C55E22' : '#1E2D4A'}`,
            borderRadius: 16, padding: '20px 24px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#F0F4FF' }}>{p.title}</p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: '#64748B' }}>Due: {p.dueDate}</p>
              </div>
              {fulfilled && (
                <span style={{
                  fontSize: 11, color: '#22C55E',
                  background: '#22C55E11', border: '1px solid #22C55E33',
                  borderRadius: 6, padding: '3px 10px', height: 'fit-content',
                }}>
                  ✓ Fulfilled
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 8, background: '#1E2D4A', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: fulfilled ? 'linear-gradient(90deg, #22C55E, #4ADE80)' : 'linear-gradient(90deg, #A07820, #C9A84C)',
                  borderRadius: 4, transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{ fontSize: 12, color: '#C9A84C', fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap' }}>
                {progress}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#22C55E' }}>RWF {p.paid.toLocaleString()} paid</span>
              <span style={{ fontSize: 12, color: '#64748B' }}>of RWF {p.amount.toLocaleString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Document Vault ─────────────────────────────────────────────
function DocumentVault({ memberId, toast }) {
  const fileRef = useRef(null);
  const [docs, setDocs] = useState([
    { id: 1, name: 'Membership Certificate.pdf', size: '234 KB', date: '2024-01-15', type: 'certificate' },
    { id: 2, name: 'Choir Photo 2025.jpg',       size: '1.2 MB', date: '2025-12-20', type: 'photo' },
  ]);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map((f, i) => ({
      id: docs.length + i + 1,
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
      date: new Date().toISOString().split('T')[0],
      type: f.type.startsWith('image') ? 'photo' : 'document',
    }));
    setDocs(d => [...d, ...newDocs]);
    toast(`${files.length} file(s) uploaded`, { type: 'success' });
    e.target.value = '';
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: '#F0F4FF', fontFamily: 'Cinzel, serif' }}>My Documents</h3>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            padding: '8px 16px', background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10,
            color: '#C9A84C', fontSize: 13, cursor: 'pointer',
          }}
        >
          📤 Upload
        </button>
        <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUpload} style={{ display: 'none' }} />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleUpload({ target: { files: e.dataTransfer.files }, }); }}
        style={{
          border: '2px dashed #1E2D4A', borderRadius: 16, padding: '28px',
          textAlign: 'center', marginBottom: 20, cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onClick={() => fileRef.current?.click()}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
        <p style={{ color: '#64748B', fontSize: 13 }}>Drop files here or click to browse</p>
        <p style={{ color: '#374151', fontSize: 11 }}>PDF, JPG, PNG, DOC up to 10MB</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {docs.map(doc => (
          <div key={doc.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: '#0F172A', border: '1px solid #1E2D4A',
            borderRadius: 12, padding: '14px 20px',
          }}>
            <span style={{ fontSize: 24 }}>{doc.type === 'photo' ? '🖼' : '📄'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#F0F4FF', fontWeight: 500 }}>{doc.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>{doc.size} · {doc.date}</p>
            </div>
            <button style={{
              background: 'none', border: 'none', color: '#C9A84C',
              cursor: 'pointer', fontSize: 13, padding: '4px 8px',
            }}>
              ↓ Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
