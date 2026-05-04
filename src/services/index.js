/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Service Layer
   
   All data operations go through these services.
   To connect a real backend, replace each method body with an
   API call — zero component changes needed.
   ═══════════════════════════════════════════════════════════════════ */

import Storage, { KEYS } from '../storage/engine';
import { DEFAULT_ADMIN } from '../config/constants';
import { sleep, generateReceiptNo, generateOTP } from '../utils/index';
import API_CONFIG from '../config/api.config';
import api from './api/client';
import { authAPI } from './api/endpoints';

const USE_API = !API_CONFIG.USE_LOCAL_STORAGE;
const CAN_FALLBACK_TO_LOCAL = API_CONFIG.FALLBACK_TO_LOCAL;

function unwrap(payload) {
  return payload?.data ?? payload;
}

function canUseLocalFallback(error) {
  if (!USE_API || !CAN_FALLBACK_TO_LOCAL) return false;
  return error?.name === 'NetworkError';
}

function warnLocalFallback(error) {
  console.warn(
    'Backend API is unavailable; using localStorage fallback for this auth action.',
    error?.message || error
  );
}

/* ══════════════════════════════════════════════════════════════════
   AUTH SERVICE
   ══════════════════════════════════════════════════════════════════ */
export const authService = {

  /** Authenticate a user by email + password */
  async login(email, password, rememberMe = false) {
    if (USE_API) {
      try {
        const res = await authAPI.login(email, password, rememberMe);
        api.setTokens(res.accessToken, res.refreshToken);
        return {
          ...res.member,
          token: res.accessToken,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        };
      } catch (error) {
        if (!canUseLocalFallback(error)) throw error;
        warnLocalFallback(error);
      }
    }
    await sleep(400); // simulate network
    const members = Storage.getList(KEYS.MEMBERS);
    const all     = [DEFAULT_ADMIN, ...members];
    const user    = all.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user)             throw new Error('Invalid email or password');
    if (user.status === 'pending')  throw new Error('Your account is pending admin approval');
    if (user.status === 'inactive') throw new Error('Your account is inactive. Contact admin.');
    return user;
  },

  /** Register a new member (status: pending) */
  async register(data) {
    if (USE_API) {
      try {
        const res = await authAPI.register(data);
        return unwrap(res);
      } catch (error) {
        if (!canUseLocalFallback(error)) throw error;
        warnLocalFallback(error);
      }
    }
    await sleep(300);
    // Check email unique
    const members = Storage.getList(KEYS.MEMBERS);
    const pending = Storage.getList(KEYS.PENDING_REGISTRATIONS);
    const allEmails = [...members, ...pending].map(m => m.email.toLowerCase());
    if (allEmails.includes(data.email.toLowerCase())) {
      throw new Error('An account with this email already exists');
    }
    const newUser = {
      ...data,
      id:        Storage.nextId(KEYS.MEMBERS) + 100,
      status:    'pending',
      isAdmin:   false,
      attendance: 0,
      contributionTotal: 0,
      permissions: [],
      joinDate:  new Date().toISOString(),
    };
    Storage.addToList(KEYS.PENDING_REGISTRATIONS, newUser);
    // Add notification for admin
    Storage.addToList(KEYS.NOTIFICATIONS, {
      type: 'info', title: `New registration: ${data.fullName}`,
      message: 'New member registration is awaiting your approval.',
      isRead: false, actionUrl: '/dashboard/admin',
    });
    return newUser;
  },

  /** Verify mock OTP (any 6-digit code works in dev mode) */
  async verifyOTP(email, code) {
    if (USE_API) {
      try {
        return authAPI.verifyOTP(email, code, 'verify');
      } catch (error) {
        if (!canUseLocalFallback(error)) throw error;
        warnLocalFallback(error);
      }
    }
    await sleep(200);
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new Error('Invalid OTP code. Please check and try again.');
    }
    return true; // dev mode — all 6-digit codes accepted
  },

  /** Simulate sending a reset OTP */
  async sendResetOTP(email) {
    if (USE_API) {
      try {
        return authAPI.forgotPassword(email);
      } catch (error) {
        if (!canUseLocalFallback(error)) throw error;
        warnLocalFallback(error);
      }
    }
    await sleep(300);
    const members = Storage.getList(KEYS.MEMBERS);
    const found   = [DEFAULT_ADMIN, ...members].find(
      m => m.email.toLowerCase() === email.toLowerCase()
    );
    // Always respond the same (security best practice)
    return { sent: true, masked: found ? email : null };
  },

  /** Reset password */
  async resetPassword(email, newPassword, code = '000000') {
    if (USE_API) {
      try {
        return authAPI.resetPassword(email, code, newPassword);
      } catch (error) {
        if (!canUseLocalFallback(error)) throw error;
        warnLocalFallback(error);
      }
    }
    await sleep(300);
    const members = Storage.getList(KEYS.MEMBERS).map(m =>
      m.email.toLowerCase() === email.toLowerCase()
        ? { ...m, password: newPassword }
        : m
    );
    Storage.set(KEYS.MEMBERS, members);
    return true;
  },

  /** Check login rate limiting */
  checkRateLimit(email) {
    const attempts = Storage.get(KEYS.LOGIN_ATTEMPTS, {});
    const key      = email.toLowerCase();
    const record   = attempts[key];
    if (!record) return { blocked: false };
    const { count, lastAttempt } = record;
    const elapsed = (Date.now() - lastAttempt) / 60000; // minutes
    if (count >= 5 && elapsed < 15) {
      const remainingSecs = Math.ceil((15 - elapsed) * 60);
      return { blocked: true, remainingSecs };
    }
    if (elapsed >= 15) {
      // Reset after window
      delete attempts[key];
      Storage.set(KEYS.LOGIN_ATTEMPTS, attempts);
    }
    return { blocked: false };
  },

  /** Record a failed login attempt */
  recordFailedAttempt(email) {
    const attempts = Storage.get(KEYS.LOGIN_ATTEMPTS, {});
    const key      = email.toLowerCase();
    attempts[key]  = {
      count:       (attempts[key]?.count || 0) + 1,
      lastAttempt: Date.now(),
    };
    Storage.set(KEYS.LOGIN_ATTEMPTS, attempts);
  },

  /** Clear login attempts after successful login */
  clearAttempts(email) {
    const attempts = Storage.get(KEYS.LOGIN_ATTEMPTS, {});
    delete attempts[email.toLowerCase()];
    Storage.set(KEYS.LOGIN_ATTEMPTS, attempts);
  },
};

