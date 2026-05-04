/**
 * INHERITANCE CHOIR — Real-Time Chat Page
 *
 * Features:
 * - Messages delivered instantly over WebSocket (no polling)
 * - Channels: general, soprano, alto, tenor, bass, admin
 * - Typing indicators
 * - Message reactions
 * - Unread badge per channel
 * - Message history loaded from REST on channel switch
 * - Auto-scroll to bottom on new messages
 * - Optimistic send (message appears before server confirmation)
 */
import React, {
  useState, useEffect, useRef, useCallback, useMemo
} from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api/endpoints';
import {
  LoadingSpinner, Avatar, Button, Input
} from '../../components/shared';

// ── Channel config ─────────────────────────────────────────────
const ALL_CHANNELS = [
  { id: 'general',  label: '🌐 General',  adminOnly: false },
  { id: 'soprano',  label: '🎵 Soprano',  adminOnly: false },
  { id: 'alto',     label: '🎶 Alto',     adminOnly: false },
  { id: 'tenor',    label: '🎤 Tenor',    adminOnly: false },
  { id: 'bass',     label: '🎸 Bass',     adminOnly: false },
  { id: 'admin',    label: '🔐 Admin',    adminOnly: true  },
  { id: 'finance',  label: '💰 Finance',  adminOnly: true  },
];

const formatMsgTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const REACTIONS = ['👍','❤️','😂','🙏','🎵','🔥'];

