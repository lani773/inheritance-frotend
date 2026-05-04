/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Route Paths
   Single source of truth for all URL paths.
   ═══════════════════════════════════════════════════════════════════ */

export const ROUTES = {
  // ── Public / Auth ───────────────────────────────────────────
  LOGIN:           '/login',
  REGISTER:        '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // ── Dashboard Root ─────────────────────────────────────────
  DASHBOARD:       '/dashboard',

  // ── Core Modules ───────────────────────────────────────────
  MEMBERS:         '/dashboard/members',
  MEMBER_PROFILE:  '/dashboard/members/:id',
  ATTENDANCE:      '/dashboard/attendance',
  EVENTS:          '/dashboard/events',
  CONTRIBUTIONS:   '/dashboard/contributions',
  MESSAGES:        '/dashboard/messages',
  POSTS:           '/dashboard/posts',
  WELFARE:         '/dashboard/welfare',
  PRAYER:          '/dashboard/prayer',
  SONGS:           '/dashboard/songs',

  // ── Admin Section ───────────────────────────────────────────
  REPORTS:         '/dashboard/reports',
  ADMIN:           '/dashboard/admin',
  SETTINGS:        '/dashboard/settings',
  PROFILE:         '/dashboard/profile',
  TEAM:            '/dashboard/team',
  AUTOMATION:      '/dashboard/automation',
  ANALYTICS:       '/dashboard/analytics',

  // ── Helpers ─────────────────────────────────────────────────
  /** Build member profile URL with ID */
  memberProfile: (id) => `/dashboard/members/${id}`,
};
