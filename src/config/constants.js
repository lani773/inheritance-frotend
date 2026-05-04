/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Application Constants
   Edit here to change default credentials, roles, voice parts, etc.
   ═══════════════════════════════════════════════════════════════════ */

// ── Default Admin Account ──────────────────────────────────────
// This account is pre-seeded on first app load.
// IMPORTANT: Change password before going to production!
export const DEFAULT_ADMIN = {
  id: 1,
  email: 'inheritancechoir@gmail.com',
  password: 'Umurage123.',       // plain text (dev only — hash in production)
  fullName: 'Jean Baptiste',
  role: 'president',
  voicePart: 'Tenor',
  phone: '+250 788 123 456',
  status: 'active',
  joinDate: '2021-01-15',
  isAdmin: true,
  gender: 'Male',
  maritalStatus: 'Married',
  dateOfBirth: '1985-05-12',
  bio: 'Founder and President of Inheritance Choir. Passionate about sacred music and community.',
  attendance: 98,
  contributionTotal: 3400,
  permissions: ['all'],
  online: true,
};

// ── App Information ────────────────────────────────────────────
export const APP_INFO = {
  name: 'INHERITANCE CHOIR',
  tagline: 'Voices united in worship and excellence',
  version: '1.0.0',
  contactEmail: 'inheritancechoir@gmail.com',
  currency: 'RWF',
  timezone: 'Africa/Kigali',
};

// ── Session Configuration ──────────────────────────────────────
export const SESSION = {
  /** Default session duration in hours (without "remember me") */
  DEFAULT_HOURS: 24,
  /** "Remember me" session duration in days */
  REMEMBER_DAYS: 30,
  /** Minutes before expiry to show renewal warning */
  WARN_BEFORE_MINUTES: 5,
};

// ── Rate Limiting (localStorage-based) ────────────────────────
export const RATE_LIMITS = {
  /** Max login attempts before lockout */
  LOGIN_MAX_ATTEMPTS: 5,
  /** Lockout window in minutes */
  LOGIN_WINDOW_MINUTES: 15,
  /** Max OTP resend attempts per hour */
  OTP_RESEND_MAX: 3,
  /** OTP expiry in seconds */
  OTP_EXPIRY_SECONDS: 60,
};

// ── Choir Roles (ordered by hierarchy) ────────────────────────
export const ROLES = [
  { id: 'president',        label: 'President',          color: '#C9A84C', icon: '♛', isAdmin: true  },
  { id: 'vp_welfare',       label: 'VP Welfare',         color: '#EC4899', icon: '♡', isAdmin: false },
  { id: 'secretary',        label: 'Secretary',          color: '#8B5CF6', icon: '✎', isAdmin: false },
  { id: 'treasurer',        label: 'Treasurer',          color: '#22C55E', icon: '◇', isAdmin: false },
  { id: 'choir_director',   label: 'Choir Director',     color: '#06B6D4', icon: '♩', isAdmin: false },
  { id: 'attendance_lead',  label: 'Attendance Lead',    color: '#F59E0B', icon: '✅', isAdmin: false },
  { id: 'section_lead',     label: 'Section Leader',     color: '#3B82F6', icon: '◈', isAdmin: false },
  { id: 'member',           label: 'Member',             color: '#94A3B8', icon: '◎', isAdmin: false },
];

// Quick lookup: which roles are admin-level
export const ADMIN_ROLES = ROLES
  .filter(r => r.isAdmin)
  .map(r => r.id);

// ── Voice Parts ────────────────────────────────────────────────
export const VOICE_PARTS = [
  {
    id: 'Soprano',
    label: 'Soprano',
    range: 'C4 – C6',
    description: 'Highest female voice, carries the melody',
    color: '#EC4899',
    icon: '🎤',
  },
  {
    id: 'Alto',
    label: 'Alto',
    range: 'G3 – E5',
    description: 'Lower female voice, rich harmonies',
    color: '#8B5CF6',
    icon: '🎶',
  },
  {
    id: 'Tenor',
    label: 'Tenor',
    range: 'C3 – C5',
    description: 'Highest male voice, lyrical power',
    color: '#3B82F6',
    icon: '🎵',
  },
  {
    id: 'Bass',
    label: 'Bass',
    range: 'E2 – E4',
    description: 'Lowest male voice, foundation of sound',
    color: '#10B981',
    icon: '🎼',
  },
];

// ── Event Types ─────────────────────────────────────────────────
export const EVENT_TYPES = [
  { id: 'rehearsal',    label: 'Rehearsal',    color: '#8B5CF6', icon: '🎵' },
  { id: 'performance',  label: 'Performance',  color: '#C9A84C', icon: '🌟' },
  { id: 'service',      label: 'Service',      color: '#EC4899', icon: '⛪' },
  { id: 'meeting',      label: 'Meeting',      color: '#22C55E', icon: '👥' },
  { id: 'workshop',     label: 'Workshop',     color: '#06B6D4', icon: '📚' },
  { id: 'special',      label: 'Special',      color: '#3B82F6', icon: '✨' },
];

