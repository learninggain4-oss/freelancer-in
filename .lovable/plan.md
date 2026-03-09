

## Plan: Fix Notification Sounds + Add Browser Push Alerts for All Categories

### Problem
1. Sound preferences are saved but **never actually played** — `use-notifications.ts` and `use-chat-notifications.ts` only show toasts without triggering any Web Audio ringtone.
2. Browser push notifications are not sent for any category.

### Solution

#### 1. Create a `playNotificationSound` utility (`src/utils/notification-sounds.ts`)
- Export a function `playNotificationSound(category: SoundCategory)` that:
  - Loads preferences from localStorage
  - Checks if sounds are globally enabled AND enabled for the specific category
  - Finds the selected ringtone for that category
  - Creates an `AudioContext`, plays a short burst (2-3 seconds, not 30s)
  - Handles browser autoplay restrictions gracefully

#### 2. Create a `showBrowserPush` utility (`src/utils/notification-sounds.ts`)
- Export a function `showBrowserPush(title: string, body: string, category: SoundCategory)` that:
  - Checks if push is enabled in preferences
  - Checks if `Notification.permission === "granted"`
  - Shows a native `new Notification(title, { body, icon })` for the given category

#### 3. Update `src/hooks/use-chat-notifications.ts` — Chat category
- After showing the toast, call `playNotificationSound("chat")`
- Call `showBrowserPush(senderName, preview, "chat")`

#### 4. Update `src/hooks/use-notifications.ts` — Project, Alert, Announcement categories
- In the realtime INSERT handler, determine category from `notification.type` (map `info`→`project`, `warning`→`alert`, `success`→`announcement`, etc.)
- Call `playNotificationSound(category)` and `showBrowserPush(title, message, category)`

#### 5. Update `src/components/announcements/AnnouncementPopup.tsx` — Announcement category
- When an undismissed announcement is found and shown, call `playNotificationSound("announcement")` and `showBrowserPush(title, message, "announcement")`

### Files to modify
- `src/utils/notification-sounds.ts` — add `playNotificationSound` and `showBrowserPush` exports
- `src/hooks/use-chat-notifications.ts` — integrate sound + push for chat
- `src/hooks/use-notifications.ts` — integrate sound + push for project/alert/announcement
- `src/components/announcements/AnnouncementPopup.tsx` — integrate sound + push for announcements

