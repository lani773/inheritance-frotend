/**
 * INHERITANCE CHOIR — Custom Report Builder
 * Select data sources, columns, filters, grouping → preview → export to Excel/PDF.
 */
import React, { useState, useMemo, useRef } from 'react';

// ── Available data sources ─────────────────────────────────────
const DATA_SOURCES = {
  members: {
    label: 'Members', icon: '👥', color: '#3B82F6',
    columns: [
      { id:'fullName',       label:'Full Name',      type:'text'   },
      { id:'email',          label:'Email',          type:'text'   },
      { id:'voicePart',      label:'Voice Part',     type:'text'   },
      { id:'role',           label:'Role',           type:'text'   },
      { id:'status',         label:'Status',         type:'badge'  },
      { id:'attendance',     label:'Attendance %',   type:'number' },
      { id:'contributionTotal', label:'Total Contributed', type:'currency' },
      { id:'joinDate',       label:'Join Date',      type:'date'   },
      { id:'phone',          label:'Phone',          type:'text'   },
      { id:'gender',         label:'Gender',         type:'text'   },
    ],
  },
  contributions: {
    label: 'Contributions', icon: '💰', color: '#C9A84C',
    columns: [
      { id:'date',       label:'Date',          type:'date'     },
      { id:'memberName', label:'Member',        type:'text'     },
      { id:'type',       label:'Type',          type:'badge'    },
      { id:'amount',     label:'Amount (RWF)',  type:'currency' },
      { id:'method',     label:'Payment Method',type:'text'    },
      { id:'verified',   label:'Verified',      type:'boolean' },
      { id:'receiptNo',  label:'Receipt No',    type:'text'    },
      { id:'notes',      label:'Notes',         type:'text'    },
    ],
  },
  attendance: {
    label: 'Attendance', icon: '✅', color: '#22C55E',
    columns: [
      { id:'memberName', label:'Member',      type:'text'  },
      { id:'eventTitle', label:'Event',       type:'text'  },
      { id:'date',       label:'Date',        type:'date'  },
      { id:'status',     label:'Status',      type:'badge' },
      { id:'voicePart',  label:'Voice Part',  type:'text'  },
      { id:'markedAt',   label:'Marked At',   type:'date'  },
    ],
  },
  events: {
    label: 'Events', icon: '📅', color: '#8B5CF6',
    columns: [
      { id:'title',      label:'Title',       type:'text'    },
      { id:'type',       label:'Type',        type:'badge'   },
      { id:'date',       label:'Date',        type:'date'    },
      { id:'time',       label:'Time',        type:'text'    },
      { id:'location',   label:'Location',    type:'text'    },
      { id:'mandatory',  label:'Mandatory',   type:'boolean' },
      { id:'attendCount',label:'Attendees',   type:'number'  },
    ],
  },
};

const AGGREGATE_FNS = ['None', 'Count', 'Sum', 'Average', 'Min', 'Max'];

const FILTER_OPS = {
  text:     ['contains', 'equals', 'starts with', 'not empty'],
  number:   ['equals', '>', '<', '>=', '<=', 'between'],
  date:     ['equals', 'before', 'after', 'this month', 'this year'],
  boolean:  ['is true', 'is false'],
  badge:    ['equals', 'not equals'],
  currency: ['>', '<', '>=', '<=', 'between'],
};

