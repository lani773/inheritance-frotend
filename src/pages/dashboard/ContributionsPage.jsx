/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Contributions & Finance Page  (Enhanced v2)

   Tabs:
   1. Records     — filterable table, bulk ops, verify, receipt
   2. Analytics   — 12-mo trend, type donut, top givers, MoM table
   3. Budget      — goals vs actual, category progress, forecast
   4. Welfare     — linked ledger per case, allocation tracker
   5. Export      — Excel, PDF, annual statement, tithe calc
   ═══════════════════════════════════════════════════════════════════ */
import React, {
  useState, useMemo, useCallback, useRef, useEffect,
} from 'react';
import { useToast }   from '../../context/ToastContext';
import {
  contributionsService, membersService, welfareService,
  notificationsService,
} from '../../services/index';
import {
  CONTRIBUTION_TYPES, PAYMENT_METHODS, CURRENCIES,
} from '../../config/constants';
import {
  PageHeader, Tabs, Badge, ProgressBar, Avatar,
  EmptyState, Select, StatCard, InfoBox,
} from '../../components/shared/index';
import Button           from '../../components/shared/Button';
import ContributionModal from '../../components/contributions/ContributionModal';
import ReceiptViewer    from '../../components/contributions/ReceiptViewer';
import BudgetTracker    from '../../components/contributions/BudgetTracker';
import {
  formatDate, formatCurrency, getInitials,
  generateReceiptNo, truncate,
} from '../../utils/index';
import { useDebounce } from '../../hooks/index';
import Storage, { KEYS } from '../../storage/engine';

