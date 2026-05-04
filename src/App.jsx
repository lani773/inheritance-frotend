/**
 * INHERITANCE CHOIR — App Entry Point (Enhanced v3 — Task 3 complete)
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }        from './context/AuthContext';
import { ToastProvider }                from './context/ToastContext';
import { SidebarProvider }              from './context/SidebarContext';
import { PermissionsProvider }          from './context/PermissionsContext';
import { RealtimeProvider }             from './context/RealtimeContext';
import { NotificationsProvider }        from './context/NotificationsContext';
import { PWAProvider }                  from './components/pwa/PWAManager';
import DashboardLayout                  from './components/layout/DashboardLayout';
import { OnboardingGate } from './components/onboarding/OnboardingWizard';
import LoginPage                        from './pages/auth/LoginPage';
import RegisterPage                     from './pages/auth/RegisterPage';
import ForgotPasswordPage               from './pages/auth/ForgotPasswordPage';
import './styles/globals.css';
import './styles/tokens.css';
import './styles/animations.css';

const lp = (fn) => lazy(fn);
const DashboardPage      = lp(() => import('./pages/dashboard/DashboardPage'));
const MembersPage        = lp(() => import('./pages/dashboard/MembersPage'));
const AttendancePage     = lp(() => import('./pages/dashboard/AttendancePage'));
const EventsPage         = lp(() => import('./pages/dashboard/EventsPage'));
const ContributionsPage  = lp(() => import('./pages/dashboard/ContributionsPage'));
const MessagesPage       = lp(() => import('./pages/dashboard/MessagesPage'));
const AnalyticsPage      = lp(() => import('./pages/dashboard/AnalyticsPage'));
const ReportsPage        = lp(() => import('./pages/dashboard/ReportsPage'));
const AdminPage          = lp(() => import('./pages/dashboard/AdminPage'));
const SettingsPage       = lp(() => import('./pages/dashboard/SettingsPage'));
const ProfilePage        = lp(() => import('./pages/dashboard/ProfilePage'));
const MemberProfilePage  = lp(() => import('./pages/dashboard/MemberProfilePage'));
const WelfarePage        = lp(() => import('./pages/dashboard/WelfarePage'));
const SongsPage          = lp(() => import('./pages/dashboard/SongsPage'));
const PostsPage          = lp(() => import('./pages/dashboard/PostsPage'));
const PrayerPage         = lp(() => import('./pages/dashboard/PrayerPage'));
const AutomationPage     = lp(() => import('./pages/dashboard/AutomationPage'));
const TeamPage           = lp(() => import('./pages/dashboard/TeamPage'));
const RegistrationsPage  = lp(() => import('./pages/dashboard/RegistrationsPage'));
// Enhanced pages
const SelfServicePage    = lp(() => import('./pages/dashboard/SelfServicePage'));
const ChatPage           = lp(() => import('./pages/dashboard/ChatPage'));
const IntelligencePage   = lp(() => import('./pages/dashboard/IntelligencePage'));
// Profile sub-pages
const ProfileLayout              = lp(() => import('./pages/dashboard/profile/ProfileLayout'));
const ProfileOverviewPage        = lp(() => import('./pages/dashboard/profile/ProfileOverviewPage'));
const ProfileActivityPage        = lp(() => import('./pages/dashboard/profile/ProfileActivityPage'));
const ProfileContributionsPage   = lp(() => import('./pages/dashboard/profile/ProfileContributionsPage'));
const ProfileAchievementsPage    = lp(() => import('./pages/dashboard/profile/ProfileAchievementsPage'));
const ProfileSecurityPage        = lp(() => import('./pages/dashboard/profile/ProfileSecurityPage'));

const Loader = () => (
  <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#080C14',flexDirection:'column',gap:16 }}>
    <div style={{ width:40,height:40,border:'2px solid #1E2D4A',borderTop:'2px solid #C9A84C',borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
    <p style={{ color:'#C9A84C',fontSize:14,fontFamily:'Cinzel, serif',letterSpacing:'0.08em' }}>INHERITANCE CHOIR</p>
  </div>
);
const S = ({children}) => <Suspense fallback={<Loader />}>{children}</Suspense>;

function Protected({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <Loader />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/register"         element={<RegisterPage />} />
      <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
      <Route path="/"                 element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Protected><DashboardLayout /></Protected>}>
        <Route index                  element={<S><DashboardPage /></S>} />
        <Route path="members"         element={<S><MembersPage /></S>} />
        <Route path="members/:id"     element={<S><MemberProfilePage /></S>} />
        <Route path="attendance"      element={<S><AttendancePage /></S>} />
        <Route path="events"          element={<S><EventsPage /></S>} />
        <Route path="contributions"   element={<S><ContributionsPage /></S>} />
        <Route path="messages"        element={<S><MessagesPage /></S>} />
        <Route path="analytics"       element={<S><AnalyticsPage /></S>} />
        <Route path="reports"         element={<S><ReportsPage /></S>} />
        <Route path="admin"           element={<S><AdminPage /></S>} />
        <Route path="settings"        element={<S><SettingsPage /></S>} />
        <Route path="profile"         element={<S><ProfilePage /></S>} />
        <Route path="welfare"         element={<S><WelfarePage /></S>} />
        <Route path="songs"           element={<S><SongsPage /></S>} />
        <Route path="posts"           element={<S><PostsPage /></S>} />
        <Route path="prayer"          element={<S><PrayerPage /></S>} />
        <Route path="automation"      element={<S><AutomationPage /></S>} />
        <Route path="team"            element={<S><TeamPage /></S>} />
        <Route path="registrations"   element={<S><RegistrationsPage /></S>} />
        {/* ── Enhanced routes (Tasks 1–3) ── */}
        <Route path="my-account"      element={<S><SelfServicePage /></S>} />
        {/* ── My Profile sub-pages ── */}
        <Route path="my-profile" element={<S><ProfileLayout /></S>}>
          <Route index                  element={<S><ProfileOverviewPage /></S>} />
          <Route path="activity"        element={<S><ProfileActivityPage /></S>} />
          <Route path="contributions"   element={<S><ProfileContributionsPage /></S>} />
          <Route path="achievements"    element={<S><ProfileAchievementsPage /></S>} />
          <Route path="security"        element={<S><ProfileSecurityPage /></S>} />
        </Route>
        <Route path="chat"            element={<S><ChatPage /></S>} />
        <Route path="intelligence"    element={<S><IntelligencePage /></S>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PermissionsProvider>
          <ToastProvider>
            <SidebarProvider>
              <RealtimeProvider>
                <NotificationsProvider>
                  <PWAProvider>
                    <OnboardingGate>
                      <AppRoutes />
                    </OnboardingGate>
                  </PWAProvider>
                </NotificationsProvider>
              </RealtimeProvider>
            </SidebarProvider>
          </ToastProvider>
        </PermissionsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