// ── Component ──────────────────────────────────────────────────
export default function ChatPage() {
  const { session, onWsEvent, wsSend, wsConnected, onlineMembers } = useAuth();

  const [activeChannel, setActiveChannel] = useState('general');
  const [messagesByChannel, setMessagesByChannel] = useState({});
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [typingUsers, setTypingUsers]     = useState([]);
  const [unread, setUnread]               = useState({});
  const [sending, setSending]             = useState(false);

  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const typingTimer  = useRef(null);
  const isTypingRef  = useRef(false);

  // Only show channels the user has access to
  const channels = useMemo(() =>
    ALL_CHANNELS.filter(ch => !ch.adminOnly || session?.isAdmin),
    [session?.isAdmin]
  );

  const messages = messagesByChannel[activeChannel] || [];

  // ── Load history when channel changes ─────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      if (messagesByChannel[activeChannel]) return; // already loaded
      setLoading(true);
      try {
        const res = await chatAPI.messages(activeChannel);
        if (!cancelled) {
          const msgs = (res?.data || res || []).slice().reverse(); // oldest first
          setMessagesByChannel(prev => ({ ...prev, [activeChannel]: msgs }));
        }
      } catch (e) {
        console.error('Failed to load chat history', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadHistory();
    // Clear unread for this channel
    setUnread(prev => ({ ...prev, [activeChannel]: 0 }));
    return () => { cancelled = true; };
  }, [activeChannel]); // eslint-disable-line

  // ── Scroll to bottom ──────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChannel]);

  // ── WebSocket: incoming chat messages ─────────────────────
  useEffect(() => {
    const unsub = onWsEvent('chat:message', (data) => {
      const ch = data.channelId || data.channel || 'general';
      const msg = {
        id:         data.id || `ws_${Date.now()}`,
        channelId:  ch,
        senderId:   data.senderId,
        senderName: data.senderName || 'Member',
        text:       data.text,
        createdAt:  data.createdAt || new Date().toISOString(),
        reactions:  data.reactions || {},
        readBy:     data.readBy || [],
      };
      setMessagesByChannel(prev => {
        const existing = prev[ch] || [];
        // Deduplicate optimistic messages
        const withoutOptimistic = existing.filter(m => m.id !== `opt_${msg.text}`);
        return { ...prev, [ch]: [...withoutOptimistic, msg] };
      });
      // Increment unread if not the active channel
      if (ch !== activeChannel) {
        setUnread(prev => ({ ...prev, [ch]: (prev[ch] || 0) + 1 }));
      }
    });
    return unsub;
  }, [onWsEvent, activeChannel]);

  // ── WebSocket: typing indicators ──────────────────────────
  useEffect(() => {
    const unsub = onWsEvent('chat:typing', (data) => {
      if (data.channelId !== activeChannel) return;
      if (data.memberId === session?.id) return;
      if (data.isTyping) {
        setTypingUsers(prev => [...new Set([...prev, data.senderName || data.memberId])]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== (data.senderName || data.memberId)));
        }, 3000);
      } else {
        setTypingUsers(prev => prev.filter(u => u !== (data.senderName || data.memberId)));
      }
    });
    return unsub;
  }, [onWsEvent, activeChannel, session?.id]);

  // ── Send typing indicator ──────────────────────────────────
  const sendTyping = useCallback((isTyping) => {
    wsSend('chat:typing', { channel: activeChannel, isTyping });
  }, [wsSend, activeChannel]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(false);
    }, 2000);
  };

  // ── Send message ───────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    sendTyping(false);

    // Optimistic message
    const optimistic = {
      id:         `opt_${text}`,
      channelId:  activeChannel,
      senderId:   session?.id,
      senderName: session?.fullName || 'Me',
      text,
      createdAt:  new Date().toISOString(),
      reactions:  {},
      readBy:     [session?.id],
      pending:    true,
    };
    setMessagesByChannel(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), optimistic],
    }));

    // Try WebSocket first (bi-directional)
    const sent = wsSend('chat:message', { channelId: activeChannel, text });

    if (!sent) {
      // Fallback to REST
      try {
        const res = await chatAPI.send({ channelId: activeChannel, text });
        const confirmed = res?.data || res;
        setMessagesByChannel(prev => {
          const msgs = (prev[activeChannel] || []).map(m =>
            m.id === optimistic.id ? { ...confirmed, pending: false } : m
          );
          return { ...prev, [activeChannel]: msgs };
        });
      } catch (e) {
        console.error('Failed to send message', e);
        // Remove failed optimistic message
        setMessagesByChannel(prev => ({
          ...prev,
          [activeChannel]: (prev[activeChannel] || []).filter(m => m.id !== optimistic.id),
        }));
      }
    }
    setSending(false);
    inputRef.current?.focus();
  }, [input, sending, activeChannel, session, wsSend, sendTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="chat-page">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar__header">
          <h3>Channels</h3>
          <span className={`ws-badge ${wsConnected ? 'ws-badge--online' : 'ws-badge--offline'}`}>
            {wsConnected ? '● Live' : '○ Offline'}
          </span>
        </div>
        <ul className="chat-channels">
          {channels.map(ch => (
            <li key={ch.id}
                className={`chat-channel ${activeChannel === ch.id ? 'chat-channel--active' : ''}`}
                onClick={() => setActiveChannel(ch.id)}>
              <span className="chat-channel__label">{ch.label}</span>
              {unread[ch.id] > 0 && (
                <span className="chat-channel__badge">{unread[ch.id]}</span>
              )}
            </li>
          ))}
        </ul>
        <div className="chat-sidebar__presence">
          <p className="chat-presence__title">Online · {onlineMembers.length}</p>
          <div className="chat-presence__dots">
            {onlineMembers.slice(0, 8).map(id => (
              <span key={id} className="chat-presence__dot" title={id} />
            ))}
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="chat-main">
        <div className="chat-header">
          <h2 className="chat-header__title">
            {channels.find(c => c.id === activeChannel)?.label || activeChannel}
          </h2>
          <span className="chat-header__meta">
            {messages.length} messages
          </span>
        </div>

        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading"><LoadingSpinner /></div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <p>🎵 No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.senderId === session?.id;
              const prevMsg = messages[i - 1];
              const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
              return (
                <div key={msg.id}
                     className={`chat-msg ${isMe ? 'chat-msg--me' : 'chat-msg--other'} ${msg.pending ? 'chat-msg--pending' : ''}`}>
                  {showAvatar && !isMe && (
                    <Avatar name={msg.senderName} size="sm" className="chat-msg__avatar" />
                  )}
                  <div className="chat-msg__body">
                    {showAvatar && !isMe && (
                      <span className="chat-msg__name">{msg.senderName}</span>
                    )}
                    <div className="chat-msg__bubble">
                      <span className="chat-msg__text">{msg.text}</span>
                      <span className="chat-msg__time">{formatMsgTime(msg.createdAt)}</span>
                      {msg.pending && <span className="chat-msg__pending-icon">⏳</span>}
                    </div>
                    {Object.keys(msg.reactions || {}).length > 0 && (
                      <div className="chat-msg__reactions">
                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                          <span key={emoji} className="reaction-chip">
                            {emoji} {users.length}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {typingUsers.length > 0 && (
            <div className="chat-typing">
              <span className="chat-typing__dots">
                <span/><span/><span/>
              </span>
              <span className="chat-typing__text">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
              </span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-composer">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${channels.find(c => c.id === activeChannel)?.label || activeChannel}…`}
            className="chat-composer__input"
            multiline
            maxRows={4}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            loading={sending}
            className="chat-composer__send"
            variant="primary"
            id="chat-send-btn"
          >
            Send
          </Button>
        </div>
      </main>

      <style>{`
        .chat-page {
          display: flex;
          height: calc(100vh - 64px);
          background: #0F172A;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #1E2D4A;
        }
        .chat-sidebar {
          width: 220px;
          min-width: 180px;
          background: #0A1628;
          border-right: 1px solid #1E2D4A;
          display: flex;
          flex-direction: column;
          padding: 0;
        }
        .chat-sidebar__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #1E2D4A;
        }
        .chat-sidebar__header h3 { margin: 0; font-size: 14px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em; }
        .ws-badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
        .ws-badge--online  { background: #052e16; color: #4ade80; }
        .ws-badge--offline { background: #2d1515; color: #f87171; }
        .chat-channels { list-style: none; margin: 0; padding: 8px 0; flex: 1; overflow-y: auto; }
        .chat-channel {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px; cursor: pointer; border-radius: 0;
          transition: background 0.15s; color: #94A3B8; font-size: 14px;
        }
        .chat-channel:hover { background: #1E2D4A; color: #E2E8F0; }
        .chat-channel--active { background: #1E2D4A; color: #C9A84C; font-weight: 600; border-left: 3px solid #C9A84C; }
        .chat-channel__badge {
          background: #C9A84C; color: #0A1628; border-radius: 999px;
          font-size: 11px; font-weight: 700; padding: 1px 7px; min-width: 20px; text-align: center;
        }
        .chat-sidebar__presence { padding: 16px; border-top: 1px solid #1E2D4A; }
        .chat-presence__title { font-size: 11px; color: #475569; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.08em; }
        .chat-presence__dots { display: flex; gap: 4px; flex-wrap: wrap; }
        .chat-presence__dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; display: inline-block; }
        .chat-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .chat-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid #1E2D4A; background: #0F172A;
        }
        .chat-header__title { margin: 0; font-size: 18px; color: #F0F4FF; font-weight: 600; }
        .chat-header__meta { font-size: 12px; color: #475569; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 4px; }
        .chat-loading, .chat-empty { display: flex; justify-content: center; align-items: center; flex: 1; color: #475569; }
        .chat-msg { display: flex; gap: 8px; margin-bottom: 2px; }
        .chat-msg--me { flex-direction: row-reverse; }
        .chat-msg__avatar { flex-shrink: 0; margin-top: 2px; }
        .chat-msg__body { display: flex; flex-direction: column; max-width: 70%; }
        .chat-msg--me .chat-msg__body { align-items: flex-end; }
        .chat-msg__name { font-size: 11px; color: #64748B; margin-bottom: 2px; padding: 0 4px; }
        .chat-msg__bubble {
          display: inline-flex; align-items: flex-end; gap: 6px;
          background: #1E2D4A; border-radius: 12px; padding: 8px 12px;
          max-width: 100%;
        }
        .chat-msg--me .chat-msg__bubble { background: linear-gradient(135deg, #92681f, #C9A84C); }
        .chat-msg__text { font-size: 14px; color: #E2E8F0; line-height: 1.5; word-break: break-word; white-space: pre-wrap; }
        .chat-msg--me .chat-msg__text { color: #0A1628; }
        .chat-msg__time { font-size: 10px; color: #64748B; white-space: nowrap; flex-shrink: 0; }
        .chat-msg--me .chat-msg__time { color: rgba(10,22,40,0.6); }
        .chat-msg--pending { opacity: 0.6; }
        .chat-msg__pending-icon { font-size: 10px; }
        .chat-msg__reactions { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }
        .reaction-chip {
          background: #1E2D4A; border: 1px solid #2D3F5A; border-radius: 999px;
          padding: 1px 8px; font-size: 12px; cursor: pointer;
          transition: background 0.15s;
        }
        .reaction-chip:hover { background: #2D3F5A; }
        .chat-typing { display: flex; align-items: center; gap: 8px; padding: 4px 0; color: #64748B; font-size: 13px; font-style: italic; }
        .chat-typing__dots { display: flex; gap: 3px; }
        .chat-typing__dots span {
          width: 5px; height: 5px; background: #64748B; border-radius: 50%;
          animation: typing-bounce 1.4s infinite ease-in-out;
        }
        .chat-typing__dots span:nth-child(1) { animation-delay: 0s; }
        .chat-typing__dots span:nth-child(2) { animation-delay: 0.2s; }
        .chat-typing__dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .chat-composer {
          display: flex; align-items: flex-end; gap: 10px;
          padding: 12px 20px; border-top: 1px solid #1E2D4A; background: #0F172A;
        }
        .chat-composer__input { flex: 1; }
        .chat-composer__send { white-space: nowrap; flex-shrink: 0; }
        @media (max-width: 640px) {
          .chat-sidebar { width: 60px; min-width: 60px; }
          .chat-channel__label { display: none; }
          .chat-sidebar__header h3, .ws-badge { display: none; }
        }
      `}</style>
    </div>
  );
}