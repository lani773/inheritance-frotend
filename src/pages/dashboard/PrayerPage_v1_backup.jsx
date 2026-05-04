/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Prayer Board  (Task 7)

   Features:
   • Submit prayer requests (public/private)
   • "I'm praying" button — tracks prayer count
   • Mark as answered with testimony
   • Filter: All / Active / Answered / My Prayers
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react';
import { useAuth }  from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { membersService } from '../../services/index';
import Storage, { KEYS } from '../../storage/engine';
import { Avatar, Badge, PageHeader, EmptyState, ConfirmDialog } from '../../components/shared/index';
import Button from '../../components/shared/Button';
import Input  from '../../components/shared/Input';
import Modal  from '../../components/shared/Modal';
import { formatDate, getInitials } from '../../utils/index';

/* ── Prayer storage helpers (separate key from posts) ────────── */
const PrayerStore = {
  getAll:  ()        => Storage.getList(KEYS.PRAYER_REQUESTS),
  add:     (item)    => Storage.addToList(KEYS.PRAYER_REQUESTS, item),
  update:  (id, upd) => Storage.updateInList(KEYS.PRAYER_REQUESTS, id, upd),
  remove:  (id)      => Storage.removeFromList(KEYS.PRAYER_REQUESTS, id),
};

/* ── Prayer card ─────────────────────────────────────────────── */
function PrayerCard({ prayer, author, currentUserId, onPray, onAnswer, onDelete }) {
  const isPraying  = (prayer.prayingUsers || []).includes(currentUserId);
  const isAnswered = prayer.status === 'answered';
  const isOwn      = prayer.authorId === currentUserId;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isAnswered ? 'rgba(34,197,94,0.3)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      transition: 'all var(--transition-normal)',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-sm)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
    >
      <div style={{ height:3, background:`linear-gradient(90deg,transparent,${isAnswered?'var(--color-success)':'var(--color-violet)'},transparent)` }} />
      <div style={{ padding:'16px 18px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
          {prayer.isPrivate ? (
            <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--bg-raised)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🙏</div>
          ) : (
            <Avatar initials={author ? getInitials(author.fullName) : '?'} size={38} />
          )}
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
              {isAnswered && <Badge color="var(--color-success)">✅ ANSWERED</Badge>}
              {prayer.isPrivate && <Badge color="var(--text-muted)" size="xs">🔒 PRIVATE</Badge>}
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)' }}>
              {prayer.isPrivate ? 'Anonymous' : (author?.fullName || `Member #${prayer.authorId}`)}
              &nbsp;·&nbsp;{formatDate(prayer.createdAt, 'relative')}
            </div>
          </div>
          {isOwn && (
            <button onClick={() => onDelete(prayer)}
              style={{ width:28, height:28, borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', background:'var(--bg-raised)', color:'var(--color-error)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              🗑
            </button>
          )}
        </div>

        {/* Request text */}
        <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--text-primary)', lineHeight:1.7, marginBottom:12 }}>
          {prayer.request}
        </p>

        {/* Testimony */}
        {prayer.testimony && (
          <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'var(--radius-md)', padding:'10px 14px', marginBottom:12 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--color-success)', letterSpacing:'0.1em', marginBottom:5 }}>🙌 TESTIMONY</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--color-success)', lineHeight:1.5, margin:0, fontStyle:'italic' }}>
              "{prayer.testimony}"
            </p>
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {/* Pray button */}
          <button
            onClick={() => onPray(prayer.id)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'6px 14px', borderRadius:'var(--radius-full)',
              border:`1px solid ${isPraying ? 'var(--color-violet)' : 'var(--border-subtle)'}`,
              background: isPraying ? 'rgba(139,92,246,0.12)' : 'var(--bg-raised)',
              color: isPraying ? 'var(--color-violet)' : 'var(--text-muted)',
              cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:9,
              fontWeight:600, letterSpacing:'0.06em',
              transition:'all var(--transition-fast)',
            }}
          >
            🙏 {isPraying ? 'Praying' : 'Pray'} ({prayer.prayingUsers?.length || 0})
          </button>

          {/* Mark answered (own requests only) */}
          {isOwn && !isAnswered && (
            <button onClick={() => onAnswer(prayer)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:'var(--radius-full)', border:'1px solid rgba(34,197,94,0.3)', background:'rgba(34,197,94,0.08)', color:'var(--color-success)', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:9, fontWeight:600, letterSpacing:'0.06em', transition:'all var(--transition-fast)' }}>
              ✅ Mark Answered
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function PrayerPage() {
  const { session }  = useAuth();
  const { success: toastOK, info: toastInfo } = useToast();
  const members      = useMemo(() => membersService.getAll(), []);
  const myId         = session?.userId;

  const [prayers,    setPrayers]   = useState(() => PrayerStore.getAll());
  const [filter,     setFilter]    = useState('all');
  const [submitOpen, setSubmitOpen]= useState(false);
  const [answerModal,setAnswerModal]= useState(null);
  const [deleteConf, setDeleteConf]= useState(null);

  const reload = () => setPrayers(PrayerStore.getAll());

  /* ── Filtered list ───────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = prayers;
    if (filter === 'active')   list = list.filter(p => p.status !== 'answered');
    if (filter === 'answered') list = list.filter(p => p.status === 'answered');
    if (filter === 'mine')     list = list.filter(p => p.authorId === myId);
    return list.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
  }, [prayers, filter, myId]);

  /* ── Actions ─────────────────────────────────────────────── */
  const handleSubmit = (data) => {
    PrayerStore.add({ ...data, authorId: myId, prayingUsers: [myId], status: 'active', createdAt: new Date().toISOString() });
    toastOK('Prayer request submitted 🙏');
    reload();
    setSubmitOpen(false);
  };

  const handlePray = (id) => {
    const prayer = prayers.find(p => p.id === id);
    if (!prayer) return;
    const praying = prayer.prayingUsers || [];
    const updated = praying.includes(myId) ? praying.filter(x => x !== myId) : [...praying, myId];
    PrayerStore.update(id, { prayingUsers: updated });
    reload();
  };

  const handleAnswer = (prayer, testimony) => {
    PrayerStore.update(prayer.id, { status: 'answered', testimony });
    toastOK('Praise God! Marked as answered 🙌');
    reload();
    setAnswerModal(null);
  };

  const handleDelete = () => {
    PrayerStore.remove(deleteConf.id);
    toastInfo('Prayer request removed');
    reload();
    setDeleteConf(null);
  };

  /* ── Stats ───────────────────────────────────────────────── */
  const activeCount   = prayers.filter(p => p.status !== 'answered').length;
  const answeredCount = prayers.filter(p => p.status === 'answered').length;
  const totalPrayers  = prayers.reduce((s,p) => s + (p.prayingUsers?.length||0), 0);

  return (
    <div style={{ animation: 'fadeUp 0.35s ease both' }}>
      <PageHeader
        title="Prayer Board"
        subtitle={`${activeCount} active · ${answeredCount} answered · ${totalPrayers} prayers offered`}
        icon="🙏"
        actions={
          <Button variant="primary" icon="🙏" onClick={() => setSubmitOpen(true)}>
            Submit Request
          </Button>
        }
      />

      {/* Stats row */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { icon:'🙏', val:prayers.length,  label:'Total',   color:'var(--color-violet)' },
          { icon:'📿', val:activeCount,      label:'Active',  color:'var(--color-info)'   },
          { icon:'✅', val:answeredCount,    label:'Answered',color:'var(--color-success)' },
          { icon:'💜', val:totalPrayers,     label:'Prayers', color:'var(--color-pink)'   },
        ].map(({ icon, val, label, color }) => (
          <div key={label} style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'10px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:20 }}>{icon}</span>
            <div>
              <div style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:900, color }}>{val}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:18 }}>
        {[
          { id:'all',      label:'All Requests' },
          { id:'active',   label:'Active'       },
          { id:'answered', label:'Answered ✅'  },
          { id:'mine',     label:'My Requests'  },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{
              padding:'6px 14px', borderRadius:'var(--radius-full)', cursor:'pointer',
              background: filter===f.id ? 'var(--color-violet)' : 'var(--bg-raised)',
              color:      filter===f.id ? '#fff' : 'var(--text-muted)',
              border:     `1px solid ${filter===f.id ? 'var(--color-violet)' : 'var(--border-subtle)'}`,
              fontFamily:'var(--font-mono)', fontSize:9, fontWeight:600, letterSpacing:'0.06em',
              textTransform:'uppercase', transition:'all var(--transition-fast)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Prayer list */}
      {filtered.length === 0 ? (
        <EmptyState icon="🙏" title="No prayer requests"
          description="Be the first to submit a prayer request. All requests are kept in confidence."
          action={<Button variant="primary" onClick={() => setSubmitOpen(true)}>Submit Request</Button>}
        />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
          {filtered.map(prayer => (
            <PrayerCard
              key={prayer.id} prayer={prayer}
              author={prayer.isPrivate ? null : members.find(m => m.id === prayer.authorId)}
              currentUserId={myId}
              onPray={handlePray}
              onAnswer={setAnswerModal}
              onDelete={setDeleteConf}
            />
          ))}
        </div>
      )}

      {/* Submit modal */}
      {submitOpen && <SubmitPrayerModal isOpen onClose={() => setSubmitOpen(false)} onSubmit={handleSubmit} />}

      {/* Answer modal */}
      {answerModal && <AnswerModal isOpen prayer={answerModal} onClose={() => setAnswerModal(null)} onSave={handleAnswer} />}

      {/* Delete confirm */}
      <ConfirmDialog isOpen={!!deleteConf} onClose={() => setDeleteConf(null)} onConfirm={handleDelete}
        title="Remove Request" message="Remove this prayer request from the board?" confirmLabel="Remove" confirmVariant="danger"
      />
    </div>
  );
}

/* ── Submit prayer modal ─────────────────────────────────────── */
function SubmitPrayerModal({ isOpen, onClose, onSubmit }) {
  const [request,   setRequest]   = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async () => {
    if (!request.trim()) { setError('Please write your prayer request'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 250));
    onSubmit({ request, isPrivate });
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title="Submit Prayer Request" accent="var(--color-violet)" size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} icon="🙏" onClick={handleSubmit}>Submit</Button>
        </>
      }
    >
      <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:16 }}>
        Share your prayer request with the choir. You can keep it anonymous if you prefer.
      </div>
      <Input label="Your Prayer Request" multiline rows={4} value={request} onChange={setRequest}
        placeholder="Write your request here… The choir will stand in agreement with you."
        required error={error} maxLength={500} style={{ marginBottom:14 }}
      />
      <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'10px 12px', background: isPrivate?'rgba(90,107,133,0.1)':'var(--bg-raised)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)' }}>
        <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)}
          style={{ accentColor:'var(--color-violet)', width:16, height:16 }} />
        <div>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>🔒 Submit Anonymously</div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)' }}>Your name won't be shown on the prayer board</div>
        </div>
      </label>
    </Modal>
  );
}

/* ── Mark as answered modal ──────────────────────────────────── */
function AnswerModal({ isOpen, prayer, onClose, onSave }) {
  const [testimony, setTestimony] = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    onSave(prayer, testimony);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title="🙌 Mark as Answered" accent="var(--color-success)" size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="success" loading={loading} icon="✅" onClick={handleSave}>Mark Answered</Button>
        </>
      }
    >
      <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:16 }}>
        Praise God for answered prayers! Optionally share a brief testimony to encourage the choir.
      </div>
      <Input label="Testimony (optional)" multiline rows={3} value={testimony} onChange={setTestimony}
        placeholder="Share what God did…" maxLength={500}
      />
    </Modal>
  );
}
