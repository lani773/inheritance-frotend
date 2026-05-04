/**
 * INHERITANCE CHOIR — Live Choir Chat
 * WhatsApp-style messaging: typing indicators, read receipts, emoji reactions,
 * voice notes (Web Audio), file attachments, message threads.
 */
import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { useAuth }         from '../../context/AuthContext';
import { useRealtime, useRealtimeEvent, WS_EVENTS } from '../../context/RealtimeContext';

// ── Helpers ────────────────────────────────────────────────────
const VP_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981', admin:'#C9A84C' };
function initials(name='') { return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }
function fmtTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  return d.toLocaleDateString([],{month:'short',day:'numeric'}) + ' ' + d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}

// ── Voice note recorder ────────────────────────────────────────
function useVoiceRecorder(onStop) {
  const [recording, setRecording] = useState(false);
  const [duration,  setDuration]  = useState(0);
  const mediaRef  = useRef(null);
  const chunksRef = useRef([]);
  const timerRef  = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url  = URL.createObjectURL(blob);
        onStop?.({ blob, url, duration });
        stream.getTracks().forEach(t => t.stop());
        setDuration(0);
      };
      mr.start();
      setRecording(true);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch { alert('Microphone access denied'); }
  };

  const stop = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const cancel = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
    setDuration(0);
    chunksRef.current = [];
  };

  return { recording, duration, start, stop, cancel };
}

