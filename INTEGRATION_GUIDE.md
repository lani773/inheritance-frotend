# INHERITANCE CHOIR — Enhancement Integration Guide
## Tasks 1–3 Complete · 78 files · 31,683 lines

---

## Quick Start

```bash
cd inheritance-choir-enhanced
npm install
npm start   # → http://localhost:3000
```

**Login:** `inheritancechoir@gmail.com` / `Umurage123.`

---

## New Routes

| Route | Component | Description |
|---|---|---|
| `/dashboard/chat` | `ChatPage` | Live choir chat (8 channels) |
| `/dashboard/my-account` | `SelfServicePage` | Member self-service portal |
| `/dashboard/intelligence` | `IntelligencePage` | AI forecasting + reports + leaderboard |

---

## Provider Stack

All providers are in `src/App.jsx`. The wrapping order matters:

```jsx
<AuthProvider>              // Session + login/logout
  <PermissionsProvider>     // RBAC — must be inside AuthProvider
    <ToastProvider>         // Legacy toasts
      <SidebarProvider>     // Sidebar collapse state
        <RealtimeProvider>  // WebSocket + polling fallback
          <NotificationsProvider>  // Persistent + push notifications
            <PWAProvider>   // Install prompt + offline detection
              <Routes />
            </PWAProvider>
          </NotificationsProvider>
        </RealtimeProvider>
      </SidebarProvider>
    </ToastProvider>
  </PermissionsProvider>
</AuthProvider>
```

---

## Task 1 — RBAC & Real-Time

### Permission checks

```jsx
import { usePermissions, Gate } from '../context/PermissionsContext';

// Hook
const { can, canAny, hasRole, isAdmin } = usePermissions();
if (can('members:create')) { ... }

// Component gate
<Gate permission="contributions:verify">
  <VerifyButton />
</Gate>

// Fallback
<Gate permission="admin:*" fallback={<span>No access</span>}>
  <AdminPanel />
</Gate>
```

### Role badge + permission button

```jsx
import { RoleBadge, PermissionButton, RoleIndicator } from '../components/rbac/PermissionGuard';

<RoleBadge role="treasurer" size="md" />
<PermissionButton permission="contributions:verify" onClick={verify}>
  Verify
</PermissionButton>
```

### Real-time WebSocket

```jsx
import { useRealtime, useRealtimeEvent, WS_EVENTS } from '../context/RealtimeContext';

const { connected, isOnline, send } = useRealtime();

// Subscribe to events
useRealtimeEvent(WS_EVENTS.ATTENDANCE_MARKED, (data) => {
  console.log('New attendance:', data);
}, []);

// Send to server
send('chat:message', { channel: 'general', text: 'Hello!' });
```

### Notifications

```jsx
import { useNotifications } from '../context/NotificationsContext';

const { toast, addNotification, unreadCount } = useNotifications();

toast('Attendance saved!', { type: 'success' });
addNotification({ type: 'info', title: 'New event', message: 'Rehearsal Friday' });
```

### PWA

```jsx
import { usePWA, InstallButton } from '../components/pwa/PWAManager';

const { canInstall, isOffline, triggerInstall } = usePWA();

<InstallButton />
```

---

## Task 2 — Chat, Search, QR, Sessions

### Global search (⌘K)

```jsx
import { GlobalSearch, useGlobalSearch, SearchButton } from '../components/search/GlobalSearch';

const { open, setOpen } = useGlobalSearch(); // ⌘K already wired

{open && <GlobalSearch onClose={() => setOpen(false)} />}
```

### Live chat

```jsx
import LiveChat from '../components/chat/LiveChat';

<LiveChat defaultChannel="general" />
```

### QR Scanner

```jsx
import QRScanner from '../components/qr-scanner/QRScanner';

<QRScanner
  eventId={event.id}
  eventTitle={event.title}
  onCheckIn={({ member, timestamp }) => markAttendance(member.id)}
/>
```

### Session management

```jsx
import { SessionsPanel, MFASetup, SessionWarning } from '../components/session/SessionManager';

// Warning banner (auto-shows 5 min before expiry — already in DashboardLayout)
<SessionWarning />

// Sessions panel
<SessionsPanel />

// 2FA setup
<MFASetup />
```

### File upload

```jsx
import FileUpload, { AvatarUploader } from '../components/upload/FileUpload';

// General upload
<FileUpload accept="image" multiple onUploadDone={(file) => console.log(file)} />

// Avatar picker
<AvatarUploader currentUrl={member.avatarUrl} onUpload={setAvatar} />
```

---

## Task 3 — Intelligence & Financial

### Predictive analytics

```jsx
import PredictiveAnalytics from '../components/intelligence/PredictiveAnalytics';

<PredictiveAnalytics />
// Shows: health score gauge, contribution forecast, attendance forecast,
//        anomaly detection, risk assessment
```

### Leaderboard

```jsx
import MemberLeaderboard from '../components/leaderboard/MemberLeaderboard';

<MemberLeaderboard />
// Shows: podium top 3, full ranked list, voice-part view
// Metrics: overall / attendance / contributions / streak
```

### Report builder

```jsx
import CustomReportBuilder from '../components/reports/CustomReportBuilder';

<CustomReportBuilder />
// Data sources: members / contributions / attendance / events
// Export: CSV download + Print-to-PDF
```

### Pledge campaigns

```jsx
import { PledgeCampaign, ReceiptGenerator } from '../components/financial-v2/PledgeCampaign';

<PledgeCampaign memberId={session.id} />
<ReceiptGenerator contribution={contribRecord} member={memberRecord} />
```

### Budget planner + Mobile Money

