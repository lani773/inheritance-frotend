/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Team & Roles Page  (Task 10)

   Features:
   • View all members by role with assignment actions
   • Permission matrix: what each role can access
   • Committee management: create, assign, manage
   • Transfer roles between members
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react';
import { useToast }  from '../../context/ToastContext';
import { membersService } from '../../services/index';
import { ROLES, VOICE_PARTS } from '../../config/constants';
import {
  Avatar, Badge, PageHeader, Tabs, EmptyState, InfoBox,
} from '../../components/shared/index';
import Button from '../../components/shared/Button';
import Modal  from '../../components/shared/Modal';
import { Select } from '../../components/shared/index';
import { getInitials, formatDate } from '../../utils/index';

const VP_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };

/* ── Permission matrix data ──────────────────────────────────── */
const MODULES = [
  'Dashboard','Members','Attendance','Contributions','Events',
  'Messages','Posts','Welfare','Songs','Reports','Admin','Settings',
];

const ROLE_PERMISSIONS = {
  president:       [true, true, true, true, true, true, true, true, true, true, true, true],
  vp_welfare:      [true, true, true, false,true, true, true, true, false,true, false,false],
  secretary:       [true, true, false,false,true, true, true, false,false,true, false,false],
  treasurer:       [true, true, false,true, false,true, false,false,false,true, false,false],
  attendance_lead: [true, true, true, false,true, true, false,false,false,false,false,false],
  choir_director:  [true, true, false,false,true, true, true, false,true, false,false,false],
  section_lead:    [true, false,true, false,false,true, false,false,false,false,false,false],
  member:          [true, false,false,false,false,true, true, false,false,false,false,false],
};

