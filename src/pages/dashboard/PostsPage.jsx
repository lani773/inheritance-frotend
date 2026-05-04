/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Posts / Announcements Page  (Task 7)

   Features:
   • 5 post types: Announcement, Prayer, Praise, Reminder, News
   • Pin to top, view counter, tag system
   • Create/edit post modal with rich text area
   • Filter by type pill buttons
   • Archive / delete posts
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react';
import { useAuth }  from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { postsService, membersService } from '../../services/index';
import { POST_TYPES } from '../../config/constants';
import { Avatar, Badge, PageHeader, EmptyState, ConfirmDialog, InfoBox } from '../../components/shared/index';
import Button from '../../components/shared/Button';
import Input  from '../../components/shared/Input';
import Modal  from '../../components/shared/Modal';
import { Select } from '../../components/shared/index';
import { formatDate, getInitials } from '../../utils/index';

/* ── Post type config lookup ─────────────────────────────────── */
const typeOf = (id) => POST_TYPES.find(t => t.id === id) || POST_TYPES[0];

/* ── Post card ───────────────────────────────────────────────── */
function PostCard({ post, author, onEdit, onDelete, onPin }) {
  const [expanded, setExpanded] = useState(false);
  const type = typeOf(post.type);
  const isLong = post.body?.length > 200;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${post.pinned ? 'var(--border-gold)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      animation: 'fadeUp 0.3s ease both',
      transition: 'all var(--transition-normal)',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
    >
      {/* Accent stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${type.color},transparent)` }} />

      <div style={{ padding: '18px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            {/* Pin badge */}
            {post.pinned && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <span style={{ fontSize: 12 }}>📌</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--gold)', letterSpacing: '0.1em' }}>PINNED</span>
              </div>
            )}
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              {post.title}
            </h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Badge color={type.color}>{type.icon} {type.label.toUpperCase()}</Badge>
              {post.tags?.map(tag => (
                <Badge key={tag} color="var(--text-muted)" size="xs">#{tag}</Badge>
              ))}
            </div>
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => onPin(post)} title={post.pinned ? 'Unpin' : 'Pin to top'}
              style={{ width:28, height:28, borderRadius:'var(--radius-sm)', border:`1px solid ${post.pinned?'var(--gold)':'var(--border-subtle)'}`, background:'var(--bg-raised)', color:post.pinned?'var(--gold)':'var(--text-muted)', cursor:'pointer', fontSize:13 }}>
              📌
            </button>
            <button onClick={() => onEdit(post)} title="Edit"
              style={{ width:28, height:28, borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', background:'var(--bg-raised)', color:'var(--text-muted)', cursor:'pointer', fontSize:13 }}>
              ✏️
            </button>
            <button onClick={() => onDelete(post)} title="Delete"
              style={{ width:28, height:28, borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', background:'var(--bg-raised)', color:'var(--color-error)', cursor:'pointer', fontSize:13 }}>
              🗑
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 14,
          color: 'var(--text-secondary)', lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          maxHeight: expanded ? 'none' : '100px',
          WebkitMaskImage: !expanded && isLong
            ? 'linear-gradient(to bottom, black 60%, transparent 100%)'
            : 'none',
        }}>
          {post.body}
        </div>

        {isLong && (
          <button onClick={() => setExpanded(e => !e)}
            style={{ background:'none', border:'none', color:'var(--gold)', cursor:'pointer', fontFamily:'var(--font-body)', fontSize:12, marginTop:6, padding:0 }}>
            {expanded ? '▲ Show less' : '▼ Read more'}
          </button>
        )}

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:14, paddingTop:12, borderTop:'1px solid var(--border-subtle)' }}>
          {author && (
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <Avatar initials={getInitials(author.fullName)} size={24} />
              <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)' }}>
                {author.fullName.split(' ')[0]}
              </span>
            </div>
          )}
          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:'0.05em' }}>
            {formatDate(post.createdAt, 'relative')}
          </span>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', marginLeft:'auto' }}>
            👁 {post.viewCount || 0} views
          </span>
          {post.expiresAt && (
            <Badge
              color={new Date(post.expiresAt) > new Date() ? 'var(--color-warning)' : 'var(--color-error)'}
              size="xs"
            >
              Expires {formatDate(post.expiresAt)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function PostsPage() {
  const { session }          = useAuth();
  const { success: toastOK, info: toastInfo } = useToast();

  const members = useMemo(() => membersService.getAll(), []);
  const [posts, setPosts]    = useState(() => postsService.getAll());
  const [typeFilter,setTypeFilter] = useState('all');
  const [createModal,setCreateModal] = useState(false);
  const [editPost,   setEditPost]    = useState(null);
  const [deletePost, setDeletePost]  = useState(null);

  const reload = () => setPosts(postsService.getAll());

  /* ── Filtered list ───────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = posts;
    if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter);
    return list;
  }, [posts, typeFilter]);

  /* ── CRUD ────────────────────────────────────────────────── */
  const handleSave = (data, isEdit) => {
    if (isEdit) {
      postsService.update(data.id, data);
      toastOK('Post updated');
    } else {
      postsService.create({ ...data, authorId: session?.userId, viewCount: 0, createdAt: new Date().toISOString() });
      toastOK('Post published!');
    }
    reload();
    setCreateModal(false);
    setEditPost(null);
  };

  const handleDelete = () => {
    postsService.delete(deletePost.id);
    toastInfo('Post removed');
    reload();
    setDeletePost(null);
  };

  const handlePin = (post) => {
    postsService.update(post.id, { pinned: !post.pinned });
    toastOK(post.pinned ? 'Post unpinned' : 'Post pinned to top');
    reload();
  };

  /* ── Counts per type ─────────────────────────────────────── */
  const counts = useMemo(() => {
    const c = { all: posts.length };
    POST_TYPES.forEach(t => { c[t.id] = posts.filter(p => p.type === t.id).length; });
    return c;
  }, [posts]);

  return (
    <div style={{ animation: 'fadeUp 0.35s ease both' }}>
      <PageHeader
        title="Announcements & Posts"
        subtitle={`${posts.length} total posts · ${posts.filter(p=>p.pinned).length} pinned`}
        icon="📢"
        actions={
          <Button variant="primary" icon="+" onClick={() => setCreateModal(true)}>
            New Post
          </Button>
        }
      />

      {/* Type filter pills */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        <button
          onClick={() => setTypeFilter('all')}
          style={{
            padding:'5px 14px', borderRadius:'var(--radius-full)', cursor:'pointer',
            background: typeFilter==='all' ? 'var(--gold)' : 'var(--bg-raised)',
            color:      typeFilter==='all' ? 'var(--text-inverse)' : 'var(--text-muted)',
            border:     `1px solid ${typeFilter==='all' ? 'var(--gold)' : 'var(--border-subtle)'}`,
            fontFamily:'var(--font-mono)', fontSize:9, fontWeight:600, letterSpacing:'0.06em',
            textTransform:'uppercase', transition:'all var(--transition-fast)',
          }}
        >
          All ({counts.all})
        </button>
        {POST_TYPES.map(t => (
          <button key={t.id}
            onClick={() => setTypeFilter(t.id)}
            style={{
              padding:'5px 14px', borderRadius:'var(--radius-full)', cursor:'pointer',
              background: typeFilter===t.id ? `${t.color}18` : 'var(--bg-raised)',
              color:      typeFilter===t.id ? t.color : 'var(--text-muted)',
              border:     `2px solid ${typeFilter===t.id ? t.color : 'var(--border-subtle)'}`,
              fontFamily:'var(--font-mono)', fontSize:9, fontWeight:600, letterSpacing:'0.06em',
              textTransform:'uppercase', transition:'all var(--transition-fast)',
              display:'flex', alignItems:'center', gap:5,
            }}
          >
            <span>{t.icon}</span>
            {t.label} {counts[t.id] ? `(${counts[t.id]})` : ''}
          </button>
        ))}
      </div>

      {/* Post grid */}
      {filtered.length === 0 ? (
        <EmptyState icon="📢" title="No posts yet"
          description="Be the first to post an announcement, praise report, or reminder."
          action={<Button variant="primary" onClick={() => setCreateModal(true)}>+ Create Post</Button>}
        />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {filtered.map(post => (
            <PostCard
              key={post.id}
              post={post}
              author={members.find(m => m.id === post.authorId)}
              onEdit={setEditPost}
              onDelete={setDeletePost}
              onPin={handlePin}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {(createModal || editPost) && (
        <PostModal
          isOpen
          post={editPost}
          onClose={() => { setCreateModal(false); setEditPost(null); }}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deletePost}
        onClose={() => setDeletePost(null)}
        onConfirm={handleDelete}
        title="Delete Post"
        message={`Delete "${deletePost?.title}"? This cannot be undone.`}
        confirmLabel="Delete" confirmVariant="danger"
      />
    </div>
  );
}

/* ── Post create/edit modal ──────────────────────────────────── */
function PostModal({ isOpen, post, onClose, onSave }) {
  const isEdit = !!post;
  const [form, setForm] = useState({
    type:       post?.type       || 'announcement',
    title:      post?.title      || '',
    body:       post?.body       || '',
    pinned:     post?.pinned     ?? false,
    expiresAt:  post?.expiresAt  || '',
    tags:       post?.tags?.join(', ') || '',
  });
  const [errors, setErrors]   = useState({});
  const [loading,setLoading]  = useState(false);
  const set = f => v => { setForm(p=>({...p,[f]:v})); setErrors(p=>{const n={...p};delete n[f];return n;}); };

  const handleSubmit = async () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.body.trim())  e.body  = 'Body is required';
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,250));
    onSave({
      ...post, ...form,
      tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
      expiresAt: form.expiresAt || null,
    }, isEdit);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={isEdit ? 'Edit Post' : 'New Post'}
      accent={typeOf(form.type).color}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            {isEdit ? '💾 Save' : '📢 Publish'}
          </Button>
        </>
      }
    >
      {/* Type selector */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-secondary)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.1em' }}>Post Type</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {POST_TYPES.map(t => {
            const sel = form.type === t.id;
            return (
              <button key={t.id} type="button" onClick={() => set('type')(t.id)}
                style={{ padding:'8px', borderRadius:'var(--radius-md)', border:`2px solid ${sel?t.color:'var(--border-default)'}`, background:sel?`${t.color}12`:'var(--bg-raised)', cursor:'pointer', textAlign:'center', transition:'all 0.2s' }}>
                <div style={{ fontSize:18, marginBottom:2 }}>{t.icon}</div>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:10, fontWeight:700, color:sel?t.color:'var(--text-primary)' }}>{t.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <Input label="Title" value={form.title} onChange={set('title')}
        placeholder="Post title…" required error={errors.title} style={{ marginBottom:12 }}
      />
      <Input label="Body" multiline rows={5} value={form.body} onChange={set('body')}
        placeholder="Write your post content…" required error={errors.body} maxLength={2000}
        style={{ marginBottom:12 }}
      />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <Input label="Tags (comma separated)" value={form.tags} onChange={set('tags')} placeholder="prayer, easter…" />
        <Input label="Expires On (optional)" type="date" value={form.expiresAt} onChange={set('expiresAt')} />
      </div>

      <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'10px 12px', background: form.pinned?'var(--gold-alpha-10)':'var(--bg-raised)', border:`1px solid ${form.pinned?'var(--border-gold)':'var(--border-subtle)'}`, borderRadius:'var(--radius-md)', transition:'all var(--transition-fast)' }}>
        <input type="checkbox" checked={form.pinned} onChange={e=>set('pinned')(e.target.checked)} style={{ accentColor:'var(--gold)', width:16, height:16 }} />
        <div>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:13, fontWeight:700, color:form.pinned?'var(--gold)':'var(--text-primary)' }}>📌 Pin to top</div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)' }}>Pinned posts always appear first</div>
        </div>
      </label>
    </Modal>
  );
}