/* ══════════════════════════════════════════════════════════════════
   MEMBERS SERVICE
   ══════════════════════════════════════════════════════════════════ */
export const membersService = {

  getAll() {
    return Storage.getList(KEYS.MEMBERS);
  },

  getActive() {
    return this.getAll().filter(m => m.status === 'active');
  },

  getById(id) {
    return Storage.findOne(KEYS.MEMBERS, m => m.id === Number(id));
  },

  getPending() {
    return Storage.getList(KEYS.PENDING_REGISTRATIONS);
  },

  create(data) {
    const id = Storage.nextId(KEYS.MEMBERS);
    const member = { ...data, id, joinDate: data.joinDate || new Date().toISOString() };
    return Storage.addToList(KEYS.MEMBERS, member);
  },

  update(id, updates) {
    return Storage.updateInList(KEYS.MEMBERS, Number(id), updates);
  },

  delete(id) {
    return Storage.removeFromList(KEYS.MEMBERS, Number(id));
  },

  /** Approve a pending registration — move from pending to members */
  approve(id) {
    const pending = Storage.getList(KEYS.PENDING_REGISTRATIONS);
    const member  = pending.find(m => m.id === Number(id));
    if (!member) throw new Error('Registration not found');
    const approved = { ...member, status: 'active', approvedAt: new Date().toISOString() };
    Storage.removeFromList(KEYS.PENDING_REGISTRATIONS, Number(id));
    Storage.addToList(KEYS.MEMBERS, approved);
    return approved;
  },

  /** Reject a pending registration */
  reject(id) {
    return Storage.removeFromList(KEYS.PENDING_REGISTRATIONS, Number(id));
  },

  /** Update a member's contribution total */
  updateContributionTotal(memberId) {
    const contribs = Storage.getList(KEYS.CONTRIBUTIONS)
      .filter(c => c.memberId === Number(memberId));
    const total = contribs.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    this.update(memberId, { contributionTotal: total });
  },
};

/* ══════════════════════════════════════════════════════════════════
   EVENTS SERVICE
   ══════════════════════════════════════════════════════════════════ */
