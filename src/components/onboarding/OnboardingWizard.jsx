/**
 * INHERITANCE CHOIR — Onboarding Wizard
 * Beautiful multi-step wizard shown to newly approved members on first login.
 * Steps: Welcome → Profile → Voice Part → Notifications → Complete
 */
import React, { useState, useEffect } from 'react';
import { useAuth }          from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { usePWA, InstallButton } from '../pwa/PWAManager';
import FileUpload, { AvatarUploader } from '../upload/FileUpload';

const STEPS = [
  { id: 'welcome',       title: 'Welcome!',           icon: '🎵' },
  { id: 'profile',       title: 'Complete Profile',   icon: '👤' },
  { id: 'voice',         title: 'Your Voice Part',    icon: '🎼' },
  { id: 'notifications', title: 'Stay Connected',     icon: '🔔' },
  { id: 'complete',      title: 'You\'re All Set!',   icon: '🎉' },
];

const VP_DESCRIPTIONS = {
  Soprano: { range:'High voice (C4–C6)', known:'Bright, clear tone', examples:'Lead melodies, high harmonies', color:'#EC4899' },
  Alto:    { range:'Medium-low (G3–E5)', known:'Warm, rich tone',    examples:'Inner harmonies, descant',     color:'#8B5CF6' },
  Tenor:   { range:'Medium-high (C3–B4)',known:'Clear, resonant',    examples:'Lead male melodies',           color:'#3B82F6' },
  Bass:    { range:'Low voice (E2–E4)',  known:'Deep, powerful',     examples:'Foundation harmonies',         color:'#10B981' },
};