// ── Contribution Types ─────────────────────────────────────────
export const CONTRIBUTION_TYPES = [
  { id: 'tithe',          label: 'Tithe',          color: '#C9A84C', icon: '🏛️' },
  { id: 'offering',       label: 'Offering',       color: '#3B82F6', icon: '💝' },
  { id: 'special_gift',   label: 'Special Gift',   color: '#8B5CF6', icon: '🎁' },
  { id: 'fundraiser',     label: 'Fundraiser',     color: '#22C55E', icon: '🌿' },
  { id: 'welfare_fund',   label: 'Welfare Fund',   color: '#EC4899', icon: '❤️' },
  { id: 'other',          label: 'Other',          color: '#94A3B8', icon: '◇' },
];

// ── Payment Methods ────────────────────────────────────────────
export const PAYMENT_METHODS = [
  { id: 'cash',          label: 'Cash',          icon: '💵' },
  { id: 'mobile_money',  label: 'Mobile Money',  icon: '📱' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'cheque',        label: 'Cheque',        icon: '📄' },
  { id: 'online',        label: 'Online',        icon: '🌐' },
];

// ── Attendance Status ──────────────────────────────────────────
export const ATTENDANCE_STATUS = [
  { id: 'present',  label: 'Present',  color: '#22C55E', icon: '✅' },
  { id: 'late',     label: 'Late',     color: '#F59E0B', icon: '⏰' },
  { id: 'excused',  label: 'Excused',  color: '#8B5CF6', icon: '📝' },
  { id: 'absent',   label: 'Absent',   color: '#EF4444', icon: '❌' },
];

// ── Song Genres ────────────────────────────────────────────────
export const SONG_GENRES = [
  { id: 'hymn',           label: 'Hymn' },
  { id: 'gospel',         label: 'Gospel' },
  { id: 'contemporary',   label: 'Contemporary' },
  { id: 'classical',      label: 'Classical' },
  { id: 'afrobeats',      label: 'Afrobeats' },
  { id: 'traditional',    label: 'Traditional' },
  { id: 'worship',        label: 'Worship' },
];

// ── Song Difficulties ──────────────────────────────────────────
export const SONG_DIFFICULTIES = [
  { id: 'beginner',     label: 'Beginner',     color: '#22C55E' },
  { id: 'intermediate', label: 'Intermediate', color: '#F59E0B' },
  { id: 'advanced',     label: 'Advanced',     color: '#EF4444' },
  { id: 'expert',       label: 'Expert',       color: '#8B5CF6' },
];

// ── Member Status ──────────────────────────────────────────────
export const MEMBER_STATUS = [
  { id: 'active',   label: 'Active',   color: '#22C55E' },
  { id: 'pending',  label: 'Pending',  color: '#F59E0B' },
  { id: 'inactive', label: 'Inactive', color: '#EF4444' },
  { id: 'on_leave', label: 'On Leave', color: '#8B5CF6' },
];

// ── Currency Options ───────────────────────────────────────────
export const CURRENCIES = [
  { id: 'RWF', label: 'RWF (Rwandan Franc)', symbol: 'RWF' },
  { id: 'USD', label: 'USD (US Dollar)',      symbol: '$'   },
  { id: 'EUR', label: 'EUR (Euro)',           symbol: '€'   },
];

// ── Welfare Case Types ─────────────────────────────────────────
export const WELFARE_TYPES = [
  { id: 'medical',    label: 'Medical Emergency', color: '#EF4444' },
  { id: 'bereavement',label: 'Bereavement',       color: '#8B5CF6' },
  { id: 'financial',  label: 'Financial Need',    color: '#F59E0B' },
  { id: 'other',      label: 'Other',             color: '#94A3B8' },
];

export const WELFARE_PRIORITIES = [
  { id: 'urgent',  label: 'Urgent',  color: '#EF4444' },
  { id: 'high',    label: 'High',    color: '#F59E0B' },
  { id: 'normal',  label: 'Normal',  color: '#3B82F6' },
  { id: 'low',     label: 'Low',     color: '#94A3B8' },
];

// ── Post Types ─────────────────────────────────────────────────
export const POST_TYPES = [
  { id: 'announcement', label: 'Announcement', color: '#3B82F6',  icon: '📢' },
  { id: 'prayer',       label: 'Prayer Request',color: '#8B5CF6', icon: '🙏' },
  { id: 'praise',       label: 'Praise Report', color: '#22C55E', icon: '🙌' },
  { id: 'reminder',     label: 'Reminder',      color: '#F59E0B', icon: '⏰' },
  { id: 'news',         label: 'News',          color: '#C9A84C', icon: '📰' },
];

// ── Notification Types ─────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  info:    { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
  success: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  error:   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
};

// ── Marital Status Options ─────────────────────────────────────
export const MARITAL_STATUS = [
  { id: 'single',   label: 'Single'   },
  { id: 'married',  label: 'Married'  },
  { id: 'widowed',  label: 'Widowed'  },
  { id: 'divorced', label: 'Divorced' },
];

// ── Gender Options ─────────────────────────────────────────────
export const GENDERS = [
  { id: 'Male',   label: 'Male'   },
  { id: 'Female', label: 'Female' },
];
