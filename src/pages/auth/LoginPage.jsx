/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Login Page  (Enhanced v2)

   Design: Holographic glassmorphism · Neon glow · Animated waveform
   Inspired by luxury dark dashboard aesthetic from reference images.

   NEW FEATURES vs v1:
   ✦ Animated SVG sine waveform background (music-themed)
   ✦ Iridescent mesh gradient orb on left panel
   ✦ Typewriter cycling tagline effect
   ✦ Real-time email format validation indicator
   ✦ Password strength meter (4-segment color bar)
   ✦ Custom neon-glow focus input fields (no Input component)
   ✦ Ripple click effect on Sign In button
   ✦ Animated success state (check + scale)
   ✦ Glass morphism form card with rim light
   ✦ Staggered field entrance animations
   ✦ Animated particle notes with depth layers
   ✦ Live countdown ring for rate-limit lock
   ✦ Biometric-style icon pulse on logo
   ✦ Stats counter animation on left panel
   ✦ Smooth tab focus ring (custom outline)
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth }  from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/index';

/* ── Inject keyframes into document once ──────────────────────── */
const STYLES = `
@keyframes waveMove    { from{stroke-dashoffset:0} to{stroke-dashoffset:-400} }
@keyframes noteRise    { 0%{opacity:0;transform:translateY(0) rotate(0deg) scale(0.8)} 30%{opacity:.55} 70%{opacity:.3} 100%{opacity:0;transform:translateY(-90px) rotate(18deg) scale(1.1)} }
@keyframes orbPulse    { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.08);opacity:1} }
@keyframes rimShimmer  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes formSlide   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes fieldSlide  { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
@keyframes successPop  { 0%{transform:scale(0.6);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
@keyframes checkDraw   { from{stroke-dashoffset:80} to{stroke-dashoffset:0} }
@keyframes shake       { 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-7px)} 30%,60%,90%{transform:translateX(7px)} }
@keyframes rippleOut   { from{transform:scale(0);opacity:.4} to{transform:scale(4);opacity:0} }
@keyframes countIn     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes lockPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 70%{box-shadow:0 0 0 10px rgba(239,68,68,0)} }
@keyframes breatheGold { 0%,100%{box-shadow:0 0 30px rgba(201,168,76,.3),0 0 60px rgba(201,168,76,.1)} 50%{box-shadow:0 0 50px rgba(201,168,76,.6),0 0 100px rgba(201,168,76,.2)} }
@keyframes typewriter  { from{width:0} to{width:100%} }
@keyframes blinkCursor { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes floatY      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
`;
function injectStyles() {
  if (document.getElementById('ic-login-styles')) return;
  const s = document.createElement('style');
  s.id = 'ic-login-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ── Password strength evaluator ─────────────────────────────── */
function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let s = 0;
  if (pw.length >= 6)  s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const levels = [
    { score:0, label:'',         color:'transparent' },
    { score:1, label:'Weak',     color:'#EF4444' },
    { score:2, label:'Fair',     color:'#F59E0B' },
    { score:3, label:'Good',     color:'#3B82F6' },
    { score:4, label:'Strong',   color:'#22C55E' },
    { score:5, label:'Perfect',  color:'#C9A84C' },
  ];
  return levels[Math.min(s, 5)];
}

/* ── Animated SVG Waveform ───────────────────────────────────── */
function SineWave({ color='rgba(201,168,76,0.18)', color2='rgba(139,92,246,0.12)', height=120 }) {
  return (
    <svg style={{ position:'absolute', bottom:0, left:0, right:0, width:'100%', pointerEvents:'none' }}
      viewBox="0 0 800 120" preserveAspectRatio="none" height={height}>
      <defs>
        <linearGradient id="wg1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#C9A84C" stopOpacity=".25"/>
          <stop offset="50%"  stopColor="#8B5CF6" stopOpacity=".18"/>
          <stop offset="100%" stopColor="#06B6D4" stopOpacity=".22"/>
        </linearGradient>
      </defs>
      {/* Wave 1 */}
      <path d="M0,60 C133,20 267,100 400,60 C533,20 667,100 800,60 C933,20 1067,100 1200,60"
        fill="none" stroke={color} strokeWidth="1.5"
        style={{ animation:'waveMove 8s linear infinite', strokeDasharray:1200 }} />
      {/* Wave 2 — offset */}
      <path d="M0,80 C100,40 300,110 500,75 C700,40 750,100 800,80"
        fill="none" stroke={color2} strokeWidth="1"
        style={{ animation:'waveMove 12s linear infinite reverse', strokeDasharray:900 }} />
      {/* Fill wave */}
      <path d="M0,90 C200,50 400,110 600,80 C700,65 750,100 800,90 L800,120 L0,120 Z"
        fill="url(#wg1)" />
    </svg>
  );
}