// ── Mock data generator ────────────────────────────────────────
function generateMockRows(source, columns) {
  const seed = {
    members: [
      { fullName:'Marie Claire Uwimana', email:'marie@choir.rw', voicePart:'Soprano', role:'member', status:'active', attendance:95, contributionTotal:45000, joinDate:'2023-01-15', phone:'+250788001', gender:'Female' },
      { fullName:'Diane Mukamana',       email:'diane@choir.rw', voicePart:'Alto',    role:'secretary', status:'active', attendance:88, contributionTotal:38000, joinDate:'2022-06-20', phone:'+250788002', gender:'Female' },
      { fullName:'Jean-Paul Habimana',   email:'jean@choir.rw',  voicePart:'Tenor',   role:'member', status:'active', attendance:72, contributionTotal:22000, joinDate:'2023-03-10', phone:'+250788003', gender:'Male' },
      { fullName:'Emmanuel Ndayishimiye',email:'emma@choir.rw',  voicePart:'Bass',    role:'member', status:'active', attendance:61, contributionTotal:18000, joinDate:'2023-07-01', phone:'+250788004', gender:'Male' },
      { fullName:'Erica Ingabire',       email:'erica@choir.rw', voicePart:'Soprano', role:'treasurer', status:'active', attendance:91, contributionTotal:52000, joinDate:'2022-01-01', phone:'+250788005', gender:'Female' },
    ],
    contributions: [
      { date:'2026-03-05', memberName:'Marie Claire Uwimana', type:'tithe',      amount:10000, method:'mobile_money', verified:true,  receiptNo:'RC-20260305-A1B2', notes:'' },
      { date:'2026-03-01', memberName:'Diane Mukamana',       type:'offering',   amount:2500,  method:'cash',         verified:true,  receiptNo:'RC-20260301-C3D4', notes:'' },
      { date:'2026-02-28', memberName:'Jean-Paul Habimana',   type:'welfare_fund',amount:5000, method:'mobile_money', verified:false, receiptNo:'RC-20260228-E5F6', notes:'Pending' },
      { date:'2026-02-14', memberName:'Erica Ingabire',       type:'special_gift',amount:15000,method:'bank_transfer',verified:true,  receiptNo:'RC-20260214-G7H8', notes:'' },
    ],
    attendance: [
      { memberName:'Marie Claire Uwimana', eventTitle:'Weekly Rehearsal', date:'2026-03-28', status:'present', voicePart:'Soprano', markedAt:'2026-03-28 09:15' },
      { memberName:'Diane Mukamana',       eventTitle:'Weekly Rehearsal', date:'2026-03-28', status:'present', voicePart:'Alto',    markedAt:'2026-03-28 09:08' },
      { memberName:'Jean-Paul Habimana',   eventTitle:'Weekly Rehearsal', date:'2026-03-28', status:'late',    voicePart:'Tenor',   markedAt:'2026-03-28 09:45' },
      { memberName:'Emmanuel Ndayishimiye',eventTitle:'Weekly Rehearsal', date:'2026-03-28', status:'absent',  voicePart:'Bass',    markedAt:'' },
    ],
    events: [
      { title:'Weekly Rehearsal',    type:'rehearsal',   date:'2026-04-04', time:'09:00', location:'Kigali Main Church', mandatory:true,  attendCount:18 },
      { title:'Sunday Service',      type:'service',     date:'2026-04-06', time:'08:00', location:'Kigali Main Church', mandatory:true,  attendCount:22 },
      { title:'Directors Meeting',   type:'meeting',     date:'2026-04-10', time:'17:00', location:'Board Room',         mandatory:false, attendCount:6  },
      { title:'Christmas Performance',type:'performance',date:'2026-12-24', time:'18:00', location:'National Stadium',  mandatory:true,  attendCount:0  },
    ],
  };

  const rows = seed[source] || [];
  return rows.map(row => {
    const out = {};
    columns.forEach(col => { out[col.id] = row[col.id]; });
    return out;
  });
}

// ── Column config row ──────────────────────────────────────────
function ColumnRow({ col, onRemove, onAggrChange }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'8px 12px', background:'#141E33',
      border:'1px solid #1E2D4A', borderRadius:8,
      cursor:'grab',
    }}>
      <span style={{ color:'#374151', fontSize:14 }}>⋮⋮</span>
      <span style={{ flex:1, fontSize:13, color:'#F0F4FF' }}>{col.label}</span>
      <select
        value={col.aggregate || 'None'}
        onChange={e => onAggrChange(col.id, e.target.value)}
        style={{
          background:'#0F172A', border:'1px solid #1E2D4A',
          borderRadius:6, padding:'3px 6px', color:'#94A3B8', fontSize:11,
        }}
      >
        {AGGREGATE_FNS.map(fn => <option key={fn} value={fn}>{fn}</option>)}
      </select>
      <button onClick={() => onRemove(col.id)} style={{
        background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:14,
      }}>×</button>
    </div>
  );
}

