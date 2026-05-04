/**
 * INHERITANCE CHOIR — useRealtimeSync Hook
 *
 * Subscribes to WebSocket events and automatically:
 * 1. Invalidates API caches so stale data is discarded
 * 2. Calls optional onUpdate callbacks so components can refresh state
 * 3. Shows toast notifications for relevant entity changes
 *
 * Usage:
 *   useRealtimeSync(['member:created', 'member:updated'], () => fetchMembers());
 */
import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api/client';

// Maps WS event types → the API cache path(s) to invalidate
const EVENT_CACHE_MAP = {
  // Members
  'member:created':  ['/members'],
  'member:updated':  ['/members'],
  'member:deleted':  ['/members'],
  'member:approved': ['/members', '/admin/registrations'],

  // Contributions
  'contribution:created':  ['/contributions', '/analytics/dashboard'],
  'contribution:verified': ['/contributions', '/analytics/dashboard'],
  'contribution:deleted':  ['/contributions', '/analytics/dashboard'],

  // Events
  'event:created': ['/events'],
  'event:updated': ['/events'],
  'event:deleted': ['/events'],

  // Attendance
  'attendance:marked':  ['/attendance', '/analytics/attendance'],
  'excuse:submitted':   ['/attendance/excuses'],
  'excuse:reviewed':    ['/attendance/excuses'],

  // Posts
  'post:created': ['/posts'],
  'post:liked':   ['/posts'],
  'post:comment': ['/posts'],

  // Songs / Setlists
  'song:created':    ['/songs'],
  'setlist:updated': ['/setlists'],
  'setlist:deleted': ['/setlists'],

  // Finance
  'budget:updated':        ['/budgets'],
  'pledge:new':            ['/pledges'],
  'pledge:campaign:new':   ['/pledges/campaigns'],

  // Welfare
  'welfare:created': ['/welfare'],
  'welfare:updated': ['/welfare'],

  // Prayer
  'prayer:new':    ['/prayer'],
  'prayer:prayed': ['/prayer'],

  // Notifications
  'notification:new': ['/notifications'],

  // Admin
  'admin:broadcast': [],
};

/**
 * useRealtimeSync — subscribe to one or more WS event types.
 *
 * @param {string|string[]} events - Event type(s) to listen for
 * @param {Function} [onUpdate]    - Called with (eventType, data) when any event fires
 * @param {object}   [options]
 * @param {boolean}  [options.invalidateCache=true]  - Auto-invalidate matching cache paths
 * @param {boolean}  [options.logEvents=false]        - Console-log events (dev only)
 */
export function useRealtimeSync(events, onUpdate, options = {}) {
  const { onWsEvent } = useAuth();
  const { invalidateCache = true, logEvents = false } = options;

  const eventTypes = Array.isArray(events) ? events : [events];

  const handleEvent = useCallback((eventType) => (data) => {
    if (logEvents || process.env.NODE_ENV === 'development') {
      console.debug(`[RT] ${eventType}`, data);
    }

    // Auto-invalidate API caches
    if (invalidateCache) {
      const paths = EVENT_CACHE_MAP[eventType] || [];
      paths.forEach(path => api.invalidateCache(path));
    }

    // Call the component's update handler
    if (typeof onUpdate === 'function') {
      onUpdate(eventType, data);
    }
  }, [onUpdate, invalidateCache, logEvents]);

  useEffect(() => {
    const unsubs = eventTypes.map(type => onWsEvent(type, handleEvent(type)));
    return () => unsubs.forEach(unsub => unsub?.());
  }, [eventTypes.join(','), onWsEvent, handleEvent]); // eslint-disable-line
}

/**
 * useRealtimePage — convenience hook that invalidates caches on any event
 * relevant to a given resource, and calls refresh().
 *
 * @param {string}   resource   - Resource name: 'members' | 'events' | 'contributions' | etc.
 * @param {Function} refresh    - Callback to reload data
 */
export function useRealtimePage(resource, refresh) {
  // Find all event types that affect this resource
  const relevantEvents = Object.entries(EVENT_CACHE_MAP)
    .filter(([, paths]) => paths.some(p => p.includes(`/${resource}`)))
    .map(([type]) => type);

  useRealtimeSync(relevantEvents, refresh);
}

export default useRealtimeSync;
