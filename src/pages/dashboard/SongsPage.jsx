/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Songs Library Page  (Task 8)

   Tabs:
   1. Library      — card grid, filters, sort, detail drawer
   2. Rehearsal    — fullscreen lyrics + audio player
   3. Setlists     — create/manage ordered song lists per event
   4. Add Song     — 5-step form: info → lyrics → sheet music → audio → notes
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useToast }   from '../../context/ToastContext';
import { songsService, eventsService } from '../../services/index';
import {
  SONG_GENRES, SONG_DIFFICULTIES, VOICE_PARTS,
} from '../../config/constants';
import {
  PageHeader, Tabs, Badge, EmptyState, ConfirmDialog,
  Select, Avatar, InfoBox, SearchInput,
} from '../../components/shared/index';
import Button from '../../components/shared/Button';
import Input  from '../../components/shared/Input';
import Modal  from '../../components/shared/Modal';
import { formatDate, truncate } from '../../utils/index';
import { useDebounce } from '../../hooks/index';

/* ── Constants ───────────────────────────────────────────────── */
const VP_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };

const diffColor = (d) => ({
  beginner:     'var(--color-success)',
  intermediate: 'var(--color-warning)',
  advanced:     'var(--color-error)',
  expert:       'var(--color-violet)',
}[d] || 'var(--gold)');

