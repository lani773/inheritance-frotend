/**
 * INHERITANCE CHOIR — Profile: Contributions (Sub-page 3)
 * Personal financial ledger, statements, pledge tracker, receipt generator.
 */
import React, { useState, useMemo } from 'react';
import { useOutletContext }  from 'react-router-dom';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNotifications } from '../../../context/NotificationsContext';
import { MobileMoneyButton }from '../../../components/financial/BudgetPlanner';
import { ReceiptGenerator } from '../../../components/financial-v2/PledgeCampaign';

const TYPE_CONFIG = {
  tithe:        { color:'#C9A84C', label:'Tithe',         icon:'🏛️' },
  offering:     { color:'#3B82F6', label:'Offering',      icon:'💝' },
  special_gift: { color:'#8B5CF6', label:'Special Gift',  icon:'🎁' },
  welfare_fund: { color:'#EC4899', label:'Welfare Fund',  icon:'❤️' },
  fundraiser:   { color:'#22C55E', label:'Fundraiser',    icon:'🌿' },
};

const SEED_CONTRIBS = [
  { id:'c1', date:'2026-04-01', type:'tithe',       amount:10000, method:'mobile_money', verified:true,  receiptNo:'RC-20260401-A1B2', notes:'' },
  { id:'c2', date:'2026-03-24', type:'offering',    amount:3000,  method:'cash',         verified:true,  receiptNo:'RC-20260324-C3D4', notes:'' },
  { id:'c3', date:'2026-03-05', type:'tithe',       amount:10000, method:'mobile_money', verified:true,  receiptNo:'RC-20260305-E5F6', notes:'' },
  { id:'c4', date:'2026-02-28', type:'welfare_fund',amount:5000,  method:'mobile_money', verified:false, receiptNo:'RC-20260228-G7H8', notes:'Pending review' },
  { id:'c5', date:'2026-02-14', type:'special_gift',amount:15000, method:'bank_transfer',verified:true,  receiptNo:'RC-20260214-I9J0', notes:'Valentine offering' },
  { id:'c6', date:'2026-02-05', type:'tithe',       amount:10000, method:'mobile_money', verified:true,  receiptNo:'RC-20260205-K1L2', notes:'' },
  { id:'c7', date:'2026-01-24', type:'offering',    amount:2500,  method:'cash',         verified:true,  receiptNo:'RC-20260124-M3N4', notes:'' },
  { id:'c8', date:'2026-01-05', type:'tithe',       amount:10000, method:'mobile_money', verified:true,  receiptNo:'RC-20260105-O5P6', notes:'' },
];

const METHODS = { mobile_money:'MTN MoMo', cash:'Cash', bank_transfer:'Bank Transfer', airtel:'Airtel Money', cheque:'Cheque' };

