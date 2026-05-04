/**
 * INHERITANCE CHOIR — API Endpoints
 * Typed functions for every API route. These call the Go Gin backend.
 * Falls back to mock data when REACT_APP_API_URL is not set.
 */
import api, { APIError } from './client';

const IS_MOCK = !process.env.REACT_APP_API_URL;

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password, rememberMe = false) =>
    api.post('/auth/login', { email, password, rememberMe }),

  register: (data) =>
    api.post('/auth/register', data),

  verifyOTP: (email, code, purpose = 'verify') =>
    api.post('/auth/verify-otp', { email, code, purpose }),

  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (email, code, newPassword) =>
    api.post('/auth/reset-password', { email, code, newPassword }),

  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),

  me: () =>
    api.get('/auth/me', { cache: { ttl: 5 * 60_000 } }),
};

// ── Members ───────────────────────────────────────────────────
export const membersAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/members${qs ? '?' + qs : ''}`, { cache: { ttl: 2 * 60_000 } });
  },

  stats: () =>
    api.get('/members/stats', { cache: { ttl: 5 * 60_000 } }),

  getById: (id) =>
    api.get(`/members/${id}`, { cache: { ttl: 2 * 60_000 } }),

  create: (data) => {
    api.invalidateCache('/members');
    return api.post('/members', data);
  },

  update: (id, data) => {
    api.invalidateCache(`/members/${id}`);
    api.invalidateCache('/members');
    return api.put(`/members/${id}`, data);
  },

  delete: (id) => {
    api.invalidateCache('/members');
    return api.delete(`/members/${id}`);
  },

  approve: (id) => {
    api.invalidateCache('/members');
    return api.post(`/members/${id}/approve`);
  },

  getQR: (id) =>
    api.get(`/members/${id}/qr`),

  export: (format = 'excel') =>
    api.get(`/members/export?format=${format}`, { cache: false }),
};

// ── Events ────────────────────────────────────────────────────
export const eventsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/events${qs ? '?' + qs : ''}`, { cache: { ttl: 60_000 } });
  },

  upcoming: () =>
    api.get('/events/upcoming', { cache: { ttl: 60_000 } }),

  calendar: (month) =>
    api.get(`/events/calendar?month=${month}`, { cache: { ttl: 2 * 60_000 } }),

  getById: (id) =>
    api.get(`/events/${id}`, { cache: { ttl: 60_000 } }),

  getAttendance: (id) =>
    api.get(`/events/${id}/attendance`),

  create: (data) => {
    api.invalidateCache('/events');
    return api.post('/events', data);
  },

  update: (id, data) => {
    api.invalidateCache(`/events/${id}`);
    api.invalidateCache('/events');
    return api.put(`/events/${id}`, data);
  },

  delete: (id) => {
    api.invalidateCache('/events');
    return api.delete(`/events/${id}`);
  },
};