/* ── Typewriter hook ─────────────────────────────────────────── */
function useTypewriter(phrases, speed=55, pause=2400) {
  const [text, setText] = useState('');
  const [idx, setIdx]   = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = phrases[idx % phrases.length];
    const timer = setTimeout(() => {
      if (!deleting) {
        setText(current.slice(0, text.length + 1));
        if (text.length + 1 === current.length) {
          setTimeout(() => setDeleting(true), pause);
        }
      } else {
        setText(current.slice(0, text.length - 1));
        if (text.length === 0) {
          setDeleting(false);
          setIdx(i => i + 1);
        }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timer);
  }, [text, deleting, idx]);
  return text;
}

/* ── Animated counter ───────────────────────────────────────── */
function Counter({ to, suffix='' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = to / 40;
    const t = setInterval(() => {
      n += step;
      if (n >= to) { setVal(to); clearInterval(t); }
      else setVal(Math.floor(n));
    }, 30);
    return () => clearInterval(t);
  }, [to]);
  return <>{val}{suffix}</>;
}

/* ── Floating music note ─────────────────────────────────────── */
function Note({ char, x, y, size, delay, duration }) {
  return (
    <span aria-hidden style={{
      position:'absolute', left:`${x}%`, top:`${y}%`,
      fontSize:size, color:'var(--gold)', pointerEvents:'none',
      animation:`noteRise ${duration}s ease-in-out ${delay}s infinite`,
      opacity:0,
    }}>{char}</span>
  );
}

/* ── Custom glass input field ────────────────────────────────── */
function GlassInput({ label, type='text', value, onChange, placeholder, icon, rightEl, disabled, autoFocus, name, valid }) {
  const [focused, setFocused] = useState(false);
  const borderColor = focused
    ? valid === false ? '#EF4444' : valid === true ? '#22C55E' : '#C9A84C'
    : valid === false ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)';
  const glow = focused
    ? valid === false ? '0 0 0 3px rgba(239,68,68,0.15)' : valid === true ? '0 0 0 3px rgba(34,197,94,0.15)' : '0 0 0 3px rgba(201,168,76,0.18)'
    : 'none';

  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:9,
        color: focused ? '#C9A84C' : 'rgba(148,163,184,0.8)',
        letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:7,
        transition:'color 0.2s' }}>{label}</label>
      <div style={{ position:'relative' }}>
        {icon && (
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
            fontSize:14, pointerEvents:'none', opacity: focused ? 1 : 0.5,
            transition:'opacity 0.2s' }}>{icon}</span>
        )}
        <input
          name={name} type={type} value={value} placeholder={placeholder}
          disabled={disabled} autoFocus={autoFocus} autoComplete={type==='email'?'email':'current-password'}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          style={{
            width:'100%', boxSizing:'border-box',
            padding: `13px 14px 13px ${icon ? 42 : 16}px`,
            paddingRight: rightEl ? 48 : 16,
            background:'rgba(255,255,255,0.04)',
            backdropFilter:'blur(12px)',
            border:`1px solid ${borderColor}`,
            borderRadius:14, outline:'none',
            color:'#F0F4FF', fontSize:13,
            fontFamily:'var(--font-body)',
            transition:'border-color 0.25s, box-shadow 0.25s',
            boxShadow: glow,
          }}
        />
        {rightEl && (
          <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)' }}>
            {rightEl}
          </div>
        )}
        {/* Valid tick */}
        {valid === true && !focused && (
          <svg style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)' }}
            width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="rgba(34,197,94,0.15)" stroke="#22C55E" strokeWidth="1"/>
            <path d="M4.5 8L7 10.5L11.5 5.5" fill="none" stroke="#22C55E" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray:80, animation:'checkDraw 0.3s ease both' }}/>
          </svg>
        )}
      </div>
    </div>
  );
}

