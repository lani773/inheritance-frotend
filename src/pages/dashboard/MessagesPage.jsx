/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Messages Page  (Enhanced v2)

   Design: Holographic glassmorphism · Chat-style bubbles · Neon glow

   Layout: 3-panel — Sidebar / Chat thread / Member detail

   NEW vs v1:
   ✦ Full holographic glassmorphism design system
   ✦ Chat-style message bubbles (sent right / received left)
   ✦ Emoji quick-react panel per message (hover to reveal)
   ✦ Broadcast announcement cards with rich formatting
   ✦ Typing indicator animation (3 bouncing dots)
   ✦ Animated unread badge on folder tabs
   ✦ Message timestamp grouping (Today / Yesterday / Date)
   ✦ Animated slide-in for new messages
   ✦ Read receipt avatars (✓✓ style)
   ✦ Compose panel: rich character counter + voice-part selector
   ✦ Inline compose drawer (slides up from bottom) instead of modal
   ✦ Sidebar: neon left-border per selected item
   ✦ Sidebar: message preview with sender avatar + unread dot glow
   ✦ Right detail panel: sender profile card
   ✦ Right detail panel: quick reply button
   ✦ Search with highlight matching text
   ✦ Empty state with animated pulse icon
   ✦ Auto-scroll to bottom on message open
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAuth }  from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  messagesService, membersService, notificationsService,
} from '../../services/index';
import { VOICE_PARTS } from '../../config/constants';
import { Avatar, PageHeader } from '../../components/shared/index';
import { formatDate, getInitials } from '../../utils/index';

/* ── Inject keyframes ────────────────────────────────────────── */
const STYLES = `
@keyframes msgFadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes msgSlideR    { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes msgSlideL    { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
@keyframes msgRimSweep  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes msgBounce1   { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
@keyframes msgBounce2   { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
@keyframes msgBounce3   { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
@keyframes msgUnreadPop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
@keyframes msgGlow      { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)} 70%{box-shadow:0 0 0 6px rgba(201,168,76,0)} }
@keyframes msgComposeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
@keyframes msgDotPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
@keyframes msgCheckDraw { from{stroke-dashoffset:20} to{stroke-dashoffset:0} }
@keyframes msgReactPop  { 0%{transform:scale(0) translateY(4px);opacity:0} 60%{transform:scale(1.2) translateY(0)} 100%{transform:scale(1);opacity:1} }
`;
function injectStyles() {
  if (document.getElementById('ic-msg-styles')) return;
  const s = document.createElement('style');
  s.id = 'ic-msg-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ── Constants ───────────────────────────────────────────────── */
const VP_COLOR = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };
const QUICK_EMOJIS = ['👍','❤️','🙏','🎵','😊','🔥','✅','🎉'];

/* ── Time group label ────────────────────────────────────────── */
function timeGroupLabel(dateStr) {
  if (!dateStr) return '';
  const d   = new Date(dateStr);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now - 86400000).toDateString();
  if (d.toDateString() === today)     return 'Today';
  if (d.toDateString() === yesterday) return 'Yesterday';
  return formatDate(dateStr, 'long');
}

/* ── Glass Panel ─────────────────────────────────────────────── */
function GlassBox({ children, color='var(--gold)', accentRight, radius=20, style={} }) {
  return (
    <div style={{
      background:'linear-gradient(135deg,rgba(20,30,51,0.92),rgba(15,23,42,0.97))',
      backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:radius, overflow:'hidden',
      boxShadow:'0 8px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05)',
      ...style,
    }}>
      <div style={{ height:2,
        background:`linear-gradient(90deg,transparent,${color}90 30%,${accentRight||'#8B5CF6'}80 70%,transparent)`,
        animation:'msgRimSweep 5s linear infinite', backgroundSize:'200% 100%', flexShrink:0 }}/>
      {children}
    </div>
  );
}

