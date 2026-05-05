/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — API Configuration
   
   When you're ready to connect a real backend:
   1. Set REACT_APP_API_URL in your .env file
   2. The service layer (src/services/) will automatically use it
   3. No component changes needed — only services change.
   ═══════════════════════════════════════════════════════════════════ */

const API_CONFIG = {
  /** Base URL for the backend REST API.
   *  Defaults to the deployed Replit backend.
   *  Set REACT_APP_API_URL in .env for production.
   */
  BASE_URL: process.env.REACT_APP_API_URL || 'https://inheritance-backend--irumvafils3.replit.app/api/v1',

  /** Request timeout in milliseconds */
  TIMEOUT: 10000,

  /** Whether to use localStorage (true) or real API (false) */
  USE_LOCAL_STORAGE: process.env.REACT_APP_USE_LOCAL_STORAGE !== 'false',

  /** In development, keep the app usable if the local Go backend is down */
  FALLBACK_TO_LOCAL: process.env.REACT_APP_API_FALLBACK_TO_LOCAL !== 'false',

  /** Default headers sent with every API request */
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export default API_CONFIG;

/* ── API Endpoint Paths ─────────────────────────────────────────
   Pre-defined for easy backend connection later.
   ──────────────────────────────────────────────────────────────── */
export const API_ENDPOINTS = {
  // Auth
  LOGIN:              '/api/auth/login',
  LOGOUT:             '/api/auth/logout',
  REGISTER:           '/api/auth/register',
  VERIFY_OTP:         '/api/auth/verify-otp',
  RESEND_OTP:         '/api/auth/resend-otp',
  FORGOT_PASSWORD:    '/api/auth/forgot-password',
  VERIFY_RESET_OTP:   '/api/auth/verify-reset-otp',
  RESET_PASSWORD:     '/api/auth/reset-password',
  ME:                 '/api/auth/me',

  // Members
  MEMBERS:            '/api/members',
  MEMBER:             (id) => `/api/members/${id}`,
  MEMBER_QR:          (id) => `/api/members/${id}/qr`,
  MEMBERS_IMPORT:     '/api/members/import',
  MEMBERS_EXPORT:     '/api/members/export',

  // Events
  EVENTS:             '/api/events',
  EVENT:              (id) => `/api/events/${id}`,
  EVENT_ATTENDANCE:   (id) => `/api/events/${id}/attendance`,

  // Attendance
  ATTENDANCE:         '/api/attendance',
  ATTENDANCE_STATS:   '/api/attendance/stats',
  ATTENDANCE_EXPORT:  '/api/attendance/export',
  EXCUSE_REQUESTS:    '/api/excuse-requests',
  EXCUSE_REQUEST:     (id) => `/api/excuse-requests/${id}`,

  // Contributions
  CONTRIBUTIONS:      '/api/contributions',
  CONTRIBUTION:       (id) => `/api/contributions/${id}`,
  CONTRIBUTION_STATS: '/api/contributions/stats',
  CONTRIBUTION_RECEIPT: (id) => `/api/contributions/${id}/receipt`,

  // Messages
  MESSAGES:           '/api/messages',
  MESSAGE:            (id) => `/api/messages/${id}`,

  // Posts
  POSTS:              '/api/posts',
  POST:               (id) => `/api/posts/${id}`,

  // Songs
  SONGS:              '/api/songs',
  SONG:               (id) => `/api/songs/${id}`,

  // Reports
  REPORT_ATTENDANCE:  '/api/reports/attendance',
  REPORT_FINANCIAL:   '/api/reports/contributions',
  REPORT_MEMBERS:     '/api/reports/members',

  // Settings
  SETTINGS:           '/api/settings',
};
