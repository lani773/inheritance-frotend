/**
 * INHERITANCE CHOIR — Enhanced Dashboard Layout (v2)
 * Adds: global search bar, notification bell, session warning,
 * new nav items (Chat, My Account), online presence indicator.
 */
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth }          from '../../context/AuthContext';
import { usePermissions }   from '../../context/PermissionsContext';
import { useNotifications } from '../../context/NotificationsContext';
import { usePWA, InstallButton } from '../pwa/PWAManager';
import { GlobalSearch, useGlobalSearch, SearchButton } from '../search/GlobalSearch';
import { NotificationBell, NotificationPanel } from '../realtime/NotificationCenter';
import { SessionWarning }   from '../session/SessionManager';
import { RoleIndicator }    from '../rbac/PermissionGuard';
import { ConnectionStatus } from '../realtime/LivePresence';

const VP_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981', admin:'#C9A84C' };

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to:'/dashboard',               icon:'🏠', label:'Dashboard'      },
      { to:'/dashboard/members',       icon:'👥', label:'Members'         },
      { to:'/dashboard/attendance',    icon:'✅', label:'Attendance'      },
      { to:'/dashboard/events',        icon:'📅', label:'Events'          },
      { to:'/dashboard/contributions', icon:'💰', label:'Contributions'   },
    ],
  },
  {
    label: 'Communication',
    items: [
      { to:'/dashboard/messages',      icon:'💬', label:'Messages'        },
      { to:'/dashboard/chat',          icon:'🎵', label:'Live Chat',   badge:'NEW' },
      { to:'/dashboard/posts',         icon:'📰', label:'Posts'           },
      { to:'/dashboard/prayer',        icon:'🙏', label:'Prayer'          },
    ],
  },
  {
    label: 'Library',
    items: [
      { to:'/dashboard/songs',         icon:'🎶', label:'Songs'           },
      { to:'/dashboard/welfare',       icon:'❤️', label:'Welfare'         },
      { to:'/dashboard/team',          icon:'👑', label:'Team'            },
    ],
  },
  {
    label: 'Admin',
    adminOnly: true,
    items: [
      { to:'/dashboard/analytics',     icon:'📊', label:'Analytics'       },
      { to:'/dashboard/reports',       icon:'📋', label:'Reports'         },
      { to:'/dashboard/automation',    icon:'⚙️', label:'Automation'      },
      { to:'/dashboard/registrations', icon:'📝', label:'Registrations'   },
      { to:'/dashboard/admin',         icon:'🛡', label:'Admin Panel'     },
      { to:'/dashboard/settings',      icon:'⚙',  label:'Settings'        },
    ],
  },
];

