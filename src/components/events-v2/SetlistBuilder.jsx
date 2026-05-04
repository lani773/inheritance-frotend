/**
 * INHERITANCE CHOIR — Setlist Builder
 * Drag-and-drop song arrangement for performances and rehearsals.
 */
import React, { useState, useRef, useCallback } from 'react';

const DIFFICULTY_COLOR = {
  beginner:     '#22C55E',
  intermediate: '#F59E0B',
  advanced:     '#EF4444',
  expert:       '#8B5CF6',
};

const LANG_FLAGS = {
  English:     '🇬🇧',
  Kinyarwanda: '🇷🇼',
  French:      '🇫🇷',
  Swahili:     '🌍',
};

// Sample song library
const SONG_LIBRARY = [
  { id: 'sl1', title: 'Umurage w\'Imana',        artist: 'INHERITANCE CHOIR', language: 'Kinyarwanda', key: 'G',  tempo: 'medium', difficulty: 'intermediate', duration: '4:30' },
  { id: 'sl2', title: 'Amazing Grace',            artist: 'Traditional',       language: 'English',     key: 'F',  tempo: 'slow',   difficulty: 'beginner',     duration: '3:45' },
  { id: 'sl3', title: 'Hallelujah Chorus',        artist: 'Handel',            language: 'English',     key: 'D',  tempo: 'fast',   difficulty: 'expert',       duration: '4:00' },
  { id: 'sl4', title: 'Ndagukunda Yesu',          artist: 'INHERITANCE CHOIR', language: 'Kinyarwanda', key: 'C',  tempo: 'medium', difficulty: 'intermediate', duration: '5:10' },
  { id: 'sl5', title: 'Great Is Thy Faithfulness',artist: 'Traditional',       language: 'English',     key: 'Bb', tempo: 'slow',   difficulty: 'beginner',     duration: '4:20' },
  { id: 'sl6', title: 'How Great Thou Art',       artist: 'Traditional',       language: 'English',     key: 'A',  tempo: 'medium', difficulty: 'intermediate', duration: '4:50' },
  { id: 'sl7', title: 'Tukuimba Bwana',           artist: 'INHERITANCE CHOIR', language: 'Swahili',     key: 'E',  tempo: 'fast',   difficulty: 'advanced',     duration: '3:55' },
  { id: 'sl8', title: 'To God Be The Glory',      artist: 'Traditional',       language: 'English',     key: 'G',  tempo: 'medium', difficulty: 'beginner',     duration: '3:30' },
];

