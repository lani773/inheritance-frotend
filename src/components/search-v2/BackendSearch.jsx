/**
 * INHERITANCE CHOIR — Backend-Powered Full-Text Search
 * Uses MongoDB $text indexes via the Go Gin backend.
 * Falls back to client-side search when offline.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate }   from 'react-router-dom';
import { usePWA }        from '../pwa/PWAManager';
import { searchAPI }     from '../../services/api/endpoints';

const RESULT_ICONS = {
  member:       { icon: '👤', color: '#3B82F6', path: (r) => `/dashboard/members/${r.id}` },
  event:        { icon: '📅', color: '#C9A84C', path: ()  => '/dashboard/events' },
  song:         { icon: '🎶', color: '#8B5CF6', path: ()  => '/dashboard/songs' },
  contribution: { icon: '💰', color: '#22C55E', path: ()  => '/dashboard/contributions' },
  post:         { icon: '📰', color: '#EC4899', path: ()  => '/dashboard/posts' },
  welfare:      { icon: '❤️', color: '#EF4444', path: ()  => '/dashboard/welfare' },
};

// ── Highlight function ─────────────────────────────────────────
function Highlight({ text = '', query = '' }) {
  if (!query.trim() || !text) return <span>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((p, i) =>
        regex.test(p)
          ? <mark key={i} style={{ background: 'rgba(201,168,76,0.3)', color: '#F0F4FF', borderRadius: 2, padding: '0 1px' }}>{p}</mark>
          : p
      )}
    </span>
  );
}

// ── Debounce hook ──────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Main search panel ──────────────────────────────────────────
export function BackendSearch({ onClose }) {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState(0);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(false);
  const inputRef   = useRef(null);
  const navigate   = useNavigate();
  const { isOffline } = usePWA();

  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelected(0); }, [results]);

  // ── Search ─────────────────────────────────────────────────
  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); setError(null); return; }
    if (debouncedQuery.length < 2) return;

    setLoading(true);
    setError(null);

    searchAPI.search(debouncedQuery, filter, 1)
      .then(res => {
        // Go backend returns: { data: [...], total, page, pageSize }
        const items = res?.data || res?.results || [];
        setResults(items);
        setHasMore((res?.total || 0) > items.length);
        setPage(1);
      })
      .catch(err => {
        if (err.name === 'NetworkError' && isOffline) {
          setError('offline');
          // Client-side fallback
          setResults(clientSideSearch(debouncedQuery, filter));
        } else {
          setError('API search unavailable — showing local results');
          setResults(clientSideSearch(debouncedQuery, filter));
        }
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, filter, isOffline]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const res = await searchAPI.search(debouncedQuery, filter, page + 1);
      setResults(prev => [...prev, ...(res?.data || [])]);
      setPage(p => p + 1);
      setHasMore((res?.total || 0) > (page + 1) * (res?.pageSize || 10));
    } catch { /* ignore */ }
    setLoading(false);
  }, [debouncedQuery, filter, page, hasMore, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter')     { const r = results[selected]; if (r) { go(r); } }
    if (e.key === 'Escape')    { onClose?.(); }
  };

  const go = (result) => {
    const cfg = RESULT_ICONS[result.type] || RESULT_ICONS.member;
    navigate(cfg.path(result));
    onClose?.();
  };

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'member', label: '👤 Members' },
    { id: 'event', label: '📅 Events' },
    { id: 'song', label: '🎶 Songs' },
    { id: 'contribution', label: '💰 Finance' },
    { id: 'post', label: '📰 Posts' },
  ];

  // Group results by type
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  let flatIdx = -1;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div style={{ width: '100%', maxWidth: 660, background: 'linear-gradient(180deg, #0F172A, #0A1628)', border: '1px solid #1E2D4A', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', animation: 'scaleIn 0.2s ease' }}>
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #1E2D4A' }}>
          <span style={{ fontSize: 18, color: loading ? '#C9A84C' : '#64748B', transition: 'color 0.2s', animation: loading ? 'spin 1s linear infinite' : 'none' }}>
            {loading ? '⟳' : '🔍'}
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search members, events, songs, posts…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#F0F4FF', fontSize: 16, fontFamily: 'Crimson Pro, serif' }}
          />
          {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 18 }}>×</button>}
          <kbd style={{ background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 6, padding: '2px 7px', fontSize: 11, color: '#64748B', flexShrink: 0 }}>ESC</kbd>
        </div>

        {/* Status bar */}
        {(isOffline || error) && (
          <div style={{ padding: '8px 20px', background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)', fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📡</span>
            {isOffline ? 'Offline — showing cached local results' : error}
          </div>
        )}

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid #1E2D4A', overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '4px 12px', borderRadius: 20, border: 'none',
              background: filter === f.id ? 'rgba(201,168,76,0.2)' : '#141E33',
              color: filter === f.id ? '#C9A84C' : '#64748B',
              fontSize: 12, fontWeight: filter === f.id ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              boxShadow: filter === f.id ? '0 0 0 1px rgba(201,168,76,0.3)' : 'none',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div style={{ maxHeight: 440, overflowY: 'auto' }}>
          {!debouncedQuery.trim() ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <p style={{ color: '#64748B', fontSize: 14 }}>
                Start typing to search across all choir data
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                {['Marie', 'Sunday Service', 'Amazing Grace', 'tithe'].map(hint => (
                  <button key={hint} onClick={() => setQuery(hint)} style={{ padding: '4px 12px', background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 20, color: '#64748B', fontSize: 12, cursor: 'pointer' }}>
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🤷</div>
              <p style={{ color: '#64748B', fontSize: 14 }}>No results for "{query}"</p>
            </div>
          ) : (
            <>
              {Object.entries(grouped).map(([type, items]) => {
                const cfg = RESULT_ICONS[type] || RESULT_ICONS.member;
                const typeLabels = { member: 'Members', event: 'Events', song: 'Songs', contribution: 'Contributions', post: 'Posts', welfare: 'Welfare' };
                return (
                  <div key={type}>
                    <p style={{ padding: '8px 20px 4px', margin: 0, fontSize: 10, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {typeLabels[type] || type}
                    </p>
                    {items.map(result => {
                      flatIdx++;
                      const isSelected = flatIdx === selected;
                      return (
                        <div
                          key={result.id}
                          onClick={() => go(result)}
                          onMouseEnter={() => setSelected(flatIdx)}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', cursor: 'pointer', background: isSelected ? 'rgba(201,168,76,0.08)' : 'transparent', borderLeft: `2px solid ${isSelected ? '#C9A84C' : 'transparent'}`, transition: 'all 0.1s' }}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${cfg.color}15`, border: `1px solid ${cfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                            {cfg.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, color: '#F0F4FF', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <Highlight text={result.title || result.fullName || result.name || ''} query={debouncedQuery} />
                            </p>
                            {result.subtitle && (
                              <p style={{ margin: '1px 0 0', fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <Highlight text={result.subtitle} query={debouncedQuery} />
                              </p>
                            )}
                          </div>
                          {result.badge && (
                            <span style={{ fontSize: 10, color: '#22C55E', background: '#22C55E11', border: '1px solid #22C55E33', borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>
                              {result.badge}
                            </span>
                          )}
                          <kbd style={{ background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 4, padding: '1px 5px', fontSize: 9, color: '#374151', flexShrink: 0, opacity: isSelected ? 1 : 0 }}>↵</kbd>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Load more */}
              {hasMore && (
                <div style={{ padding: 16, textAlign: 'center' }}>
                  <button onClick={loadMore} disabled={loading} style={{ padding: '8px 20px', background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 20, color: '#64748B', fontSize: 12, cursor: 'pointer' }}>
                    {loading ? 'Loading…' : 'Load more results'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #1E2D4A', display: 'flex', gap: 16, fontSize: 11, color: '#374151' }}>
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>ESC Close</span>
          {results.length > 0 && <span style={{ marginLeft: 'auto' }}>{results.length} result{results.length !== 1 ? 's' : ''}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Client-side fallback search ────────────────────────────────
function clientSideSearch(query, type) {
  const q = query.toLowerCase();
  const results = [];
  try {
    const members = JSON.parse(localStorage.getItem('choir_members') || '[]');
    if (type === 'all' || type === 'member') {
      members.filter(m => (m.fullName + m.email + m.voicePart).toLowerCase().includes(q))
        .slice(0, 5).forEach(m => results.push({
          id: m.id, type: 'member', title: m.fullName,
          subtitle: `${m.voicePart} · ${m.email}`, badge: m.status,
        }));
    }
    const events = JSON.parse(localStorage.getItem('choir_events') || '[]');
    if (type === 'all' || type === 'event') {
      events.filter(e => (e.title + e.location).toLowerCase().includes(q))
        .slice(0, 5).forEach(e => results.push({
          id: e.id, type: 'event', title: e.title,
          subtitle: `${e.date} · ${e.location}`,
        }));
    }
  } catch {}
  return results;
}

export default BackendSearch;