/* ── helpers ─────────────────────────────────────────────────── */
const typeColor = (t) => CONTRIBUTION_TYPES.find(c => c.id === t)?.color || 'var(--gold)';
const typeIcon  = (t) => CONTRIBUTION_TYPES.find(c => c.id === t)?.icon  || '💰';
const MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── SVG Sparkline ───────────────────────────────────────────── */
function Sparkline({ data = [], color = 'var(--gold)', width = 72, height = 28 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(' ');
  const area = `M0,${height} L${pts.split(' ').map(p => p).join(' L')} L${width},${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace(/[^a-z0-9]/gi,'')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const lx = width;
        const ly = height - (last / max) * height;
        return <circle cx={lx} cy={ly} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

/* ── Finance Health Score (circular gauge) ───────────────────── */
function HealthGauge({ score = 0 }) {
  const r = 36, cx = 44, cy = 44;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const gap  = circumference - dash;
  const color = score >= 75 ? 'var(--color-success)' : score >= 50 ? 'var(--gold)' : 'var(--color-warning)';
  const label = score >= 75 ? 'STRONG' : score >= 50 ? 'STABLE' : 'GROWING';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
      <svg width={88} height={88} viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={6} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition:'stroke-dasharray 1s ease' }}
        />
        <text x={cx} y={cy - 5} textAnchor="middle" fill={color}
          style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:700 }}>{score}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-muted)"
          style={{ fontFamily:'var(--font-mono)', fontSize:7, letterSpacing:'0.06em' }}>SCORE</text>
      </svg>
      <div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color, letterSpacing:'0.12em', marginBottom:3 }}>
          FINANCIAL HEALTH
        </div>
        <div style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>
          {label}
        </div>
        <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)', lineHeight:1.5 }}>
          Based on growth, verification rate, and goal attainment
        </div>
      </div>
    </div>
  );
}

/* ── SVG Donut Chart ─────────────────────────────────────────── */
function DonutChart({ segments = [], size = 160 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.36, inner = size * 0.23;
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  let angle = -Math.PI / 2;
  const arcs = segments.map(seg => {
    const ratio = seg.value / total;
    const sweep = ratio * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const lx = cx + (r + 14) * Math.cos(angle - sweep / 2);
    const ly = cy + (r + 14) * Math.sin(angle - sweep / 2);
    return { ...seg, x1, y1, x2, y2, sweep, large: sweep > Math.PI ? 1 : 0, ratio, lx, ly };
  });
  const [hovered, setHovered] = useState(null);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) => {
        const scale = hovered === i ? 1.04 : 1;
        return (
          <g key={i} transform={`translate(${cx},${cy}) scale(${scale}) translate(${-cx},${-cy})`}
            style={{ transition:'transform 0.2s ease', cursor:'pointer' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
          >
            <path
              d={`M${arc.x1},${arc.y1} A${r},${r} 0 ${arc.large},1 ${arc.x2},${arc.y2} L${cx},${cy} Z`}
              fill={arc.color} opacity={hovered === i ? 1 : 0.82}
            />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={inner} fill="var(--bg-card)" />
      {hovered !== null ? (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" fill={arcs[hovered]?.color}
            style={{ fontFamily:'var(--font-mono)', fontSize:Math.max(9, size * 0.065), fontWeight:700 }}>
            {Math.round((arcs[hovered]?.ratio || 0) * 100)}%
          </text>
          <text x={cx} y={cy + 9} textAnchor="middle" fill="var(--text-secondary)"
            style={{ fontFamily:'var(--font-body)', fontSize:Math.max(7, size * 0.05) }}>
            {arcs[hovered]?.label?.slice(0,9)}
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)"
            style={{ fontFamily:'var(--font-heading)', fontSize:Math.max(9, size * 0.07), fontWeight:700 }}>
            {segments.length}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-muted)"
            style={{ fontFamily:'var(--font-mono)', fontSize:Math.max(6, size * 0.046), letterSpacing:'0.05em' }}>
            TYPES
          </text>
        </>
      )}
    </svg>
  );
}

/* ── Monthly Bar Chart ───────────────────────────────────────── */
function MonthlyBars({ data = [], color = 'var(--gold)', height = 100 }) {
  const max   = Math.max(...data.map(d => d.value), 1);
  const [hov, setHov] = useState(null);
  const w = 100 / Math.max(data.length, 1);
  return (
    <div style={{ position:'relative', height, display:'flex', alignItems:'flex-end', gap:3, padding:'0 2px' }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const isHov = hov === i;
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%', cursor:'pointer' }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
          >
            {isHov && (
              <div style={{ position:'absolute', bottom:height + 4, left:`${i * w + w/2}%`, transform:'translateX(-50%)', background:'var(--bg-raised)', border:`1px solid ${color}60`, borderRadius:4, padding:'3px 7px', fontFamily:'var(--font-mono)', fontSize:9, color, whiteSpace:'nowrap', zIndex:10 }}>
                {formatCurrency(d.value, 'RWF')}
              </div>
            )}
            <div style={{ width:'100%', background: isHov ? color : `${color}70`, borderRadius:'3px 3px 0 0', height:`${Math.max(pct, 2)}%`, transition:'all 0.2s ease', boxShadow: isHov ? `0 0 8px ${color}60` : 'none' }} />
            <div style={{ fontFamily:'var(--font-mono)', fontSize:7, color:'var(--text-muted)', marginTop:3, textAlign:'center' }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function ContributionsPage() {
  const { success: toastOK, error: toastErr, info: toastInfo } = useToast();

  /* ── Data ────────────────────────────────────────────────── */
  const [contributions, setContribs] = useState(() => contributionsService.getAll());
  const members = useMemo(() => membersService.getAll(), []);
  const reload  = useCallback(() => setContribs(contributionsService.getAll()), []);

  /* ── Tab + modal state ──────────────────────────────────── */
  const [tab,           setTab]           = useState('records');
  const [addModal,      setAddModal]      = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [receiptItem,   setReceiptItem]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkDelete,    setBulkDelete]    = useState(false);

  /* ── Filter state ────────────────────────────────────────── */
  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [verFilter,   setVerFilter]   = useState('all');
  const [monthFilter, setMonthFilter] = useState('');
  const [methodFilter,setMethodFilter]= useState('all');
  const [sortField,   setSortField]   = useState('date');
  const [sortDir,     setSortDir]     = useState('desc');
  const [page,        setPage]        = useState(1);
  const [selected,    setSelected]    = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const PAGE_SIZE = 20;

  const debouncedSearch = useDebounce(search, 250);

  /* ── Filtered & sorted records ───────────────────────────── */
  const filtered = useMemo(() => {
    let list = contributions.map(c => ({
      ...c,
      memberName:  members.find(m => m.id === c.memberId)?.fullName  || `Member #${c.memberId}`,
      memberVoice: members.find(m => m.id === c.memberId)?.voicePart || '',
    }));
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(c =>
        c.memberName?.toLowerCase().includes(q) ||
        c.receiptNo?.toLowerCase().includes(q)  ||
        c.reference?.toLowerCase().includes(q)
      );
    }
    if (typeFilter   !== 'all') list = list.filter(c => c.type === typeFilter);
    if (verFilter    !== 'all') list = list.filter(c => String(c.verified) === verFilter);
    if (monthFilter)            list = list.filter(c => c.date?.startsWith(monthFilter));
    if (methodFilter !== 'all') list = list.filter(c => c.method === methodFilter);
    list.sort((a, b) => {
      let va = a[sortField] ?? '', vb = b[sortField] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 :  1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return list;
  }, [contributions, members, debouncedSearch, typeFilter, verFilter, monthFilter, methodFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
    setPage(1);
  };

  /* ── Aggregate stats ─────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = contributions.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const now   = new Date();
    const thisMo = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const lastMo = (() => {
      const d = new Date(now.getFullYear(), now.getMonth()-1, 1);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    })();
    const thisMonthTotal = contributions.filter(c => c.date?.startsWith(thisMo)).reduce((s,c) => s + parseFloat(c.amount||0), 0);
    const lastMonthTotal = contributions.filter(c => c.date?.startsWith(lastMo)).reduce((s,c) => s + parseFloat(c.amount||0), 0);
    const growth         = lastMonthTotal ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : 0;
    const byType         = {};
    contributions.forEach(c => { byType[c.type] = (byType[c.type]||0) + parseFloat(c.amount||0); });
    const unverified     = contributions.filter(c => !c.verified).length;
    const verified       = contributions.filter(c => c.verified).length;
    const verRate        = contributions.length ? Math.round((verified / contributions.length) * 100) : 0;

    // 12-month sparkline data
    const sparkline12 = Array.from({ length: 12 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      return contributions.filter(c => c.date?.startsWith(key)).reduce((s,c) => s+parseFloat(c.amount||0), 0);
    });

    // Health score (0–100)
    const health = Math.min(100, Math.round(
      (verRate * 0.4) +
      (Math.min(1, thisMonthTotal / Math.max(lastMonthTotal, 1)) * 30) +
      (total > 100000 ? 30 : (total / 100000) * 30)
    ));

    // Unique givers this month
    const thisMonthGivers = new Set(
      contributions.filter(c => c.date?.startsWith(thisMo)).map(c => c.memberId)
    ).size;

    return {
      total, thisMonthTotal, lastMonthTotal, growth, byType, unverified, verRate,
      count: contributions.length, sparkline12, health, thisMonthGivers,
    };
  }, [contributions]);

  /* ── CRUD handlers ───────────────────────────────────────── */
  const handleSave = (data, isEdit) => {
    if (isEdit) {
      contributionsService.update(data.id, data);
      toastOK('Contribution updated');
    } else {
      const created = contributionsService.create(data);
      notificationsService.add({
        type:'success', title:'Contribution recorded',
        message:`${formatCurrency(data.amount, data.currency)} ${data.type} from member`,
        actionUrl:'/dashboard/contributions',
      });
      toastOK(`${data.type} of ${formatCurrency(data.amount, data.currency)} recorded — Receipt ${created.receiptNo}`);
    }
    reload(); setAddModal(false); setEditItem(null);
  };

  const handleVerify = (id) => {
    contributionsService.update(id, { verified: true });
    toastOK('Contribution verified'); reload();
  };

  const handleBulkVerify = () => {
    selected.forEach(id => contributionsService.update(id, { verified: true }));
    toastOK(`${selected.size} contribution(s) verified`);
    setSelected(new Set()); reload();
  };

  const handleBulkDelete = () => {
    selected.forEach(id => contributionsService.delete(id));
    toastInfo(`${selected.size} contribution(s) removed`);
    setSelected(new Set()); setBulkDelete(false); reload();
  };

  const handleDelete = () => {
    contributionsService.delete(deleteConfirm.id);
    toastInfo('Contribution removed'); reload(); setDeleteConfirm(null);
  };

  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map(c => c.id)));
  };

  /* ── Export helpers ─────────────────────────────────────── */
  const exportExcel = async () => {
    try {
      const XLSX = (await import('xlsx')).default;
      const wb = XLSX.utils.book_new();
      const now = new Date();
      const allData = contributions.map(c => {
        const m = members.find(x => x.id === c.memberId);
        return {
          'Date':       c.date,
          'Member':     m?.fullName || '',
          'Voice Part': m?.voicePart || '',
          'Type':       c.type,
          'Amount':     parseFloat(c.amount || 0),
          'Currency':   c.currency || 'RWF',
          'Method':     c.method?.replace('_',' ') || '',
          'Reference':  c.reference || '',
          'Receipt No': c.receiptNo || '',
          'Verified':   c.verified ? 'Yes' : 'No',
          'Notes':      c.notes || '',
        };
      }).sort((a,b) => (b.Date||'').localeCompare(a.Date||''));
      const wsAll = XLSX.utils.json_to_sheet(allData);
      wsAll['!cols'] = [{wch:12},{wch:22},{wch:10},{wch:14},{wch:10},{wch:8},{wch:14},{wch:16},{wch:16},{wch:8},{wch:20}];
      XLSX.utils.book_append_sheet(wb, wsAll, 'All Records');
      for (let mo = 0; mo < 12; mo++) {
        const d   = new Date(now.getFullYear(), now.getMonth() - mo, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const rows = allData.filter(r => r.Date?.startsWith(key));
        if (!rows.length) continue;
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = wsAll['!cols'];
        XLSX.utils.book_append_sheet(wb, ws, `${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
      }
      const summaryData = CONTRIBUTION_TYPES.map(t => ({
        'Type':  t.label,
        'Total': Math.round(stats.byType[t.id] || 0),
        'Count': contributions.filter(c => c.type === t.id).length,
      }));
      summaryData.push({ 'Type':'GRAND TOTAL','Total':Math.round(stats.total),'Count':contributions.length });
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = [{wch:16},{wch:14},{wch:8}];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      XLSX.writeFile(wb, `contributions-${formatDate(new Date(),'short')}.xlsx`);
      toastOK('Excel file downloaded');
    } catch(e) { toastErr('Export failed: ' + e.message); }
  };

  const exportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
      doc.setFillColor(8,12,20); doc.rect(0,0,297,210,'F');
      doc.setTextColor(201,168,76); doc.setFontSize(16); doc.setFont('helvetica','bold');
      doc.text('INHERITANCE CHOIR — Financial Report',14,16);
      doc.setFontSize(9); doc.setTextColor(148,163,184);
      doc.text(`Generated: ${formatDate(new Date(),'long')}  |  Records: ${filtered.length}  |  Total: RWF ${Math.round(stats.total).toLocaleString()}`,14,23);
      const cols=['Date','Member','Type','Amount','Method','Receipt','Verified'];
      const widths=[26,50,22,28,24,28,16];
      let x=14,y=34;
      doc.setFillColor(26,37,64); doc.rect(14,y-5,269,8,'F');
      doc.setTextColor(201,168,76); doc.setFontSize(8);
      cols.forEach((col,i)=>{doc.text(col,x,y);x+=widths[i];}); y+=6;
      filtered.slice(0,80).forEach((c,idx)=>{
        if(y>185){doc.addPage();y=20;}
        if(idx%2===0){doc.setFillColor(20,30,51);doc.rect(14,y-4,269,6,'F');}
        doc.setTextColor(240,244,255); doc.setFontSize(7.5); x=14;
        [formatDate(c.date),truncate(c.memberName,22),c.type?.replace('_',' '),
         formatCurrency(c.amount,c.currency),c.method?.replace('_',' ')||'—',
         c.receiptNo||'—',c.verified?'✓':'⏳'
        ].forEach((val,i)=>{doc.text(String(val),x,y);x+=widths[i];}); y+=6;
      });
      doc.save(`contributions-${formatDate(new Date(),'short')}.pdf`);
      toastOK('PDF downloaded');
    } catch(e) { toastErr('PDF failed: ' + e.message); }
  };

  const exportAnnualStatement = async (memberId) => {
    const member = members.find(m => m.id === Number(memberId));
    if (!member) { toastErr('Member not found'); return; }
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit:'mm', format:'a4' });
      const yr = new Date().getFullYear();
      const mC = contributions.filter(c => c.memberId===Number(memberId) && c.date?.startsWith(String(yr)));
      const total = mC.reduce((s,c) => s+parseFloat(c.amount||0), 0);
      doc.setFillColor(8,12,20); doc.rect(0,0,210,297,'F');
      doc.setTextColor(201,168,76); doc.setFontSize(22); doc.setFont('helvetica','bold');
      doc.text('INHERITANCE CHOIR',14,22);
      doc.setFontSize(13); doc.setTextColor(148,163,184);
      doc.text(`Annual Tithe Statement — ${yr}`,14,30);
      doc.setFontSize(10); doc.setTextColor(240,244,255);
      doc.text(`Member: ${member.fullName}`,14,42);
      doc.text(`Email: ${member.email}`,14,49);
      doc.text(`Voice Part: ${member.voicePart}`,14,56);
      doc.text(`Member since: ${formatDate(member.joinDate)}`,14,63);
      doc.setFillColor(26,37,64); doc.rect(14,72,182,8,'F');
      doc.setTextColor(201,168,76); doc.setFontSize(8);
      ['Date','Type','Amount','Method','Reference','Receipt'].forEach((h,i)=>{doc.text(h,14+i*32,78);});
      let y=86;
      mC.sort((a,b)=>(a.date||'').localeCompare(b.date||'')).forEach((c,idx)=>{
        if(idx%2===0){doc.setFillColor(18,27,45);doc.rect(14,y-4,182,6,'F');}
        doc.setTextColor(240,244,255);
        [formatDate(c.date),c.type,formatCurrency(c.amount,c.currency),c.method||'—',c.reference||'—',c.receiptNo||'—'].forEach((v,i)=>{
          doc.text(truncate(String(v),14),14+i*32,y);
        }); y+=6;
      });
      y+=8;
      doc.setFillColor(201,168,76); doc.rect(14,y,182,8,'F');
      doc.setTextColor(8,12,20); doc.setFontSize(9); doc.setFont('helvetica','bold');
      doc.text(`TOTAL ${yr} CONTRIBUTIONS`,16,y+5);
      doc.text(`RWF ${Math.round(total).toLocaleString()}`,150,y+5);
      doc.setTextColor(148,163,184); doc.setFontSize(8); doc.setFont('helvetica','normal');
      doc.text('This statement is for personal record-keeping and tax purposes.',14,y+18);
      doc.text(`Generated by INHERITANCE CHOIR Management System — ${formatDate(new Date(),'long')}`,14,y+24);
      doc.save(`statement-${member.fullName.replace(/\s+/g,'-')}-${yr}.pdf`);
      toastOK(`Annual statement for ${member.fullName} downloaded`);
    } catch(e) { toastErr('Statement failed: ' + e.message); }
  };

  /* ── Month filter options ────────────────────────────────── */
  const monthOptions = useMemo(() => {
    const months = new Set(contributions.map(c => c.date?.slice(0,7)).filter(Boolean));
    return [{value:'',label:'All Months'}, ...Array.from(months).sort().reverse().map(m=>({value:m,label:m}))];
  }, [contributions]);

  /* ── Tabs config ─────────────────────────────────────────── */
  const tabs = [
    { id:'records',  label:'Records',      icon:'📋', count: stats.unverified || undefined },
    { id:'analytics',label:'Analytics',    icon:'📈' },
    { id:'budget',   label:'Budget',       icon:'🎯' },
    { id:'welfare',  label:'Welfare Fund', icon:'❤️' },
    { id:'export',   label:'Export',       icon:'📊' },
  ];

  const filteredTotal = filtered.reduce((s,c) => s+parseFloat(c.amount||0), 0);

  return (
    <div style={{ animation:'fadeUp 0.35s ease both' }}>

      {/* ── Page header ──────────────────────────────────── */}
      <PageHeader
        title="Contributions & Finance"
        subtitle={`${formatCurrency(stats.total,'RWF')} total · ${stats.count} records`}
        icon="💰"
        actions={
          <Button variant="primary" icon="+" onClick={() => setAddModal(true)}>
            Record Contribution
          </Button>
        }
      />

      {/* ── KPI Strip ────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:12, marginBottom:22 }}>

        {/* All-time total */}
        <KpiCard
          icon="💰" label="All-Time Total"
          value={fmtShort(stats.total)} color="var(--gold)"
          sparkline={stats.sparkline12}
        />
        {/* This month */}
        <KpiCard
          icon="📅" label="This Month"
          value={fmtShort(stats.thisMonthTotal)} color="var(--color-emerald)"
          trend={stats.growth} sparkline={stats.sparkline12.slice(-6)}
        />
        {/* Givers this month */}
        <KpiCard
          icon="👥" label="Givers This Month"
          value={stats.thisMonthGivers} color="var(--color-violet)"
        />
        {/* Verification rate */}
        <KpiCard
          icon="✅" label="Verified Rate"
          value={`${stats.verRate}%`}
          color={stats.verRate > 80 ? 'var(--color-success)' : 'var(--color-warning)'}
        />
        {/* Unverified */}
        <KpiCard
          icon="⏳" label="Pending Verify"
          value={stats.unverified}
          color={stats.unverified ? 'var(--color-warning)' : 'var(--color-success)'}
        />
      </div>

      {/* ── Health Gauge Banner ───────────────────────────── */}
      <div style={{
        background:'var(--bg-card)', border:'1px solid var(--border-gold)',
        borderRadius:'var(--radius-xl)', padding:'16px 22px',
        marginBottom:22, display:'flex', alignItems:'center',
        justifyContent:'space-between', flexWrap:'wrap', gap:16,
        backgroundImage:'linear-gradient(135deg, var(--bg-card) 0%, rgba(201,168,76,0.04) 100%)',
      }}>
        <HealthGauge score={stats.health} />
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
          {CONTRIBUTION_TYPES.slice(0,4).map(t => (
            <div key={t.id} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:3 }}>{t.label.toUpperCase()}</div>
              <div style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:700, color:t.color }}>{fmtShort(stats.byType[t.id]||0)}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', marginTop:2 }}>RWF</div>
            </div>
          ))}
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ════════════════════════════════════════════════════
          RECORDS TAB
         ════════════════════════════════════════════════════ */}
      {tab === 'records' && (
        <div>

          {/* Filter toolbar */}
          <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
            {/* Search */}
            <div style={{ position:'relative', flex:'1 1 220px' }}>
              <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--text-muted)',pointerEvents:'none' }}>🔍</span>
              <input
                value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
                placeholder="Search member, receipt, reference…"
                style={{ width:'100%',background:'var(--bg-raised)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-full)',padding:'8px 14px 8px 36px',color:'var(--text-primary)',fontSize:12,fontFamily:'var(--font-body)',outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--border-gold)'}
                onBlur={e=>e.target.style.borderColor='var(--border-subtle)'}
              />
            </div>
            <Button variant={showFilters?'primary':'secondary'} size="sm" onClick={()=>setShowFilters(v=>!v)}>
              ⚙️ Filters {showFilters ? '▲' : '▼'}
            </Button>
            <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)',marginLeft:'auto' }}>
              {filtered.length} records · {formatCurrency(filteredTotal,'RWF')}
            </span>
          </div>

          {/* Advanced filters panel */}
          {showFilters && (
            <div style={{ display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',padding:'12px 14px',background:'var(--bg-raised)',borderRadius:'var(--radius-lg)',border:'1px solid var(--border-subtle)',animation:'fadeUp 0.2s ease both' }}>
              <Select value={typeFilter} onChange={v=>{setTypeFilter(v);setPage(1);}}
                options={[{value:'all',label:'All Types'},...CONTRIBUTION_TYPES.map(t=>({value:t.id,label:t.label}))]}
                style={{ minWidth:150 }}
              />
              <Select value={verFilter} onChange={v=>{setVerFilter(v);setPage(1);}}
                options={[{value:'all',label:'All Status'},{value:'true',label:'✅ Verified'},{value:'false',label:'⏳ Pending'}]}
                style={{ minWidth:140 }}
              />
              <Select value={monthFilter} onChange={v=>{setMonthFilter(v);setPage(1);}}
                options={monthOptions} style={{ minWidth:140 }}
              />
              <Select value={methodFilter} onChange={v=>{setMethodFilter(v);setPage(1);}}
                options={[{value:'all',label:'All Methods'},...PAYMENT_METHODS.map(m=>({value:m.id,label:m.label}))]}
                style={{ minWidth:140 }}
              />
              {(typeFilter!=='all'||verFilter!=='all'||monthFilter||methodFilter!=='all') && (
                <Button size="sm" variant="secondary" onClick={()=>{setTypeFilter('all');setVerFilter('all');setMonthFilter('');setMethodFilter('all');setPage(1);}}>
                  ✕ Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Unverified alert */}
          {stats.unverified > 0 && (
            <InfoBox type="warning" title={`${stats.unverified} contribution(s) pending verification`} style={{ marginBottom:14 }}>
              Unverified contributions are highlighted below.
            </InfoBox>
          )}

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 16px',background:'var(--gold-alpha-10)',border:'1px solid var(--border-gold)',borderRadius:'var(--radius-lg)',marginBottom:12,animation:'fadeUp 0.2s ease both' }}>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:11,color:'var(--gold)' }}>{selected.size} selected</span>
              <Button size="sm" variant="secondary" onClick={handleBulkVerify}>✅ Verify All</Button>
              <Button size="sm" variant="danger"    onClick={()=>setBulkDelete(true)}>🗑 Delete All</Button>
              <Button size="sm" variant="secondary" onClick={()=>setSelected(new Set())}>✕ Deselect</Button>
            </div>
          )}

          {/* Table */}
          <div style={{ background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-xl)',overflow:'hidden' }}>
            {paginated.length === 0 ? (
              <EmptyState icon="💰" title="No contributions found"
                description="Try changing the filter criteria or record a new contribution."
                action={<Button variant="primary" onClick={()=>setAddModal(true)}>+ Record Contribution</Button>}
              />
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse',minWidth:760 }}>
                  <thead>
                    <tr style={{ background:'var(--bg-raised)' }}>
                      {/* Checkbox */}
                      <th style={{ padding:'10px 10px 10px 14px', width:32 }}>
                        <CheckBox checked={selected.size===paginated.length && paginated.length>0} onChange={toggleAll} />
                      </th>
                      {[
                        {f:'date',    l:'Date'},
                        {f:'memberName',l:'Member'},
                        {f:'type',    l:'Type'},
                        {f:'amount',  l:'Amount',  align:'right'},
                        {f:'method',  l:'Method'},
                        {f:'receiptNo',l:'Receipt'},
                        {f:'verified',l:'Status'},
                        {f:null,      l:'Actions'},
                      ].map(({f,l,align='left'}) => (
                        <th key={l}
                          onClick={()=>f&&handleSort(f)}
                          style={{ padding:'10px 12px',fontFamily:'var(--font-mono)',fontSize:9,color:sortField===f?'var(--gold)':'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em',textAlign:align,borderBottom:'2px solid var(--border-subtle)',cursor:f?'pointer':'default',whiteSpace:'nowrap',userSelect:'none' }}
                        >
                          {l} {f&&sortField===f&&(sortDir==='asc'?'↑':'↓')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((c,i) => {
                      const color   = typeColor(c.type);
                      const isSel   = selected.has(c.id);
                      return (
                        <tr key={c.id}
                          style={{ background: isSel ? 'rgba(201,168,76,0.06)' : !c.verified ? 'rgba(245,158,11,0.03)' : i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)', borderBottom:'1px solid var(--border-subtle)', transition:'background 0.15s' }}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                          onMouseLeave={e=>e.currentTarget.style.background=isSel?'rgba(201,168,76,0.06)':!c.verified?'rgba(245,158,11,0.03)':i%2===0?'transparent':'rgba(255,255,255,0.01)'}
                        >
                          <td style={{ padding:'8px 10px 8px 14px' }}>
                            <CheckBox checked={isSel} onChange={()=>toggleSelect(c.id)} />
                          </td>
                          <td style={{ padding:'9px 12px' }}>
                            <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)' }}>{formatDate(c.date)}</span>
                          </td>
                          <td style={{ padding:'9px 12px' }}>
                            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                              <Avatar initials={getInitials(c.memberName)} size={28} />
                              <div>
                                <div style={{ fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-primary)',fontWeight:600 }}>{c.memberName}</div>
                                {c.memberVoice && <div style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-muted)' }}>{c.memberVoice}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:'9px 12px' }}>
                            <Badge color={color}>{typeIcon(c.type)} {c.type?.replace('_',' ').toUpperCase()}</Badge>
                          </td>
                          <td style={{ padding:'9px 12px',textAlign:'right' }}>
                            <span style={{ fontFamily:'var(--font-mono)',fontSize:12,color:'var(--color-emerald)',fontWeight:700 }}>
                              {formatCurrency(c.amount,c.currency)}
                            </span>
                          </td>
                          <td style={{ padding:'9px 12px' }}>
                            <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-secondary)' }}>
                              {PAYMENT_METHODS.find(m=>m.id===c.method)?.icon || ''} {c.method?.replace('_',' ')}
                            </span>
                          </td>
                          <td style={{ padding:'9px 12px' }}>
                            <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)',cursor:'pointer' }}
                              onClick={()=>{navigator.clipboard?.writeText(c.receiptNo||'');toastOK('Receipt # copied');}}
                              title="Click to copy"
                            >{c.receiptNo || '—'}</span>
                          </td>
                          <td style={{ padding:'9px 12px' }}>
                            <Badge color={c.verified?'var(--color-success)':'var(--color-warning)'} size="xs">
                              {c.verified ? '✓ VERIFIED' : '⏳ PENDING'}
                            </Badge>
                          </td>
                          <td style={{ padding:'9px 12px' }}>
                            <div style={{ display:'flex',gap:4 }}>
                              <ActionBtn icon="🧾" title="View Receipt" color="var(--color-info)" onClick={()=>setReceiptItem(c)} />
                              <ActionBtn icon="✏️" title="Edit"         onClick={()=>setEditItem(c)} />
                              {!c.verified && <ActionBtn icon="✅" title="Verify" color="var(--color-success)" onClick={()=>handleVerify(c.id)} />}
                              <ActionBtn icon="🗑" title="Delete" color="var(--color-error)" onClick={()=>setDeleteConfirm(c)} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:'var(--bg-raised)',borderTop:'2px solid var(--border-subtle)' }}>
                      <td colSpan={4} style={{ padding:'10px 12px',fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)',letterSpacing:'0.1em' }}>
                        SHOWING {filtered.length} RECORDS
                      </td>
                      <td style={{ padding:'10px 12px',textAlign:'right',fontFamily:'var(--font-mono)',fontSize:12,color:'var(--color-emerald)',fontWeight:700 }}>
                        {formatCurrency(filteredTotal,'RWF')}
                      </td>
                      <td colSpan={4} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:14 }}>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)' }}>PAGE {page} OF {totalPages}</span>
              <div style={{ display:'flex',gap:6 }}>
                <Button size="sm" variant="secondary" disabled={page===1} onClick={()=>setPage(1)}>⟨⟨</Button>
                <Button size="sm" variant="secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</Button>
                <Button size="sm" variant="secondary" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</Button>
                <Button size="sm" variant="secondary" disabled={page===totalPages} onClick={()=>setPage(totalPages)}>⟩⟩</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          ANALYTICS TAB (NEW)
         ════════════════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <AnalyticsTab contributions={contributions} members={members} stats={stats} />
      )}

      {/* ════════════════════════════════════════════════════
          BUDGET TAB
         ════════════════════════════════════════════════════ */}
      {tab === 'budget' && (
        <BudgetTracker contributions={contributions} onReload={reload} />
      )}

      {/* ════════════════════════════════════════════════════
          WELFARE FUND TAB
         ════════════════════════════════════════════════════ */}
      {tab === 'welfare' && (
        <WelfareFundTab contributions={contributions} members={members} />
      )}

      {/* ════════════════════════════════════════════════════
          EXPORT TAB
         ════════════════════════════════════════════════════ */}
      {tab === 'export' && (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16 }}>
          <ExportCard
            icon="📊" title="Export to Excel"
            description="Full records + monthly sheets + summary. Ready for pivot tables and analysis."
            color="var(--color-success)"
            meta={`${contributions.length} records · ${MONTHS.length} potential month sheets`}
            actions={<Button variant="primary" fullWidth icon="⬇️" onClick={exportExcel}>Download Excel</Button>}
          />
          <ExportCard
            icon="📄" title="Export to PDF"
            description="Print-ready financial report with filtered records and header branding."
            color="var(--color-error)"
            meta={`${filtered.length} filtered records`}
            actions={<Button variant="primary" fullWidth icon="⬇️" onClick={exportPDF}>Download PDF Report</Button>}
          />
          <ExportCard
            icon="📑" title="Annual Tax Statement"
            description="Generate a per-member year-end contribution statement PDF for record-keeping."
            color="var(--color-violet)"
            actions={<AnnualStatementSelector members={members} onExport={exportAnnualStatement} />}
          />
          <ExportCard
            icon="🧮" title="Tithe Calculator"
            description="Enter gross income to calculate the recommended 10% tithe amount."
            color="var(--gold)"
            actions={<TitheCalculator />}
          />
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────── */}
      {addModal && (
        <ContributionModal isOpen onClose={()=>setAddModal(false)} onSave={handleSave} members={members} />
      )}
      {editItem && (
        <ContributionModal isOpen onClose={()=>setEditItem(null)} onSave={handleSave} members={members} contribution={editItem} />
      )}
      {receiptItem && (
        <ReceiptViewer isOpen contribution={receiptItem}
          member={members.find(m=>m.id===receiptItem.memberId)} onClose={()=>setReceiptItem(null)} />
      )}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Contribution?"
          message={`Delete ${formatCurrency(deleteConfirm.amount,deleteConfirm.currency)} ${deleteConfirm.type} from ${members.find(m=>m.id===deleteConfirm.memberId)?.fullName}? This cannot be undone.`}
          confirmLabel="Delete" danger
          onConfirm={handleDelete} onCancel={()=>setDeleteConfirm(null)}
        />
      )}
      {bulkDelete && (
        <ConfirmDialog
          title={`Delete ${selected.size} contributions?`}
          message="This will permanently delete all selected contribution records. This cannot be undone."
          confirmLabel={`Delete ${selected.size}`} danger
          onConfirm={handleBulkDelete} onCancel={()=>setBulkDelete(false)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ANALYTICS TAB
   ══════════════════════════════════════════════════════════════ */
function AnalyticsTab({ contributions, members, stats }) {
  const now = new Date();

  /* 12-month trend */
  const trend12 = useMemo(() => Array.from({ length:12 }, (_,i) => {
    const d   = new Date(now.getFullYear(), now.getMonth() - (11-i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const val = contributions.filter(c=>c.date?.startsWith(key)).reduce((s,c)=>s+parseFloat(c.amount||0),0);
    return { label: MONTHS[d.getMonth()], value: val };
  }), [contributions]);

  /* By type for donut */
  const donutSegments = CONTRIBUTION_TYPES
    .map(t => ({ label:t.label, value:stats.byType[t.id]||0, color:t.color }))
    .filter(s => s.value > 0);

  /* Top givers (top 8) */
  const topGivers = useMemo(() => {
    const map = {};
    contributions.forEach(c => {
      if (!map[c.memberId]) map[c.memberId] = 0;
      map[c.memberId] += parseFloat(c.amount||0);
    });
    return Object.entries(map)
      .map(([id,total]) => ({
        id:Number(id),
        total,
        member: members.find(m=>m.id===Number(id)),
      }))
      .sort((a,b)=>b.total-a.total)
      .slice(0,8);
  }, [contributions, members]);

  /* Month-over-month table (last 6 months) */
  const momTable = useMemo(() => Array.from({ length:6 }, (_,i) => {
    const d   = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const recs = contributions.filter(c=>c.date?.startsWith(key));
    const total = recs.reduce((s,c)=>s+parseFloat(c.amount||0),0);
    const givers= new Set(recs.map(c=>c.memberId)).size;
    const prev  = (() => {
      const pd=new Date(d.getFullYear(),d.getMonth()-1,1);
      const pk=`${pd.getFullYear()}-${String(pd.getMonth()+1).padStart(2,'0')}`;
      return contributions.filter(c=>c.date?.startsWith(pk)).reduce((s,c)=>s+parseFloat(c.amount||0),0);
    })();
    const growth = prev ? Math.round(((total-prev)/prev)*100) : 0;
    return { label:`${MONTHS[d.getMonth()]} ${d.getFullYear()}`, total, givers, growth, count:recs.length };
  }).reverse(), [contributions]);

  const maxBar = Math.max(...topGivers.map(g=>g.total),1);

  return (
    <div style={{ display:'grid',gap:20 }}>

      {/* Row 1: Trend chart + Donut */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 280px',gap:16 }}>

        {/* Monthly trend */}
        <div style={{ background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-xl)',padding:22 }}>
          <SectionHeading icon="📈" color="var(--color-emerald)">12-Month Contribution Trend</SectionHeading>
          <MonthlyBars data={trend12} color="var(--gold)" height={120} />
        </div>

        {/* Donut */}
        <div style={{ background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-xl)',padding:22,display:'flex',flexDirection:'column',alignItems:'center' }}>
          <SectionHeading icon="🥧" color="var(--color-violet)">By Type</SectionHeading>
          <DonutChart segments={donutSegments} size={148} />
          <div style={{ marginTop:12,width:'100%' }}>
            {donutSegments.map(s => (
              <div key={s.label} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:5 }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:s.color,flexShrink:0 }} />
                <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-secondary)',flex:1 }}>{s.label}</span>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:s.color,fontWeight:700 }}>{fmtShort(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Top Givers + MoM Table */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>

        {/* Top givers leaderboard */}
        <div style={{ background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-xl)',padding:22 }}>
          <SectionHeading icon="🏆" color="var(--gold)">Top Contributors (All Time)</SectionHeading>
          {topGivers.length === 0 ? (
            <p style={{ fontFamily:'var(--font-body)',fontSize:13,color:'var(--text-muted)',marginTop:12 }}>No data yet.</p>
          ) : topGivers.map((g,i) => (
            <div key={g.id} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
              {/* Rank */}
              <div style={{ width:22,height:22,borderRadius:'50%',background: i<3?'var(--gold-alpha-20)':'var(--bg-raised)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:9,color:i<3?'var(--gold)':'var(--text-muted)',fontWeight:700 }}>{i+1}</span>
              </div>
              <Avatar initials={getInitials(g.member?.fullName||'?')} size={30} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontFamily:'var(--font-body)',fontSize:12,fontWeight:600,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                  {g.member?.fullName||`Member #${g.id}`}
                </div>
                <div style={{ height:4,background:'var(--bg-raised)',borderRadius:2,marginTop:4 }}>
                  <div style={{ height:'100%',width:`${(g.total/maxBar)*100}%`,background:i===0?'var(--gold)':i===1?'var(--color-emerald)':'var(--color-violet)',borderRadius:2,transition:'width 0.8s ease' }} />
                </div>
              </div>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--color-emerald)',fontWeight:700,flexShrink:0 }}>{fmtShort(g.total)}</span>
            </div>
          ))}
        </div>

        {/* Month-over-month table */}
        <div style={{ background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-xl)',padding:22 }}>
          <SectionHeading icon="📅" color="var(--color-info)">Month-over-Month</SectionHeading>
          <table style={{ width:'100%',borderCollapse:'collapse',marginTop:8 }}>
            <thead>
              <tr>
                {['Month','Total','Givers','Change','Records'].map(h => (
                  <th key={h} style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-muted)',textAlign:'right',padding:'4px 6px',borderBottom:'1px solid var(--border-subtle)',textTransform:'uppercase',letterSpacing:'0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {momTable.map((row,i) => (
                <tr key={i} style={{ borderBottom:'1px solid var(--border-subtle)' }}>
                  <td style={{ padding:'7px 6px',fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-secondary)',textAlign:'right' }}>{row.label}</td>
                  <td style={{ padding:'7px 6px',fontFamily:'var(--font-mono)',fontSize:11,color:'var(--color-emerald)',fontWeight:700,textAlign:'right' }}>{fmtShort(row.total)}</td>
                  <td style={{ padding:'7px 6px',fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-secondary)',textAlign:'right' }}>{row.givers}</td>
                  <td style={{ padding:'7px 6px',fontFamily:'var(--font-mono)',fontSize:11,textAlign:'right',color:row.growth>0?'var(--color-success)':row.growth<0?'var(--color-error)':'var(--text-muted)',fontWeight:700 }}>
                    {row.growth>0?'+':''}{row.growth}%
                  </td>
                  <td style={{ padding:'7px 6px',fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)',textAlign:'right' }}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Per-type breakdown bars */}
      <div style={{ background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-xl)',padding:22 }}>
        <SectionHeading icon="📊" color="var(--color-cyan)">Contribution Breakdown by Type</SectionHeading>
        <div style={{ display:'grid',gap:12,marginTop:8 }}>
          {CONTRIBUTION_TYPES.map(t => {
            const val = stats.byType[t.id]||0;
            const pct = stats.total ? Math.round((val/stats.total)*100) : 0;
            return (
              <div key={t.id} style={{ display:'flex',alignItems:'center',gap:12 }}>
                <span style={{ fontSize:16,flexShrink:0 }}>{t.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                    <span style={{ fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-secondary)' }}>{t.label}</span>
                    <span style={{ fontFamily:'var(--font-mono)',fontSize:11,color:t.color,fontWeight:700 }}>{formatCurrency(val,'RWF')} ({pct}%)</span>
                  </div>
                  <ProgressBar value={val} max={stats.total||1} color={t.color} height={5} animate />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   WELFARE FUND TAB
   ══════════════════════════════════════════════════════════════ */
function WelfareFundTab({ contributions, members }) {
  const welfareCases   = welfareService.getAll();
  const welfareFund    = contributions.filter(c => c.type==='welfare_fund');
  const totalFund      = welfareFund.reduce((s,c)=>s+parseFloat(c.amount||0),0);
  const totalAllocated = welfareCases.reduce((s,c)=>s+(c.amountRaised||0),0);
  const available      = Math.max(0, totalFund-totalAllocated);

  return (
    <div>
      {/* Fund summary cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:22 }}>
        <StatCard icon="❤️" value={fmtShort(totalFund)}    label="Total Fund"     color="var(--color-pink)" />
        <StatCard icon="📤" value={fmtShort(totalAllocated)} label="Allocated"    color="var(--color-warning)" />
        <StatCard icon="✅" value={fmtShort(available)}    label="Available"      color="var(--color-success)" />
        <StatCard icon="🗂️" value={welfareCases.length}    label="Active Cases"   color="var(--color-violet)" />
      </div>

      {/* Balance bar */}
      <div style={{ background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-xl)',padding:20,marginBottom:18 }}>
        <SectionHeading icon="❤️" color="var(--color-pink)">Welfare Fund Balance</SectionHeading>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
          <span style={{ fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-secondary)' }}>Collected</span>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:11,color:'var(--color-success)',fontWeight:700 }}>{formatCurrency(totalFund,'RWF')}</span>
        </div>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
          <span style={{ fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-secondary)' }}>Allocated</span>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:11,color:'var(--color-warning)',fontWeight:700 }}>{formatCurrency(totalAllocated,'RWF')}</span>
        </div>
        <ProgressBar value={totalAllocated} max={totalFund||1} color="var(--color-warning)" height={8} animate />
        <div style={{ display:'flex',justifyContent:'flex-end',marginTop:6 }}>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--color-success)',fontWeight:700 }}>
            Available: {formatCurrency(available,'RWF')}
          </span>
        </div>
      </div>

      {/* Cases */}
      {welfareCases.length === 0 ? (
        <EmptyState icon="❤️" title="No welfare cases" description="No active welfare cases at this time." />
      ) : welfareCases.map(wc => {
        const m   = members.find(x => x.id===wc.memberId);
        const pct = wc.amountNeeded ? Math.min(100,Math.round((wc.amountRaised/wc.amountNeeded)*100)) : 0;
        const prioColor = wc.priority==='urgent' ? 'var(--color-error)' : wc.priority==='high' ? 'var(--color-warning)' : 'var(--color-info)';
        return (
          <div key={wc.id} style={{ background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-xl)',padding:18,marginBottom:12,transition:'border-color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-default)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-subtle)'}
          >
            <div style={{ display:'flex',alignItems:'flex-start',gap:14,flexWrap:'wrap' }}>
              <Avatar initials={getInitials(m?.fullName||'?')} size={44} color="var(--color-pink)" />
              <div style={{ flex:1,minWidth:180 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap' }}>
                  <div style={{ fontFamily:'var(--font-heading)',fontSize:14,fontWeight:700,color:'var(--text-primary)' }}>{wc.title}</div>
                  <Badge color={prioColor} size="xs">{wc.priority?.toUpperCase()}</Badge>
                  <Badge color={wc.status==='resolved'?'var(--color-success)':'var(--color-warning)'} size="xs">{wc.status?.toUpperCase()}</Badge>
                </div>
                <div style={{ fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-secondary)',marginBottom:8,lineHeight:1.5 }}>{wc.description}</div>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                  <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)' }}>
                    {formatCurrency(wc.amountRaised,'RWF')} of {formatCurrency(wc.amountNeeded,'RWF')}
                  </span>
                  <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--color-pink)',fontWeight:700 }}>{pct}%</span>
                </div>
                <ProgressBar value={wc.amountRaised||0} max={wc.amountNeeded||1} color="var(--color-pink)" height={6} animate />
                {m && (
                  <div style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-muted)',marginTop:5 }}>
                    Member: {m.fullName} · {m.voicePart}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SMALL REUSABLE COMPONENTS
   ══════════════════════════════════════════════════════════════ */

/* KPI Card with optional sparkline + trend */
function KpiCard({ icon, label, value, color, sparkline, trend }) {
  return (
    <div style={{ background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-xl)',padding:'16px 18px',position:'relative',overflow:'hidden',transition:'border-color 0.2s' }}
      onMouseEnter={e=>e.currentTarget.style.borderColor=color}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-subtle)'}
    >
      <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color},transparent)` }} />
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6 }}>
        <div style={{ fontSize:18 }}>{icon}</div>
        {sparkline && <Sparkline data={sparkline} color={color} width={64} height={24} />}
      </div>
      <div style={{ fontFamily:'var(--font-heading)',fontSize:20,fontWeight:900,color,lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>{label}</div>
      {trend !== undefined && (
        <div style={{ marginTop:5,fontFamily:'var(--font-mono)',fontSize:9,color:trend>0?'var(--color-success)':trend<0?'var(--color-error)':'var(--text-muted)',fontWeight:700 }}>
          {trend>0?'▲':trend<0?'▼':'—'} {Math.abs(trend)}% vs last mo
        </div>
      )}
    </div>
  );
}

/* Icon action button */
function ActionBtn({ icon, title, onClick, color='var(--text-muted)' }) {
  return (
    <button onClick={onClick} title={title} aria-label={title}
      style={{ width:28,height:28,borderRadius:'var(--radius-sm)',border:'1px solid var(--border-subtle)',background:'var(--bg-raised)',color,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s' }}
      onMouseEnter={e=>{e.currentTarget.style.background='var(--border-subtle)';e.currentTarget.style.borderColor=color;}}
      onMouseLeave={e=>{e.currentTarget.style.background='var(--bg-raised)';e.currentTarget.style.borderColor='var(--border-subtle)';}}
    >{icon}</button>
  );
}

/* Checkbox */
function CheckBox({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{ width:15,height:15,borderRadius:3,border:`1.5px solid ${checked?'var(--gold)':'var(--border-default)'}`,background:checked?'var(--gold-alpha-20)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
      {checked && <span style={{ color:'var(--gold)',fontSize:9,lineHeight:1 }}>✓</span>}
    </div>
  );
}

/* Export card */
function ExportCard({ icon, title, description, color, meta, actions }) {
  return (
    <div style={{ background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-xl)',overflow:'hidden',transition:'border-color 0.2s,transform 0.2s' }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.transform='translateY(-2px)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-subtle)';e.currentTarget.style.transform='none';}}
    >
      <div style={{ height:3,background:`linear-gradient(90deg,transparent,${color},transparent)` }} />
      <div style={{ padding:20 }}>
        <div style={{ fontSize:34,marginBottom:10 }}>{icon}</div>
        <div style={{ fontFamily:'var(--font-heading)',fontSize:14,fontWeight:700,color:'var(--text-primary)',marginBottom:5 }}>{title}</div>
        <p style={{ fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-secondary)',lineHeight:1.5,marginBottom:meta?8:14 }}>{description}</p>
        {meta && <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)',letterSpacing:'0.08em',marginBottom:14 }}>{meta.toUpperCase()}</div>}
        {actions}
      </div>
    </div>
  );
}

/* Annual statement selector */
function AnnualStatementSelector({ members, onExport }) {
  const [memberId, setMemberId] = useState('');
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
      <Select value={memberId} onChange={setMemberId}
        options={[{value:'',label:'Select member…'},...members.filter(m=>m.status==='active').map(m=>({value:String(m.id),label:m.fullName}))]}
      />
      <Button variant="primary" fullWidth icon="⬇️" disabled={!memberId} onClick={()=>onExport(memberId)}>
        Download Statement
      </Button>
    </div>
  );
}

/* Tithe calculator */
function TitheCalculator() {
  const [income, setIncome] = useState('');
  const tithe = income ? Math.round(parseFloat(income.replace(/,/g,''))*0.1) : 0;
  return (
    <div>
      <div style={{ position:'relative',marginBottom:10 }}>
        <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)' }}>RWF</span>
        <input type="text" value={income}
          onChange={e=>setIncome(e.target.value.replace(/[^0-9,]/g,''))}
          placeholder="Enter your income…"
          style={{ width:'100%',background:'var(--bg-input)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',padding:'10px 14px 10px 48px',color:'var(--text-primary)',fontSize:13,fontFamily:'var(--font-body)',outline:'none',boxSizing:'border-box' }}
        />
      </div>
      {tithe > 0 && (
        <div style={{ background:'var(--gold-alpha-10)',border:'1px solid var(--border-gold)',borderRadius:'var(--radius-md)',padding:'12px 14px',textAlign:'center',animation:'fadeUp 0.25s ease both' }}>
          <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--gold)',letterSpacing:'0.1em',marginBottom:4 }}>RECOMMENDED TITHE (10%)</div>
          <div style={{ fontFamily:'var(--font-heading)',fontSize:24,fontWeight:900,color:'var(--gold)' }}>
            RWF {tithe.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

/* Confirm dialog */
function ConfirmDialog({ title, message, confirmLabel='Confirm', danger=false, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'var(--bg-overlay)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={onCancel}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'var(--bg-card)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-2xl)',padding:28,maxWidth:420,width:'90%',animation:'fadeUp 0.2s ease both' }}>
        <h3 style={{ fontFamily:'var(--font-heading)',color:danger?'var(--color-error)':'var(--text-primary)',margin:'0 0 10px',fontSize:16 }}>{title}</h3>
        <p style={{ fontFamily:'var(--font-body)',color:'var(--text-secondary)',marginBottom:22,lineHeight:1.6,fontSize:13 }}>{message}</p>
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={danger?'danger':'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

/* Section heading */
function SectionHeading({ icon, color, children }) {
  return (
    <div style={{ fontFamily:'var(--font-heading)',fontSize:11,color,letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:700,marginBottom:14,display:'flex',alignItems:'center',gap:6 }}>
      <span>{icon}</span> {children}
    </div>
  );
}

/* ── Utility: short currency formatter ───────────────────────── */
function fmtShort(n) {
  n = parseFloat(n) || 0;
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n/1_000).toFixed(0)}K`;
  return String(Math.round(n));
}