/* ── Password strength bar ───────────────────────────────────── */
function StrengthBar({ password }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop:-10, marginBottom:16, animation:'fieldSlide 0.2s ease both' }}>
      <div style={{ display:'flex', gap:4, marginBottom:5 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex:1, height:3, borderRadius:3,
            background: i <= score ? color : 'rgba(255,255,255,0.07)',
            transition:'background 0.3s ease',
            boxShadow: i <= score ? `0 0 6px ${color}60` : 'none',
          }}/>
        ))}
      </div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color, letterSpacing:'0.1em',
        opacity:0.9, animation:'countIn 0.2s ease both' }}>{label}</div>
    </div>
  );
}

/* ── Countdown ring ──────────────────────────────────────────── */
function CountdownRing({ seconds, total }) {
  const r = 20, circ = 2 * Math.PI * r;
  const dash = (seconds / total) * circ;
  return (
    <svg width={50} height={50} viewBox="0 0 50 50">
      <circle cx={25} cy={25} r={r} fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth={3}/>
      <circle cx={25} cy={25} r={r} fill="none" stroke="#EF4444" strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 25 25)"
        style={{ transition:'stroke-dasharray 1s linear', filter:'drop-shadow(0 0 4px #EF4444)' }}/>
      <text x={25} y={29} textAnchor="middle" fill="#EF4444"
        style={{ fontFamily:'DM Mono,monospace', fontSize:10, fontWeight:700 }}>
        {String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}
      </text>
    </svg>
  );
}

