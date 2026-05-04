/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Members Management Page (MVP)
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { membersAPI } from '../../services/api/endpoints';
import { ROLES, VOICE_PARTS, GENDERS, MARITAL_STATUS } from '../../config/constants';
import {
  PageHeader, LoadingSpinner, Button, Input, Select, Modal, Badge, ConfirmDialog
} from '../../components/shared';
import { getInitials, formatDate } from '../../utils';

const VOICE_PART_COLORS = { Soprano: '#EC4899', Alto: '#8B5CF6', Tenor: '#3B82F6', Bass: '#10B981' };

export default function MembersPage() {
  const { session, socket } = useAuth();
  const { success: toastOK, error: toastErr } = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState(null); // For editing
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // Member ID to confirm deletion

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await membersAPI.list();
      setMembers(response.data || []);
    } catch (err) {
      toastErr('Failed to load members.');
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  }, [toastErr]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleMemberChange = (payload) => {
      if (payload.type === 'MEMBER_CREATED') {
        setMembers((prev) => [...prev, payload.data]);
        toastOK(`New member ${payload.data.fullName} joined!`);
      } else if (payload.type === 'MEMBER_UPDATED') {
        setMembers((prev) => prev.map((m) => (m.id === payload.data.id ? payload.data : m)));
        toastOK(`Member ${payload.data.fullName} updated.`);
      } else if (payload.type === 'MEMBER_DELETED') {
        setMembers((prev) => prev.filter((m) => m.id !== payload.id));
        toastOK(`Member deleted.`);
      }
    };

    socket.on('entity_change', handleMemberChange);
    return () => socket.off('entity_change', handleMemberChange);
  }, [socket, toastOK]);

  const openCreateModal = () => {
    setCurrentMember(null);
    setForm({
      fullName: '', email: '', phone: '', dateOfBirth: '',
      gender: '', maritalStatus: '', voicePart: '', role: 'member',
      password: '', confirmPassword: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setCurrentMember(member);
    setForm({
      fullName: member.fullName, email: member.email, phone: member.phone || '',
      dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split('T')[0] : '',
      gender: member.gender, maritalStatus: member.maritalStatus,
      voicePart: member.voicePart, role: member.role,
      // Passwords are not pre-filled for security
      password: '', confirmPassword: ''
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.password !== payload.confirmPassword) {
        throw new Error('Passwords do not match.');
      }
      if (!payload.password) {
        delete payload.password;
        delete payload.confirmPassword;
      }

      if (currentMember) {
        await membersAPI.update(currentMember.id, payload);
        toastOK('Member updated successfully!');
      } else {
        await membersAPI.create(payload);
        toastOK('Member created successfully!');
      }
      setIsModalOpen(false);
      fetchMembers(); // Re-fetch to ensure data consistency, though WS should handle most.
    } catch (err) {
      toastErr(err.message || 'Failed to save member.');
      console.error('Save member error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (memberId) => {
    try {
      await membersAPI.delete(memberId);
      toastOK('Member deleted successfully!');
      setConfirmDelete(null);
      fetchMembers(); // Re-fetch to ensure data consistency, though WS should handle most.
    } catch (err) {
      toastErr(err.message || 'Failed to delete member.');
      console.error('Delete member error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <LoadingSpinner size={40} color="var(--gold)" />
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeUp 0.35s ease both' }}>
      <PageHeader title="Choir Members" subtitle="Manage all members of the Inheritance Choir" icon="👥" />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <Button variant="primary" icon="➕" onClick={openCreateModal}>Add New Member</Button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border-default)' }}>
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>Email</th>
              <th style={tableHeaderStyle}>Voice Part</th>
              <th style={tableHeaderStyle}>Role</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No members found.</td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: VOICE_PART_COLORS[member.voicePart] || 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                        {getInitials(member.fullName)}
                      </div>
                      {member.fullName}
                    </div>
                  </td>
                  <td style={tableCellStyle}>{member.email}</td>
                  <td style={tableCellStyle}>
                    <Badge color={VOICE_PART_COLORS[member.voicePart] || 'var(--gold)'}>{member.voicePart}</Badge>
                  </td>
                  <td style={tableCellStyle}>
                    <Badge color={ROLES.find(r => r.id === member.role)?.color || 'var(--text-muted)'}>
                      {ROLES.find(r => r.id === member.role)?.label || member.role}
                    </Badge>
                  </td>
                  <td style={tableCellStyle}>
                    <Button variant="secondary" size="sm" icon="✏️" onClick={() => openEditModal(member)} style={{ marginRight: '8px' }}>Edit</Button>
                    {session?.isAdmin && (
                      <Button variant="danger" size="sm" icon="🗑️" onClick={() => setConfirmDelete(member.id)}>Delete</Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentMember ? 'Edit Member' : 'Add New Member'}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <Input label="Full Name" value={form.fullName} onChange={handleFormChange('fullName')} required />
          <Input label="Email" value={form.email} onChange={handleFormChange('email')} type="email" required />
          <Input label="Phone" value={form.phone} onChange={handleFormChange('phone')} placeholder="+250 788 000 000" />
          <Input label="Date of Birth" value={form.dateOfBirth} onChange={handleFormChange('dateOfBirth')} type="date" />
          <Select
            label="Gender" value={form.gender} onChange={handleFormChange('gender')}
            options={GENDERS.map(g => ({ value: g.id, label: g.label }))} placeholder="Select Gender"
          />
          <Select
            label="Marital Status" value={form.maritalStatus} onChange={handleFormChange('maritalStatus')}
            options={MARITAL_STATUS.map(m => ({ value: m.id, label: m.label }))} placeholder="Select Status"
          />
          <Select
            label="Voice Part" value={form.voicePart} onChange={handleFormChange('voicePart')}
            options={VOICE_PARTS.map(vp => ({ value: vp.id, label: vp.label }))} placeholder="Select Voice Part" required
          />
          <Select
            label="Role" value={form.role} onChange={handleFormChange('role')}
            options={ROLES.map(r => ({ value: r.id, label: r.label }))} placeholder="Select Role" required
          />
          <Input label="Password" value={form.password} onChange={handleFormChange('password')} type="password" placeholder="Leave blank to keep current" style={{ gridColumn: '1/-1' }} />
          <Input label="Confirm Password" value={form.confirmPassword} onChange={handleFormChange('confirmPassword')} type="password" style={{ gridColumn: '1/-1' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {currentMember ? 'Update Member' : 'Create Member'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Confirm Deletion"
        message="Are you sure you want to delete this member? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}

const tableHeaderStyle = {
  padding: '15px 20px',
  textAlign: 'left',
  color: 'var(--text-secondary)',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 'bold',
};

const tableCellStyle = {
  padding: '15px 20px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  borderBottom: '1px solid var(--border-subtle)',
};