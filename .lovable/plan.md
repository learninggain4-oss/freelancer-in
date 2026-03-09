

## Plan: Add Loop Sound Tones

### What changes
Add **10 new looping/repeating pattern sounds** to the `SOUND_TONES` array. These tones use the `playTone` function's single-note approach but are designed with characteristics that evoke repeating/looping patterns (rapid oscillations, rhythmic frequencies). Additionally, enhance `playTone` to support an optional `loop` property — tones marked as loop will play the note **3 times** in quick succession to create a ringing/looping effect.

### New loop tones (10)

| Name | Freq | Type | Duration | Character |
|------|------|------|----------|-----------|
| Loop Ring | 880 Hz | sine | 0.12s | Repeating ring (3x) |
| Loop Pulse | 600 Hz | square | 0.08s | Pulsing beat (3x) |
| Loop Chime | 1100 Hz | sine | 0.15s | Chime loop (3x) |
| Loop Buzz | 450 Hz | sawtooth | 0.1s | Buzzing loop (3x) |
| Loop Trill | 1400 Hz | triangle | 0.06s | Fast trill (3x) |
| Loop Bell | 700 Hz | sine | 0.18s | Bell repeat (3x) |
| Loop Alarm | 1200 Hz | sawtooth | 0.1s | Alarm loop (3x) |
| Loop Ping | 1600 Hz | sine | 0.05s | Ping repeat (3x) |
| Loop Melody | 520 Hz | triangle | 0.2s | Melodic loop (3x) |
| Loop Siren | 900 Hz | sawtooth | 0.15s | Siren loop (3x) |

### Technical approach
- Add a `loop` boolean property to the tone definition type
- All 10 new tones get `loop: true`
- Update `playTone` to detect `loop: true` and play the tone 3 times with a short gap (~0.2s) between each repetition
- Existing tones remain unchanged (single play)

### File
| File | Action |
|------|--------|
| `src/components/notifications/NotificationPreferences.tsx` | Add `loop` to tone type, add 10 loop tones, update `playTone` to repeat looped tones 3x |

