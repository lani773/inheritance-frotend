/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Analytics Utilities  (Task 3)
   Pure functions that transform raw storage data into chart-ready
   datasets. All Recharts-compatible.
   ═══════════════════════════════════════════════════════════════════ */

import Storage, { KEYS } from '../storage/engine';

/* ── Month label helpers ──────────────────────────────────────── */
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Get an array of the last N month labels + keys.
 * Returns [{ label: 'Mar', key: '2026-03' }, ...]
 */
export function getLastNMonths(n = 12) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      label: `${MONTH_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: d.getMonth(),
      year:  d.getFullYear(),
    });
  }
  return result;
}

/* ══════════════════════════════════════════════════════════════════
   CONTRIBUTION ANALYTICS
   ══════════════════════════════════════════════════════════════════ */

/**
 * 12-month stacked bar chart data.
 * Returns array of { month, tithe, offering, special_gift, welfare_fund, total }
 */
export function getContributionTrend(months = 12) {
  const contribs = Storage.getList(KEYS.CONTRIBUTIONS);
  const periods  = getLastNMonths(months);

  return periods.map(({ label, key }) => {
    const monthContribs = contribs.filter(c => c.date.startsWith(key));
    const byType = { tithe: 0, offering: 0, special_gift: 0, welfare_fund: 0, other: 0 };
    monthContribs.forEach(c => {
      const t = c.type || 'other';
      byType[t] = (byType[t] || 0) + parseFloat(c.amount || 0);
    });
    const total = Object.values(byType).reduce((a, b) => a + b, 0);
    return { month: label, ...byType, total };
  });
}

/**
 * Year-over-year comparison for contributions.
 * Returns [{ month: 'Jan', thisYear, lastYear }]
 */
export function getYoYContributions() {
  const contribs = Storage.getList(KEYS.CONTRIBUTIONS);
  const now = new Date();
  const thisYear = now.getFullYear();
  const lastYear = thisYear - 1;

  return MONTH_SHORT.map((label, mi) => {
    const mo = String(mi + 1).padStart(2, '0');
    const thisKey = `${thisYear}-${mo}`;
    const lastKey = `${lastYear}-${mo}`;
    const thisTotal = contribs.filter(c => c.date.startsWith(thisKey)).reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const lastTotal = contribs.filter(c => c.date.startsWith(lastKey)).reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    return { month: label, thisYear: Math.round(thisTotal), lastYear: Math.round(lastTotal) };
  });
}

/**
 * Contribution breakdown by type (for donut/pie chart).
 * Returns [{ name, value, color }]
 */
export function getContributionByType() {
  const contribs = Storage.getList(KEYS.CONTRIBUTIONS);
  const TYPE_COLORS = {
    tithe:        '#C9A84C',
    offering:     '#3B82F6',
    special_gift: '#8B5CF6',
    welfare_fund: '#EC4899',
    fundraiser:   '#10B981',
    other:        '#94A3B8',
  };
  const TYPE_LABELS = {
    tithe:        'Tithe',
    offering:     'Offering',
    special_gift: 'Special Gift',
    welfare_fund: 'Welfare Fund',
    fundraiser:   'Fundraiser',
    other:        'Other',
  };
  const byType = {};
  contribs.forEach(c => {
    byType[c.type] = (byType[c.type] || 0) + parseFloat(c.amount || 0);
  });
  return Object.entries(byType)
    .map(([type, value]) => ({
      name:  TYPE_LABELS[type] || type,
      value: Math.round(value),
      color: TYPE_COLORS[type] || '#94A3B8',
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Top contributors ranked.
 * Returns [{ name, voicePart, total, percent, color }]
 */
export function getTopContributors(limit = 8) {
  const contribs = Storage.getList(KEYS.CONTRIBUTIONS);
  const members  = Storage.getList(KEYS.MEMBERS);
  const total    = contribs.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
  const VOICE_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };

  const byMember = {};
  contribs.forEach(c => {
    byMember[c.memberId] = (byMember[c.memberId] || 0) + parseFloat(c.amount || 0);
  });

  return Object.entries(byMember)
    .map(([mid, amount]) => {
      const m = members.find(x => x.id === Number(mid));
      return {
        id:        Number(mid),
        name:      m?.fullName || `Member ${mid}`,
        initials:  m ? m.fullName.split(' ').map(n => n[0]).join('') : '?',
        voicePart: m?.voicePart || '—',
        total:     Math.round(amount),
        percent:   total > 0 ? Math.round((amount / total) * 100) : 0,
        color:     VOICE_COLORS[m?.voicePart] || '#C9A84C',
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/* ══════════════════════════════════════════════════════════════════
   ATTENDANCE ANALYTICS
   ══════════════════════════════════════════════════════════════════ */

/**
 * 12-month attendance trend (overall + per voice part).
 * Returns [{ month, overall, Soprano, Alto, Tenor, Bass }]
 */
export function getAttendanceTrend(months = 12) {
  const records  = Storage.getList(KEYS.ATTENDANCE);
  const members  = Storage.getList(KEYS.MEMBERS);
  const events   = Storage.getList(KEYS.EVENTS);
  const periods  = getLastNMonths(months);

  return periods.map(({ label, key }) => {
    const monthEvents = events.filter(e => e.date.startsWith(key));
    if (monthEvents.length === 0) return { month: label, overall: 0, Soprano: 0, Alto: 0, Tenor: 0, Bass: 0 };

    const eventIds = monthEvents.map(e => e.id);
    const monthRecords = records.filter(r => eventIds.includes(r.eventId));

    const calc = (memberFilter) => {
      const relevant = monthRecords.filter(r => memberFilter(r));
      if (!relevant.length) return 0;
      const present = relevant.filter(r => r.status === 'present' || r.status === 'late').length;
      return Math.round((present / relevant.length) * 100);
    };

    const overall = calc(() => true);
    const byVoice = {};
    ['Soprano', 'Alto', 'Tenor', 'Bass'].forEach(vp => {
      const vpMemberIds = members.filter(m => m.voicePart === vp).map(m => m.id);
      byVoice[vp] = calc(r => vpMemberIds.includes(r.memberId));
    });

    return { month: label, overall, ...byVoice };
  });
}

/**
 * Per-member attendance rates for horizontal bar chart.
 * Returns [{ name, rate, voicePart, color, initials }]
 */
export function getMemberAttendanceRates() {
  const records = Storage.getList(KEYS.ATTENDANCE);
  const members = Storage.getList(KEYS.MEMBERS).filter(m => m.status === 'active');
  const VOICE_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };

  return members.map(m => {
    const mRec = records.filter(r => r.memberId === m.id);
    const present = mRec.filter(r => r.status === 'present' || r.status === 'late').length;
    const rate = mRec.length ? Math.round((present / mRec.length) * 100) : m.attendance || 0;
    return {
      name:      m.fullName,
      initials:  m.fullName.split(' ').map(n => n[0]).join(''),
      voicePart: m.voicePart,
      rate,
      color:     VOICE_COLORS[m.voicePart] || '#C9A84C',
      atRisk:    rate < 70,
    };
  }).sort((a, b) => b.rate - a.rate);
}

/**
 * Voice part distribution for pie chart.
 */
export function getVoiceDistribution() {
  const members = Storage.getList(KEYS.MEMBERS).filter(m => m.status === 'active');
  const VOICE_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };
  const dist = {};
  members.forEach(m => { dist[m.voicePart] = (dist[m.voicePart] || 0) + 1; });
  return Object.entries(dist).map(([name, value]) => ({
    name, value, color: VOICE_COLORS[name] || '#C9A84C',
    percent: Math.round((value / members.length) * 100),
  }));
}

/* ══════════════════════════════════════════════════════════════════
   MEMBER GROWTH ANALYTICS
   ══════════════════════════════════════════════════════════════════ */

/**
 * Cumulative member count per month over the last N months.
 */
export function getMemberGrowth(months = 12) {
  const members = Storage.getList(KEYS.MEMBERS);
  const periods = getLastNMonths(months);
  return periods.map(({ label, key }) => {
    const cutoff = `${key}-31`;
    const count  = members.filter(m => m.joinDate && m.joinDate <= cutoff).length;
    return { month: label, members: count };
  });
}

/* ══════════════════════════════════════════════════════════════════
   SUMMARY STATS
   ══════════════════════════════════════════════════════════════════ */

/**
 * Single stat object for all KPI cards.
 */
export function getSummaryStats() {
  const members      = Storage.getList(KEYS.MEMBERS);
  const active       = members.filter(m => m.status === 'active');
  const events       = Storage.getList(KEYS.EVENTS);
  const contributions= Storage.getList(KEYS.CONTRIBUTIONS);
  const records      = Storage.getList(KEYS.ATTENDANCE);
  const today        = new Date().toISOString().split('T')[0];
  const upcoming     = events.filter(e => e.date >= today);

  const totalContribs = contributions.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
  const avgAttendance = active.length
    ? Math.round(active.reduce((s, m) => s + (m.attendance || 0), 0) / active.length)
    : 0;

  // Month-over-month contribution growth
  const now  = new Date();
  const thisM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`;
  const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevM = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2,'0')}`;

  const thisMonthTotal = contributions.filter(c => c.date.startsWith(thisM)).reduce((s, c) => s + parseFloat(c.amount || 0), 0);
  const prevMonthTotal = contributions.filter(c => c.date.startsWith(prevM)).reduce((s, c) => s + parseFloat(c.amount || 0), 0);
  const contribGrowth  = prevMonthTotal > 0 ? Math.round(((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100) : 0;

  return {
    totalMembers:    members.length,
    activeMembers:   active.length,
    pendingMembers:  members.filter(m => m.status === 'pending').length,
    avgAttendance,
    atRiskCount:     active.filter(m => (m.attendance || 0) < 70).length,
    totalContribs,
    thisMonthContribs: thisMonthTotal,
    contribGrowth,
    upcomingEvents:  upcoming.length,
    totalEvents:     events.length,
    totalAttendanceRecords: records.length,
  };
}
