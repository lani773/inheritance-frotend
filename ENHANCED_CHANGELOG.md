# INHERITANCE CHOIR — Enhanced v2 Changelog

## Design System: Holographic Glassmorphism

All enhanced pages share a unified design language:
- `backdrop-filter: blur(20–24px)` glass panels
- Animated iridescent top rim gradients (gold → purple → cyan)
- Inject-once CSS keyframes (no external stylesheet needed)
- Custom SVG charts (no Recharts dependency for new charts)
- Neon glow effects via `drop-shadow` and `box-shadow`

---

## Enhanced Pages

### src/pages/auth/LoginPage.jsx
- Holographic glass form card with animated iridescent rim
- Animated sine waveform background + floating music notes
- Typewriter cycling tagline (4 phrases)
- Real-time email format validation with green ✓ tick
- 5-segment neon password strength meter
- Custom neon-glow focus input fields
- Ripple click effect on Sign In button
- Animated success state before redirect
- SVG countdown ring for rate-limit lockout
- Animated stats counters (count up from 0)

### src/pages/auth/RegisterPage.jsx
- Holographic glass card with animated iridescent rim
- 4-step wizard with glowing step rail + pulse ring on active step
- Animated background: mesh orbs + floating notes + sine wave
- Voice part cards: animated sound-wave bars + neon glow ring
- Live age calculator from DOB
- 5-bar neon password strength + rule checklist
- Live confirm-password match indicator
- OTP boxes: neon glow, shake on error, ring countdown timer
- Progress dots per OTP digit
- Confetti burst on success (pure CSS)
- Animated approval timeline with pulsing dot

### src/pages/dashboard/DashboardPage.jsx
- Hero section: time-aware greeting + animated waveform background
- Finance Health Score circular gauge (animated arc)
- 5 glass KPI cards with count-up animation + sparklines
- Quick-action shortcut rail (6 buttons)
- Custom SVG HoloAreaChart (contributions + member growth)
- Neon smooth-curve line chart (attendance by section)
- Radial voice donut with hover expand
- Neon leaderboard for top contributors
- Upcoming events with urgency countdown + color shifts
- At-risk member alert panel with pulsing red borders
- Live activity feed with neon timeline nodes

### src/pages/dashboard/AnalyticsPage.jsx
- 4 tabs: Financial / Attendance / Members / Insights
- Holographic area chart (gold gradient fills, iridescent lines)
- Neon smooth attendance line chart
- 52-week contribution activity heatmap (GitHub-style)
- 3-month revenue forecast (linear regression + projection)
- Voice section radar chart (SVG spider/web)
- Member retention funnel (trapezoid stages)
- Smart alerts panel (auto-generated, dismissible)
- Payment method breakdown
- Contribution streak leaderboard
- Section gauge rings (animated on mount)
- Insights tab with 6 computed metric cards

### src/pages/dashboard/AttendancePage.jsx
- Mark tab: live SVG donut summary ring
- Mark tab: search + voice-part filter pills + section progress bars
- Mark tab: animated ripple status toggle buttons
- QR tab: animated neon scanner frame + sweeping scan line
- QR tab: live check-in feed (log with timestamp + slide-in animation)
- Stats tab: animated gauge rings per section
- Stats tab: attendance streak leaderboard with flame icons
- Stats tab: at-risk alert cards with pulse animation
- Excuse tab: glass cards with inline approve/reject

### src/pages/dashboard/MembersPage.jsx
- Grid / Table view toggle with smooth transitions
- Member cards: attendance arc ring, voice color glow, sound-wave bars
- KPI glass cards with sparkline bars + hover glow
- Voice distribution proportional bar
- Neon pill filter buttons + collapsible advanced filters
- Table: left voice-color accent border, glass rows
- Bulk action bar with glass morphism
- Numbered pagination pills with neon active state
- CSV import: glass dropzone with drag-highlight animation
- Glass morphism confirm dialogs

### src/pages/dashboard/EventsPage.jsx
- 4 views: Cards / Calendar / Timeline / Week
- Card view: SVG countdown rings, LIVE TODAY pulse badge, attendance arc
- Calendar: hover tooltip previews, iridescent today circle
- Timeline: vertical neon line, type-colored node circles
- Week: 7-column day strip with colored event blocks
- Urgent 7-day strip at top
- Search bar across all views
- Type KPI filter chips

### src/pages/dashboard/ContributionsPage.jsx
- 5 tabs including new Analytics tab
- Finance Health Score gauge panel
- KPI cards with sparklines + trend indicators
- Analytics tab: 12-mo trend, type donut, top givers, MoM table
- Bulk select with bulk verify + bulk delete
- Advanced filter panel (method filter + clear-all)
- Click receipt number to copy
- Payment method icon inline

### src/pages/dashboard/MessagesPage.jsx
- Chat-style bubbles (sent right / received left)
- Broadcast announcement cards with rich formatting
- Emoji quick-react panel (hover to reveal, 8 emojis)
- Read receipt display (✓ / ✓✓ style)
- Typing indicator (3 bouncing dots)
- Date group dividers (Today / Yesterday / date)
- Compose drawer (slides up from bottom)
- Right panel: sender profile card + recent messages
- Animated unread badge + glow dot in sidebar

