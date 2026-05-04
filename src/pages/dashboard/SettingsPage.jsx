/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Settings Page  (Task 9 + Task 4 Enhanced)
   General · API Keys · Webhooks · System Monitor · Security
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState } from 'react';
import APIKeyManager   from '../../components/api-keys/APIKeyManager';
import WebhookManager  from '../../components/webhooks/WebhookManager';
import SystemMonitor   from '../../components/monitoring/SystemMonitor';
import { MFASetup, SecurityLog } from '../../components/session/SessionManager';
import { useToast }   from '../../context/ToastContext';
import { settingsService } from '../../services/index';
import { PageHeader, Tabs, InfoBox } from '../../components/shared/index';
import Button from '../../components/shared/Button';
import Input  from '../../components/shared/Input';
import { Select } from '../../components/shared/index';
import Storage from '../../storage/engine';
import { downloadBlob } from '../../utils/index';

const ENHANCED_TABS = [
  { id: 'apikeys',  label: 'API Keys',       icon: '🔑' },
  { id: 'webhooks', label: 'Webhooks',        icon: '🔗' },
  { id: 'monitor',  label: 'System Monitor',  icon: '📊' },
  { id: '2fa',      label: '2FA & Security',  icon: '🔐' },
];

export default function SettingsPage() {
  const { success: toastOK } = useToast();
  const [tab, setTab] = useState('general');

  const tabs = [
    { id:'general',    label:'General',     icon:'⚙️' },
    { id:'appearance', label:'Appearance',  icon:'🎨' },
    { id:'backup',     label:'Backup',      icon:'💾' },
  ];

  return (
    <div style={{ animation:'fadeUp 0.35s ease both' }}>
      <PageHeader title="System Settings" subtitle="Configure choir preferences and system options" icon="🔧" />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'general'    && <GeneralSettings toastOK={toastOK} />}
      {tab === 'appearance' && <AppearanceSettings toastOK={toastOK} />}
      {tab === 'backup'     && <BackupSettings toastOK={toastOK} />}
    </div>
  );
}

/* ── General settings ────────────────────────────────────────── */
function GeneralSettings({ toastOK }) {
  const [settings, setSettings] = useState(() => settingsService.get());
  const [saving, setSaving] = useState(false);

  const set = f => v => setSettings(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    settingsService.update(settings);
    toastOK('Settings saved!');
    setSaving(false);
  };

  return (
    <div style={{ maxWidth:600 }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden', marginBottom:16 }}>
        <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }} />
        <div style={{ padding:24 }}>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:18 }}>🏛 CHOIR IDENTITY</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Input label="Choir Name" value={settings.choirName||''} onChange={set('choirName')} placeholder="INHERITANCE CHOIR" />
            <Input label="Tagline / Motto" value={settings.tagline||''} onChange={set('tagline')} placeholder="Voices united in worship…" />
            <Input label="Contact Email" type="email" value={settings.contactEmail||''} onChange={set('contactEmail')} icon="✉️" />
            <Input label="Contact Phone" value={settings.contactPhone||''} onChange={set('contactPhone')} icon="📱" />
            <Input label="Address / Location" value={settings.address||''} onChange={set('address')} placeholder="Kigali, Rwanda" icon="📍" />
          </div>
        </div>
      </div>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden', marginBottom:20 }}>
        <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--color-info),transparent)' }} />
        <div style={{ padding:24 }}>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--color-info)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:18 }}>⚙️ SYSTEM PREFERENCES</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Select label="Currency" value={settings.currency||'RWF'} onChange={set('currency')}
              options={[{value:'RWF',label:'RWF — Rwandan Franc'},{value:'USD',label:'USD — US Dollar'},{value:'EUR',label:'EUR — Euro'}]}
            />
            <Select label="Language" value={settings.language||'en'} onChange={set('language')}
              options={[{value:'en',label:'English'},{value:'fr',label:'Français'},{value:'rw',label:'Kinyarwanda'}]}
            />
            <Input label="Attendance Goal (%)" type="number" value={String(settings.attendanceGoalPercent||80)} onChange={v=>set('attendanceGoalPercent')(Number(v))} />
            <Select label="Timezone" value={settings.timezone||'Africa/Kigali'} onChange={set('timezone')}
              options={[{value:'Africa/Kigali',label:'Africa/Kigali (CAT)'},{value:'UTC',label:'UTC'},{value:'Europe/London',label:'Europe/London'}]}
            />
          </div>

          {/* Toggles */}
          <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { key:'monthlyTitheReminders', label:'Monthly tithe reminders',      desc:'Auto-remind members on the 5th of each month' },
              { key:'eventReminders24h',     label:'24-hour event reminders',       desc:'Send reminder 24h before mandatory events'    },
              { key:'birthdayEmails',        label:'Birthday greetings',            desc:'Send birthday email to members on their day'  },
            ].map(({ key, label, desc }) => (
              <label key={key} style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer', padding:'12px 14px', background:'var(--bg-raised)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-subtle)' }}>
                <input type="checkbox" checked={!!settings[key]} onChange={e => set(key)(e.target.checked)}
                  style={{ accentColor:'var(--gold)', width:16, height:16 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font-heading)', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)', marginTop:1 }}>{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <Button variant="primary" loading={saving} icon="💾" onClick={handleSave}>Save Settings</Button>
    </div>
  );
}

