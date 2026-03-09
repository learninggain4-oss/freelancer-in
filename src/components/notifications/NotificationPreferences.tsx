import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Briefcase, Wallet, Megaphone, Volume2, BellRing, Play, MessageSquare, Vibrate } from "lucide-react";

const PREF_KEY = "notification_prefs";

interface Prefs {
  project: boolean;
  withdrawal: boolean;
  transaction: boolean;
  system: boolean;
  sound: boolean;
  push: boolean;
  projectTone: string;
  withdrawalTone: string;
  transactionTone: string;
  systemTone: string;
  soundVolume: number;
  chatSound: boolean;
  vibration: boolean;
}

const defaults: Prefs = {
  project: true,
  withdrawal: true,
  transaction: true,
  system: true,
  sound: true,
  push: false,
  projectTone: "chime",
  withdrawalTone: "bell",
  transactionTone: "ding",
  systemTone: "beep",
  soundVolume: 70,
  chatSound: true,
  vibration: true,
};

const SOUND_TONES: { value: string; label: string; freq: number; type: OscillatorType; duration: number; loop?: boolean }[] = [
  { value: "chime", label: "Default Chime", freq: 880, type: "sine", duration: 0.15 },
  { value: "bell", label: "Soft Bell", freq: 600, type: "sine", duration: 0.3 },
  { value: "beep", label: "Alert Beep", freq: 1200, type: "square", duration: 0.1 },
  { value: "pop", label: "Digital Pop", freq: 520, type: "triangle", duration: 0.08 },
  { value: "ding", label: "Gentle Ding", freq: 740, type: "sine", duration: 0.2 },
  { value: "ping", label: "Sharp Ping", freq: 1600, type: "sine", duration: 0.06 },
  { value: "buzz", label: "Retro Buzz", freq: 440, type: "sawtooth", duration: 0.12 },
  { value: "hum", label: "Soft Hum", freq: 320, type: "sine", duration: 0.4 },
  { value: "crystal", label: "Crystal", freq: 1400, type: "sine", duration: 0.25 },
  { value: "pulse", label: "Pulse", freq: 900, type: "square", duration: 0.15 },
  { value: "whoosh", label: "Whoosh", freq: 200, type: "triangle", duration: 0.35 },
  { value: "chirp", label: "Chirp", freq: 1800, type: "triangle", duration: 0.05 },
  { value: "twinkle", label: "Twinkle", freq: 1100, type: "sine", duration: 0.18 },
  { value: "knock", label: "Knock", freq: 350, type: "square", duration: 0.07 },
  { value: "ripple", label: "Ripple", freq: 660, type: "triangle", duration: 0.28 },
  { value: "alarm", label: "Alarm", freq: 1500, type: "sawtooth", duration: 0.2 },
  { value: "bubble", label: "Bubble", freq: 480, type: "sine", duration: 0.12 },
  { value: "spark", label: "Spark", freq: 2000, type: "sine", duration: 0.04 },
  { value: "gong", label: "Gong", freq: 260, type: "sine", duration: 0.5 },
  { value: "trill", label: "Trill", freq: 1050, type: "triangle", duration: 0.15 },
  { value: "classic-ring", label: "Classic Ring", freq: 1000, type: "sine", duration: 0.35 },
  { value: "phone-buzz", label: "Phone Buzz", freq: 700, type: "sawtooth", duration: 0.25 },
  { value: "marimba", label: "Marimba", freq: 550, type: "triangle", duration: 0.22 },
  { value: "xylophone", label: "Xylophone", freq: 1300, type: "sine", duration: 0.15 },
  { value: "harp", label: "Harp", freq: 830, type: "sine", duration: 0.45 },
  { value: "flute", label: "Flute", freq: 1150, type: "triangle", duration: 0.3 },
  { value: "siren", label: "Siren", freq: 950, type: "sawtooth", duration: 0.35 },
  { value: "radar", label: "Radar", freq: 1700, type: "square", duration: 0.1 },
  { value: "droplet", label: "Droplet", freq: 420, type: "sine", duration: 0.15 },
  { value: "echo", label: "Echo", freq: 780, type: "triangle", duration: 0.4 },
  // Loop tones (play 3x in quick succession)
  { value: "loop-ring", label: "Loop Ring", freq: 880, type: "sine", duration: 0.12, loop: true },
  { value: "loop-pulse", label: "Loop Pulse", freq: 600, type: "square", duration: 0.08, loop: true },
  { value: "loop-chime", label: "Loop Chime", freq: 1100, type: "sine", duration: 0.15, loop: true },
  { value: "loop-buzz", label: "Loop Buzz", freq: 450, type: "sawtooth", duration: 0.1, loop: true },
  { value: "loop-trill", label: "Loop Trill", freq: 1400, type: "triangle", duration: 0.06, loop: true },
  { value: "loop-bell", label: "Loop Bell", freq: 700, type: "sine", duration: 0.18, loop: true },
  { value: "loop-alarm", label: "Loop Alarm", freq: 1200, type: "sawtooth", duration: 0.1, loop: true },
  { value: "loop-ping", label: "Loop Ping", freq: 1600, type: "sine", duration: 0.05, loop: true },
  { value: "loop-melody", label: "Loop Melody", freq: 520, type: "triangle", duration: 0.2, loop: true },
  { value: "loop-siren", label: "Loop Siren", freq: 900, type: "sawtooth", duration: 0.15, loop: true },
];

