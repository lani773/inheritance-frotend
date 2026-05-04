/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Real-Time Chat Page (MVP)
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { chatAPI } from '../../services/api/endpoints';
import { PageHeader, Input, Button, LoadingSpinner } from '../../components/shared';
import { formatDate, formatTime } from '../../utils';

export default function ChatPage() {
  const { session, socket } = useAuth();
  const { error: toastErr } = useToast();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await chatAPI.messages(); // Assuming this fetches all messages for a default channel
      setMessages(response.data || []);
    } catch (err) {
      toastErr('Failed to load messages.');
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [toastErr]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Scroll to the bottom of the chat when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload) => {
      if (payload.type === 'CHAT_MESSAGE_ADDED') {
        setMessages((prevMessages) => [...prevMessages, payload.data]);
      }
    };

    socket.on('entity_change', handleNewMessage);

    return () => {
      socket.off('entity_change', handleNewMessage);
    };
  }, [socket]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const messagePayload = {
        content: newMessage,
        // Assuming the backend infers senderId/senderName from the auth token
        // or we might need to pass session.userId/session.name
        // For now, let's assume the backend handles sender info.
      };
      const sentMessage = await chatAPI.send(messagePayload);
      // The WebSocket will push this message to all clients, including this one.
      // So we don't directly add it to state here to avoid duplicates.
      setNewMessage('');
    } catch (err) {
      toastErr('Failed to send message.');
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <LoadingSpinner size={40} color="var(--gold)" />
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeUp 0.35s ease both', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <PageHeader title="Choir Chat" subtitle="Connect with your fellow choir members in real-time" icon="💬" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || index}
              style={{
                display: 'flex',
                justifyContent: msg.senderId === session?.userId ? 'flex-end' : 'flex-start',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '10px 15px',
                  borderRadius: '15px',
                  background: msg.senderId === session?.userId ? 'var(--color-info)' : 'var(--bg-raised)',
                  color: msg.senderId === session?.userId ? 'white' : 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: msg.senderId === session?.userId ? 'rgba(255,255,255,0.8)' : 'var(--gold)' }}>
                  {msg.senderName || 'Unknown'}
                </div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>{msg.content}</p>
                <div style={{ fontSize: '10px', color: msg.senderId === session?.userId ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', textAlign: 'right', marginTop: '5px' }}>
                  {formatDate(msg.timestamp)} {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', padding: '10px 0' }}>
        <Input
          value={newMessage}
          onChange={setNewMessage}
          placeholder="Type your message..."
          multiline
          rows={1}
          style={{ flex: 1, maxHeight: '100px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
        />
        <Button type="submit" variant="primary" loading={sending} icon="🚀">
          Send
        </Button>
      </form>
    </div>
  );
}