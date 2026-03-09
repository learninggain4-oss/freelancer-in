import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, Volume2, VolumeX, Play, Square, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Procedural tone generators (Web Audio API) ──────────────────────────

type ToneGenerator = (ctx: AudioContext, duration: number) => void;

const createClassicRing: ToneGenerator = (ctx, duration) => {
  const end = ctx.currentTime + duration;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 440;
  gain.gain.value = 0;
  osc.connect(gain).connect(ctx.destination);
  // Ring pattern: 1s on, 2s off
  let t = ctx.currentTime;
  while (t < end) {
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.setValueAtTime(0, Math.min(t + 1, end));
    t += 3;
  }
  osc.start(ctx.currentTime);
  osc.stop(end);
};

const createDigitalTrill: ToneGenerator = (ctx, duration) => {
  const end = ctx.currentTime + duration;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 880;
  gain.gain.value = 0;
  osc.connect(gain).connect(ctx.destination);
  let t = ctx.currentTime;
  while (t < end) {
    gain.gain.setValueAtTime(0.15, t);
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1100, t + 0.15);
    gain.gain.setValueAtTime(0, Math.min(t + 0.3, end));
    t += 0.6;
  }
  osc.start(ctx.currentTime);
  osc.stop(end);
};

const createMelodic: ToneGenerator = (ctx, duration) => {
  const end = ctx.currentTime + duration;
  const notes = [523.25, 659.25, 783.99, 659.25]; // C5 E5 G5 E5
  let t = ctx.currentTime;
  while (t < end) {
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      const noteStart = t + i * 0.3;
      if (noteStart < end) {
        gain.gain.setValueAtTime(0.3, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, Math.min(noteStart + 0.28, end));
        osc.start(noteStart);
        osc.stop(Math.min(noteStart + 0.3, end));
      }
    });
    t += 2;
  }
};

const createSoftChime: ToneGenerator = (ctx, duration) => {
  const end = ctx.currentTime + duration;
  let t = ctx.currentTime;
  while (t < end) {
    [1046.5, 1318.5, 1568].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      const noteStart = t + i * 0.2;
      if (noteStart < end) {
        gain.gain.setValueAtTime(0.25, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, Math.min(noteStart + 0.6, end));
        osc.start(noteStart);
        osc.stop(Math.min(noteStart + 0.65, end));
      }
    });
    t += 2.5;
  }
};

const createUrgentBuzz: ToneGenerator = (ctx, duration) => {
  const end = ctx.currentTime + duration;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = 350;
  gain.gain.value = 0;
  osc.connect(gain).connect(ctx.destination);
  let t = ctx.currentTime;
  while (t < end) {
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.setValueAtTime(0, Math.min(t + 0.5, end));
    t += 0.8;
  }
  osc.start(ctx.currentTime);
  osc.stop(end);
};

const createRetroPhone: ToneGenerator = (ctx, duration) => {
  const end = ctx.currentTime + duration;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc1.type = "sine";
  osc2.type = "sine";
  osc1.frequency.value = 440;
  osc2.frequency.value = 480;
  gain.gain.value = 0;
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  let t = ctx.currentTime;
  while (t < end) {
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.setValueAtTime(0, Math.min(t + 2, end));
    t += 4;
  }
  osc1.start(ctx.currentTime);
  osc2.start(ctx.currentTime);
  osc1.stop(end);
  osc2.stop(end);
};

const createXylophone: ToneGenerator = (ctx, duration) => {
  const end = ctx.currentTime + duration;
  const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
  let t = ctx.currentTime;
  let idx = 0;
  while (t < end) {
    const freq = scale[idx % scale.length];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    if (t < end) {
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, Math.min(t + 0.35, end));
      osc.start(t);
      osc.stop(Math.min(t + 0.4, end));
    }
    t += 0.4;
    idx++;
  }
};

const createDoorbell: ToneGenerator = (ctx, duration) => {
  const end = ctx.currentTime + duration;
  let t = ctx.currentTime;
  while (t < end) {
    [659.25, 523.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      const s = t + i * 0.5;
      if (s < end) {
        gain.gain.setValueAtTime(0.3, s);
        gain.gain.exponentialRampToValueAtTime(0.001, Math.min(s + 0.45, end));
        osc.start(s);
        osc.stop(Math.min(s + 0.5, end));
      }
    });
    t += 3;
  }
};

const createAlarm: ToneGenerator = (ctx, duration) => {
  const end = ctx.currentTime + duration;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 600;
  gain.gain.value = 0;
  osc.connect(gain).connect(ctx.destination);
  let t = ctx.currentTime;
  while (t < end) {
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.5);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.setValueAtTime(0, Math.min(t + 0.5, end));
    osc.frequency.setValueAtTime(1200, Math.min(t + 0.5, end));
    osc.frequency.linearRampToValueAtTime(600, Math.min(t + 1, end));
    gain.gain.setValueAtTime(0.12, Math.min(t + 0.5, end));
    gain.gain.setValueAtTime(0, Math.min(t + 1, end));
    t += 1.5;
  }
  osc.start(ctx.currentTime);
  osc.stop(end);
};

