/**
 * INHERITANCE CHOIR — Universal Export Engine
 * Export any dataset to Excel, CSV, PDF, or print.
 * Used across Members, Contributions, Attendance, Events pages.
 */
import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationsContext';

// ── Excel export (CSV format with .xlsx headers) ───────────────
export function exportToCSV(data, columns, filename = 'export') {
  const headers = columns.map(c => `"${c.label}"`).join(',');
  const rows    = data.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv  = [headers, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Print formatted table ─────────────────────────────────────
export function printTable(data, columns, title = 'Report', subtitle = '') {
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Crimson+Pro:wght@400;600&family=DM+Mono&display=swap');
    * { box-sizing: border-box; }
    body { font-family: 'Crimson Pro', serif; color: #1a202c; background: #fff; margin: 0; padding: 20px; }
    h1 { font-family: 'Cinzel', serif; font-size: 20px; color: #A07820; margin: 0 0 4px; }
    p  { margin: 0 0 20px; font-size: 12px; color: #718096; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #FEFCE8; }
    th { padding: 10px 12px; text-align: left; font-family: 'Cinzel', serif; font-size: 11px; color: #A07820; border-bottom: 2px solid #C9A84C44; }
    td { padding: 9px 12px; border-bottom: 1px solid #E2E8F0; }
    tr:nth-child(even) td { background: #F7FAFC; }
    .footer { margin-top: 24px; font-size: 10px; color: #A0AEC0; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 12px; }
    @page { margin: 1.5cm; size: A4 landscape; }
  `;

  const headerRow  = columns.map(c => `<th>${c.label}</th>`).join('');
  const bodyRows   = data.map(row =>
    `<tr>${columns.map(c => `<td>${row[c.key] ?? '—'}</td>`).join('')}</tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${styles}</style></head><body>
    <h1>${title}</h1>
    <p>${subtitle || ''} · Generated ${new Date().toLocaleString()} · ${data.length} records</p>
    <table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>
    <div class="footer">INHERITANCE CHOIR · Kigali, Rwanda · inheritancechoir@gmail.com</div>
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 600);
}

// ── Export Button (dropdown) ──────────────────────────────────
export function ExportButton({
  data = [],
  columns = [],
  filename = 'choir_export',
  title = 'Export',
  reportTitle = 'Choir Report',
  disabled = false,
}) {
  const [open,      setOpen]    = useState(false);
  const [exporting, setExporting] = useState(null);
  const { toast }               = useNotifications();

  const handleExport = async (format) => {
    if (!data.length) { toast('No data to export', { type: 'warning' }); return; }
    setExporting(format);

    await new Promise(r => setTimeout(r, 400));

    try {
      switch (format) {
        case 'csv':
          exportToCSV(data, columns, filename);
          toast(`Exported ${data.length} rows to CSV`, { type: 'success' });
          break;
        case 'print':
          printTable(data, columns, reportTitle, `${data.length} records`);
          toast('Opening print dialog…', { type: 'info' });
          break;
        case 'copy':
          const text = [
            columns.map(c => c.label).join('\t'),
            ...data.map(row => columns.map(c => row[c.key] ?? '').join('\t')),
          ].join('\n');
          navigator.clipboard.writeText(text);
          toast('Copied to clipboard (paste in Excel)', { type: 'success' });
          break;
        default:
          break;
      }
    } catch (e) {
      toast('Export failed: ' + e.message, { type: 'error' });
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  const FORMATS = [
    { id: 'csv',   icon: '📊', label: 'Export CSV',        desc: 'Opens in Excel / Google Sheets' },
    { id: 'print', icon: '🖨',  label: 'Print / PDF',       desc: 'Print or save as PDF' },
    { id: 'copy',  icon: '📋', label: 'Copy as Table',     desc: 'Paste directly into Excel' },
  ];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled || !data.length}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px',
          background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 10,
          color: disabled || !data.length ? '#374151' : '#C9A84C',
          fontSize: 13, fontWeight: 600, cursor: disabled || !data.length ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {exporting ? '⏳' : '⬇'} {title} ▾
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', right: 0, zIndex: 200,
            marginTop: 6, background: '#0F172A',
            border: '1px solid #1E2D4A', borderRadius: 14,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            overflow: 'hidden', minWidth: 220,
            animation: 'fadeIn 0.15s ease',
          }}
          onMouseLeave={() => setOpen(false)}
        >
          {FORMATS.map(f => (
            <button
              key={f.id}
              onClick={() => handleExport(f.id)}
              disabled={exporting === f.id}
              style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 16px', background: 'none', border: 'none',
                borderBottom: f.id !== 'copy' ? '1px solid #1E2D4A' : 'none',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#141E33'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: '#F0F4FF', fontWeight: 500 }}>
                  {exporting === f.id ? 'Processing…' : f.label}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: 11, color: '#64748B' }}>{f.desc}</p>
              </div>
            </button>
          ))}
          <div style={{ padding: '8px 16px', background: '#141E33', borderTop: '1px solid #1E2D4A' }}>
            <p style={{ margin: 0, fontSize: 10, color: '#374151' }}>
              {data.length} rows selected for export
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Batch action bar (select rows → export/delete/verify) ─────
export function BatchActionBar({ selected = [], onAction, actions = [] }) {
  if (!selected.length) return null;

  return (
    <div style={{
      position: 'sticky', bottom: 24, zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'linear-gradient(135deg, #0F172A, #141E33)',
      border: '1px solid rgba(201,168,76,0.3)',
      borderRadius: 16, padding: '12px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.08)',
      margin: '16px auto', maxWidth: 600,
      animation: 'slideUp 0.3s ease',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, color: '#C9A84C', fontFamily: 'DM Mono, monospace', flexShrink: 0,
      }}>
        {selected.length}
      </div>
      <span style={{ flex: 1, fontSize: 13, color: '#94A3B8' }}>
        {selected.length} item{selected.length !== 1 ? 's' : ''} selected
      </span>
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => onAction(action.id, selected)}
          style={{
            padding: '7px 14px',
            background: action.danger ? 'rgba(239,68,68,0.1)' : action.primary ? 'rgba(201,168,76,0.15)' : '#141E33',
            border: `1px solid ${action.danger ? 'rgba(239,68,68,0.3)' : action.primary ? 'rgba(201,168,76,0.3)' : '#1E2D4A'}`,
            borderRadius: 8,
            color: action.danger ? '#EF4444' : action.primary ? '#C9A84C' : '#94A3B8',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.15s',
          }}
        >
          {action.icon && <span>{action.icon}</span>}
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ── Quick stats bar ────────────────────────────────────────────
export function QuickStatsBar({ stats = [] }) {
  return (
    <div style={{
      display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4,
      margin: '0 0 20px',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: '#0F172A', border: `1px solid ${s.color || '#1E2D4A'}22`,
          borderRadius: 12, padding: '12px 18px', flexShrink: 0,
          borderLeft: `3px solid ${s.color || '#C9A84C'}`,
        }}>
          <p style={{ margin: 0, fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
          <p style={{ margin: '3px 0 0', fontSize: 20, fontWeight: 800, color: s.color || '#C9A84C', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>
            {s.value}
          </p>
          {s.sub && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#374151' }}>{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}
