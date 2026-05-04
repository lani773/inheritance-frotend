/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Contribution Modal  (Task 6)
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState } from 'react';
import Modal  from '../shared/Modal';
import Button from '../shared/Button';
import Input  from '../shared/Input';
import { Select } from '../shared/index';
import { CONTRIBUTION_TYPES, PAYMENT_METHODS, CURRENCIES } from '../../config/constants';
import { formatCurrency } from '../../utils/index';

export default function ContributionModal({ isOpen, onClose, onSave, members = [], contribution }) {
  const isEdit = !!contribution;
  const today  = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    memberId:  contribution?.memberId  || '',
    type:      contribution?.type      || 'tithe',
    amount:    contribution?.amount    || '',
    currency:  contribution?.currency  || 'RWF',
    date:      contribution?.date      || today,
    method:    contribution?.method    || 'cash',
    reference: contribution?.reference || '',
    notes:     contribution?.notes     || '',
    verified:  contribution?.verified  ?? false,
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [incomeForCalc, setIncomeForCalc] = useState('');

  const set = (f) => (v) => {
    setForm(p => ({ ...p, [f]: v }));
    setErrors(p => { const n = {...p}; delete n[f]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.memberId) e.memberId = 'Select a member';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.date)     e.date    = 'Date is required';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 250));
    onSave({ ...contribution, ...form, memberId: Number(form.memberId), amount: parseFloat(form.amount) }, isEdit);
    setLoading(false);
  };

  const titheCalc = incomeForCalc ? Math.round(parseFloat(incomeForCalc.replace(/,/g,'')) * 0.1) : 0;
  const applyCalc = () => { if (titheCalc > 0) { set('amount')(String(titheCalc)); set('type')('tithe'); } };

  const typeConfig = CONTRIBUTION_TYPES.find(t => t.id === form.type);

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={isEdit ? 'Edit Contribution' : 'Record Contribution'}
      subtitle={isEdit ? 'Update contribution details' : 'Add a new financial contribution'}
      accent={typeConfig?.color || 'var(--gold)'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            {isEdit ? '💾 Save Changes' : '✅ Record Contribution'}
          </Button>
        </>
      }
    >
      {/* Tithe calculator helper */}
      {!isEdit && (
        <div style={{ background:'var(--gold-alpha-10)', border:'1px solid var(--border-gold)', borderRadius:'var(--radius-md)', padding:'12px 14px', marginBottom:20 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--gold)', letterSpacing:'0.1em', marginBottom:8 }}>🧮 TITHE CALCULATOR (OPTIONAL)</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ position:'relative', flex:1 }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)' }}>RWF</span>
              <input
                value={incomeForCalc}
                onChange={e => setIncomeForCalc(e.target.value.replace(/[^0-9,]/g,''))}
                placeholder="Enter income amount…"
                style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-sm)', padding:'7px 10px 7px 40px', color:'var(--text-primary)', fontSize:12, fontFamily:'var(--font-body)', outline:'none', boxSizing:'border-box' }}
              />
            </div>
            {titheCalc > 0 && (
              <>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--gold)', fontWeight:700, flexShrink:0 }}>
                  = {formatCurrency(titheCalc,'RWF')}
                </span>
                <Button size="xs" variant="ghost" onClick={applyCalc}>Apply →</Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Member selection */}
      <Select
        label="Member" value={String(form.memberId)} onChange={set('memberId')}
        options={[{value:'',label:'Select member…'}, ...members.filter(m=>m.status==='active').map(m=>({value:String(m.id),label:`${m.fullName} (${m.voicePart})`}))]}
        required error={errors.memberId}
        style={{ marginBottom:14 }}
      />

      {/* Contribution type selector */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-secondary)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.1em' }}>Type</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {CONTRIBUTION_TYPES.map(t => {
            const sel = form.type === t.id;
            return (
              <button key={t.id} type="button" onClick={() => set('type')(t.id)}
                style={{
                  padding:'7px 13px', borderRadius:'var(--radius-full)',
                  border:`2px solid ${sel ? t.color : 'var(--border-default)'}`,
                  background: sel ? `${t.color}14` : 'var(--bg-raised)',
                  color: sel ? t.color : 'var(--text-muted)',
                  cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:9,
                  fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase',
                  transition:'all 0.2s', display:'flex', alignItems:'center', gap:5,
                }}
              >
                <span>{t.icon}</span>{t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount + Currency */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12, marginBottom:14 }}>
        <Input label="Amount" type="number" value={String(form.amount)} onChange={set('amount')}
          placeholder="0" required error={errors.amount}
          icon={CURRENCIES.find(c=>c.id===form.currency)?.symbol || '💰'}
        />
        <Select label="Currency" value={form.currency} onChange={set('currency')}
          options={CURRENCIES.map(c=>({value:c.id,label:c.id}))}
        />
      </div>

      {/* Date + Method */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <Input label="Date" type="date" value={form.date} onChange={set('date')} required error={errors.date} />
        <Select label="Payment Method" value={form.method} onChange={set('method')}
          options={PAYMENT_METHODS.map(m=>({value:m.id,label:`${m.icon} ${m.label}`}))}
        />
      </div>

      {/* Reference */}
      <Input label="Reference / Transaction ID" value={form.reference} onChange={set('reference')}
        placeholder="e.g. MTN-2026-001234" icon="🔖"
        style={{ marginBottom:14 }}
      />

      {/* Notes */}
      <Input label="Notes (optional)" multiline rows={2} value={form.notes} onChange={set('notes')}
        placeholder="Any additional notes…" maxLength={200}
        style={{ marginBottom:14 }}
      />

      {/* Verified toggle (admin) */}
      <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'10px 12px', background: form.verified ? 'var(--bg-success)' : 'var(--bg-raised)', border:`1px solid ${form.verified ? 'rgba(34,197,94,0.3)' : 'var(--border-subtle)'}`, borderRadius:'var(--radius-md)', transition:'all var(--transition-fast)' }}>
        <input type="checkbox" checked={form.verified} onChange={e => set('verified')(e.target.checked)}
          style={{ accentColor:'var(--color-success)', width:16, height:16 }}
        />
        <div>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:13, fontWeight:700, color: form.verified ? 'var(--color-success)' : 'var(--text-primary)' }}>
            Mark as Verified
          </div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)', marginTop:1 }}>
            Verified contributions appear in official reports and totals
          </div>
        </div>
      </label>
    </Modal>
  );
}
