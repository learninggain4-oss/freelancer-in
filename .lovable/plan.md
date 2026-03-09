

## Plan: Add More Calling/Ringing Sound Tones

Currently there are 20 tones. Add **10 new calling/ringing-style sounds** that mimic phone ring patterns, bringing the total to 30.

### New tones to add

| Name | Freq | Type | Duration | Character |
|------|------|------|----------|-----------|
| Classic Ring | 1000 Hz | sine | 0.35s | Traditional phone ring |
| Phone Buzz | 700 Hz | sawtooth | 0.25s | Vibrating phone sound |
| Marimba | 550 Hz | triangle | 0.22s | Marimba-like tap |
| Xylophone | 1300 Hz | sine | 0.15s | Bright xylophone hit |
| Harp | 830 Hz | sine | 0.45s | Harp pluck |
| Flute | 1150 Hz | triangle | 0.3s | Flute-like tone |
| Siren | 950 Hz | sawtooth | 0.35s | Short siren burst |
| Radar | 1700 Hz | square | 0.1s | Radar blip |
| Droplet | 420 Hz | sine | 0.15s | Water drop |
| Echo | 780 Hz | triangle | 0.4s | Echoing ring |

### File change
| File | Action |
|------|--------|
| `src/components/notifications/NotificationPreferences.tsx` | Append 10 new entries to `SOUND_TONES` array after line 65 |

