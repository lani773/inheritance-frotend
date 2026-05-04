/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Sidebar Context
   Manages sidebar open/collapsed state and mobile overlay.
   ═══════════════════════════════════════════════════════════════════ */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  // Desktop: sidebar is expanded by default
  const [isOpen, setIsOpen] = useState(true);
  // Mobile: sidebar shows as overlay
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Track if user is on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ── Responsive detection ───────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close mobile overlay on resize to desktop
      if (!mobile) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Toggle Actions ─────────────────────────────────────────
  const toggle = useCallback(() => {
    if (isMobile) {
      setIsMobileOpen(prev => !prev);
    } else {
      setIsOpen(prev => !prev);
    }
  }, [isMobile]);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const value = {
    isOpen,        // desktop: full (true) vs collapsed (false)
    isMobileOpen,  // mobile: overlay visible
    isMobile,
    toggle,
    closeMobile,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

export default SidebarContext;