export function SetlistBuilder({ eventTitle = 'Performance', onSave }) {
  const [setlist,   setSetlist]   = useState([]);
  const [library,   setLibrary]   = useState(SONG_LIBRARY);
  const [search,    setSearch]    = useState('');
  const [dragIdx,   setDragIdx]   = useState(null);
  const [dragOver,  setDragOver]  = useState(null);
  const [notes,     setNotes]     = useState({});
  const [editNote,  setEditNote]  = useState(null);
  const [saved,     setSaved]     = useState(false);
  const dragNode = useRef(null);

  const filtered = library.filter(s =>
    !setlist.find(sl => sl.id === s.id) &&
    (s.title.toLowerCase().includes(search.toLowerCase()) ||
     s.artist.toLowerCase().includes(search.toLowerCase()))
  );

  const addSong = (song) => {
    setSetlist(sl => [...sl, { ...song, order: sl.length + 1 }]);
  };

  const removeSong = (id) => {
    setSetlist(sl => sl.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
    setNotes(n => { const next = { ...n }; delete next[id]; return next; });
  };

  // Drag handlers
  const onDragStart = (e, idx) => {
    setDragIdx(idx);
    dragNode.current = e.target;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnter = (e, idx) => {
    e.preventDefault();
    if (dragIdx !== idx) setDragOver(idx);
  };

  const onDrop = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setSetlist(sl => {
      const next = [...sl];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
    setDragIdx(null);
    setDragOver(null);
  };

  const onDragEnd = () => { setDragIdx(null); setDragOver(null); };

  const totalDuration = setlist.reduce((acc, s) => {
    const [m, sec] = (s.duration || '0:00').split(':').map(Number);
    return acc + m * 60 + sec;
  }, 0);
  const totalMin  = Math.floor(totalDuration / 60);
  const totalSec  = totalDuration % 60;

  const handleSave = () => {
    setSaved(true);
    onSave?.({ setlist, notes, totalDuration });
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ fontFamily: 'Crimson Pro, serif', color: '#F0F4FF' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
            🎵 Setlist — {eventTitle}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            {setlist.length} songs · {totalMin}:{String(totalSec).padStart(2,'0')} total
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={setlist.length === 0}
          style={{
            padding: '10px 22px',
            background: saved ? 'rgba(34,197,94,0.2)' : setlist.length ? 'linear-gradient(135deg, #A07820, #C9A84C)' : '#1E2D4A',
            border: saved ? '1px solid #22C55E44' : 'none',
            borderRadius: 10, color: saved ? '#22C55E' : '#080C14',
            fontSize: 13, fontWeight: 700, cursor: setlist.length ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s',
          }}
        >
          {saved ? '✓ Saved!' : '💾 Save Setlist'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* ── Setlist (drag-and-drop) ── */}
        <div>
          {setlist.length === 0 ? (
            <div style={{
              border: '2px dashed #1E2D4A', borderRadius: 16,
              padding: '48px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎶</div>
              <p style={{ color: '#64748B', fontSize: 14 }}>Drag songs here or click + to add them</p>
              <p style={{ color: '#374151', fontSize: 12 }}>Build your setlist in order of performance</p>
            </div>
          ) : (
            <div
              onDragOver={e => e.preventDefault()}
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              {setlist.map((song, idx) => (
                <div
                  key={song.id}
                  draggable
                  onDragStart={e => onDragStart(e, idx)}
                  onDragEnter={e => onDragEnter(e, idx)}
                  onDrop={e => onDrop(e, idx)}
                  onDragEnd={onDragEnd}
                  style={{
                    background: dragOver === idx ? 'rgba(201,168,76,0.08)' : '#0F172A',
                    border: `1px solid ${dragOver === idx ? '#C9A84C44' : dragIdx === idx ? '#C9A84C22' : '#1E2D4A'}`,
                    borderLeft: `3px solid ${DIFFICULTY_COLOR[song.difficulty] || '#64748B'}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'grab',
                    opacity: dragIdx === idx ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                    userSelect: 'none',
                  }}
                >
                  {/* Order badge */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#C9A84C', fontFamily: 'DM Mono, monospace',
                  }}>
                    {song.order}
                  </div>

                  {/* Drag handle */}
                  <div style={{ color: '#374151', fontSize: 16, cursor: 'grab', flexShrink: 0 }}>⋮⋮</div>

                  {/* Song info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {LANG_FLAGS[song.language]} {song.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#64748B' }}>{song.artist}</span>
                      <span style={{ fontSize: 10, color: '#374151' }}>·</span>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Mono, monospace' }}>Key: {song.key}</span>
                      <span style={{ fontSize: 10, color: '#374151' }}>·</span>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Mono, monospace' }}>{song.duration}</span>
                      <span style={{
                        fontSize: 10, color: DIFFICULTY_COLOR[song.difficulty],
                        background: `${DIFFICULTY_COLOR[song.difficulty]}11`,
                        border: `1px solid ${DIFFICULTY_COLOR[song.difficulty]}33`,
                        borderRadius: 4, padding: '1px 5px',
                      }}>
                        {song.difficulty}
                      </span>
                    </div>
                    {notes[song.id] && (
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#F59E0B', fontStyle: 'italic' }}>
                        📝 {notes[song.id]}
                      </p>
                    )}
                    {editNote === song.id && (
                      <input
                        autoFocus
                        placeholder="Director note (transposition, cut, etc.)…"
                        defaultValue={notes[song.id] || ''}
                        onBlur={e => {
                          setNotes(n => ({ ...n, [song.id]: e.target.value }));
                          setEditNote(null);
                        }}
                        onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                        style={{
                          marginTop: 6, width: '100%', background: '#141E33',
                          border: '1px solid #F59E0B33', borderRadius: 6,
                          padding: '6px 10px', color: '#F59E0B', fontSize: 12,
                          outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setEditNote(editNote === song.id ? null : song.id)}
                      style={{ background: 'none', border: '1px solid #1E2D4A', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#F59E0B', fontSize: 12 }}
                      title="Add note"
                    >
                      📝
                    </button>
                    <button
                      onClick={() => removeSong(song.id)}
                      style={{ background: 'none', border: '1px solid #EF444422', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#EF4444', fontSize: 12 }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {/* Total row */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', padding: '10px 16px',
                background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.1)',
                borderRadius: 10, marginTop: 4,
              }}>
                <span style={{ fontSize: 13, color: '#C9A84C', fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>
                  Total: {totalMin}:{String(totalSec).padStart(2,'0')} ({setlist.length} songs)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Song Library ── */}
        <div style={{
          background: '#0F172A', border: '1px solid #1E2D4A',
          borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 20,
        }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #1E2D4A' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontFamily: 'Cinzel, serif' }}>Song Library</h4>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search songs…"
              style={{
                width: '100%', background: '#141E33', border: '1px solid #1E2D4A',
                borderRadius: 8, padding: '8px 12px', color: '#F0F4FF', fontSize: 13,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#374151', fontSize: 13 }}>
                {search ? 'No songs match your search' : 'All songs added to setlist!'}
              </div>
            ) : (
              filtered.map(song => (
                <div
                  key={song.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 18px',
                    borderBottom: '1px solid #0A1628',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#F0F4FF', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {LANG_FLAGS[song.language]} {song.title}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>
                      {song.artist} · {song.key} · {song.duration}
                    </p>
                  </div>
                  <button
                    onClick={() => addSong(song)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.3)',
                      color: '#C9A84C', fontSize: 16, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    +
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