// ── Contributions ─────────────────────────────────────────────
export const contributionsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/contributions${qs ? '?' + qs : ''}`, { cache: { ttl: 60_000 } });
  },

  stats: () =>
    api.get('/contributions/stats', { cache: { ttl: 5 * 60_000 } }),

  trend: () =>
    api.get('/contributions/trend', { cache: { ttl: 10 * 60_000 } }),

  create: (data) => {
    api.invalidateCache('/contributions');
    return api.post('/contributions', data);
  },

  update: (id, data) => {
    api.invalidateCache('/contributions');
    return api.put(`/contributions/${id}`, data);
  },

  delete: (id) => {
    api.invalidateCache('/contributions');
    return api.delete(`/contributions/${id}`);
  },

  verify: (id) => {
    api.invalidateCache('/contributions');
    return api.post(`/contributions/${id}/verify`);
  },

  bulkVerify: (ids) => {
    api.invalidateCache('/contributions');
    return api.post('/contributions/bulk-verify', { ids });
  },

  export: () =>
    api.get('/contributions/export', { cache: false }),
};

// ── Attendance ────────────────────────────────────────────────
export const attendanceAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/attendance${qs ? '?' + qs : ''}`, { cache: { ttl: 30_000 } });
  },

  stats: () =>
    api.get('/attendance/stats', { cache: { ttl: 5 * 60_000 } }),

  bulkMark: (eventId, records) =>
    api.post('/attendance/bulk', { eventId, records }),

  qrCheckin: (eventId, memberId) =>
    api.post('/attendance/qr-checkin', { eventId, memberId }),

  delete: (id) => api.delete(`/attendance/${id}`),

  listExcuses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/attendance/excuses${qs ? '?' + qs : ''}`);
  },

  submitExcuse: (eventId, reason) =>
    api.post('/attendance/excuses', { eventId, reason }),

  reviewExcuse: (id, status, reviewNote) =>
    api.put(`/attendance/excuses/${id}`, { status, reviewNote }),
};

// ── Analytics ─────────────────────────────────────────────────
export const analyticsAPI = {
  dashboard: () =>
    api.get('/analytics/dashboard', { cache: { ttl: 5 * 60_000 } }),

  contributions: () =>
    api.get('/analytics/contributions', { cache: { ttl: 10 * 60_000 } }),

  attendance: () =>
    api.get('/analytics/attendance', { cache: { ttl: 10 * 60_000 } }),

  members: () =>
    api.get('/analytics/members', { cache: { ttl: 10 * 60_000 } }),

  yoy: () =>
    api.get('/analytics/yoy', { cache: { ttl: 30 * 60_000 } }),

  auditLog: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/analytics/audit-log${qs ? '?' + qs : ''}`);
  },
};

// ── Messages ──────────────────────────────────────────────────
export const messagesAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/messages${qs ? '?' + qs : ''}`);
  },

  send: (data) =>
    api.post('/messages', data),

  getById: (id) =>
    api.get(`/messages/${id}`),

  react: (id, emoji) =>
    api.put(`/messages/${id}/react`, { emoji }),

  delete: (id) =>
    api.delete(`/messages/${id}`),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/notifications${qs ? '?' + qs : ''}`);
  },

  markRead: (id) =>
    api.post(`/notifications/${id}/read`),

  markAllRead: () =>
    api.post('/notifications/read-all'),

  delete: (id) =>
    api.delete(`/notifications/${id}`),
};

// ── Songs ─────────────────────────────────────────────────────
export const songsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/songs${qs ? '?' + qs : ''}`, { cache: { ttl: 5 * 60_000 } });
  },

  create: (data) => {
    api.invalidateCache('/songs');
    return api.post('/songs', data);
  },

  update: (id, data) => {
    api.invalidateCache('/songs');
    return api.put(`/songs/${id}`, data);
  },

  delete: (id) => {
    api.invalidateCache('/songs');
    return api.delete(`/songs/${id}`);
  },
};

export const setlistsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/setlists${qs ? '?' + qs : ''}`, { cache: { ttl: 60_000 } });
  },
  getById: (id) => api.get(`/setlists/${id}`),
  create: (data) => { api.invalidateCache('/setlists'); return api.post('/setlists', data); },
  update: (id, data) => { api.invalidateCache('/setlists'); return api.put(`/setlists/${id}`, data); },
  delete: (id) => { api.invalidateCache('/setlists'); return api.delete(`/setlists/${id}`); },
};

export const budgetsAPI = {
  list: (year) => api.get(`/budgets${year ? `?year=${year}` : ''}`, { cache: { ttl: 60_000 } }),
  upsert: (data) => { api.invalidateCache('/budgets'); return api.post('/budgets', data); },
};