/* ── Ripple button ───────────────────────────────────────────── */
function SignInButton({ onClick, loading, disabled, success }) {
  const [ripple, setRipple] = useState(null);
  const btnRef = useRef(null);

  const handleClick = (e) => {
    if (disabled || loading) return;
    const rect = btnRef.current.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 700);
    onClick(e);
  };

  return (
    <button ref={btnRef} onClick={handleClick} disabled={disabled || loading}
      type="submit"
      style={{
        width:'100%', height:52, borderRadius:14, border:'none',
        position:'relative', overflow:'hidden', cursor: disabled ? 'not-allowed' : 'pointer',
        background: success
          ? 'linear-gradient(135deg, #22C55E, #16A34A)'
          : disabled
          ? 'rgba(255,255,255,0.05)'
          : 'linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #A07820 100%)',
        color: disabled ? 'rgba(255,255,255,0.3)' : '#080C14',
        fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700,
        letterSpacing:'0.12em', textTransform:'uppercase',
        transition:'all 0.3s ease',
        boxShadow: success
          ? '0 0 30px rgba(34,197,94,0.4), 0 4px 20px rgba(0,0,0,0.4)'
          : disabled
          ? 'none'
          : '0 0 24px rgba(201,168,76,0.35), 0 4px 20px rgba(0,0,0,0.4)',
        transform: success ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Shimmer overlay */}
      {!disabled && !success && (
        <div style={{ position:'absolute', inset:0, borderRadius:14,
          background:'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
          backgroundSize:'200% 100%',
          animation:'rimShimmer 3s linear infinite' }}/>
      )}

      {/* Ripple */}
      {ripple && (
        <span style={{
          position:'absolute', left:ripple.x, top:ripple.y,
          width:8, height:8, marginLeft:-4, marginTop:-4,
          borderRadius:'50%', background:'rgba(255,255,255,0.6)',
          animation:'rippleOut 0.7s ease both',
        }}/>
      )}

      <span style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        {loading ? (
          <>
            <svg width={16} height={16} viewBox="0 0 16 16" style={{ animation:'spin 0.8s linear infinite' }}>
              <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2"/>
              <path d="M8 2A6 6 0 0 1 14 8" fill="none" stroke="#080C14" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Signing In…
          </>
        ) : success ? (
          <>
            <svg width={18} height={18} viewBox="0 0 18 18">
              <circle cx="9" cy="9" r="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
              <path d="M5 9L7.5 11.5L13 6" fill="none" stroke="white" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray:80, animation:'checkDraw 0.4s ease both' }}/>
            </svg>
            Welcome Back!
          </>
        ) : (
          <>Sign In <span style={{ marginLeft:4, fontSize:16 }}>→</span></>
        )}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  injectStyles();

  const { login }            = useAuth();
  const { success: toastOK } = useToast();
  const navigate             = useNavigate();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [shaking,    setShaking]    = useState(false);
  const [countdown,  setCountdown]  = useState(0);
  const [countdownMax, setCountdownMax] = useState(0);
  const [success,    setSuccess]    = useState(false);
  const timerRef = useRef(null);

  const tagline = useTypewriter([
    'Voices united in worship…',
    'Managing your choir, beautifully.',
    'Track. Connect. Grow.',
    'Sacred music, modern tools.',
  ], 55, 2600);

  /* Email validation */
  const emailValid = email.length > 0 ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : undefined;

  /* Countdown */
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current); return 0; } return c - 1; });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [countdown]);

  const shake = (msg) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!email.trim() || !password) { shake('Please fill in all fields'); return; }
    if (emailValid === false) { shake('Please enter a valid email address'); return; }

    const limit = authService.checkRateLimit(email);
    if (limit.blocked) {
      setCountdownMax(limit.remainingSecs);
      setCountdown(limit.remainingSecs);
      shake('Too many failed attempts. Please wait.');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login(email, password, rememberMe);
      authService.clearAttempts(email);
      setSuccess(true);
      setTimeout(() => {
        login(user, rememberMe);
        toastOK(`Welcome back, ${user.fullName.split(' ')[0]}! 🎉`);
        navigate('/dashboard', { replace: true });
      }, 900);
    } catch (err) {
      authService.recordFailedAttempt(email);
      shake(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('inheritancechoir@gmail.com');
    setPassword('Umurage123.');
    setError('');
  };

  const isLocked = countdown > 0;

  /* Music notes data */
  const notes = [
    { char:'♪', x:8,  y:18, size:28, delay:0,   duration:7  },
    { char:'♫', x:74, y:10, size:20, delay:2.5, duration:9  },
    { char:'♬', x:35, y:52, size:36, delay:4.8, duration:8  },
    { char:'♩', x:85, y:62, size:16, delay:1.2, duration:11 },
    { char:'♪', x:18, y:80, size:15, delay:3.3, duration:6  },
    { char:'𝄞', x:55, y:6,  size:32, delay:5.5, duration:10 },
    { char:'♬', x:62, y:78, size:22, delay:0.8, duration:7.5},
    { char:'♩', x:4,  y:42, size:12, delay:6,   duration:13 },
    { char:'♪', x:48, y:35, size:18, delay:2,   duration:9.5},
  ];

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg-base)',
      display:'flex', fontFamily:'var(--font-body)',
      overflow:'hidden', position:'relative',
    }}>

      {/* ════════════════════════════════════════════════════
          LEFT PANEL — Branding
         ════════════════════════════════════════════════════ */}
      <div style={{
        flex:'0 0 46%',
        background:'linear-gradient(155deg, #0B1628 0%, #080C14 50%, #0A1020 100%)',
        position:'relative', overflow:'hidden',
        display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'60px 56px',
      }}
        className="hide-mobile"
      >
        {/* Background radial mesh */}
        <div style={{ position:'absolute', top:'-15%', left:'-10%', width:'70%', height:'70%',
          borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%)',
          animation:'orbPulse 6s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', bottom:'-10%', right:'-5%', width:'55%', height:'55%',
          borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)',
          animation:'orbPulse 8s ease-in-out 3s infinite' }}/>

        {/* Staff lines */}
        {[16,28,40,52,64].map((t,i) => (
          <div key={i} aria-hidden style={{
            position:'absolute', left:0, right:0, top:`${t}%`, height:1,
            background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.18) 25%,rgba(201,168,76,0.18) 75%,transparent)',
            pointerEvents:'none',
          }}/>
        ))}

        {/* Iridescent rim on right edge */}
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:1,
          background:'linear-gradient(180deg,transparent,rgba(201,168,76,0.5) 30%,rgba(139,92,246,0.4) 60%,transparent)',
          animation:'rimShimmer 4s linear infinite' }}/>

        {/* Animated music notes */}
        {notes.map((n,i) => <Note key={i} {...n} />)}

        {/* Sine wave at bottom */}
        <SineWave />

        {/* Main content */}
        <div style={{ position:'relative', zIndex:2 }}>

          {/* Logo */}
          <div style={{
            width:72, height:72, borderRadius:'50%',
            background:'linear-gradient(135deg, #A07820 0%, #C9A84C 50%, #E8C96A 100%)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:36, marginBottom:26,
            boxShadow:'0 0 40px rgba(201,168,76,0.5), 0 0 80px rgba(201,168,76,0.15)',
            animation:'breatheGold 4s ease-in-out infinite',
          }}>♪</div>

          {/* Brand name */}
          <h1 style={{
            fontFamily:'var(--font-heading)',
            fontSize:'clamp(28px, 2.8vw, 42px)',
            fontWeight:900,
            background:'linear-gradient(135deg, #C9A84C 0%, #F5E4A8 45%, #E8C96A 75%, #A07820 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            backgroundClip:'text',
            letterSpacing:'0.05em', lineHeight:1.05, marginBottom:14,
          }}>INHERITANCE<br/>CHOIR</h1>

          {/* Typewriter tagline */}
          <div style={{ fontFamily:'var(--font-body)', fontSize:13, fontStyle:'italic',
            color:'var(--text-secondary)', marginBottom:48, lineHeight:1.7, minHeight:24,
            display:'flex', alignItems:'center', gap:2 }}>
            <span>{tagline}</span>
            <span style={{ display:'inline-block', width:1.5, height:14, background:'var(--gold)',
              animation:'blinkCursor 1s step-end infinite', verticalAlign:'middle', marginLeft:1 }}/>
          </div>

          {/* Feature list */}
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {[
              { icon:'✅', title:'Smart Attendance', desc:'QR check-in, excused requests, streak tracking', delay:'0.1s' },
              { icon:'💰', title:'Financial Management', desc:'Tithe records, PDF receipts, budget goals', delay:'0.2s' },
              { icon:'🎵', title:'Songs & Rehearsals', desc:'Lyrics display, audio players, rehearsal mode', delay:'0.3s' },
              { icon:'💬', title:'Team Communication', desc:'Broadcasts, announcements, prayer board', delay:'0.4s' },
            ].map((f,i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:14,
                animation:`fadeRight 0.5s ease ${f.delay} both` }}>
                <div style={{
                  width:40, height:40, borderRadius:12, flexShrink:0,
                  background:'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))',
                  border:'1px solid rgba(201,168,76,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:17,
                  boxShadow:'0 0 12px rgba(201,168,76,0.15)',
                }}>{f.icon}</div>
                <div>
                  <div style={{ fontFamily:'var(--font-heading)', fontSize:12, fontWeight:700, color:'var(--text-primary)', marginBottom:2 }}>{f.title}</div>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)', lineHeight:1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display:'flex', gap:10, marginTop:44, flexWrap:'wrap' }}>
            {[
              { to:50, suffix:'+', label:'Members' },
              { to:18, suffix:'',  label:'Modules' },
              { to:100,suffix:'%', label:'Offline Ready' },
            ].map(({ to, suffix, label }) => (
              <div key={label} style={{
                background:'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))',
                border:'1px solid rgba(201,168,76,0.2)',
                borderRadius:40, padding:'8px 18px', textAlign:'center',
                boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)',
                animation:'countIn 0.6s ease both',
              }}>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:900, color:'var(--gold)' }}>
                  <Counter to={to} suffix={suffix} />
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, color:'var(--text-muted)', letterSpacing:'0.12em', textTransform:'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          RIGHT PANEL — Login Form
         ════════════════════════════════════════════════════ */}
      <div style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        padding:'40px 24px', overflowY:'auto', position:'relative',
      }}>

        {/* Subtle background glow */}
        <div style={{ position:'absolute', top:'30%', left:'30%', width:300, height:300,
          borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(ellipse, rgba(201,168,76,0.04) 0%, transparent 70%)' }}/>

        <div style={{ width:'100%', maxWidth:430, animation:'formSlide 0.45s ease both' }}>

          {/* Mobile logo */}
          <div style={{ textAlign:'center', marginBottom:28 }} className="show-mobile-only">
            <div style={{ width:56, height:56, borderRadius:'50%', margin:'0 auto 12px',
              background:'linear-gradient(135deg,#A07820,#C9A84C)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:28, boxShadow:'0 0 30px rgba(201,168,76,0.4)' }}>♪</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--gold)', letterSpacing:'0.2em' }}>
              INHERITANCE CHOIR
            </div>
          </div>

          {/* Heading */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <h2 style={{ fontFamily:'var(--font-heading)', fontSize:30, fontWeight:700,
              color:'var(--text-primary)', marginBottom:6, letterSpacing:'0.02em' }}>
              Welcome Back
            </h2>
            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
              Sign in to manage INHERITANCE CHOIR
            </p>
          </div>

          {/* Glass form card */}
          <div style={{
            background:'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter:'blur(24px)',
            border:'1px solid rgba(255,255,255,0.09)',
            borderRadius:22,
            padding:'30px 28px',
            boxShadow:'0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            position:'relative', overflow:'hidden',
            animation: shaking ? 'shake 0.55s ease' : 'none',
          }}>

            {/* Card top rim */}
            <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:1,
              background:'linear-gradient(90deg, transparent, rgba(201,168,76,0.6), rgba(139,92,246,0.4), transparent)',
              animation:'rimShimmer 4s linear infinite' }}/>

            {/* ── Rate-limit lockout ── */}
            {isLocked && (
              <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px',
                background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)',
                borderRadius:14, marginBottom:20,
                animation:'lockPulse 2s ease infinite' }}>
                <CountdownRing seconds={countdown} total={countdownMax || 900} />
                <div>
                  <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'#EF4444',
                    letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:3 }}>
                    🔒 Account Locked
                  </div>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(239,68,68,0.7)', lineHeight:1.5 }}>
                    Too many failed attempts.<br/>Please wait for the timer.
                  </div>
                </div>
              </div>
            )}

            {/* ── Error banner ── */}
            {error && !isLocked && (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
                background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)',
                borderLeft:'3px solid #EF4444', borderRadius:12, marginBottom:20,
                animation:'formSlide 0.2s ease both' }}>
                <span style={{ fontSize:14, flexShrink:0 }}>⚠️</span>
                <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(239,68,68,0.9)', lineHeight:1.5 }}>
                  {error}
                </span>
              </div>
            )}

            {/* ── Fields ── */}
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ animation:'fieldSlide 0.3s ease 0.05s both' }}>
                <GlassInput
                  label="Email Address" type="email" name="email"
                  value={email} onChange={setEmail}
                  placeholder="your.email@example.com"
                  icon="✉️" disabled={isLocked} autoFocus
                  valid={email.length > 0 ? emailValid : undefined}
                />
              </div>

              <div style={{ animation:'fieldSlide 0.3s ease 0.12s both' }}>
                <GlassInput
                  label="Password"
                  type={showPass ? 'text' : 'password'} name="password"
                  value={password} onChange={setPassword}
                  placeholder="Enter your password"
                  icon="🔑" disabled={isLocked}
                  rightEl={
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, padding:2,
                        color:'rgba(148,163,184,0.6)', transition:'color 0.2s' }}
                      onMouseEnter={e=>e.currentTarget.style.color='var(--gold)'}
                      onMouseLeave={e=>e.currentTarget.style.color='rgba(148,163,184,0.6)'}
                    >{showPass ? '🙈' : '👁️'}</button>
                  }
                />
              </div>

              {/* Password strength */}
              <StrengthBar password={password} />

              {/* Remember me + Forgot */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24,
                animation:'fieldSlide 0.3s ease 0.18s both' }}>
                <label style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer' }}>
                  {/* Custom checkbox */}
                  <div onClick={() => setRememberMe(v => !v)}
                    style={{ width:18, height:18, borderRadius:5, flexShrink:0,
                      background: rememberMe ? 'linear-gradient(135deg,#A07820,#C9A84C)' : 'rgba(255,255,255,0.05)',
                      border: rememberMe ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.15)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'all 0.2s ease',
                      boxShadow: rememberMe ? '0 0 8px rgba(201,168,76,0.4)' : 'none',
                      cursor:'pointer',
                    }}>
                    {rememberMe && (
                      <svg width={10} height={10} viewBox="0 0 10 10">
                        <path d="M1.5 5L4 7.5L8.5 2.5" fill="none" stroke="#080C14" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"
                          style={{ strokeDasharray:20, animation:'checkDraw 0.25s ease both' }}/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-secondary)', userSelect:'none' }}>
                    Remember me for 30 days
                  </span>
                </label>
                <Link to="/forgot-password" style={{
                  fontFamily:'var(--font-body)', fontSize:12, color:'var(--gold)',
                  textDecoration:'none', borderBottom:'1px solid rgba(201,168,76,0.3)',
                  paddingBottom:1, transition:'border-color 0.2s',
                }}>Forgot password?</Link>
              </div>

              {/* Sign in button */}
              <div style={{ animation:'fieldSlide 0.3s ease 0.24s both' }}>
                <SignInButton
                  onClick={handleSubmit}
                  loading={loading} disabled={isLocked} success={success}
                />
              </div>
            </form>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:12, margin:'22px 0' }}>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }}/>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:'0.14em' }}>OR</span>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }}/>
            </div>

            {/* Create account */}
            <button onClick={() => navigate('/register')} type="button"
              style={{ width:'100%', height:46, borderRadius:14, cursor:'pointer',
                background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.09)',
                color:'var(--text-secondary)', fontFamily:'var(--font-body)', fontSize:13,
                transition:'all 0.2s ease',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.borderColor='rgba(255,255,255,0.15)';e.currentTarget.style.color='var(--text-primary)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.03)';e.currentTarget.style.borderColor='rgba(255,255,255,0.09)';e.currentTarget.style.color='var(--text-secondary)';}}
            >
              Create a New Account
            </button>
          </div>

          {/* ── Demo credentials box ── */}
          <div onClick={fillDemo} role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fillDemo()}
            style={{ marginTop:18, padding:'14px 20px', borderRadius:16, cursor:'pointer',
              background:'rgba(59,130,246,0.07)',
              border:'1px solid rgba(59,130,246,0.2)',
              transition:'all 0.2s ease',
            }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(59,130,246,0.12)';e.currentTarget.style.borderColor='rgba(59,130,246,0.4)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(59,130,246,0.07)';e.currentTarget.style.borderColor='rgba(59,130,246,0.2)';}}
          >
            <div style={{ fontFamily:'var(--font-heading)', fontSize:9, color:'#60A5FA',
              letterSpacing:'0.16em', textTransform:'uppercase', marginBottom:8 }}>
              ℹ️ Demo — Click to auto-fill
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {[
                { icon:'📧', val:'inheritancechoir@gmail.com' },
                { icon:'🔑', val:'Umurage123.' },
              ].map(({icon, val}) => (
                <div key={val} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12 }}>{icon}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(148,163,184,0.8)' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <p style={{ textAlign:'center', marginTop:20, fontFamily:'var(--font-body)', fontSize:11,
            color:'var(--text-muted)', lineHeight:1.6 }}>
            By signing in you agree to our{' '}
            <span style={{ color:'var(--gold)', cursor:'pointer' }}>Terms of Service</span>
            {' '}and{' '}
            <span style={{ color:'var(--gold)', cursor:'pointer' }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
