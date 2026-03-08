

## IP Blocking System

### Overview
Add the ability for admins to block/unblock IP addresses, and enforce the block on every page load so blocked visitors see an "Access Denied" screen.

### Database Changes

**New table: `blocked_ips`**
- `id` (uuid, PK)
- `ip_address` (text, unique, not null)
- `reason` (text, nullable)
- `blocked_by` (uuid, nullable)
- `blocked_at` (timestamptz, default now())

RLS: Admin-only for all operations. Public SELECT allowed so the edge function (using service role) and the check-block edge function can read it.

### Edge Function Changes

**1. Update `track-visitor`** — After inserting the visit, also check if the IP is in `blocked_ips`. Return `{ blocked: true }` in the response if so.

**2. New edge function: `check-ip-block`** — Lightweight function that:
- Extracts the caller's IP from request headers
- Checks `blocked_ips` table
- Returns `{ blocked: true/false }`
- `verify_jwt = false` (must work for anonymous visitors)

### Frontend Changes

**1. `src/hooks/use-visitor-tracking.ts`** — Update to check the `blocked` flag from `track-visitor` response. If blocked, redirect to a blocked page or set a global blocked state.

**2. New `src/hooks/use-ip-block-check.ts`** — A hook used at the app root that calls `check-ip-block` on load. If blocked, sets state that renders a full-screen "Access Denied" overlay instead of the app content.

**3. `src/components/BlockedScreen.tsx`** — Full-screen component shown when IP is blocked: "Access to this website has been restricted. Contact support if you believe this is an error."

**4. `src/App.tsx`** — Wrap the app content with the IP block check. If blocked, render `BlockedScreen` instead of routes.

**5. `src/pages/admin/AdminVisitors.tsx`** — Add block/unblock buttons:
- A "Block" button next to each visitor row with an IP address
- A "Blocked IPs" tab or section showing all blocked IPs with "Unblock" buttons
- Block action: inserts into `blocked_ips` via edge function (admin auth required)
- Unblock action: deletes from `blocked_ips`

**6. New edge function: `manage-ip-block`** — Admin-authenticated function to insert/delete from `blocked_ips` (since RLS is admin-only, we validate the caller is admin via `getClaims`).

### Flow
1. Visitor loads the site → `track-visitor` runs → returns `{ blocked: true }` if IP is in `blocked_ips`
2. Frontend receives blocked status → renders `BlockedScreen` overlay
3. Admin visits Admin > Visitors → clicks "Block" on an IP → calls `manage-ip-block` → IP added to `blocked_ips`
4. Admin clicks "Unblock" → IP removed → visitor can access site again

### Files to Create/Modify
- **Create**: Migration for `blocked_ips` table
- **Create**: `supabase/functions/check-ip-block/index.ts`
- **Create**: `supabase/functions/manage-ip-block/index.ts`
- **Create**: `src/components/BlockedScreen.tsx`
- **Create**: `src/hooks/use-ip-block-check.ts`
- **Modify**: `supabase/functions/track-visitor/index.ts` — add block check
- **Modify**: `src/hooks/use-visitor-tracking.ts` — handle blocked response
- **Modify**: `src/App.tsx` — integrate block check
- **Modify**: `src/pages/admin/AdminVisitors.tsx` — add block/unblock UI
- **Modify**: `supabase/config.toml` — add new functions

