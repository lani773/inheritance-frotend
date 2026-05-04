/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Register Page  (Enhanced v2)

   Design: Holographic glassmorphism · Neon glow · Animated wizard
   Inspired by reference dashboard aesthetic.

   Steps:
   1 — Personal Info     (name, phone, DOB + live age, gender, voice)
   2 — Credentials       (email, password strength v2, confirm match)
   3 — OTP Verification  (neon 6-box, ring timer, paste support)
   4 — Success           (confetti burst, animated approval timeline)

   NEW vs v1:
   ✦ Holographic glass card with animated iridescent rim
   ✦ Animated step rail with glow connectors + pulse ring on active
   ✦ Background floating music notes + mesh orbs
   ✦ Animated sine waveform in background
   ✦ Per-step slide-in transitions
   ✦ Voice part cards: animated sound-wave bars + neon glow
   ✦ Live age calculator from DOB
   ✦ Custom glass inputs with live validation ticks
   ✦ 5-bar neon password strength + rule checklist
   ✦ Live confirm-password match indicator
   ✦ OTP boxes: neon glow on fill, shake on wrong, ring countdown
   ✦ Progress dot indicator per OTP digit
   ✦ Confetti burst on success (pure CSS)
   ✦ Animated approval timeline with pulsing dot
   ✦ Custom gold checkbox with SVG draw animation
   ✦ Step 2 summary card of step 1 data
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService }   from '../../services/index';
import { VOICE_PARTS, GENDERS, MARITAL_STATUS } from '../../config/constants';
import {
  getPasswordStrength, validateRegistration, maskEmail, isValidEmail,
} from '../../utils/index';

/* ── Inject global keyframes once ────────────────────────────── */
const STYLES = `
@keyframes regFormIn  { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
@keyframes regFieldIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes noteRise2  { 0%{opacity:0;transform:translateY(0) rotate(0deg)} 30%{opacity:.4} 70%{opacity:.2} 100%{opacity:0;transform:translateY(-80px) rotate(15deg)} }
@keyframes orbFloat   { 0%,100%{transform:scale(1) translateY(0);opacity:.6} 50%{transform:scale(1.06) translateY(-8px);opacity:.9} }
@keyframes waveScroll { from{stroke-dashoffset:0} to{stroke-dashoffset:-400} }
@keyframes rimSweep   { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes shakeBox   { 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-6px)} 30%,60%,90%{transform:translateX(6px)} }
@keyframes checkDraw2 { from{stroke-dashoffset:80} to{stroke-dashoffset:0} }
@keyframes popIn      { 0%{transform:scale(0.5);opacity:0} 65%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
@keyframes goldBreath { 0%,100%{box-shadow:0 0 30px rgba(201,168,76,.3),0 0 60px rgba(201,168,76,.1)} 50%{box-shadow:0 0 55px rgba(201,168,76,.6),0 0 100px rgba(201,168,76,.2)} }
@keyframes waveBar    { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }
@keyframes confettiFall { 0%{opacity:1;transform:translateY(-10px) rotate(0deg)} 100%{opacity:0;transform:translateY(160px) rotate(720deg)} }
@keyframes successRing  { 0%{stroke-dashoffset:264;opacity:0} 100%{stroke-dashoffset:0;opacity:1} }
@keyframes dotPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,.5)} 70%{box-shadow:0 0 0 8px rgba(201,168,76,0)} }
@keyframes spin2      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;
function injectStyles() {
  if (document.getElementById('ic-reg-styles')) return;
  const s = document.createElement('style');
  s.id = 'ic-reg-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ── Background wave ─────────────────────────────────────────── */
function WaveBg() {
  return (
    <svg style={{ position:'fixed',bottom:0,left:0,right:0,width:'100%',pointerEvents:'none',zIndex:0,opacity:0.5 }}
      viewBox="0 0 800 80" preserveAspectRatio="none" height={80}>
      <defs>
        <linearGradient id="rwg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#C9A84C" stopOpacity=".2"/>
          <stop offset="50%"  stopColor="#8B5CF6" stopOpacity=".15"/>
          <stop offset="100%" stopColor="#06B6D4" stopOpacity=".18"/>
        </linearGradient>
      </defs>
      <path d="M0,40 C200,10 400,70 600,40 C700,25 750,55 800,40" fill="none"
        stroke="url(#rwg)" strokeWidth="1.5"
        style={{ animation:'waveScroll 10s linear infinite', strokeDasharray:900 }}/>
      <path d="M0,55 C150,30 350,75 550,50 C700,32 750,65 800,55 L800,80 L0,80 Z"
        fill="rgba(201,168,76,0.04)"/>
    </svg>
  );
}

/* ── Floating note ───────────────────────────────────────────── */
function Note({ char, x, y, size, delay, duration }) {
  return (
    <span aria-hidden style={{ position:'fixed', left:`${x}%`, top:`${y}%`, fontSize:size,
      color:'rgba(201,168,76,0.45)', pointerEvents:'none', zIndex:0,
      animation:`noteRise2 ${duration}s ease-in-out ${delay}s infinite`, opacity:0 }}>
      {char}
    </span>
  );
}

/* ── Confetti ────────────────────────────────────────────────── */
function Confetti() {
  const pieces = useMemo(() => Array.from({ length:40 }, (_,i) => ({
    id:i, x:Math.random()*100,
    color:['#C9A84C','#8B5CF6','#3B82F6','#22C55E','#EC4899','#F59E0B','#06B6D4'][i%7],
    size:6+Math.random()*8, delay:Math.random()*0.8,
    duration:1.2+Math.random()*1, shape:i%3,
  })), []);
  return (
    <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:50,overflow:'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.x}%`, top:'-20px',
          width:p.shape===0?p.size:p.size*0.6, height:p.shape===0?p.size*0.5:p.size,
          borderRadius:p.shape===2?'50%':2, background:p.color,
          animation:`confettiFall ${p.duration}s ease-in ${p.delay}s both`,
          boxShadow:`0 0 6px ${p.color}60`,
        }}/>
      ))}
    </div>
  );
}

