

## Plan: Notification Panel/Shade

Replace the current small popover with a full-screen slide-down notification shade (mobile-style), triggered by tapping the bell icon.

### New Component: `src/components/notifications/NotificationPanel.tsx`
A Sheet (side="top") that slides down from the top, covering the screen like a phone notification shade:

- **Header**: "Notifications" title, unread count badge, "Mark all read" button, close (X) button
- **Filter tabs**: All | Unread | Chat | Projects | Alerts — filter notifications by type/read status
- **Notification cards**: Each card shows icon (color-coded by type), title, message (full text, not truncated), relative timestamp (e.g. "2 min ago" using `date-fns/formatDistanceToNow`), swipe-to-dismiss or delete button
- **Delete individual**: Add a `deleteNotification` mutation that deletes from Supabase
- **Clear all**: "Clear all" button that deletes all read notifications
- **Empty state**: Illustration-style empty state per filter tab
- **Group by date**: Today, Yesterday, Earlier sections

### Changes to `src/hooks/use-notifications.ts`
- Add `deleteNotification` mutation (delete single by id)
- Add `clearAllRead` mutation (delete all where `is_read = true`)

### Changes to `src/components/notifications/NotificationBell.tsx`
- Remove the Popover entirely
- Instead, toggle the NotificationPanel Sheet open/closed on bell click
- Keep the badge counter

### Changes to `src/components/layout/AppLayout.tsx`
- Import and render NotificationPanel, pass open state from NotificationBell (lift state up, or keep self-contained in NotificationBell)

### Architecture
Keep it self-contained: `NotificationBell` will render the Sheet internally (no state lifting needed). The bell button opens the sheet; the sheet contains the full panel.

### Files
- **Create** `src/components/notifications/NotificationPanel.tsx`
- **Edit** `src/components/notifications/NotificationBell.tsx` — swap popover for sheet trigger
- **Edit** `src/hooks/use-notifications.ts` — add delete/clear mutations

