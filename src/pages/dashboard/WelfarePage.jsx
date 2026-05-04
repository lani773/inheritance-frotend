/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Welfare & Care Page  (Task 7)

   Features:
   • Case cards with priority, status, fundraising progress
   • Create/edit case modal with full fields
   • Timeline entries: add update notes per case
   • Status change workflow: open → in_progress → resolved
   • Filter by status and priority
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react';
import { useAuth }  from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { welfareService, membersService } from '../../services/index';
import { WELFARE_TYPES, WELFARE_PRIORITIES, MEMBER_STATUS } from '../../config/constants';
import {
  Avatar, Badge, ProgressBar, PageHeader, EmptyState,
  ConfirmDialog, Select, InfoBox,
} from '../../components/shared/index';
import Button from '../../components/shared/Button';
import Input  from '../../components/shared/Input';
import Modal  from '../../components/shared/Modal';
import { formatDate, formatCurrency, getInitials } from '../../utils/index';

const STATUSES = [
  { id:'open',        label:'Open',        color:'var(--color-info)'    },
  { id:'in_progress', label:'In Progress', color:'var(--color-warning)' },
  { id:'resolved',    label:'Resolved',    color:'var(--color-success)' },
];

/* ── Case card ───────────────────────────────────────────────── */
function CaseCard({ wc, member, onEdit, onAddNote, onStatusChange, onDelete }) {
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const priority = WELFARE_PRIORITIES.find(p => p.id === wc.priority);
  const status   = STATUSES.find(s => s.id === wc.status);
  const type     = WELFARE_TYPES.find(t => t.id === wc.type);
  const pct      = wc.amountNeeded
    ? Math.min(100, Math.round(((wc.amountRaised||0) / wc.amountNeeded) * 100))
    : 0;

  const handleNoteSubmit = async () => {
    if (!newNote.trim()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 200));
    onAddNote(wc.id, { action:'Update added', by:'Admin', note: newNote });
    setNewNote('');
    setNoteExpanded(false);
    setSubmitting(false);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${priority?.id === 'urgent' ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
    }}>
      <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${priority?.color||'var(--gold)'},transparent)` }} />
      <div style={{ padding: '18px 20px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14, flexWrap:'wrap' }}>
          {member && (
            <Avatar initials={getInitials(member.fullName)} size={48} />
          )}
          <div style={{ flex:1 }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:700, color:'var(--text-primary)', margin:'0 0 8px' }}>
              {wc.title}
            </h3>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {priority && <Badge color={priority.color}>{priority.label.toUpperCase()}</Badge>}
              {status  && <Badge color={status.color}>{status.label.toUpperCase()}</Badge>}
              {type    && <Badge color="var(--text-muted)" size="xs">{type.label}</Badge>}
              {member  && <Badge color="var(--text-muted)" size="xs">{member.voicePart}</Badge>}
            </div>
          </div>
          {/* Actions */}
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <button onClick={() => onEdit(wc)} title="Edit"
              style={{ width:28, height:28, borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', background:'var(--bg-raised)', color:'var(--text-muted)', cursor:'pointer', fontSize:13 }}>✏️</button>
            <button onClick={() => onDelete(wc)} title="Delete"
              style={{ width:28, height:28, borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', background:'var(--bg-raised)', color:'var(--color-error)', cursor:'pointer', fontSize:13 }}>🗑</button>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:14 }}>
          {wc.description}
        </p>

        {/* Fundraising progress */}
        {wc.amountNeeded > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:'0.08em' }}>FUNDRAISING PROGRESS</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--color-pink)', fontWeight:700 }}>
                {formatCurrency(wc.amountRaised||0,'RWF')} / {formatCurrency(wc.amountNeeded,'RWF')}
              </span>
            </div>
            <ProgressBar value={wc.amountRaised||0} max={wc.amountNeeded} color="var(--color-pink)" height={6} animate />
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', marginTop:4, textAlign:'right' }}>{pct}% raised</div>
          </div>
        )}

        {/* Status change */}
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          {STATUSES.filter(s => s.id !== wc.status).map(s => (
            <button key={s.id} onClick={() => onStatusChange(wc.id, s.id)}
              style={{ padding:'5px 12px', borderRadius:'var(--radius-full)', border:`1px solid ${s.color}30`, background:`${s.color}0c`, color:s.color, cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:9, fontWeight:600, letterSpacing:'0.06em', transition:'all var(--transition-fast)' }}
              onMouseEnter={e => e.currentTarget.style.background=`${s.color}18`}
              onMouseLeave={e => e.currentTarget.style.background=`${s.color}0c`}
            >
              → Mark as {s.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {wc.timeline && wc.timeline.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:10 }}>TIMELINE</div>
            <div style={{ position:'relative', paddingLeft:20 }}>
              <div style={{ position:'absolute', left:7, top:0, bottom:0, width:2, background:'var(--border-subtle)' }} />
              {wc.timeline.map((entry, i) => (
                <div key={i} style={{ position:'relative', marginBottom:10, paddingLeft:12 }}>
                  <div style={{ position:'absolute', left:-7, top:4, width:8, height:8, borderRadius:'50%', background:'var(--color-info)', border:'2px solid var(--bg-card)' }} />
                  <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-primary)', fontWeight:600 }}>{entry.action}</div>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)', lineHeight:1.4 }}>{entry.note}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', marginTop:2 }}>
                    {entry.by} · {formatDate(entry.at, 'relative')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add note */}
        {!noteExpanded ? (
          <button onClick={() => setNoteExpanded(true)}
            style={{ background:'none', border:'1px dashed var(--border-default)', borderRadius:'var(--radius-sm)', padding:'6px 12px', color:'var(--text-muted)', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.06em', width:'100%', transition:'all var(--transition-fast)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-default)'}
          >
            + Add Timeline Note
          </button>
        ) : (
          <div style={{ display:'flex', gap:8 }}>
            <input value={newNote} onChange={e => setNewNote(e.target.value)}
              placeholder="Add an update note…"
              style={{ flex:1, background:'var(--bg-input)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-sm)', padding:'7px 10px', color:'var(--text-primary)', fontSize:12, fontFamily:'var(--font-body)', outline:'none' }}
              onFocus={e => e.target.style.borderColor='var(--gold)'}
              onBlur={e  => e.target.style.borderColor='var(--border-default)'}
            />
            <Button size="xs" variant="primary" loading={submitting} onClick={handleNoteSubmit}>Add</Button>
            <Button size="xs" variant="subtle" onClick={() => { setNoteExpanded(false); setNewNote(''); }}>✕</Button>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid var(--border-subtle)', display:'flex', gap:12, alignItems:'center' }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)' }}>
            Opened {formatDate(wc.createdAt, 'relative')}
          </span>
          {wc.followUpDate && (
            <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--color-warning)' }}>
              Follow-up: {formatDate(wc.followUpDate)}
            </span>
          )}
          {member && (
            <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)', marginLeft:'auto' }}>
              For: {member.fullName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function WelfarePage() {
  const { session }   = useAuth();
  const { success: toastOK, info: toastInfo } = useToast();

  const members = useMemo(() => membersService.getAll(), []);
  const [cases, setCases]        = useState(() => welfareService.getAll());
  const [statusFilter,setStatusF]= useState('all');
  const [priorityFilter,setPrioF]= useState('all');
  const [createModal,setCreate]  = useState(false);
  const [editCase,   setEditCase]= useState(null);
  const [deleteCase, setDeleteCase]=useState(null);

  const reload = () => setCases(welfareService.getAll());

  const filtered = useMemo(() => {
    let list = cases;
    if (statusFilter   !== 'all') list = list.filter(c => c.status === statusFilter);
    if (priorityFilter !== 'all') list = list.filter(c => c.priority === priorityFilter);
    return list.sort((a,b) => {
      const pOrder = { urgent:0, high:1, normal:2, low:3 };
      return (pOrder[a.priority]||3) - (pOrder[b.priority]||3);
    });
  }, [cases, statusFilter, priorityFilter]);

  const handleSave = (data, isEdit) => {
    if (isEdit) {
      welfareService.update(data.id, data);
      toastOK('Case updated');
    } else {
      welfareService.create({ ...data, timeline: [], createdAt: new Date().toISOString() });
      toastOK('Welfare case opened');
    }
    reload();
    setCreate(false);
    setEditCase(null);
  };

  const handleAddNote = (id, entry) => {
    welfareService.addTimelineEntry(id, entry);
    reload();
    toastOK('Note added to timeline');
  };

  const handleStatusChange = (id, newStatus) => {
    welfareService.update(id, { status: newStatus });
    if (newStatus === 'resolved') {
      welfareService.addTimelineEntry(id, { action: 'Case resolved', by: session?.name || 'Admin', note: 'Marked as resolved.' });
    }
    reload();
    toastOK(`Case marked as ${newStatus}`);
  };

  const handleDelete = () => {
    welfareService.update(deleteCase.id, { status: 'resolved' });
    toastInfo('Case closed');
    reload();
    setDeleteCase(null);
  };

  /* ── Stats ───────────────────────────────────────────────── */
  const openCount     = cases.filter(c => c.status !== 'resolved').length;
  const urgentCount   = cases.filter(c => c.priority === 'urgent' && c.status !== 'resolved').length;
  const totalNeeded   = cases.reduce((s,c) => s+(c.amountNeeded||0), 0);
  const totalRaised   = cases.reduce((s,c) => s+(c.amountRaised||0), 0);

  return (
    <div style={{ animation: 'fadeUp 0.35s ease both' }}>
      <PageHeader
        title="Welfare & Care"
        subtitle={`${openCount} open cases · ${urgentCount} urgent`}
        icon="❤️"
        actions={
          <Button variant="primary" icon="+" onClick={() => setCreate(true)}>
            Open Case
          </Button>
        }
      />

      {/* Quick stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
        {[
          { icon:'🔴', val:urgentCount,             label:'Urgent',      color:'var(--color-error)'   },
          { icon:'📂', val:openCount,               label:'Open Cases',  color:'var(--color-warning)' },
          { icon:'✅', val:cases.filter(c=>c.status==='resolved').length, label:'Resolved', color:'var(--color-success)' },
          { icon:'💰', val:formatCurrency(totalRaised,'RWF').replace('RWF ',''), label:'Total Raised', color:'var(--color-pink)' },
        ].map(({ icon, val, label, color }) => (
          <div key={label} style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
            <div style={{ height:3, background:`linear-gradient(90deg,transparent,${color},transparent)` }} />
            <div style={{ padding:'12px 14px' }}>
              <div style={{ fontSize:22, marginBottom:5 }}>{icon}</div>
              <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:900, color }}>{val}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
        <Select value={statusFilter} onChange={setStatusF}
          options={[{value:'all',label:'All Statuses'},...STATUSES.map(s=>({value:s.id,label:s.label}))]}
          style={{ minWidth:160 }}
        />
        <Select value={priorityFilter} onChange={setPrioF}
          options={[{value:'all',label:'All Priorities'},...WELFARE_PRIORITIES.map(p=>({value:p.id,label:p.label}))]}
          style={{ minWidth:160 }}
        />
      </div>

      {/* Cases */}
      {filtered.length === 0 ? (
        <EmptyState icon="❤️" title="No welfare cases" description="No cases match the current filter, or no cases have been opened yet."
          action={<Button variant="primary" onClick={() => setCreate(true)}>Open Case</Button>}
        />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {filtered.map(wc => (
            <CaseCard
              key={wc.id} wc={wc}
              member={members.find(m => m.id === wc.memberId)}
              onEdit={setEditCase}
              onAddNote={handleAddNote}
              onStatusChange={handleStatusChange}
              onDelete={setDeleteCase}
            />
          ))}
        </div>
      )}

      {(createModal || editCase) && (
        <WelfareModal isOpen
          wc={editCase} members={members}
          onClose={() => { setCreate(false); setEditCase(null); }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteCase}
        onClose={() => setDeleteCase(null)}
        onConfirm={handleDelete}
        title="Close Case"
        message={`Mark "${deleteCase?.title}" as closed? This cannot be undone.`}
        confirmLabel="Close Case" confirmVariant="danger"
      />
    </div>
  );
}

/* ── Welfare case modal ──────────────────────────────────────── */
function WelfareModal({ isOpen, wc, members, onClose, onSave }) {
  const isEdit = !!wc;
  const [form, setForm] = useState({
    memberId:     wc?.memberId     || '',
    type:         wc?.type         || 'medical',
    title:        wc?.title        || '',
    description:  wc?.description  || '',
    priority:     wc?.priority     || 'normal',
    status:       wc?.status       || 'open',
    amountNeeded: wc?.amountNeeded || '',
    amountRaised: wc?.amountRaised || 0,
    followUpDate: wc?.followUpDate || '',
    assignedTo:   wc?.assignedTo   || '',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const set = f => v => { setForm(p=>({...p,[f]:v})); setErrors(p=>{const n={...p};delete n[f];return n;}); };

  const handleSubmit = async () => {
    const e = {};
    if (!form.memberId) e.memberId = 'Select a member';
    if (!form.title.trim()) e.title = 'Title is required';
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,250));
    onSave({ ...wc, ...form, memberId:Number(form.memberId), amountNeeded:parseFloat(form.amountNeeded)||0, amountRaised:parseFloat(form.amountRaised)||0 }, isEdit);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={isEdit ? 'Edit Welfare Case' : 'Open New Welfare Case'}
      accent="var(--color-pink)" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>{isEdit?'💾 Save':'❤️ Open Case'}</Button>
        </>
      }
    >
      <Select label="Member" value={String(form.memberId)} onChange={set('memberId')}
        options={[{value:'',label:'Select member…'},...members.filter(m=>m.status==='active').map(m=>({value:String(m.id),label:m.fullName}))]}
        required error={errors.memberId} style={{ marginBottom:14 }}
      />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <Select label="Case Type" value={form.type} onChange={set('type')}
          options={WELFARE_TYPES.map(t=>({value:t.id,label:t.label}))}
        />
        <Select label="Priority" value={form.priority} onChange={set('priority')}
          options={WELFARE_PRIORITIES.map(p=>({value:p.id,label:p.label}))}
        />
      </div>
      <Input label="Title" value={form.title} onChange={set('title')}
        placeholder="Brief case title…" required error={errors.title} style={{ marginBottom:14 }}
      />
      <Input label="Description" multiline rows={3} value={form.description} onChange={set('description')}
        placeholder="Describe the situation and needs…" style={{ marginBottom:14 }}
      />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <Input label="Amount Needed (RWF)" type="number" value={String(form.amountNeeded)} onChange={set('amountNeeded')} placeholder="0" icon="💰" />
        <Input label="Amount Raised (RWF)" type="number" value={String(form.amountRaised)} onChange={set('amountRaised')} placeholder="0" icon="✅" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Input label="Follow-Up Date" type="date" value={form.followUpDate} onChange={set('followUpDate')} />
        <Select label="Status" value={form.status} onChange={set('status')}
          options={STATUSES.map(s=>({value:s.id,label:s.label}))}
        />
      </div>
    </Modal>
  );
}
