

## Plan: Full Notifications Feature Set

### 1. Full Notifications Page (`src/pages/Notifications.tsx`)
A dedicated page at `/{employee|client}/notifications` with:
- **Tabs**: All, Unread, Read
- **Search** by title/message
- **Type filter** chips (info, success, warning, error)
- **Pagination** (15 per page, consistent with admin pattern)
- Full message display (no truncation), relative timestamps
- Each notification card shows type badge, title, full message, timestamp
- "Mark all read" and "Clear all" bulk actions in header

### 2. Click-to-Navigate
- Map `reference_type` to routes: `withdrawal` → wallet/withdrawals, `project` → projects, `application` → requests, `chat` → projects/chat/:id, `transaction` → wallet/transactions
- On notification click: mark as read + navigate using `useNavigate`
- Works in both the bell popover and the full page

### 3. Delete/Clear Notifications
- Individual "dismiss" button (swipe or X icon) on each notification
- "Clear all read" bulk action
- Uses the existing `is_cleared` column — update to `is_cleared = true`
- Filter out cleared notifications by default (`is_cleared = false`)
- Update the `useNotifications` hook to filter by `is_cleared = false`

### 4. Notification Settings/Preferences (`src/components/notifications/NotificationPreferences.tsx`)
- Add a "Notifications" tab to Account Settings page
- Toggle categories: Project updates, Withdrawal updates, Chat messages, System announcements
- Store preferences in `localStorage` (consistent with existing audio/push prefs pattern)
- Filter displayed notifications based on saved preferences
- Toggle for sound and push notifications (already exists — integrate into same UI)

### File Changes

| File | Action |
|------|--------|
| `src/pages/Notifications.tsx` | **Create** — Full notifications page |
| `src/components/notifications/NotificationPreferences.tsx` | **Create** — Preferences toggles card |
| `src/hooks/use-notifications.ts` | **Edit** — Add `is_cleared` filter, `clearNotification` mutation, `clearAllRead` mutation, navigation helper |
| `src/components/notifications/NotificationBell.tsx` | **Edit** — Add click-to-navigate, "View all" link to full page |
| `src/pages/AccountSettings.tsx` | **Edit** — Add Notifications tab with preferences |
| `src/App.tsx` | **Edit** — Add `notifications` route under employee and client layouts |
| `src/components/layout/SideDrawer.tsx` | **Edit** — Update `/notifications` path to use correct relative path |

### No database changes needed
The `notifications` table already has `is_cleared`, `reference_id`, `reference_type`, `is_read` — all required columns exist.

