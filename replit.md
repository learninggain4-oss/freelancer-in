# Freelancer-in (Migrated to Replit)

## Freelancer Dashboard Pages (as of April 2026)
- `/employee/dashboard` — Main dashboard with wallet card, stats, quick-actions
- `/employee/projects` — Browse & bid on projects
- `/employee/bids` — Bids tracker + proposal templates
- `/employee/earnings` — Earnings chart (area/bar), invoice generator, transaction history
- `/employee/reviews` — Client reviews with rating distribution + search/filter
- `/employee/badges` — Skill test quiz flow (5 Q preview), earn verified badges
- `/employee/portfolio` — Portfolio CRUD (add/edit/delete) with category filter
- `/employee/requests` — Submitted proposals tracker
- `/employee/wallet` — Wallet, withdrawals, QR, scan
- `/employee/attendance` — Attendance management
- `/employee/profile` — Profile + sub-pages (personal, professional, bank, work-exp, services)


## Project Overview
A freelancer marketplace app ("Freelancer-in") connecting freelancers (employees) with clients for project collaboration. Built with React + TypeScript + Vite frontend, with an Express.js API server that replaces all Supabase Edge Functions. Auth, database, storage, and realtime are still provided by the existing Supabase project.

## Architecture
- **Frontend**: Vite/React SPA (source in `src/`), runs on port 5000
- **API Server**: Express.js (`server/index.js`), runs on port 3001 — ports all 13 Supabase edge functions as local HTTP routes
- **Backend**: Supabase (hosted) — handles auth, PostgreSQL database, storage, and realtime subscriptions
- **Vite Proxy**: `/functions/v1/*` requests are proxied from port 5000 → 3001 so the frontend talks to the local server

## Running the App
- **Frontend** (Vite dev): `npm run dev` → port 5000 (workflow: "Start application")
- **API Server** (Express): `node server/index.js` → port 3001 (workflow: "API Server")
- Both workflows must be running for full functionality

## Key Configuration
- `vite.config.ts` — Vite dev server config (port 5000, proxy `/functions/v1` to port 3001)
- `server/index.js` — Express API server with all edge function routes + cron jobs
- `src/integrations/supabase/client.ts` — Supabase client (anon key, used for auth + realtime)

## Environment Variables / Secrets
- `VITE_SUPABASE_URL` — Supabase project URL (shared env var)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key (shared env var)
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID (shared env var)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role secret (Replit Secret) — required for the API server
- `RECAPTCHA_SECRET_KEY` — Google reCAPTCHA secret (optional, for captcha verification)
- `ONESIGNAL_APP_ID` / `ONESIGNAL_REST_API_KEY` — OneSignal push notifications (optional)

## Supabase Project
- Project ID: `maysttckdfnnzvfeujaj`
- URL: `https://maysttckdfnnzvfeujaj.supabase.co`

## API Server Routes (server/index.js)
All routes live at `/functions/v1/<name>`:
- `POST /functions/v1/user-totp` — User 2FA TOTP setup/verify/disable
- `POST /functions/v1/admin-totp` — Admin 2FA TOTP setup/verify/disable
- `POST /functions/v1/withdrawal-password` — Withdrawal PIN set/verify/status
- `POST /functions/v1/coin-operations` — Convert coins to wallet balance
- `POST /functions/v1/check-ip-block` — Check if caller IP is blocked
- `POST /functions/v1/track-visitor` — Record site visitor with geo-IP
- `POST /functions/v1/manage-ip-block` — Admin: block/unblock IPs
- `POST /functions/v1/verify-captcha` — Google reCAPTCHA token verification
- `POST /functions/v1/send-onesignal` — Send push notifications via OneSignal
- `POST /functions/v1/admin-user-management` — Admin: delete/suspend/invite users
- `POST /functions/v1/wallet-operations` — All wallet operations (20+ actions)

## Cron Jobs (server/index.js)
- Every 5 minutes: auto-expire pending withdrawals older than 2 hours
- Every 1 minute: auto-publish scheduled draft jobs

## Key Features
- Project management (post, apply, confirm, complete)
- Wallet system (add money, withdraw, transfer, hold/release)
- TOTP 2FA for admins and users
- Attendance tracking
- Support chat and upgrade chat with appointment booking
- Referral system with coin rewards
- Admin panel with 50+ pages
- PWA support (installable as mobile app)
- OneSignal push notifications
- Aadhaar & bank verification workflows
- Multi-language support (EN, HI, ML, UR, AR)