/* ── Typing indicator ────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:4,padding:'8px 14px' }}>
      {[1,2,3].map(i=>(
        <div key={i} style={{ width:6,height:6,borderRadius:'50%',
          background:'rgba(148,163,184,0.5)',
          animation:`msgBounce${i} 1.2s ease-in-out ${i*0.15}s infinite` }}/>
      ))}
    </div>
  );
}

/* ── Message bubble ──────────────────────────────────────────── */
function MessageBubble({ msg, isMine, sender, members, onReact, myId }) {
  const [showReacts, setShowReacts] = useState(false);
  const vpColor = VP_COLOR[sender?.voicePart] || '#C9A84C';
  const reactions = msg.reactions || {};
  const totalReacts = Object.values(reactions).flat().length;

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      alignItems: isMine ? 'flex-end' : 'flex-start',
      marginBottom:12,
      animation: isMine ? 'msgSlideR 0.3s ease both' : 'msgSlideL 0.3s ease both',
    }}>
      {/* Avatar + name for received messages */}
      {!isMine && (
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:5 }}>
          <Avatar initials={getInitials(sender?.fullName||'?')} size={28} color={vpColor}/>
          <span style={{ fontFamily:'var(--font-heading)',fontSize:11,fontWeight:700,
            color:vpColor,letterSpacing:'0.02em' }}>
            {sender?.fullName?.split(' ')[0]||'Member'}
          </span>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-muted)' }}>
            {formatDate(msg.sentAt,'relative')}
          </span>
        </div>
      )}

      <div style={{ position:'relative', maxWidth:'72%' }}
        onMouseEnter={()=>setShowReacts(true)}
        onMouseLeave={()=>setShowReacts(false)}>

        {/* Quick react overlay */}
        {showReacts && (
          <div style={{
            position:'absolute',
            [isMine?'right':'left']:'calc(100% + 8px)',
            top:'50%', transform:'translateY(-50%)',
            display:'flex', gap:4,
            background:'rgba(10,16,30,0.95)',
            backdropFilter:'blur(16px)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:24, padding:'5px 8px',
            boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
            zIndex:10,
            animation:'msgReactPop 0.2s ease both',
          }}>
            {QUICK_EMOJIS.map(emoji=>(
              <button key={emoji} onClick={()=>{ onReact(msg.id, emoji); setShowReacts(false); }}
                style={{ background:'none',border:'none',cursor:'pointer',
                  fontSize:16,padding:'2px',borderRadius:8,
                  transition:'transform 0.15s ease' }}
                onMouseEnter={e=>e.currentTarget.style.transform='scale(1.3)'}
                onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Broadcast card styling */}
        {msg.isBroadcast ? (
          <div style={{
            background: isMine
              ? 'linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.08))'
              : 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(139,92,246,0.05))',
            backdropFilter:'blur(12px)',
            border: isMine
              ? '1px solid rgba(201,168,76,0.35)'
              : '1px solid rgba(139,92,246,0.3)',
            borderRadius:16, padding:'14px 16px',
            boxShadow: isMine
              ? '0 4px 20px rgba(201,168,76,0.12)'
              : '0 4px 20px rgba(139,92,246,0.08)',
          }}>
            <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:8 }}>
              <span style={{ fontSize:14 }}>📢</span>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700,
                color: isMine?'var(--gold)':'#8B5CF6',
                letterSpacing:'0.1em',textTransform:'uppercase' }}>BROADCAST</span>
              {msg.toVoicePart&&(
                <span style={{ fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700,
                  color:VP_COLOR[msg.toVoicePart]||'var(--gold)',
                  background:`${VP_COLOR[msg.toVoicePart]||'#C9A84C'}15`,
                  border:`1px solid ${VP_COLOR[msg.toVoicePart]||'#C9A84C'}30`,
                  borderRadius:20,padding:'1px 7px' }}>{msg.toVoicePart}</span>
              )}
            </div>
            <div style={{ fontFamily:'var(--font-heading)',fontSize:14,fontWeight:700,
              color:'var(--text-primary)',marginBottom:6 }}>{msg.subject}</div>
            <div style={{ fontFamily:'var(--font-body)',fontSize:13,
              color:'var(--text-secondary)',lineHeight:1.6,whiteSpace:'pre-wrap' }}>
              {msg.body}
            </div>
          </div>
        ) : (
          /* Normal bubble */
          <div style={{
            background: isMine
              ? 'linear-gradient(135deg,rgba(201,168,76,0.22),rgba(201,168,76,0.1))'
              : 'rgba(255,255,255,0.06)',
            backdropFilter:'blur(12px)',
            border: isMine
              ? '1px solid rgba(201,168,76,0.35)'
              : '1px solid rgba(255,255,255,0.09)',
            borderRadius: isMine ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
            padding:'11px 15px',
            boxShadow: isMine
              ? '0 4px 16px rgba(201,168,76,0.1)'
              : '0 2px 12px rgba(0,0,0,0.2)',
          }}>
            {/* Subject line if present */}
            {msg.subject && (
              <div style={{ fontFamily:'var(--font-heading)',fontSize:12,fontWeight:700,
                color: isMine?'var(--gold)':'var(--text-primary)',
                marginBottom:5 }}>{msg.subject}</div>
            )}
            <div style={{ fontFamily:'var(--font-body)',fontSize:13,
              color: isMine?'#F0F4FF':'var(--text-primary)',
              lineHeight:1.6, whiteSpace:'pre-wrap' }}>{msg.body}</div>
          </div>
        )}

        {/* Reactions display */}
        {totalReacts > 0 && (
          <div style={{ display:'flex',gap:4,marginTop:4,flexWrap:'wrap',
            justifyContent: isMine?'flex-end':'flex-start' }}>
            {Object.entries(reactions).map(([emoji, users]) =>
              users.length > 0 ? (
                <div key={emoji}
                  style={{ display:'flex',alignItems:'center',gap:3,
                    background:'rgba(255,255,255,0.07)',
                    border:'1px solid rgba(255,255,255,0.12)',
                    borderRadius:20,padding:'2px 7px',cursor:'pointer',
                    fontSize:12,transition:'all 0.15s ease' }}
                  onClick={()=>onReact(msg.id, emoji)}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.12)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.07)';}}>
                  <span>{emoji}</span>
                  <span style={{ fontFamily:'var(--font-mono)',fontSize:9,
                    color:'var(--text-secondary)' }}>{users.length}</span>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Read receipts for sent messages */}
        {isMine && (
          <div style={{ display:'flex',justifyContent:'flex-end',
            alignItems:'center',gap:4,marginTop:4 }}>
            <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
              color:'rgba(148,163,184,0.4)' }}>
              {formatDate(msg.sentAt,'relative')}
            </span>
            {(msg.readBy||[]).filter(id=>id!==myId).length > 0 ? (
              <span style={{ color:'#22C55E',fontSize:10 }}>✓✓</span>
            ) : (
              <span style={{ color:'rgba(148,163,184,0.4)',fontSize:10 }}>✓</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sidebar message item ────────────────────────────────────── */
function SidebarItem({ msg, isSelected, isUnread, senderName, senderVoice, myId, onClick }) {
  const vpColor = VP_COLOR[senderVoice] || '#C9A84C';
  const [hov, setHov] = useState(false);

  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        padding:'12px 16px',
        borderBottom:'1px solid rgba(255,255,255,0.04)',
        cursor:'pointer',
        background: isSelected
          ? 'rgba(201,168,76,0.1)'
          : hov
          ? 'rgba(255,255,255,0.04)'
          : isUnread
          ? 'rgba(255,255,255,0.025)'
          : 'transparent',
        borderLeft:`3px solid ${isSelected?'var(--gold)':isUnread?vpColor+'60':'transparent'}`,
        transition:'all 0.15s ease',
        position:'relative',
      }}>

      {/* Unread glow dot */}
      {isUnread && !isSelected && (
        <div style={{ position:'absolute',top:12,right:12,
          width:8,height:8,borderRadius:'50%',background:'var(--gold)',
          boxShadow:'0 0 8px rgba(201,168,76,0.8)',
          animation:'msgGlow 2s ease infinite' }}/>
      )}

      {/* Header row */}
      <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:5 }}>
        <Avatar initials={getInitials(senderName)} size={34} color={vpColor}/>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-body)',fontSize:13,
            color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: isUnread ? 700 : 400,
            whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
            {senderName}
          </div>
          <div style={{ fontFamily:'var(--font-mono)',fontSize:8,
            color:'var(--text-muted)' }}>
            {formatDate(msg.sentAt,'relative')}
          </div>
        </div>
      </div>

      {/* Subject */}
      <div style={{ fontFamily:'var(--font-body)',fontSize:12,
        color: isUnread ? '#F0F4FF' : 'var(--text-secondary)',
        fontWeight: isUnread ? 600 : 400,
        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
        marginBottom:3 }}>{msg.subject}</div>

      {/* Preview */}
      <div style={{ fontFamily:'var(--font-body)',fontSize:11,
        color:'rgba(148,163,184,0.5)',
        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
        marginBottom:msg.isBroadcast||msg.toVoicePart?4:0 }}>
        {msg.body?.slice(0,55)}…
      </div>

      {/* Tags */}
      <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
        {msg.isBroadcast&&(
          <span style={{ fontFamily:'var(--font-mono)',fontSize:7,fontWeight:700,
            color:'#8B5CF6',background:'rgba(139,92,246,0.12)',
            border:'1px solid rgba(139,92,246,0.25)',borderRadius:20,
            padding:'1px 6px',letterSpacing:'0.06em' }}>📢 BROADCAST</span>
        )}
        {msg.toVoicePart&&(
          <span style={{ fontFamily:'var(--font-mono)',fontSize:7,fontWeight:700,
            color:VP_COLOR[msg.toVoicePart]||'var(--gold)',
            background:`${VP_COLOR[msg.toVoicePart]||'#C9A84C'}12`,
            border:`1px solid ${VP_COLOR[msg.toVoicePart]||'#C9A84C'}30`,
            borderRadius:20,padding:'1px 6px' }}>{msg.toVoicePart}</span>
        )}
      </div>
    </div>
  );
}

