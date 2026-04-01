# Freelancer-in (Migrated from Lovable)

## Project Overview
A freelancer marketplace app ("Freelancer-in") connecting freelancers (employees) with clients for project collaboration. Built with React + TypeScript + Vite, using Supabase for auth, database, storage, real-time, and edge functions.

## Architecture
- **Frontend**: Pure Vite/React SPA (source in `src/`)
- **Backend**: Supabase (hosted) — handles auth, database (PostgreSQL), storage, real-time, and 13 edge functions
- **No custom backend server** — the app talks directly to Supabase from the browser

## Running the App
- Dev server runs on port 5000 via `npm run dev`
- Configured in `vite.config.ts` with `host: "0.0.0.0"` and `allowedHosts: true` for Replit compatibility

## Key Configuration
- `vite.config.ts` — Vite dev server config (port 5000, all hosts allowed)
- `src/integrations/supabase/client.ts` — Supabase client (hardcoded URL and anon key)
- `src/integrations/supabase/types.ts` — Auto-generated TypeScript types for the Supabase schema

## Supabase Project
- Project ID: `maysttckdfnnzvfeujaj`
- URL: `https://maysttckdfnnzvfeujaj.supabase.co`
- The app uses the Supabase anon key stored in `.env` and `src/integrations/supabase/client.ts`

## Edge Functions (hosted on Supabase)
- `admin-totp`, `admin-user-management`, `auto-expire-withdrawals`, `auto-publish-jobs`
- `check-ip-block`, `coin-operations`, `manage-ip-block`, `send-onesignal`
- `track-visitor`, `user-totp`, `verify-captcha`, `wallet-operations`, `withdrawal-password`

## Key Features
- Employee/Client/Admin role-based access
- Supabase Auth (email/password)
- Real-time chat between users
- Wallet system with coin balance and withdrawals
- Job/project management with approval flows
- Aadhaar verification, bank verification
- PWA support (offline-capable)
- OneSignal push notifications (domain-locked to production domain)

## Dependencies Removed During Migration
- `lovable-tagger` — Lovable-specific dev tool, removed during Replit migration

## UI Design System (Premium Dark Glassmorphism)
All 50+ pages across Employee, Client, and Admin dashboards have been redesigned with:
- **Theme switcher**: Black / White / White & Black (stored in `localStorage` via `useDashboardTheme` hook)
- **ThemeToggle component**: `src/components/layout/ThemeToggle.tsx` — dropdown with Malayalam labels (കറുത്ത / വെളുത്ത / വ & ക)
- **TH token system**: Each page defines a `TH` object with `black/white/wb` keys containing `bg, card, border, text, sub, input, badge, badgeFg`
- **Glass card pattern**: `background: rgba(255,255,255,.05)`, `border: 1px solid rgba(255,255,255,.08)`, `backdropFilter: blur(12px)` (black theme)
- **Design constants**: `A1="#6366f1"`, `A2="#8b5cf6"`, `BG="#070714"` — gradient accents throughout
- **Every page** has: premium hero section with gradient + icon, glass stat cards, theme-aware inline styles
- **AdminLayout** injects CSS that overrides all admin pages' base colors via `.admin-main` class
- **AppLayout** injects CSS for employee/client pages via `.app-main-dark` class

## Notes
- The PWA Service Worker caches Supabase API calls
- OneSignal push notifications are domain-locked to `freelancer-india.lovable.app` — will only work after configuring a custom domain or updating OneSignal settings
- The IP block check on startup (`check-ip-block` edge function) causes a brief loading spinner on first load