/* ── Sound wave bars ─────────────────────────────────────────── */
function SoundWave({ color, active }) {
  const bars = [0.4,0.7,1.0,0.7,0.4,0.8,0.5,0.9,0.6,0.4];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2, height:20 }}>
      {bars.map((h,i) => (
        <div key={i} style={{ width:2.5, height:20*h, borderRadius:2,
          background: active ? color : 'rgba(255,255,255,0.12)',
          transition:'background 0.3s ease',
          animation: active ? `waveBar ${0.6+i*0.07}s ease-in-out ${i*0.06}s infinite` : 'none',
          transformOrigin:'bottom center' }}/>
      ))}
    </div>
  );
}

/* ── Step rail ───────────────────────────────────────────────── */
function StepRail({ step }) {
  const steps = [
    {n:1,label:'Personal',icon:'👤'},
    {n:2,label:'Credentials',icon:'🔑'},
    {n:3,label:'Verify',icon:'✉️'},
    {n:4,label:'Done',icon:'🎉'},
  ];
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', gap:0, marginBottom:34 }}>
      {steps.map((s,i) => {
        const done=step>s.n, active=step===s.n;
        const color=done?'#22C55E':active?'#C9A84C':'rgba(255,255,255,0.15)';
        return (
          <React.Fragment key={s.n}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, position:'relative' }}>
              {active && (
                <div style={{ position:'absolute',top:-4,left:-4,width:44,height:44,
                  borderRadius:'50%', background:'rgba(201,168,76,0.12)',
                  animation:'dotPulse 2s ease infinite' }}/>
              )}
              <div style={{ width:36,height:36,borderRadius:'50%',zIndex:1,
                background:done?'linear-gradient(135deg,#16A34A,#22C55E)':active?'linear-gradient(135deg,#A07820,#C9A84C)':'rgba(255,255,255,0.05)',
                border:`2px solid ${color}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:done?14:13, fontFamily:'var(--font-mono)', fontWeight:700,
                color:done||active?'#080C14':'rgba(255,255,255,0.3)',
                transition:'all 0.4s ease',
                boxShadow:active?'0 0 20px rgba(201,168,76,0.5)':done?'0 0 14px rgba(34,197,94,0.4)':'none',
              }}>
                {done?(
                  <svg width={14} height={14} viewBox="0 0 14 14">
                    <path d="M2 7L5.5 10.5L12 3.5" fill="none" stroke="#080C14" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{ strokeDasharray:25, animation:'checkDraw2 0.4s ease both' }}/>
                  </svg>
                ):active?s.icon:s.n}
              </div>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.1em',
                textTransform:'uppercase', color:active?'#C9A84C':done?'#22C55E':'rgba(255,255,255,0.25)',
                transition:'color 0.4s', whiteSpace:'nowrap' }}>{s.label}</span>
            </div>
            {i<steps.length-1&&(
              <div style={{ width:52,height:2,margin:'17px 0 0',flexShrink:0,borderRadius:2,
                background:step>s.n?'linear-gradient(90deg,#22C55E,#16A34A)':'rgba(255,255,255,0.08)',
                transition:'background 0.5s ease',
                boxShadow:step>s.n?'0 0 8px rgba(34,197,94,0.4)':'none' }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Glass input ─────────────────────────────────────────────── */
function GlassField({ label, type='text', value, onChange, placeholder, icon, rightEl,
  disabled, autoFocus, error, valid }) {
  const [focused, setFocused] = useState(false);
  const borderColor = error?'rgba(239,68,68,0.7)':focused?
    (valid===false?'rgba(239,68,68,0.7)':valid===true?'rgba(34,197,94,0.8)':'rgba(201,168,76,0.8)'):
    (valid===true?'rgba(34,197,94,0.4)':'rgba(255,255,255,0.1)');
  const glow=focused?
    (error||valid===false?'0 0 0 3px rgba(239,68,68,0.12)':valid===true?'0 0 0 3px rgba(34,197,94,0.12)':'0 0 0 3px rgba(201,168,76,0.15)')
    :'none';
  return (
    <div style={{ marginBottom:error?4:16 }}>
      {label&&(
        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:9,
          color:focused?'#C9A84C':error?'#EF4444':'rgba(148,163,184,0.8)',
          letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:7, transition:'color 0.2s' }}>
          {label}
        </label>
      )}
      <div style={{ position:'relative' }}>
        {icon&&(
          <span style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',
            fontSize:14,pointerEvents:'none',opacity:focused?1:0.45,transition:'opacity 0.2s' }}>{icon}</span>
        )}
        <input type={type} value={value} placeholder={placeholder}
          disabled={disabled} autoFocus={autoFocus}
          onChange={e=>onChange(e.target.value)}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{ width:'100%', boxSizing:'border-box',
            padding:`12px 14px 12px ${icon?40:14}px`,
            paddingRight:(rightEl||valid!==undefined)?46:14,
            background:'rgba(255,255,255,0.04)', backdropFilter:'blur(12px)',
            border:`1px solid ${borderColor}`, borderRadius:13, outline:'none',
            color:'#F0F4FF', fontSize:13, fontFamily:'var(--font-body)',
            transition:'border-color 0.25s, box-shadow 0.25s', boxShadow:glow,
          }}/>
        {rightEl&&(
          <div style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)' }}>{rightEl}</div>
        )}
        {!rightEl&&valid===true&&(
          <svg style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)' }}
            width={16} height={16} viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="rgba(34,197,94,0.15)" stroke="#22C55E" strokeWidth="1"/>
            <path d="M4.5 8L7 10.5L11.5 5.5" fill="none" stroke="#22C55E" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray:20, animation:'checkDraw2 0.3s ease both' }}/>
          </svg>
        )}
        {!rightEl&&valid===false&&value&&(
          <span style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',
            color:'#EF4444',fontSize:13 }}>✕</span>
        )}
      </div>
      {error&&<p style={{ fontFamily:'var(--font-body)',fontSize:11,color:'#EF4444',marginTop:5,marginBottom:12 }}>⚠ {error}</p>}
    </div>
  );
}

/* ── Password strength meter ─────────────────────────────────── */
function StrengthMeter({ password }) {
  const rules=[
    {label:'8+ characters',   pass:password.length>=8},
    {label:'Uppercase',       pass:/[A-Z]/.test(password)},
    {label:'Lowercase',       pass:/[a-z]/.test(password)},
    {label:'Number',          pass:/[0-9]/.test(password)},
    {label:'Special char',    pass:/[^A-Za-z0-9]/.test(password)},
  ];
  const score=rules.filter(r=>r.pass).length;
  const levels=[
    {color:'transparent',label:''},
    {color:'#EF4444',label:'Too Weak'},
    {color:'#F59E0B',label:'Weak'},
    {color:'#3B82F6',label:'Good'},
    {color:'#22C55E',label:'Strong'},
    {color:'#C9A84C',label:'Perfect ✦'},
  ];
  const {color,label}=levels[score]||levels[0];
  if(!password) return null;
  return (
    <div style={{ marginBottom:14, animation:'regFieldIn 0.2s ease both' }}>
      <div style={{ display:'flex',gap:4,marginBottom:6 }}>
        {[1,2,3,4,5].map(i=>(
          <div key={i} style={{ flex:1,height:3,borderRadius:3,
            background:i<=score?color:'rgba(255,255,255,0.07)',
            transition:'background 0.3s ease',
            boxShadow:i<=score?`0 0 6px ${color}60`:'none' }}/>
        ))}
      </div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8 }}>
        <span style={{ fontFamily:'var(--font-mono)',fontSize:9,color,letterSpacing:'0.1em',
          textTransform:'uppercase',fontWeight:700 }}>{label}</span>
        <div style={{ display:'flex',flexWrap:'wrap',justifyContent:'flex-end',gap:'2px 8px' }}>
          {rules.map(r=>(
            <span key={r.label} style={{ fontFamily:'var(--font-body)',fontSize:10,
              color:r.pass?'#22C55E':'rgba(148,163,184,0.35)',transition:'color 0.25s',
              display:'flex',alignItems:'center',gap:3 }}>
              <span style={{ fontSize:8 }}>{r.pass?'✓':'○'}</span>{r.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Gold checkbox ───────────────────────────────────────────── */
function GoldCheckbox({ checked, onChange, label }) {
  return (
    <label style={{ display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer' }}>
      <div onClick={()=>onChange(!checked)}
        style={{ width:18,height:18,borderRadius:5,flexShrink:0,marginTop:2,
          background:checked?'linear-gradient(135deg,#A07820,#C9A84C)':'rgba(255,255,255,0.04)',
          border:checked?'1px solid #C9A84C':'1px solid rgba(255,255,255,0.15)',
          display:'flex',alignItems:'center',justifyContent:'center',
          transition:'all 0.2s ease',cursor:'pointer',
          boxShadow:checked?'0 0 10px rgba(201,168,76,0.4)':'none' }}>
        {checked&&(
          <svg width={10} height={10} viewBox="0 0 10 10">
            <path d="M1.5 5L4 7.5L8.5 2.5" fill="none" stroke="#080C14" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray:20,animation:'checkDraw2 0.25s ease both' }}/>
          </svg>
        )}
      </div>
      <span style={{ fontFamily:'var(--font-body)',fontSize:12,color:'rgba(148,163,184,0.85)',
        lineHeight:1.55,userSelect:'none' }}>{label}</span>
    </label>
  );
}

/* ── Glass select ────────────────────────────────────────────── */
function GlassSelect({ label, value, onChange, options, error }) {
  const [focused,setFocused]=useState(false);
  return (
    <div style={{ marginBottom:error?4:16 }}>
      {label&&(
        <label style={{ display:'block',fontFamily:'var(--font-mono)',fontSize:9,
          color:focused?'#C9A84C':error?'#EF4444':'rgba(148,163,184,0.8)',
          letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:7,transition:'color 0.2s' }}>
          {label}
        </label>
      )}
      <select value={value} onChange={e=>onChange(e.target.value)}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{ width:'100%',boxSizing:'border-box',padding:'12px 14px',
          background:'rgba(255,255,255,0.04)', backdropFilter:'blur(12px)',
          border:`1px solid ${error?'rgba(239,68,68,0.7)':focused?'rgba(201,168,76,0.8)':'rgba(255,255,255,0.1)'}`,
          borderRadius:13,outline:'none',
          color:value?'#F0F4FF':'rgba(148,163,184,0.5)',
          fontSize:13,fontFamily:'var(--font-body)',transition:'border-color 0.25s, box-shadow 0.25s',
          cursor:'pointer',boxShadow:focused?'0 0 0 3px rgba(201,168,76,0.15)':'none' }}>
        <option value="" disabled style={{ background:'#141E33',color:'#5A6B85' }}>Select…</option>
        {options.map(o=>(
          <option key={o.value} value={o.value} style={{ background:'#141E33',color:'#F0F4FF' }}>{o.label}</option>
        ))}
      </select>
      {error&&<p style={{ fontFamily:'var(--font-body)',fontSize:11,color:'#EF4444',marginTop:5,marginBottom:12 }}>⚠ {error}</p>}
    </div>
  );
}

/* ── OTP timer ring ──────────────────────────────────────────── */
function OtpTimer({ secs, total=60 }) {
  const r=18, circ=2*Math.PI*r;
  const dash=(secs/total)*circ;
  const c=secs<10?'#EF4444':secs<30?'#F59E0B':'#22C55E';
  return (
    <svg width={44} height={44} viewBox="0 0 44 44">
      <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3}/>
      <circle cx={22} cy={22} r={r} fill="none" stroke={c} strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 22 22)"
        style={{ transition:'stroke-dasharray 1s linear,stroke 0.4s',filter:`drop-shadow(0 0 4px ${c}80)` }}/>
      <text x={22} y={26} textAnchor="middle" fill={c}
        style={{ fontFamily:'DM Mono,monospace',fontSize:10,fontWeight:700 }}>{secs}</text>
    </svg>
  );
}

/* ── Countdown hook ──────────────────────────────────────────── */
function useCountdown(initial=60) {
  const [secs,setSecs]=useState(initial);
  const ref=useRef(null);
  const start=()=>{
    setSecs(initial); clearInterval(ref.current);
    ref.current=setInterval(()=>{
      setSecs(s=>{ if(s<=1){clearInterval(ref.current);return 0;} return s-1; });
    },1000);
  };
  useEffect(()=>()=>clearInterval(ref.current),[]);
  return {secs,start,expired:secs===0};
}

/* ── Gold button ─────────────────────────────────────────────── */
function GoldBtn({ children, onClick, type='button', disabled, loading, style={} }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled||loading}
      style={{ height:50,borderRadius:14,border:'none',
        background:disabled||loading?'rgba(255,255,255,0.05)':'linear-gradient(135deg,#A07820,#C9A84C,#E8C96A)',
        color:disabled||loading?'rgba(255,255,255,0.2)':'#080C14',
        fontFamily:'var(--font-heading)',fontSize:13,fontWeight:700,
        letterSpacing:'0.12em',textTransform:'uppercase',
        cursor:disabled||loading?'not-allowed':'pointer',
        boxShadow:disabled||loading?'none':'0 0 22px rgba(201,168,76,0.35),0 4px 20px rgba(0,0,0,0.4)',
        transition:'all 0.2s ease',display:'flex',alignItems:'center',justifyContent:'center',gap:8,
        ...style }}
      onMouseEnter={e=>{ if(!disabled&&!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
      onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
    >
      {loading?(
        <>
          <svg width={14} height={14} viewBox="0 0 14 14" style={{ animation:'spin2 0.8s linear infinite' }}>
            <circle cx="7" cy="7" r="5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
            <path d="M7 2A5 5 0 0 1 12 7" fill="none" stroke="#080C14" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {typeof children==='string'?children.replace('→','…'):children}
        </>
      ):children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  injectStyles();
  const navigate=useNavigate();

  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const [errors,setErrors]=useState({});
  const [showPass,setShowPass]=useState(false);
  const [showConfirm,setShowConfirm]=useState(false);
  const [showConfetti,setShowConfetti]=useState(false);

  const [form,setForm]=useState({
    fullName:'',phone:'',dateOfBirth:'',gender:'',maritalStatus:'',voicePart:'',
    email:'',password:'',confirmPassword:'',agreeTerms:false,
  });

  const [otpDigits,setOtpDigits]=useState(['','','','','','']);
  const [otpError,setOtpError]=useState('');
  const [otpShake,setOtpShake]=useState(false);
  const otpRefs=useRef([]);
  const {secs:cdSecs,start:cdStart,expired:cdExpired}=useCountdown(60);

  const set=(field)=>(val)=>{
    setForm(f=>({...f,[field]:val}));
    setErrors(e=>{ const n={...e}; delete n[field]; return n; });
  };

  const age=useMemo(()=>{
    if(!form.dateOfBirth) return null;
    const d=new Date(form.dateOfBirth);
    if(isNaN(d.getTime())) return null;
    return Math.floor((Date.now()-d.getTime())/(365.25*86400000));
  },[form.dateOfBirth]);

  const emailIsValid=form.email.length>2?isValidEmail(form.email):undefined;
  const passMatch=form.confirmPassword?form.confirmPassword===form.password:undefined;
  const selectedVoice=VOICE_PARTS.find(vp=>vp.id===form.voicePart);

  /* Step 1 */
  const submitStep1=(e)=>{
    e.preventDefault();
    const errs={};
    if(!form.fullName.trim()) errs.fullName='Full name is required';
    if(!form.voicePart) errs.voicePart='Please select your voice part';
    if(age!==null&&age<15) errs.dateOfBirth='Must be at least 15 years old';
    if(Object.keys(errs).length){ setErrors(errs); return; }
    setErrors({}); setStep(2);
  };

  /* Step 2 */
  const submitStep2=async(e)=>{
    e.preventDefault();
    const errs=validateRegistration(form);
    if(!form.agreeTerms) errs.agreeTerms='You must accept the terms to continue';
    if(Object.keys(errs).length){ setErrors(errs); return; }
    setLoading(true);
    try {
      await authService.register(form);
      setErrors({}); cdStart(); setStep(3);
    } catch(err){ setErrors({email:err.message}); }
    finally{ setLoading(false); }
  };

  /* OTP handlers */
  const handleOtpChange=(i,val)=>{
    if(!/^\d?$/.test(val)) return;
    const next=[...otpDigits]; next[i]=val;
    setOtpDigits(next); setOtpError('');
    if(val&&i<5) setTimeout(()=>otpRefs.current[i+1]?.focus(),10);
  };
  const handleOtpKey=(i,e)=>{
    if(e.key==='Backspace'&&!otpDigits[i]&&i>0) otpRefs.current[i-1]?.focus();
  };
  const handleOtpPaste=(e)=>{
    const text=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if(text.length>0){
      setOtpDigits([...text.split(''),'','','','','',''].slice(0,6));
      otpRefs.current[Math.min(text.length,5)]?.focus();
    }
    e.preventDefault();
  };
  const submitOTP=async(e)=>{
    e.preventDefault();
    const code=otpDigits.join('');
    setLoading(true);
    try {
      await authService.verifyOTP(form.email,code);
      setShowConfetti(true);
      setTimeout(()=>setShowConfetti(false),2200);
      setStep(4);
    } catch(err){
      setOtpError(err.message);
      setOtpShake(true);
      setTimeout(()=>{ setOtpShake(false); setOtpDigits(['','','','','','']); otpRefs.current[0]?.focus(); },500);
    } finally{ setLoading(false); }
  };
  const resendOTP=()=>{
    cdStart(); setOtpDigits(['','','','','','']); setOtpError('');
    setTimeout(()=>otpRefs.current[0]?.focus(),50);
  };

  const notes=[
    {char:'♪',x:3,y:15,size:22,delay:0,duration:7},
    {char:'♫',x:93,y:22,size:18,delay:2.5,duration:9},
    {char:'♬',x:5,y:68,size:26,delay:4,duration:8},
    {char:'𝄞',x:91,y:70,size:24,delay:1,duration:10},
    {char:'♩',x:50,y:4,size:14,delay:3,duration:6},
  ];

  const otpFilled=otpDigits.join('').length===6;

  return (
    <div style={{ minHeight:'100vh',background:'var(--bg-base)',display:'flex',
      alignItems:'center',justifyContent:'center',padding:'32px 16px',
      fontFamily:'var(--font-body)',position:'relative',overflow:'hidden' }}>

      {/* BG elements */}
      <div style={{ position:'fixed',top:'-20%',left:'-10%',width:'50%',height:'50%',
        borderRadius:'50%',pointerEvents:'none',
        background:'radial-gradient(ellipse,rgba(201,168,76,0.05) 0%,transparent 70%)',
        animation:'orbFloat 7s ease-in-out infinite' }}/>
      <div style={{ position:'fixed',bottom:'-15%',right:'-8%',width:'45%',height:'45%',
        borderRadius:'50%',pointerEvents:'none',
        background:'radial-gradient(ellipse,rgba(139,92,246,0.05) 0%,transparent 70%)',
        animation:'orbFloat 9s ease-in-out 3s infinite' }}/>
      {notes.map((n,i)=><Note key={i} {...n}/>)}
      <WaveBg/>
      {showConfetti&&<Confetti/>}

      <div style={{ width:'100%',maxWidth:540,position:'relative',zIndex:1 }}>

        {/* Header */}
        <div style={{ textAlign:'center',marginBottom:28 }}>
          <div style={{ width:64,height:64,borderRadius:'50%',
            background:'linear-gradient(135deg,#A07820,#C9A84C,#E8C96A)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:30,margin:'0 auto 14px',
            animation:'goldBreath 4s ease-in-out infinite',
            boxShadow:'0 0 40px rgba(201,168,76,0.4)' }}>♪</div>
          <h1 style={{ fontFamily:'var(--font-heading)',fontSize:22,fontWeight:900,
            background:'linear-gradient(135deg,#C9A84C,#F5E4A8,#E8C96A)',
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
            letterSpacing:'0.04em',margin:'0 0 5px' }}>
            Join INHERITANCE CHOIR
          </h1>
          <p style={{ fontFamily:'var(--font-body)',fontSize:12,color:'rgba(148,163,184,0.7)' }}>
            Create your account in 4 quick steps
          </p>
        </div>

        <StepRail step={step}/>

        {/* Glass card */}
        <div style={{ background:'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))',
          backdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:22,
          overflow:'hidden',
          boxShadow:'0 24px 60px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.07)',
          position:'relative' }}>

          {/* Iridescent rim */}
          <div style={{ height:2,
            background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.8) 25%,rgba(139,92,246,0.6) 60%,rgba(6,182,212,0.5) 85%,transparent)',
            animation:'rimSweep 4s linear infinite',backgroundSize:'200% 100%' }}/>

          <div style={{ padding:'30px 30px 28px' }}>

            {/* ── STEP 1 ── */}
            {step===1&&(
              <form onSubmit={submitStep1} noValidate style={{ animation:'regFormIn 0.35s ease both' }}>
                <h2 style={{ fontFamily:'var(--font-heading)',fontSize:17,fontWeight:700,
                  color:'var(--text-primary)',margin:'0 0 22px',display:'flex',alignItems:'center',gap:10 }}>
                  <span style={{ fontSize:20 }}>👤</span> Personal Information
                </h2>

                <div style={{ animation:'regFieldIn 0.3s ease 0.05s both' }}>
                  <GlassField label="Full Name *" value={form.fullName} onChange={set('fullName')}
                    placeholder="Jean Baptiste Niyonkuru" icon="✦" error={errors.fullName}
                    valid={form.fullName.trim().length>2?true:form.fullName.length>0?false:undefined}/>
                </div>

                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,
                  animation:'regFieldIn 0.3s ease 0.1s both' }}>
                  <GlassField label="Phone (optional)" value={form.phone} onChange={set('phone')}
                    placeholder="+250 788 000 000" icon="📱"/>
                  <div>
                    <GlassField label="Date of Birth" type="date" value={form.dateOfBirth}
                      onChange={set('dateOfBirth')} error={errors.dateOfBirth}
                      valid={age!==null?age>=15:undefined}/>
                    {age!==null&&!errors.dateOfBirth&&(
                      <p style={{ fontFamily:'var(--font-mono)',fontSize:9,
                        color:age>=15?'#22C55E':'#EF4444',
                        marginTop:-10,marginBottom:12,letterSpacing:'0.06em' }}>
                        {age>=15?`✓ Age: ${age} years`:`✕ Must be 15+ (you are ${age})`}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,
                  animation:'regFieldIn 0.3s ease 0.15s both' }}>
                  <GlassSelect label="Gender" value={form.gender} onChange={set('gender')}
                    options={GENDERS.map(g=>({value:g.id,label:g.label}))}/>
                  <GlassSelect label="Marital Status" value={form.maritalStatus}
                    onChange={set('maritalStatus')}
                    options={MARITAL_STATUS.map(m=>({value:m.id,label:m.label}))}/>
                </div>

                {/* Voice part cards */}
                <div style={{ marginBottom:26,animation:'regFieldIn 0.3s ease 0.2s both' }}>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.14em',
                    textTransform:'uppercase',marginBottom:10,
                    color:errors.voicePart?'#EF4444':'rgba(148,163,184,0.8)' }}>
                    Voice Part <span style={{ color:'#EF4444' }}>*</span>
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10 }}>
                    {VOICE_PARTS.map(vp=>{
                      const sel=form.voicePart===vp.id;
                      return (
                        <button type="button" key={vp.id} onClick={()=>set('voicePart')(vp.id)}
                          style={{ padding:'14px',borderRadius:14,
                            border:`2px solid ${sel?vp.color:'rgba(255,255,255,0.1)'}`,
                            background:sel?`linear-gradient(135deg,${vp.color}20,${vp.color}08)`:'rgba(255,255,255,0.03)',
                            cursor:'pointer',textAlign:'left',transition:'all 0.25s ease',
                            transform:sel?'scale(1.02)':'scale(1)',
                            boxShadow:sel?`0 0 20px ${vp.color}30,inset 0 1px 0 ${vp.color}20`:'none',
                            backdropFilter:'blur(12px)',
                          }}
                          onMouseEnter={e=>{ if(!sel){e.currentTarget.style.borderColor=`${vp.color}60`;e.currentTarget.style.background='rgba(255,255,255,0.05)';} }}
                          onMouseLeave={e=>{ if(!sel){e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';e.currentTarget.style.background='rgba(255,255,255,0.03)';} }}
                        >
                          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7 }}>
                            <span style={{ fontSize:20 }}>{vp.icon}</span>
                            <SoundWave color={vp.color} active={sel}/>
                          </div>
                          <div style={{ fontFamily:'var(--font-heading)',fontSize:13,fontWeight:700,
                            color:sel?vp.color:'var(--text-primary)',marginBottom:2,
                            textShadow:sel?`0 0 12px ${vp.color}50`:'none',transition:'all 0.25s' }}>{vp.label}</div>
                          <div style={{ fontFamily:'var(--font-mono)',fontSize:8,
                            color:sel?`${vp.color}90`:'rgba(148,163,184,0.4)',letterSpacing:'0.06em',marginBottom:3 }}>{vp.range}</div>
                          <div style={{ fontFamily:'var(--font-body)',fontSize:10,
                            color:sel?'rgba(255,255,255,0.7)':'rgba(148,163,184,0.5)',lineHeight:1.4 }}>{vp.description}</div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.voicePart&&<p style={{ color:'#EF4444',fontSize:11,marginTop:8 }}>⚠ {errors.voicePart}</p>}
                </div>

                <GoldBtn type="submit" style={{ width:'100%' }}>Continue to Credentials →</GoldBtn>
              </form>
            )}

            {/* ── STEP 2 ── */}
            {step===2&&(
              <form onSubmit={submitStep2} noValidate style={{ animation:'regFormIn 0.35s ease both' }}>
                <h2 style={{ fontFamily:'var(--font-heading)',fontSize:17,fontWeight:700,
                  color:'var(--text-primary)',margin:'0 0 6px',display:'flex',alignItems:'center',gap:10 }}>
                  <span style={{ fontSize:20 }}>🔑</span> Account Credentials
                </h2>

                {/* Step 1 summary */}
                <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',
                  background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.2)',
                  borderRadius:12,marginBottom:22,animation:'regFieldIn 0.3s ease both' }}>
                  {selectedVoice&&<span style={{ fontSize:18 }}>{selectedVoice.icon}</span>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-heading)',fontSize:12,color:'var(--text-primary)',fontWeight:600 }}>
                      {form.fullName}
                    </div>
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.06em',
                      color:selectedVoice?.color||'var(--gold)' }}>
                      {selectedVoice?.label||'—'}{age!==null?` · Age ${age}`:''}
                    </div>
                  </div>
                  <button type="button" onClick={()=>setStep(1)}
                    style={{ background:'none',border:'none',cursor:'pointer',
                      fontFamily:'var(--font-body)',fontSize:11,color:'rgba(201,168,76,0.7)' }}>Edit ✎</button>
                </div>

                <div style={{ animation:'regFieldIn 0.3s ease 0.05s both' }}>
                  <GlassField label="Email Address *" type="email" value={form.email}
                    onChange={set('email')} placeholder="your.email@example.com" icon="✉️"
                    error={errors.email} valid={form.email.length>2?emailIsValid:undefined}/>
                </div>

                <div style={{ animation:'regFieldIn 0.3s ease 0.1s both' }}>
                  <GlassField label="Password *" type={showPass?'text':'password'}
                    value={form.password} onChange={set('password')}
                    placeholder="Create a strong password" icon="🔑" error={errors.password}
                    rightEl={
                      <button type="button" onClick={()=>setShowPass(v=>!v)}
                        style={{ background:'none',border:'none',cursor:'pointer',fontSize:14,
                          color:'rgba(148,163,184,0.5)',transition:'color 0.2s' }}
                        onMouseEnter={e=>e.currentTarget.style.color='var(--gold)'}
                        onMouseLeave={e=>e.currentTarget.style.color='rgba(148,163,184,0.5)'}>
                        {showPass?'🙈':'👁️'}
                      </button>
                    }/>
                  <StrengthMeter password={form.password}/>
                </div>

                <div style={{ animation:'regFieldIn 0.3s ease 0.15s both' }}>
                  <GlassField label="Confirm Password *" type={showConfirm?'text':'password'}
                    value={form.confirmPassword} onChange={set('confirmPassword')}
                    placeholder="Repeat your password" icon="🔒" error={errors.confirmPassword}
                    valid={passMatch}
                    rightEl={
                      <button type="button" onClick={()=>setShowConfirm(v=>!v)}
                        style={{ background:'none',border:'none',cursor:'pointer',fontSize:14,
                          color:'rgba(148,163,184,0.5)',transition:'color 0.2s' }}
                        onMouseEnter={e=>e.currentTarget.style.color='var(--gold)'}
                        onMouseLeave={e=>e.currentTarget.style.color='rgba(148,163,184,0.5)'}>
                        {showConfirm?'🙈':'👁️'}
                      </button>
                    }/>
                  {form.confirmPassword&&!errors.confirmPassword&&(
                    <p style={{ fontFamily:'var(--font-body)',fontSize:11,
                      color:passMatch?'#22C55E':'#EF4444',
                      marginTop:-10,marginBottom:14,animation:'regFieldIn 0.2s ease both' }}>
                      {passMatch?'✓ Passwords match':'✕ Passwords do not match'}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom:24,animation:'regFieldIn 0.3s ease 0.2s both' }}>
                  <GoldCheckbox checked={form.agreeTerms} onChange={v=>set('agreeTerms')(v)}
                    label="I agree to the Terms of Service and consent to receive choir notifications and communications."/>
                  {errors.agreeTerms&&<p style={{ color:'#EF4444',fontSize:11,marginTop:6 }}>⚠ {errors.agreeTerms}</p>}
                </div>

                <div style={{ display:'flex',gap:10 }}>
                  <button type="button" onClick={()=>setStep(1)}
                    style={{ height:50,padding:'0 22px',borderRadius:14,border:'1px solid rgba(255,255,255,0.1)',
                      background:'rgba(255,255,255,0.04)',color:'rgba(148,163,184,0.8)',
                      fontFamily:'var(--font-body)',fontSize:13,cursor:'pointer',transition:'all 0.2s ease',flexShrink:0 }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.borderColor='rgba(255,255,255,0.2)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';}}>
                    ← Back
                  </button>
                  <GoldBtn type="submit" loading={loading} style={{ flex:1 }}>
                    Send Verification Code →
                  </GoldBtn>
                </div>
              </form>
            )}

            {/* ── STEP 3 ── */}
            {step===3&&(
              <form onSubmit={submitOTP} noValidate style={{ animation:'regFormIn 0.35s ease both' }}>
                <div style={{ textAlign:'center',marginBottom:26 }}>
                  <div style={{ fontSize:52,marginBottom:16,display:'inline-block',animation:'orbFloat 3s ease-in-out infinite' }}>✉️</div>
                  <h2 style={{ fontFamily:'var(--font-heading)',fontSize:18,color:'var(--text-primary)',margin:'0 0 8px' }}>
                    Check Your Email
                  </h2>
                  <p style={{ fontFamily:'var(--font-body)',fontSize:13,color:'rgba(148,163,184,0.8)',lineHeight:1.6 }}>
                    We sent a 6-digit verification code to<br/>
                    <strong style={{ color:'var(--text-primary)' }}>{maskEmail(form.email)}</strong>
                  </p>
                  <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginTop:10,
                    background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',
                    borderRadius:40,padding:'4px 14px' }}>
                    <span style={{ fontSize:10 }}>ℹ️</span>
                    <span style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'rgba(96,165,250,0.8)',letterSpacing:'0.05em' }}>
                      Dev mode: any 6-digit code works
                    </span>
                  </div>
                </div>

                {/* OTP boxes */}
                <div style={{ display:'flex',justifyContent:'center',gap:8,marginBottom:14,
                  animation:otpShake?'shakeBox 0.45s ease':'none' }}>
                  {otpDigits.map((v,i)=>{
                    const filled=v!=='';
                    return (
                      <input key={i} ref={el=>otpRefs.current[i]=el}
                        type="text" inputMode="numeric" maxLength={1} value={v}
                        onChange={e=>handleOtpChange(i,e.target.value)}
                        onKeyDown={e=>handleOtpKey(i,e)}
                        onPaste={handleOtpPaste}
                        style={{ width:46,height:56,borderRadius:14,textAlign:'center',
                          fontFamily:'var(--font-mono)',fontSize:24,fontWeight:700,outline:'none',
                          background:filled?'rgba(201,168,76,0.1)':'rgba(255,255,255,0.04)',
                          backdropFilter:'blur(12px)',
                          border:`2px solid ${otpError?'rgba(239,68,68,0.7)':filled?'#C9A84C':'rgba(255,255,255,0.12)'}`,
                          color:filled?'#C9A84C':'#F0F4FF',
                          boxShadow:filled?'0 0 14px rgba(201,168,76,0.35)':'none',
                          transition:'all 0.2s ease',cursor:'text' }}
                        onFocus={e=>{e.target.style.borderColor=otpError?'#EF4444':'#C9A84C';e.target.style.boxShadow='0 0 0 3px rgba(201,168,76,0.15)';}}
                        onBlur={e=>{e.target.style.borderColor=otpError?'rgba(239,68,68,0.7)':v?'#C9A84C':'rgba(255,255,255,0.12)';e.target.style.boxShadow=v?'0 0 14px rgba(201,168,76,0.35)':'none';}}
                      />
                    );
                  })}
                </div>

                {otpError&&(
                  <p style={{ textAlign:'center',color:'#EF4444',fontSize:12,
                    fontFamily:'var(--font-body)',marginBottom:12,animation:'regFieldIn 0.2s ease both' }}>
                    ⚠ {otpError}
                  </p>
                )}

                {/* Timer + resend */}
                <div style={{ display:'flex',justifyContent:'center',alignItems:'center',gap:12,marginBottom:20 }}>
                  <OtpTimer secs={cdSecs} total={60}/>
                  <div style={{ fontFamily:'var(--font-body)',fontSize:13,color:'rgba(148,163,184,0.8)' }}>
                    {cdExpired?(
                      <span>Didn't receive it?{' '}
                        <button type="button" onClick={resendOTP}
                          style={{ background:'none',border:'none',cursor:'pointer',
                            fontFamily:'var(--font-body)',fontSize:13,color:'#C9A84C',
                            fontWeight:600,textDecoration:'underline',textDecorationColor:'rgba(201,168,76,0.4)' }}>
                          Resend code
                        </button>
                      </span>
                    ):(
                      <span style={{ color:'rgba(148,163,184,0.6)' }}>Resend available in {cdSecs}s</span>
                    )}
                  </div>
                </div>

                {/* Progress dots */}
                <div style={{ display:'flex',justifyContent:'center',gap:6,marginBottom:22 }}>
                  {otpDigits.map((_,i)=>(
                    <div key={i} style={{ width:8,height:8,borderRadius:'50%',
                      background:otpDigits[i]?'#C9A84C':'rgba(255,255,255,0.1)',
                      transition:'background 0.2s ease',
                      boxShadow:otpDigits[i]?'0 0 8px rgba(201,168,76,0.6)':'none' }}/>
                  ))}
                </div>

                <GoldBtn type="submit" loading={loading} disabled={!otpFilled} style={{ width:'100%' }}>
                  Verify & Complete →
                </GoldBtn>
              </form>
            )}

            {/* ── STEP 4 ── */}
            {step===4&&(
              <div style={{ textAlign:'center',padding:'8px 0',animation:'regFormIn 0.4s ease both' }}>
                <div style={{ display:'inline-flex',position:'relative',marginBottom:18 }}>
                  <svg width={96} height={96} viewBox="0 0 96 96">
                    <circle cx={48} cy={48} r={42} fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.2)" strokeWidth={1.5}/>
                    <circle cx={48} cy={48} r={42} fill="none" stroke="#22C55E" strokeWidth={2.5}
                      strokeDasharray="264" strokeLinecap="round" transform="rotate(-90 48 48)"
                      style={{ animation:'successRing 0.8s ease both',filter:'drop-shadow(0 0 8px rgba(34,197,94,0.6))' }}/>
                    <text x={48} y={58} textAnchor="middle" style={{ fontSize:34 }}>✅</text>
                  </svg>
                </div>

                <h2 style={{ fontFamily:'var(--font-heading)',fontSize:24,fontWeight:900,
                  background:'linear-gradient(135deg,#C9A84C,#F5E4A8,#E8C96A)',
                  WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
                  margin:'0 0 10px',animation:'popIn 0.5s ease 0.2s both' }}>
                  You're Verified! 🎉
                </h2>

                <p style={{ fontFamily:'var(--font-body)',fontSize:14,color:'rgba(148,163,184,0.85)',
                  marginBottom:24,lineHeight:1.7,animation:'regFieldIn 0.4s ease 0.3s both' }}>
                  Welcome to INHERITANCE CHOIR!<br/>Your account is under admin review.
                </p>

                <div style={{ background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.25)',
                  borderLeft:'3px solid #3B82F6',borderRadius:14,padding:'14px 18px',
                  textAlign:'left',marginBottom:24,animation:'regFieldIn 0.4s ease 0.4s both' }}>
                  <div style={{ fontFamily:'var(--font-heading)',fontSize:11,color:'#60A5FA',
                    letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:6 }}>
                    ⏳ Pending Admin Approval
                  </div>
                  <div style={{ fontFamily:'var(--font-body)',fontSize:12,color:'rgba(148,163,184,0.8)',lineHeight:1.6 }}>
                    You'll receive an email once approved (within 24–48 hours).<br/>
                    Contact: <strong style={{ color:'var(--text-primary)' }}>inheritancechoir@gmail.com</strong>
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:28,
                  textAlign:'left',animation:'regFieldIn 0.4s ease 0.5s both' }}>
                  {[
                    {icon:'✅',text:'Account created',color:'#22C55E',done:true,sub:'Just now'},
                    {icon:'✅',text:'Email verified',color:'#22C55E',done:true,sub:'Completed'},
                    {icon:'⏳',text:'Admin review…',color:'#F59E0B',done:false,sub:'In progress',pulse:true},
                    {icon:'📧',text:'Approval notification',color:'rgba(148,163,184,0.4)',done:false,sub:'Pending'},
                    {icon:'🎉',text:'Full access granted',color:'rgba(148,163,184,0.4)',done:false,sub:'Soon!'},
                  ].map((item,i)=>(
                    <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:12,
                      background:item.done?'rgba(34,197,94,0.06)':item.pulse?'rgba(245,158,11,0.06)':'rgba(255,255,255,0.02)',
                      border:`1px solid ${item.done?'rgba(34,197,94,0.2)':item.pulse?'rgba(245,158,11,0.2)':'rgba(255,255,255,0.06)'}` }}>
                      <div style={{ width:32,height:32,borderRadius:'50%',flexShrink:0,
                        background:item.done?'rgba(34,197,94,0.15)':item.pulse?'rgba(245,158,11,0.12)':'rgba(255,255,255,0.04)',
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,
                        animation:item.pulse?'dotPulse 2s ease infinite':'none' }}>
                        {item.icon}
                      </div>
                      <div style={{ flex:1,fontFamily:'var(--font-body)',fontSize:13,color:item.color,fontWeight:600 }}>
                        {item.text}
                      </div>
                      <span style={{ fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.06em',
                        color:item.done?'#22C55E':item.pulse?'#F59E0B':'rgba(148,163,184,0.3)',flexShrink:0 }}>
                        {item.sub}
                      </span>
                    </div>
                  ))}
                </div>

                <GoldBtn onClick={()=>navigate('/login')} style={{ width:'100%',animation:'popIn 0.5s ease 0.6s both' }}>
                  ← Go to Login
                </GoldBtn>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign:'center',marginTop:20,fontFamily:'var(--font-body)',fontSize:13,
          color:'rgba(148,163,184,0.6)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'#C9A84C',textDecoration:'none',
            borderBottom:'1px solid rgba(201,168,76,0.35)',paddingBottom:1 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