/* ── Appearance settings ─────────────────────────────────────── */
function AppearanceSettings({ toastOK }) {
  const [brandColor, setBrandColor] = useState(() => settingsService.get().brandColor || '#C9A84C');

  const handleSaveColor = () => {
    settingsService.update({ ...settingsService.get(), brandColor });
    document.documentElement.style.setProperty('--gold', brandColor);
    toastOK('Brand color updated!');
  };

  const PRESETS = [
    { name:'Inheritance Gold',  color:'#C9A84C' },
    { name:'Royal Purple',      color:'#8B5CF6' },
    { name:'Emerald Grace',     color:'#10B981' },
    { name:'Crimson Cross',     color:'#EF4444' },
    { name:'Heaven Blue',       color:'#3B82F6' },
    { name:'Rose of Sharon',    color:'#EC4899' },
  ];

  return (
    <div style={{ maxWidth:500 }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
        <div style={{ height:3, background:`linear-gradient(90deg,transparent,${brandColor},transparent)` }} />
        <div style={{ padding:24 }}>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:18, color:'var(--text-primary)' }}>
            🎨 BRAND COLOR
          </div>
          <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.5, marginBottom:20 }}>
            Choose a primary accent color for your choir system. This updates gold accents, buttons, and highlights throughout.
          </p>
          {/* Color presets */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
            {PRESETS.map(p => (
              <button key={p.color} onClick={() => setBrandColor(p.color)}
                title={p.name}
                style={{
                  width:40, height:40, borderRadius:'50%', background:p.color,
                  border:`3px solid ${brandColor===p.color?'white':'transparent'}`,
                  cursor:'pointer', flexShrink:0,
                  boxShadow: brandColor===p.color ? `0 0 0 2px ${p.color}` : 'none',
                  transition:'all var(--transition-fast)',
                }}
              />
            ))}
          </div>

          {/* Custom hex input */}
          <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:20 }}>
            <div style={{ width:40, height:40, borderRadius:'var(--radius-md)', background:brandColor, border:'1px solid var(--border-subtle)', flexShrink:0 }} />
            <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
              style={{ width:50, height:40, border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-sm)', background:'var(--bg-input)', cursor:'pointer', padding:4 }}
            />
            <Input value={brandColor} onChange={setBrandColor} placeholder="#C9A84C" style={{ flex:1 }} />
          </div>

          <Button variant="primary" icon="💾" onClick={handleSaveColor} style={{ backgroundColor:brandColor, color:'#060A0F' }}>
            Apply Color
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Backup & Export settings ────────────────────────────────── */
function BackupSettings({ toastOK }) {
  const [exporting, setExporting] = useState(false);

  const exportJSON = async () => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 300));
    const keys   = Object.keys(localStorage).filter(k => k.startsWith('choir_'));
    const backup = {};
    keys.forEach(k => {
      try { backup[k] = JSON.parse(localStorage.getItem(k)); } catch { backup[k] = localStorage.getItem(k); }
    });
    backup._exportedAt = new Date().toISOString();
    backup._version    = '1.0';
    downloadBlob(
      new Blob([JSON.stringify(backup, null, 2)], { type:'application/json' }),
      `inheritance-choir-backup-${new Date().toISOString().split('T')[0]}.json`
    );
    toastOK('Full backup downloaded as JSON');
    setExporting(false);
  };

  const importJSON = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        Object.entries(data).forEach(([k, v]) => {
          if (k.startsWith('choir_')) localStorage.setItem(k, JSON.stringify(v));
        });
        toastOK('Backup restored! Refreshing…');
        setTimeout(() => window.location.reload(), 1200);
      } catch { alert('Invalid backup file'); }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth:540 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Export */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--color-success),transparent)' }} />
          <div style={{ padding:20 }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📤</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>Export Backup</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-secondary)', lineHeight:1.5, marginBottom:16 }}>
              Download all choir data as a JSON backup file you can restore later.
            </p>
            <Button variant="primary" icon="⬇️" loading={exporting} fullWidth onClick={exportJSON}>
              Download Backup
            </Button>
          </div>
        </div>

        {/* Import */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--color-info),transparent)' }} />
          <div style={{ padding:20 }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📥</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>Restore Backup</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-secondary)', lineHeight:1.5, marginBottom:16 }}>
              Restore data from a previously exported JSON backup file.
            </p>
            <input type="file" accept=".json" id="restore-input" style={{ display:'none' }}
              onChange={e => importJSON(e.target.files[0])} />
            <Button variant="secondary" icon="📂" fullWidth onClick={() => document.getElementById('restore-input').click()}>
              Choose Backup File
            </Button>
          </div>
        </div>
      </div>

      <InfoBox type="warning" style={{ marginTop:16 }}>
        Restoring a backup will overwrite all current data. Make sure to export a backup first.
      </InfoBox>
    </div>
  );
}
