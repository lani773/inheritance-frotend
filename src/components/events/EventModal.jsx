/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Event Create / Edit Modal  (Task 5)
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState } from 'react';
import Modal  from '../shared/Modal';
import Button from '../shared/Button';
import Input  from '../shared/Input';
import { Select, InfoBox } from '../shared/index';
import { EVENT_TYPES, VOICE_PARTS } from '../../config/constants';

const typeColor = (t) => EVENT_TYPES.find(e => e.id === t)?.color || 'var(--color-info)';

export default function EventModal({ isOpen, onClose, onSave, event, defaultDate }) {
  const isEdit = !!event;
  const today  = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    title:       event?.title       || '',
    type:        event?.type        || 'rehearsal',
    date:        event?.date        || defaultDate || today,
    time:        event?.time        || '09:00',
    endTime:     event?.endTime     || '12:00',
    location:    event?.location    || '',
    description: event?.description || '',
    mandatory:   event?.mandatory   ?? false,
    recurrence:  event?.recurrence  || 'none',
    targetVoices:event?.targetVoices|| ['Soprano','Alto','Tenor','Bass'],
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (f) => (v) => { setForm(p => ({ ...p, [f]: v })); setErrors(p => { const n={...p}; delete n[f]; return n; }); };

  const toggleVoice = (vp) => {
    const curr = form.targetVoices;
    set('targetVoices')(curr.includes(vp) ? curr.filter(v => v !== vp) : [...curr, vp]);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title    = 'Event title is required';
    if (!form.date)         e.date     = 'Date is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (form.targetVoices.length === 0) e.targetVoices = 'Select at least one voice part';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 250));
    onSave({ ...event, ...form }, isEdit);
    setLoading(false);
  };

  const VP_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };
  const RECURRENCE = [
    { value:'none',    label:'No Recurrence'    },
    { value:'daily',   label:'Daily'            },
    { value:'weekly',  label:'Weekly'           },
    { value:'monthly', label:'Monthly'          },
  ];

  const selectedType = EVENT_TYPES.find(t => t.id === form.type);

  return (
    <Modal
      isOpen={isOpen} onClose={onClose}
      title={isEdit ? `Edit — ${event.title}` : 'Create New Event'}
      subtitle={isEdit ? 'Update event details' : 'Add a new event or rehearsal to the schedule'}
      accent={typeColor(form.type)} size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            {isEdit ? '💾 Save Changes' : '✅ Create Event'}
          </Button>
        </>
      }
    >
      {/* Event type selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Event Type
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {EVENT_TYPES.map(t => {
            const sel = form.type === t.id;
            return (
              <button key={t.id} type="button" onClick={() => set('type')(t.id)}
                style={{
                  padding: '10px 8px', borderRadius: 'var(--radius-md)',
                  border: `2px solid ${sel ? t.color : 'var(--border-default)'}`,
                  background: sel ? `${t.color}14` : 'var(--bg-raised)',
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.2s', transform: sel ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 3 }}>{t.icon}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 700, color: sel ? t.color : 'var(--text-primary)' }}>{t.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <Input label="Event Title" value={form.title} onChange={set('title')}
        placeholder="e.g. Sunday Morning Rehearsal" required error={errors.title}
        style={{ marginBottom: 14 }}
      />

      {/* Date + Times */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <Input label="Date" type="date" value={form.date} onChange={set('date')} required error={errors.date} />
        <Input label="Start Time" type="time" value={form.time} onChange={set('time')} />
        <Input label="End Time"   type="time" value={form.endTime} onChange={set('endTime')} />
      </div>

      {/* Location + Recurrence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <Input label="Location" value={form.location} onChange={set('location')}
          placeholder="Main Sanctuary" required error={errors.location} icon="📍"
        />
        <Select label="Recurrence" value={form.recurrence} onChange={set('recurrence')}
          options={RECURRENCE}
        />
      </div>

      {/* Description */}
      <Input label="Description" multiline rows={2}
        value={form.description} onChange={set('description')}
        placeholder="Event details, instructions, notes…"
        style={{ marginBottom: 16 }} maxLength={400}
      />

      {/* Mandatory toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20, padding: '12px 14px', background: form.mandatory ? 'rgba(239,68,68,0.08)' : 'var(--bg-raised)', border: `1px solid ${form.mandatory ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', transition: 'all var(--transition-fast)' }}>
        <input type="checkbox" checked={form.mandatory} onChange={e => set('mandatory')(e.target.checked)}
          style={{ accentColor: 'var(--color-error)', width: 16, height: 16 }}
        />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, color: form.mandatory ? 'var(--color-error)' : 'var(--text-primary)' }}>
            Mandatory Attendance
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            All targeted members are required to attend this event
          </div>
        </div>
      </label>

      {/* Target voices */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: errors.targetVoices ? 'var(--color-error)' : 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Target Voice Parts <span style={{ color: 'var(--color-error)' }}>*</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* All toggle */}
          <button type="button"
            onClick={() => set('targetVoices')(form.targetVoices.length === 4 ? [] : ['Soprano','Alto','Tenor','Bass'])}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              border: `1px solid ${form.targetVoices.length === 4 ? 'var(--gold)' : 'var(--border-default)'}`,
              background: form.targetVoices.length === 4 ? 'var(--gold-alpha-10)' : 'var(--bg-raised)',
              color: form.targetVoices.length === 4 ? 'var(--gold)' : 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 9,
              fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: 'all var(--transition-fast)',
            }}
          >
            All Voices
          </button>

          {VOICE_PARTS.map(vp => {
            const sel = form.targetVoices.includes(vp.id);
            const c   = VP_COLORS[vp.id];
            return (
              <button key={vp.id} type="button" onClick={() => toggleVoice(vp.id)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-full)',
                  border: `1px solid ${sel ? c : 'var(--border-default)'}`,
                  background: sel ? `${c}15` : 'var(--bg-raised)',
                  color: sel ? c : 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 9,
                  fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  transition: 'all var(--transition-fast)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <span>{vp.icon}</span>
                {vp.label}
              </button>
            );
          })}
        </div>
        {errors.targetVoices && <p style={{ color: 'var(--color-error)', fontSize: 11, marginTop: 6 }}>⚠ {errors.targetVoices}</p>}
      </div>
    </Modal>
  );
}