```jsx
import { BudgetPlanner, MobileMoneyButton } from '../components/financial/BudgetPlanner';

<BudgetPlanner />
<MobileMoneyButton
  amount={10000}
  description="Monthly Tithe"
  onSuccess={({ txRef, provider }) => recordPayment(txRef)}
/>
```

### Events v2 (setlist + volunteers + livestream)

```jsx
import { EventEnhancedView } from '../components/events-v2/EventEnhancedView';
import { SetlistBuilder }    from '../components/events-v2/SetlistBuilder';
import { VolunteerSignup }   from '../components/events-v2/VolunteerSignup';

// Full event view
<EventEnhancedView event={event} isAdmin={isAdmin} />

// Individual components
<SetlistBuilder eventTitle="Christmas Concert" onSave={saveSetlist} />
<VolunteerSignup eventId={event.id} eventTitle={event.title} />
```

---

## Convenience Hooks

```jsx
import {
  useFeatureFlags,
  useOfflineData,
  useLiveUnreadCounts,
  useMemberScore,
  useQuickActions,
  useToastShortcuts,
} from '../hooks/useEnhancedFeatures';

// Feature gates
const { canViewAnalytics, hasQRScanner, isOffline } = useFeatureFlags();

// Offline-safe data fetching with local cache
const { data, loading, isStale } = useOfflineData(
  'members_list',
  () => membersService.getAll(),
);

// Live unread counts across notification + messages + chat
const { notifications, messages, chat, total } = useLiveUnreadCounts();

// Member performance score
const { overall, grade, attendance, contributions } = useMemberScore(member);

// Toast shortcuts
const { success, error, warning } = useToastShortcuts();
success('Saved!');
```

---

## New CSS Keyframes (`src/styles/animations.css`)

All components use these keyframes — they are already loaded globally:

| Name | Usage |
|---|---|
| `bellShake` | Notification bell on new notification |
| `pulse-green` | Online presence indicator |
| `slideDown` | Toast / notification panel appear |
| `slideUp` | Update banner from bottom |
| `scaleIn` | Dropdowns, emoji picker |
| `staggerReveal` | `.stagger > *` cascade reveal |
| `glowPulse` | Active gold elements |
| `spin` | Loading spinners |
| `fadeIn` | Overlays, modals |

---

## File Structure (Tasks 1–3 additions only)

```
src/
├── context/
│   ├── PermissionsContext.jsx    ← RBAC (7 roles, wildcard permissions)
│   ├── RealtimeContext.jsx       ← WebSocket + polling fallback
│   └── NotificationsContext.jsx  ← In-app + push + sound
│
├── components/
│   ├── rbac/
│   │   └── PermissionGuard.jsx   ← Gate, RoleBadge, PermissionButton
│   ├── realtime/
│   │   ├── LivePresence.jsx      ← OnlineDot, LiveAttendanceBoard
│   │   └── NotificationCenter.jsx← Bell, Panel, Preferences
│   ├── pwa/
│   │   └── PWAManager.jsx        ← Install, Offline banner, Update banner
│   ├── chat/
│   │   └── LiveChat.jsx          ← 8 channels, voice notes, reactions
│   ├── search/
│   │   └── GlobalSearch.jsx      ← ⌘K spotlight, type filters
│   ├── qr-scanner/
│   │   └── QRScanner.jsx         ← Camera + manual + log
│   ├── session/
│   │   └── SessionManager.jsx    ← Devices, 2FA, security log
│   ├── upload/
│   │   └── FileUpload.jsx        ← Drag-drop, progress, avatar
│   ├── financial/
│   │   └── BudgetPlanner.jsx     ← Budget + expenses + Mobile Money
│   ├── financial-v2/
│   │   └── PledgeCampaign.jsx    ← Campaigns + ReceiptGenerator
│   ├── communication/
│   │   └── BroadcastScheduler.jsx← Templates + schedule + channels
│   ├── events-v2/
│   │   ├── SetlistBuilder.jsx    ← Drag-drop song ordering
│   │   ├── VolunteerSignup.jsx   ← 8 roles, slot tracking
│   │   └── EventEnhancedView.jsx ← Countdown + tabs + livestream
│   ├── analytics/
│   │   └── AdvancedAnalytics.jsx ← Drill-down + date range + radar
│   ├── intelligence/
│   │   └── PredictiveAnalytics.jsx← Linear regression + health score
│   ├── leaderboard/
│   │   └── MemberLeaderboard.jsx ← Podium + badges + VP view
│   ├── reports/
│   │   └── CustomReportBuilder.jsx← 4 sources + filters + export
│   └── layout/
│       └── EnhancedDashboardLayout.jsx ← Full upgraded layout
│
├── pages/dashboard/
│   ├── SelfServicePage.jsx       ← Profile, attendance, contribs, leave
│   ├── ChatPage.jsx              ← Full chat page wrapper
│   └── IntelligencePage.jsx      ← AI + leaderboard + reports + pledges
│
├── hooks/
│   └── useEnhancedFeatures.js    ← Convenience hooks for all features
│
└── public/
    └── service-worker.js         ← Offline cache + push notifications
```

---

## Backend Connection

All components work with mock/localStorage data by default.
To connect to the Go Gin backend (Task 4):

1. Set `REACT_APP_API_URL=http://localhost:8080/api/v1` in `.env`
2. Replace mock data in `src/services/index.js` with real API calls
3. Set `REACT_APP_WS_URL=ws://localhost:8080/ws` for real-time features
4. The `useOfflineData` hook handles caching automatically

---

*INHERITANCE CHOIR · Voices united in worship and excellence · Kigali, Rwanda*
