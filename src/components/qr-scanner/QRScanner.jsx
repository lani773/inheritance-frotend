/**
 * INHERITANCE CHOIR — QR Attendance Scanner
 * Camera-based QR code scanner for fast event check-in.
 * Uses jsQR library (pure JS, no native deps) with fallback to manual entry.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── jsQR loader (dynamic import to avoid build issues) ─────────
async function loadJsQR() {
  try {
    // Try to use jsQR if available
    if (window.jsQR) return window.jsQR;
    return null;
  } catch { return null; }
}

// ── Mock member lookup ─────────────────────────────────────────
function lookupMember(qrData) {
  const members = JSON.parse(localStorage.getItem('choir_members') || '[]');
  const found = members.find(m => String(m.id) === String(qrData) || m.email === qrData);
  if (found) return found;
  // Admin always resolves
  const admin = { id:1, fullName:'Jean Baptiste', voicePart:'Tenor', role:'president', status:'active' };
  if (String(qrData) === '1' || qrData === 'inheritancechoir@gmail.com') return admin;
  return null;
}

// ── Scan history item ──────────────────────────────────────────
function ScanRow({ scan, onUndo }) {
  const VP_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981', default:'#C9A84C' };
  const col = VP_COLORS[scan.voicePart] || VP_COLORS.default;

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'10px 16px', borderBottom:'1px solid #0A1628',
      animation:'slideDown 0.3s ease',
    }}>
      <div style={{
        width:36, height:36, borderRadius:'50%', flexShrink:0,
        background:`${col}22`, border:`1.5px solid ${col}44`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:13, fontWeight:700, color:col,
      }}>
        {scan.fullName?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
      </div>
      <div style={{ flex:1 }}>
        <p style={{ margin:0, fontSize:13, color:'#F0F4FF', fontWeight:500 }}>{scan.fullName}</p>
        <p style={{ margin:'1px 0 0', fontSize:11, color:col }}>
          {scan.voicePart} · {new Date(scan.scannedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
        </p>
      </div>
      <span style={{
        fontSize:11, color:'#22C55E', background:'#22C55E11',
        border:'1px solid #22C55E33', borderRadius:6, padding:'2px 8px',
      }}>
        ✓ Checked in
      </span>
      <button
        onClick={() => onUndo(scan.id)}
        style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:12, padding:'2px 6px' }}
        title="Undo"
      >
        ↩
      </button>
    </div>
  );
}

// ── Main Scanner ───────────────────────────────────────────────
export default function QRScanner({ eventId, eventTitle = 'Event', onCheckIn }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const animRef    = useRef(null);
  const streamRef  = useRef(null);

  const [mode,       setMode]       = useState('camera'); // camera | manual | list
  const [scanning,   setScanning]   = useState(false);
  const [lastScan,   setLastScan]   = useState(null);
  const [scanHistory,setScanHistory]= useState([]);
  const [manualId,   setManualId]   = useState('');
  const [error,      setError]      = useState(null);
  const [flashColor, setFlashColor] = useState(null);
  const [stats, setStats]           = useState({ present:0, absent:0, total:0 });
  const recentScanRef = useRef(null);

  const VP_SUMMARY = scanHistory.reduce((acc, s) => {
    acc[s.voicePart] = (acc[s.voicePart]||0) + 1; return acc;
  }, {});

  // ── Camera start / stop ────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal:'environment' }, width:{ ideal:1280 }, height:{ ideal:720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        scanFrame();
      }
    } catch (e) {
      setError(e.name === 'NotAllowedError'
        ? 'Camera permission denied. Use manual entry below.'
        : 'Camera not available. Use manual entry below.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setScanning(false);
  }, []);

  useEffect(() => {
    if (mode === 'camera') startCamera();
    return stopCamera;
  }, [mode]);

  // ── Scan frame ────────────────────────────────────────────
  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scanFrame); return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const jsQR = await loadJsQR();
    if (jsQR) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code      = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts:'dontInvert' });
      if (code?.data) {
        handleScan(code.data);
        await new Promise(r => setTimeout(r, 1500)); // debounce
      }
    }
    animRef.current = requestAnimationFrame(scanFrame);
  }, []);

  // ── Handle scan result ────────────────────────────────────
  const handleScan = useCallback((qrData) => {
    if (recentScanRef.current === qrData) return; // dedupe
    recentScanRef.current = qrData;
    setTimeout(() => { recentScanRef.current = null; }, 3000);

    const member = lookupMember(qrData);
    if (!member) {
      setFlashColor('#EF4444');
      setLastScan({ error: true, qrData, message:'Member not found' });
      setTimeout(() => setFlashColor(null), 600);
      return;
    }

    if (scanHistory.find(s => s.memberId === member.id)) {
      setFlashColor('#F59E0B');
      setLastScan({ error: false, duplicate:true, ...member, scannedAt: Date.now() });
      setTimeout(() => setFlashColor(null), 600);
      return;
    }

    const scanRecord = { id:`scan_${Date.now()}`, memberId:member.id, fullName:member.fullName,
                         voicePart:member.voicePart, scannedAt:Date.now() };
    setScanHistory(h => [scanRecord, ...h]);
    setLastScan({ error:false, duplicate:false, ...member, scannedAt: Date.now() });
    setFlashColor('#22C55E');
    setTimeout(() => setFlashColor(null), 600);

    onCheckIn?.({ eventId, member, timestamp: new Date().toISOString() });
  }, [scanHistory, eventId, onCheckIn]);

  const handleManualEntry = () => {
    if (!manualId.trim()) return;
    handleScan(manualId.trim());
    setManualId('');
  };

  const undoScan = (scanId) => {
    setScanHistory(h => h.filter(s => s.id !== scanId));
  };

  const VP_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };

  return (
    <div style={{ fontFamily:'Crimson Pro, serif', color:'#F0F4FF', display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>
            📷 QR Check-in
          </h2>
          <p style={{ margin:'3px 0 0', fontSize:13, color:'#64748B' }}>{eventTitle}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['camera','manual','list'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding:'7px 16px', borderRadius:10, border:'none',
                background: mode===m ? 'rgba(201,168,76,0.2)' : '#141E33',
                color: mode===m ? '#C9A84C' : '#64748B',
                fontSize:12, cursor:'pointer', fontWeight: mode===m ? 700 : 400,
                boxShadow: mode===m ? '0 0 0 1px rgba(201,168,76,0.3)' : 'none',
                transition:'all 0.15s',
              }}
            >
              {{camera:'📷 Camera', manual:'⌨ Manual', list:'📋 List'}[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:10 }}>
        {[
          { label:'Checked In', value:scanHistory.length, color:'#22C55E' },
          ...Object.entries(VP_SUMMARY).map(([vp, count]) => ({
            label:vp, value:count, color:VP_COLORS[vp]||'#94A3B8',
          })),
        ].map(s => (
          <div key={s.label} style={{
            background:'#0F172A', border:'1px solid #1E2D4A',
            borderRadius:12, padding:'12px 16px', textAlign:'center',
          }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, fontFamily:'DM Mono, monospace' }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
        {/* Scanner / manual */}
        <div>
          {mode === 'camera' && (
            <div style={{ position:'relative', borderRadius:20, overflow:'hidden', background:'#000' }}>
              {/* Flash overlay */}
              {flashColor && (
                <div style={{
                  position:'absolute', inset:0, background:flashColor,
                  opacity:0.35, zIndex:10, borderRadius:20,
                  animation:'fadeIn 0.1s ease',
                  pointerEvents:'none',
                }} />
              )}

              <video
                ref={videoRef}
                muted playsInline
                style={{ width:'100%', display:'block', borderRadius:20 }}
              />
              <canvas ref={canvasRef} style={{ display:'none' }} />

              {/* Scan frame overlay */}
              {scanning && (
                <div style={{
                  position:'absolute', inset:'20%', border:'2px solid #C9A84C',
                  borderRadius:12, zIndex:5, boxShadow:'0 0 0 4000px rgba(0,0,0,0.4)',
                }}>
                  {/* Corner accents */}
                  {[['top:0;left:0','border-top','border-left'],
                    ['top:0;right:0','border-top','border-right'],
                    ['bottom:0;left:0','border-bottom','border-left'],
                    ['bottom:0;right:0','border-bottom','border-right'],
                  ].map(([pos], i) => (
                    <div key={i} style={{
                      position:'absolute', width:20, height:20,
                      ...(pos.includes('top:0') ? {top:0}:{bottom:0}),
                      ...(pos.includes('left:0') ? {left:0}:{right:0}),
                      borderColor:'#C9A84C', borderWidth:3, borderStyle:'solid',
                      borderTopWidth: pos.includes('bottom') ? 0 : 3,
                      borderBottomWidth: pos.includes('top:0') ? 0 : 3,
                      borderLeftWidth: pos.includes('right:0') ? 0 : 3,
                      borderRightWidth: pos.includes('left:0') ? 0 : 3,
                    }} />
                  ))}
                  {/* Scanning line */}
                  <div style={{
                    position:'absolute', left:0, right:0, height:2,
                    background:'linear-gradient(90deg, transparent, #C9A84C, transparent)',
                    animation:'scanLine 2s ease-in-out infinite',
                    top:'50%',
                  }} />
                </div>
              )}

              {error && (
                <div style={{
                  position:'absolute', bottom:0, left:0, right:0,
                  background:'rgba(239,68,68,0.9)', padding:'12px 16px',
                  fontSize:13, color:'#fff', textAlign:'center',
                }}>
                  {error}
                </div>
              )}

              {!scanning && !error && (
                <div style={{
                  position:'absolute', inset:0, display:'flex',
                  alignItems:'center', justifyContent:'center',
                  background:'rgba(0,0,0,0.7)',
                }}>
                  <button
                    onClick={startCamera}
                    style={{
                      padding:'12px 24px', background:'linear-gradient(135deg, #A07820, #C9A84C)',
                      border:'none', borderRadius:12, color:'#080C14',
                      fontSize:14, fontWeight:700, cursor:'pointer',
                    }}
                  >
                    📷 Start Camera
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'manual' && (
            <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:20, padding:24 }}>
              <h3 style={{ margin:'0 0 16px', fontSize:15, fontFamily:'Cinzel, serif' }}>Manual Entry</h3>
              <p style={{ fontSize:13, color:'#64748B', marginBottom:16 }}>
                Enter member ID or email address to check in manually.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <input
                  value={manualId}
                  onChange={e => setManualId(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && handleManualEntry()}
                  placeholder="Member ID or email…"
                  style={{
                    flex:1, background:'#141E33', border:'1px solid #1E2D4A',
                    borderRadius:10, padding:'11px 14px', color:'#F0F4FF',
                    fontSize:14, outline:'none',
                  }}
                  autoFocus
                />
                <button
                  onClick={handleManualEntry}
                  disabled={!manualId.trim()}
                  style={{
                    padding:'11px 20px', background: manualId.trim() ? 'linear-gradient(135deg, #A07820, #C9A84C)' : '#1E2D4A',
                    border:'none', borderRadius:10, color:'#080C14',
                    fontSize:13, fontWeight:700, cursor: manualId.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Check In
                </button>
              </div>
            </div>
          )}

          {/* Last scan feedback */}
          {lastScan && (
            <div style={{
              marginTop:16, padding:'14px 18px',
              background: lastScan.error ? 'rgba(239,68,68,0.1)' : lastScan.duplicate ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
              border: `1px solid ${lastScan.error ? '#EF444433' : lastScan.duplicate ? '#F59E0B33' : '#22C55E33'}`,
              borderRadius:14, display:'flex', alignItems:'center', gap:12,
              animation:'slideDown 0.3s ease',
            }}>
              <span style={{ fontSize:24 }}>
                {lastScan.error ? '❌' : lastScan.duplicate ? '⚠️' : '✅'}
              </span>
              <div>
                <p style={{ margin:0, fontSize:13, fontWeight:600,
                  color: lastScan.error ? '#EF4444' : lastScan.duplicate ? '#F59E0B' : '#22C55E' }}>
                  {lastScan.error ? 'Not found'
                   : lastScan.duplicate ? `${lastScan.fullName} already checked in`
                   : `${lastScan.fullName} checked in!`}
                </p>
                {!lastScan.error && <p style={{ margin:'2px 0 0', fontSize:11, color:'#64748B' }}>{lastScan.voicePart}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Scan history */}
        <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:20, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #1E2D4A', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h4 style={{ margin:0, fontSize:14, fontFamily:'Cinzel, serif' }}>
              Check-In Log
              <span style={{ marginLeft:8, fontSize:12, color:'#22C55E', fontFamily:'DM Mono, monospace' }}>
                {scanHistory.length}
              </span>
            </h4>
          </div>
          <div style={{ maxHeight:400, overflowY:'auto' }}>
            {scanHistory.length === 0 ? (
              <div style={{ padding:'40px', textAlign:'center', color:'#374151', fontSize:13 }}>
                No check-ins yet. Scan a QR code to begin.
              </div>
            ) : (
              scanHistory.map(s => <ScanRow key={s.id} scan={s} onUndo={undoScan} />)
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 10%; }
          50%  { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}
