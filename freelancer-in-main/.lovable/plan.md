

## Plan: Admin Wallet Upgrade Page

### Overview
Create a structured wallet upgrade request system with a new database table to track upgrade requests and an admin page to manage them. Currently, upgrades go through Help & Support chat with no formal tracking.

### Database Changes

**New table: `wallet_upgrade_requests`**
- `id` (uuid, PK)
- `profile_id` (uuid, FK to profiles)
- `user_id` (uuid, FK to auth.users)
- `current_wallet_type` (text) — name of user's current tier
- `requested_wallet_type` (text) — name of requested tier
- `status` (text: pending, approved, rejected, default: pending)
- `admin_notes` (text, nullable)
- `reviewed_by` (uuid, nullable)
- `reviewed_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())
- RLS: admins can select/update all; authenticated users can insert own and select own

### Frontend Changes

**1. New page: `src/pages/admin/AdminWalletUpgrades.tsx`**
- Table listing all upgrade requests with user name, current tier, requested tier, status, date
- Filterable by status (All / Pending / Approved / Rejected)
- Searchable by user name
- Actions: Approve (updates user's wallet type on profile), Reject (with optional notes)
- Badge indicators for pending count

**2. Update `src/App.tsx`**
- Add lazy import for `AdminWalletUpgrades`
- Add route `/admin/wallet-upgrades`

**3. Update `src/components/layout/AdminLayout.tsx`**
- Add "Wallet Upgrades" nav item under Financial section with `ArrowUpCircle` icon

**4. Update `src/pages/WalletTypes.tsx`**
- Change `handleUpgrade` to insert a row into `wallet_upgrade_requests` instead of navigating to Help & Support
- Show toast confirming request was submitted

### Technical Details
- Migration adds the table, enables RLS, and creates policies using `has_role` for admin access
- Admin approve action updates the profile's wallet tier and sets request status to approved
- Since `profiles` doesn't currently have a `wallet_type_id` column, the migration will add `wallet_type_id` (uuid, FK to wallet_types, nullable) to profiles

