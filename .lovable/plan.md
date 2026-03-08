

## Plan: Create "Get Free" Page with Invite & Earn

### Overview
Create a new "Get Free" page accessible from the side drawer menu. Move the Invite & Earn and Referral History content from Account Settings into this new page. Clean up Account Settings to only retain Security and Account tabs.

### Changes

#### 1. Create `src/pages/GetFree.tsx`
- New page with two tabs: **Invite & Earn** and **Referral History**
- Move all referral-related state, logic, and UI from `AccountSettings.tsx` into this page (referral code, copy/share, stats, history, terms)
- Include the same data fetching logic (referral code from profiles, stats via `get_referral_history`, terms from `app_settings`)

#### 2. Update `src/pages/AccountSettings.tsx`
- Remove the "Invite & Earn" and "Referral History" tabs
- Remove all referral-related state, imports, and logic
- Keep only **Security** and **Account** tabs (change grid-cols-4 → grid-cols-2)
- Move the "App Updates" card into the Account tab

#### 3. Update `src/components/layout/SideDrawer.tsx`
- Add a "Get Free" menu item with a `Gift` icon, positioned before Account Settings
- Route to `${basePath}/get-free`

#### 4. Update `src/App.tsx`
- Add lazy import for `GetFree` page
- Add `<Route path="get-free" element={<GetFree />} />` under both employee and client route groups

