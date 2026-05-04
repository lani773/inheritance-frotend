/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Forgot Password Page  (Task 2 — Complete)
   
   Step 1 — Email input (animated key icon, safe response)
   Step 2 — OTP verification (6-box, countdown, resend)
   Step 3 — New password (strength meter, confirm match)
   Step 4 — Success (auto-redirect indicator to login)
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/index';
import Button from '../../components/shared/Button';
import Input  from '../../components/shared/Input';
import { InfoBox } from '../../components/shared/index';
import { getPasswordStrength, maskEmail } from '../../utils/index';

/* ─────────────────────────────────────────────────────────────── */
/* Mini step pill bar                                              */
/* ─────────────────────────────────────────────────────────────── */
function MiniSteps({ current }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
      {['Email', 'Verify', 'Reset', 'Done'].map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              height: 4, width: active ? 32 : done ? 20 : 12,
              borderRadius: 2,
              background: done
                ? 'var(--color-success)'
                : active
                  ? 'var(--gold)'
                  : 'var(--border-default)',
              transition: 'all 0.3s ease',
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 8,
              color: active ? 'var(--gold)' : done ? 'var(--color-success)' : 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              transition: 'color 0.3s',
              display: current === n || current - 1 === i || current + 1 === n ? 'block' : 'none',
            }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function ForgotPasswordPage() {
  const navigate  = useNavigate();

  const [step,      setStep]      = useState(1);
  const [email,     setEmail]     = useState('');
  const [otpDigits, setOtpDigits] = useState(['','','','','','']);
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [countdown, setCountdown] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const cdRef  = useRef(null);
  const otpRefs = useRef([]);

  const strength = getPasswordStrength(newPw);

  /* ── Countdown ────────────────────────────────────────────── */
  const startCountdown = (secs = 60) => {
    setCountdown(secs);
    clearInterval(cdRef.current);
    cdRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(cdRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(cdRef.current), []);

  /* ── Auto-redirect after success ────────────────────────── */
  useEffect(() => {
    if (step !== 4) return;
    setRedirecting(true);
    const t = setTimeout(() => navigate('/login'), 3000);
    return () => clearTimeout(t);
  }, [step, navigate]);

  /* ── Step 1: Send OTP ───────────────────────────────────── */
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address'); return; }
    setLoading(true);
    try {
      await authService.sendResetOTP(email);
      startCountdown(60);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify OTP ─────────────────────────────────── */
  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits]; next[i] = val;
    setOtpDigits(next); setError('');
    if (val && i < 5) setTimeout(() => otpRefs.current[i + 1]?.focus(), 10);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otpDigits.join('');
    setLoading(true);
    try {
      await authService.verifyOTP(email, code);
      setError('');
      setStep(3);
    } catch (err) {
      setError(err.message);
      setOtpDigits(['','','','','','']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: Reset password ─────────────────────────────── */
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPw.length < 8)  { setError('Password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authService.resetPassword(email, newPw);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared card wrapper ─────────────────────────────────── */
  const Card = ({ children }) => (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-2xl)', overflow: 'hidden',
    }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,var(--gold),transparent)' }} />
      <div style={{ padding: '32px 28px 28px' }}>{children}</div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px', fontFamily: 'var(--font-body)',
    }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp 0.4s ease both' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg,var(--gold-deep),var(--gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 12px', boxShadow: 'var(--shadow-gold)',
          }}>
            🔑
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            INHERITANCE CHOIR
          </h1>
        </div>

        {/* Mini step pills */}
        <MiniSteps current={step} />

        {/* ════════════════════════════════════════════════
            STEP 1 — Enter Email
           ════════════════════════════════════════════════ */}
        {step === 1 && (
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                fontSize: 52, marginBottom: 12,
                display: 'inline-block',
                animation: 'float 3s ease-in-out infinite',
              }}>
                🔑
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                Forgot Password?
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Enter the email associated with your account and we'll send you a reset code.
              </p>
            </div>

            {error && (
              <InfoBox type="error" style={{ marginBottom: 16, animation: 'fadeDown 0.2s ease' }}>
                {error}
              </InfoBox>
            )}

            <form onSubmit={handleSendOTP} noValidate>
              <Input
                label="Email Address" type="email"
                value={email} onChange={val => { setEmail(val); setError(''); }}
                placeholder="your.email@example.com"
                icon="✉️" required autoFocus
                style={{ marginBottom: 16 }}
              />
              <InfoBox type="info" style={{ marginBottom: 20, fontSize: 12 }}>
                For security, we won't confirm whether this email address is registered.
              </InfoBox>
              <Button type="submit" variant="primary" fullWidth loading={loading} size="lg">
                Send Reset Code →
              </Button>
            </form>
          </Card>
        )}

        {/* ════════════════════════════════════════════════
            STEP 2 — Verify OTP
           ════════════════════════════════════════════════ */}
        {step === 2 && (
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>📬</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                Enter Reset Code
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                Code sent to <strong style={{ color: 'var(--text-primary)' }}>{maskEmail(email)}</strong>
              </p>
              <div style={{
                display: 'inline-block', marginTop: 8,
                background: 'var(--gold-alpha-10)', border: '1px solid var(--gold-alpha-20)',
                borderRadius: 'var(--radius-full)', padding: '3px 12px',
                fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)',
              }}>
                Dev mode: any 6-digit code works
              </div>
            </div>

            {error && (
              <InfoBox type="error" style={{ marginBottom: 16 }}>{error}</InfoBox>
            )}

            <form onSubmit={handleVerifyOTP} noValidate>
              {/* 6-box OTP */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                {otpDigits.map((v, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1}
                    value={v}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => e.key === 'Backspace' && !v && i > 0 && otpRefs.current[i-1]?.focus()}
                    onPaste={e => {
                      const t = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
                      if (t.length > 0) { setOtpDigits([...t.split(''),'','','','','',''].slice(0,6)); otpRefs.current[Math.min(t.length,5)]?.focus(); }
                      e.preventDefault();
                    }}
                    style={{
                      width: 46, height: 54, borderRadius: 'var(--radius-md)',
                      border: `2px solid ${v ? 'var(--gold)' : 'var(--border-default)'}`,
                      background: 'var(--bg-input)', color: 'var(--text-primary)',
                      fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 700,
                      textAlign: 'center', outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px var(--gold-alpha-10)'; }}
                    onBlur={e => { e.target.style.borderColor = v ? 'var(--gold)' : 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
                  />
                ))}
              </div>

              {/* Countdown / resend */}
              <div style={{ textAlign: 'center', marginBottom: 20, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                {countdown > 0 ? (
                  <>Resend in <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: countdown < 10 ? 'var(--color-error)' : 'var(--text-primary)' }}>{countdown}s</span></>
                ) : (
                  <>
                    Didn't receive it?{' '}
                    <button type="button" onClick={() => { startCountdown(60); setOtpDigits(['','','','','','']); }}
                      style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>
                      Resend code
                    </button>
                  </>
                )}
              </div>

              <Button
                type="submit" variant="primary" fullWidth
                loading={loading} disabled={otpDigits.join('').length !== 6}
                size="lg"
              >
                Verify Code →
              </Button>
            </form>
          </Card>
        )}

        {/* ════════════════════════════════════════════════
            STEP 3 — New Password
           ════════════════════════════════════════════════ */}
        {step === 3 && (
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🔐</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                Create New Password
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                Choose a strong password for your account
              </p>
            </div>

            {error && (
              <InfoBox type="error" style={{ marginBottom: 16 }}>{error}</InfoBox>
            )}

            <form onSubmit={handleReset} noValidate>
              <Input
                label="New Password" type="password"
                value={newPw} onChange={val => { setNewPw(val); setError(''); }}
                placeholder="Create a strong password" icon="🔒"
                required style={{ marginBottom: newPw ? 6 : 14 }}
              />

              {/* Strength meter */}
              {newPw && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i <= strength.score ? strength.color : 'var(--border-subtle)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                    color: strength.color, letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    {strength.label}
                  </span>
                </div>
              )}

              <Input
                label="Confirm New Password" type="password"
                value={confirmPw} onChange={val => { setConfirmPw(val); setError(''); }}
                placeholder="Repeat your new password" icon="🔒"
                required
                style={{ marginBottom: 20 }}
                iconRight={confirmPw && newPw && confirmPw === newPw ? '✅' : confirmPw ? '❌' : null}
              />

              <Button type="submit" variant="primary" fullWidth loading={loading} size="lg">
                Reset Password →
              </Button>
            </form>
          </Card>
        )}

        {/* ════════════════════════════════════════════════
            STEP 4 — Success
           ════════════════════════════════════════════════ */}
        {step === 4 && (
          <Card>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--bg-success)',
                border: '2px solid var(--color-success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 38, margin: '0 auto 20px',
                boxShadow: '0 0 30px rgba(34,197,94,0.3)',
                animation: 'scaleIn 0.4s var(--transition-spring) both',
              }}>
                🎉
              </div>

              <h2 style={{
                fontFamily: 'var(--font-heading)', fontSize: 22,
                color: 'var(--color-success)', margin: '0 0 10px',
              }}>
                Password Reset!
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 14,
                color: 'var(--text-secondary)', marginBottom: 24,
                lineHeight: 1.6,
              }}>
                Your password has been updated successfully.<br />
                You can now sign in with your new password.
              </p>

              {/* Auto-redirect indicator */}
              <div style={{
                background: 'var(--gold-alpha-10)',
                border: '1px solid var(--gold-alpha-20)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px', marginBottom: 20,
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--text-muted)', textAlign: 'center',
              }}>
                Redirecting to login in 3 seconds…
              </div>

              <Button
                variant="primary" fullWidth
                onClick={() => navigate('/login')} size="lg"
              >
                Sign In Now →
              </Button>
            </div>
          </Card>
        )}

        {/* Back to login */}
        {step < 4 && (
          <p style={{
            textAlign: 'center', marginTop: 20,
            fontFamily: 'var(--font-body)', fontSize: 13,
            color: 'var(--text-secondary)',
          }}>
            <Link to="/login" style={{ color: 'var(--gold)' }}>
              ← Back to Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