/* ─────────────────────────────────────────────────────────────── */
/* SONG CARD                                                       */
/* ─────────────────────────────────────────────────────────────── */
function SongCard({ song, onSelect, onEdit, onDelete, onRehearsal }) {
  const diff = SONG_DIFFICULTIES.find(d => d.id === song.difficulty);
  return (
    <div
      onClick={() => onSelect(song)}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)', overflow: 'hidden',
        cursor: 'pointer', transition: 'all var(--transition-normal)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.borderColor='var(--border-default)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='var(--border-subtle)'; }}
    >
      {/* Top color stripe based on difficulty */}
      <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${diffColor(song.difficulty)},transparent)` }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Title + status */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:10 }}>
          <h3 style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700, color:'var(--text-primary)', margin:0, lineHeight:1.3 }}>
            {song.title}
          </h3>
          <Badge
            color={song.status==='active'?'var(--color-success)':song.status==='learning'?'var(--color-warning)':'var(--text-muted)'}
            size="xs"
          >
            {song.status?.toUpperCase()}
          </Badge>
        </div>

        {/* Composer */}
        <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-secondary)', marginBottom:10 }}>
          {song.composer}{song.arranger && ` · arr. ${song.arranger}`}
        </div>

        {/* Badges row */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
          {diff && <Badge color={diffColor(song.difficulty)} size="xs">{diff.label}</Badge>}
          <Badge color="var(--text-muted)" size="xs">{song.genre}</Badge>
          <Badge color="var(--text-muted)" size="xs">{song.key}</Badge>
          <Badge color="var(--text-muted)" size="xs">♩ {song.bpm} bpm</Badge>
        </div>

        {/* Voice part dots */}
        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
          {['Soprano','Alto','Tenor','Bass'].map(vp => (
            <div key={vp} style={{
              width: 24, height: 24, borderRadius:'50%',
              background: (song.voiceParts||[]).includes(vp) ? `${VP_COLORS[vp]}25` : 'var(--bg-raised)',
              border: `2px solid ${(song.voiceParts||[]).includes(vp) ? VP_COLORS[vp] : 'var(--border-subtle)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-mono)', fontSize: 8,
              color: (song.voiceParts||[]).includes(vp) ? VP_COLORS[vp] : 'var(--text-muted)',
              fontWeight: 700,
              transition: 'all var(--transition-fast)',
            }} title={vp}>
              {vp[0]}
            </div>
          ))}
        </div>

        {/* Media indicators */}
        <div style={{ display:'flex', gap:6, marginBottom:14 }}>
          {song.lyrics           && <span title="Lyrics available"      style={{ fontSize:14 }}>📝</span>}
          {song.sheetMusicUrl    && <span title="Sheet music available"  style={{ fontSize:14 }}>🎼</span>}
          {Object.values(song.audioUrls||{}).some(u=>u) && <span title="Audio available" style={{ fontSize:14 }}>🎵</span>}
          {song.videoUrl         && <span title="Video available"        style={{ fontSize:14 }}>🎬</span>}
        </div>

        {/* Quick action buttons */}
        <div style={{ display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
          <Button size="xs" variant="primary" icon="🎤" onClick={() => onRehearsal(song)}>Rehearse</Button>
          <Button size="xs" variant="secondary" onClick={() => onEdit(song)}>✏️</Button>
          <Button size="xs" variant="danger" onClick={() => onDelete(song)}>🗑</Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* SONG DETAIL DRAWER                                              */
/* ─────────────────────────────────────────────────────────────── */
function SongDetailDrawer({ song, onClose, onRehearsal, onEdit }) {
  const [activeTab, setActiveTab] = useState('lyrics');
  const [vpAudio,   setVpAudio]   = useState('All');
  const audioRef = useRef(null);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [speed,      setSpeed]      = useState(1.0);
  const [progress,   setProgress]   = useState(0);
  const [duration,   setDuration]   = useState(0);
  const [fontSize,   setFontSize]   = useState(15);

  if (!song) return null;

  const hasAudio = Object.values(song.audioUrls || {}).some(u => u);

  /* ── Audio controls ─────────────────────────────────────── */
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); }
    else           { audioRef.current.play(); }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const handleSpeedChange = (s) => {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  /* ── Lyrics renderer ─────────────────────────────────────── */
  const renderLyrics = (lyrics) => {
    if (!lyrics) return <div style={{ color:'var(--text-muted)', fontFamily:'var(--font-body)', fontSize:13 }}>No lyrics added yet.</div>;
    return lyrics.split('\n').map((line, i) => {
      const isSectionLabel = /^\[(VERSE|CHORUS|BRIDGE|INTRO|OUTRO|PRE-CHORUS|TAG|VERSE \d|CHORUS \d)/i.test(line.trim());
      if (!line.trim()) return <div key={i} style={{ height:10 }} />;
      return (
        <div key={i} style={{
          fontFamily: isSectionLabel ? 'var(--font-heading)' : 'var(--font-body)',
          fontSize: isSectionLabel ? Math.max(10, fontSize - 3) : fontSize,
          color: isSectionLabel ? 'var(--gold)' : 'var(--text-primary)',
          fontWeight: isSectionLabel ? 700 : 400,
          letterSpacing: isSectionLabel ? '0.12em' : 'normal',
          textTransform: isSectionLabel ? 'uppercase' : 'none',
          marginBottom: isSectionLabel ? 8 : 4,
          marginTop: isSectionLabel ? 16 : 0,
          lineHeight: 1.7,
        }}>
          {line}
        </div>
      );
    });
  };

  const tabList = [
    { id:'lyrics',      label:'Lyrics',     icon:'📝' },
    { id:'audio',       label:'Audio',      icon:'🎵' },
    { id:'sheet',       label:'Sheet Music',icon:'🎼' },
    { id:'info',        label:'Details',    icon:'ℹ️' },
  ];

  return (
    <div style={{
      position:'fixed', top:0, right:0, bottom:0,
      width: Math.min(560, window.innerWidth),
      background:'var(--bg-card)',
      borderLeft:'1px solid var(--border-default)',
      zIndex:300, display:'flex', flexDirection:'column',
      boxShadow:'-20px 0 60px rgba(0,0,0,0.6)',
      animation:'slideInRight 0.3s ease both',
    }}>
      {/* Drawer header */}
      <div style={{ padding:'20px 24px 0', borderBottom:'1px solid var(--border-subtle)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <h2 style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:900, color:'var(--text-primary)', margin:'0 0 6px' }}>
              {song.title}
            </h2>
            <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)', marginBottom:8 }}>
              {song.composer}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <Badge color={diffColor(song.difficulty)}>{SONG_DIFFICULTIES.find(d=>d.id===song.difficulty)?.label}</Badge>
              <Badge color="var(--text-muted)">{song.genre}</Badge>
              <Badge color="var(--text-muted)">{song.key} · {song.timeSignature}</Badge>
              <Badge color="var(--text-muted)">♩{song.bpm} bpm</Badge>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
            <button onClick={onClose} style={{ width:34, height:34, borderRadius:'var(--radius-md)', border:'1px solid var(--border-subtle)', background:'var(--bg-raised)', color:'var(--text-muted)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            <button onClick={() => onRehearsal(song)} title="Fullscreen rehearsal mode"
              style={{ width:34, height:34, borderRadius:'var(--radius-md)', border:'1px solid var(--border-gold)', background:'var(--gold-alpha-10)', color:'var(--gold)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>🎤</button>
          </div>
        </div>
        {/* Drawer tabs */}
        <div style={{ display:'flex', gap:0 }}>
          {tabList.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                padding:'8px 14px', background:'none', border:'none',
                borderBottom:`2px solid ${activeTab===t.id?'var(--gold)':'transparent'}`,
                color: activeTab===t.id?'var(--gold)':'var(--text-muted)',
                cursor:'pointer', fontFamily:'var(--font-body)', fontSize:12,
                transition:'all var(--transition-fast)',
                display:'flex', alignItems:'center', gap:5,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drawer body */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

        {/* ── Lyrics tab ─────────────────────────────────── */}
        {activeTab === 'lyrics' && (
          <div>
            {/* Font size control */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:'0.1em' }}>FONT SIZE</span>
              <button onClick={() => setFontSize(s=>Math.max(11,s-1))} style={{ width:26, height:26, borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', background:'var(--bg-raised)', color:'var(--text-muted)', cursor:'pointer', fontSize:14 }}>−</button>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-primary)', minWidth:20, textAlign:'center' }}>{fontSize}</span>
              <button onClick={() => setFontSize(s=>Math.min(24,s+1))} style={{ width:26, height:26, borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', background:'var(--bg-raised)', color:'var(--text-muted)', cursor:'pointer', fontSize:14 }}>+</button>
              <button onClick={() => { const el=document.querySelector('.lyrics-content'); if(el) { const w=window.open(); w.document.write(`<pre style="font-family:serif;font-size:${fontSize}px;padding:20px">${song.lyrics||''}</pre>`); w.print(); }}}
                style={{ marginLeft:'auto', background:'none', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-sm)', padding:'4px 10px', color:'var(--text-muted)', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.06em' }}>
                🖨 Print
              </button>
            </div>
            <div className="lyrics-content" style={{ background:'var(--bg-raised)', borderRadius:'var(--radius-md)', padding:'16px 18px' }}>
              {renderLyrics(song.lyrics)}
            </div>
          </div>
        )}

        {/* ── Audio tab ──────────────────────────────────── */}
        {activeTab === 'audio' && (
          <div>
            {/* Voice part selector */}
            <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
              {['All','Soprano','Alto','Tenor','Bass'].map(vp => (
                <button key={vp} onClick={() => { setVpAudio(vp); setIsPlaying(false); }}
                  style={{
                    padding:'6px 14px', borderRadius:'var(--radius-full)',
                    border:`1px solid ${vpAudio===vp ? (VP_COLORS[vp]||'var(--gold)') : 'var(--border-subtle)'}`,
                    background: vpAudio===vp ? `${VP_COLORS[vp]||'var(--gold)'}14` : 'var(--bg-raised)',
                    color: vpAudio===vp ? (VP_COLORS[vp]||'var(--gold)') : 'var(--text-muted)',
                    cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:9, fontWeight:600,
                    letterSpacing:'0.06em', textTransform:'uppercase',
                    transition:'all var(--transition-fast)',
                  }}
                >
                  {vp}
                </button>
              ))}
            </div>

            {/* Audio player */}
            {(song.audioUrls?.[vpAudio] || song.audioUrls?.All) ? (
              <div>
                <audio
                  ref={audioRef}
                  src={song.audioUrls[vpAudio] || song.audioUrls.All}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  style={{ display:'none' }}
                />
                {/* Player UI */}
                <div style={{ background:'var(--bg-raised)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', padding:'20px 20px 16px' }}>
                  <div style={{ fontFamily:'var(--font-heading)', fontSize:13, color:'var(--text-primary)', marginBottom:4 }}>{song.title}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', marginBottom:16 }}>{vpAudio} Voice Part</div>

                  {/* Progress bar */}
                  <div onClick={handleSeek} style={{ height:6, background:'var(--border-subtle)', borderRadius:3, cursor:'pointer', marginBottom:10, position:'relative' }}>
                    <div style={{ width:`${duration?((progress/duration)*100):0}%`, height:'100%', background:'var(--gold)', borderRadius:3, transition:'width 0.1s' }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', marginBottom:16 }}>
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>

                  {/* Controls */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:14 }}>
                    <button onClick={() => { if(audioRef.current) audioRef.current.currentTime=Math.max(0,audioRef.current.currentTime-10); }}
                      style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:18 }}>⏮</button>
                    <button onClick={handlePlayPause}
                      style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,var(--gold-deep),var(--gold))', border:'none', color:'var(--text-inverse)', cursor:'pointer', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--shadow-gold)' }}>
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => { if(audioRef.current) audioRef.current.currentTime=Math.min(duration,audioRef.current.currentTime+10); }}
                      style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:18 }}>⏭</button>
                  </div>

                  {/* Speed control */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)' }}>SPEED</span>
                    {[0.5,0.75,1.0,1.25,1.5].map(s => (
                      <button key={s} onClick={() => handleSpeedChange(s)}
                        style={{
                          padding:'3px 8px', borderRadius:'var(--radius-full)',
                          border:`1px solid ${speed===s?'var(--gold)':'var(--border-subtle)'}`,
                          background: speed===s ? 'var(--gold-alpha-10)' : 'var(--bg-raised)',
                          color: speed===s ? 'var(--gold)' : 'var(--text-muted)',
                          cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:9,
                          transition:'all var(--transition-fast)',
                        }}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'32px 20px' }}>
                <div style={{ fontSize:48, marginBottom:12, opacity:0.4 }}>🎵</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--text-muted)' }}>
                  No audio file uploaded for {vpAudio} voice part.
                </div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-muted)', marginTop:6 }}>
                  Upload an audio file when editing this song.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Sheet Music tab ────────────────────────────── */}
        {activeTab === 'sheet' && (
          <div>
            {song.sheetMusicUrl ? (
              <div>
                <iframe
                  src={song.sheetMusicUrl}
                  style={{ width:'100%', height:480, border:'none', borderRadius:'var(--radius-md)', background:'#fff' }}
                  title="Sheet Music"
                />
                <div style={{ marginTop:10, display:'flex', gap:8 }}>
                  <a href={song.sheetMusicUrl} download target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="sm" icon="⬇️">Download PDF</Button>
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'32px 20px' }}>
                <div style={{ fontSize:48, marginBottom:12, opacity:0.4 }}>🎼</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--text-muted)' }}>
                  No sheet music uploaded for this song.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Info / Details tab ─────────────────────────── */}
        {activeTab === 'info' && (
          <div>
            {[
              { label:'Composer',       value: song.composer       },
              { label:'Arranger',       value: song.arranger||'—'  },
              { label:'Genre',          value: song.genre          },
              { label:'Key',            value: song.key            },
              { label:'Time Signature', value: song.timeSignature  },
              { label:'BPM',            value: song.bpm            },
              { label:'Language',       value: song.language       },
              { label:'Difficulty',     value: SONG_DIFFICULTIES.find(d=>d.id===song.difficulty)?.label },
              { label:'Status',         value: song.status?.toUpperCase() },
              { label:'Added',          value: formatDate(song.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
                <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
            {song.notes && (
              <div style={{ marginTop:16, background:'var(--bg-raised)', borderRadius:'var(--radius-md)', padding:'12px 14px' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--gold)', letterSpacing:'0.1em', marginBottom:6 }}>CONDUCTOR NOTES</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{song.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer footer */}
      <div style={{ padding:'12px 24px 16px', borderTop:'1px solid var(--border-subtle)', display:'flex', gap:8, flexShrink:0 }}>
        <Button variant="primary" fullWidth icon="🎤" onClick={() => onRehearsal(song)}>
          Enter Rehearsal Mode
        </Button>
        <Button variant="secondary" icon="✏️" onClick={() => onEdit(song)}>Edit</Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* REHEARSAL MODE — full-screen dark overlay                      */
/* ─────────────────────────────────────────────────────────────── */
function RehearsalMode({ song, onClose }) {
  const [fontSize,  setFontSize]  = useState(18);
  const [autoScroll,setAutoScroll]= useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [vpAudio,   setVpAudio]   = useState('All');
  const audioRef   = useRef(null);
  const scrollRef  = useRef(null);
  const scrollTimerRef = useRef(null);

  useEffect(() => {
    if (autoScroll) {
      scrollTimerRef.current = setInterval(() => {
        if (scrollRef.current) scrollRef.current.scrollTop += 1;
      }, 100);
    } else {
      clearInterval(scrollTimerRef.current);
    }
    return () => clearInterval(scrollTimerRef.current);
  }, [autoScroll]);

  // ESC to exit
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  const renderLyrics = (text) => {
    if (!text) return <p style={{ color:'rgba(255,255,255,0.4)', fontFamily:'var(--font-body)', fontSize:fontSize }}>No lyrics available</p>;
    return text.split('\n').map((line, i) => {
      const isSection = /^\[(VERSE|CHORUS|BRIDGE|INTRO|OUTRO|PRE-CHORUS|TAG)/i.test(line.trim());
      if (!line.trim()) return <div key={i} style={{ height: fontSize * 0.8 }} />;
      return (
        <div key={i} style={{
          fontFamily: isSection ? 'var(--font-heading)' : 'var(--font-body)',
          fontSize: isSection ? fontSize * 0.6 : fontSize,
          color: isSection ? 'rgba(201,168,76,0.9)' : 'rgba(255,255,255,0.92)',
          fontWeight: isSection ? 700 : 400,
          letterSpacing: isSection ? '0.18em' : '0.02em',
          textTransform: isSection ? 'uppercase' : 'none',
          lineHeight: 1.8,
          marginTop: isSection ? fontSize * 1.2 : 0,
          marginBottom: isSection ? fontSize * 0.4 : fontSize * 0.15,
        }}>
          {line}
        </div>
      );
    });
  };

  const hasAudio = Object.values(song.audioUrls||{}).some(u=>u);

  return (
    <div style={{
      position:'fixed', inset:0, background:'#060A10',
      zIndex:600, display:'flex', flexDirection:'column',
    }}>
      {/* Top controls bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)',
        flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:700, color:'white' }}>
            {song.title}
          </span>
          <Badge color="var(--gold)" size="xs">{song.key}</Badge>
          <Badge color="var(--text-muted)" size="xs">♩{song.bpm} bpm</Badge>
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Font size */}
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            <button onClick={() => setFontSize(s=>Math.max(13,s-2))} style={{ width:28, height:28, borderRadius:'var(--radius-sm)', border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:14 }}>A−</button>
            <button onClick={() => setFontSize(s=>Math.min(32,s+2))} style={{ width:28, height:28, borderRadius:'var(--radius-sm)', border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:14 }}>A+</button>
          </div>

          {/* Auto-scroll */}
          <button onClick={() => setAutoScroll(s=>!s)}
            style={{ padding:'5px 12px', borderRadius:'var(--radius-full)', border:`1px solid ${autoScroll?'var(--gold)':'rgba(255,255,255,0.15)'}`, background:autoScroll?'var(--gold-alpha-10)':'rgba(255,255,255,0.05)', color:autoScroll?'var(--gold)':'rgba(255,255,255,0.6)', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.06em', transition:'all var(--transition-fast)' }}>
            ↓ AUTO SCROLL
          </button>

          {/* Close */}
          <button onClick={onClose}
            style={{ padding:'5px 14px', borderRadius:'var(--radius-full)', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.06em' }}>
            ESC · EXIT
          </button>
        </div>
      </div>

      {/* Lyrics area */}
      <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'40px 15vw', maxWidth:900, margin:'0 auto', width:'100%' }}>
        {renderLyrics(song.lyrics)}
      </div>

      {/* Bottom audio player (if audio available) */}
      {hasAudio && (
        <div style={{
          borderTop:'1px solid rgba(255,255,255,0.08)',
          padding:'12px 24px', background:'rgba(0,0,0,0.4)',
          display:'flex', alignItems:'center', gap:14,
          flexShrink:0,
        }}>
          <audio ref={audioRef} src={song.audioUrls?.[vpAudio] || Object.values(song.audioUrls||{}).find(u=>u)}
            onPlay={()=>setIsPlaying(true)} onPause={()=>setIsPlaying(false)} onEnded={()=>setIsPlaying(false)}
          />
          <button onClick={() => { if(audioRef.current){ isPlaying?audioRef.current.pause():audioRef.current.play(); }}}
            style={{ width:40, height:40, borderRadius:'50%', background:'var(--gold)', border:'none', color:'var(--text-inverse)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {isPlaying?'⏸':'▶'}
          </button>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.7)' }}>
            {song.title} · {vpAudio}
          </div>
          <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
            {['Soprano','Alto','Tenor','Bass'].filter(vp => song.audioUrls?.[vp]).map(vp => (
              <button key={vp} onClick={() => setVpAudio(vp)}
                style={{ padding:'3px 8px', borderRadius:'var(--radius-full)', border:`1px solid ${vpAudio===vp?VP_COLORS[vp]:'rgba(255,255,255,0.15)'}`, background:vpAudio===vp?`${VP_COLORS[vp]}20`:'transparent', color:vpAudio===vp?VP_COLORS[vp]:'rgba(255,255,255,0.5)', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:9 }}>
                {vp}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* SETLISTS TAB                                                    */
/* ─────────────────────────────────────────────────────────────── */
function SetlistsTab({ songs }) {
  const { success: toastOK } = useToast();
  const [setlists, setSetlists] = useState(() => songsService.getSetlists());
  const [createOpen, setCreateOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const events = useMemo(() => eventsService.getUpcoming(), []);

  const [form, setForm] = useState({ name:'', eventId:'', description:'' });
  const [picks, setPicks] = useState([]); // song ids in order

  const reload = () => setSetlists(songsService.getSetlists());

  const handleCreate = () => {
    if (!form.name.trim()) return;
    songsService.createSetlist({
      name: form.name,
      eventId: form.eventId ? Number(form.eventId) : null,
      description: form.description,
      songs: picks,
      createdAt: new Date().toISOString(),
    });
    toastOK('Setlist created!');
    reload();
    setCreateOpen(false);
    setForm({ name:'', eventId:'', description:'' });
    setPicks([]);
  };

  const toggleSong = (songId) => {
    setPicks(p => p.includes(songId) ? p.filter(x=>x!==songId) : [...p, songId]);
  };

  const moveSong = (from, dir) => {
    const next = [...picks];
    const to = from + dir;
    if (to < 0 || to >= next.length) return;
    [next[from], next[to]] = [next[to], next[from]];
    setPicks(next);
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)' }}>
          Create and manage ordered song lists for events and rehearsals.
        </div>
        <Button variant="primary" icon="+" onClick={() => setCreateOpen(true)}>New Setlist</Button>
      </div>

      {setlists.length === 0 && !createOpen ? (
        <EmptyState icon="🎵" title="No setlists yet" description="Create a setlist to organize songs for your next event."
          action={<Button variant="primary" onClick={() => setCreateOpen(true)}>+ Create Setlist</Button>}
        />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {setlists.map(sl => {
            const slSongs = (sl.songs||[]).map(id => songs.find(s=>s.id===id)).filter(Boolean);
            const ev = sl.eventId ? events.find(e=>e.id===sl.eventId) : null;
            return (
              <div key={sl.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
                <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }} />
                <div style={{ padding:'16px 18px' }}>
                  <div style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{sl.name}</div>
                  {ev && <Badge color="var(--gold)" size="xs" style={{ marginBottom:8 }}>📅 {ev.title}</Badge>}
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', marginBottom:12 }}>{slSongs.length} songs</div>
                  {slSongs.slice(0,4).map((s,i) => (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', width:16 }}>{i+1}</span>
                      <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-primary)', flex:1 }}>{s.title}</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)' }}>{s.key}</span>
                    </div>
                  ))}
                  {slSongs.length > 4 && <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', marginTop:6 }}>+{slSongs.length-4} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create setlist modal */}
      {createOpen && (
        <Modal isOpen onClose={() => setCreateOpen(false)} title="Create Setlist" accent="var(--gold)" size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} disabled={!form.name.trim()}>✅ Create Setlist</Button>
            </>
          }
        >
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <Input label="Setlist Name" value={form.name} onChange={v => setForm(p=>({...p,name:v}))} placeholder="e.g. Easter Service" required />
            <Select label="Linked Event (optional)" value={form.eventId} onChange={v => setForm(p=>({...p,eventId:v}))}
              options={[{value:'',label:'No event'},...events.map(e=>({value:String(e.id),label:e.title}))]}
            />
          </div>

          {/* Song picker */}
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>
            Select Songs ({picks.length} selected)
          </div>
          <div style={{ maxHeight:200, overflowY:'auto', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', marginBottom:16 }}>
            {songs.map(s => (
              <div key={s.id} onClick={() => toggleSong(s.id)}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'9px 14px',
                  borderBottom:'1px solid var(--border-subtle)',
                  background: picks.includes(s.id) ? 'var(--gold-alpha-10)' : 'transparent',
                  cursor:'pointer', transition:'background var(--transition-fast)',
                }}>
                <input type="checkbox" checked={picks.includes(s.id)} readOnly
                  style={{ accentColor:'var(--gold)', width:14, height:14 }} />
                <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-primary)', flex:1 }}>{s.title}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)' }}>{s.key} · ♩{s.bpm}</span>
              </div>
            ))}
          </div>

          {/* Order songs */}
          {picks.length > 0 && (
            <div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                Running Order (drag to reorder)
              </div>
              {picks.map((id, i) => {
                const s = songs.find(x=>x.id===id);
                return s ? (
                  <div key={id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:'var(--bg-raised)', borderRadius:'var(--radius-sm)', marginBottom:4 }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--gold)', width:20 }}>{i+1}</span>
                    <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-primary)', flex:1 }}>{s.title}</span>
                    <button onClick={()=>moveSong(i,-1)} disabled={i===0} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:12 }}>↑</button>
                    <button onClick={()=>moveSong(i, 1)} disabled={i===picks.length-1} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:12 }}>↓</button>
                    <button onClick={()=>toggleSong(id)} style={{ background:'none', border:'none', color:'var(--color-error)', cursor:'pointer', fontSize:12 }}>✕</button>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* ADD / EDIT SONG MODAL                                           */
/* ─────────────────────────────────────────────────────────────── */
function SongModal({ isOpen, song, onClose, onSave }) {
  const isEdit = !!song;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title:         song?.title         || '',
    composer:      song?.composer      || '',
    arranger:      song?.arranger      || '',
    genre:         song?.genre         || 'hymn',
    difficulty:    song?.difficulty    || 'intermediate',
    key:           song?.key           || 'C Major',
    timeSignature: song?.timeSignature || '4/4',
    bpm:           song?.bpm           || 80,
    language:      song?.language      || 'English',
    voiceParts:    song?.voiceParts    || ['Soprano','Alto','Tenor','Bass'],
    status:        song?.status        || 'active',
    lyrics:        song?.lyrics        || '',
    sheetMusicUrl: song?.sheetMusicUrl || '',
    audioUrls:     song?.audioUrls     || { Soprano:'', Alto:'', Tenor:'', Bass:'' },
    videoUrl:      song?.videoUrl      || '',
    notes:         song?.notes         || '',
  });
  const [loading, setLoading] = useState(false);

  const set = f => v => setForm(p => ({...p, [f]: v}));
  const setAudio = vp => v => setForm(p => ({...p, audioUrls:{...p.audioUrls, [vp]:v}}));
  const toggleVoice = vp => setForm(p => ({...p, voiceParts: p.voiceParts.includes(vp)?p.voiceParts.filter(x=>x!==vp):[...p.voiceParts,vp]}));

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 250));
    onSave({ ...song, ...form }, isEdit);
    setLoading(false);
  };

  const STEPS = ['Basic Info','Lyrics','Media','Notes'];

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={isEdit ? `Edit — ${song.title}` : 'Add New Song'}
      subtitle={`Step ${step} of ${STEPS.length}: ${STEPS[step-1]}`}
      accent="var(--gold)" size="lg"
      footer={
        <>
          {step > 1 && <Button variant="secondary" onClick={() => setStep(s=>s-1)}>← Back</Button>}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {step < STEPS.length
            ? <Button variant="primary" onClick={() => setStep(s=>s+1)} disabled={!form.title.trim()}>Continue →</Button>
            : <Button variant="primary" loading={loading} onClick={handleSubmit}>{isEdit?'💾 Save':'✅ Add Song'}</Button>
          }
        </>
      }
    >
      {/* Step indicator */}
      <div style={{ display:'flex', gap:4, marginBottom:22 }}>
        {STEPS.map((label,i) => (
          <div key={i} style={{ flex:1 }}>
            <div style={{ height:3, borderRadius:2, background: i+1<=step ? 'var(--gold)' : 'var(--border-subtle)', transition:'background 0.3s', marginBottom:4 }} />
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color: i+1===step?'var(--gold)':i+1<step?'var(--color-success)':'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'center' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Step 1: Basic Info ────────────────────────── */}
      {step === 1 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <Input label="Song Title *" value={form.title} onChange={set('title')} placeholder="Amazing Grace" required style={{ gridColumn:'1/-1' }} />
            <Input label="Composer" value={form.composer} onChange={set('composer')} placeholder="John Newton" />
            <Input label="Arranger" value={form.arranger} onChange={set('arranger')} placeholder="Optional" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:12 }}>
            <Select label="Genre" value={form.genre} onChange={set('genre')} options={SONG_GENRES.map(g=>({value:g.id,label:g.label}))} />
            <Select label="Difficulty" value={form.difficulty} onChange={set('difficulty')} options={SONG_DIFFICULTIES.map(d=>({value:d.id,label:d.label}))} />
            <Select label="Status" value={form.status} onChange={set('status')} options={[{value:'active',label:'Active'},{value:'learning',label:'Learning'},{value:'retired',label:'Retired'}]} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
            <Input label="Key" value={form.key} onChange={set('key')} placeholder="G Major" />
            <Input label="Time Sig" value={form.timeSignature} onChange={set('timeSignature')} placeholder="4/4" />
            <Input label="BPM" type="number" value={String(form.bpm)} onChange={v=>set('bpm')(Number(v))} placeholder="80" />
            <Input label="Language" value={form.language} onChange={set('language')} placeholder="English" />
          </div>
          {/* Voice parts */}
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Voice Parts</div>
          <div style={{ display:'flex', gap:8 }}>
            {['Soprano','Alto','Tenor','Bass'].map(vp => {
              const sel = form.voiceParts.includes(vp);
              return (
                <button key={vp} type="button" onClick={() => toggleVoice(vp)}
                  style={{ padding:'6px 14px', borderRadius:'var(--radius-full)', border:`2px solid ${sel?VP_COLORS[vp]:'var(--border-default)'}`, background:sel?`${VP_COLORS[vp]}14`:'var(--bg-raised)', color:sel?VP_COLORS[vp]:'var(--text-muted)', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:9, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', transition:'all 0.2s' }}>
                  {vp}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 2: Lyrics ───────────────────────────── */}
      {step === 2 && (
        <div>
          <InfoBox type="info" style={{ marginBottom:14 }}>
            Use labels like [VERSE], [CHORUS], [BRIDGE] to mark sections. They'll be highlighted in the lyrics display.
          </InfoBox>
          <Input label="Lyrics" multiline rows={14} value={form.lyrics} onChange={set('lyrics')}
            placeholder={`[VERSE 1]\nAmazing grace, how sweet the sound\nThat saved a wretch like me\n\n[CHORUS]\nMy chains are gone, I've been set free`}
            maxLength={5000}
          />
        </div>
      )}

      {/* ── Step 3: Media ────────────────────────────── */}
      {step === 3 && (
        <div>
          <Input label="Sheet Music URL (PDF link)" value={form.sheetMusicUrl} onChange={set('sheetMusicUrl')}
            placeholder="https://example.com/sheet-music.pdf" icon="🎼" style={{ marginBottom:14 }}
          />
          <Input label="Video URL (YouTube or direct)" value={form.videoUrl} onChange={set('videoUrl')}
            placeholder="https://youtube.com/watch?v=..." icon="🎬" style={{ marginBottom:16 }}
          />
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>
            Audio Files — URL per Voice Part
          </div>
          {['Soprano','Alto','Tenor','Bass'].map(vp => (
            <Input key={vp} label={vp} value={form.audioUrls[vp]} onChange={setAudio(vp)}
              placeholder={`${vp} practice track URL (MP3, WAV…)`} icon={<span style={{ color:VP_COLORS[vp], fontSize:10, fontWeight:700 }}>{vp[0]}</span>}
              style={{ marginBottom:10 }}
            />
          ))}
        </div>
      )}

      {/* ── Step 4: Notes ────────────────────────────── */}
      {step === 4 && (
        <div>
          <Input label="Conductor Notes" multiline rows={8} value={form.notes} onChange={set('notes')}
            placeholder="Special instructions, chord progressions, performance notes, key changes, dynamics…"
            maxLength={1000}
          />
        </div>
      )}
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* MAIN PAGE                                                       */
/* ═══════════════════════════════════════════════════════════════ */
export default function SongsPage() {
  const { success: toastOK, info: toastInfo } = useToast();

  const [songs,       setSongs]       = useState(() => songsService.getAll());
  const [tab,         setTab]         = useState('library');
  const [genreFilter, setGenreFilter] = useState('all');
  const [diffFilter,  setDiffFilter]  = useState('all');
  const [statusFilter,setStatusFilter]= useState('all');
  const [search,      setSearch]      = useState('');
  const [selectedSong,setSelectedSong]= useState(null);
  const [rehearsalSong,setRehearsalSong]=useState(null);
  const [editSong,    setEditSong]    = useState(null);
  const [addModal,    setAddModal]    = useState(false);
  const [deleteSong,  setDeleteSong]  = useState(null);

  const debouncedSearch = useDebounce(search, 250);
  const reload = () => setSongs(songsService.getAll());

  /* ── Filtered list ───────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = songs;
    if (genreFilter  !== 'all') list = list.filter(s => s.genre     === genreFilter);
    if (diffFilter   !== 'all') list = list.filter(s => s.difficulty=== diffFilter);
    if (statusFilter !== 'all') list = list.filter(s => s.status    === statusFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(s =>
        s.title?.toLowerCase().includes(q)    ||
        s.composer?.toLowerCase().includes(q) ||
        s.lyrics?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [songs, genreFilter, diffFilter, statusFilter, debouncedSearch]);

  /* ── CRUD ────────────────────────────────────────────────── */
  const handleSave = (data, isEdit) => {
    if (isEdit) {
      songsService.update(data.id, data);
      toastOK(`"${data.title}" updated`);
    } else {
      songsService.create(data);
      toastOK(`"${data.title}" added to library`);
    }
    reload();
    setAddModal(false);
    setEditSong(null);
    setSelectedSong(null);
  };

  const handleDelete = () => {
    songsService.delete(deleteSong.id);
    toastInfo(`"${deleteSong.title}" removed`);
    reload();
    if (selectedSong?.id === deleteSong.id) setSelectedSong(null);
    setDeleteSong(null);
  };

  const tabList = [
    { id:'library',   label:'Library',    icon:'🎵', count: songs.length },
    { id:'setlists',  label:'Setlists',   icon:'📋' },
    { id:'add',       label:'Add Song',   icon:'+'  },
  ];

  return (
    <div style={{ animation:'fadeUp 0.35s ease both' }}>
      <PageHeader
        title="Songs Library"
        subtitle={`${songs.length} songs · ${songs.filter(s=>s.status==='active').length} active`}
        icon="🎵"
        actions={
          <Button variant="primary" icon="+" onClick={() => setAddModal(true)}>
            Add Song
          </Button>
        }
      />

      <Tabs tabs={tabList} active={tab} onChange={setTab} />

      {/* ══════════════════════════════════════════════════════
          LIBRARY TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'library' && (
        <div>
          {/* Filters */}
          <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'flex-end' }}>
            <SearchInput value={search} onChange={v=>{setSearch(v);}} placeholder="Search title, composer, lyrics…" style={{ flex:'1 1 220px', minWidth:200 }} />
            <Select value={genreFilter} onChange={setGenreFilter}
              options={[{value:'all',label:'All Genres'},...SONG_GENRES.map(g=>({value:g.id,label:g.label}))]}
              style={{ minWidth:140 }}
            />
            <Select value={diffFilter} onChange={setDiffFilter}
              options={[{value:'all',label:'All Levels'},...SONG_DIFFICULTIES.map(d=>({value:d.id,label:d.label}))]}
              style={{ minWidth:140 }}
            />
            <Select value={statusFilter} onChange={setStatusFilter}
              options={[{value:'all',label:'All Status'},{value:'active',label:'Active'},{value:'learning',label:'Learning'},{value:'retired',label:'Retired'}]}
              style={{ minWidth:130 }}
            />
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', alignSelf:'center' }}>
              {filtered.length} songs
            </span>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <EmptyState icon="🎵" title="No songs found" description="Try changing the filter or add a new song."
              action={<Button variant="primary" onClick={() => setAddModal(true)}>+ Add Song</Button>}
            />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
              {filtered.map(song => (
                <SongCard
                  key={song.id} song={song}
                  onSelect={setSelectedSong}
                  onEdit={setEditSong}
                  onDelete={setDeleteSong}
                  onRehearsal={setRehearsalSong}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SETLISTS TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'setlists' && <SetlistsTab songs={songs} />}

      {/* ══════════════════════════════════════════════════════
          ADD SONG shortcut
         ══════════════════════════════════════════════════════ */}
      {tab === 'add' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:16 }}>
          <div style={{ fontSize:60, opacity:0.4 }}>🎵</div>
          <h2 style={{ fontFamily:'var(--font-heading)', fontSize:20, color:'var(--text-primary)', margin:0 }}>Add a New Song</h2>
          <Button variant="primary" size="lg" icon="+" onClick={() => { setAddModal(true); setTab('library'); }}>
            Open Add Song Form
          </Button>
        </div>
      )}

      {/* ── Detail drawer ─────────────────────────────────── */}
      {selectedSong && (
        <>
          {/* Backdrop */}
          <div onClick={() => setSelectedSong(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:299, animation:'fadeIn 0.2s ease' }} />
          <SongDetailDrawer
            song={selectedSong}
            onClose={() => setSelectedSong(null)}
            onRehearsal={s => { setSelectedSong(null); setRehearsalSong(s); }}
            onEdit={s => { setSelectedSong(null); setEditSong(s); }}
          />
        </>
      )}

      {/* ── Rehearsal mode ────────────────────────────────── */}
      {rehearsalSong && (
        <RehearsalMode song={rehearsalSong} onClose={() => setRehearsalSong(null)} />
      )}

      {/* ── Add / Edit modal ──────────────────────────────── */}
      {(addModal || editSong) && (
        <SongModal isOpen
          song={editSong}
          onClose={() => { setAddModal(false); setEditSong(null); }}
          onSave={handleSave}
        />
      )}

      {/* ── Delete confirm ────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteSong}
        onClose={() => setDeleteSong(null)}
        onConfirm={handleDelete}
        title="Delete Song"
        message={`Remove "${deleteSong?.title}" from the library? This cannot be undone.`}
        confirmLabel="Delete Song"
        confirmVariant="danger"
      />
    </div>
  );
}
