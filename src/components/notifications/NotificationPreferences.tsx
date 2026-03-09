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
  soundTone: string;
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
  soundTone: "chime",
  soundVolume: 70,
  chatSound: true,
  vibration: true,
};

const SOUND_TONES = [
  { value: "chime", label: "Default Chime", freq: 880, type: "sine" as OscillatorType, duration: 0.15 },
  { value: "bell", label: "Soft Bell", freq: 600, type: "sine" as OscillatorType, duration: 0.3 },
  { value: "beep", label: "Alert Beep", freq: 1200, type: "square" as OscillatorType, duration: 0.1 },
  { value: "pop", label: "Digital Pop", freq: 520, type: "triangle" as OscillatorType, duration: 0.08 },
  { value: "ding", label: "Gentle Ding", freq: 740, type: "sine" as OscillatorType, duration: 0.2 },
  { value: "ping", label: "Sharp Ping", freq: 1600, type: "sine" as OscillatorType, duration: 0.06 },
  { value: "buzz", label: "Retro Buzz", freq: 440, type: "sawtooth" as OscillatorType, duration: 0.12 },
  { value: "hum", label: "Soft Hum", freq: 320, type: "sine" as OscillatorType, duration: 0.4 },
  { value: "crystal", label: "Crystal", freq: 1400, type: "sine" as OscillatorType, duration: 0.25 },
  { value: "pulse", label: "Pulse", freq: 900, type: "square" as OscillatorType, duration: 0.15 },
  { value: "whoosh", label: "Whoosh", freq: 200, type: "triangle" as OscillatorType, duration: 0.35 },
  { value: "chirp", label: "Chirp", freq: 1800, type: "triangle" as OscillatorType, duration: 0.05 },
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

const NotificationPreferences = () => {
  const [prefs, setPrefs] = useState<Prefs>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
      return { ...defaults, ...saved };
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

  const categories = [
    { key: "project" as const, label: "Project Updates", desc: "Applications, assignments, validation", icon: Briefcase },
    { key: "withdrawal" as const, label: "Withdrawal Updates", desc: "Status changes for withdrawals", icon: Wallet },
    { key: "transaction" as const, label: "Transaction Updates", desc: "Balance and payment notifications", icon: Wallet },
    { key: "system" as const, label: "System & Announcements", desc: "Admin announcements and alerts", icon: Megaphone },
  ];

  return (
    <div className="space-y-4">
      {/* Notification Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notification Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <cat.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">{cat.label}</Label>
                  <p className="text-xs text-muted-foreground">{cat.desc}</p>
                </div>
              </div>
              <Switch checked={prefs[cat.key]} onCheckedChange={() => toggle(cat.key)} />
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
          {/* Master sound toggle */}
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
              {/* Tone selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notification Sound</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={prefs.soundTone}
                    onValueChange={(v) => updatePref("soundTone", v)}
                  >
                    <SelectTrigger className="flex-1">
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
                    onClick={() => playTone(prefs.soundTone, prefs.soundVolume)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Volume slider */}
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

              {/* Chat sound toggle */}
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