// ── Step indicator ─────────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, marginBottom:32 }}>
      {steps.map((step, i) => {
        const done    = i < current;
        const active  = i === current;
        const pending = i > current;

        return (
          <React.Fragment key={step.id}>
            <div style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:6,
            }}>
              <div style={{
                width:40, height:40, borderRadius:'50%',
                background: done   ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                          : active ? 'linear-gradient(135deg, #A07820, #C9A84C)'
                          :          '#1E2D4A',
                border:`2px solid ${done ? '#22C55E' : active ? '#C9A84C' : '#374151'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: done ? 18 : 14,
                transition:'all 0.4s ease',
                boxShadow: active ? '0 0 20px rgba(201,168,76,0.4)' : 'none',
              }}>
                {done ? '✓' : step.icon}
              </div>
              <span style={{
                fontSize:10, color: done ? '#22C55E' : active ? '#C9A84C' : '#374151',
                fontWeight: active ? 700 : 400,
                textAlign:'center', maxWidth:60,
                transition:'color 0.3s',
              }}>
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex:1, height:2, maxWidth:40, marginBottom:20,
                background: i < current ? '#22C55E' : '#1E2D4A',
                transition:'background 0.4s ease',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Step: Welcome ─────────────────────────────────────────────
function WelcomeStep({ member, onNext }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  return (
    <div style={{ textAlign:'center', padding:'20px 0' }}>
      <div style={{
        width:90, height:90, borderRadius:'50%', margin:'0 auto 24px',
        background:'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))',
        border:'3px solid rgba(201,168,76,0.4)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:40,
        opacity: show ? 1 : 0,
        transform: show ? 'scale(1)' : 'scale(0.5)',
        transition:'all 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow:'0 0 40px rgba(201,168,76,0.2)',
      }}>
        🎵
      </div>

      <h1 style={{
        margin:'0 0 12px', fontSize:28, fontFamily:'Cinzel, serif', color:'#C9A84C',
        opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(20px)',
        transition:'all 0.5s ease 0.2s',
      }}>
        Welcome, {member?.fullName?.split(' ')[0]}!
      </h1>

      <p style={{
        fontSize:16, color:'#CBD5E1', lineHeight:1.7, maxWidth:440, margin:'0 auto 28px',
        opacity: show ? 1 : 0, transition:'opacity 0.5s ease 0.3s',
      }}>
        Your account has been approved and you're now part of the{' '}
        <strong style={{ color:'#C9A84C' }}>Inheritance Choir</strong> family.{' '}
        Let's take a few moments to set up your profile.
      </p>

      <div style={{
        display:'flex', flexDirection:'column', gap:12, maxWidth:360, margin:'0 auto 32px',
        opacity: show ? 1 : 0, transition:'opacity 0.5s ease 0.4s',
      }}>
        {[
          { icon:'✅', text:'Track your attendance and receive reminders' },
          { icon:'💰', text:'Record contributions and download receipts' },
          { icon:'🎵', text:'Access songs, setlists and rehearsal notes' },
          { icon:'💬', text:'Chat with fellow choir members in real-time' },
        ].map((item, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:12,
            background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.15)',
            borderRadius:12, padding:'12px 16px', textAlign:'left',
          }}>
            <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
            <span style={{ fontSize:13, color:'#CBD5E1' }}>{item.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        style={{
          padding:'14px 40px',
          background:'linear-gradient(135deg, #A07820, #C9A84C)',
          border:'none', borderRadius:14, color:'#080C14',
          fontSize:15, fontWeight:800, cursor:'pointer',
          boxShadow:'0 8px 32px rgba(201,168,76,0.35)',
          transition:'all 0.2s',
          letterSpacing:'0.05em',
        }}
        onMouseEnter={e => e.target.style.transform='translateY(-2px)'}
        onMouseLeave={e => e.target.style.transform='translateY(0)'}
      >
        Let's Get Started →
      </button>
    </div>
  );
}

// ── Step: Profile ─────────────────────────────────────────────
function ProfileStep({ member, onNext, onUpdate }) {
  const [form, setForm] = useState({
    phone:         member?.phone         || '',
    dateOfBirth:   member?.dateOfBirth   || '',
    gender:        member?.gender        || '',
    maritalStatus: member?.maritalStatus || '',
    bio:           member?.bio           || '',
    avatarUrl:     member?.avatarUrl     || '',
  });

  const pct = [form.phone, form.dateOfBirth, form.gender, form.bio, form.avatarUrl]
    .filter(Boolean).length / 5 * 100;

  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <AvatarUploader
          currentUrl={form.avatarUrl}
          onUpload={url => setForm(f => ({ ...f, avatarUrl: url }))}
        />
        <p style={{ margin:'10px 0 0', fontSize:12, color:'#64748B' }}>Click to upload your photo</p>
      </div>

      {/* Completeness bar */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:12, color:'#64748B' }}>Profile completeness</span>
          <span style={{ fontSize:12, color: pct === 100 ? '#22C55E' : '#C9A84C', fontFamily:'DM Mono, monospace', fontWeight:700 }}>
            {Math.round(pct)}%
          </span>
        </div>
        <div style={{ height:6, background:'#1E2D4A', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg, #A07820, #C9A84C)', transition:'width 0.5s ease', borderRadius:3 }} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {[
          { key:'phone',         label:'Phone Number',  type:'tel',    placeholder:'+250 7XX XXX XXX' },
          { key:'dateOfBirth',   label:'Date of Birth', type:'date',   placeholder:'' },
          { key:'gender',        label:'Gender',        type:'select', options:['','Male','Female','Non-binary','Prefer not to say'] },
          { key:'maritalStatus', label:'Marital Status',type:'select', options:['','Single','Married','Widowed','Divorced'] },
        ].map(f => (
          <div key={f.key}>
            <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>
              {f.label}
            </label>
            {f.type === 'select' ? (
              <select value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                style={{ width:'100%', background:'#141E33', border:'1px solid #1E2D4A', borderRadius:10, padding:'10px 14px', color:'#F0F4FF', fontSize:14 }}>
                {f.options.map(o => <option key={o} value={o}>{o || 'Select…'}</option>)}
              </select>
            ) : (
              <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                style={{ width:'100%', background:'#141E33', border:'1px solid #1E2D4A', borderRadius:10, padding:'10px 14px', color:'#F0F4FF', fontSize:14, outline:'none', boxSizing:'border-box' }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginBottom:24 }}>
        <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>About Me</label>
        <textarea value={form.bio} onChange={e => setForm(x => ({ ...x, bio: e.target.value }))}
          placeholder="Tell the choir family about yourself…" rows={3}
          style={{ width:'100%', background:'#141E33', border:'1px solid #1E2D4A', borderRadius:10, padding:'10px 14px', color:'#F0F4FF', fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'Crimson Pro, serif' }}
        />
      </div>

      <button onClick={() => { onUpdate(form); onNext(); }} style={{
        width:'100%', padding:'13px',
        background:'linear-gradient(135deg, #A07820, #C9A84C)',
        border:'none', borderRadius:12, color:'#080C14', fontSize:14, fontWeight:700, cursor:'pointer',
      }}>
        Save & Continue →
      </button>
      <button onClick={onNext} style={{ width:'100%', marginTop:8, padding:'10px', background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:13 }}>
        Skip for now
      </button>
    </div>
  );
}

// ── Step: Voice Part ──────────────────────────────────────────
function VoiceStep({ member, onNext }) {
  const vp    = member?.voicePart || 'Soprano';
  const desc  = VP_DESCRIPTIONS[vp] || VP_DESCRIPTIONS.Soprano;
  const color = desc.color;

  return (
    <div style={{ textAlign:'center' }}>
      <div style={{
        width:80, height:80, borderRadius:20, margin:'0 auto 20px',
        background:`${color}22`, border:`2px solid ${color}44`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:36,
      }}>
        🎼
      </div>

      <h2 style={{ margin:'0 0 8px', fontSize:22, fontFamily:'Cinzel, serif', color }}>
        You're a {vp}!
      </h2>
      <p style={{ margin:'0 0 28px', fontSize:14, color:'#94A3B8' }}>
        This was set by your choir director during registration
      </p>

      {/* VP info card */}
      <div style={{
        background:`${color}08`, border:`1px solid ${color}33`,
        borderRadius:20, padding:24, marginBottom:24, textAlign:'left',
        maxWidth:440, margin:'0 auto 24px',
      }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[
            { label:'Vocal Range', value:desc.range },
            { label:'Tone Quality', value:desc.known },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'12px 14px' }}>
              <p style={{ margin:0, fontSize:10, color:color, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>{s.label}</p>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'#F0F4FF' }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop:14, background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'12px 14px' }}>
          <p style={{ margin:0, fontSize:10, color:color, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>Typical Role</p>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#F0F4FF' }}>{desc.examples}</p>
        </div>
      </div>

      <button onClick={onNext} style={{
        padding:'13px 36px',
        background:'linear-gradient(135deg, #A07820, #C9A84C)',
        border:'none', borderRadius:12, color:'#080C14', fontSize:14, fontWeight:700, cursor:'pointer',
      }}>
        Great, Continue →
      </button>
    </div>
  );
}

// ── Step: Notifications ───────────────────────────────────────
function NotificationsStep({ onNext }) {
  const { requestPushPermission } = useNotifications();
  const { canInstall }            = usePWA();
  const [pushed, setPushed]       = useState(false);
  const [prefs, setPrefs] = useState({
    email: true, push: false, rehearsal: true, contributions: true,
  });

  const handleEnablePush = async () => {
    const granted = await requestPushPermission();
    setPushed(granted);
    setPrefs(p => ({ ...p, push: granted }));
  };

  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🔔</div>
        <h2 style={{ margin:'0 0 8px', fontSize:22, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>Stay Connected</h2>
        <p style={{ margin:0, fontSize:14, color:'#94A3B8' }}>Choose how you want to be notified</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:28 }}>
        {[
          { key:'email',         icon:'✉️', label:'Email Notifications',      desc:'Receive updates and reminders via email' },
          { key:'rehearsal',     icon:'📅', label:'Rehearsal Reminders',      desc:'24h before mandatory events' },
          { key:'contributions', icon:'💰', label:'Contribution Reminders',   desc:'Monthly tithe reminders on the 5th' },
        ].map(pref => (
          <div key={pref.key} style={{
            display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
            background:'#141E33', border:'1px solid #1E2D4A', borderRadius:14,
          }}>
            <span style={{ fontSize:22 }}>{pref.icon}</span>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontSize:14, color:'#F0F4FF', fontWeight:500 }}>{pref.label}</p>
              <p style={{ margin:'2px 0 0', fontSize:12, color:'#64748B' }}>{pref.desc}</p>
            </div>
            <div
              onClick={() => setPrefs(p => ({ ...p, [pref.key]: !p[pref.key] }))}
              style={{
                width:44, height:24, borderRadius:12, cursor:'pointer', position:'relative',
                background: prefs[pref.key] ? 'linear-gradient(135deg, #A07820, #C9A84C)' : '#1E2D4A',
                transition:'all 0.3s',
                boxShadow: prefs[pref.key] ? '0 0 12px rgba(201,168,76,0.3)' : 'none',
              }}
            >
              <div style={{ position:'absolute', top:3, left: prefs[pref.key] ? 23 : 3, width:18, height:18, borderRadius:'50%', background: prefs[pref.key] ? '#fff' : '#475569', transition:'left 0.3s' }} />
            </div>
          </div>
        ))}

        {/* Push notification */}
        <div style={{
          padding:'16px 18px',
          background: pushed ? 'rgba(34,197,94,0.06)' : '#141E33',
          border:`1px solid ${pushed ? '#22C55E33' : '#1E2D4A'}`,
          borderRadius:14,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize:22 }}>📱</span>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontSize:14, color:'#F0F4FF', fontWeight:500 }}>Push Notifications</p>
              <p style={{ margin:'2px 0 0', fontSize:12, color:'#64748B' }}>
                {pushed ? '✓ Enabled — you\'ll receive real-time alerts' : 'Instant alerts even when the app is closed'}
              </p>
            </div>
            {!pushed ? (
              <button onClick={handleEnablePush} style={{
                padding:'7px 14px', background:'rgba(201,168,76,0.15)',
                border:'1px solid rgba(201,168,76,0.3)', borderRadius:8,
                color:'#C9A84C', fontSize:12, fontWeight:700, cursor:'pointer',
              }}>
                Enable
              </button>
            ) : (
              <span style={{ fontSize:18 }}>✅</span>
            )}
          </div>
        </div>
      </div>

      {/* PWA Install */}
      {canInstall && (
        <div style={{
          padding:'16px 18px', background:'rgba(201,168,76,0.06)',
          border:'1px solid rgba(201,168,76,0.2)', borderRadius:14, marginBottom:20,
          display:'flex', alignItems:'center', gap:14,
        }}>
          <span style={{ fontSize:28 }}>📲</span>
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontSize:14, color:'#F0F4FF', fontWeight:600 }}>Install the App</p>
            <p style={{ margin:'2px 0 0', fontSize:12, color:'#94A3B8' }}>Add to your home screen for faster access and offline support</p>
          </div>
          <InstallButton />
        </div>
      )}

      <button onClick={onNext} style={{
        width:'100%', padding:'13px',
        background:'linear-gradient(135deg, #A07820, #C9A84C)',
        border:'none', borderRadius:12, color:'#080C14', fontSize:14, fontWeight:700, cursor:'pointer',
      }}>
        Save Preferences →
      </button>
    </div>
  );
}

// ── Step: Complete ────────────────────────────────────────────
function CompleteStep({ member, onFinish }) {
  const [confetti, setConfetti] = useState(false);
  useEffect(() => { setTimeout(() => setConfetti(true), 200); }, []);

  const VP_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };
  const vpColor   = VP_COLORS[member?.voicePart] || '#C9A84C';

  return (
    <div style={{ textAlign:'center', padding:'10px 0' }}>
      {confetti && (
        <div style={{ fontSize:40, marginBottom:16, animation:'staggerReveal 0.5s ease' }}>
          🎊 🎵 🎉
        </div>
      )}

      <div style={{
        width:80, height:80, borderRadius:'50%', margin:'0 auto 20px',
        background:`linear-gradient(135deg, ${vpColor}22, ${vpColor}08)`,
        border:`3px solid ${vpColor}44`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:32,
        boxShadow:`0 0 32px ${vpColor}33`,
        animation:'glowPulse 2s ease-in-out infinite',
      }}>
        🏆
      </div>

      <h2 style={{ margin:'0 0 10px', fontSize:26, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>
        You're All Set, {member?.fullName?.split(' ')[0]}!
      </h2>
      <p style={{ margin:'0 0 28px', fontSize:15, color:'#94A3B8', lineHeight:1.7, maxWidth:400, margin:'0 auto 28px' }}>
        Welcome to the Inheritance Choir family. Your journey starts now — voices united in worship and excellence.
      </p>

      {/* Quick links */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, maxWidth:400, margin:'0 auto 28px', textAlign:'left' }}>
        {[
          { icon:'🏠', label:'Dashboard',    path:'/dashboard',              color:'#22C55E', desc:'Your overview' },
          { icon:'📅', label:'Events',       path:'/dashboard/events',       color:'#C9A84C', desc:'Upcoming rehearsals' },
          { icon:'🎵', label:'Live Chat',    path:'/dashboard/chat',         color:'#EC4899', desc:'Connect with members' },
          { icon:'💰', label:'Contributions',path:'/dashboard/contributions',color:'#3B82F6', desc:'Record your tithe' },
        ].map(link => (
          <div key={link.path} style={{
            background:`${link.color}08`, border:`1px solid ${link.color}22`,
            borderRadius:12, padding:'14px 16px',
          }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{link.icon}</div>
            <p style={{ margin:0, fontSize:13, color:'#F0F4FF', fontWeight:600 }}>{link.label}</p>
            <p style={{ margin:'2px 0 0', fontSize:11, color:'#64748B' }}>{link.desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onFinish}
        style={{
          padding:'14px 48px',
          background:'linear-gradient(135deg, #A07820, #C9A84C)',
          border:'none', borderRadius:14, color:'#080C14',
          fontSize:15, fontWeight:800, cursor:'pointer',
          boxShadow:'0 8px 32px rgba(201,168,76,0.35)',
          transition:'all 0.2s',
          letterSpacing:'0.05em',
        }}
        onMouseEnter={e => e.target.style.transform='translateY(-2px)'}
        onMouseLeave={e => e.target.style.transform='translateY(0)'}
      >
        Enter the Dashboard 🎵
      </button>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────
export default function OnboardingWizard({ onComplete }) {
  const { session, updateSession } = useAuth();
  const [step, setStep]   = useState(0);
  const [updates, setUpdates] = useState({});

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const handleUpdate = (data) => setUpdates(u => ({ ...u, ...data }));
  const handleFinish = () => {
    // Mark onboarding complete
    localStorage.setItem('choir_onboarding_done', session?.id);
    onComplete?.();
  };

  const stepProps = { member: { ...session, ...updates }, onNext: next, onUpdate: handleUpdate, onFinish: handleFinish };

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'linear-gradient(135deg, #080C14 0%, #0A1628 50%, #080C14 100%)',
      zIndex:99998, display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, fontFamily:'Crimson Pro, serif',
    }}>
      {/* Background orbs */}
      <div style={{ position:'absolute', top:'20%', left:'15%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', animation:'dbOrbFloat 6s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'25%', right:'15%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', animation:'dbOrbFloat 8s ease-in-out infinite reverse', pointerEvents:'none' }} />

      <div style={{
        width:'100%', maxWidth:540,
        background:'linear-gradient(180deg, #0F172A, #0A1628)',
        border:'1px solid #1E2D4A',
        borderRadius:24, padding:'36px 40px',
        boxShadow:'0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.06)',
        position:'relative', overflow:'hidden',
      }}>
        {/* Top gradient bar */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #A07820, #C9A84C, #F0C060, #C9A84C, #A07820)', backgroundSize:'200%', animation:'dbRimSweep 4s linear infinite' }} />

        <StepIndicator steps={STEPS} current={step} />

        <div style={{ minHeight:340 }}>
          {step === 0 && <WelcomeStep {...stepProps} />}
          {step === 1 && <ProfileStep {...stepProps} />}
          {step === 2 && <VoiceStep   {...stepProps} />}
          {step === 3 && <NotificationsStep {...stepProps} />}
          {step === 4 && <CompleteStep {...stepProps} />}
        </div>
      </div>
    </div>
  );
}

// ── Onboarding gate — wrap App ─────────────────────────────────
export function OnboardingGate({ children }) {
  const { session }  = useAuth();
  const [done, setDone] = useState(true); // start as done, check on mount

  useEffect(() => {
    if (!session?.id) { setDone(true); return; }
    const completed = localStorage.getItem('choir_onboarding_done');
    // Show wizard for newly approved members who haven't completed it
    const isNew = !completed || completed !== String(session.id);
    const wasApprovedRecently = session?.status === 'active' &&
      (Date.now() - new Date(session?.joinDate || 0).getTime()) < 7 * 24 * 3600000;
    setDone(!(isNew && wasApprovedRecently));
  }, [session?.id]);

  if (!done) return <OnboardingWizard onComplete={() => setDone(true)} />;
  return children;
}