// ── Audio player ───────────────────────────────────────────────
function AudioPlayer({ url, duration = 0 }) {
  const audioRef = useRef(null);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [curTime,  setCurTime]  = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play();  setPlaying(true);  }
  };

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:180 }}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={e => {
          const pct = (e.target.currentTime / e.target.duration) * 100;
          setProgress(pct || 0);
          setCurTime(Math.floor(e.target.currentTime));
        }}
        onEnded={() => { setPlaying(false); setProgress(0); setCurTime(0); }}
      />
      <button
        onClick={toggle}
        style={{
          width:32, height:32, borderRadius:'50%', border:'none',
          background: playing ? '#22C55E' : 'rgba(201,168,76,0.3)',
          color: playing ? '#fff' : '#C9A84C',
          cursor:'pointer', fontSize:14, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}
      >
        {playing ? '⏸' : '▶'}
      </button>
      {/* Waveform visualization */}
      <div style={{ flex:1, position:'relative' }}>
        <div style={{ height:28, display:'flex', alignItems:'center', gap:1.5 }}>
          {Array.from({length:24}).map((_, i) => {
            const h = 4 + Math.sin(i * 0.8) * 8 + Math.cos(i * 1.4) * 6;
            const filled = (i / 24 * 100) <= progress;
            return (
              <div key={i} style={{
                width:2.5, height:h, borderRadius:2,
                background: filled ? '#C9A84C' : '#1E2D4A',
                transition:'background 0.1s',
                flexShrink:0,
              }} />
            );
          })}
        </div>
      </div>
      <span style={{ fontSize:11, color:'#64748B', fontFamily:'DM Mono, monospace', flexShrink:0 }}>
        {playing ? `0:${String(curTime).padStart(2,'0')}` : `0:${String(Math.max(duration,0)).padStart(2,'0')}`}
      </span>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────
const EMOJI_LIST = ['👍','❤️','😂','🙏','🎵','🔥','✅','😮'];

function MessageBubble({ msg, isMine, onReact, onReply }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [hovered, setHovered] = useState(false);
  const vpColor = VP_COLORS[msg.voicePart] || '#94A3B8';

  const reactionCounts = useMemo(() => {
    const m = {};
    (msg.reactions || []).forEach(r => {
      m[r.emoji] = (m[r.emoji] || 0) + 1;
    });
    return Object.entries(m);
  }, [msg.reactions]);

  return (
    <div
      style={{
        display:'flex', flexDirection: isMine ? 'row-reverse' : 'row',
        gap:10, marginBottom:4, alignItems:'flex-end',
        position:'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowEmoji(false); }}
    >
      {/* Avatar */}
      {!isMine && (
        <div style={{
          width:32, height:32, borderRadius:'50%', flexShrink:0,
          background:`${vpColor}22`, border:`1.5px solid ${vpColor}44`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:11, fontWeight:700, color:vpColor,
        }}>
          {initials(msg.senderName)}
        </div>
      )}

      <div style={{ maxWidth:'70%', display:'flex', flexDirection:'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
        {/* Sender name */}
        {!isMine && (
          <span style={{ fontSize:11, color:vpColor, fontWeight:700, marginBottom:3, paddingLeft:4 }}>
            {msg.senderName}
            {msg.voicePart && <span style={{ fontSize:10, color:'#374151', fontWeight:400 }}> · {msg.voicePart}</span>}
          </span>
        )}

        {/* Reply preview */}
        {msg.replyTo && (
          <div style={{
            background:'rgba(255,255,255,0.04)', borderLeft:'3px solid #C9A84C',
            borderRadius:'8px 8px 0 0', padding:'6px 10px',
            marginBottom:2, fontSize:11, color:'#64748B',
            maxWidth:'100%', overflow:'hidden',
          }}>
            <span style={{ color:'#C9A84C', fontWeight:700 }}>{msg.replyTo.senderName}</span>
            <br />
            <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {msg.replyTo.text || '🎤 Voice note'}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div style={{
          background: isMine
            ? 'linear-gradient(135deg, #A07820, #C9A84C)'
            : 'linear-gradient(135deg, #141E33, #1A2540)',
          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding:'10px 14px',
          boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
          border: isMine ? 'none' : '1px solid #1E2D4A',
          position:'relative',
        }}>
          {msg.type === 'voice' ? (
            <AudioPlayer url={msg.audioUrl} duration={msg.audioDuration} />
          ) : msg.type === 'image' ? (
            <img src={msg.imageUrl} alt="shared" style={{ maxWidth:220, borderRadius:10, display:'block' }} />
          ) : (
            <p style={{
              margin:0, fontSize:14, lineHeight:1.5,
              color: isMine ? '#080C14' : '#F0F4FF',
              wordBreak:'break-word',
            }}>
              {msg.text}
            </p>
          )}
        </div>

        {/* Meta row */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3, paddingLeft:4 }}>
          <span style={{ fontSize:10, color:'#374151' }}>{fmtTime(msg.timestamp)}</span>
          {isMine && (
            <span style={{ fontSize:11, color: msg.readBy?.length > 1 ? '#3B82F6' : '#374151' }}>
              {msg.readBy?.length > 1 ? '✓✓' : '✓'}
            </span>
          )}
        </div>

        {/* Reactions */}
        {reactionCounts.length > 0 && (
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:3 }}>
            {reactionCounts.map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(msg.id, emoji)}
                style={{
                  background:'#141E33', border:'1px solid #1E2D4A',
                  borderRadius:20, padding:'2px 7px', cursor:'pointer',
                  fontSize:12, color:'#F0F4FF',
                  display:'flex', alignItems:'center', gap:3,
                }}
              >
                {emoji} <span style={{ fontSize:10, fontFamily:'DM Mono, monospace' }}>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {hovered && (
        <div style={{
          position:'absolute', top:-32,
          [isMine ? 'left' : 'right']: 0,
          display:'flex', gap:4, zIndex:10,
          background:'#0F172A', border:'1px solid #1E2D4A',
          borderRadius:20, padding:'4px 8px',
          boxShadow:'0 4px 20px rgba(0,0,0,0.4)',
          animation:'scaleIn 0.15s ease',
        }}>
          <button onClick={() => setShowEmoji(e=>!e)}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, padding:'0 2px' }}>
            😊
          </button>
          <button onClick={() => onReply?.(msg)}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#94A3B8', padding:'0 4px' }}>
            ↩
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div style={{
          position:'absolute', top:-70, [isMine ? 'left' : 'right']:0, zIndex:20,
          background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16,
          padding:'8px 12px', display:'flex', gap:6,
          boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
          animation:'scaleIn 0.15s ease',
        }}>
          {EMOJI_LIST.map(e => (
            <button key={e}
              onClick={() => { onReact?.(msg.id, e); setShowEmoji(false); }}
              style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', padding:2,
                transition:'transform 0.1s' }}
              onMouseEnter={ev => ev.target.style.transform='scale(1.3)'}
              onMouseLeave={ev => ev.target.style.transform='scale(1)'}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────
function TypingIndicator({ typers }) {
  if (!typers.length) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', height:28 }}>
      <div style={{ display:'flex', gap:3 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:6, height:6, borderRadius:'50%', background:'#C9A84C',
            animation:`typingDot 1.4s ease-in-out ${i*0.2}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize:11, color:'#64748B', fontStyle:'italic' }}>
        {typers.slice(0,2).join(', ')} {typers.length > 2 ? `+${typers.length-2}` : ''} typing…
      </span>
    </div>
  );
}

// ── Channel list ───────────────────────────────────────────────
const CHANNELS = [
  { id:'general',  name:'# General',         icon:'💬', description:'Choir-wide announcements' },
  { id:'soprano',  name:'# Soprano',          icon:'🎵', description:'Soprano section only' },
  { id:'alto',     name:'# Alto',             icon:'🎵', description:'Alto section only' },
  { id:'tenor',    name:'# Tenor',            icon:'🎵', description:'Tenor section only' },
  { id:'bass',     name:'# Bass',             icon:'🎵', description:'Bass section only' },
  { id:'admin',    name:'# Admin',            icon:'🔐', description:'Leadership only' },
  { id:'prayer',   name:'# Prayer Requests',  icon:'🙏', description:'Choir prayer wall' },
  { id:'setlists', name:'# Setlists',         icon:'🎶', description:'Upcoming song lists' },
];

// ── Seed messages ──────────────────────────────────────────────
const SEED_MSGS = {
  general: [
    { id:'m1', senderId:'2', senderName:'Marie Claire Uwimana', voicePart:'Soprano', text:'Good morning choir family! 🎵 Excited for Sunday\'s service!', timestamp: Date.now()-3600000, readBy:['2','3','4'], reactions:[{emoji:'❤️',userId:'3'},{emoji:'🎵',userId:'4'}] },
    { id:'m2', senderId:'3', senderName:'Jean-Paul Habimana', voicePart:'Tenor', text:'Great practice yesterday everyone. The harmony on "Amazing Grace" is coming together beautifully 🙏', timestamp: Date.now()-1800000, readBy:['2','3'], reactions:[] },
    { id:'m3', senderId:'1', senderName:'Jean Baptiste', voicePart:'admin', text:'Reminder: Mandatory rehearsal this Friday at 6PM sharp. Please be on time!', timestamp: Date.now()-900000, readBy:['1','2','3','4'], reactions:[{emoji:'✅',userId:'2'},{emoji:'✅',userId:'3'}] },
  ],
  prayer: [
    { id:'p1', senderId:'4', senderName:'Diane Mukamana', voicePart:'Alto', text:'Please pray for Sister Grace who is in the hospital. May God grant her quick recovery 🙏', timestamp: Date.now()-7200000, readBy:['1','2','3','4'], reactions:[{emoji:'🙏',userId:'2'},{emoji:'🙏',userId:'3'},{emoji:'🙏',userId:'1'}] },
  ],
};

// ── Main Chat Component ────────────────────────────────────────
export default function LiveChat({ defaultChannel = 'general' }) {
  const { session } = useAuth();
  const { send, connected } = useRealtime();
  const myId = session?.id?.toString();

  const [activeChannel, setActiveChannel] = useState(defaultChannel);
  const [allMessages,   setAllMessages]   = useState(SEED_MSGS);
  const [input,         setInput]         = useState('');
  const [typers,        setTypers]        = useState([]);
  const [replyTo,       setReplyTo]       = useState(null);
  const [showAttach,    setShowAttach]    = useState(false);
  const [unreadMap,     setUnreadMap]     = useState({alto:2, prayer:1});
  const [sidebarOpen,   setSidebarOpen]   = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const fileInputRef   = useRef(null);
  const typingTimerRef = useRef(null);

  const messages = allMessages[activeChannel] || [];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  // Clear unread when switching channel
  useEffect(() => {
    setUnreadMap(u => ({ ...u, [activeChannel]: 0 }));
  }, [activeChannel]);

  // Typing indicator broadcast
  const handleTyping = useCallback((e) => {
    setInput(e.target.value);
    send('typing:start', { channel: activeChannel, name: session?.fullName });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      send('typing:stop', { channel: activeChannel });
    }, 2000);
  }, [activeChannel, send, session]);

  // WS listeners
  useRealtimeEvent('chat:message', useCallback((data) => {
    if (data.channel !== activeChannel) {
      setUnreadMap(u => ({ ...u, [data.channel]: (u[data.channel]||0)+1 }));
    }
    setAllMessages(prev => ({
      ...prev,
      [data.channel]: [...(prev[data.channel]||[]), data.message],
    }));
  }, [activeChannel]));

  useRealtimeEvent('typing:update', useCallback((data) => {
    if (data.channel !== activeChannel || data.senderId === myId) return;
    setTypers(t => data.typing
      ? [...new Set([...t, data.name])]
      : t.filter(n => n !== data.name));
  }, [activeChannel, myId]));

  const sendMessage = useCallback((type='text', extra={}) => {
    if (type==='text' && !input.trim()) return;

    const msg = {
      id:         `msg_${Date.now()}`,
      senderId:   myId,
      senderName: session?.fullName || 'You',
      voicePart:  session?.voicePart || 'admin',
      channel:    activeChannel,
      type,
      text:       input.trim(),
      timestamp:  Date.now(),
      readBy:     [myId],
      reactions:  [],
      replyTo:    replyTo ? { id: replyTo.id, senderName: replyTo.senderName, text: replyTo.text } : null,
      ...extra,
    };

    setAllMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel]||[]), msg],
    }));
    setInput('');
    setReplyTo(null);
    setShowAttach(false);
    send('chat:message', { channel: activeChannel, message: msg });
  }, [input, myId, session, activeChannel, replyTo, send]);

  const handleReact = useCallback((msgId, emoji) => {
    setAllMessages(prev => {
      const ch = prev[activeChannel] || [];
      return {
        ...prev,
        [activeChannel]: ch.map(m => {
          if (m.id !== msgId) return m;
          const reactions = [...(m.reactions||[])];
          const existing  = reactions.findIndex(r => r.emoji===emoji && r.userId===myId);
          if (existing>=0) reactions.splice(existing,1);
          else reactions.push({ emoji, userId:myId });
          return { ...m, reactions };
        }),
      };
    });
  }, [activeChannel, myId]);

  const voiceRec = useVoiceRecorder(({ url, duration }) => {
    sendMessage('voice', { audioUrl:url, audioDuration:duration, text:'' });
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
      sendMessage('image', { imageUrl:url, text:'' });
    } else {
      sendMessage('file', { fileUrl:url, fileName:file.name, text:`📎 ${file.name}` });
    }
    e.target.value = '';
  };

  const activeChannelObj = CHANNELS.find(c=>c.id===activeChannel) || CHANNELS[0];

  return (
    <div style={{
      display:'flex', height:'100%', minHeight:640,
      background:'#080C14', borderRadius:20, overflow:'hidden',
      border:'1px solid #1E2D4A', fontFamily:'Crimson Pro, serif',
    }}>
      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <div style={{
          width:240, flexShrink:0,
          background:'linear-gradient(180deg, #0A1628, #0F172A)',
          borderRight:'1px solid #1E2D4A',
          display:'flex', flexDirection:'column',
        }}>
          <div style={{ padding:'18px 16px', borderBottom:'1px solid #1E2D4A' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: connected ? '#22C55E' : '#EF4444', boxShadow: connected ? '0 0 6px #22C55E' : 'none' }} />
              <h3 style={{ margin:0, fontSize:14, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>
                Choir Chat
              </h3>
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
            <p style={{ fontSize:10, color:'#374151', textTransform:'uppercase', letterSpacing:'0.1em', padding:'8px 16px' }}>
              Channels
            </p>
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:10,
                  padding:'9px 16px', background: activeChannel===ch.id ? 'rgba(201,168,76,0.1)' : 'none',
                  border:'none', cursor:'pointer', textAlign:'left',
                  borderLeft: activeChannel===ch.id ? '2px solid #C9A84C' : '2px solid transparent',
                  transition:'all 0.15s',
                }}
              >
                <span style={{ fontSize:14 }}>{ch.icon}</span>
                <span style={{ flex:1, fontSize:13, color: activeChannel===ch.id ? '#C9A84C' : '#94A3B8', fontWeight: activeChannel===ch.id ? 700 : 400 }}>
                  {ch.name}
                </span>
                {unreadMap[ch.id] > 0 && (
                  <span style={{
                    background:'#EF4444', color:'#fff', borderRadius:10,
                    padding:'1px 5px', fontSize:10, fontWeight:700, fontFamily:'DM Mono, monospace',
                  }}>
                    {unreadMap[ch.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Online count */}
          <div style={{ padding:'12px 16px', borderTop:'1px solid #1E2D4A' }}>
            <span style={{ fontSize:11, color:'#374151' }}>
              🟢 {3 + Math.floor(Math.random()*3)} online
            </span>
          </div>
        </div>
      )}

      {/* ── Chat area ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{
          padding:'14px 20px',
          background:'linear-gradient(135deg, #0F172A, #141E33)',
          borderBottom:'1px solid #1E2D4A',
          display:'flex', alignItems:'center', gap:12,
        }}>
          <button
            onClick={() => setSidebarOpen(s=>!s)}
            style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:18, padding:4 }}
          >
            ☰
          </button>
          <span style={{ fontSize:20 }}>{activeChannelObj.icon}</span>
          <div>
            <h3 style={{ margin:0, fontSize:15, fontFamily:'Cinzel, serif', color:'#F0F4FF' }}>
              {activeChannelObj.name}
            </h3>
            <p style={{ margin:0, fontSize:11, color:'#64748B' }}>{activeChannelObj.description}</p>
          </div>
          <span style={{ marginLeft:'auto', fontSize:11, color: connected ? '#22C55E' : '#EF4444' }}>
            {connected ? '● Live' : '○ Offline'}
          </span>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:12 }}>
          {messages.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>{activeChannelObj.icon}</div>
              <p style={{ color:'#64748B', fontSize:14 }}>No messages yet in {activeChannelObj.name}</p>
              <p style={{ color:'#374151', fontSize:12 }}>Be the first to say something! 🎵</p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={msg.senderId === myId}
              onReact={handleReact}
              onReply={setReplyTo}
            />
          ))}
          <TypingIndicator typers={typers} />
          <div ref={messagesEndRef} />
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div style={{
            padding:'8px 20px', background:'#141E33',
            borderTop:'1px solid #1E2D4A',
            display:'flex', alignItems:'center', gap:10,
          }}>
            <div style={{ flex:1, borderLeft:'3px solid #C9A84C', paddingLeft:10 }}>
              <p style={{ margin:0, fontSize:11, color:'#C9A84C', fontWeight:700 }}>{replyTo.senderName}</p>
              <p style={{ margin:0, fontSize:11, color:'#64748B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {replyTo.text || '🎤 Voice note'}
              </p>
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:16 }}>×</button>
          </div>
        )}

        {/* Voice recording UI */}
        {voiceRec.recording && (
          <div style={{
            padding:'12px 20px', background:'rgba(239,68,68,0.1)',
            borderTop:'1px solid rgba(239,68,68,0.2)',
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#EF4444', animation:'pulse 1s infinite' }} />
            <span style={{ flex:1, fontSize:13, color:'#EF4444', fontFamily:'DM Mono, monospace' }}>
              Recording… 0:{String(voiceRec.duration).padStart(2,'0')}
            </span>
            <button onClick={voiceRec.cancel} style={{ background:'none', border:'1px solid #EF444444', borderRadius:6, padding:'4px 10px', color:'#EF4444', cursor:'pointer', fontSize:11 }}>Cancel</button>
            <button onClick={voiceRec.stop}   style={{ background:'#EF4444', border:'none', borderRadius:6, padding:'4px 12px', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700 }}>Send</button>
          </div>
        )}

        {/* Input bar */}
        <div style={{
          padding:'14px 16px',
          background:'#0A1628',
          borderTop:'1px solid #1E2D4A',
        }}>
          {/* Attachment panel */}
          {showAttach && (
            <div style={{
              display:'flex', gap:10, marginBottom:10, padding:'10px 0',
              borderBottom:'1px solid #1E2D4A',
            }}>
              {[
                { icon:'🖼', label:'Image',    action:() => fileInputRef.current?.click() },
                { icon:'📎', label:'File',     action:() => fileInputRef.current?.click() },
                { icon:'📍', label:'Location', action:() => sendMessage('text', { text:`📍 Sharing location: ${session?.fullName} is at the rehearsal venue` }) },
                { icon:'🙏', label:'Prayer',   action:() => { setActiveChannel('prayer'); setShowAttach(false); } },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={a.action}
                  style={{
                    display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    padding:'10px 16px', background:'#141E33',
                    border:'1px solid #1E2D4A', borderRadius:12,
                    cursor:'pointer', fontSize:20,
                  }}
                >
                  {a.icon}
                  <span style={{ fontSize:10, color:'#64748B' }}>{a.label}</span>
                </button>
              ))}
              <input ref={fileInputRef} type="file" accept="image/*,application/*" onChange={handleFileUpload} style={{ display:'none' }} />
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Attach button */}
            <button
              onClick={() => setShowAttach(s=>!s)}
              style={{
                width:36, height:36, borderRadius:10, background: showAttach ? 'rgba(201,168,76,0.2)' : '#141E33',
                border:`1px solid ${showAttach ? '#C9A84C44' : '#1E2D4A'}`,
                color: showAttach ? '#C9A84C' : '#64748B',
                cursor:'pointer', fontSize:18,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >
              ＋
            </button>

            {/* Text input */}
            <div style={{ flex:1, position:'relative' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={handleTyping}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Message ${activeChannelObj.name}…`}
                disabled={voiceRec.recording}
                style={{
                  width:'100%', background:'#141E33',
                  border:'1px solid #1E2D4A', borderRadius:20,
                  padding:'10px 44px 10px 16px', color:'#F0F4FF',
                  fontSize:14, outline:'none', boxSizing:'border-box',
                  opacity: voiceRec.recording ? 0.5 : 1,
                }}
              />
            </div>

            {/* Voice / send */}
            {input.trim() ? (
              <button
                onClick={() => sendMessage()}
                style={{
                  width:40, height:40, borderRadius:'50%', border:'none',
                  background:'linear-gradient(135deg, #A07820, #C9A84C)',
                  color:'#080C14', cursor:'pointer', fontSize:16,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'transform 0.1s',
                }}
                onMouseEnter={e => e.target.style.transform='scale(1.08)'}
                onMouseLeave={e => e.target.style.transform='scale(1)'}
              >
                ➤
              </button>
            ) : (
              <button
                onClick={voiceRec.recording ? voiceRec.stop : voiceRec.start}
                style={{
                  width:40, height:40, borderRadius:'50%', border:'none',
                  background: voiceRec.recording ? '#EF4444' : '#141E33',
                  border: voiceRec.recording ? 'none' : '1px solid #1E2D4A',
                  color: voiceRec.recording ? '#fff' : '#94A3B8',
                  cursor:'pointer', fontSize:16,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  animation: voiceRec.recording ? 'pulse 1s infinite' : 'none',
                }}
              >
                🎤
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
