# ICUNI Labs — labs.icuni.org

The public face, admin console, and operational backend for ICUNI Labs — the software engineering arm of ICUNI Group.

## Architecture

This is a hybrid application serving multiple surfaces from a single Vite + React 19 SPA:

| Surface | Route | Description |
|---------|-------|-------------|
| **Marketing Site** | `/` (root) | Homepage with persona-driven conversion flow |
| **Portfolio** | `#portfolio`, `#project/:id` | Project gallery with detailed case studies |
| **Demos** | `#demos`, `#demo/:id` | Interactive system demonstrations |
| **Jobs** | `#jobs`, `#job/:id`, `#apply/:id` | Career listings with rich preview editor |
| **Contact** | `#contact` | Multi-step lead capture form |
| **Personas** | `#founders`, `#operations`, etc. | Targeted landing pages per buyer persona |
| **Client Portal** | `#portal` | Client-facing project status + invoices |
| **Referral Portal** | `#referral` | Partner referral tracking + payouts |
| **Admin Console** | `#_ops` | Internal CRM, mail hub, invoices, team management |

All non-homepage routes are **lazy-loaded** via `React.lazy()` + `Suspense` to keep the public bundle small (~152 KB gzipped).

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 7, Zustand (state), Framer Motion (animation)
- **Styling:** Tailwind CSS + custom CSS modules (admin themes)
- **Backend:** Google Apps Script (REST API via `doPost`/`doGet`)
- **Database:** Google Sheets (structured multi-sheet schema)
- **Storage:** Google Drive (file attachments, images)
- **Deployment:** Vercel (auto-deploy on push to `main`)
- **Sanitization:** DOMPurify (centralized via `SafeHtml` component)

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- [clasp](https://developers.google.com/apps-script/guides/clasp) (for Apps Script deployment)

### Development
```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Production Build
```bash
npm run build
```

Output goes to `dist/`. Vercel picks this up automatically on push.

### Lint
```bash
npm run lint
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_APPS_SCRIPT_URL` | Google Apps Script web app URL (v40+) | Yes |

Set in `.env` locally or in Vercel project settings for production.

## Apps Script Backend

The backend lives in `src/api/Code.js` and is deployed as a Google Apps Script web app.

### Deployment
```bash
cd src/api
clasp login          # Authenticate with Google
clasp push           # Push code to Apps Script
clasp deploy         # Create a new deployment version
```

### Action Router

The backend uses a single `doPost` endpoint that routes by `action` parameter:

| Domain | Actions |
|--------|---------|
| **Auth** | `login`, `verifyOTP`, `verifyPIN`, `validateSession`, `logout` |
| **Users** | `loadUsers`, `addUser`, `updateUser`, `deleteUser`, `impersonate` |
| **Clients** | `loadClients`, `getClientDetail`, `addClient`, `updateClient`, `deleteClient`, `updateClientStatus` |
| **Projects** | `loadProjects`, `addProject`, `updateProject` |
| **Invoices** | `loadInvoices`, `createInvoice`, `recordPayment` |
| **Referrals** | `loadReferrals`, `submitReferral`, `updateReferral` |
| **Jobs** | `loadJobs`, `addJob`, `updateJob`, `deleteJob` |
| **Mail** | `loadMailboxes`, `loadThreads`, `getThread`, `sendEmail`, `replyToThread` |
| **SLA** | `loadSLA`, `updateSLA` |
| **Telemetry** | `logEvent`, `loadLogs` |

### Sheets Structure

Each domain maps to a named sheet in the backing Google Spreadsheet:
- `Users`, `Clients`, `Projects`, `Invoices`, `Referrals`, `Jobs`, `SLA`, `MailConfig`, `Logs`

## Auth & Roles

| Role | Access |
|------|--------|
| **Godmode** | Full system access, can impersonate, manage all users and settings |
| **SuperAdmin** | Team management, CRM, mail, projects, invoices |
| **Admin** | CRM, mail, projects (scoped to department) |
| **User** | Portal access only |

Auth flow: Email → OTP (or PIN/Password) → Session token stored in `localStorage`.

Sessions are validated server-side on every admin page load.

## Security

- **HTML Sanitization:** All user/external HTML rendered through `<SafeHtml>` component (DOMPurify). Direct `dangerouslySetInnerHTML` is banned.
- **Auth:** OTP rate limiting, session expiry, PIN lockout, role-based route guards
- **Tokens:** Stored in `localStorage` — XSS protection via DOMPurify is critical
- **Impersonation:** Logged server-side with original admin identity

## Admin Themes

The admin console supports two themes:
- **Modern** (default): Vercel-inspired, supports light/dark mode toggle
- **Classic**: Cyberpunk aesthetic (legacy, maintained for compatibility)

Theme selection persisted in `localStorage` as `icuni_admin_theme`.

## Project Structure

```
src/
├── api/              # Google Apps Script backend (Code.js)
├── components/
│   ├── admin/        # Admin console (CRM, Mail, Invoices, Team, etc.)
│   │   ├── mail/     # Mail hub components
│   │   └── vercel/   # Modern theme shell + CSS
│   ├── layout/       # Navbar, Footer, MainLayout, PersonaDrawer
│   ├── portal/       # Client + Referral portals
│   ├── sections/     # Homepage sections + standalone pages
│   └── shared/       # SafeHtml, reusable components
├── data/             # Static data (personas, portfolio, showroom)
├── store/            # Zustand stores (useAdminStore, usePortalStore)
└── App.tsx           # Hash router + lazy loading entry point
```

## Release Process

1. Make changes on `main` branch
2. Run `npm run build` to verify
3. `git push` — Vercel auto-deploys to `labs.icuni.org`
4. For backend changes: `clasp push` then `clasp deploy` in `src/api/`
