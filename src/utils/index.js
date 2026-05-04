/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Utility Functions
   ═══════════════════════════════════════════════════════════════════ */

/* ── formatters.js ───────────────────────────────────────────── */

/**
 * Format a date string or Date object into a readable string.
 * @param {string|Date} date
 * @param {'short'|'long'|'relative'|'time'|'datetime'} format
 */
export function formatDate(date, format = 'short') {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  if (format === 'relative') {
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins  <  1) return 'just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hrs   < 24) return `${hrs}h ago`;
    if (days  <  7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (format === 'time') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  if (format === 'datetime') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  // short (default)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Format a date into a time string (HH:MM AM/PM).
 * @param {string|Date} date
 */
export function formatTime(date) {
  return formatDate(date, 'time');
}

/**
 * Format a currency amount.
 * @param {number} amount
 * @param {string} currency - 'RWF', 'USD', 'EUR'
 */
export function formatCurrency(amount, currency = 'RWF') {
  if (amount === null || amount === undefined) return '—';
  const symbols = { RWF: 'RWF ', USD: '$', EUR: '€' };
  const sym = symbols[currency] || currency + ' ';
  return sym + Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: currency === 'RWF' ? 0 : 2,
    maximumFractionDigits: currency === 'RWF' ? 0 : 2,
  });
}

/**
 * Format a percentage.
 * @param {number} value - 0–100
 * @param {number} decimals
 */
export function formatPercent(value, decimals = 0) {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Get initials from a full name string.
 * @param {string} name - "Jean Baptiste Niyonkuru"
 * @returns {string} "JB"
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Truncate a string to maxLength with ellipsis.
 * @param {string} str
 * @param {number} maxLength
 */
export function truncate(str, maxLength = 60) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Format a phone number for display.
 * @param {string} phone
 */
export function formatPhone(phone = '') {
  return phone.replace(/(\+\d{3})\s?(\d{3})\s?(\d{3})\s?(\d{3})/, '$1 $2 $3 $4');
}

/**
 * Generate a receipt number.
 * @param {number} id
 */
export function generateReceiptNo(id) {
  const year = new Date().getFullYear();
  return `CHR-${year}-${String(id).padStart(4, '0')}`;
}

/* ── validators.js ───────────────────────────────────────────── */

/** Valid email regex */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Valid phone number (loose) */
export function isValidPhone(phone) {
  return /^[\+\d\s\-\(\)]{8,16}$/.test(phone);
}

/** Password strength: returns { score: 0-4, label, color } */
export function getPasswordStrength(password = '') {
  let score = 0;
  if (password.length >= 8)  score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password))   score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { label: 'Too short', color: 'var(--color-error)'   },
    { label: 'Weak',      color: 'var(--color-error)'   },
    { label: 'Fair',      color: 'var(--color-warning)'  },
    { label: 'Good',      color: 'var(--color-info)'     },
    { label: 'Strong',    color: 'var(--color-success)'  },
  ];
  return { score, ...levels[score] };
}

/** Validate a full registration form */
export function validateRegistration({ fullName, email, password, confirmPassword, dateOfBirth }) {
  const errors = {};
  if (!fullName?.trim())  errors.fullName = 'Full name is required';
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address';
  if (password?.length < 8) errors.password = 'Password must be at least 8 characters';
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  if (dateOfBirth) {
    const age = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 86400000));
    if (age < 15) errors.dateOfBirth = 'You must be at least 15 years old';
  }
  return errors;
}

/* ── permissions.js ──────────────────────────────────────────── */

/** Check if a session/member has a given permission */
export function can(session, permission) {
  if (!session) return false;
  if (session.isAdmin) return true;
  const perms = session.permissions || [];
  return perms.includes('all') || perms.includes(permission);
}

/** Check if member role is admin-level */
export function isAdminRole(role) {
  return ['president'].includes(role);
}

/* ── helpers.js ──────────────────────────────────────────────── */

/**
 * Sleep / delay (for simulating async operations).
 * @param {number} ms
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Deep clone an object (JSON-safe).
 * @param {object} obj
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Group an array of objects by a key.
 * @param {Array} arr
 * @param {string} key
 * @returns {Object} { keyValue: [items] }
 */
export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'other';
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

/**
 * Sort an array of objects by a key.
 * @param {Array} arr
 * @param {string} key
 * @param {'asc'|'desc'} dir
 */
export function sortBy(arr, key, dir = 'asc') {
  return [...arr].sort((a, b) => {
    if (a[key] < b[key]) return dir === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return dir === 'asc' ?  1 : -1;
    return 0;
  });
}

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} delay
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Calculate attendance rate for a member from records array.
 * @param {Array} records - attendance records for a member
 */
export function calcAttendanceRate(records = []) {
  if (records.length === 0) return 0;
  const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
  return Math.round((present / records.length) * 100);
}

/**
 * Get color for an attendance percentage value.
 * @param {number} pct
 */
export function attendanceColor(pct) {
  if (pct >= 90) return 'var(--color-success)';
  if (pct >= 75) return 'var(--color-warning)';
  return 'var(--color-error)';
}

/**
 * Generate a mock 6-digit OTP code.
 */
export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Mask an email for display in OTP screen.
 * "jean@gmail.com" → "j***@gmail.com"
 */
export function maskEmail(email = '') {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return `${user[0]}***@${domain}`;
}

/**
 * Check if a date string is in the future.
 * @param {string} dateStr
 */
export function isFuture(dateStr) {
  return new Date(dateStr).getTime() > Date.now();
}

/**
 * Get days until a date.
 * @param {string} dateStr
 */
export function daysUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

/**
 * Download a blob as a file in the browser.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Re-export analytics helpers for convenience
export { 
  getContributionTrend, getAttendanceTrend, getVoiceDistribution,
  getTopContributors, getYoYContributions, getMemberGrowth,
  getMemberAttendanceRates, getContributionByType, getSummaryStats,
  getLastNMonths,
} from './analytics';
