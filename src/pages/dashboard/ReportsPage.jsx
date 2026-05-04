/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Reports Page  (Task 9)
   3 report types: Attendance · Financial · Members — all exportable
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react';
import { useToast }   from '../../context/ToastContext';
import {
  membersService, eventsService,
  attendanceService, contributionsService,
} from '../../services/index';
import {
  ChartCard, ContributionBarChart, AttendanceLineChart,
  VoicePieChart, TopContributorsChart, YoYBarChart,
} from '../../components/charts/index';
import {
  getContributionTrend, getAttendanceTrend, getVoiceDistribution,
  getTopContributors, getYoYContributions, getSummaryStats,
} from '../../utils/analytics';
import { PageHeader, Tabs, StatCard, ProgressBar, Avatar, Badge } from '../../components/shared/index';
import Button from '../../components/shared/Button';
import { formatDate, formatCurrency, getInitials, attendanceColor, truncate } from '../../utils/index';

export default function ReportsPage() {
  const { success: toastOK, error: toastErr } = useToast();
  const [tab, setTab] = useState('attendance');

  const tabs = [
    { id:'attendance', label:'Attendance',  icon:'✅' },
    { id:'financial',  label:'Financial',   icon:'💰' },
    { id:'members',    label:'Members',     icon:'👥' },
  ];

  /* ── Shared data ────────────────────────────────────────── */
  const stats       = useMemo(() => getSummaryStats(),        []);
  const attend12    = useMemo(() => getAttendanceTrend(12),   []);
  const contribs12  = useMemo(() => getContributionTrend(12), []);
  const voiceDist   = useMemo(() => getVoiceDistribution(),   []);
  const topContribs = useMemo(() => getTopContributors(9),    []);
  const yoyData     = useMemo(() => getYoYContributions(),    []);
  const members     = useMemo(() => membersService.getAll(),  []);
  const activeMembers = useMemo(() => membersService.getActive(), []);
  const allContribs = useMemo(() => contributionsService.getAll(), []);
  const allRecords  = useMemo(() => attendanceService.getAll(), []);

  /* ── Excel export ───────────────────────────────────────── */
  const exportExcel = async (sheetName, data, filename) => {
    try {
      const XLSX = (await import('xlsx')).default;
      const ws   = XLSX.utils.json_to_sheet(data);
      const wb   = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${filename}-${formatDate(new Date(),'short')}.xlsx`);
      toastOK(`${sheetName} exported to Excel`);
    } catch (e) { toastErr('Export failed'); }
  };

  const exportAttendanceReport = () => {
    const events = eventsService.getAll();
    const rows = activeMembers.map(m => {
      const mRecs  = allRecords.filter(r => r.memberId === m.id);
      const present= mRecs.filter(r => r.status==='present'||r.status==='late').length;
      const rate   = mRecs.length ? Math.round((present/mRecs.length)*100) : m.attendance||0;
      return { 'Name':m.fullName, 'Voice Part':m.voicePart, 'Events Tracked':mRecs.length, 'Present':present, 'Rate (%)':rate };
    });
    exportExcel('Attendance', rows, 'attendance-report');
  };

  const exportFinancialReport = () => {
    const rows = allContribs.map(c => {
      const m = members.find(x => x.id === c.memberId);
      return { 'Date':c.date, 'Member':m?.fullName||'', 'Voice':m?.voicePart||'', 'Type':c.type, 'Amount':c.amount, 'Currency':c.currency||'RWF', 'Method':c.method, 'Verified':c.verified?'Yes':'No', 'Receipt':c.receiptNo||'' };
    });
    exportExcel('Contributions', rows, 'financial-report');
  };

  const exportMembersReport = () => {
    const rows = members.map(m => ({
      'Name':m.fullName, 'Email':m.email, 'Voice':m.voicePart,
      'Role':m.role, 'Status':m.status,
      'Attendance %': m.attendance||0,
      'Contributions': m.contributionTotal||0,
      'Joined': m.joinDate,
    }));
    exportExcel('Members', rows, 'members-report');
  };

  /* ── Attendance per-member table data ────────────────────── */
  const memberAttStats = useMemo(() => {
    return activeMembers.map(m => {
      const recs    = allRecords.filter(r => r.memberId === m.id);
      const present = recs.filter(r => r.status==='present'||r.status==='late').length;
      const rate    = recs.length ? Math.round((present/recs.length)*100) : m.attendance||0;
      return { ...m, eventsTracked:recs.length, present, rate, atRisk:rate<70 };
    }).sort((a,b) => b.rate-a.rate);
  }, [activeMembers, allRecords]);

  return (
    <div style={{ animation:'fadeUp 0.35s ease both' }}>
      <PageHeader title="Reports" subtitle="Comprehensive analytics and exportable reports" icon="📈"
        actions={
          <div style={{ display:'flex', gap:8 }}>
            {tab==='attendance' && <Button variant="secondary" icon="📊" onClick={exportAttendanceReport}>Export Excel</Button>}
            {tab==='financial'  && <Button variant="secondary" icon="📊" onClick={exportFinancialReport}>Export Excel</Button>}
            {tab==='members'    && <Button variant="secondary" icon="📊" onClick={exportMembersReport}>Export Excel</Button>}
          </div>
        }
      />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ══════════════════════════════════════════════════════
          ATTENDANCE REPORT
         ══════════════════════════════════════════════════════ */}
      {tab === 'attendance' && (
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
            <StatCard icon="✅" value={`${stats.avgAttendance}%`} label="Overall Avg"       color="var(--color-violet)" />
            <StatCard icon="⚠️" value={stats.atRiskCount}         label="At-Risk Members"   color="var(--color-error)"  />
            <StatCard icon="🎯" value="80%"                         label="Target Rate"       color="var(--color-warning)"/>
            <StatCard icon="📋" value={stats.totalAttendanceRecords} label="Total Records"   color="var(--color-info)"   />
          </div>

          {/* Line chart */}
          <ChartCard title="12-Month Attendance Trend" subtitle="Overall + all voice parts" accentColor="var(--color-violet)" height={280}>
            <AttendanceLineChart data={attend12} showVoiceParts height={260} />
          </ChartCard>

          {/* Per-member table */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
            <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--color-violet),transparent)' }} />
            <div style={{ padding:20 }}>
              <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--color-violet)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:14 }}>
                PER-MEMBER BREAKDOWN
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--bg-raised)' }}>
                      {['#','Member','Voice','Events','Present','Rate','Status'].map(h=>(
                        <th key={h} style={{ padding:'8px 12px', fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', textAlign:h==='#'?'center':'left', borderBottom:'2px solid var(--border-subtle)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {memberAttStats.map((m,i) => (
                      <tr key={m.id} style={{ borderBottom:'1px solid var(--border-subtle)' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      >
                        <td style={{ padding:'9px 12px', textAlign:'center', fontFamily:'var(--font-mono)', fontSize:11, color:i<3?'var(--gold)':'var(--text-muted)', fontWeight:700 }}>
                          {i<3?['🥇','🥈','🥉'][i]:i+1}
                        </td>
                        <td style={{ padding:'9px 12px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <Avatar initials={getInitials(m.fullName)} size={28} />
                            <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-primary)', fontWeight:600 }}>{m.fullName}</span>
                          </div>
                        </td>
                        <td style={{ padding:'9px 12px' }}><Badge color={{Soprano:'#EC4899',Alto:'#8B5CF6',Tenor:'#3B82F6',Bass:'#10B981'}[m.voicePart]||'var(--gold)'} size="xs">{m.voicePart}</Badge></td>
                        <td style={{ padding:'9px 12px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-secondary)', textAlign:'center' }}>{m.eventsTracked}</td>
                        <td style={{ padding:'9px 12px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--color-success)', textAlign:'center' }}>{m.present}</td>
                        <td style={{ padding:'9px 12px', minWidth:120 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ flex:1 }}><ProgressBar value={m.rate} max={100} color={attendanceColor(m.rate)} height={4} /></div>
                            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:attendanceColor(m.rate), fontWeight:700, minWidth:36 }}>{m.rate}%</span>
                          </div>
                        </td>
                        <td style={{ padding:'9px 12px' }}>
                          {m.atRisk ? <Badge color="var(--color-error)" size="xs">AT-RISK</Badge> : <Badge color="var(--color-success)" size="xs">ON TRACK</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          FINANCIAL REPORT
         ══════════════════════════════════════════════════════ */}
      {tab === 'financial' && (
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
            <StatCard icon="💰" value={formatCurrency(stats.totalContribs,'RWF').replace('RWF ','')} label="All-Time Total" color="var(--gold)" />
            <StatCard icon="📅" value={formatCurrency(stats.thisMonthContribs,'RWF').replace('RWF ','')} label="This Month" color="var(--color-emerald)" trend={stats.contribGrowth} />
            <StatCard icon="📋" value={allContribs.length}   label="Total Records" color="var(--color-info)"    />
            <StatCard icon="✅" value={allContribs.filter(c=>c.verified).length} label="Verified" color="var(--color-success)" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:18 }}>
            <ChartCard title="12-Month Trend" accentColor="var(--gold)" height={260}>
              <ContributionBarChart data={contribs12} height={240} />
            </ChartCard>
            <ChartCard title="Year-Over-Year" accentColor="var(--color-info)" height={260}>
              <YoYBarChart data={yoyData} height={240} />
            </ChartCard>
          </div>

          <ChartCard title="Top Contributors" accentColor="var(--color-emerald)" height={280}>
            <TopContributorsChart data={topContribs} height={260} />
          </ChartCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MEMBERS REPORT
         ══════════════════════════════════════════════════════ */}
      {tab === 'members' && (
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
            <StatCard icon="👥" value={stats.totalMembers}   label="Total"    color="var(--gold)"          />
            <StatCard icon="✅" value={stats.activeMembers}  label="Active"   color="var(--color-success)" />
            <StatCard icon="⏳" value={stats.pendingMembers} label="Pending"  color="var(--color-warning)" />
            <StatCard icon="🎤" value={voiceDist.length}     label="Sections" color="var(--color-info)"    />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:18 }}>
            <ChartCard title="Voice Distribution" accentColor="var(--color-pink)" height={280}>
              <div style={{ display:'flex', alignItems:'center', height:'100%' }}>
                <VoicePieChart data={voiceDist} height={240} />
                <div style={{ display:'flex', flexDirection:'column', gap:10, minWidth:90 }}>
                  {voiceDist.map(v=>(
                    <div key={v.name} style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:v.color, flexShrink:0 }} />
                      <div>
                        <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--text-primary)', fontWeight:700 }}>{v.name}</div>
                        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)' }}>{v.value} · {v.percent}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            {/* Status breakdown */}
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
              <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }} />
              <div style={{ padding:20 }}>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:16 }}>
                  MEMBERSHIP STATUS
                </div>
                {[
                  { label:'Active',   color:'var(--color-success)', val:stats.activeMembers  },
                  { label:'Pending',  color:'var(--color-warning)', val:stats.pendingMembers  },
                  { label:'Inactive', color:'var(--color-error)',   val:members.filter(m=>m.status==='inactive').length },
                ].map(({ label, color, val }) => (
                  <div key={label} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color, fontWeight:700 }}>{val}</span>
                    </div>
                    <ProgressBar value={val} max={stats.totalMembers||1} color={color} height={5} animate />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
