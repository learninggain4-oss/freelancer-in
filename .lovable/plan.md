

## Plan: Separate Ringing Sounds Per Category + More Tones

### What changes
Replace the single global `soundTone` with **individual sound selectors for each notification category** (Project, Withdrawal, Transaction, System & Announcements), plus add **8 more sound tones** (total 20).

### Prefs interface update
```typescript
// Replace single soundTone with per-category tones
projectTone: string;    // default: "chime"
withdrawalTone: string; // default: "bell"
transactionTone: string;// default: "ding"
systemTone: string;     // default: "beep"
```

### New sound tones to add (8 more, total 20)
| Name | Freq | Type | Duration |
|------|------|------|----------|
| Twinkle | 1100 Hz | sine | 0.18s |
| Knock | 350 Hz | square | 0.07s |
| Ripple | 660 Hz | triangle | 0.28s |
| Alarm | 1500 Hz | sawtooth | 0.2s |
| Bubble | 480 Hz | sine | 0.12s |
| Spark | 2000 Hz | sine | 0.04s |
| Gong | 260 Hz | sine | 0.5s |
| Trill | 1050 Hz | triangle | 0.15s |

### UI changes in Sound Options card
- Remove the single "Notification Sound" selector
- Under each category toggle row, add an inline sound selector dropdown + play button (only visible when sound is enabled and category is enabled)
- Keep the global volume slider and chat sound toggle as-is

### File change
| File | Action |
|------|--------|
| `src/components/notifications/NotificationPreferences.tsx` | Add 8 tones, replace `soundTone` with 4 per-category tone keys, render per-category sound selectors inline |

