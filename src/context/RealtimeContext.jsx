/**
 * INHERITANCE CHOIR — Real-Time Context (WebSocket)
 * Provides live updates: notifications, presence, attendance, messages.
 * Falls back gracefully when WS is unavailable (dev mode uses polling).
 */
import React, {
  createContext, useContext, useEffect, useRef,
  useState, useCallback, useMemo,
} from 'react';
import { useAuth } from './AuthContext';

const RealtimeContext = createContext(null);

// WS message types
export const WS_EVENTS = {
  // Server → Client
  NOTIFICATION:      'notification',
  MEMBER_ONLINE:     'member:online',
  MEMBER_OFFLINE:    'member:offline',
  ATTENDANCE_MARKED: 'attendance:marked',
  MESSAGE_NEW:       'message:new',
  MESSAGE_REACTION:  'message:reaction',
  CONTRIBUTION_NEW:  'contribution:new',
  EVENT_UPDATED:     'event:updated',
  MEMBER_APPROVED:   'member:approved',
  SYSTEM:            'system',
  // Client → Server
  PING:              'ping',
  JOIN_ROOM:         'join:room',
  LEAVE_ROOM:        'leave:room',
  MARK_READ:         'notification:read',
};

const WS_URL = process.env.REACT_APP_WS_URL
  || 'ws://localhost:8080/ws';

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // exponential backoff

export function RealtimeProvider({ children }) {
  const { session } = useAuth();
  const wsRef       = useRef(null);
  const retryRef    = useRef(0);
  const retryTimer  = useRef(null);

  const [connected,     setConnected]     = useState(false);
  const [onlineMembers, setOnlineMembers] = useState(new Set());
  const [liveAttendance, setLiveAttendance] = useState({}); // eventId → [{memberId, status}]
  const [unreadCount,   setUnreadCount]   = useState(0);

  // Event subscribers registry: Map<eventType, Set<callback>>
  const listenersRef = useRef(new Map());

  // ── Subscribe / unsubscribe ────────────────────────────────
  const on = useCallback((eventType, cb) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType).add(cb);
    return () => listenersRef.current.get(eventType)?.delete(cb);
  }, []);

  const emit = useCallback((eventType, data) => {
    listenersRef.current.get(eventType)?.forEach(cb => {
      try { cb(data); } catch (e) { console.warn('Realtime listener error:', e); }
    });
    // Also fire wildcard listeners
    listenersRef.current.get('*')?.forEach(cb => {
      try { cb({ type: eventType, data }); } catch (e) {}
    });
  }, []);

  // ── Send to server ─────────────────────────────────────────
  const send = useCallback((type, payload = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload, ts: Date.now() }));
    }
  }, []);

  // ── Message handler ────────────────────────────────────────
  const handleMessage = useCallback((raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const { type, data } = msg;

    switch (type) {
      case WS_EVENTS.MEMBER_ONLINE:
        setOnlineMembers(prev => new Set([...prev, data.memberId]));
        break;
      case WS_EVENTS.MEMBER_OFFLINE:
        setOnlineMembers(prev => { const s = new Set(prev); s.delete(data.memberId); return s; });
        break;
      case WS_EVENTS.ATTENDANCE_MARKED:
        setLiveAttendance(prev => ({
          ...prev,
          [data.eventId]: [
            ...(prev[data.eventId] || []).filter(r => r.memberId !== data.memberId),
            { memberId: data.memberId, status: data.status, markedAt: data.markedAt },
          ],
        }));
        break;
      case WS_EVENTS.NOTIFICATION:
        setUnreadCount(n => n + 1);
        break;
      default:
        break;
    }
    emit(type, data);
  }, [emit]);

  // ── Connect / reconnect ────────────────────────────────────
  const connect = useCallback(() => {
    const memberId = session?.id || session?.userId;
    if (!memberId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const token = session.token || localStorage.getItem('choir_access_token') || '';
      const url = `${WS_URL}?token=${encodeURIComponent(token)}&memberId=${encodeURIComponent(memberId)}`;
      const ws  = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        retryRef.current = 0;
        send(WS_EVENTS.JOIN_ROOM, { room: 'global' });
      };

      ws.onmessage = (e) => handleMessage(e.data);

      ws.onclose = (e) => {
        setConnected(false);
        if (e.code !== 1000) scheduleReconnect(); // abnormal close
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WS not available — use polling fallback
      scheduleReconnect();
    }
  }, [session, send, handleMessage]);

  const scheduleReconnect = useCallback(() => {
    const delay = RECONNECT_DELAYS[Math.min(retryRef.current, RECONNECT_DELAYS.length - 1)];
    retryRef.current++;
    retryTimer.current = setTimeout(connect, delay);
  }, [connect]);

  // ── Dev mode polling fallback ──────────────────────────────
  // When WS is unavailable, poll for notifications every 30s
  useEffect(() => {
    if (connected || !session) return;
    const poll = setInterval(() => {
      emit(WS_EVENTS.SYSTEM, { message: 'polling_fallback' });
    }, 30_000);
    return () => clearInterval(poll);
  }, [connected, session, emit]);

  // ── Heartbeat ─────────────────────────────────────────────
  useEffect(() => {
    if (!connected) return;
    const ping = setInterval(() => send(WS_EVENTS.PING), 25_000);
    return () => clearInterval(ping);
  }, [connected, send]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryTimer.current);
      wsRef.current?.close(1000, 'component unmount');
    };
  }, [connect]);

  const value = useMemo(() => ({
    connected,
    onlineMembers,
    liveAttendance,
    unreadCount,
    setUnreadCount,
    on,
    send,
    isOnline: (memberId) => onlineMembers.has(memberId),
    getEventAttendance: (eventId) => liveAttendance[eventId] || [],
  }), [connected, onlineMembers, liveAttendance, unreadCount, on, send]);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}

// ── Convenience hook: subscribe to a specific WS event ────────
export function useRealtimeEvent(eventType, callback, deps = []) {
  const { on } = useRealtime();
  useEffect(() => {
    const unsub = on(eventType, callback);
    return unsub;
  }, [eventType, ...deps]);
}