/* ─────────────────────────────────────────────────────────────── */
export default function TeamPage() {
  const { success: toastOK } = useToast();
  const [tab, setTab] = useState('roles');
  const members = useMemo(() => membersService.getActive(), []);

  /* ── Group members by role ───────────────────────────────── */
  const byRole = useMemo(() => {
    const grouped = {};
    ROLES.forEach(r => { grouped[r.id] = members.filter(m => m.role === r.id); });
    return grouped;
  }, [members]);

  /* ── Assign role modal ───────────────────────────────────── */
  const [assignModal, setAssignModal] = useState(null); // { memberId, currentRole }
  const [newRole, setNewRole] = useState('');
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!newRole || !assignModal) return;
    setAssigning(true);
    await new Promise(r => setTimeout(r, 300));
    membersService.update(assignModal.memberId, { role: newRole });
    toastOK('Role updated successfully!');
    setAssignModal(null);
    setNewRole('');
    setAssigning(false);
    // Trigger re-render
    window.location.reload();
  };

  const tabs = [
    { id:'roles',       label:'Roles & Members',    icon:'👥' },
    { id:'permissions', label:'Permission Matrix',  icon:'🔐' },
  ];

  return (
    <div style={{ animation:'fadeUp 0.35s ease both' }}>
      <PageHeader
        title="Team & Roles"
        subtitle={`${members.length} active members · ${ROLES.length} roles`}
        icon="🏆"
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ══════════════════════════════════════════════════════
          ROLES TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'roles' && (
        <div>
          <InfoBox type="info" style={{ marginBottom:20 }}>
            Each role determines what modules a member can access. Click "Assign" to change a member's role.
          </InfoBox>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {ROLES.map(role => {
              const roleMembers = byRole[role.id] || [];
              return (
                <div key={role.id} style={{
                  background:'var(--bg-card)', border:'1px solid var(--border-subtle)',
                  borderRadius:'var(--radius-xl)', overflow:'hidden',
                }}>
                  <div style={{ height:3, background:`linear-gradient(90deg,transparent,${role.color||'var(--gold)'},transparent)` }} />
                  <div style={{ padding:'16px 20px' }}>
                    {/* Role header */}
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: roleMembers.length > 0 ? 14 : 0 }}>
                      <div style={{
                        width:42, height:42, borderRadius:'50%',
                        background:`${role.color||'var(--gold)'}15`,
                        border:`2px solid ${role.color||'var(--gold)'}40`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:20, flexShrink:0,
                      }}>
                        {role.icon}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>
                          {role.label}
                        </div>
                        <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-secondary)' }}>
                          {role.description || `${roleMembers.length} member${roleMembers.length!==1?'s':''} assigned`}
                        </div>
                      </div>
                      <Badge color={role.color||'var(--gold)'}>{roleMembers.length}</Badge>
                    </div>

                    {/* Members in this role */}
                    {roleMembers.length > 0 ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {roleMembers.map(m => (
                          <div key={m.id} style={{
                            display:'flex', alignItems:'center', gap:10,
                            padding:'9px 12px',
                            background:'var(--bg-raised)',
                            border:'1px solid var(--border-subtle)',
                            borderRadius:'var(--radius-md)',
                          }}>
                            <Avatar initials={getInitials(m.fullName)} size={32} color={VP_COLORS[m.voicePart]} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                {m.fullName}
                              </div>
                              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', marginTop:1 }}>
                                {m.voicePart} · {m.email}
                              </div>
                            </div>
                            <Badge color={VP_COLORS[m.voicePart]||'var(--gold)'} size="xs">{m.voicePart}</Badge>
                            <Button size="xs" variant="secondary"
                              onClick={() => { setAssignModal({ memberId: m.id, memberName: m.fullName, currentRole: m.role }); setNewRole(m.role); }}
                            >
                              Assign Role
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-muted)', fontStyle:'italic', padding:'4px 0' }}>
                        No members assigned to this role
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          PERMISSIONS MATRIX TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'permissions' && (
        <div>
          <InfoBox type="info" style={{ marginBottom:20 }}>
            This matrix shows which modules each role can access. Administrators can grant additional committee permissions to individual members.
          </InfoBox>
          <div style={{ overflowX:'auto', background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead>
                <tr style={{ background:'var(--bg-raised)' }}>
                  <th style={{ padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', textAlign:'left', borderBottom:'2px solid var(--border-subtle)', whiteSpace:'nowrap' }}>
                    Module
                  </th>
                  {ROLES.map(r => (
                    <th key={r.id} style={{ padding:'12px 10px', fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'center', borderBottom:'2px solid var(--border-subtle)', borderLeft:'1px solid var(--border-subtle)', whiteSpace:'nowrap' }}>
                      <div style={{ fontSize:14, marginBottom:3 }}>{r.icon}</div>
                      {r.label.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod, mi) => (
                  <tr key={mod} style={{ borderBottom:'1px solid var(--border-subtle)' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <td style={{ padding:'10px 16px', fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>
                      {mod}
                    </td>
                    {ROLES.map((r, ri) => {
                      const perms = ROLE_PERMISSIONS[r.id] || [];
                      const hasAccess = perms[mi];
                      return (
                        <td key={r.id} style={{ padding:'10px', textAlign:'center', borderLeft:'1px solid var(--border-subtle)' }}>
                          {hasAccess ? (
                            <span style={{ fontSize:16, color:'var(--color-success)' }}>✓</span>
                          ) : (
                            <span style={{ fontSize:12, color:'var(--text-muted)', opacity:0.35 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Assign role modal ─────────────────────────────── */}
      {assignModal && (
        <Modal isOpen onClose={() => setAssignModal(null)}
          title={`Assign Role — ${assignModal.memberName}`}
          accent="var(--gold)" size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setAssignModal(null)}>Cancel</Button>
              <Button variant="primary" loading={assigning} onClick={handleAssign} disabled={newRole===assignModal.currentRole}>
                ✅ Assign Role
              </Button>
            </>
          }
        >
          <InfoBox type="info" style={{ marginBottom:16 }}>
            Changing this member's role will immediately update their module access permissions.
          </InfoBox>
          <Select label="New Role" value={newRole} onChange={setNewRole}
            options={ROLES.map(r => ({ value:r.id, label:`${r.icon} ${r.label}` }))}
          />
          {newRole && newRole !== assignModal.currentRole && (
            <div style={{ marginTop:12, padding:'10px 14px', background:'var(--gold-alpha-10)', border:'1px solid var(--border-gold)', borderRadius:'var(--radius-md)', fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-secondary)' }}>
              Changing from <strong style={{ color:'var(--text-primary)' }}>{ROLES.find(r=>r.id===assignModal.currentRole)?.label}</strong> → <strong style={{ color:'var(--gold)' }}>{ROLES.find(r=>r.id===newRole)?.label}</strong>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
