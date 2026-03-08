

## Plan: Show Wallet Active/Inactive Status on WalletCard

### What changes
1. **WalletCard component** — Add a `walletActive` prop (boolean). Display a status badge in the card header showing "Active" (green) or "Inactive" (red/muted). When inactive, apply a grayscale overlay to visually indicate the wallet is deactivated.

2. **All WalletCard usages** — Pass `profile?.wallet_active` to the WalletCard in:
   - `EmployeeWallet.tsx`
   - `EmployeeDashboard.tsx`
   - `ClientWallet.tsx`
   - `ClientDashboard.tsx`
   - `HelpSupport.tsx` (Account Summary section, if wallet info is shown there)

3. **AuthContext** — Ensure `wallet_active` is included in the profile fetch query (it was added to the DB but may not be in the select list).

### Technical details
- **WalletCard**: Add `walletActive?: boolean` prop (default `true`). Render a small badge next to "Freelancer Wallet" header text. When inactive, overlay a semi-transparent grayscale layer and show "Wallet Inactive" badge in red.
- **AuthContext `fetchProfile`**: Add `wallet_active` to the select column list.
- No database changes needed — `wallet_active` column already exists.