export default function ProfileContributionsPage() {
  const { session }   = useOutletContext();
  const { toast }     = useNotifications();

  const [tab,          setTab]         = useState('ledger');
  const [typeFilter,   setTypeFilter]  = useState('all');
  const [statusFilter, setStatusFilter]= useState('all');
  const [sortCol,      setSortCol]     = useState('date');
  const [sortDir,      setSortDir]     = useState('desc');
  const [showReceipt,  setShowReceipt] = useState(null);
  const [showPay,      setShowPay]     = useState(false);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const months = ['Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
    const values  = [8000, 12500, 11000, 10000, 27500, 13000, 10000];
    return months.map((m,i) => ({ month:m, amount:values[i] }));
  }, []);

  // Type breakdown
  const typeBreakdown = useMemo(() => {
    const totals = {};
    SEED_CONTRIBS.filter(c=>c.verified).forEach(c => { totals[c.type] = (totals[c.type]||0)+c.amount; });
    return Object.entries(totals).map(([type,amount]) => ({ type, amount, ...TYPE_CONFIG[type] }));
  }, []);

  const filtered = useMemo(() => {
    let list = [...SEED_CONTRIBS];
    if (typeFilter !== 'all') list = list.filter(c => c.type === typeFilter);
    if (statusFilter === 'verified') list = list.filter(c => c.verified);
    if (statusFilter === 'pending')  list = list.filter(c => !c.verified);
    list.sort((a,b) => {
      const aVal = sortCol==='amount' ? a[sortCol] : a[sortCol];
      const bVal = sortCol==='amount' ? b[sortCol] : b[sortCol];
      return sortDir==='asc' ? (aVal>bVal?1:-1) : (aVal<bVal?1:-1);
    });
    return list;
  }, [typeFilter, statusFilter, sortCol, sortDir]);

  const total    = SEED_CONTRIBS.filter(c=>c.verified).reduce((s,c)=>s+c.amount,0);
  const ytd      = SEED_CONTRIBS.filter(c=>c.verified && c.date.startsWith('2026')).reduce((s,c)=>s+c.amount,0);
  const monthly  = Math.round(ytd / 4);

  const SortBtn = ({ col, label }) => (
    <button onClick={()=>{ if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortCol(col); setSortDir('desc'); } }}
      style={{ background:'none', border:'none', cursor:'pointer', color:'#C9A84C', fontSize:12, fontWeight:700, padding:0, display:'flex', alignItems:'center', gap:3 }}>
      {label} {sortCol===col ? (sortDir==='asc'?'↑':'↓') : ''}
    </button>
  );

  const exportCSV = () => {
    const headers = 'Date,Type,Amount (RWF),Method,Status,Receipt No\n';
    const rows = filtered.map(c=>`${c.date},${c.type},${c.amount},${METHODS[c.method]||c.method},${c.verified?'Verified':'Pending'},${c.receiptNo}`).join('\n');
    const blob = new Blob([headers+rows], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='my_contributions.csv'; a.click();
    URL.revokeObjectURL(url);
    toast('Exported to CSV', { type:'success' });
  };

  return (
    <div style={{ padding:'28px 32px' }}>
      {/* Receipt Modal */}
      {showReceipt && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
             onClick={e=>e.target===e.currentTarget&&setShowReceipt(null)}>
          <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:20, padding:28, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }}>
            <ReceiptGenerator contribution={showReceipt} member={{ fullName:session?.fullName, voicePart:session?.voicePart, email:session?.email }} onClose={()=>setShowReceipt(null)} />
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Year to Date', value:`RWF ${(ytd/1000).toFixed(0)}K`, color:'#C9A84C', icon:'💰' },
          { label:'Monthly Avg',  value:`RWF ${(monthly/1000).toFixed(1)}K`, color:'#3B82F6', icon:'📊' },
          { label:'All-Time Total',value:`RWF ${(total/1000).toFixed(0)}K`, color:'#22C55E', icon:'⭐' },
          { label:'Consistency',  value:`${Math.round(4/4*100)}%`,          color:'#F59E0B', icon:'🔥' },
        ].map(s=>(
          <div key={s.label} style={{ background:'#0F172A', border:`1px solid ${s.color}22`, borderRadius:14, padding:'16px 18px', borderLeft:`3px solid ${s.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:18 }}>{s.icon}</span>
              <span style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</span>
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:'DM Mono, monospace', lineHeight:1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, marginBottom:24 }}>
        <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, padding:'18px 20px' }}>
          <h4 style={{ margin:'0 0 16px', fontSize:13, fontFamily:'Cinzel, serif', color:'#F0F4FF' }}>Monthly Contributions</h4>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" stroke="#374151" tick={{ fill:'#64748B', fontSize:10 }} />
              <YAxis stroke="#374151" tick={{ fill:'#64748B', fontSize:10 }} tickFormatter={v=>`${v/1000}K`} />
              <Tooltip formatter={v=>[`RWF ${v.toLocaleString()}`,'Amount']} contentStyle={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:6, fontSize:11 }} />
              <Bar dataKey="amount" fill="#C9A84C" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, padding:'18px 20px' }}>
          <h4 style={{ margin:'0 0 16px', fontSize:13, fontFamily:'Cinzel, serif', color:'#F0F4FF' }}>By Type</h4>
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie data={typeBreakdown} cx="50%" cy="50%" innerRadius={28} outerRadius={46} dataKey="amount">
                {typeBreakdown.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v=>[`RWF ${v.toLocaleString()}`]} contentStyle={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:6, fontSize:10 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {typeBreakdown.map(t=>(
              <div key={t.type} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#94A3B8' }}>
                <div style={{ width:8, height:8, borderRadius:2, background:t.color }} />
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[{id:'ledger',l:'Ledger'},{id:'pledges',l:'Pledges'},{id:'pay',l:'Make Payment'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'7px 16px', borderRadius:10, border:'none', background:tab===t.id?'rgba(201,168,76,0.15)':'#141E33', color:tab===t.id?'#C9A84C':'#64748B', fontSize:12, fontWeight:tab===t.id?700:400, cursor:'pointer', boxShadow:tab===t.id?'0 0 0 1px rgba(201,168,76,0.3)':'none', transition:'all 0.15s' }}>
            {t.l}
          </button>
        ))}
        <button onClick={exportCSV} style={{ marginLeft:'auto', padding:'7px 14px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:10, color:'#22C55E', fontSize:12, cursor:'pointer', fontWeight:600 }}>
          📊 Export CSV
        </button>
      </div>

      {/* ── Ledger ── */}
      {tab === 'ledger' && (
        <div>
          {/* Filters */}
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ background:'#141E33', border:'1px solid #1E2D4A', borderRadius:8, padding:'6px 10px', color:'#F0F4FF', fontSize:12 }}>
              <option value="all">All Types</option>
              {Object.entries(TYPE_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ background:'#141E33', border:'1px solid #1E2D4A', borderRadius:8, padding:'6px 10px', color:'#F0F4FF', fontSize:12 }}>
              <option value="all">All Status</option>
              <option value="verified">Verified only</option>
              <option value="pending">Pending only</option>
            </select>
          </div>

          <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, overflow:'hidden' }}>
            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 120px 160px 90px 60px', gap:0, background:'#141E33', padding:'10px 16px' }}>
              {[{k:'date',l:'Date'},{k:null,l:'Type'},{k:'amount',l:'Amount'},{k:null,l:'Method'},{k:null,l:'Status'},{k:null,l:''}].map((h,i)=>(
                <div key={i} style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  {h.k ? <SortBtn col={h.k} label={h.l} /> : h.l}
                </div>
              ))}
            </div>
            {filtered.map((c,i)=>{
              const tc = TYPE_CONFIG[c.type]||TYPE_CONFIG.tithe;
              return (
                <div key={c.id} style={{ display:'grid', gridTemplateColumns:'120px 1fr 120px 160px 90px 60px', gap:0, padding:'11px 16px', borderTop:'1px solid #0A1628', background:i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize:12, color:'#94A3B8', fontFamily:'DM Mono, monospace' }}>{c.date}</span>
                  <span style={{ fontSize:12, color:tc.color, display:'flex', alignItems:'center', gap:5 }}>{tc.icon} {tc.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#C9A84C', fontFamily:'DM Mono, monospace' }}>{c.amount.toLocaleString()}</span>
                  <span style={{ fontSize:11, color:'#94A3B8' }}>{METHODS[c.method]||c.method}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:c.verified?'#22C55E':'#F59E0B' }}>{c.verified?'✓ Verified':'⏳ Pending'}</span>
                  <button onClick={()=>setShowReceipt(c)} style={{ background:'none', border:'none', color:'#C9A84C', cursor:'pointer', fontSize:11 }}>🖨</button>
                </div>
              );
            })}
            {/* Footer total */}
            <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 120px 160px 90px 60px', gap:0, padding:'11px 16px', borderTop:'2px solid rgba(201,168,76,0.3)', background:'rgba(201,168,76,0.04)' }}>
              <span style={{ fontSize:12, color:'#C9A84C', fontWeight:700, gridColumn:'1/3' }}>Total ({filtered.length} records)</span>
              <span style={{ fontSize:13, fontWeight:800, color:'#C9A84C', fontFamily:'DM Mono, monospace' }}>
                {filtered.filter(c=>c.verified).reduce((s,c)=>s+c.amount,0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Pledges ── */}
      {tab === 'pledges' && (
        <div style={{ maxWidth:640 }}>
          {[
            { title:'Annual Fundraiser', amount:50000, paid:20000, due:'2026-06-30' },
            { title:'Welfare Fund Pledge', amount:10000, paid:10000, due:'2026-03-31' },
          ].map((p,i)=>{
            const pct = Math.min(100,Math.round((p.paid/p.amount)*100));
            return (
              <div key={i} style={{ background:'#0F172A', border:`1px solid ${pct>=100?'#22C55E22':'#1E2D4A'}`, borderRadius:16, padding:'20px 22px', marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#F0F4FF' }}>{p.title}</p>
                  {pct>=100&&<span style={{ fontSize:11, color:'#22C55E', background:'#22C55E11', border:'1px solid #22C55E33', borderRadius:6, padding:'2px 8px', fontWeight:700 }}>✓ Fulfilled</span>}
                </div>
                <div style={{ height:8, background:'#1E2D4A', borderRadius:4, overflow:'hidden', marginBottom:8 }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:pct>=100?'linear-gradient(90deg,#22C55E,#4ADE80)':'linear-gradient(90deg,#A07820,#C9A84C)', transition:'width 0.6s ease', borderRadius:4 }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'#22C55E' }}>RWF {p.paid.toLocaleString()} paid</span>
                  <span style={{ fontSize:12, color:'#64748B' }}>of RWF {p.amount.toLocaleString()} · due {p.due}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Make Payment ── */}
      {tab === 'pay' && (
        <div style={{ maxWidth:420 }}>
          <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, padding:24 }}>
            <h3 style={{ margin:'0 0 16px', fontFamily:'Cinzel, serif', color:'#C9A84C', fontSize:15 }}>Record a Contribution</h3>
            <MobileMoneyButton amount={10000} description="Monthly Tithe" onSuccess={({ txRef })=>{ toast(`Payment confirmed! Ref: ${txRef}`, { type:'success' }); setTab('ledger'); }} />
          </div>
        </div>
      )}
    </div>
  );
}
