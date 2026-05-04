/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Authentication Context
   
   Provides session state and auth methods to the entire app.
   Wrap your app in <AuthProvider> then use useAuth() anywhere.
   ═══════════════════════════════════════════════════════════════════ */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import Storage, { KEYS } from '../storage/engine';
import { SESSION } from '../config/constants';

// ── Create Context ─────────────────────────────────────────────
const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the entire app.
 * Place inside BrowserRouter in App.jsx.
 */
export function AuthProvider({ children }) {
  const [session, setSession]     = useState(null);    // active user session
  const [loading, setLoading]     = useState(true);    // initial auth check
  const [isExpired, setIsExpired] = useState(false);   // session expired flag

  // ── Restore Session on Mount ───────────────────────────────
  useEffect(() => {
    const storedSession = Storage.get(KEYS.SESSION);

    if (storedSession) {
      const loginTime   = new Date(storedSession.loginTime).getTime();
      const hoursPassed = (Date.now() - loginTime) / (1000 * 60 * 60);
      const rememberMe  = Storage.get(KEYS.REMEMBER);
      const maxHours    = rememberMe ? SESSION.REMEMBER_DAYS * 24 : SESSION.DEFAULT_HOURS;

      if (hoursPassed > maxHours) {
        // Session expired — clear it
        Storage.remove(KEYS.SESSION);
        Storage.remove(KEYS.REMEMBER);
        setIsExpired(true);
      } else {
        // Valid session — restore it
        setSession(storedSession);
      }
    }

    setLoading(false);
  }, []);

  // ── Login ──────────────────────────────────────────────────
  /**
   * Save session after successful login.
   * @param {object} userData - User record from storage/API
   * @param {boolean} rememberMe - Persist for 30 days
   */
  const login = useCallback((userData, rememberMe = false) => {
    const newSession = {
      userId:    userData.id,
      id:        userData.id,
      email:     userData.email,
      name:      userData.fullName,
      fullName:  userData.fullName,
      role:      userData.role,
      voicePart: userData.voicePart,
      avatarUrl: userData.avatarUrl,
      isAdmin:   userData.isAdmin || false,
      permissions: userData.permissions || [],
      token:     userData.token || userData.accessToken,
      refreshToken: userData.refreshToken,
      loginTime: new Date().toISOString(),
    };

    Storage.set(KEYS.SESSION, newSession);
    if (rememberMe) Storage.set(KEYS.REMEMBER, true);

    setSession(newSession);
    setIsExpired(false);

    // Log the action
    _appendAuditLog(newSession.email, 'auth.login', 'session', newSession.userId);
  }, []);

  // ── Logout ─────────────────────────────────────────────────
  /**
   * Clear session and return to login page.
   * @param {boolean} keepRemember - If false, also clear "remember me"
   */
  const logout = useCallback((keepRemember = false) => {
    if (session) {
      _appendAuditLog(session.email, 'auth.logout', 'session', session.userId);
    }

    Storage.remove(KEYS.SESSION);
    if (!keepRemember) Storage.remove(KEYS.REMEMBER);

    setSession(null);
  }, [session]);

  // ── Update Session (after profile edit) ───────────────────
  /**
   * Update the active session with new user data.
   * Call this after the user edits their profile.
   * @param {object} updates - Fields to merge into session
   */
  const updateSession = useCallback((updates) => {
    if (!session) return;
    const updated = { ...session, ...updates };
    Storage.set(KEYS.SESSION, updated);
    setSession(updated);
  }, [session]);

  // ── Permission Check ───────────────────────────────────────
  /**
   * Check if the current user has a specific permission.
   * Admins always have all permissions.
   * @param {string} permission - Permission key to check
   * @returns {boolean}
   */
  const hasPermission = useCallback((permission) => {
    if (!session) return false;
    if (session.isAdmin) return true;
    const perms = session.permissions || [];
    return perms.includes('all') || perms.includes(permission);
  }, [session]);

  // ── Computed Properties ────────────────────────────────────
  const isAuthenticated = !!session;
  const isAdmin         = session?.isAdmin || false;

  // ── Context Value ──────────────────────────────────────────
  const value = {
    session,
    loading,
    isExpired,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateSession,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — hook to consume AuthContext anywhere in the component tree.
 * @returns {object} Auth context value
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

// ── Internal Helpers ───────────────────────────────────────────
function _appendAuditLog(userEmail, action, resource, resourceId) {
  try {
    const log = Storage.getList(KEYS.AUDIT_LOG);
    const newEntry = {
      id: Date.now(),
      userEmail,
      action,
      resource,
      resourceId,
      timestamp: new Date().toISOString(),
    };
    // Keep last 200 entries
    const trimmed = [newEntry, ...log].slice(0, 200);
    Storage.set(KEYS.AUDIT_LOG, trimmed);
  } catch (e) {
    // Non-critical — don't crash on audit failures
    console.warn('[Auth] Audit log write failed:', e.message);
  }
}

export default AuthContext;
