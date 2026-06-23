import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Check,
  MessageCircle,
  Briefcase,
  AlertTriangle,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SOUND_CATEGORIES,
  loadSoundPreferences,
  saveSoundPreferences,
  type SoundPreferences,
  type SoundCategory,
} from "@/utils/notification-sounds";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<SoundCategory, typeof MessageCircle> = {
  chat: MessageCircle,
  project: Briefcase,
  alert: AlertTriangle,
  announcement: Megaphone,
};

const CATEGORY_COLORS: Record<SoundCategory, { bg: string; color: string }> = {
  chat: { bg: "bg-primary/10", color: "text-primary" },
  project: { bg: "bg-accent/10", color: "text-accent" },
  alert: { bg: "bg-destructive/10", color: "text-destructive" },
  announcement: { bg: "bg-warning/10", color: "text-warning" },
};

const NotificationSettings = () => {
  const [prefs, setPrefs] = useState<SoundPreferences>(loadSoundPreferences);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  // Initialize browser voices early
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const save = useCallback((next: SoundPreferences) => {
    setPrefs(next);
    saveSoundPreferences(next);
  }, []);

  const stopCurrent = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlayingId(null);
  }, []);

  const handlePreview = useCallback(
    (categoryId: string) => {
      stopCurrent();
      const currentPlayKey = `voice-${categoryId}`;
      if (playingId === currentPlayKey) return;

      // Set explicit text for each category
      let textToSpeak = "New notification";
      if (categoryId === "chat") textToSpeak = "New chat message";
      if (categoryId === "project") textToSpeak = "New project update";
      if (categoryId === "alert") textToSpeak = "New alert received";
      if (categoryId === "announcement") textToSpeak = "New announcement";

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voices = window.speechSynthesis.getVoices();

      // Try to find a female voice
      const femaleVoice = voices.find((v) => /female|zira|samantha|victoria/i.test(v.name));

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      } else {
        utterance.pitch = 1.2; // Fallback to higher pitch if no specific female voice is found
      }

      utterance.onstart = () => setPlayingId(currentPlayKey);
      utterance.onend = () => setPlayingId(null);

      window.speechSynthesis.speak(utterance);
      stopRef.current = () => window.speechSynthesis.cancel();
    },
    [playingId, stopCurrent],
  );

  const handleTogglePush = async () => {
    if (!prefs.pushEnabled) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          const permission = await OneSignal.Notifications.requestPermission();
          if (permission) {
            save({ ...prefs, pushEnabled: true });
            toast.success("Push notifications enabled");
          } else {
            toast.error("Permission denied");
          }
        } catch {
          toast.error("Could not enable push");
        }
      });
    } else {
      save({ ...prefs, pushEnabled: false });
    }
  };

  return (
    <div className="space-y-5 p-4 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary-foreground/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Notification Settings</h1>
            <p className="text-xs text-primary-foreground/70">Customize alerts & sounds</p>
          </div>
        </div>
      </div>

      {/* Global Toggles */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardContent className="space-y-0 p-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${prefs.enabled ? "bg-accent/10" : "bg-muted"}`}
              >
                {prefs.enabled ? (
                  <Volume2 className="h-5 w-5 text-accent" />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Sound Notifications</p>
                <p className="text-xs text-muted-foreground">Play sounds for alerts</p>
              </div>
            </div>
            <Switch checked={prefs.enabled} onCheckedChange={(enabled) => save({ ...prefs, enabled })} />
          </div>
          <div className="mx-4 h-px bg-border" />
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${prefs.pushEnabled ? "bg-primary/10" : "bg-muted"}`}
              >
                {prefs.pushEnabled ? (
                  <Bell className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Browser push alerts</p>
              </div>
            </div>
            <Switch checked={prefs.pushEnabled} onCheckedChange={handleTogglePush} />
          </div>
        </CardContent>
      </Card>

      {/* Per-category */}
      {SOUND_CATEGORIES.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.key];
        const colors = CATEGORY_COLORS[cat.key];
        const catPref = prefs.sounds[cat.key];

        return (
          <Card key={cat.key} className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg}`}>
                    <Icon className={`h-4 w-4 ${colors.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{cat.label}</CardTitle>
                    <p className="text-[11px] text-muted-foreground">{cat.description}</p>
                  </div>
                </div>
                <Switch
                  checked={catPref.enabled}
                  onCheckedChange={(enabled) =>
                    save({ ...prefs, sounds: { ...prefs.sounds, [cat.key]: { ...catPref, enabled } } })
                  }
                />
              </div>
            </CardHeader>
            {catPref.enabled && (
              <CardContent className="grid grid-cols-1 gap-2 pt-0">
                <button
                  onClick={() =>
                    save({
                      ...prefs,
                      sounds: { ...prefs.sounds, [cat.key]: { ...catPref, ringtoneId: "female-voice" } },
                    })
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-xl border-2 p-2.5 text-left transition-all",
                    "border-primary bg-primary/5 shadow-sm",
                  )}
                >
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate text-xs font-medium text-primary">Female Voice Assistant</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(cat.key);
                    }}
                  >
                    {playingId === `voice-${cat.key}` ? (
                      <Square className="h-3 w-3 text-destructive" />
                    ) : (
                      <Play className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                </button>
              </CardContent>
            )}
          </Card>
        );
      })}

      {playingId && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
          <Badge
            variant="secondary"
            className="flex items-center gap-2 px-4 py-2 shadow-lg cursor-pointer rounded-full"
            onClick={stopCurrent}
          >
            <Square className="h-3 w-3 text-destructive" />
            <span className="text-xs">Playing — tap to stop</span>
          </Badge>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
