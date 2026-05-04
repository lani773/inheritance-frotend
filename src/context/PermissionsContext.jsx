/**
 * INHERITANCE CHOIR — RBAC Permissions Context
 * Granular role-based access control for every action in the system.
 * Components use usePermissions() to conditionally render UI.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

// ── Permission Registry ────────────────────────────────────────
// Format: "resource:action"  (e.g. "members:create", "contributions:verify")

const PERMISSION_MATRIX = {
  president: [
    'members:*', 'events:*', 'contributions:*', 'attendance:*',
    'messages:*', 'posts:*', 'welfare:*', 'songs:*',
    'reports:*', 'settings:*', 'admin:*', 'automation:*',
    'notifications:*', 'analytics:*', 'roles:*',
  ],

  vp_welfare: [
    'members:read', 'welfare:*', 'messages:read', 'messages:send',
    'posts:read', 'posts:create', 'events:read', 'contributions:read',
    'attendance:read', 'notifications:read', 'analytics:read',
  ],

  secretary: [
    'members:read', 'members:create', 'members:update',
    'events:*', 'messages:*', 'posts:*',
    'songs:read', 'attendance:read', 'contributions:read',
    'reports:generate', 'notifications:read', 'analytics:read',
  ],

  treasurer: [
    'contributions:*', 'reports:*', 'members:read',
    'messages:read', 'messages:send', 'events:read',
    'analytics:*', 'notifications:read',
  ],

  choir_director: [
    'events:*', 'songs:*', 'attendance:*', 'members:read',
    'messages:read', 'messages:send', 'posts:*',
    'reports:attendance', 'notifications:read', 'analytics:attendance',
  ],

  attendance_lead: [
    'attendance:*', 'excuses:*', 'members:read',
    'events:read', 'messages:read', 'notifications:read',
    'reports:attendance',
  ],

  section_lead: [
    'attendance:read', 'attendance:mark',
    'members:read:own_section',
    'events:read', 'messages:read', 'songs:read',
    'notifications:read',
  ],

  member: [
    'members:read:public', 'events:read',
    'contributions:read:own', 'contributions:create:own',
    'attendance:read:own', 'excuses:create',
    'messages:read', 'messages:send',
    'posts:read', 'posts:create', 'posts:update:own',
    'songs:read', 'welfare:read', 'welfare:create:own',
    'profile:update:own', 'notifications:read',
    'prayer:*',
  ],
};

// ── Wildcards & inheritance resolution ────────────────────────
function resolvePermissions(role) {
  const raw = PERMISSION_MATRIX[role] || PERMISSION_MATRIX.member;
  const resolved = new Set();

  for (const perm of raw) {
    if (perm.endsWith(':*')) {
      // Expand resource wildcard
      const resource = perm.replace(':*', '');
      ['read', 'create', 'update', 'delete', 'export', 'import',
       'verify', 'approve', 'send', 'generate', 'mark'].forEach(action => {
        resolved.add(`${resource}:${action}`);
      });
      resolved.add(perm); // keep the wildcard too
    } else {
      resolved.add(perm);
    }
  }
  return resolved;
}

// ── Context ────────────────────────────────────────────────────
const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const { session } = useAuth();
  const role = session?.role || 'member';
  const isAdmin = session?.isAdmin || false;

  // Memoised permission set for this session
  const permissions = useMemo(() => resolvePermissions(role), [role]);

  /**
   * can(permission) — primary permission check
   * Examples:
   *   can('members:create')        → true/false
   *   can('contributions:verify')  → true/false
   *   can('admin:*')               → true if president
   */
  const can = useMemo(() => (permission) => {
    if (isAdmin) return true; // admin bypass
    if (permissions.has(permission)) return true;

    // Wildcard check: if 'resource:*' exists, allow any 'resource:action'
    const [resource] = permission.split(':');
    if (permissions.has(`${resource}:*`)) return true;

    return false;
  }, [permissions, isAdmin]);

  /**
   * canAny([...permissions]) — true if any permission matches
   */
  const canAny = useMemo(() => (perms) =>
    perms.some(p => can(p)),
    [can]);

  /**
   * canAll([...permissions]) — true if all permissions match
   */
  const canAll = useMemo(() => (perms) =>
    perms.every(p => can(p)),
    [can]);

  /**
   * hasRole(role | role[]) — check by role name directly
   */
  const hasRole = useMemo(() => (roleOrRoles) => {
    const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    return roles.includes(role);
  }, [role]);

  const value = {
    can, canAny, canAll, hasRole,
    role, isAdmin, permissions,
    // Quick flags
    isPresident:      role === 'president',
    isTreasurer:      role === 'treasurer',
    isSecretary:      role === 'secretary',
    isChairDirector:  role === 'choir_director',
    isVPWelfare:      role === 'vp_welfare',
    isAttendanceLead: role === 'attendance_lead',
    isSectionLead:    role === 'section_lead',
    isMember:         role === 'member',
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
}

// ── Gate Component ─────────────────────────────────────────────
/**
 * <Gate permission="members:create"> renders children only if allowed.
 * <Gate permission="contributions:verify" fallback={<span>No access</span>}>
 */
export function Gate({ permission, anyOf, allOf, role: requiredRole, fallback = null, children }) {
  const { can, canAny, canAll, hasRole } = usePermissions();

  let allowed = true;
  if (permission) allowed = can(permission);
  else if (anyOf)  allowed = canAny(anyOf);
  else if (allOf)  allowed = canAll(allOf);
  if (requiredRole && allowed) allowed = hasRole(requiredRole);

  return allowed ? children : fallback;
}
