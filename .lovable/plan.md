

## Plan: Add More Notification Ring Tones

Expand the `SOUND_TONES` array in `NotificationPreferences.tsx` from 4 to 12 tones, using varied frequencies, oscillator types, and durations for distinct sounds.

### New tones to add:
| Name | Frequency | Type | Duration | Character |
|------|-----------|------|----------|-----------|
| Gentle Ding | 740 Hz | sine | 0.2s | Warm single ding |
| Sharp Ping | 1600 Hz | sine | 0.06s | Quick high ping |
| Retro Buzz | 440 Hz | sawtooth | 0.12s | 8-bit style |
| Soft Hum | 320 Hz | sine | 0.4s | Low gentle hum |
| Crystal | 1400 Hz | sine | 0.25s | High bright ring |
| Pulse | 900 Hz | square | 0.15s | Digital pulse |
| Whoosh | 200 Hz | triangle | 0.35s | Low sweep |
| Chirp | 1800 Hz | triangle | 0.05s | Quick bird-like |

### File change
| File | Action |
|------|--------|
| `src/components/notifications/NotificationPreferences.tsx` | Add 8 new entries to `SOUND_TONES` array (lines 39-44) |

