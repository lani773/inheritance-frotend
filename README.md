# ♪ INHERITANCE CHOIR — Management System
> **Complete React.js Choir Management Application — All 10 Tasks Integrated**
> localStorage-first · API-bridge ready · 50 source files

---

## Quick Start

```bash
npm install
npm start
# http://localhost:3000
# Email: inheritancechoir@gmail.com  Password: Umurage123.
```

---

## Project Structure

```
src/
├── App.jsx                  ← Root — ALL 20 routes
├── config/
│   ├── constants.js         ← ROLES, VOICE_PARTS, EVENT_TYPES, DEFAULT_ADMIN
│   ├── routes.js            ← All route path constants
│   └── api.config.js        ← Backend URL + endpoint map (swap to connect real API)
├── context/
│   ├── AuthContext.jsx      ← Session state, login, logout, isAdmin
│   ├── ToastContext.jsx     ← Global toasts: success/error/info/warning
│   └── SidebarContext.jsx   ← Sidebar open/close/mobile state
├── hooks/index.js           ← useDebounce, useLocalStorage, useToggle, etc.
├── storage/
│   ├── engine.js            ← localStorage: get/set/addToList/updateInList
│   └── seed.js              ← Demo data: 10 members, 10 events, 12 months contributions
├── services/index.js        ← ALL data operations — SWAP METHODS HERE for real API
├── utils/
│   ├── index.js             ← formatDate, formatCurrency, getInitials, downloadBlob...
│   └── analytics.js         ← Chart data builders (contribution/attendance trends)
├── styles/
│   ├── tokens.css           ← 50+ CSS variables (colors, fonts, spacing)
│   ├── globals.css          ← Reset, scrollbar, utility classes, breakpoints
│   └── animations.css       ← fadeUp, shake, pulse, scaleIn, slideInRight...
├── components/
│   ├── shared/              ← Button, Input, Modal, Card, Avatar, Badge, Tabs...
│   ├── layout/              ← DashboardLayout: sidebar, topbar, command palette
│   ├── charts/              ← Recharts wrappers (8 chart types + ChartCard)
│   ├── members/             ← MemberModal, MemberQR
│   ├── events/              ← EventModal
│   └── contributions/       ← ContributionModal, ReceiptViewer, BudgetTracker
└── pages/
    ├── auth/                ← LoginPage, RegisterPage, ForgotPasswordPage
    └── dashboard/           ← All 19 dashboard pages (see table below)
```

---

## Connect to Real Backend

All data operations are in **one file**: `src/services/index.js`

```javascript
// CURRENT — localStorage (zero backend needed):
const membersService = {
  getAll: () => Storage.getList(KEYS.MEMBERS),
  create: (data) => Storage.addToList(KEYS.MEMBERS, { ...data, id: generateId() }),
};

// FUTURE — REST API (swap these methods):
const membersService = {
  getAll:  async ()      => fetch(`${API_BASE}/members`).then(r => r.json()),
  create:  async (data)  => fetch(`${API_BASE}/members`, { method:'POST', body:JSON.stringify(data) }).then(r=>r.json()),
  update:  async (id,d)  => fetch(`${API_BASE}/members/${id}`, { method:'PATCH', body:JSON.stringify(d) }).then(r=>r.json()),
  delete:  async (id)    => fetch(`${API_BASE}/members/${id}`, { method:'DELETE' }),
};
```

Set your backend URL with environment variables:
```js
REACT_APP_API_URL=https://inheritance-backend--irumvafils3.replit.app/api/v1
REACT_APP_WS_URL=wss://inheritance-backend--irumvafils3.replit.app/ws
REACT_APP_USE_LOCAL_STORAGE=false
REACT_APP_API_FALLBACK_TO_LOCAL=true
```

The backend must allow CORS from the deployed Netlify frontend, accept
`Content-Type` and `Authorization` headers, and expose REST routes under
`/api/v1` plus realtime WebSocket traffic under `/ws`.

---

## REST API Endpoints — Full Specification

### Authentication `/api/auth`