export default function EnhancedDashboardLayout() {
  const { session, logout } = useAuth();
  const { can, isAdmin }    = usePermissions();
  const { unreadCount }     = useNotifications();
  const { canInstall }      = usePWA();
  const navigate            = useNavigate();

  const { open: searchOpen, setOpen: setSearchOpen } = useGlobalSearch();
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen,setUserMenuOpen]= useState(false);

  const vpColor    = VP_COLORS[session?.voicePart] || VP_COLORS.admin;
  const initials   = session?.fullName?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';

  return (
    <div style={{ display:'flex', height:'100vh', background:'#080C14', overflow:'hidden', fontFamily:'Crimson Pro, serif' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? 240 : 64, flexShrink:0,
        background:'linear-gradient(180deg, #0A1628, #0F172A)',
        borderRight:'1px solid #1E2D4A',
        display:'flex', flexDirection:'column',
        transition:'width 0.25s ease',
        overflow:'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding:'18px 16px', borderBottom:'1px solid #1E2D4A',
          display:'flex', alignItems:'center', gap:12,
          overflow:'hidden',
        }}>
          <div style={{
            width:36, height:36, borderRadius:10, flexShrink:0,
            background:'linear-gradient(135deg, #A07820, #C9A84C)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18,
          }}>
            🎵
          </div>
          {sidebarOpen && (
            <div style={{ overflow:'hidden' }}>
              <h2 style={{ margin:0, fontSize:13, fontFamily:'Cinzel, serif', color:'#C9A84C', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>
                INHERITANCE
              </h2>
              <p style={{ margin:0, fontSize:10, color:'#475569', letterSpacing:'0.08em' }}>CHOIR SYSTEM</p>
            </div>
          )}
        </div>

        {/* Search shortcut (in sidebar) */}
        {sidebarOpen && (
          <div style={{ padding:'10px 12px', borderBottom:'1px solid #1E2D4A' }}>
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:8,
                padding:'7px 10px', background:'#141E33',
                border:'1px solid #1E2D4A', borderRadius:8,
                color:'#64748B', fontSize:12, cursor:'pointer',
              }}
            >
              <span>🔍</span>
              <span style={{ flex:1, textAlign:'left' }}>Search…</span>
              <kbd style={{ fontSize:9, background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:3, padding:'1px 4px' }}>⌘K</kbd>
            </button>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          {NAV_SECTIONS.map(section => {
            if (section.adminOnly && !isAdmin) return null;
            return (
              <div key={section.label}>
                {sidebarOpen && (
                  <p style={{ fontSize:10, color:'#374151', textTransform:'uppercase', letterSpacing:'0.1em', padding:'10px 16px 4px', margin:0 }}>
                    {section.label}
                  </p>
                )}
                {section.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    style={({ isActive }) => ({
                      display:'flex', alignItems:'center',
                      gap: sidebarOpen ? 10 : 0,
                      padding: sidebarOpen ? '9px 16px' : '9px 0',
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                      background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                      borderLeft: isActive ? '2px solid #C9A84C' : '2px solid transparent',
                      color: isActive ? '#C9A84C' : '#94A3B8',
                      textDecoration:'none', fontSize:13,
                      fontWeight: isActive ? 700 : 400,
                      transition:'all 0.15s',
                      position:'relative',
                    })}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                    {sidebarOpen && (
                      <>
                        <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span style={{
                            fontSize:8, fontWeight:800, color:'#080C14',
                            background:'#C9A84C', borderRadius:4, padding:'1px 4px',
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Install app button */}
        {sidebarOpen && canInstall && (
          <div style={{ padding:'10px 12px', borderTop:'1px solid #1E2D4A' }}>
            <InstallButton style={{ width:'100%', justifyContent:'center', padding:'8px' }} />
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(s=>!s)}
          style={{
            padding:'12px', background:'none', border:'none',
            borderTop:'1px solid #1E2D4A', color:'#374151', cursor:'pointer',
            fontSize:14, transition:'color 0.15s',
          }}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Topbar */}
        <header style={{
          height:60, flexShrink:0,
          background:'linear-gradient(135deg, #0A1628, #0F172A)',
          borderBottom:'1px solid #1E2D4A',
          display:'flex', alignItems:'center',
          padding:'0 20px', gap:14,
        }}>
          {/* Search */}
          <SearchButton onClick={() => setSearchOpen(true)} />

          <div style={{ flex:1 }} />

          {/* Notification bell */}
          <div style={{ position:'relative' }}>
            <NotificationBell onClick={() => setNotifOpen(o=>!o)} />
            {notifOpen && (
              <div style={{ position:'absolute', top:'100%', right:0, zIndex:200, marginTop:8 }}>
                <NotificationPanel onClose={() => setNotifOpen(false)} />
              </div>
            )}
          </div>

          {/* Role indicator */}
          <RoleIndicator />

          {/* Avatar + user menu */}
          <div style={{ position:'relative' }}>
            <button
              onClick={() => setUserMenuOpen(o=>!o)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                background:'none', border:'none', cursor:'pointer', padding:4,
              }}
            >
              <div style={{
                width:34, height:34, borderRadius:'50%',
                background:`${vpColor}22`, border:`2px solid ${vpColor}44`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:700, color:vpColor,
                fontFamily:'Cinzel, serif',
              }}>
                {initials}
              </div>
              {sidebarOpen && (
                <span style={{ fontSize:13, color:'#94A3B8', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {session?.fullName?.split(' ')[0]}
                </span>
              )}
            </button>

            {userMenuOpen && (
              <div style={{
                position:'absolute', top:'100%', right:0, marginTop:8, zIndex:200,
                background:'#0F172A', border:'1px solid #1E2D4A',
                borderRadius:14, overflow:'hidden', minWidth:180,
                boxShadow:'0 16px 48px rgba(0,0,0,0.5)',
                animation:'scaleIn 0.15s ease',
              }}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div style={{ padding:'14px 16px', borderBottom:'1px solid #1E2D4A' }}>
                  <p style={{ margin:0, fontSize:13, color:'#F0F4FF', fontWeight:600 }}>{session?.fullName}</p>
                  <p style={{ margin:'2px 0 0', fontSize:11, color:'#64748B' }}>{session?.email}</p>
                </div>
                {[
                  { icon:'👤', label:'My Profile',   to:'/dashboard/profile'    },
                  { icon:'🔐', label:'My Account',   to:'/dashboard/my-account' },
                  { icon:'📅', label:'My Attendance',to:'/dashboard/attendance' },
                ].map(item => (
                  <button key={item.to} onClick={() => { navigate(item.to); setUserMenuOpen(false); }} style={{
                    width:'100%', display:'flex', alignItems:'center', gap:10,
                    padding:'10px 16px', background:'none', border:'none',
                    color:'#94A3B8', fontSize:13, cursor:'pointer', textAlign:'left',
                  }}>
                    {item.icon} {item.label}
                  </button>
                ))}
                <div style={{ borderTop:'1px solid #1E2D4A' }}>
                  <button onClick={() => { logout(); setUserMenuOpen(false); }} style={{
                    width:'100%', display:'flex', alignItems:'center', gap:10,
                    padding:'10px 16px', background:'none', border:'none',
                    color:'#EF4444', fontSize:13, cursor:'pointer', textAlign:'left',
                  }}>
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Global overlays */}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <SessionWarning />
      <ConnectionStatus />
    </div>
  );
}
