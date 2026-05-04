/**
 * INHERITANCE CHOIR — Intelligence Hub Page
 * Combines: Predictive Analytics + Leaderboard + Custom Reports + Pledge Campaigns
 */
import React, { useState } from 'react';
import PredictiveAnalytics  from '../../components/intelligence/PredictiveAnalytics';
import MemberLeaderboard    from '../../components/leaderboard/MemberLeaderboard';
import CustomReportBuilder  from '../../components/reports/CustomReportBuilder';
import { PledgeCampaign }   from '../../components/financial-v2/PledgeCampaign';
import { ReceiptGenerator } from '../../components/financial-v2/PledgeCampaign';
import { usePermissions }   from '../../context/PermissionsContext';
import { Gate }             from '../../context/PermissionsContext';

const TABS = [
  { id: 'analytics',  label: 'Predictive AI',     icon: '⚡', permission: 'analytics:read' },
  { id: 'leaderboard',label: 'Leaderboard',        icon: '🏆', permission: null },
  { id: 'reports',    label: 'Report Builder',     icon: '📋', permission: 'reports:generate' },
  { id: 'pledges',    label: 'Pledge Campaigns',   icon: '🤝', permission: null },
  { id: 'receipts',   label: 'Receipt Generator',  icon: '📄', permission: 'contributions:read' },
];

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState('analytics');
  const { can } = usePermissions();

  const visibleTabs = TABS.filter(t => !t.permission || can(t.permission));

  return (
    <div style={{ minHeight: '100vh', background: '#080C14', fontFamily: 'Crimson Pro, serif' }}>
      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A, #141E33)',
        borderBottom: '1px solid #1E2D4A',
        padding: '24px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))',
            border: '1px solid rgba(201,168,76,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            🧠
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
              Intelligence Hub
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748B' }}>
              AI forecasting · Performance rankings · Custom reports · Pledge campaigns
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: '#0F172A', borderBottom: '1px solid #1E2D4A',
        padding: '0 32px', display: 'flex', overflowX: 'auto', gap: 0,
      }}>
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? '#C9A84C' : 'transparent'}`,
              padding: '14px 22px', cursor: 'pointer',
              color: activeTab === tab.id ? '#C9A84C' : '#64748B',
              fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 400,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px' }}>
        {activeTab === 'analytics'  && <PredictiveAnalytics />}
        {activeTab === 'leaderboard'&& <MemberLeaderboard />}
        {activeTab === 'reports'    && <CustomReportBuilder />}
        {activeTab === 'pledges'    && <PledgeCampaign />}
        {activeTab === 'receipts'   && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
                📄 Receipt Generator
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                Generate and print official contribution receipts
              </p>
            </div>
            <ReceiptGenerator />
          </div>
        )}
      </div>
    </div>
  );
}
