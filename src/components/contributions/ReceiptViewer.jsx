/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Receipt Viewer Modal  (Task 6)
   Shows a styled receipt preview + generates downloadable PDF.
   ═══════════════════════════════════════════════════════════════════ */
import React, { useRef } from 'react';
import Modal  from '../shared/Modal';
import Button from '../shared/Button';
import { CONTRIBUTION_TYPES, PAYMENT_METHODS } from '../../config/constants';
import { formatDate, formatCurrency, getInitials } from '../../utils/index';

export default function ReceiptViewer({ isOpen, contribution: c, member, onClose }) {
  if (!c) return null;

  const typeConfig   = CONTRIBUTION_TYPES.find(t => t.id === c.type);
  const methodConfig = PAYMENT_METHODS.find(m => m.id === c.method);

  /* ── Generate PDF with jsPDF ─────────────────────────────── */
  const handleDownload = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: [105, 160], orientation: 'portrait' });

      // Background
      doc.setFillColor(8, 12, 20);
      doc.rect(0, 0, 105, 160, 'F');

      // Gold header band
      doc.setFillColor(201, 168, 76);
      doc.rect(0, 0, 105, 22, 'F');

      // Choir name
      doc.setTextColor(8, 12, 20);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('INHERITANCE CHOIR', 52.5, 9, { align: 'center' });
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.text('Contribution Receipt', 52.5, 15, { align: 'center' });

      // Music note
      doc.setTextColor(201, 168, 76); doc.setFontSize(28);
      doc.text('♪', 52.5, 36, { align: 'center' });

      // Receipt number
      doc.setTextColor(148, 163, 184); doc.setFontSize(7);
      doc.text('RECEIPT NO.', 52.5, 44, { align: 'center' });
      doc.setTextColor(201, 168, 76); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text(c.receiptNo || 'CHR-0000', 52.5, 50, { align: 'center' });

      // Amount — big and centered
      doc.setTextColor(34, 197, 94); doc.setFontSize(22); doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(c.amount, c.currency), 52.5, 64, { align: 'center' });
      doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal');
      doc.text(c.type?.replace(/_/g, ' ').toUpperCase(), 52.5, 70, { align: 'center' });

      // Separator
      doc.setDrawColor(36, 51, 86);
      doc.line(14, 75, 91, 75);

      // Details
      const addRow = (label, value, y) => {
        doc.setTextColor(90, 107, 133); doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
        doc.text(label, 14, y);
        doc.setTextColor(240, 244, 255); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
        doc.text(String(value), 91, y, { align: 'right' });
      };

      let y = 82;
      addRow('Member Name',   member?.fullName || `Member #${c.memberId}`,  y); y += 8;
      addRow('Voice Part',    member?.voicePart || '—',                      y); y += 8;
      addRow('Date',          formatDate(c.date),                            y); y += 8;
      addRow('Payment Method',methodConfig?.label || c.method || '—',       y); y += 8;
      addRow('Reference',     c.reference || '—',                           y); y += 8;
      addRow('Status',        c.verified ? 'Verified ✓' : 'Pending',        y); y += 8;
      if (c.notes) { addRow('Notes', c.notes, y); y += 8; }

      // Separator
      doc.setDrawColor(36, 51, 86);
      doc.line(14, y + 2, 91, y + 2);
      y += 8;

      // Thank you message
      doc.setTextColor(148, 163, 184); doc.setFontSize(7); doc.setFont('helvetica', 'italic');
      doc.text('Thank you for your generous contribution.', 52.5, y + 4, { align: 'center' });
      doc.text('May God bless you abundantly.', 52.5, y + 10, { align: 'center' });

      // Footer
      doc.setFontSize(6); doc.setFont('helvetica', 'normal');
      doc.text('inheritancechoir@gmail.com', 52.5, 150, { align: 'center' });
      doc.text('Kigali, Rwanda', 52.5, 155, { align: 'center' });

      doc.save(`receipt-${c.receiptNo || 'CHR'}.pdf`);
    } catch (e) {
      console.error('PDF generation failed:', e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title="Contribution Receipt"
      subtitle={`Receipt ${c.receiptNo || ''}`}
      accent={typeConfig?.color || 'var(--gold)'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" icon="⬇️" onClick={handleDownload}>Download PDF</Button>
        </>
      }
    >
      {/* ── Visual receipt preview ─────────────────────────── */}
      <div style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)',
      }}>
        {/* Header band */}
        <div style={{ background: 'linear-gradient(135deg, var(--gold-deep), var(--gold))', padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 900, color: 'var(--text-inverse)', letterSpacing: '0.1em' }}>
            INHERITANCE CHOIR
          </div>
          <div style={{ fontSize: 9, color: 'rgba(8,12,20,0.7)', marginTop: 2, letterSpacing: '0.06em' }}>
            CONTRIBUTION RECEIPT
          </div>
        </div>

        {/* Receipt number */}
        <div style={{ padding: '16px 20px', textAlign: 'center', borderBottom: '1px dashed var(--border-default)' }}>
          <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 4 }}>RECEIPT NO.</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 900, color: 'var(--gold)' }}>
            {c.receiptNo || 'CHR-0000'}
          </div>
        </div>

        {/* Amount */}
        <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px dashed var(--border-default)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 900, color: 'var(--color-emerald)' }}>
            {formatCurrency(c.amount, c.currency)}
          </div>
          <div style={{ marginTop: 6 }}>
            <span style={{ background: `${typeConfig?.color||'var(--gold)'}18`, color: typeConfig?.color||'var(--gold)', border: `1px solid ${typeConfig?.color||'var(--gold)'}30`, borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 10, letterSpacing: '0.08em' }}>
              {typeConfig?.icon} {c.type?.replace(/_/g,' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: '16px 20px' }}>
          {[
            { label: 'Member',   value: member?.fullName || `Member #${c.memberId}` },
            { label: 'Voice',    value: member?.voicePart || '—' },
            { label: 'Date',     value: formatDate(c.date) },
            { label: 'Method',   value: `${methodConfig?.icon || ''} ${methodConfig?.label || c.method}` },
            { label: 'Reference',value: c.reference || '—' },
            { label: 'Status',   value: c.verified ? '✓ Verified' : '⏳ Pending', highlight: c.verified },
            ...(c.notes ? [{ label: 'Notes', value: c.notes }] : []),
          ].map(({ label, value, highlight }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
              <span style={{ fontSize: 11, color: highlight ? 'var(--color-success)' : 'var(--text-primary)', fontWeight: highlight ? 700 : 400 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px 16px', textAlign: 'center', borderTop: '1px dashed var(--border-default)' }}>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontStyle: 'italic', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            "Thank you for your generous contribution"
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>inheritancechoir@gmail.com · Kigali, Rwanda</div>
        </div>
      </div>
    </Modal>
  );
}