// ── Main report builder ────────────────────────────────────────
export default function CustomReportBuilder() {
  const [source,   setSource]   = useState('members');
  const [selectedCols, setSelectedCols] = useState(['fullName','voicePart','attendance','contributionTotal']);
  const [filters,  setFilters]  = useState([]);
  const [groupBy,  setGroupBy]  = useState('');
  const [sortCol,  setSortCol]  = useState('');
  const [sortDir,  setSortDir]  = useState('asc');
  const [reportTitle, setReportTitle] = useState('Custom Choir Report');
  const [step,     setStep]     = useState('build'); // build | preview | export
  const [aggregates, setAggregates] = useState({});
  const printRef = useRef(null);

  const sourceData     = DATA_SOURCES[source];
  const availableCols  = sourceData.columns;
  const chosenCols     = availableCols.filter(c => selectedCols.includes(c.id));
  const notChosenCols  = availableCols.filter(c => !selectedCols.includes(c.id));

  const mockData = useMemo(
    () => generateMockRows(source, chosenCols),
    [source, chosenCols]
  );

  const addCol = (colId) => setSelectedCols(prev => [...prev, colId]);
  const removeCol = (colId) => setSelectedCols(prev => prev.filter(c => c !== colId));
  const setAggregate = (colId, fn) => setAggregates(a => ({ ...a, [colId]: fn }));

  const addFilter = () => {
    const firstCol = availableCols[0];
    if (!firstCol) return;
    setFilters(f => [...f, { id:`f_${Date.now()}`, column:firstCol.id, op:FILTER_OPS[firstCol.type]?.[0]||'equals', value:'' }]);
  };

  const updateFilter = (id, key, val) => setFilters(f => f.map(x => x.id===id ? { ...x, [key]:val } : x));
  const removeFilter = (id) => setFilters(f => f.filter(x => x.id !== id));

  const handleExcelExport = () => {
    const headers = chosenCols.map(c => c.label).join(',');
    const rows    = mockData.map(row => chosenCols.map(c => JSON.stringify(row[c.id] ?? '')).join(','));
    const csv     = [headers, ...rows].join('\n');
    const blob    = new Blob([csv], { type:'text/csv' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href = url; a.download = `${reportTitle.replace(/\s+/g,'_')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handlePDFExport = () => {
    window.print();
  };

  return (
    <div style={{ fontFamily:'Crimson Pro, serif', color:'#F0F4FF' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>
            📋 Custom Report Builder
          </h2>
          <p style={{ margin:'3px 0 0', fontSize:13, color:'#64748B' }}>
            Select data, configure columns, filter and export
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['build','preview'].map(s => (
            <button key={s} onClick={() => setStep(s)} style={{
              padding:'8px 18px', borderRadius:10, border:'none',
              background: step===s ? 'rgba(201,168,76,0.2)' : '#141E33',
              color: step===s ? '#C9A84C' : '#64748B',
              fontSize:13, cursor:'pointer', fontWeight: step===s ? 700 : 400,
              boxShadow: step===s ? '0 0 0 1px rgba(201,168,76,0.3)' : 'none',
              textTransform:'capitalize',
            }}>
              {{build:'🔧 Build', preview:'👁 Preview'}[s]}
            </button>
          ))}
        </div>
      </div>

      {step === 'build' && (
        <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20 }}>
          {/* Left: config panel */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Report title */}
            <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, padding:'16px 18px' }}>
              <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Report Title
              </label>
              <input
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                style={{ width:'100%', background:'#141E33', border:'1px solid #1E2D4A', borderRadius:8, padding:'8px 12px', color:'#F0F4FF', fontSize:13, outline:'none', boxSizing:'border-box' }}
              />
            </div>

            {/* Data source */}
            <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, padding:'16px 18px' }}>
              <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Data Source
              </label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {Object.entries(DATA_SOURCES).map(([key, src]) => (
                  <button key={key} onClick={() => { setSource(key); setSelectedCols(src.columns.slice(0,4).map(c=>c.id)); }} style={{
                    padding:'10px 8px', background: source===key ? `${src.color}15` : '#141E33',
                    border:`1px solid ${source===key ? src.color+'44' : '#1E2D4A'}`,
                    borderRadius:10, cursor:'pointer', textAlign:'center',
                    color: source===key ? src.color : '#94A3B8',
                    fontSize:12, fontWeight: source===key ? 700 : 400,
                    transition:'all 0.15s',
                  }}>
                    <div style={{ fontSize:18, marginBottom:3 }}>{src.icon}</div>
                    {src.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, padding:'16px 18px' }}>
              <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Sort By
              </label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
                <select
                  value={sortCol}
                  onChange={e => setSortCol(e.target.value)}
                  style={{ background:'#141E33', border:'1px solid #1E2D4A', borderRadius:8, padding:'7px 10px', color:'#F0F4FF', fontSize:12 }}
                >
                  <option value="">No sort</option>
                  {chosenCols.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <button
                  onClick={() => setSortDir(d => d==='asc' ? 'desc' : 'asc')}
                  style={{ padding:'7px 12px', background:'#141E33', border:'1px solid #1E2D4A', borderRadius:8, color:'#C9A84C', cursor:'pointer', fontSize:13 }}
                >
                  {sortDir === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* Filters */}
            <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, padding:'16px 18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <label style={{ fontSize:11, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>Filters</label>
                <button onClick={addFilter} style={{ background:'none', border:'none', color:'#C9A84C', cursor:'pointer', fontSize:12, fontWeight:700 }}>+ Add</button>
              </div>
              {filters.length === 0 && (
                <p style={{ fontSize:12, color:'#374151', margin:0 }}>No filters applied</p>
              )}
              {filters.map(f => {
                const col = availableCols.find(c => c.id === f.column);
                return (
                  <div key={f.id} style={{ display:'flex', gap:6, marginBottom:8, alignItems:'center' }}>
                    <select value={f.column} onChange={e => updateFilter(f.id,'column',e.target.value)}
                      style={{ flex:1, background:'#141E33', border:'1px solid #1E2D4A', borderRadius:6, padding:'5px 6px', color:'#F0F4FF', fontSize:11 }}>
                      {availableCols.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <select value={f.op} onChange={e => updateFilter(f.id,'op',e.target.value)}
                      style={{ flex:1, background:'#141E33', border:'1px solid #1E2D4A', borderRadius:6, padding:'5px 6px', color:'#F0F4FF', fontSize:11 }}>
                      {(FILTER_OPS[col?.type] || FILTER_OPS.text).map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                    <input value={f.value} onChange={e => updateFilter(f.id,'value',e.target.value)}
                      placeholder="value" style={{ flex:1, background:'#141E33', border:'1px solid #1E2D4A', borderRadius:6, padding:'5px 8px', color:'#F0F4FF', fontSize:11, outline:'none' }} />
                    <button onClick={() => removeFilter(f.id)} style={{ background:'none', border:'none', color:'#EF4444', cursor:'pointer', fontSize:14 }}>×</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: column picker */}
          <div>
            <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, padding:'18px 20px', marginBottom:16 }}>
              <h4 style={{ margin:'0 0 14px', fontSize:14, fontFamily:'Cinzel, serif' }}>
                Selected Columns ({chosenCols.length})
              </h4>
              {chosenCols.length === 0 ? (
                <p style={{ fontSize:13, color:'#374151', textAlign:'center', padding:'20px 0' }}>
                  No columns selected. Add from available columns below.
                </p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {chosenCols.map(col => (
                    <ColumnRow key={col.id} col={{ ...col, aggregate:aggregates[col.id]||'None' }}
                      onRemove={removeCol} onAggrChange={setAggregate} />
                  ))}
                </div>
              )}
            </div>

            <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, padding:'18px 20px' }}>
              <h4 style={{ margin:'0 0 14px', fontSize:14, fontFamily:'Cinzel, serif' }}>
                Available Columns
              </h4>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {notChosenCols.map(col => (
                  <button key={col.id} onClick={() => addCol(col.id)} style={{
                    padding:'6px 12px', background:'#141E33',
                    border:'1px solid #1E2D4A', borderRadius:8,
                    color:'#94A3B8', fontSize:12, cursor:'pointer',
                    transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { e.target.style.borderColor='#C9A84C44'; e.target.style.color='#C9A84C'; }}
                  onMouseLeave={e => { e.target.style.borderColor='#1E2D4A'; e.target.style.color='#94A3B8'; }}
                  >
                    + {col.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div ref={printRef}>
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            marginBottom:16, flexWrap:'wrap', gap:10,
          }}>
            <h3 style={{ margin:0, fontSize:18, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>
              {reportTitle}
            </h3>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleExcelExport} style={{
                padding:'8px 16px', background:'rgba(34,197,94,0.1)',
                border:'1px solid rgba(34,197,94,0.3)', borderRadius:8,
                color:'#22C55E', fontSize:13, cursor:'pointer', fontWeight:600,
              }}>
                📊 Export CSV
              </button>
              <button onClick={handlePDFExport} style={{
                padding:'8px 16px', background:'rgba(239,68,68,0.1)',
                border:'1px solid rgba(239,68,68,0.3)', borderRadius:8,
                color:'#EF4444', fontSize:13, cursor:'pointer', fontWeight:600,
              }}>
                📄 Print / PDF
              </button>
            </div>
          </div>

          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'linear-gradient(135deg, #141E33, #1A2540)' }}>
                  {chosenCols.map(col => (
                    <th key={col.id} style={{
                      padding:'12px 16px', textAlign:'left',
                      color:'#C9A84C', fontFamily:'Cinzel, serif', fontSize:12,
                      letterSpacing:'0.05em', borderBottom:'2px solid rgba(201,168,76,0.3)',
                      whiteSpace:'nowrap',
                    }}>
                      {col.label}
                      {sortCol===col.id && <span style={{ marginLeft:5 }}>{sortDir==='asc'?'↑':'↓'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockData.map((row, ri) => (
                  <tr key={ri} style={{ background: ri%2===0 ? '#0F172A' : '#141E33', borderBottom:'1px solid #1E2D4A' }}>
                    {chosenCols.map(col => (
                      <td key={col.id} style={{ padding:'11px 16px', color:'#F0F4FF' }}>
                        <CellRenderer col={col} value={row[col.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {mockData.length === 0 && (
                <tbody>
                  <tr><td colSpan={chosenCols.length} style={{ padding:'30px', textAlign:'center', color:'#374151' }}>No data</td></tr>
                </tbody>
              )}
            </table>
          </div>

          <div style={{ marginTop:10, padding:'8px 16px', fontSize:11, color:'#374151', textAlign:'right' }}>
            {mockData.length} row{mockData.length!==1?'s':''} · Generated {new Date().toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cell renderer by type ──────────────────────────────────────
function CellRenderer({ col, value }) {
  if (value === undefined || value === null || value === '') return <span style={{ color:'#374151' }}>—</span>;

  if (col.type === 'currency') {
    return <span style={{ fontFamily:'DM Mono, monospace', color:'#C9A84C' }}>RWF {Number(value).toLocaleString()}</span>;
  }
  if (col.type === 'number') {
    return <span style={{ fontFamily:'DM Mono, monospace' }}>{Number(value).toLocaleString()}{col.label.includes('%') ? '%' : ''}</span>;
  }
  if (col.type === 'boolean') {
    return <span style={{ color: value ? '#22C55E' : '#EF4444' }}>{value ? '✓ Yes' : '✗ No'}</span>;
  }
  if (col.type === 'badge') {
    const COLORS = {
      active:'#22C55E', pending:'#F59E0B', inactive:'#EF4444',
      present:'#22C55E', late:'#F59E0B', absent:'#EF4444', excused:'#3B82F6',
      tithe:'#C9A84C', offering:'#3B82F6', rehearsal:'#8B5CF6', service:'#EC4899',
    };
    const c = COLORS[value] || '#94A3B8';
    return (
      <span style={{ fontSize:11, color:c, background:`${c}15`, border:`1px solid ${c}33`, borderRadius:6, padding:'2px 8px', fontWeight:700 }}>
        {String(value).replace('_',' ')}
      </span>
    );
  }
  return <span>{String(value)}</span>;
}