const playTone = (toneValue: string, volume: number) => {
  try {
    const ctx = new AudioContext();
    const tone = SOUND_TONES.find((t) => t.value === toneValue) || SOUND_TONES[0];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.freq, ctx.currentTime);
    gain.gain.setValueAtTime((volume / 100) * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + tone.duration + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + tone.duration + 0.15);
  } catch {
    // Web Audio not supported
  }
};

type ToneKey = "projectTone" | "withdrawalTone" | "transactionTone" | "systemTone";

const categories = [
  { key: "project" as const, toneKey: "projectTone" as ToneKey, label: "Project Updates", desc: "Applications, assignments, validation", icon: Briefcase },
  { key: "withdrawal" as const, toneKey: "withdrawalTone" as ToneKey, label: "Withdrawal Updates", desc: "Status changes for withdrawals", icon: Wallet },
  { key: "transaction" as const, toneKey: "transactionTone" as ToneKey, label: "Transaction Updates", desc: "Balance and payment notifications", icon: Wallet },
  { key: "system" as const, toneKey: "systemTone" as ToneKey, label: "System & Announcements", desc: "Admin announcements and alerts", icon: Megaphone },
];

const NotificationPreferences = () => {
  const [prefs, setPrefs] = useState<Prefs>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
      // Migrate old soundTone to per-category if needed
      const migrated = { ...defaults, ...saved };
      if (saved.soundTone && !saved.projectTone) {
        migrated.projectTone = saved.soundTone;
        migrated.withdrawalTone = saved.soundTone;
        migrated.transactionTone = saved.soundTone;
        migrated.systemTone = saved.soundTone;
      }
      return migrated;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const toggle = (key: keyof Prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const updatePref = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Notification Categories with per-category sound selectors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notification Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((cat, idx) => (
            <div key={cat.key}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <cat.icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">{cat.label}</Label>
                    <p className="text-xs text-muted-foreground">{cat.desc}</p>
                  </div>
                </div>
                <Switch checked={prefs[cat.key]} onCheckedChange={() => toggle(cat.key)} />
              </div>
              {prefs[cat.key] && prefs.sound && (
                <div className="ml-7 mt-2 flex items-center gap-2">
                  <Select
                    value={prefs[cat.toneKey]}
                    onValueChange={(v) => updatePref(cat.toneKey, v)}
                  >
                    <SelectTrigger className="h-8 flex-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOUND_TONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => playTone(prefs[cat.toneKey], prefs.soundVolume)}
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {idx < categories.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sound Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sound Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Sound Alerts</Label>
                <p className="text-xs text-muted-foreground">Play a sound for new notifications</p>
              </div>
            </div>
            <Switch checked={prefs.sound} onCheckedChange={() => toggle("sound")} />
          </div>

          {prefs.sound && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Volume</Label>
                  <span className="text-xs text-muted-foreground">{prefs.soundVolume}%</span>
                </div>
                <Slider
                  value={[prefs.soundVolume]}
                  onValueChange={([v]) => updatePref("soundVolume", v)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Chat Message Sound</Label>
                    <p className="text-xs text-muted-foreground">Sound for incoming chat messages</p>
                  </div>
                </div>
                <Switch checked={prefs.chatSound} onCheckedChange={() => toggle("chatSound")} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Alert Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alert Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BellRing className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Browser push when app is in background</p>
              </div>
            </div>
            <Switch checked={prefs.push} onCheckedChange={() => toggle("push")} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Vibration</Label>
                <p className="text-xs text-muted-foreground">Vibrate on notifications (mobile)</p>
              </div>
            </div>
            <Switch checked={prefs.vibration} onCheckedChange={() => toggle("vibration")} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;
