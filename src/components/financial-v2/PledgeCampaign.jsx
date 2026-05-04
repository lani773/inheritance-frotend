/**
 * INHERITANCE CHOIR — Pledge Campaigns & Receipt Generator
 */
import React, { useState, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// PLEDGE CAMPAIGN — crowdfunding-style drives with progress bars
// ═══════════════════════════════════════════════════════════════

const SAMPLE_CAMPAIGNS = [
  {
    id: 'c1', title: 'New Sound Equipment',
    description: 'Upgrade the choir sound system with professional microphones and a digital mixing board for better audio quality during services.',
    target: 2500000, raised: 1875000, pledgers: 18,
    deadline: '2026-06-30', category: 'equipment', urgent: false,
    updates: [
      { date: '2026-03-15', text: 'We have reached 75% of our goal! Thank you!' },
      { date: '2026-02-20', text: 'Equipment supplier confirmed. We need 25% more.' },
    ],
  },
  {
    id: 'c2', title: 'Christmas Concert Venue',
    description: 'Book the National Convention Center for our annual Christmas concert. Includes stage setup, lighting, and marketing materials.',
    target: 1200000, raised: 420000, pledgers: 9,
    deadline: '2026-09-01', category: 'event', urgent: true,
    updates: [],
  },
  {
    id: 'c3', title: 'Choir Uniforms Renewal',
    description: 'New choir robes and formal attire for all 24 members. High-quality fabric with gold trim matching our brand colors.',
    target: 800000, raised: 800000, pledgers: 22,
    deadline: '2026-04-30', category: 'uniform', urgent: false,
    updates: [{ date: '2026-03-28', text: '🎉 Campaign fully funded! Ordering uniforms this week.' }],
  },
];

const CATEGORY_CONFIG = {
  equipment: { icon: '🎛', color: '#3B82F6' },
  event:     { icon: '🎭', color: '#C9A84C' },
  uniform:   { icon: '👔', color: '#8B5CF6' },
  welfare:   { icon: '❤️', color: '#EC4899' },
  other:     { icon: '✨', color: '#22C55E' },
};

export function PledgeCampaign({ memberId }) {
  const [campaigns, setCampaigns] = useState(SAMPLE_CAMPAIGNS);
  const [pledging,  setPledging]  = useState(null); // campaign id
  const [amount,    setAmount]    = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [note,      setNote]      = useState('');
  const [success,   setSuccess]   = useState(null);

  const handlePledge = (campaign) => {
    const amt = parseInt(amount.replace(/,/g, ''));
    if (!amt || amt < 1000) return;

    setCampaigns(prev => prev.map(c => c.id === campaign.id
      ? { ...c, raised: c.raised + amt, pledgers: c.pledgers + 1 }
      : c
    ));
    setSuccess({ campaign: campaign.title, amount: amt });
    setPledging(null);
    setAmount(''); setNote('');
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <div style={{ fontFamily: 'Crimson Pro, serif', color: '#F0F4FF' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
          🤝 Pledge Campaigns
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
          Support choir projects and initiatives
        </p>
      </div>

      {/* Success toast */}
      {success && (
        <div style={{
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 12, padding: '12px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'slideDown 0.3s ease',
        }}>
          <span style={{ fontSize: 24 }}>🎉</span>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#22C55E' }}>
              Pledge submitted!
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>
              RWF {success.amount.toLocaleString()} pledged to "{success.campaign}"
            </p>
          </div>
        </div>
      )}

      {/* Campaign grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {campaigns.map(c => {
          const catCfg   = CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.other;
          const pct      = Math.min(100, Math.round((c.raised / c.target) * 100));
          const fulfilled = pct >= 100;
          const daysLeft  = Math.max(0, Math.ceil((new Date(c.deadline) - new Date()) / 86400000));
          const isPledging = pledging === c.id;

          return (
            <div key={c.id} style={{
              background: '#0F172A',
              border: `1px solid ${fulfilled ? '#22C55E22' : c.urgent ? '#EF444422' : '#1E2D4A'}`,
              borderRadius: 20, overflow: 'hidden',
            }}>
              {/* Campaign header */}
              <div style={{
                padding: '20px 22px 16px',
                background: `linear-gradient(135deg, ${catCfg.color}08, transparent)`,
                borderBottom: '1px solid #1E2D4A',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{catCfg.icon}</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F0F4FF', lineHeight: 1.3 }}>
                        {c.title}
                      </h3>
                      {c.urgent && !fulfilled && (
                        <span style={{ fontSize: 10, color: '#EF4444', background: '#EF444411', border: '1px solid #EF444433', borderRadius: 4, padding: '1px 6px', marginTop: 3, display: 'inline-block' }}>
                          ⚡ URGENT
                        </span>
                      )}
                    </div>
                  </div>
                  {fulfilled && <span style={{ fontSize: 18 }}>✅</span>}
                </div>

                <p style={{ margin: '0 0 14px', fontSize: 13, color: '#94A3B8', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.description}
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ height: 10, background: '#1E2D4A', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: fulfilled ? 'linear-gradient(90deg, #22C55E, #4ADE80)'
                        : pct > 60 ? 'linear-gradient(90deg, #A07820, #C9A84C)'
                        : 'linear-gradient(90deg, #374151, #64748B)',
                      borderRadius: 5, transition: 'width 0.8s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: fulfilled ? '#22C55E' : '#C9A84C', fontWeight: 700 }}>
                      RWF {c.raised.toLocaleString()} raised
                    </span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      of RWF {c.target.toLocaleString()} · {pct}%
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 11, color: '#64748B' }}>👥 {c.pledgers} pledgers</span>
                  <span style={{ fontSize: 11, color: daysLeft < 14 && !fulfilled ? '#EF4444' : '#64748B' }}>
                    📅 {fulfilled ? 'Funded!' : `${daysLeft}d left`}
                  </span>
                </div>
              </div>

              {/* Pledge form */}
              {!fulfilled && (
                <div style={{ padding: '16px 22px' }}>
                  {isPledging ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                          Pledge Amount (RWF)
                        </label>
                        {/* Quick amounts */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                          {[10000, 25000, 50000, 100000].map(amt => (
                            <button key={amt} onClick={() => setAmount(amt.toLocaleString())} style={{
                              padding: '4px 10px', background: amount === amt.toLocaleString() ? 'rgba(201,168,76,0.2)' : '#141E33',
                              border: `1px solid ${amount === amt.toLocaleString() ? '#C9A84C44' : '#1E2D4A'}`,
                              borderRadius: 6, color: amount === amt.toLocaleString() ? '#C9A84C' : '#64748B',
                              fontSize: 11, cursor: 'pointer',
                            }}>
                              {(amt/1000).toFixed(0)}K
                            </button>
                          ))}
                        </div>
                        <input
                          type="text" value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="Enter amount…"
                          style={{ width: '100%', background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 8, padding: '9px 12px', color: '#F0F4FF', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <textarea
                        value={note} onChange={e => setNote(e.target.value)}
                        placeholder="Optional message of support…"
                        rows={2}
                        style={{ background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 8, padding: '8px 12px', color: '#94A3B8', fontSize: 12, resize: 'none', outline: 'none', fontFamily: 'Crimson Pro, serif' }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} style={{ accentColor: '#C9A84C' }} />
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>Make pledge anonymous</span>
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setPledging(null); setAmount(''); }} style={{ flex: 1, padding: '9px', background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 8, color: '#64748B', fontSize: 12, cursor: 'pointer' }}>
                          Cancel
                        </button>
                        <button onClick={() => handlePledge(c)} disabled={!amount || parseInt(amount.replace(/,/g,'')) < 1000} style={{
                          flex: 2, padding: '9px',
                          background: amount && parseInt(amount.replace(/,/g,'')) >= 1000 ? 'linear-gradient(135deg, #A07820, #C9A84C)' : '#1E2D4A',
                          border: 'none', borderRadius: 8, color: '#080C14', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        }}>
                          🤝 Confirm Pledge
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setPledging(c.id)} style={{
                      width: '100%', padding: '10px',
                      background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
                      borderRadius: 10, color: '#C9A84C', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      🤝 Pledge Support
                    </button>
                  )}
                </div>
              )}

              {/* Updates */}
              {c.updates.length > 0 && (
                <div style={{ padding: '0 22px 16px' }}>
                  <p style={{ fontSize: 11, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Updates</p>
                  {c.updates.slice(0, 1).map((u, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#94A3B8', background: '#141E33', borderRadius: 8, padding: '8px 12px' }}>
                      <span style={{ color: '#374151', marginRight: 6 }}>{u.date}</span>
                      {u.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RECEIPT GENERATOR — auto PDF receipt with choir branding
// ═══════════════════════════════════════════════════════════════

export function ReceiptGenerator({ contribution, member, onClose }) {
  const receiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const c = contribution || {
    receiptNo: 'RC-20260401-A1B2', date: '2026-04-01',
    type: 'tithe', amount: 10000, currency: 'RWF',
    method: 'mobile_money', verified: true, notes: '',
  };
  const m = member || { fullName: 'Marie Claire Uwimana', voicePart: 'Soprano', email: 'marie@choir.rw' };

  const handlePrint = () => {
    const content = receiptRef.current?.innerHTML;
    if (!content) return;

    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=DM+Mono&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; padding: 20px; font-family: 'Crimson Pro', serif; background: #fff; color: #1a202c; }
      @page { size: A5; margin: 1cm; }
      @media print { body { padding: 0; } }
    `;

    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${styles}</style></head><body>${content}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const typeLabels = {
    tithe: 'Tithe', offering: 'Offering', special_gift: 'Special Gift',
    welfare_fund: 'Welfare Fund', fundraiser: 'Fundraiser', other: 'Other',
  };

  const methodLabels = {
    cash: 'Cash', mobile_money: 'Mobile Money (MTN MoMo)', bank_transfer: 'Bank Transfer',
    cheque: 'Cheque', online: 'Online',
  };

  return (
    <div style={{ fontFamily: 'Crimson Pro, serif' }}>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={handlePrint} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', background: 'linear-gradient(135deg, #A07820, #C9A84C)',
          border: 'none', borderRadius: 10, color: '#080C14', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          🖨 Print Receipt
        </button>
        <button onClick={handlePrint} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, color: '#C9A84C', fontSize: 13, cursor: 'pointer',
        }}>
          📄 Download PDF
        </button>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: 'auto', padding: '9px 16px', background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 10, color: '#64748B', fontSize: 13, cursor: 'pointer' }}>
            Close
          </button>
        )}
      </div>

      {/* Receipt preview */}
      <div ref={receiptRef} style={{
        background: '#fff', color: '#1a202c',
        borderRadius: 16, padding: '32px 36px',
        maxWidth: 480, border: '1px solid #e2e8f0',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        fontFamily: 'Crimson Pro, serif',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #C9A84C', paddingBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🎵</div>
          <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Cinzel, serif', color: '#A07820', letterSpacing: '0.05em' }}>
            INHERITANCE CHOIR
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#718096', fontStyle: 'italic' }}>
            Voices united in worship and excellence
          </p>
          <div style={{ marginTop: 12, padding: '6px 14px', background: '#FEFCE8', border: '1px solid #C9A84C33', borderRadius: 8, display: 'inline-block' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#A07820', fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em' }}>
              OFFICIAL RECEIPT
            </p>
          </div>
        </div>

        {/* Receipt number + date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Receipt No.</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#2D3748', fontFamily: 'DM Mono, monospace' }}>
              {c.receiptNo}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, color: '#2D3748' }}>{c.date}</p>
          </div>
        </div>

        {/* Member info */}
        <div style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Received from</p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#2D3748' }}>{m.fullName}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#718096' }}>{m.voicePart} · {m.email}</p>
        </div>

        {/* Contribution details table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ background: '#EDF2F7' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '12px 12px', fontSize: 14, color: '#2D3748' }}>
                {typeLabels[c.type] || c.type}
                {c.notes && <span style={{ display: 'block', fontSize: 11, color: '#718096', marginTop: 2 }}>{c.notes}</span>}
              </td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontSize: 16, fontWeight: 700, color: '#2D3748', fontFamily: 'DM Mono, monospace' }}>
                {c.currency} {c.amount.toLocaleString()}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ background: '#FEFCE8' }}>
              <td style={{ padding: '12px 12px', fontSize: 14, fontWeight: 700, color: '#A07820', fontFamily: 'Cinzel, serif' }}>TOTAL</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontSize: 18, fontWeight: 800, color: '#A07820', fontFamily: 'DM Mono, monospace' }}>
                {c.currency} {c.amount.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment method + verification */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment Method</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#2D3748' }}>{methodLabels[c.method] || c.method}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: c.verified ? '#38A169' : '#D69E2E', fontWeight: 700 }}>
              {c.verified ? '✓ Verified' : '⏳ Pending Verification'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '2px solid #E2E8F0', paddingTop: 16, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#A07820', fontStyle: 'italic', fontFamily: 'Cinzel, serif' }}>
            "Voices united in worship and excellence"
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#718096' }}>
            Inheritance Choir · Kigali, Rwanda · inheritancechoir@gmail.com
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 10, color: '#A0AEC0' }}>
            This is a computer-generated receipt. No signature required.
          </p>
        </div>
      </div>
    </div>
  );
}
