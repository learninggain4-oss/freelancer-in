

## Plan: Add Notification Settings to Side Drawer Menu with Enhanced Sound Options

### Changes

**1. Add "Notification Settings" menu item to SideDrawer (`src/components/layout/SideDrawer.tsx`)**
- Add a new `Volume2` icon menu item labeled "Notification Settings" pointing to `{basePath}/notification-settings`
- Place it after the existing "Notifications" item

**2. Create dedicated Notification Settings page (`src/pages/NotificationSettings.tsx`)**
- A standalone page that renders the `NotificationPreferences` component
- Enhanced with more granular sound options:
  - **Sound Alerts** master toggle (existing)
  - **Notification Sound** selector: choose from multiple tones (Default Chime, Soft Bell, Alert Beep, Digital Pop) — plays a preview when selected
  - **Sound Volume** slider (low to high)
  - **Chat Message Sound** toggle — separate sound for incoming chat messages
  - **Vibration** toggle — vibrate on notifications (mobile PWA)
- All preferences stored in `localStorage` under the existing `notification_prefs` key

**3. Update NotificationPreferences (`src/components/notifications/NotificationPreferences.tsx`)**
- Add new fields to the `Prefs` interface: `soundTone`, `soundVolume`, `chatSound`, `vibration`
- Add a "Sound Options" card section with:
  - Dropdown/select for sound tone with preview play button
  - Volume slider (0-100)
  - Chat message sound toggle
  - Vibration toggle
- Sound preview uses Web Audio API (consistent with existing procedural chime approach) to generate different tones

**4. Register route in `src/App.tsx`**
- Add `notification-settings` route under both employee and client layouts, rendering `NotificationSettings`

### File Changes

| File | Action |
|------|--------|
| `src/components/layout/SideDrawer.tsx` | Add "Notification Settings" menu item |
| `src/components/notifications/NotificationPreferences.tsx` | Add sound tone selector, volume slider, chat sound & vibration toggles |
| `src/pages/NotificationSettings.tsx` | **Create** — standalone page wrapping NotificationPreferences |
| `src/App.tsx` | Add route for notification-settings |