| Method | Endpoint | Body | Response | Description |
|--------|----------|------|----------|-------------|
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` | Login, returns JWT |
| POST | `/api/auth/logout` | — | `{ ok }` | Invalidate session |
| POST | `/api/auth/register` | `{ fullName, email, password, voicePart, ... }` | `{ ok, message }` | Submit registration (status=pending) |
| POST | `/api/auth/verify-otp` | `{ email, code }` | `{ verified }` | Verify email OTP |
| POST | `/api/auth/resend-otp` | `{ email }` | `{ ok }` | Resend OTP (3/hr limit) |
| POST | `/api/auth/forgot-password` | `{ email }` | `{ ok }` | Send reset OTP |
| POST | `/api/auth/reset-password` | `{ email, otp, newPassword }` | `{ ok }` | Reset with OTP |
| GET | `/api/auth/me` | Header: Bearer token | `{ user }` | Current user profile |
| POST | `/api/auth/refresh` | `{ refreshToken }` | `{ token }` | Refresh JWT |

### Members `/api/members`

| Method | Endpoint | Params / Body | Response | Description |
|--------|----------|---------------|----------|-------------|
| GET | `/api/members` | `?status=active&voicePart=Soprano&page=1&limit=20` | `{ members[], total }` | List (filterable, paginated) |
| POST | `/api/members` | `{ fullName, email, voicePart, role, password, ... }` | `{ member }` | Create member |
| GET | `/api/members/:id` | — | `{ member }` | Get single member |
| PATCH | `/api/members/:id` | `{ fullName?, role?, status?, phone?, ... }` | `{ member }` | Update member |
| DELETE | `/api/members/:id` | — | `{ ok }` | Delete member (admin) |
| GET | `/api/members/:id/qr` | — | `{ qrData, token }` | Generate QR for attendance |
| GET | `/api/members/:id/stats` | — | `{ attendanceRate, contributionTotal, eventsAttended }` | Member stats |
| POST | `/api/members/import` | `FormData: file.csv` | `{ imported, skipped, errors[] }` | CSV bulk import |
| GET | `/api/members/export` | `?format=xlsx` | File | Export to Excel/PDF |
| GET | `/api/members/pending` | — | `{ members[] }` | Pending registrations |
| POST | `/api/members/:id/approve` | `{ note? }` | `{ member }` | Approve registration |
| POST | `/api/members/:id/reject` | `{ reason }` | `{ ok }` | Reject registration |

### Events `/api/events`

| Method | Endpoint | Params / Body | Response | Description |
|--------|----------|---------------|----------|-------------|
| GET | `/api/events` | `?type=rehearsal&upcoming=true&page=1` | `{ events[], total }` | List events |
| POST | `/api/events` | `{ title, type, date, time, endTime, location, mandatory, targetVoices[], recurrence }` | `{ event }` | Create event |
| GET | `/api/events/:id` | — | `{ event }` | Get event |
| PATCH | `/api/events/:id` | `{ title?, date?, location?, mandatory?, ... }` | `{ event }` | Update event |
| DELETE | `/api/events/:id` | — | `{ ok }` | Cancel event |
| GET | `/api/events/upcoming` | `?limit=10` | `{ events[] }` | Next N events |
| POST | `/api/events/:id/reminder` | `{ message? }` | `{ sent }` | Send reminder to members |
| POST | `/api/events/:id/rsvp` | `{ status: confirmed|declined|maybe }` | `{ rsvp }` | Member RSVP |
| GET | `/api/events/:id/rsvps` | — | `{ rsvps[] }` | All RSVPs for event |

### Attendance `/api/attendance`

| Method | Endpoint | Params / Body | Response | Description |
|--------|----------|---------------|----------|-------------|
| GET | `/api/attendance` | `?eventId=1&memberId=2` | `{ records[] }` | List records |
| POST | `/api/attendance` | `{ eventId, records:[{memberId,status}] }` | `{ saved }` | Bulk save attendance |
| GET | `/api/attendance/event/:eventId` | — | `{ records[] }` | All for one event |
| GET | `/api/attendance/member/:memberId` | `?limit=30` | `{ records[] }` | All for one member |
| GET | `/api/attendance/stats` | `?months=12` | `{ overall, byVoice, byMember }` | Attendance analytics |
| GET | `/api/attendance/export` | `?format=xlsx` | File | Export attendance |
| POST | `/api/attendance/qr-checkin` | `{ qrToken, eventId }` | `{ member, status }` | QR scan check-in |
| POST | `/api/excuses` | `{ eventId, reason }` | `{ excuse }` | Submit excuse |
| GET | `/api/excuses` | `?status=pending` | `{ excuses[] }` | List excuses |
| PATCH | `/api/excuses/:id` | `{ status:approved|rejected, note? }` | `{ excuse }` | Review excuse |

### Contributions `/api/contributions`

| Method | Endpoint | Params / Body | Response | Description |
|--------|----------|---------------|----------|-------------|
| GET | `/api/contributions` | `?memberId=1&type=tithe&month=2026-03&verified=true&page=1` | `{ contributions[], total }` | List (filterable) |
| POST | `/api/contributions` | `{ memberId, type, amount, currency, date, method, reference, notes }` | `{ contribution }` | Record contribution |
| GET | `/api/contributions/:id` | — | `{ contribution }` | Get single |
| PATCH | `/api/contributions/:id` | `{ amount?, verified?, notes? }` | `{ contribution }` | Update |
| DELETE | `/api/contributions/:id` | — | `{ ok }` | Delete (admin) |
| POST | `/api/contributions/:id/verify` | — | `{ contribution }` | Verify contribution |
| GET | `/api/contributions/:id/receipt` | — | PDF file | Download receipt |
| GET | `/api/contributions/stats` | `?months=12` | `{ total, byType, byMonth, growth }` | Financial stats |
| GET | `/api/contributions/export` | `?format=xlsx&year=2026` | File | Excel multi-sheet export |
| GET | `/api/contributions/statement/:memberId` | `?year=2026` | PDF file | Annual statement |
| GET | `/api/budget-goals` | `?year=2026` | `{ goals }` | Get budget goals |
| POST | `/api/budget-goals` | `{ year, goals:{tithe:N, offering:N, ...} }` | `{ goals }` | Set budget goals |

### Messages `/api/messages`

| Method | Endpoint | Params / Body | Response | Description |
|--------|----------|---------------|----------|-------------|
| GET | `/api/messages` | `?inbox=true&sent=true` | `{ messages[] }` | List messages |
| POST | `/api/messages` | `{ recipientId?, isBroadcast, toVoicePart?, subject, body }` | `{ message }` | Send message |
| GET | `/api/messages/:id` | — | `{ message }` | Get message |
| DELETE | `/api/messages/:id` | — | `{ ok }` | Delete message |
| POST | `/api/messages/:id/read` | — | `{ ok }` | Mark as read |
| POST | `/api/messages/read-all` | — | `{ updated }` | Mark all inbox read |

### Posts `/api/posts`

| Method | Endpoint | Params / Body | Response | Description |
|--------|----------|---------------|----------|-------------|
| GET | `/api/posts` | `?type=announcement&pinned=true` | `{ posts[] }` | List posts |
| POST | `/api/posts` | `{ type, title, body, pinned, expiresAt, tags[] }` | `{ post }` | Create post |
| GET | `/api/posts/:id` | — | `{ post }` | Get post (increments view) |
| PATCH | `/api/posts/:id` | `{ title?, body?, pinned?, tags? }` | `{ post }` | Update post |
| DELETE | `/api/posts/:id` | — | `{ ok }` | Delete post |
| POST | `/api/posts/:id/pin` | `{ pinned:bool }` | `{ post }` | Pin/unpin |

### Welfare `/api/welfare`

| Method | Endpoint | Params / Body | Response | Description |
|--------|----------|---------------|----------|-------------|
| GET | `/api/welfare` | `?status=open&priority=urgent` | `{ cases[] }` | List cases |
| POST | `/api/welfare` | `{ memberId, type, title, description, priority, amountNeeded }` | `{ case }` | Open case |
| GET | `/api/welfare/:id` | — | `{ case }` | Get case |
| PATCH | `/api/welfare/:id` | `{ status?, amountRaised?, priority? }` | `{ case }` | Update case |
| DELETE | `/api/welfare/:id` | — | `{ ok }` | Close case |
| POST | `/api/welfare/:id/timeline` | `{ action, note }` | `{ case }` | Add timeline entry |

### Songs `/api/songs`

| Method | Endpoint | Params / Body | Response | Description |
|--------|----------|---------------|----------|-------------|
| GET | `/api/songs` | `?genre=hymn&difficulty=beginner&status=active` | `{ songs[] }` | List songs |
| POST | `/api/songs` | `{ title, composer, genre, difficulty, key, lyrics, voiceParts[], ... }` | `{ song }` | Create song |
| GET | `/api/songs/:id` | — | `{ song }` | Get song |
| PATCH | `/api/songs/:id` | `{ title?, lyrics?, status?, notes?, ... }` | `{ song }` | Update |
| DELETE | `/api/songs/:id` | — | `{ ok }` | Delete |
| POST | `/api/songs/:id/audio` | `FormData: file(MP3/WAV), voicePart` | `{ url }` | Upload audio |
| POST | `/api/songs/:id/sheet-music` | `FormData: file(PDF)` | `{ url }` | Upload sheet music |
| POST | `/api/songs/:id/video` | `{ youtubeUrl? }` or `FormData: file` | `{ url }` | Link/upload video |
| GET | `/api/setlists` | `?eventId=1` | `{ setlists[] }` | List setlists |
| POST | `/api/setlists` | `{ name, eventId?, songs:[id,...] }` | `{ setlist }` | Create setlist |
| PATCH | `/api/setlists/:id` | `{ name?, songs? }` | `{ setlist }` | Update setlist |
| DELETE | `/api/setlists/:id` | — | `{ ok }` | Delete setlist |

### Prayer `/api/prayer`

| Method | Endpoint | Params / Body | Response | Description |
|--------|----------|---------------|----------|-------------|
| GET | `/api/prayer` | `?status=active` | `{ prayers[] }` | List requests |
| POST | `/api/prayer` | `{ request, isPrivate:bool }` | `{ prayer }` | Submit request |
| DELETE | `/api/prayer/:id` | — | `{ ok }` | Remove own request |
| POST | `/api/prayer/:id/pray` | — | `{ count }` | Toggle "I'm praying" |
| PATCH | `/api/prayer/:id/answer` | `{ testimony? }` | `{ prayer }` | Mark as answered |

### Reports `/api/reports`

| Method | Endpoint | Params | Response | Description |
|--------|----------|--------|----------|-------------|
| GET | `/api/reports/attendance` | `?months=12&format=json` | Stats or file | Attendance data |
| GET | `/api/reports/contributions` | `?year=2026&format=xlsx` | Stats or file | Financial data |
| GET | `/api/reports/members` | `?format=json` | Stats or file | Member data |
| GET | `/api/reports/dashboard` | — | `{ kpis }` | All dashboard KPIs |
| GET | `/api/reports/monthly/:memberId` | `?month=2026-03` | PDF | Monthly member report |

### Automation `/api/automation`

| Method | Endpoint | Body | Response | Description |
|--------|----------|------|----------|-------------|
| GET | `/api/automation/rules` | — | `{ rules[] }` | List rules |
| POST | `/api/automation/rules` | `{ name, category, trigger, condition, action, actionLabel, active }` | `{ rule }` | Create rule |
| PATCH | `/api/automation/rules/:id` | `{ active?, name?, ... }` | `{ rule }` | Update/toggle |
| DELETE | `/api/automation/rules/:id` | — | `{ ok }` | Delete rule |
| POST | `/api/automation/rules/:id/run` | — | `{ log }` | Manual trigger |
| GET | `/api/automation/logs` | `?limit=100` | `{ logs[] }` | Execution history |

### Settings & Admin

| Method | Endpoint | Body | Response | Description |
|--------|----------|------|----------|-------------|
| GET | `/api/settings` | — | `{ settings }` | Get all settings |
| PATCH | `/api/settings` | `{ choirName?, currency?, ... }` | `{ settings }` | Update settings |
| GET | `/api/backup` | — | JSON file | Full backup download |
| POST | `/api/restore` | `FormData: file.json` | `{ ok }` | Restore backup |
| GET | `/api/audit` | `?action=member.created&limit=50` | `{ logs[] }` | Audit log |
| GET | `/api/audit/export` | `?format=xlsx` | File | Export audit log |
| PATCH | `/api/members/:id/role` | `{ role }` | `{ member }` | Change member role |

---

## Database Schema (PostgreSQL — Recommended)

```sql
-- Key tables (abbreviated):
members, events, attendance, excuse_requests,
contributions, budget_goals, messages, message_reads,
posts, welfare_cases, welfare_timeline, songs, song_audio,
setlists, setlist_songs, prayer_requests, prayer_supporters,
automation_rules, automation_logs, audit_log, settings
```

See full DDL in the backend development documentation.

---

## Design Tokens

```css
/* Backgrounds */    --bg-base:#080C14  --bg-card:#141E33  --bg-raised:#1A2540
/* Gold Accent */    --gold:#C9A84C     --gold-bright:#E8C96A  --gold-deep:#A07820
/* Status */         --color-success:#22C55E  --color-error:#EF4444  --color-warning:#F59E0B
/* Typography */     --font-heading:'Cinzel'  --font-body:'Crimson Pro'  --font-mono:'DM Mono'
```

---

## All Modules (10 Tasks)

| Task | Modules |
|------|---------|
| 1 | Setup, Design System, Shared Components, Seed Data |
| 2 | Login, Register (4-step), Forgot Password (3-step) |
| 3 | Dashboard KPIs, Analytics (8 charts), Sparklines |
| 4 | Member Directory, Member Profile, Registrations |
| 5 | Events + Calendar, Attendance + Excuses + QR |
| 6 | Contributions, PDF Receipts, Budget, Welfare Fund |
| 7 | Messages, Posts/Announcements, Welfare Cases, Prayer Board |
| 8 | Songs Library, Audio Player, Rehearsal Mode, Setlists |
| 9 | My Profile, Admin Panel, Settings, Reports |
| 10 | Automation (IF→THEN), Team & Roles, Permission Matrix |

---

*Reset demo data: `localStorage.clear(); location.reload()`*

*INHERITANCE CHOIR — Built with excellence · Served with grace ♪*
