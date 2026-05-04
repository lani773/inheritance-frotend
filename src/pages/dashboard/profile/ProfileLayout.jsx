/**
 * INHERITANCE CHOIR — Profile Layout Shell
 * Shared wrapper for all 5 My Profile sub-pages.
 * Provides: hero identity card, tab navigation, completeness ring, shared state.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth }          from '../../../context/AuthContext';
import { usePermissions }   from '../../../context/PermissionsContext';
import { useNotifications } from '../../../context/NotificationsContext';
import { AvatarUploader }   from '../../../components/upload/FileUpload';

const VP_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };
const ROLE_ICONS = { president:'♛', vp_welfare:'♡', secretary:'✎', treasurer:'◇', choir_director:'♩', attendance_lead:'✅', section_lead:'◈', member:'◎' };

const TABS = [
  { id:'overview',     path:'',              label:'Overview',       icon:'🏠' },
  { id:'activity',     path:'/activity',     label:'Activity',       icon:'📋' },
  { id:'contributions',path:'/contributions',label:'Contributions',  icon:'💰' },
  { id:'achievements', path:'/achievements', label:'Achievements',   icon:'🏆' },
  { id:'security',     path:'/security',     label:'Privacy & Security', icon:'🔐' },
];

// ── Completeness calculator ─────────────────────────────────────
function calcCompleteness(member) {
  if (!member) return 0;
  const fields = [
    member.fullName, member.email, member.phone, member.dateOfBirth,
    member.gender, member.maritalStatus, member.bio, member.avatarUrl,
    member.voicePart, member.emergencyContact,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

// ── SVG Completeness Ring ──────────────────────────────────────
function CompletenessRing({ pct }) {
  const r = 28, cx = 32, cy = 32;
  const circumference = 2 * Math.PI * r;
  const dashOffset    = circumference - (pct / 100) * circumference;
  const color = pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <svg width={64} height={64} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E2D4A" strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{ transition:'stroke-dashoffset 0.8s ease-out' }}
      />
      <text x={cx} y={cy} fill={color} textAnchor="middle" dominantBaseline="central"
        style={{ transform:'rotate(90deg)', transformOrigin:`${cx}px ${cy}px`, fontSize:11, fontWeight:800, fontFamily:'DM Mono, monospace' }}>
        {pct}%
      </text>
    </svg>
  );
}

// ── Hero Identity Card ─────────────────────────────────────────
function ProfileHeroCard({ session, completeness, onAvatarUpdate }) {
  const [copied, setCopied] = useState(null);
  const vpColor = VP_COLORS[session?.voicePart] || '#C9A84C';
  const roleIcon = ROLE_ICONS[session?.role] || '◎';
  const initials = session?.fullName?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';
  const joinedAgo = session?.joinDate
    ? (() => {
        const ms = Date.now() - new Date(session.joinDate).getTime();
        const years = Math.floor(ms / (365.25*24*3600*1000));
        const months = Math.floor((ms % (365.25*24*3600*1000)) / (30.44*24*3600*1000));
        if (years > 0) return `${years}y ${months}m`;
        return `${months} months`;
      })()
    : '—';

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{
      background:'linear-gradient(135deg, #0F172A 0%, #141E33 60%, #0A1628 100%)',
      borderBottom:'1px solid #1E2D4A',
      padding:'28px 32px',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:24, flexWrap:'wrap' }}>
        {/* Avatar */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <div style={{
            width:88, height:88, borderRadius:'50%',
            background:`${vpColor}22`, border:`3px solid ${vpColor}66`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:28, fontWeight:700, color:vpColor, fontFamily:'Cinzel, serif',
            boxShadow:`0 0 24px ${vpColor}33`,
          }}>
            {initials}
          </div>
          {/* Online dot */}
          <div style={{
            position:'absolute', bottom:4, right:4,
            width:14, height:14, borderRadius:'50%',
            background:'#22C55E', border:'2px solid #0A1628',
            boxShadow:'0 0 8px #22C55E',
          }} />
          {/* Edit overlay — uses AvatarUploader */}
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', overflow:'hidden', opacity:0, transition:'opacity 0.2s' }}
               onMouseEnter={e=>e.currentTarget.style.opacity=1}
               onMouseLeave={e=>e.currentTarget.style.opacity=0}>
            <AvatarUploader currentUrl={session?.avatarUrl} onUpload={onAvatarUpdate} />
          </div>
        </div>

        {/* Identity */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
            <h1 style={{
              margin:0, fontSize:24, fontFamily:'Cinzel, serif',
              background:'linear-gradient(135deg, #C9A84C, #F0C060, #C9A84C)',
              backgroundClip:'text', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>
              {session?.fullName || 'My Profile'}
            </h1>
            <span style={{
              fontSize:13, color:vpColor, background:`${vpColor}15`,
              border:`1px solid ${vpColor}33`, borderRadius:6, padding:'2px 10px', fontWeight:700,
            }}>
              {roleIcon} {session?.role?.replace(/_/g,' ')}
            </span>
          </div>

          <div style={{ display:'flex', gap:12, marginBottom:10, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:vpColor, background:`${vpColor}11`, border:`1px solid ${vpColor}22`, borderRadius:20, padding:'2px 10px' }}>
              🎵 {session?.voicePart}
            </span>
            <span style={{ fontSize:12, color:'#64748B' }}>
              📅 Member for {joinedAgo}
            </span>
          </div>

          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:8 }}>
            {session?.email && (
              <button onClick={()=>copy(session.email,'email')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:'#94A3B8', fontSize:13, padding:0 }}>
                ✉️ {session.email}
                <span style={{ fontSize:10, color: copied==='email' ? '#22C55E' : '#374151' }}>
                  {copied==='email' ? '✓ Copied' : '📋'}
                </span>
              </button>
            )}
            {session?.phone && (
              <button onClick={()=>copy(session.phone,'phone')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:'#94A3B8', fontSize:13, padding:0 }}>
                📱 {session.phone}
                <span style={{ fontSize:10, color: copied==='phone' ? '#22C55E' : '#374151' }}>
                  {copied==='phone' ? '✓' : '📋'}
                </span>
              </button>
            )}
          </div>

          {session?.bio && (
            <p style={{ margin:0, fontSize:13, color:'#94A3B8', lineHeight:1.5, maxWidth:520 }}>
              {session.bio.length > 140 ? session.bio.slice(0,140)+'…' : session.bio}
            </p>
          )}
        </div>

        {/* Completeness ring */}
        <div style={{ textAlign:'center', flexShrink:0 }}>
          <CompletenessRing pct={completeness} />
          <p style={{ margin:'4px 0 0', fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Profile
          </p>
          {completeness < 100 && (
            <p style={{ margin:'2px 0 0', fontSize:10, color:'#F59E0B' }}>
              +{10-Math.floor(completeness/10)} fields
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Layout ────────────────────────────────────────────────
export default function ProfileLayout() {
  const { session } = useAuth();
  const location    = useLocation();
  const [avatarUrl, setAvatarUrl] = useState(session?.avatarUrl || null);
  const completeness = calcCompleteness({ ...session, avatarUrl });

  const basePath = '/dashboard/my-profile';
  const currentPath = location.pathname.replace(basePath, '') || '';

  return (
    <div style={{ minHeight:'100vh', background:'#080C14', fontFamily:'Crimson Pro, serif', color:'#F0F4FF' }}>
      {/* Hero */}
      <ProfileHeroCard
        session={{ ...session, avatarUrl }}
        completeness={completeness}
        onAvatarUpdate={url => setAvatarUrl(url)}
      />

      {/* Tab navigation */}
      <div style={{
        background:'#0F172A', borderBottom:'1px solid #1E2D4A',
        display:'flex', overflowX:'auto', padding:'0 32px', gap:0,
      }}>
        {TABS.map(tab => {
          const active = (tab.path === '' && currentPath === '') ||
                         (tab.path !== '' && currentPath.startsWith(tab.path));
          return (
            <NavLink
              key={tab.id}
              to={`${basePath}${tab.path}`}
              end={tab.path === ''}
              style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'13px 20px', textDecoration:'none',
                color: active ? '#C9A84C' : '#64748B',
                fontWeight: active ? 700 : 400, fontSize:13,
                borderBottom:`2px solid ${active ? '#C9A84C' : 'transparent'}`,
                transition:'all 0.2s', whiteSpace:'nowrap',
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </NavLink>
          );
        })}
      </div>

      {/* Sub-page content */}
      <Outlet context={{ session: { ...session, avatarUrl }, completeness }} />
    </div>
  );
}
