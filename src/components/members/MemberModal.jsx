/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Member Add / Edit Modal  (Task 4)
   Multi-step for Add (3 steps), single form for Edit.
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState } from 'react';
import Modal   from '../shared/Modal';
import Button  from '../shared/Button';
import Input   from '../shared/Input';
import { Select, InfoBox } from '../shared/index';
import { ROLES, VOICE_PARTS, GENDERS, MARITAL_STATUS, MEMBER_STATUS } from '../../config/constants';
import { isValidEmail, isValidPhone } from '../../utils/index';

const VP_COLOR = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };

export default function MemberModal({ isOpen, onClose, onSave, member, existingEmails = [] }) {
  const isEdit = !!member;

  const [form, setForm] = useState({
    fullName:      member?.fullName      || '',
    email:         member?.email         || '',
    phone:         member?.phone         || '',
    voicePart:     member?.voicePart     || '',
    role:          member?.role          || 'member',
    status:        member?.status        || 'active',
    gender:        member?.gender        || '',
    maritalStatus: member?.maritalStatus || '',
    dateOfBirth:   member?.dateOfBirth   || '',
    joinDate:      member?.joinDate      || new Date().toISOString().split('T')[0],
    bio:           member?.bio           || '',
    attendance:    member?.attendance    || 0,
    password:      '',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState(1); // only for Add mode

  const set = (f) => (v) => { setForm(p => ({ ...p, [f]: v })); setErrors(p => { const n = {...p}; delete n[f]; return n; }); };

  /* ── Validate ────────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.fullName.trim())              e.fullName = 'Full name is required';
    if (!isValidEmail(form.email))          e.email    = 'Valid email is required';
    if (existingEmails.includes(form.email.toLowerCase())) e.email = 'This email is already registered';
    if (!form.voicePart)                    e.voicePart = 'Please select a voice part';
    if (!isEdit && !form.password)          e.password  = 'Password is required for new members';
    if (form.phone && !isValidPhone(form.phone)) e.phone = 'Invalid phone number format';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    onSave({ ...member, ...form }, isEdit);
    setLoading(false);
  };

  /* ── Step nav (Add mode only) ────────────────────────────── */
  const handleNext = () => {
    if (step === 1) {
      const e = {};
      if (!form.fullName.trim()) e.fullName = 'Required';
      if (!form.voicePart)       e.voicePart = 'Select a voice part';
      if (Object.keys(e).length) { setErrors(e); return; }
    }
    if (step === 2) {
      const e = {};
      if (!isValidEmail(form.email)) e.email = 'Valid email required';
      if (existingEmails.includes(form.email.toLowerCase())) e.email = 'Email already exists';
      if (!form.password) e.password = 'Password required';
      if (Object.keys(e).length) { setErrors(e); return; }
    }
    setErrors({});
    setStep(s => s + 1);
  };

  /* ── Field section wrapper ───────────────────────────────── */
  const Section = ({ label, children }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        {label}
        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
      </div>
      {children}
    </div>
  );

  const footer = (
    <>
      {!isEdit && step > 1 && (
        <Button variant="secondary" onClick={() => setStep(s => s - 1)}>← Back</Button>
      )}
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      {(!isEdit && step < 3) ? (
        <Button variant="primary" onClick={handleNext}>Continue →</Button>
      ) : (
        <Button variant="primary" loading={loading} onClick={handleSubmit}>
          {isEdit ? '💾 Save Changes' : '✅ Add Member'}
        </Button>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen} onClose={onClose}
      title={isEdit ? `Edit — ${member.fullName}` : 'Add New Member'}
      subtitle={isEdit ? 'Update member information' : !isEdit ? `Step ${step} of 3` : ''}
      accent="var(--gold)" size="lg"
      footer={footer}
    >
      {/* ── Step indicator (Add mode) ─────────────────────── */}
      {!isEdit && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {['Personal', 'Account', 'Details'].map((label, i) => {
            const n = i + 1;
            const done = step > n, active = step === n;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{
                  height: 4, flex: 1, borderRadius: 2,
                  background: done ? 'var(--color-success)' : active ? 'var(--gold)' : 'var(--border-subtle)',
                  transition: 'background 0.3s',
                }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: active ? 'var(--gold)' : done ? 'var(--color-success)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 1 / EDIT — PERSONAL INFO
         ═══════════════════════════════════════════════════ */}
      {(isEdit || step === 1) && (
        <>
          <Section label="Basic Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Full Name" value={form.fullName} onChange={set('fullName')}
                placeholder="Jean Baptiste" required error={errors.fullName}
                style={{ gridColumn: '1 / -1' }}
              />
              <Input label="Phone Number" value={form.phone} onChange={set('phone')}
                placeholder="+250 788 000 000" icon="📱" error={errors.phone}
              />
              <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <Select label="Gender" value={form.gender} onChange={set('gender')}
                options={GENDERS.map(g => ({ value: g.id, label: g.label }))} placeholder="Select…" />
              <Select label="Marital Status" value={form.maritalStatus} onChange={set('maritalStatus')}
                options={MARITAL_STATUS.map(m => ({ value: m.id, label: m.label }))} placeholder="Select…" />
            </div>
          </Section>

          <Section label="Voice Part">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {VOICE_PARTS.map(vp => {
                const sel = form.voicePart === vp.id;
                return (
                  <button type="button" key={vp.id} onClick={() => set('voicePart')(vp.id)}
                    style={{
                      padding: '10px 8px', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${sel ? vp.color : 'var(--border-default)'}`,
                      background: sel ? `${vp.color}14` : 'var(--bg-raised)',
                      cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.2s',
                      transform: sel ? 'scale(1.03)' : 'scale(1)',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{vp.icon}</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 700, color: sel ? vp.color : 'var(--text-primary)' }}>{vp.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>{vp.range}</div>
                  </button>
                );
              })}
            </div>
            {errors.voicePart && <p style={{ color: 'var(--color-error)', fontSize: 11, marginTop: 8 }}>⚠ {errors.voicePart}</p>}
          </Section>
        </>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 2 — ACCOUNT
         ═══════════════════════════════════════════════════ */}
      {(isEdit || step === 2) && (
        <Section label="Account & Role">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Email Address" type="email" value={form.email} onChange={set('email')}
              placeholder="member@choir.org" icon="✉️" required error={errors.email}
              style={{ gridColumn: isEdit ? '1 / -1' : '1' }}
            />
            {!isEdit && (
              <Input label="Password" type="password" value={form.password} onChange={set('password')}
                placeholder="Temporary password" icon="🔒" required error={errors.password}
              />
            )}
            <Select label="Role" value={form.role} onChange={set('role')}
              options={ROLES.map(r => ({ value: r.id, label: r.label }))}
            />
            <Select label="Status" value={form.status} onChange={set('status')}
              options={MEMBER_STATUS.map(s => ({ value: s.id, label: s.label }))}
            />
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 3 — ADDITIONAL DETAILS
         ═══════════════════════════════════════════════════ */}
      {(isEdit || step === 3) && (
        <Section label="Additional Details">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Input label="Join Date" type="date" value={form.joinDate} onChange={set('joinDate')} />
            <Input label="Attendance %" type="number" value={String(form.attendance)} onChange={v => set('attendance')(Number(v))}
              placeholder="0" hint="0–100" />
          </div>
          <Input label="Bio / Notes" multiline rows={3}
            value={form.bio} onChange={set('bio')}
            placeholder="Brief biography or notes about this member…"
            maxLength={500}
          />
        </Section>
      )}
    </Modal>
  );
}
