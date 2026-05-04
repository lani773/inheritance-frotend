/**
 * INHERITANCE CHOIR — Enhanced Features Hooks
 * Convenience hooks that wire up all Task 1-3 features.
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth }          from '../context/AuthContext';
import { usePermissions }   from '../context/PermissionsContext';
import { useRealtime, useRealtimeEvent, WS_EVENTS } from '../context/RealtimeContext';
import { useNotifications } from '../context/NotificationsContext';
import { usePWA }           from '../components/pwa/PWAManager';
import { offlineCache }     from '../components/pwa/PWAManager';

// ── Combined feature flags ─────────────────────────────────────
export function useFeatureFlags() {
  const { can, isAdmin, role } = usePermissions();
  const { isOffline }          = usePWA();

  return {
    // Feature access
    canViewAnalytics:      can('analytics:read'),
    canGenerateReports:    can('reports:generate'),
    canVerifyContribs:     can('contributions:verify'),
    canMarkAttendance:     can('attendance:mark'),
    canManageMembers:      can('members:create'),
    canBroadcast:          can('messages:send') && isAdmin,
    canManageEvents:       can('events:create'),
    canViewWelfare:        can('welfare:read'),
    canManageSettings:     can('settings:update'),

    // State flags
    isOffline,
    isAdmin,
    role,

    // New feature flags
    hasChat:               true,
    hasQRScanner:          can('attendance:mark'),
    hasPredictiveAI:       can('analytics:read') || isAdmin,
    hasLeaderboard:        true,
    hasReportBuilder:      can('reports:generate') || isAdmin,
    hasPledgeCampaigns:    true,
    hasReceiptGenerator:   can('contributions:read'),
    hasBroadcastScheduler: isAdmin,
    hasBudgetPlanner:      can('contributions:read') || isAdmin,
    hasSelfService:        true,
  };
}

// ── Offline-aware data fetcher ─────────────────────────────────
export function useOfflineData(key, fetcher, maxAgeMs = 5 * 60 * 1000) {
  const { isOffline } = usePWA();
  const [data,    setData]    = useState(() => offlineCache.get(key, maxAgeMs));
  const [loading, setLoading] = useState(!data);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    if (isOffline) {
      const cached = offlineCache.get(key, Infinity);
      if (cached) setData(cached);
      return;
    }
    try {
      setLoading(true);
      const result = await fetcher();
      setData(result);
      offlineCache.set(key, result);
    } catch (e) {
      setError(e.message);
      const cached = offlineCache.get(key, Infinity);
      if (cached) setData(cached);
    } finally {
      setLoading(false);
    }
  }, [isOffline, key, fetcher]);

  useEffect(() => { refresh(); }, []);

  return { data, loading, error, refresh, isStale: isOffline && !!data };
}

// ── Live unread counts ─────────────────────────────────────────
export function useLiveUnreadCounts() {
  const { unreadCount } = useNotifications();
  const [msgUnread, setMsgUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  useRealtimeEvent(WS_EVENTS.MESSAGE_NEW, () => {
    setMsgUnread(c => c + 1);
  }, []);

  useRealtimeEvent('chat:message', (data) => {
    const { session } = useAuth();
    if (data?.message?.senderId !== session?.id) {
      setChatUnread(c => c + 1);
    }
  }, []);

  return {
    notifications: unreadCount,
    messages:      msgUnread,
    chat:          chatUnread,
    total:         unreadCount + msgUnread + chatUnread,
    clearMessages: () => setMsgUnread(0),
    clearChat:     () => setChatUnread(0),
  };
}

// ── Member performance score ───────────────────────────────────
export function useMemberScore(member) {
  return {
    attendance:    member?.attendance  || 0,
    contributions: Math.min(100, ((member?.contributionTotal || 0) / 1000) * 10),
    engagement:    72, // would come from activity tracking
    overall: Math.round(
      (member?.attendance || 0) * 0.45 +
      Math.min(100, ((member?.contributionTotal || 0) / 1000) * 10) * 0.35 +
      72 * 0.2
    ),
    grade: (() => {
      const s = Math.round(
        (member?.attendance || 0) * 0.45 +
        Math.min(100, ((member?.contributionTotal || 0) / 1000) * 10) * 0.35 +
        72 * 0.2
      );
      return s >= 90 ? 'A+' : s >= 80 ? 'A' : s >= 70 ? 'B' : s >= 60 ? 'C' : 'D';
    })(),
  };
}

// ── Quick action dispatcher ────────────────────────────────────
export function useQuickActions() {
  const { toast } = useNotifications();
  const { can }   = usePermissions();

  return {
    markAttendance: (eventId) => {
      if (!can('attendance:mark')) return toast('No permission', { type: 'error' });
      return `/dashboard/attendance?event=${eventId}`;
    },
    recordContribution: () => `/dashboard/contributions?new=1`,
    sendBroadcast: () => `/dashboard/messages?broadcast=1`,
    viewLeaderboard: () => `/dashboard/intelligence?tab=leaderboard`,
    viewForecast: () => `/dashboard/intelligence?tab=analytics`,
  };
}

// ── Session health ─────────────────────────────────────────────
export function useSessionHealth() {
  const { session } = useAuth();
  const [healthy, setHealthy] = useState(true);
  const [expiresIn, setExpiresIn] = useState(null); // seconds

  useEffect(() => {
    if (!session?.loginTime) return;
    const check = () => {
      const elapsed = (Date.now() - new Date(session.loginTime).getTime()) / 1000;
      const max     = (session.rememberMe ? 30 * 24 : 24) * 3600;
      const left    = max - elapsed;
      setExpiresIn(Math.max(0, Math.floor(left)));
      setHealthy(left > 300); // healthy if > 5 minutes left
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [session]);

  return { healthy, expiresIn };
}

// ── Toast shortcuts ────────────────────────────────────────────
export function useToastShortcuts() {
  const { toast } = useNotifications();
  return {
    success: (msg, action) => toast(msg, { type: 'success', action }),
    error:   (msg)         => toast(msg, { type: 'error',   duration: 6000 }),
    info:    (msg)         => toast(msg, { type: 'info' }),
    warning: (msg)         => toast(msg, { type: 'warning', duration: 5000 }),
  };
}