export const pledgesAPI = {
  campaigns: () => api.get('/pledges/campaigns', { cache: { ttl: 60_000 } }),
  createCampaign: (data) => api.post('/pledges/campaigns', data),
  updateCampaign: (id, data) => api.put(`/pledges/campaigns/${id}`, data),
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/pledges${qs ? '?' + qs : ''}`);
  },
  create: (data) => api.post('/pledges', data),
  update: (id, data) => api.put(`/pledges/${id}`, data),
};

export const automationAPI = {
  list: () => api.get('/automation'),
  create: (data) => api.post('/automation', data),
  update: (id, data) => api.put(`/automation/${id}`, data),
  delete: (id) => api.delete(`/automation/${id}`),
  run: (id) => api.post(`/automation/${id}/run`),
};

export const apiKeysAPI = {
  list: () => api.get('/api-keys'),
  create: (data) => api.post('/api-keys', data),
  revoke: (id) => api.post(`/api-keys/${id}/revoke`),
};

export const webhooksAPI = {
  list: () => api.get('/webhooks'),
  create: (data) => api.post('/webhooks', data),
  update: (id, data) => api.put(`/webhooks/${id}`, data),
  delete: (id) => api.delete(`/webhooks/${id}`),
  test: (id) => api.post(`/webhooks/${id}/test`),
};

export const uploadsAPI = {
  list: (scope) => api.get(`/uploads${scope ? `?scope=${encodeURIComponent(scope)}` : ''}`),
  create: (data) => api.post('/uploads', data),
};

export const prayerAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/prayer${qs ? '?' + qs : ''}`);
  },
  create: (data) => api.post('/prayer', data),
  pray: (id) => api.post(`/prayer/${id}/pray`),
  update: (id, data) => api.put(`/prayer/${id}`, data),
};

export const chatAPI = {
  messages: (channelId) => api.get(`/chat/messages${channelId ? `?channelId=${encodeURIComponent(channelId)}` : ''}`),
  send: (data) => api.post('/chat/messages', data),
};

export const intelligenceAPI = {
  forecast: () => api.get('/intelligence/forecast', { cache: { ttl: 5 * 60_000 } }),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  listRegistrations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/admin/registrations${qs ? '?' + qs : ''}`);
  },

  approveRegistration: (id) => {
    api.invalidateCache('/members');
    return api.post(`/admin/registrations/${id}/approve`);
  },

  rejectRegistration: (id) =>
    api.post(`/admin/registrations/${id}/reject`),

  systemStats: () =>
    api.get('/admin/system-stats', { cache: { ttl: 60_000 } }),

  broadcast: (data) =>
    api.post('/admin/broadcast', data),

  revokeSessions: (memberId) =>
    api.delete(`/admin/tokens/${memberId}`),
};

// ── Settings ──────────────────────────────────────────────────
export const settingsAPI = {
  get: () =>
    api.get('/settings', { cache: { ttl: 10 * 60_000 } }),

  update: (data) => {
    api.invalidateCache('/settings');
    return api.put('/settings', data);
  },
};

// ── Welfare ───────────────────────────────────────────────────
export const welfareAPI = {
  list: () =>
    api.get('/welfare', { cache: { ttl: 2 * 60_000 } }),

  create: (data) => {
    api.invalidateCache('/welfare');
    return api.post('/welfare', data);
  },

  update: (id, data) => {
    api.invalidateCache('/welfare');
    return api.put(`/welfare/${id}`, data);
  },

  addTimeline: (id, note, type) =>
    api.post(`/welfare/${id}/timeline`, { note, type }),
};

// ── Full-text search ──────────────────────────────────────────
export const searchAPI = {
  /**
   * Search across all resources using the backend's $text index.
   * Go backend: GET /api/v1/search?q=...&type=...&page=1
   */
  search: (query, type = 'all', page = 1) => {
    const qs = new URLSearchParams({ q: query, type, page }).toString();
    return api.get(`/search?${qs}`, { cache: { ttl: 30_000 } });
  },
};

// ── Posts ─────────────────────────────────────────────────────
export const postsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/posts${qs ? '?' + qs : ''}`, { cache: { ttl: 60_000 } });
  },

  create: (data) => {
    api.invalidateCache('/posts');
    return api.post('/posts', data);
  },

  like: (id) =>
    api.post(`/posts/${id}/like`),

  addComment: (id, text) =>
    api.post(`/posts/${id}/comments`, { text }),

  delete: (id) => {
    api.invalidateCache('/posts');
    return api.delete(`/posts/${id}`);
  },
};

// ── Convenience: invalidate all caches ────────────────────────
export function invalidateAllCaches() {
  api.clearCache();
}
