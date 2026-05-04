/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Dashboard Layout Shell  (Task 2 — Complete)
   
   Features:
   • Collapsible sidebar: 280px (full) ↔ 64px (icon-only) on desktop
   • Mobile: sidebar slides in as overlay drawer + backdrop
   • TopBar: hamburger, breadcrumb, global search, notifications, user pill
   • Notification panel: slide-in from top-right, read/unread, mark all
   • User dropdown: profile, sign out with confirmation
   • Command palette: ⌘K / Ctrl+K fuzzy search overlay
   • Fully responsive at 640px, 768px, 1024px, 1400px
   • Smooth transitions with CSS vars
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth }    from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useToast }   from '../../context/ToastContext';
import { Avatar, Badge, Spinner } from '../shared/index';
import WsStatusBadge from '../shared/WsStatusBadge';
import { notificationsService, membersService } from '../../services/index';
import { formatDate } from '../../utils/index';

/* ── Navigation sections ─────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    id: 'overview', label: '── OVERVIEW',
    items: [
      { id: 'dashboard',  path: '/dashboard',             icon: '⬡', label: 'Dashboard'         },
      { id: 'profile',    path: '/dashboard/profile',     icon: '◎', label: 'My Profile'        },
    ],
  },
  {
    id: 'members', label: '── MEMBERS',
    items: [
      { id: 'members',       path: '/dashboard/members',       icon: '◈', label: 'Member Directory'  },
      { id: 'registrations', path: '/dashboard/registrations', icon: '📋', label: 'Registrations',  adminOnly: true },
    ],
  },
  {
    id: 'services', label: '── SERVICES',
    items: [
      { id: 'attendance',    path: '/dashboard/attendance',    icon: '✅', label: 'Attendance'         },
      { id: 'events',        path: '/dashboard/events',        icon: '📅', label: 'Events & Rehearsals' },
      { id: 'songs',         path: '/dashboard/songs',         icon: '🎵', label: 'Songs Library'      },
      { id: 'contributions', path: '/dashboard/contributions', icon: '💰', label: 'Contributions'      },
    ],
  },
  {
    id: 'communication', label: '── COMMUNICATION',
    items: [
      { id: 'messages',    path: '/dashboard/messages',    icon: '💬', label: 'Messages'       },
      { id: 'chat',        path: '/dashboard/chat',        icon: '🎵', label: 'Live Chat',  badge: 'NEW' },
      { id: 'posts',       path: '/dashboard/posts',       icon: '📢', label: 'Announcements'  },
    ],
  },
  {
    id: 'pastoral', label: '── PASTORAL',
    items: [
      { id: 'welfare',    path: '/dashboard/welfare',    icon: '❤️', label: 'Welfare & Care' },
      { id: 'prayer',     path: '/dashboard/prayer',     icon: '🙏', label: 'Prayer Board'   },
    ],
  },
  {
    id: 'my-space', label: '── MY SPACE',
    items: [
      { id: 'my-account', path: '/dashboard/my-account',  icon: '👤', label: 'My Account' },
      { id: 'my-profile',  path: '/dashboard/my-profile',  icon: '🪪', label: 'My Profile',  badge: 'NEW' },
    ],
  },
];

const ADMIN_SECTION = {
  id: 'president', label: '── PRESIDENT',
  items: [
    { id: 'team',         path: '/dashboard/team',         icon: '◈', label: 'Team & Roles'   },
    { id: 'intelligence', path: '/dashboard/intelligence', icon: '🧠', label: 'Intelligence',  badge: 'AI' },
    { id: 'reports',      path: '/dashboard/reports',      icon: '📈', label: 'Reports'         },
    { id: 'automation',   path: '/dashboard/automation',   icon: '⚡', label: 'Automation'      },
    { id: 'analytics',    path: '/dashboard/analytics',    icon: '📊', label: 'Analytics'       },
    { id: 'admin',        path: '/dashboard/admin',        icon: '⚙', label: 'Admin Panel'      },
    { id: 'settings',     path: '/dashboard/settings',     icon: '🔧', label: 'Settings'        },
  ],
};

/* ══════════════════════════════════════════════════════════════ */
export default function DashboardLayout() {
  const { session, logout, isAdmin }          = useAuth();
  const { isOpen, isMobileOpen, isMobile, toggle, closeMobile } = useSidebar();
  const { success: toastOK, info: toastInfo } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cmdOpen,     setCmdOpen]     = useState(false);
  const [cmdQuery,    setCmdQuery]    = useState('');
  const [notifications, setNotifications] = useState(notificationsService.getAll());
  const notifRef   = useRef(null);
  const userMenuRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const expanded    = isMobile ? isMobileOpen : isOpen;

  /* ── Refresh notifications ───────────────────────────────── */
  const refreshNotifs = useCallback(() => {
    setNotifications(notificationsService.getAll());
  }, []);

  /* ── Command palette keyboard shortcut ──────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
        setCmdQuery('');
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /* ── Close panels on outside click ──────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Close mobile drawer on route change ─────────────────── */
  useEffect(() => {
    if (isMobile) closeMobile();
  }, [location.pathname]); // eslint-disable-line

  /* ── Logout flow ────────────────────────────────────────── */
  const handleLogout = () => {
    setUserMenuOpen(false);
    logout(false);
    toastInfo('Signed out successfully.');
    navigate('/login', { replace: true });
  };

  /* ── Active path check ──────────────────────────────────── */
  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  /* ── Build nav sections ──────────────────────────────────── */
  const navSections = isAdmin ? [...NAV_SECTIONS, ADMIN_SECTION] : NAV_SECTIONS;

  /* ── Command palette: all nav items as commands ─────────── */
  const allCommands = navSections.flatMap(s =>
    s.items.map(i => ({ ...i, section: s.label }))
  );
  const filteredCmds = cmdQuery
    ? allCommands.filter(c =>
        c.label.toLowerCase().includes(cmdQuery.toLowerCase()) ||
        c.section.toLowerCase().includes(cmdQuery.toLowerCase())
      )
    : allCommands;

  /* ── Breadcrumb ──────────────────────────────────────────── */
  const pageName = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
  const prettyPage = pageName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  /* ── Sidebar width ───────────────────────────────────────── */
  const sidebarWidth = isMobile
    ? (isMobileOpen ? '280px' : '0px')
    : (isOpen ? '280px' : '64px');

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: 'var(--bg-base)',
      fontFamily: 'var(--font-body)',
    }}>

      {/* ══════════════════════════════════════════════════════
          MOBILE BACKDROP
         ══════════════════════════════════════════════════════ */}
      {isMobile && isMobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.72)',
            zIndex: 199, backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease',
          }}
          aria-label="Close sidebar"
        />
      )}

      {/* ══════════════════════════════════════════════════════
          SIDEBAR
         ══════════════════════════════════════════════════════ */}
      <aside style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        background:    'var(--bg-input)',
        borderRight:   '1px solid var(--border-subtle)',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
        transition:    'width 0.28s ease, min-width 0.28s ease',
        position:      isMobile ? 'fixed' : 'sticky',
        top: 0, left: 0, bottom: 0,
        height:        '100vh',
        zIndex:        200,
        flexShrink:    0,
      }}>

        {/* ── Brand header ─────────────────────────────────── */}
        <div style={{
          padding: expanded ? '16px 16px 14px' : '16px 12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg,var(--gold-deep),var(--gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
            boxShadow: '0 0 20px rgba(201,168,76,0.35)',
            transition: 'all 0.28s ease',
          }}>♪</div>

          {expanded && (
            <div style={{ overflow: 'hidden', animation: 'fadeRight 0.2s ease' }}>
              <div style={{
                fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 700,
                color: 'var(--gold)', letterSpacing: '0.12em', whiteSpace: 'nowrap',
              }}>
                INHERITANCE
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                color: 'var(--text-muted)', letterSpacing: '0.06em',
              }}>
                CHOIR SYSTEM
              </div>
            </div>
          )}
        </div>

        {/* ── Member identity card ─────────────────────────── */}
        {expanded && session && (
          <button
            onClick={() => navigate('/dashboard/profile')}
            style={{
              padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)',
              cursor: 'pointer', background: 'none', border: 'none',
              textAlign: 'left', width: '100%', transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar
                initials={session.name?.split(' ').map(n => n[0]).join('') || '?'}
                size={48} online={true}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontFamily: 'var(--font-heading)', fontSize: 13,
                  color: 'var(--text-primary)', fontWeight: 700,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {session.name}
                </div>
                <div style={{ marginTop: 4 }}>
                  <Badge color="var(--gold)" size="xs">
                    {isAdmin ? '🏆 PRESIDENT' : session.role?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Collapsed avatar */}
        {!expanded && session && (
          <button
            onClick={() => navigate('/dashboard/profile')}
            style={{
              padding: '12px', display: 'flex', justifyContent: 'center',
              borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
              background: 'none', border: 'none', width: '100%',
            }}
          >
            <Avatar
              initials={session.name?.split(' ').map(n => n[0]).join('') || '?'}
              size={40} online={true}
            />
          </button>
        )}

        {/* ── Navigation ───────────────────────────────────── */}
        <nav
          aria-label="Main navigation"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0' }}
        >
          {navSections.map(sec => (
            <div key={sec.id}>
              {/* Section label */}
              {expanded && (
                <div style={{
                  padding: '10px 16px 4px',
                  fontFamily: 'var(--font-mono)', fontSize: 8,
                  color: 'var(--text-muted)', letterSpacing: '0.2em',
                  textTransform: 'uppercase', userSelect: 'none',
                }}>
                  {sec.label}
                </div>
              )}

              {/* Nav items */}
              {sec.items.map(item => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    title={!expanded ? item.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center',
                      gap: expanded ? 10 : 0,
                      justifyContent: expanded ? 'flex-start' : 'center',
                      padding: expanded ? '9px 16px 9px 14px' : '10px',
                      background: active
                        ? `linear-gradient(90deg, var(--gold-alpha-10), transparent)`
                        : 'none',
                      border: 'none',
                      borderLeft: `3px solid ${active ? 'var(--gold)' : 'transparent'}`,
                      color: active ? 'var(--gold)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 13, fontFamily: 'var(--font-body)',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'none';
                      }
                    }}
                  >
                    <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1 }}>
                      {item.icon}
                    </span>
                    {expanded && (
                      <>
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span style={{
                            fontSize: 8, fontWeight: 800, color: '#080C14',
                            background: item.badge === 'AI' ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'var(--gold)',
                            borderRadius: 4, padding: '1px 5px',
                            letterSpacing: '0.05em', flexShrink: 0,
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {/* Active indicator dot (collapsed) */}
                    {!expanded && active && (
                      <div style={{
                        position: 'absolute', right: 6,
                        width: 4, height: 4, borderRadius: '50%',
                        background: 'var(--gold)',
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Sign out button ───────────────────────────────── */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '8px 0', flexShrink: 0 }}>
          <button
            onClick={handleLogout}
            title={!expanded ? 'Sign Out' : undefined}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center',
              gap: expanded ? 10 : 0,
              justifyContent: expanded ? 'flex-start' : 'center',
              padding: expanded ? '9px 16px' : '10px',
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: 13, fontFamily: 'var(--font-body)',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-error)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>🚪</span>
            {expanded && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT AREA
         ══════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0, overflow: 'hidden',
      }}>

        {/* ══════════════════════════════════════════════════
            TOP BAR
           ══════════════════════════════════════════════════ */}
        <header style={{
          height: 60,
          background: 'var(--bg-base)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center',
          padding: '0 16px 0 20px', gap: 10,
          position: 'sticky', top: 0,
          zIndex: 'var(--z-topbar)',
          flexShrink: 0,
        }}>
          {/* ── Hamburger ──────────────────────────────────── */}
          <button
            onClick={toggle}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-raised)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, flexShrink: 0,
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            ☰
          </button>

          {/* ── Breadcrumb ─────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} className="hide-mobile">
            <span style={{
              fontFamily: 'var(--font-heading)', fontSize: 10,
              color: 'var(--gold)', opacity: 0.45, letterSpacing: '0.12em',
            }}>
              INHERITANCE CHOIR
            </span>
            <span style={{ color: 'var(--border-default)', fontSize: 14 }}>·</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-muted)',
            }}>
              {prettyPage}
            </span>
          </div>

          {/* ── Global search ──────────────────────────────── */}
          <div style={{ flex: 1, maxWidth: 380 }}>
            <button
              onClick={() => { setCmdOpen(true); setCmdQuery(''); }}
              style={{
                width: '100%', background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '7px 14px 7px 36px',
                color: 'var(--text-muted)',
                fontSize: 12, fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                gap: 8, position: 'relative',
                transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              <span style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', fontSize: 13, pointerEvents: 'none',
              }}>🔍</span>
              <span>Search everything…</span>
              <span style={{
                marginLeft: 'auto',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 4, padding: '1px 6px',
                fontSize: 9, letterSpacing: '0.04em',
              }}>
                ⌘K
              </span>
            </button>
          </div>

          {/* ── Right side actions ─────────────────────────── */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

            <div className="hide-mobile">
              <WsStatusBadge />
            </div>

            {/* Notification bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setNotifOpen(o => !o); if (!notifOpen) refreshNotifs(); setUserMenuOpen(false); }}
                aria-label={`Notifications — ${unreadCount} unread`}
                style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: notifOpen ? 'var(--gold-alpha-10)' : 'var(--bg-raised)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, position: 'relative',
                  transition: 'all var(--transition-fast)',
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <div style={{
                    position: 'absolute', top: 5, right: 5,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--color-error)',
                    border: '2px solid var(--bg-base)',
                    animation: 'pulse 2s ease infinite',
                  }} />
                )}
              </button>

              {/* Notification dropdown panel */}
              {notifOpen && (
                <NotificationPanel
                  notifications={notifications}
                  onMarkAll={() => {
                    notificationsService.markAllRead();
                    refreshNotifs();
                  }}
                  onMarkOne={(id) => {
                    notificationsService.markRead(id);
                    refreshNotifs();
                  }}
                  onClose={() => setNotifOpen(false)}
                />
              )}
            </div>

            {/* User pill + dropdown */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setUserMenuOpen(o => !o); setNotifOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 10px 4px 4px',
                  background: 'var(--bg-raised)',
                  border: `1px solid ${userMenuOpen ? 'var(--border-gold)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-full)', cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-gold)'}
                onMouseLeave={e => { if (!userMenuOpen) e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              >
                <Avatar
                  initials={session?.name?.split(' ').map(n => n[0]).join('') || '?'}
                  size={30} online={true}
                />
                <div className="hide-mobile" style={{ textAlign: 'left' }}>
                  <div style={{
                    fontFamily: 'var(--font-heading)', fontSize: 11,
                    color: 'var(--text-primary)', fontWeight: 600,
                    lineHeight: 1.2, whiteSpace: 'nowrap',
                  }}>
                    {session?.name?.split(' ')[0]}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8,
                    color: 'var(--gold)', lineHeight: 1.2,
                  }}>
                    {session?.role?.toUpperCase()}
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }} className="hide-mobile">▾</span>
              </button>

              {/* User dropdown */}
              {userMenuOpen && (
                <UserDropdown
                  session={session}
                  onProfile={() => { setUserMenuOpen(false); navigate('/dashboard/profile'); }}
                  onLogout={handleLogout}
                />
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-surface)' }}>
          <div style={{
            maxWidth: 'var(--content-max-width)',
            margin: '0 auto',
            padding: '28px 20px',
          }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════
          COMMAND PALETTE  (⌘K)
         ══════════════════════════════════════════════════════ */}
      {cmdOpen && (
        <CommandPalette
          query={cmdQuery}
          onQuery={setCmdQuery}
          commands={filteredCmds}
          onSelect={(path) => { navigate(path); setCmdOpen(false); }}
          onClose={() => setCmdOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Notification Panel ──────────────────────────────────────── */
function NotificationPanel({ notifications, onMarkAll, onMarkOne, onClose }) {
  const TYPE = {
    info:    { color: 'var(--color-info)',    bg: 'var(--bg-info)'    },
    success: { color: 'var(--color-success)', bg: 'var(--bg-success)' },
    warning: { color: 'var(--color-warning)', bg: 'var(--bg-warning)' },
    error:   { color: 'var(--color-error)',   bg: 'var(--bg-error)'   },
  };
  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{
      position: 'absolute', top: 44, right: 0,
      width: 340, maxHeight: 500,
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 'var(--z-dropdown)',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeDown 0.2s ease both',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '0.08em' }}>
            NOTIFICATIONS
          </span>
          {unread > 0 && (
            <Badge color="var(--color-error)" size="xs">{unread} new</Badge>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unread > 0 && (
            <button
              onClick={onMarkAll}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em' }}
            >
              MARK ALL READ
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
          >×</button>
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>🔔</div>
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 20).map(n => {
            const cfg = TYPE[n.type] || TYPE.info;
            return (
              <div
                key={n.id}
                onClick={() => onMarkOne(n.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: n.isRead ? 'transparent' : 'rgba(201,168,76,0.03)',
                  cursor: 'pointer', transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(201,168,76,0.03)'}
              >
                {/* Color dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: cfg.color, marginTop: 5, flexShrink: 0,
                  boxShadow: n.isRead ? 'none' : `0 0 8px ${cfg.color}`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    color: 'var(--text-primary)',
                    fontWeight: n.isRead ? 400 : 600,
                  }}>
                    {n.title}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 11,
                    color: 'var(--text-secondary)', marginTop: 2,
                    lineHeight: 1.4,
                  }}>
                    {n.message}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                    color: 'var(--text-muted)', marginTop: 4,
                  }}>
                    {formatDate(n.createdAt, 'relative')}
                  </div>
                </div>
                {!n.isRead && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--gold)', flexShrink: 0, marginTop: 5,
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── User Dropdown ───────────────────────────────────────────── */
function UserDropdown({ session, onProfile, onLogout }) {
  return (
    <div style={{
      position: 'absolute', top: 44, right: 0,
      width: 200,
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 'var(--z-dropdown)',
      overflow: 'hidden',
      animation: 'fadeDown 0.2s ease both',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>
          {session?.name}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold)', marginTop: 3, letterSpacing: '0.06em' }}>
          {session?.role?.toUpperCase()}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
          {session?.email}
        </div>
      </div>

      {/* Menu items */}
      {[
        { icon: '👤', label: 'My Profile',    action: onProfile },
        { icon: '⚙', label: 'Settings',       action: () => {} },
      ].map(({ icon, label, action }) => (
        <button
          key={label}
          onClick={action}
          style={{
            width: '100%', padding: '10px 16px',
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)', fontSize: 13, textAlign: 'left',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}

      {/* Divider + logout */}
      <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '10px 16px',
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', color: 'var(--color-error)',
            fontFamily: 'var(--font-body)', fontSize: 13, textAlign: 'left',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-error)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

/* ── Command Palette ─────────────────────────────────────────── */
function CommandPalette({ query, onQuery, commands, onSelect, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg-overlay)',
        zIndex: 'var(--z-modal)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 560,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        animation: 'scaleIn 0.2s ease both',
        margin: '0 16px',
      }}>
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)',
        }}>
          <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => onQuery(e.target.value)}
            placeholder="Search pages, members, events…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 15,
              fontFamily: 'var(--font-body)',
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
              borderRadius: 6, padding: '2px 8px',
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {commands.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
              No results for "{query}"
            </div>
          ) : (
            commands.map(cmd => (
              <button
                key={cmd.id}
                onClick={() => onSelect(cmd.path)}
                style={{
                  width: '100%', padding: '11px 18px',
                  background: 'none', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-alpha-10)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{cmd.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {cmd.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em', marginTop: 2 }}>
                    {cmd.section.replace('── ', '')}
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>
                  ENTER
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 18px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', gap: 16,
          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)',
          letterSpacing: '0.05em',
        }}>
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
