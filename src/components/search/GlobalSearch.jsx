/**
 * INHERITANCE CHOIR — Global Search
 * Cmd+K / Ctrl+K spotlight-style search across members, events,
 * songs, contributions, posts, and messages.
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Search index (in real app, this comes from API) ────────────
function buildIndex(storage) {
  const index = [];

  // Members
  const members = JSON.parse(localStorage.getItem('choir_members') || '[]');
  members.forEach(m => index.push({
    type: 'member', id: m.id,
    title: m.fullName, subtitle: `${m.voicePart} · ${m.role} · ${m.email}`,
    icon: '👤', color: '#3B82F6',
    url: `/dashboard/members/${m.id}`,
    keywords: [m.fullName, m.email, m.voicePart, m.role].join(' ').toLowerCase(),
    status: m.status,
  }));

  // Events
  const events = JSON.parse(localStorage.getItem('choir_events') || '[]');
  events.forEach(e => index.push({
    type: 'event', id: e.id,
    title: e.title, subtitle: `${e.date} · ${e.time} · ${e.location}`,
    icon: { rehearsal:'🎵', performance:'🌟', service:'⛪', meeting:'👥', workshop:'📚' }[e.type] || '📅',
    color: '#C9A84C',
    url: '/dashboard/events',
    keywords: [e.title, e.location, e.type, e.date].join(' ').toLowerCase(),
  }));

  // Songs
  const songs = JSON.parse(localStorage.getItem('choir_songs') || '[]');
  songs.forEach(s => index.push({
    type: 'song', id: s.id,
    title: s.title, subtitle: `${s.artist || 'Unknown'} · ${s.language} · Key ${s.key || '?'}`,
    icon: '🎶', color: '#8B5CF6',
    url: '/dashboard/songs',
    keywords: [s.title, s.artist, s.language, s.genre].join(' ').toLowerCase(),
  }));

  // Pages
  const pages = [
    { title:'Dashboard',     subtitle:'Overview & KPIs',          icon:'🏠', url:'/dashboard',                 color:'#22C55E' },
    { title:'Members',       subtitle:'Manage choir members',      icon:'👥', url:'/dashboard/members',         color:'#3B82F6' },
    { title:'Attendance',    subtitle:'Mark & track attendance',   icon:'✅', url:'/dashboard/attendance',      color:'#22C55E' },
    { title:'Contributions', subtitle:'Financial contributions',   icon:'💰', url:'/dashboard/contributions',   color:'#C9A84C' },
    { title:'Events',        subtitle:'Choir events & rehearsals', icon:'📅', url:'/dashboard/events',          color:'#C9A84C' },
    { title:'Messages',      subtitle:'Choir messaging',           icon:'💬', url:'/dashboard/messages',        color:'#EC4899' },
    { title:'Analytics',     subtitle:'Reports & insights',        icon:'📊', url:'/dashboard/analytics',       color:'#06B6D4' },
    { title:'Songs',         subtitle:'Song library & setlists',   icon:'🎶', url:'/dashboard/songs',           color:'#8B5CF6' },
    { title:'Welfare',       subtitle:'Welfare cases',             icon:'❤️', url:'/dashboard/welfare',         color:'#EC4899' },
    { title:'Automation',    subtitle:'Workflow automation',       icon:'⚙️', url:'/dashboard/automation',      color:'#F59E0B' },
    { title:'Settings',      subtitle:'App settings',              icon:'⚙',  url:'/dashboard/settings',        color:'#94A3B8' },
    { title:'My Account',    subtitle:'Self-service portal',       icon:'👤', url:'/dashboard/my-account',      color:'#3B82F6' },
    { title:'Reports',       subtitle:'Generate reports',          icon:'📋', url:'/dashboard/reports',         color:'#22C55E' },
  ];
  pages.forEach(p => index.push({ type:'page', ...p, keywords: (p.title+' '+p.subtitle).toLowerCase() }));

  return index;
}

// ── Highlight matching text ────────────────────────────────────
function Highlight({ text = '', query = '' }) {
  if (!query.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((p, i) =>
        regex.test(p)
          ? <mark key={i} style={{ background:'rgba(201,168,76,0.3)', color:'#F0F4FF', borderRadius:2, padding:'0 1px' }}>{p}</mark>
          : p
      )}
    </span>
  );
}

// ── Main search component ──────────────────────────────────────
export function GlobalSearch({ onClose }) {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(0);
  const [filter,   setFilter]   = useState('all');
  const inputRef = useRef(null);
  const listRef  = useRef(null);
  const navigate = useNavigate();

  const index = useMemo(() => buildIndex(), []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Show recent / quick actions when empty
      return [
        { type:'action', title:'Open Dashboard',     icon:'🏠', url:'/dashboard',              color:'#22C55E',  keywords:'dashboard' },
        { type:'action', title:'Mark Attendance',    icon:'✅', url:'/dashboard/attendance',   color:'#22C55E',  keywords:'attendance' },
        { type:'action', title:'Record Contribution',icon:'💰', url:'/dashboard/contributions',color:'#C9A84C',  keywords:'contribution' },
        { type:'action', title:'New Event',          icon:'📅', url:'/dashboard/events',       color:'#C9A84C',  keywords:'event' },
        { type:'action', title:'Send Message',       icon:'💬', url:'/dashboard/messages',     color:'#EC4899',  keywords:'message' },
        { type:'action', title:'View Reports',       icon:'📊', url:'/dashboard/analytics',    color:'#06B6D4',  keywords:'reports' },
      ];
    }
    return index
      .filter(item => (filter === 'all' || item.type === filter) && item.keywords.includes(q))
      .slice(0, 12);
  }, [query, filter, index]);

  useEffect(() => { setSelected(0); }, [results]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s+1, results.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s-1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); navigate(results[selected]?.url || '/dashboard'); onClose?.(); }
    if (e.key === 'Escape')    { onClose?.(); }
  }, [results, selected, navigate, onClose]);

  const go = (url) => { navigate(url); onClose?.(); };

  const groupedResults = useMemo(() => {
    const g = {};
    results.forEach(r => {
      if (!g[r.type]) g[r.type] = [];
      g[r.type].push(r);
    });
    return g;
  }, [results]);

  const flatResults = results;
  let flatIdx = -1;

  const FILTERS = [
    { id:'all',        label:'All' },
    { id:'member',     label:'👤 Members' },
    { id:'event',      label:'📅 Events' },
    { id:'song',       label:'🎶 Songs' },
    { id:'page',       label:'📄 Pages' },
  ];

  return (
    <div
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
        backdropFilter:'blur(8px)', zIndex:99999,
        display:'flex', alignItems:'flex-start', justifyContent:'center',
        paddingTop:'10vh',
      }}
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div style={{
        width:'100%', maxWidth:640,
        background:'linear-gradient(180deg, #0F172A, #0A1628)',
        border:'1px solid #1E2D4A',
        borderRadius:20, overflow:'hidden',
        boxShadow:'0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)',
        animation:'scaleIn 0.2s ease',
      }}>
        {/* Input */}
        <div style={{
          display:'flex', alignItems:'center', gap:12,
          padding:'16px 20px', borderBottom:'1px solid #1E2D4A',
        }}>
          <span style={{ fontSize:18, color:'#C9A84C' }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search members, events, songs, pages…"
            style={{
              flex:1, background:'none', border:'none', outline:'none',
              color:'#F0F4FF', fontSize:16, fontFamily:'Crimson Pro, serif',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:18 }}>×</button>
          )}
          <kbd style={{
            background:'#141E33', border:'1px solid #1E2D4A',
            borderRadius:6, padding:'2px 7px', fontSize:11,
            color:'#64748B', flexShrink:0,
          }}>
            ESC
          </kbd>
        </div>

        {/* Filter chips */}
        <div style={{ display:'flex', gap:6, padding:'10px 16px', borderBottom:'1px solid #1E2D4A', overflowX:'auto' }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding:'4px 12px', borderRadius:20, border:'none',
                background: filter===f.id ? 'rgba(201,168,76,0.2)' : '#141E33',
                color: filter===f.id ? '#C9A84C' : '#64748B',
                fontSize:12, fontWeight: filter===f.id ? 700 : 400,
                cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap',
                boxShadow: filter===f.id ? '0 0 0 1px rgba(201,168,76,0.3)' : 'none',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight:440, overflowY:'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding:'40px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🔍</div>
              <p style={{ color:'#64748B', fontSize:14 }}>No results for "{query}"</p>
            </div>
          ) : (
            Object.entries(groupedResults).map(([type, items]) => {
              const TYPE_LABELS = {
                member:'Members', event:'Events', song:'Songs',
                page:'Pages', action:'Quick Actions',
              };
              return (
                <div key={type}>
                  <p style={{
                    padding:'8px 20px 4px', margin:0,
                    fontSize:10, color:'#374151',
                    textTransform:'uppercase', letterSpacing:'0.1em',
                  }}>
                    {TYPE_LABELS[type] || type}
                  </p>
                  {items.map(item => {
                    flatIdx++;
                    const isSelected = flatIdx === selected;
                    return (
                      <div
                        key={item.id || item.title}
                        onClick={() => go(item.url)}
                        style={{
                          display:'flex', alignItems:'center', gap:14,
                          padding:'11px 20px', cursor:'pointer',
                          background: isSelected ? 'rgba(201,168,76,0.08)' : 'transparent',
                          borderLeft: isSelected ? '2px solid #C9A84C' : '2px solid transparent',
                          transition:'all 0.1s',
                        }}
                        onMouseEnter={() => setSelected(flatIdx)}
                      >
                        <div style={{
                          width:36, height:36, borderRadius:10, flexShrink:0,
                          background:`${item.color}15`,
                          border:`1px solid ${item.color}25`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:17,
                        }}>
                          {item.icon}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ margin:0, fontSize:14, color:'#F0F4FF', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            <Highlight text={item.title} query={query} />
                          </p>
                          <p style={{ margin:'1px 0 0', fontSize:11, color:'#64748B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            <Highlight text={item.subtitle || item.type} query={query} />
                          </p>
                        </div>
                        {item.type === 'member' && item.status && (
                          <span style={{
                            fontSize:10, color: item.status==='active'?'#22C55E':'#F59E0B',
                            background: item.status==='active'?'#22C55E11':'#F59E0B11',
                            border:`1px solid ${item.status==='active'?'#22C55E33':'#F59E0B33'}`,
                            borderRadius:4, padding:'1px 6px', flexShrink:0,
                          }}>
                            {item.status}
                          </span>
                        )}
                        <kbd style={{ background:'#141E33', border:'1px solid #1E2D4A', borderRadius:4, padding:'1px 5px', fontSize:9, color:'#374151', flexShrink:0, opacity: isSelected ? 1 : 0, transition:'opacity 0.1s' }}>
                          ↵
                        </kbd>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:'10px 20px', borderTop:'1px solid #1E2D4A',
          display:'flex', gap:16, fontSize:11, color:'#374151',
        }}>
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>ESC Close</span>
          <span style={{ marginLeft:'auto' }}>{results.length} result{results.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

// ── Search trigger hook (Cmd+K / Ctrl+K) ──────────────────────
export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen };
}

// ── Search button component ────────────────────────────────────
export function SearchButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:10,
        padding:'7px 14px',
        background:'#141E33',
        border:'1px solid #1E2D4A',
        borderRadius:10, cursor:'pointer', color:'#64748B',
        fontSize:13, transition:'all 0.2s',
        minWidth:200,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#C9A84C44'; e.currentTarget.style.color='#94A3B8'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#1E2D4A';   e.currentTarget.style.color='#64748B'; }}
    >
      <span>🔍</span>
      <span style={{ flex:1, textAlign:'left' }}>Search everything…</span>
      <kbd style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:4, padding:'1px 6px', fontSize:10 }}>
        ⌘K
      </kbd>
    </button>
  );
}
