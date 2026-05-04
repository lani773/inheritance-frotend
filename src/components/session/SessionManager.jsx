/**
 * INHERITANCE CHOIR — Session Manager
 * View active sessions, revoke devices, auto-logout warning, security log.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth }          from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { SESSION }          from '../../config/constants';

// ── Auto-logout countdown warning ─────────────────────────────
export function SessionWarning() {
  const { session, logout, extendSession } = useAuth();
  const [secondsLeft, setSecondsLeft]  = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!session) return;

    const check = () => {
      const loginTime = new Date(session.loginTime).getTime();
      const maxMs     = (SESSION.DEFAULT_HOURS * 60 * 60 * 1000);
      const warnMs    = (SESSION.WARN_BEFORE_MINUTES * 60 * 1000);
      const remaining = (loginTime + maxMs) - Date.now();

      if (remaining <= 0)        { logout(); return; }
      if (remaining <= warnMs)   { setSecondsLeft(Math.floor(remaining / 1000)); }
      else                       { setSecondsLeft(null); }
    };

    check();
    intervalRef.current = setInterval(check, 1000);
    return () => clearInterval(intervalRef.current);
  }, [session, logout]);

  if (secondsLeft === null) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div style={{
      position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)',
      zIndex:9998, width:'100%', maxWidth:420,
      background:'linear-gradient(135deg, #7C2D12, #9A3412)',
      border:'1px solid rgba(251,146,60,0.4)',
      borderRadius:16, padding:'16px 24px',
      boxShadow:'0 16px 48px rgba(0,0,0,0.5)',
      animation:'slideUp 0.4s ease',
      fontFamily:'Crimson Pro, serif',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <span style={{ fontSize:28 }}>⏰</span>
        <div style={{ flex:1 }}>
          <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#FED7AA' }}>
            Session expiring soon
          </p>
          <p style={{ margin:'2px 0 0', fontSize:12, color:'#FB923C' }}>
            Your session will end in {mins}:{String(secs).padStart(2,'0')}
          </p>
        </div>
        <button
          onClick={extendSession}
          style={{
            padding:'8px 16px', background:'rgba(251,146,60,0.2)',
            border:'1px solid rgba(251,146,60,0.4)', borderRadius:8,
            color:'#FED7AA', fontSize:12, fontWeight:700, cursor:'pointer',
          }}
        >
          Stay Signed In
        </button>
      </div>
    </div>
  );
}

// ── Active sessions panel ─────────────────────────────────────
const BROWSER_ICONS = { chrome:'🌐', firefox:'🦊', safari:'🧭', edge:'🌊', unknown:'💻' };
const DEVICE_ICONS  = { mobile:'📱', tablet:'📱', desktop:'💻', unknown:'💻' };

function detectBrowser(ua='') {
  if (ua.includes('Chrome'))  return 'chrome';
  if (ua.includes('Firefox')) return 'firefox';
  if (ua.includes('Safari'))  return 'safari';
  if (ua.includes('Edg'))     return 'edge';
  return 'unknown';
}
function detectDevice(ua='') {
  if (/Mobi/i.test(ua)) return 'mobile';
  if (/Tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

export function SessionsPanel() {
  const { session } = useAuth();
  const { toast }   = useNotifications();

  const [sessions, setSessions] = useState(() => {
    const ua = navigator.userAgent;
    return [
      {
        id: 'current',
        browser: detectBrowser(ua), device: detectDevice(ua),
        ua, ip: '41.206.xxx.xxx', location: 'Kigali, Rwanda',
        loginTime: session?.loginTime || new Date().toISOString(),
        current: true,
      },
      {
        id: 'sess2',
        browser: 'chrome', device: 'mobile',
        ua: 'Chrome/Android', ip: '41.206.xxx.yyy', location: 'Kigali, Rwanda',
        loginTime: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        current: false,
      },
    ];
  });

  const revoke = (id) => {
    setSessions(s => s.filter(x => x.id !== id));
    toast('Session revoked', { type:'success' });
  };

  const revokeAll = () => {
    setSessions(s => s.filter(x => x.current));
    toast('All other sessions revoked', { type:'success' });
  };

  return (
    <div style={{ fontFamily:'Crimson Pro, serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h3 style={{ margin:0, fontSize:16, fontFamily:'Cinzel, serif', color:'#F0F4FF' }}>
          Active Sessions
        </h3>
        {sessions.length > 1 && (
          <button
            onClick={revokeAll}
            style={{
              padding:'6px 14px', background:'rgba(239,68,68,0.1)',
              border:'1px solid rgba(239,68,68,0.3)', borderRadius:8,
              color:'#EF4444', fontSize:12, cursor:'pointer',
            }}
          >
            Revoke All Others
          </button>
        )}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {sessions.map(sess => {
          const browserIcon = BROWSER_ICONS[sess.browser] || BROWSER_ICONS.unknown;
          const deviceIcon  = DEVICE_ICONS[sess.device]   || DEVICE_ICONS.unknown;
          const loginDate   = new Date(sess.loginTime);
          const diffHours   = Math.floor((Date.now() - loginDate.getTime()) / 3600000);

          return (
            <div key={sess.id} style={{
              background: sess.current ? 'rgba(34,197,94,0.06)' : '#0F172A',
              border:`1px solid ${sess.current ? '#22C55E33' : '#1E2D4A'}`,
              borderRadius:16, padding:'18px 20px',
              display:'flex', alignItems:'center', gap:16,
            }}>
              <div style={{
                width:48, height:48, borderRadius:12, flexShrink:0,
                background:'#141E33', border:'1px solid #1E2D4A',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:22,
              }}>
                {deviceIcon}
              </div>

              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:14, color:'#F0F4FF', fontWeight:600 }}>
                    {browserIcon} {sess.browser.charAt(0).toUpperCase()+sess.browser.slice(1)} on {sess.device}
                  </span>
                  {sess.current && (
                    <span style={{
                      fontSize:10, color:'#22C55E', background:'#22C55E11',
                      border:'1px solid #22C55E33', borderRadius:20, padding:'1px 8px', fontWeight:700,
                      display:'flex', alignItems:'center', gap:4,
                    }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:'#22C55E' }} />
                      This device
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, color:'#64748B' }}>📍 {sess.location}</span>
                  <span style={{ fontSize:11, color:'#64748B' }}>
                    🕐 {diffHours < 1 ? 'Just now' : diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours/24)}d ago`}
                  </span>
                  <span style={{ fontSize:11, color:'#374151', fontFamily:'DM Mono, monospace' }}>
                    {sess.ip}
                  </span>
                </div>
              </div>

              {!sess.current && (
                <button
                  onClick={() => revoke(sess.id)}
                  style={{
                    padding:'7px 14px', background:'rgba(239,68,68,0.1)',
                    border:'1px solid rgba(239,68,68,0.25)', borderRadius:8,
                    color:'#EF4444', fontSize:12, cursor:'pointer', flexShrink:0,
                  }}
                >
                  Revoke
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Security Activity Log ──────────────────────────────────────
export function SecurityLog() {
  const [logs] = useState([
    { id:1, action:'Login',          icon:'🔑', time: new Date(Date.now()-3600000).toISOString(),   ip:'41.206.xxx.xxx', success:true  },
    { id:2, action:'Password changed',icon:'🔒', time: new Date(Date.now()-86400000).toISOString(), ip:'41.206.xxx.xxx', success:true  },
    { id:3, action:'Login attempt',  icon:'⚠',  time: new Date(Date.now()-172800000).toISOString(),ip:'197.220.xxx.xxx',success:false },
    { id:4, action:'Login',          icon:'🔑', time: new Date(Date.now()-259200000).toISOString(), ip:'41.206.xxx.xxx', success:true  },
  ]);

  return (
    <div>
      <h3 style={{ margin:'0 0 16px', fontSize:15, fontFamily:'Cinzel, serif', color:'#F0F4FF' }}>
        Security Activity
      </h3>
      <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, overflow:'hidden' }}>
        {logs.map((log, i) => (
          <div key={log.id} style={{
            display:'flex', alignItems:'center', gap:14,
            padding:'12px 18px',
            borderBottom: i < logs.length-1 ? '1px solid #0A1628' : 'none',
            background: !log.success ? 'rgba(239,68,68,0.04)' : 'transparent',
          }}>
            <div style={{
              width:32, height:32, borderRadius:8, flexShrink:0,
              background: log.success ? '#22C55E11' : '#EF444411',
              border:`1px solid ${log.success ? '#22C55E33' : '#EF444433'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14,
            }}>
              {log.icon}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontSize:13, color:'#F0F4FF' }}>{log.action}</p>
              <p style={{ margin:'2px 0 0', fontSize:11, color:'#374151', fontFamily:'DM Mono, monospace' }}>
                {log.ip} · {new Date(log.time).toLocaleString()}
              </p>
            </div>
            <span style={{
              fontSize:10, fontWeight:700,
              color: log.success ? '#22C55E' : '#EF4444',
              background: log.success ? '#22C55E11' : '#EF444411',
              borderRadius:4, padding:'2px 7px',
            }}>
              {log.success ? 'Success' : 'Blocked'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MFA Setup (skeleton for TOTP) ─────────────────────────────
export function MFASetup() {
  const [step, setStep] = useState('prompt'); // prompt | qr | verify | done
  const [code, setCode] = useState('');

  const SECRET = 'JBSWY3DPEHPK3PXP'; // mock TOTP secret

  return (
    <div style={{ maxWidth:400 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h3 style={{ margin:0, fontSize:15, fontFamily:'Cinzel, serif', color:'#F0F4FF' }}>
          Two-Factor Authentication
        </h3>
        {step === 'done' && (
          <span style={{ fontSize:11, color:'#22C55E', background:'#22C55E11', border:'1px solid #22C55E33', borderRadius:20, padding:'3px 10px' }}>
            ✓ Enabled
          </span>
        )}
      </div>

      {step === 'prompt' && (
        <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, padding:20 }}>
          <p style={{ color:'#94A3B8', fontSize:13, lineHeight:1.6, marginBottom:20 }}>
            Add an extra layer of security. Use Google Authenticator or Authy to generate time-based codes.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
            {['Google Authenticator','Authy','Microsoft Authenticator'].map(app => (
              <div key={app} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#C9A84C' }} />
                <span style={{ fontSize:13, color:'#94A3B8' }}>{app}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep('qr')}
            style={{
              width:'100%', padding:'11px',
              background:'linear-gradient(135deg, #A07820, #C9A84C)',
              border:'none', borderRadius:10, color:'#080C14',
              fontSize:13, fontWeight:700, cursor:'pointer',
            }}
          >
            🔐 Enable 2FA
          </button>
        </div>
      )}

      {step === 'qr' && (
        <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, padding:24, textAlign:'center' }}>
          <p style={{ color:'#94A3B8', fontSize:13, marginBottom:20 }}>
            Scan this QR code with your authenticator app:
          </p>
          {/* Mock QR display */}
          <div style={{
            width:160, height:160, background:'#fff', borderRadius:8,
            margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, color:'#64748B',
          }}>
            [QR Code]
          </div>
          <p style={{ fontSize:11, color:'#374151', marginBottom:16 }}>
            Or enter manually: <span style={{ fontFamily:'DM Mono, monospace', color:'#C9A84C', letterSpacing:'0.15em' }}>{SECRET}</span>
          </p>
          <button onClick={() => setStep('verify')} style={{
            width:'100%', padding:'10px', background:'rgba(201,168,76,0.15)',
            border:'1px solid rgba(201,168,76,0.3)', borderRadius:10,
            color:'#C9A84C', fontSize:13, fontWeight:700, cursor:'pointer',
          }}>
            I've scanned it →
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, padding:24 }}>
          <p style={{ color:'#94A3B8', fontSize:13, marginBottom:16 }}>
            Enter the 6-digit code from your authenticator:
          </p>
          <input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
            placeholder="000000"
            style={{
              width:'100%', background:'#141E33', border:'1px solid #1E2D4A',
              borderRadius:10, padding:'14px', color:'#C9A84C',
              fontSize:24, fontWeight:800, textAlign:'center',
              letterSpacing:'0.3em', outline:'none', boxSizing:'border-box',
              fontFamily:'DM Mono, monospace', marginBottom:16,
            }}
          />
          <button
            onClick={() => code.length===6 && setStep('done')}
            disabled={code.length!==6}
            style={{
              width:'100%', padding:'11px',
              background: code.length===6 ? 'linear-gradient(135deg, #A07820, #C9A84C)' : '#1E2D4A',
              border:'none', borderRadius:10, color:'#080C14',
              fontSize:13, fontWeight:700, cursor: code.length===6 ? 'pointer' : 'not-allowed',
            }}
          >
            Verify & Enable
          </button>
        </div>
      )}

      {step === 'done' && (
        <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:16, padding:24, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔐</div>
          <h4 style={{ color:'#22C55E', margin:'0 0 8px', fontFamily:'Cinzel, serif' }}>2FA Enabled!</h4>
          <p style={{ color:'#94A3B8', fontSize:13 }}>
            Your account is now protected with two-factor authentication.
          </p>
        </div>
      )}
    </div>
  );
}
