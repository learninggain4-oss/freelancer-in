

## Admin Wallet Page

### Overview
Create a new dedicated wallet page for the admin at `/admin/wallet` that shows the admin's own personal wallet — balance card, transaction history, and the ability to view their financial activity. The admin already has a profile row in the `profiles` table with `available_balance` and `hold_balance`, so no database changes are needed.

### What it includes
- **Wallet card** — Reuses the existing `WalletCard` component showing admin's name, code, wallet number, available and hold balances
- **Transaction history** — Lists the admin's own transactions from the `transactions` table, with filtering and pagination
- **Balance summary cards** — Available balance, hold balance, total balance at a glance

### Files to create/modify

**Create: `src/pages/admin/AdminWallet.tsx`**
- Fetches the admin's profile via `useAuth()` context
- Queries `transactions` table filtered by the admin's `profile_id`
- Renders `WalletCard` at the top
- Shows paginated transaction history table with type badges, amounts, descriptions, dates

**Modify: `src/App.tsx`**
- Add lazy import for `AdminWallet`
- Add route `<Route path="wallet" element={<AdminWallet />} />` under admin routes

**Modify: `src/components/layout/AdminLayout.tsx`**
- Add nav item `{ label: "My Wallet", icon: Wallet, path: "/admin/wallet" }` near the top of the sidebar list

### No database changes required
The admin's profile already exists in `profiles` with balance fields, and `transactions` table already has RLS policies allowing admin access.