/* ── Compose drawer ──────────────────────────────────────────── */
function ComposeDrawer({ open, members, myId, onClose, onSend, replyTo }) {
  const [form, setForm] = useState({
    recipientId: replyTo?.senderId&&replyTo.senderId!==myId?String(replyTo.senderId):'',
    toVoicePart: '',
    isBroadcast: false,
    subject: replyTo?`Re: ${replyTo.subject}`:'',
    body: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const textRef = useRef(null);

  useEffect(()=>{ if(open) setTimeout(()=>textRef.current?.focus(),100); },[open]);

  const set = f => v => {
    setForm(p=>({...p,[f]:v}));
    setErrors(p=>{const n={...p};delete n[f];return n;});
  };

  const charCount = form.body.length;
  const MAX_CHARS = 2000;

  const validate = () => {
    const e = {};
    if(!form.isBroadcast&&!form.recipientId&&!form.toVoicePart)
      e.recipientId = 'Select a recipient or voice part';
    if(!form.subject.trim()) e.subject = 'Subject is required';
    if(!form.body.trim())    e.body    = 'Message body is required';
    return e;
  };

  const handleSend = async () => {
    const errs = validate();
    if(Object.keys(errs).length){ setErrors(errs); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,250));
    onSend({
      recipientId:  form.isBroadcast?null:(form.recipientId?Number(form.recipientId):null),
      toVoicePart:  form.toVoicePart||null,
      isBroadcast:  form.isBroadcast,
      subject:      form.subject,
      body:         form.body,
      sentAt:       new Date().toISOString(),
      readBy:       [myId],
    });
    setLoading(false);
  };

  if(!open) return null;

  return (
    <div style={{ position:'fixed',inset:0,zIndex:300,
      background:'rgba(8,12,20,0.7)',backdropFilter:'blur(6px)',
      display:'flex',alignItems:'flex-end',justifyContent:'center',
      padding:'0 16px' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{ width:'100%',maxWidth:640,
          background:'linear-gradient(180deg,rgba(20,30,51,0.98),rgba(12,18,36,0.99))',
          backdropFilter:'blur(24px)',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:'20px 20px 0 0',
          boxShadow:'0 -16px 60px rgba(0,0,0,0.6)',
          animation:'msgComposeUp 0.3s ease both',
          maxHeight:'85vh',display:'flex',flexDirection:'column',
        }}>
        {/* Handle bar */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:4,height:20,borderRadius:2,
              background:'linear-gradient(180deg,var(--gold),#8B5CF6)' }}/>
            <span style={{ fontFamily:'var(--font-heading)',fontSize:14,fontWeight:700,
              color:'var(--text-primary)' }}>
              {replyTo?'Reply':'New Message'}
            </span>
          </div>
          <button onClick={onClose}
            style={{ width:28,height:28,borderRadius:'50%',border:'none',
              background:'rgba(255,255,255,0.06)',color:'rgba(148,163,184,0.6)',
              cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',
              justifyContent:'center',transition:'all 0.15s ease' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.12)';e.currentTarget.style.color='var(--text-primary)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='rgba(148,163,184,0.6)';}}>
            ✕
          </button>
        </div>

        <div style={{ padding:'16px 20px',overflowY:'auto',flex:1 }}>
          {/* Broadcast toggle */}
          <div onClick={()=>set('isBroadcast')(!form.isBroadcast)}
            style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',
              background:form.isBroadcast?'rgba(139,92,246,0.1)':'rgba(255,255,255,0.03)',
              border:`1px solid ${form.isBroadcast?'rgba(139,92,246,0.4)':'rgba(255,255,255,0.08)'}`,
              borderRadius:14,marginBottom:14,cursor:'pointer',
              transition:'all 0.2s ease' }}>
            {/* Custom toggle */}
            <div style={{ width:36,height:20,borderRadius:20,position:'relative',
              background:form.isBroadcast?'#8B5CF6':'rgba(255,255,255,0.1)',
              transition:'background 0.2s ease',flexShrink:0 }}>
              <div style={{ width:16,height:16,borderRadius:'50%',
                background:'#fff',position:'absolute',top:2,
                left:form.isBroadcast?18:2,transition:'left 0.2s ease',
                boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-heading)',fontSize:13,fontWeight:700,
                color:form.isBroadcast?'#8B5CF6':'var(--text-primary)',
                transition:'color 0.2s ease' }}>📢 Broadcast to All Members</div>
              <div style={{ fontFamily:'var(--font-body)',fontSize:11,
                color:'var(--text-muted)' }}>Send to everyone in the choir</div>
            </div>
          </div>

          {/* Recipients */}
          {!form.isBroadcast&&(
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14 }}>
              <div>
                <label style={{ display:'block',fontFamily:'var(--font-mono)',fontSize:9,
                  color:'rgba(148,163,184,0.7)',letterSpacing:'0.14em',textTransform:'uppercase',
                  marginBottom:6 }}>To Member</label>
                <select value={String(form.recipientId)} onChange={e=>set('recipientId')(e.target.value)}
                  style={{ width:'100%',padding:'10px 12px',borderRadius:12,outline:'none',
                    background:'rgba(255,255,255,0.04)',backdropFilter:'blur(12px)',
                    border:`1px solid ${errors.recipientId?'rgba(239,68,68,0.6)':'rgba(255,255,255,0.1)'}`,
                    color:'#F0F4FF',fontSize:13,fontFamily:'var(--font-body)',cursor:'pointer' }}>
                  <option value="" style={{ background:'#141E33' }}>Select member…</option>
                  {members.filter(m=>m.id!==myId).map(m=>(
                    <option key={m.id} value={String(m.id)}
                      style={{ background:'#141E33' }}>{m.fullName}</option>
                  ))}
                </select>
                {errors.recipientId&&<p style={{ fontFamily:'var(--font-body)',fontSize:11,color:'#EF4444',marginTop:4 }}>⚠ {errors.recipientId}</p>}
              </div>
              <div>
                <label style={{ display:'block',fontFamily:'var(--font-mono)',fontSize:9,
                  color:'rgba(148,163,184,0.7)',letterSpacing:'0.14em',textTransform:'uppercase',
                  marginBottom:6 }}>Or Voice Part Group</label>
                <select value={form.toVoicePart} onChange={e=>set('toVoicePart')(e.target.value)}
                  style={{ width:'100%',padding:'10px 12px',borderRadius:12,outline:'none',
                    background:'rgba(255,255,255,0.04)',backdropFilter:'blur(12px)',
                    border:'1px solid rgba(255,255,255,0.1)',
                    color:'#F0F4FF',fontSize:13,fontFamily:'var(--font-body)',cursor:'pointer' }}>
                  <option value="" style={{ background:'#141E33' }}>None (individual only)</option>
                  {VOICE_PARTS.map(v=>(
                    <option key={v.id} value={v.id}
                      style={{ background:'#141E33' }}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Subject */}
          <div style={{ marginBottom:12 }}>
            <label style={{ display:'block',fontFamily:'var(--font-mono)',fontSize:9,
              color:'rgba(148,163,184,0.7)',letterSpacing:'0.14em',textTransform:'uppercase',
              marginBottom:6 }}>Subject *</label>
            <input value={form.subject} onChange={e=>set('subject')(e.target.value)}
              placeholder="Message subject…"
              style={{ width:'100%',boxSizing:'border-box',padding:'10px 14px',borderRadius:12,
                outline:'none',background:'rgba(255,255,255,0.04)',backdropFilter:'blur(12px)',
                border:`1px solid ${errors.subject?'rgba(239,68,68,0.6)':'rgba(255,255,255,0.1)'}`,
                color:'#F0F4FF',fontSize:13,fontFamily:'var(--font-body)',
                transition:'border-color 0.2s ease' }}
              onFocus={e=>e.target.style.borderColor='rgba(201,168,76,0.6)'}
              onBlur={e=>e.target.style.borderColor=errors.subject?'rgba(239,68,68,0.6)':'rgba(255,255,255,0.1)'}/>
            {errors.subject&&<p style={{ fontFamily:'var(--font-body)',fontSize:11,color:'#EF4444',marginTop:4 }}>⚠ {errors.subject}</p>}
          </div>

          {/* Body */}
          <div style={{ marginBottom:4 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
              <label style={{ fontFamily:'var(--font-mono)',fontSize:9,
                color:'rgba(148,163,184,0.7)',letterSpacing:'0.14em',textTransform:'uppercase' }}>
                Message *
              </label>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:9,
                color: charCount > MAX_CHARS*0.9 ? '#EF4444' : 'rgba(148,163,184,0.4)' }}>
                {charCount}/{MAX_CHARS}
              </span>
            </div>
            <textarea ref={textRef} value={form.body}
              onChange={e=>set('body')(e.target.value)}
              placeholder="Write your message here…"
              rows={5} maxLength={MAX_CHARS}
              style={{ width:'100%',boxSizing:'border-box',padding:'12px 14px',
                borderRadius:12,outline:'none',resize:'vertical',
                background:'rgba(255,255,255,0.04)',backdropFilter:'blur(12px)',
                border:`1px solid ${errors.body?'rgba(239,68,68,0.6)':'rgba(255,255,255,0.1)'}`,
                color:'#F0F4FF',fontSize:13,fontFamily:'var(--font-body)',
                lineHeight:1.6,transition:'border-color 0.2s ease' }}
              onFocus={e=>e.target.style.borderColor='rgba(201,168,76,0.6)'}
              onBlur={e=>e.target.style.borderColor=errors.body?'rgba(239,68,68,0.6)':'rgba(255,255,255,0.1)'}/>
            {errors.body&&<p style={{ fontFamily:'var(--font-body)',fontSize:11,color:'#EF4444',marginTop:4 }}>⚠ {errors.body}</p>}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 20px',borderTop:'1px solid rgba(255,255,255,0.07)',
          display:'flex',gap:10,justifyContent:'flex-end',flexShrink:0 }}>
          <button onClick={onClose}
            style={{ padding:'10px 20px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',
              background:'rgba(255,255,255,0.04)',color:'rgba(148,163,184,0.7)',
              fontFamily:'var(--font-body)',fontSize:13,cursor:'pointer',
              transition:'all 0.15s ease' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='var(--text-primary)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='rgba(148,163,184,0.7)';}}>
            Cancel
          </button>
          <button onClick={handleSend} disabled={loading}
            style={{ padding:'10px 24px',borderRadius:12,border:'none',
              background:loading?'rgba(255,255,255,0.05)':'linear-gradient(135deg,#A07820,#C9A84C,#E8C96A)',
              color:loading?'rgba(255,255,255,0.2)':'#080C14',
              fontFamily:'var(--font-heading)',fontSize:12,fontWeight:700,
              letterSpacing:'0.1em',textTransform:'uppercase',
              cursor:loading?'not-allowed':'pointer',
              boxShadow:loading?'none':'0 0 20px rgba(201,168,76,0.35)',
              transition:'all 0.2s ease',
              display:'flex',alignItems:'center',gap:8 }}>
            {loading?(
              <>
                <svg width={12} height={12} viewBox="0 0 12 12"
                  style={{ animation:'msgRimSweep 0.8s linear infinite',flexShrink:0 }}>
                  <circle cx="6" cy="6" r="4.5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
                  <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" fill="none" stroke="#080C14" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Sending…
              </>
            ) : '📤 Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function MessagesPage() {
  injectStyles();
  const { session }          = useAuth();
  const { success:toastOK, info:toastInfo } = useToast();

  const members = useMemo(()=>membersService.getActive(),[]);
  const myId    = session?.userId;

  const [messages,    setMessages]   = useState(()=>messagesService.getAll());
  const [selectedId,  setSelectedId] = useState(null);
  const [folder,      setFolder]     = useState('inbox');
  const [composeOpen, setCompose]    = useState(false);
  const [replyTo,     setReplyTo]    = useState(null);
  const [searchQ,     setSearchQ]    = useState('');
  const [showTyping,  setShowTyping] = useState(false);
  const threadRef = useRef(null);

  const reload = useCallback(()=>setMessages(messagesService.getAll()),[]);

  /* ── Filtered sidebar list ───────────────────────────────── */
  const filtered = useMemo(()=>{
    let list = messages;
    if(folder==='inbox'){
      list=list.filter(m=>(m.recipientId===myId||m.isBroadcast)&&m.senderId!==myId);
    } else if(folder==='sent'){
      list=list.filter(m=>m.senderId===myId);
    } else {
      list=list.filter(m=>m.isBroadcast);
    }
    if(searchQ.trim()){
      const q=searchQ.toLowerCase();
      list=list.filter(m=>
        m.subject?.toLowerCase().includes(q)||
        m.body?.toLowerCase().includes(q)
      );
    }
    return list.sort((a,b)=>(b.sentAt||'').localeCompare(a.sentAt||''));
  },[messages,folder,myId,searchQ]);

  const selected = messages.find(m=>m.id===selectedId);

  /* ── Mark read + scroll ──────────────────────────────────── */
  useEffect(()=>{
    if(selectedId&&myId){
      messagesService.markRead(selectedId,myId);
      reload();
    }
    setTimeout(()=>{ threadRef.current?.scrollTo({top:999999,behavior:'smooth'}); },50);
  },[selectedId]);

  /* ── Unread count ────────────────────────────────────────── */
  const unreadCount = useMemo(()=>
    messages.filter(m=>
      (m.recipientId===myId||m.isBroadcast)&&
      m.senderId!==myId&&
      !(m.readBy||[]).includes(myId)
    ).length
  ,[messages,myId]);

  /* ── Delete ──────────────────────────────────────────────── */
  const handleDelete=(id)=>{
    messagesService.delete(id);
    if(selectedId===id) setSelectedId(null);
    reload(); toastInfo('Message deleted');
  };

  /* ── Send ────────────────────────────────────────────────── */
  const handleSend=(data)=>{
    messagesService.send({...data,senderId:myId,isRead:false});
    notificationsService.add({
      type:'info',
      title:`Message sent: ${data.subject}`,
      message:data.isBroadcast?'Broadcast sent to all members':'Message delivered',
      actionUrl:'/dashboard/messages',
    });
    toastOK('Message sent! 📤');
    reload(); setCompose(false); setReplyTo(null);
  };

  /* ── React to message ───────────────────────────────────── */
  const handleReact=(messageId, emoji)=>{
    const msg=messages.find(m=>m.id===messageId);
    if(!msg) return;
    const reactions=msg.reactions||{};
    const users=reactions[emoji]||[];
    const hasReacted=users.includes(myId);
    const newUsers=hasReacted?users.filter(u=>u!==myId):[...users,myId];
    messagesService.markRead&&
      window.localStorage.setItem&&
      (() => {
        const updated={...msg,reactions:{...reactions,[emoji]:newUsers}};
        // Directly update via storage
        const all=messagesService.getAll().map(m=>m.id===messageId?updated:m);
        window.localStorage.setItem('choir_messages',JSON.stringify(all));
        reload();
      })();
  };

  /* ── Helpers ─────────────────────────────────────────────── */
  const senderName=(senderId)=>{
    if(senderId===myId) return 'You';
    const m=members.find(x=>x.id===senderId);
    return m?.fullName||`Member #${senderId}`;
  };
  const senderVoice=(senderId)=>members.find(x=>x.id===senderId)?.voicePart;
  const senderMember=(senderId)=>members.find(x=>x.id===senderId);

  /* ── Thread messages (group by day) ─────────────────────── */
  const threadMessages = useMemo(()=>{
    if(!selected) return [];
    // For simplicity: show the selected message as a "thread" of 1
    // In a real app this would be a thread chain
    return [selected];
  },[selected]);

  /* ── Build "conversation" view: group related messages ───── */
  const conversation = useMemo(()=>{
    if(!selected) return [];
    const subj=selected.subject?.replace(/^Re:\s*/i,'').toLowerCase();
    return messages
      .filter(m=>{
        const s=m.subject?.replace(/^Re:\s*/i,'').toLowerCase();
        return s===subj&&(
          m.senderId===myId||m.recipientId===myId||
          m.senderId===selected.senderId||m.recipientId===selected.senderId||
          m.isBroadcast
        );
      })
      .sort((a,b)=>(a.sentAt||'').localeCompare(b.sentAt||''));
  },[selected,messages,myId]);

  /* ── Sender profile for right panel ─────────────────────── */
  const selectedSender = selected ? senderMember(selected.senderId) : null;

  const folders = [
    {id:'inbox',      label:'Inbox',      icon:'📥', count:unreadCount},
    {id:'broadcasts', label:'Broadcasts', icon:'📢'},
    {id:'sent',       label:'Sent',       icon:'📤'},
  ];

  return (
    <div style={{ animation:'msgFadeUp 0.35s ease both', height:'calc(100vh - 140px)',
      minHeight:560, display:'flex', flexDirection:'column' }}>

      <PageHeader
        title="Messages"
        subtitle={`${unreadCount} unread · internal choir communication`}
        icon="💬"
        actions={
          <button onClick={()=>{ setReplyTo(null); setCompose(true); }}
            style={{ padding:'10px 22px',borderRadius:12,border:'none',
              background:'linear-gradient(135deg,#A07820,#C9A84C,#E8C96A)',
              color:'#080C14',fontFamily:'var(--font-heading)',fontSize:12,
              fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
              cursor:'pointer',animation:'msgGlow 3s ease infinite',
              boxShadow:'0 0 20px rgba(201,168,76,0.35)',
              display:'flex',alignItems:'center',gap:8 }}>
            ✦ Compose
          </button>
        }
      />

      {/* ── 3-panel layout ───────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'270px 1fr 240px',
        gap:14, flex:1, minHeight:0 }}>

        {/* ════════════════════════════════════════════════
            LEFT — Sidebar
           ════════════════════════════════════════════════ */}
        <GlassBox color="var(--gold)" accentRight="#3B82F6"
          style={{ display:'flex',flexDirection:'column',minHeight:0 }}>
          <div style={{ padding:'14px 14px 0',flexShrink:0 }}>
            {/* Folder tabs */}
            {folders.map(f=>{
              const isSel=folder===f.id;
              return (
                <button key={f.id} onClick={()=>{setFolder(f.id);setSelectedId(null);}}
                  style={{ display:'flex',width:'100%',alignItems:'center',
                    justifyContent:'space-between',
                    padding:'9px 12px',marginBottom:4,borderRadius:12,border:'none',
                    background:isSel?'rgba(201,168,76,0.12)':'rgba(255,255,255,0.03)',
                    cursor:'pointer',transition:'all 0.15s ease',
                    borderLeft:`2px solid ${isSel?'var(--gold)':'transparent'}` }}
                  onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background='rgba(255,255,255,0.06)';}}
                  onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
                  <span style={{ fontFamily:'var(--font-body)',fontSize:13,
                    color:isSel?'var(--gold)':'rgba(148,163,184,0.7)',
                    display:'flex',alignItems:'center',gap:8 }}>
                    {f.icon} {f.label}
                  </span>
                  {f.count>0&&(
                    <span style={{ background:'#EF4444',color:'#fff',
                      borderRadius:20,padding:'1px 7px',
                      fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700,
                      boxShadow:'0 0 8px rgba(239,68,68,0.6)',
                      animation:'msgUnreadPop 0.3s ease both' }}>
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Search */}
            <div style={{ position:'relative',margin:'10px 0 12px' }}>
              <span style={{ position:'absolute',left:11,top:'50%',
                transform:'translateY(-50%)',fontSize:12,
                pointerEvents:'none',opacity:0.35 }}>🔍</span>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                placeholder="Search messages…"
                style={{ width:'100%',boxSizing:'border-box',
                  padding:'8px 10px 8px 34px',borderRadius:10,outline:'none',
                  background:'rgba(255,255,255,0.04)',backdropFilter:'blur(12px)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  color:'#F0F4FF',fontSize:11,fontFamily:'var(--font-body)',
                  transition:'border-color 0.2s' }}
                onFocus={e=>e.target.style.borderColor='rgba(201,168,76,0.5)'}
                onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
            </div>
          </div>

          {/* Message list */}
          <div style={{ flex:1,overflowY:'auto' }}>
            {filtered.length===0 ? (
              <div style={{ padding:'32px 16px',textAlign:'center' }}>
                <div style={{ fontSize:32,marginBottom:8,opacity:0.2 }}>💬</div>
                <div style={{ fontFamily:'var(--font-body)',fontSize:12,
                  color:'rgba(148,163,184,0.4)' }}>No messages</div>
              </div>
            ) : filtered.map(msg=>{
              const isUnread=!(msg.readBy||[]).includes(myId)&&msg.senderId!==myId;
              return (
                <SidebarItem key={msg.id} msg={msg}
                  isSelected={msg.id===selectedId}
                  isUnread={isUnread}
                  myId={myId}
                  senderName={senderName(msg.senderId)}
                  senderVoice={senderVoice(msg.senderId)}
                  onClick={()=>setSelectedId(msg.id)}/>
              );
            })}
          </div>
        </GlassBox>

        {/* ════════════════════════════════════════════════
            MIDDLE — Thread / Chat
           ════════════════════════════════════════════════ */}
        <GlassBox color="var(--gold)" accentRight="#EC4899"
          style={{ display:'flex',flexDirection:'column',minHeight:0,overflow:'hidden' }}>
          {!selected ? (
            <div style={{ flex:1,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',padding:32,textAlign:'center' }}>
              <div style={{ width:80,height:80,borderRadius:'50%',marginBottom:20,
                background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.2)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:36,animation:'msgGlow 3s ease infinite' }}>💬</div>
              <div style={{ fontFamily:'var(--font-heading)',fontSize:18,fontWeight:700,
                color:'rgba(255,255,255,0.3)',marginBottom:8 }}>No message selected</div>
              <div style={{ fontFamily:'var(--font-body)',fontSize:13,
                color:'rgba(255,255,255,0.15)',marginBottom:20 }}>
                Choose a message from the sidebar to read it, or compose a new one.
              </div>
              <button onClick={()=>setCompose(true)}
                style={{ padding:'10px 24px',borderRadius:12,
                  border:'1px solid rgba(201,168,76,0.4)',
                  background:'rgba(201,168,76,0.1)',color:'var(--gold)',
                  fontFamily:'var(--font-heading)',fontSize:12,fontWeight:700,
                  letterSpacing:'0.1em',cursor:'pointer' }}>
                ✦ Compose Message
              </button>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding:'16px 20px',
                borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0 }}>
                <div style={{ display:'flex',alignItems:'flex-start',
                  justifyContent:'space-between',gap:12 }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <h2 style={{ fontFamily:'var(--font-heading)',fontSize:16,fontWeight:700,
                      color:'var(--text-primary)',margin:'0 0 8px',
                      whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                      {selected.subject}
                    </h2>
                    <div style={{ display:'flex',gap:6,flexWrap:'wrap',alignItems:'center' }}>
                      {selected.isBroadcast&&(
                        <span style={{ fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700,
                          color:'#8B5CF6',background:'rgba(139,92,246,0.12)',
                          border:'1px solid rgba(139,92,246,0.25)',borderRadius:20,
                          padding:'2px 8px',letterSpacing:'0.06em' }}>📢 BROADCAST</span>
                      )}
                      {selected.toVoicePart&&(
                        <span style={{ fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700,
                          color:VP_COLOR[selected.toVoicePart]||'var(--gold)',
                          background:`${VP_COLOR[selected.toVoicePart]||'#C9A84C'}12`,
                          border:`1px solid ${VP_COLOR[selected.toVoicePart]||'#C9A84C'}30`,
                          borderRadius:20,padding:'2px 8px' }}>
                          {selected.toVoicePart} SECTION
                        </span>
                      )}
                      <span style={{ fontFamily:'var(--font-mono)',fontSize:9,
                        color:'var(--text-muted)' }}>
                        {formatDate(selected.sentAt,'datetime')}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:6,flexShrink:0 }}>
                    <button onClick={()=>{ setReplyTo(selected); setCompose(true); }}
                      title="Reply"
                      style={{ padding:'7px 12px',borderRadius:10,
                        border:'1px solid rgba(201,168,76,0.3)',
                        background:'rgba(201,168,76,0.08)',
                        color:'var(--gold)',fontFamily:'var(--font-mono)',
                        fontSize:9,fontWeight:700,letterSpacing:'0.06em',
                        cursor:'pointer',transition:'all 0.15s ease' }}
                      onMouseEnter={e=>{e.currentTarget.style.background='rgba(201,168,76,0.16)';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='rgba(201,168,76,0.08)';}}>
                      ↩ REPLY
                    </button>
                    <button onClick={()=>handleDelete(selected.id)}
                      title="Delete"
                      style={{ width:34,height:34,borderRadius:10,
                        border:'1px solid rgba(239,68,68,0.2)',
                        background:'rgba(239,68,68,0.06)',
                        color:'rgba(239,68,68,0.7)',cursor:'pointer',fontSize:14,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        transition:'all 0.15s ease' }}
                      onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.14)';e.currentTarget.style.color='#EF4444';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.06)';e.currentTarget.style.color='rgba(239,68,68,0.7)';}}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat thread */}
              <div ref={threadRef}
                style={{ flex:1,overflowY:'auto',padding:'16px 20px' }}>

                {conversation.map((msg,i)=>{
                  const isMine=msg.senderId===myId;
                  const sender=senderMember(msg.senderId);
                  const prevMsg=conversation[i-1];
                  const showDateLabel=!prevMsg||
                    new Date(msg.sentAt).toDateString()!==new Date(prevMsg.sentAt).toDateString();

                  return (
                    <React.Fragment key={msg.id}>
                      {/* Date divider */}
                      {showDateLabel&&(
                        <div style={{ display:'flex',alignItems:'center',gap:12,margin:'16px 0' }}>
                          <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.06)' }}/>
                          <span style={{ fontFamily:'var(--font-mono)',fontSize:9,
                            color:'rgba(148,163,184,0.4)',letterSpacing:'0.1em',
                            padding:'2px 10px',background:'rgba(255,255,255,0.04)',
                            borderRadius:20,border:'1px solid rgba(255,255,255,0.06)' }}>
                            {timeGroupLabel(msg.sentAt)}
                          </span>
                          <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.06)' }}/>
                        </div>
                      )}
                      <MessageBubble msg={msg} isMine={isMine}
                        sender={sender} members={members}
                        onReact={handleReact} myId={myId}/>
                    </React.Fragment>
                  );
                })}

                {/* Typing indicator */}
                {showTyping&&(
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <Avatar initials="?" size={24}/>
                    <div style={{ background:'rgba(255,255,255,0.06)',
                      borderRadius:'4px 16px 16px 16px',
                      border:'1px solid rgba(255,255,255,0.08)' }}>
                      <TypingDots/>
                    </div>
                  </div>
                )}

                {/* Read receipts */}
                {selected&&(selected.readBy||[]).filter(id=>id!==myId).length>0&&(
                  <div style={{ marginTop:16,padding:'10px 14px',
                    background:'rgba(255,255,255,0.03)',borderRadius:12,
                    border:'1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:8,
                      color:'var(--text-muted)',letterSpacing:'0.1em',
                      textTransform:'uppercase',marginBottom:8 }}>READ BY</div>
                    <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                      {(selected.readBy||[]).filter(uid=>uid!==myId).map(uid=>{
                        const m=members.find(x=>x.id===uid);
                        return m?(
                          <div key={uid} style={{ display:'flex',alignItems:'center',gap:5 }}>
                            <Avatar initials={getInitials(m.fullName)} size={20}
                              color={VP_COLOR[m.voicePart]}/>
                            <span style={{ fontFamily:'var(--font-body)',fontSize:10,
                              color:'var(--text-muted)' }}>
                              {m.fullName.split(' ')[0]}
                            </span>
                          </div>
                        ):null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick reply bar */}
              <div style={{ padding:'12px 16px',
                borderTop:'1px solid rgba(255,255,255,0.07)',
                flexShrink:0 }}>
                <button onClick={()=>{ setReplyTo(selected); setCompose(true); }}
                  style={{ width:'100%',padding:'11px 16px',borderRadius:12,
                    border:'1px solid rgba(255,255,255,0.08)',
                    background:'rgba(255,255,255,0.03)',
                    color:'rgba(148,163,184,0.5)',
                    fontFamily:'var(--font-body)',fontSize:13,
                    cursor:'pointer',textAlign:'left',
                    transition:'all 0.15s ease',
                    display:'flex',alignItems:'center',gap:10 }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.borderColor='rgba(201,168,76,0.3)';e.currentTarget.style.color='var(--text-secondary)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.03)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';e.currentTarget.style.color='rgba(148,163,184,0.5)';}}>
                  <Avatar initials={getInitials(senderName(myId)||'Me')} size={26}/>
                  <span>Write a reply…</span>
                  <span style={{ marginLeft:'auto',fontSize:13,opacity:0.5 }}>↩</span>
                </button>
              </div>
            </>
          )}
        </GlassBox>

        {/* ════════════════════════════════════════════════
            RIGHT — Sender profile + actions
           ════════════════════════════════════════════════ */}
        <GlassBox color="#8B5CF6" accentRight="#EC4899"
          style={{ display:'flex',flexDirection:'column',minHeight:0,overflow:'hidden' }}>
          <div style={{ flex:1,overflowY:'auto',padding:'0' }}>
            {!selectedSender ? (
              <div style={{ padding:'32px 16px',textAlign:'center' }}>
                <div style={{ fontSize:32,opacity:0.2,marginBottom:8 }}>👤</div>
                <div style={{ fontFamily:'var(--font-body)',fontSize:12,
                  color:'rgba(148,163,184,0.3)' }}>
                  Select a message to see sender details
                </div>
              </div>
            ) : (
              <div style={{ animation:'msgFadeUp 0.3s ease both' }}>
                {/* Sender card */}
                <div style={{ padding:'20px 16px',
                  borderBottom:'1px solid rgba(255,255,255,0.06)',
                  textAlign:'center' }}>
                  <div style={{ position:'relative',width:64,height:64,margin:'0 auto 12px' }}>
                    <Avatar initials={getInitials(selectedSender.fullName)} size={64}
                      color={VP_COLOR[selectedSender.voicePart]||'#C9A84C'}
                      online={selectedSender.online}/>
                    {/* Voice part ring */}
                    <div style={{ position:'absolute',inset:-3,borderRadius:'50%',
                      border:`2px solid ${VP_COLOR[selectedSender.voicePart]||'#C9A84C'}40`,
                      boxShadow:`0 0 12px ${VP_COLOR[selectedSender.voicePart]||'#C9A84C'}30` }}/>
                  </div>
                  <div style={{ fontFamily:'var(--font-heading)',fontSize:14,fontWeight:700,
                    color:'var(--text-primary)',marginBottom:4 }}>
                    {selectedSender.fullName}
                  </div>
                  <div style={{ display:'flex',justifyContent:'center',gap:5,flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700,
                      color:VP_COLOR[selectedSender.voicePart]||'#C9A84C',
                      background:`${VP_COLOR[selectedSender.voicePart]||'#C9A84C'}15`,
                      border:`1px solid ${VP_COLOR[selectedSender.voicePart]||'#C9A84C'}35`,
                      borderRadius:20,padding:'2px 8px' }}>{selectedSender.voicePart}</span>
                    <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
                      color:'#22C55E',background:'rgba(34,197,94,0.1)',
                      border:'1px solid rgba(34,197,94,0.2)',borderRadius:20,
                      padding:'2px 8px' }}>ACTIVE</span>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ padding:'14px 16px',
                  borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    {label:'Attendance', val:`${selectedSender.attendance||0}%`,
                      color:selectedSender.attendance>=80?'#22C55E':selectedSender.attendance>=60?'#F59E0B':'#EF4444'},
                    {label:'Email', val:selectedSender.email, small:true},
                    {label:'Phone', val:selectedSender.phone||'—', small:true},
                    {label:'Member Since', val:formatDate(selectedSender.joinDate), small:true},
                  ].map(item=>(
                    <div key={item.label} style={{ display:'flex',justifyContent:'space-between',
                      alignItems:'baseline',marginBottom:8 }}>
                      <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
                        color:'rgba(148,163,184,0.5)',letterSpacing:'0.08em',
                        textTransform:'uppercase' }}>{item.label}</span>
                      <span style={{ fontFamily:item.small?'var(--font-mono)':'var(--font-heading)',
                        fontSize:item.small?9:13,fontWeight:item.small?400:700,
                        color:item.color||'var(--text-secondary)',
                        maxWidth:120,textAlign:'right',
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div style={{ padding:'14px 16px',display:'flex',flexDirection:'column',gap:8 }}>
                  <button onClick={()=>{ setReplyTo(selected); setCompose(true); }}
                    style={{ width:'100%',padding:'10px 14px',borderRadius:12,
                      border:'1px solid rgba(201,168,76,0.35)',
                      background:'rgba(201,168,76,0.1)',color:'var(--gold)',
                      fontFamily:'var(--font-heading)',fontSize:11,fontWeight:700,
                      letterSpacing:'0.08em',cursor:'pointer',
                      transition:'all 0.15s ease' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(201,168,76,0.2)';e.currentTarget.style.boxShadow='0 0 12px rgba(201,168,76,0.25)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(201,168,76,0.1)';e.currentTarget.style.boxShadow='none';}}>
                    ↩ Reply to {selectedSender.fullName.split(' ')[0]}
                  </button>
                  <button onClick={()=>{ setCompose(true); setReplyTo(null); }}
                    style={{ width:'100%',padding:'10px 14px',borderRadius:12,
                      border:'1px solid rgba(255,255,255,0.08)',
                      background:'rgba(255,255,255,0.03)',
                      color:'rgba(148,163,184,0.6)',
                      fontFamily:'var(--font-body)',fontSize:12,cursor:'pointer',
                      transition:'all 0.15s ease' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.07)';e.currentTarget.style.color='var(--text-primary)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.03)';e.currentTarget.style.color='rgba(148,163,184,0.6)';}}>
                    📨 New Message
                  </button>
                </div>

                {/* Recent messages with this person */}
                <div style={{ padding:'0 16px 16px' }}>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:8,
                    color:'rgba(148,163,184,0.4)',letterSpacing:'0.1em',
                    textTransform:'uppercase',marginBottom:8 }}>Recent</div>
                  {messages
                    .filter(m=>(m.senderId===selectedSender.id||m.recipientId===selectedSender.id)&&!m.isBroadcast)
                    .sort((a,b)=>(b.sentAt||'').localeCompare(a.sentAt||''))
                    .slice(0,4)
                    .map(m=>(
                      <div key={m.id}
                        onClick={()=>setSelectedId(m.id)}
                        style={{ padding:'8px 10px',borderRadius:10,cursor:'pointer',
                          marginBottom:5,background:'rgba(255,255,255,0.03)',
                          border:`1px solid ${m.id===selectedId?'rgba(201,168,76,0.3)':'rgba(255,255,255,0.05)'}`,
                          transition:'all 0.15s ease' }}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
                        <div style={{ fontFamily:'var(--font-body)',fontSize:11,
                          color:'var(--text-secondary)',fontWeight:600,
                          whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                          marginBottom:2 }}>{m.subject}</div>
                        <div style={{ fontFamily:'var(--font-mono)',fontSize:8,
                          color:'var(--text-muted)' }}>{formatDate(m.sentAt,'relative')}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </GlassBox>
      </div>

      {/* ── Compose drawer ─────────────────────────────── */}
      <ComposeDrawer open={composeOpen} members={members} myId={myId}
        replyTo={replyTo}
        onClose={()=>{ setCompose(false); setReplyTo(null); }}
        onSend={handleSend}/>
    </div>
  );
}
