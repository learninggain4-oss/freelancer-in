

## Plan: Live Download Progress on "Check for Updates"

### Problem
Currently, "Check for Updates" either says "up to date" or flips to a static "Update Now" button. The user wants to see a live percentage download progress immediately when an update is found.

### Changes — `src/pages/AppPage.tsx`

1. **Merge check + update into one flow**: When `handleCheckUpdate` detects an update (i.e. `needRefresh` becomes true), automatically start the update with a progress bar — no intermediate "Update Now" button step.
2. **Listen for `needRefresh` changes during check**: After triggering `registration.update()`, watch for `needRefresh` to flip to `true`. When it does, immediately begin the simulated download progress + `updateServiceWorker(true)` call.
3. **Show progress UI during both check and download phases**:
   - Phase 1 (checking): "Checking for updates..." with spinner
   - Phase 2 (downloading): "Downloading update... X%" with animated progress bar
   - On completion: confetti + toast + reload
4. **Keep the manual "Update Now" button** as a fallback if the user navigates away and comes back with `needRefresh` already true.

### Technical Detail
- Use a `useEffect` that watches `needRefresh` — if it turns `true` while `checking` is active, transition to the download/update phase automatically.
- Reuse the existing simulated progress pattern (random increments to 95%, then jump to 100% on SW activation).
- Import `confetti` and `Progress` component for consistent UI with the `UpdatePrompt` component.