const createHarpGliss: ToneGenerator = (ctx, duration) => {
  const end = ctx.currentTime + duration;
  const freqs = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33, 659.25];
  let t = ctx.currentTime;
  while (t < end) {
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      const s = t + i * 0.12;
      if (s < end) {
        gain.gain.setValueAtTime(0.2, s);
        gain.gain.exponentialRampToValueAtTime(0.001, Math.min(s + 0.5, end));
        osc.start(s);
        osc.stop(Math.min(s + 0.55, end));
      }
    });
    t += 3;
  }
};

// ── Tone definitions ────────────────────────────────────────────────────

interface RingtoneOption {
  id: string;
  name: string;
  description: string;
  generator: ToneGenerator;
}

const RINGTONES: RingtoneOption[] = [
  { id: "classic", name: "Classic Ring", description: "Traditional telephone ring", generator: createClassicRing },
  { id: "digital-trill", name: "Digital Trill", description: "Quick digital two-tone trill", generator: createDigitalTrill },
  { id: "melodic", name: "Melodic", description: "Pleasant C-E-G arpeggio melody", generator: createMelodic },
  { id: "soft-chime", name: "Soft Chime", description: "Gentle high-pitched chime", generator: createSoftChime },
  { id: "urgent", name: "Urgent Buzz", description: "Short rapid buzzing pulses", generator: createUrgentBuzz },
  { id: "retro-phone", name: "Retro Phone", description: "Dual-frequency vintage ring", generator: createRetroPhone },
  { id: "xylophone", name: "Xylophone", description: "Ascending scale notes", generator: createXylophone },
  { id: "doorbell", name: "Doorbell", description: "Ding-dong doorbell chime", generator: createDoorbell },
  { id: "alarm", name: "Alarm", description: "Rising and falling siren", generator: createAlarm },
  { id: "harp-gliss", name: "Harp Glissando", description: "Sweeping harp-like glide", generator: createHarpGliss },
];

const DURATION = 30; // seconds

// ── Component ───────────────────────────────────────────────────────────

const NotificationSettings = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("notif_sound") !== "off");
  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem("notif_push") === "on");
  const [selectedTone, setSelectedTone] = useState(() => localStorage.getItem("notif_ringtone") || "classic");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopPlaying = useCallback(() => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const playTone = useCallback((tone: RingtoneOption) => {
    stopPlaying();
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    setPlayingId(tone.id);
    tone.generator(ctx, DURATION);
    // Auto-stop after duration
    setTimeout(() => {
      if (audioCtxRef.current === ctx) stopPlaying();
    }, DURATION * 1000);
  }, [stopPlaying]);

  const handleToggleSound = (v: boolean) => {
    setSoundEnabled(v);
    localStorage.setItem("notif_sound", v ? "on" : "off");
  };

  const handleTogglePush = async (v: boolean) => {
    if (v && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
    }
    setPushEnabled(v);
    localStorage.setItem("notif_push", v ? "on" : "off");
  };

  const handleSelect = (id: string) => {
    setSelectedTone(id);
    localStorage.setItem("notif_ringtone", id);
  };

  return (
    <div className="space-y-6 px-4 py-6">
      <h2 className="text-2xl font-bold text-foreground">Notification Settings</h2>

      {/* Toggle cards */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundEnabled ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
              <Label htmlFor="sound-toggle" className="text-sm font-medium">Sound Alerts</Label>
            </div>
            <Switch id="sound-toggle" checked={soundEnabled} onCheckedChange={handleToggleSound} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <Label htmlFor="push-toggle" className="text-sm font-medium">Push Notifications</Label>
            </div>
            <Switch id="push-toggle" checked={pushEnabled} onCheckedChange={handleTogglePush} />
          </div>
        </CardContent>
      </Card>

      {/* Ringtone selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Calling / Ringing Tone</CardTitle>
          <p className="text-xs text-muted-foreground">30-second preview • tap to play, tap again to stop</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {RINGTONES.map((tone) => {
            const isSelected = selectedTone === tone.id;
            const isPlaying = playingId === tone.id;
            return (
              <div
                key={tone.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors cursor-pointer",
                  isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}
                onClick={() => handleSelect(tone.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      {tone.name}
                      {isSelected && <Badge variant="secondary" className="text-[10px]">Selected</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{tone.description}</p>
                  </div>
                </div>
                <Button
                  variant={isPlaying ? "destructive" : "outline"}
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    isPlaying ? stopPlaying() : playTone(tone);
                  }}
                >
                  {isPlaying ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