export const eventsService = {

  getAll() {
    return Storage.getList(KEYS.EVENTS);
  },

  getUpcoming() {
    const today = new Date().toISOString().split('T')[0];
    return this.getAll()
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  getPast() {
    const today = new Date().toISOString().split('T')[0];
    return this.getAll()
      .filter(e => e.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  getById(id) {
    return Storage.findOne(KEYS.EVENTS, e => e.id === Number(id));
  },

  create(data) {
    const id = Storage.nextId(KEYS.EVENTS);
    return Storage.addToList(KEYS.EVENTS, { ...data, id });
  },

  update(id, updates) {
    return Storage.updateInList(KEYS.EVENTS, Number(id), updates);
  },

  delete(id) {
    return Storage.removeFromList(KEYS.EVENTS, Number(id));
  },
};

/* ══════════════════════════════════════════════════════════════════
   ATTENDANCE SERVICE
   ══════════════════════════════════════════════════════════════════ */
export const attendanceService = {

  getAll() {
    return Storage.getList(KEYS.ATTENDANCE);
  },

  getForEvent(eventId) {
    return this.getAll().filter(r => r.eventId === Number(eventId));
  },

  getForMember(memberId) {
    return this.getAll().filter(r => r.memberId === Number(memberId));
  },

  /** Upsert attendance records for an event */
  saveRecords(eventId, records) {
    const all = this.getAll().filter(r => r.eventId !== Number(eventId));
    const newRecords = records.map(r => ({
      ...r, eventId: Number(eventId), savedAt: new Date().toISOString(),
    }));
    Storage.set(KEYS.ATTENDANCE, [...all, ...newRecords]);
    return newRecords;
  },

  getMemberRate(memberId) {
    const records = this.getForMember(Number(memberId));
    if (!records.length) return 0;
    const ok = records.filter(r => r.status === 'present' || r.status === 'late').length;
    return Math.round((ok / records.length) * 100);
  },

  getExcuses() {
    return Storage.getList(KEYS.EXCUSES);
  },

  submitExcuse(data) {
    return Storage.addToList(KEYS.EXCUSES, { ...data, status: 'pending' });
  },

  reviewExcuse(id, status, note, reviewerId) {
    return Storage.updateInList(KEYS.EXCUSES, Number(id), {
      status, reviewNote: note, reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
    });
  },
};

/* ══════════════════════════════════════════════════════════════════
   CONTRIBUTIONS SERVICE
   ══════════════════════════════════════════════════════════════════ */
export const contributionsService = {

  getAll() {
    return Storage.getList(KEYS.CONTRIBUTIONS);
  },

  getForMember(memberId) {
    return this.getAll().filter(c => c.memberId === Number(memberId));
  },

  getById(id) {
    return Storage.findOne(KEYS.CONTRIBUTIONS, c => c.id === Number(id));
  },

  create(data) {
    const id        = Storage.nextId(KEYS.CONTRIBUTIONS);
    const receiptNo = generateReceiptNo(id);
    const newContrib = { ...data, id, receiptNo, recordedAt: new Date().toISOString() };
    Storage.addToList(KEYS.CONTRIBUTIONS, newContrib);
    // Update member's total
    membersService.updateContributionTotal(data.memberId);
    return newContrib;
  },

  update(id, updates) {
    return Storage.updateInList(KEYS.CONTRIBUTIONS, Number(id), updates);
  },

  delete(id) {
    const contrib = this.getById(id);
    Storage.removeFromList(KEYS.CONTRIBUTIONS, Number(id));
    if (contrib) membersService.updateContributionTotal(contrib.memberId);
  },

  getStats() {
    const all   = this.getAll();
    const total = all.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const byType = all.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + parseFloat(c.amount || 0);
      return acc;
    }, {});
    return { total, byType, count: all.length };
  },
};

/* ══════════════════════════════════════════════════════════════════
   MESSAGES SERVICE
   ══════════════════════════════════════════════════════════════════ */
export const messagesService = {

  getAll() {
    return Storage.getList(KEYS.MESSAGES);
  },

  getForUser(userId) {
    return this.getAll().filter(m =>
      m.isBroadcast || m.recipientId === Number(userId) || m.senderId === Number(userId)
    );
  },

  send(data) {
    return Storage.addToList(KEYS.MESSAGES, { ...data, sentAt: new Date().toISOString(), readBy: [data.senderId] });
  },

  markRead(messageId, userId) {
    const msg = Storage.findOne(KEYS.MESSAGES, m => m.id === Number(messageId));
    if (!msg) return;
    const readBy = [...new Set([...(msg.readBy || []), Number(userId)])];
    Storage.updateInList(KEYS.MESSAGES, Number(messageId), { isRead: true, readBy });
  },

  delete(id) {
    return Storage.removeFromList(KEYS.MESSAGES, Number(id));
  },
};

/* ══════════════════════════════════════════════════════════════════
   POSTS SERVICE
   ══════════════════════════════════════════════════════════════════ */
export const postsService = {
  getAll()        { return Storage.getList(KEYS.POSTS).sort((a,b) => b.pinned - a.pinned || new Date(b.createdAt) - new Date(a.createdAt)); },
  getById(id)     { return Storage.findOne(KEYS.POSTS, p => p.id === Number(id)); },
  create(data)    { return Storage.addToList(KEYS.POSTS, { ...data, viewCount: 0 }); },
  update(id, u)   { return Storage.updateInList(KEYS.POSTS, Number(id), u); },
  delete(id)      { return Storage.removeFromList(KEYS.POSTS, Number(id)); },
};

/* ══════════════════════════════════════════════════════════════════
   SONGS SERVICE
   ══════════════════════════════════════════════════════════════════ */
export const songsService = {
  getAll()        { return Storage.getList(KEYS.SONGS); },
  getById(id)     { return Storage.findOne(KEYS.SONGS, s => s.id === Number(id)); },
  create(data)    { return Storage.addToList(KEYS.SONGS, data); },
  update(id, u)   { return Storage.updateInList(KEYS.SONGS, Number(id), u); },
  delete(id)      { return Storage.removeFromList(KEYS.SONGS, Number(id)); },
  getSetlists()   { return Storage.getList(KEYS.SETLISTS); },
  createSetlist(data) { return Storage.addToList(KEYS.SETLISTS, data); },
};

/* ══════════════════════════════════════════════════════════════════
   WELFARE SERVICE
   ══════════════════════════════════════════════════════════════════ */
export const welfareService = {
  getAll()        { return Storage.getList(KEYS.WELFARE_CASES); },
  getById(id)     { return Storage.findOne(KEYS.WELFARE_CASES, w => w.id === Number(id)); },
  create(data)    { return Storage.addToList(KEYS.WELFARE_CASES, { ...data, timeline: [] }); },
  update(id, u)   { return Storage.updateInList(KEYS.WELFARE_CASES, Number(id), u); },
  addTimelineEntry(id, entry) {
    const wc = this.getById(id);
    if (!wc) return;
    const timeline = [...(wc.timeline || []), { ...entry, at: new Date().toISOString() }];
    return this.update(id, { timeline });
  },
};

/* ══════════════════════════════════════════════════════════════════
   SETTINGS SERVICE
   ══════════════════════════════════════════════════════════════════ */
export const settingsService = {
  get()           { return Storage.get(KEYS.SETTINGS, {}); },
  update(updates) {
    const current = this.get();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    Storage.set(KEYS.SETTINGS, updated);
    return updated;
  },
};

/* ══════════════════════════════════════════════════════════════════
   NOTIFICATIONS SERVICE
   ══════════════════════════════════════════════════════════════════ */
export const notificationsService = {
  getAll()        { return Storage.getList(KEYS.NOTIFICATIONS).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); },
  getUnread()     { return this.getAll().filter(n => !n.isRead); },
  markRead(id)    { return Storage.updateInList(KEYS.NOTIFICATIONS, Number(id), { isRead: true }); },
  markAllRead()   {
    const all = this.getAll().map(n => ({ ...n, isRead: true }));
    Storage.set(KEYS.NOTIFICATIONS, all);
  },
  add(data)       { return Storage.addToList(KEYS.NOTIFICATIONS, { ...data, isRead: false }); },
  delete(id)      { return Storage.removeFromList(KEYS.NOTIFICATIONS, Number(id)); },
  clearAll()      { Storage.set(KEYS.NOTIFICATIONS, []); },
};

/* ══════════════════════════════════════════════════════════════════
   AUDIT LOG SERVICE
   ══════════════════════════════════════════════════════════════════ */
export const auditService = {
  getAll() { return Storage.getList(KEYS.AUDIT_LOG).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)); },
  log(userEmail, action, resource, resourceId, oldValues, newValues) {
    const entry = { userEmail, action, resource, resourceId, oldValues, newValues, timestamp: new Date().toISOString() };
    const log   = [entry, ...this.getAll()].slice(0, 500); // keep last 500
    Storage.set(KEYS.AUDIT_LOG, log);
    return entry;
  },
};
