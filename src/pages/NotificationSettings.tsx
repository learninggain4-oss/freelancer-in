import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, BellOff, Volume2, VolumeX, Play, Square, Check, MessageCircle, Briefcase, AlertTriangle, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RINGTONES,
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

const NotificationSettings = () => {
  const [prefs, setPrefs] = useState<SoundPreferences>(loadSoundPreferences);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const save = useCallback((next: SoundPreferences) => {
    setPrefs(next);
    saveSoundPreferences(next);
  }, []);

  const stopCurrent = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setPlayingId(null);
  }, []);

  const handlePreview = useCallback(
    (ringtoneId: string) => {
      stopCurrent();
      if (playingId === ringtoneId) return; // toggle off

      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;
      const tone = RINGTONES.find((r) => r.id === ringtoneId);
      if (!tone) return;

      const { stop } = tone.play(ctx, 30);
      stopRef.current = stop;
      setPlayingId(ringtoneId);

      // Auto-stop after 30s
      setTimeout(() => {
        if (stopRef.current === stop) {
          stopCurrent();
        }
      }, 30000);
    },
    [playingId, stopCurrent]
  );

  const handleTogglePush = async () => {
    if (!("Notification" in window)) {
      toast.error("Push notifications not supported in this browser");
      return;
    }
    if (!prefs.pushEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        save({ ...prefs, pushEnabled: true });
        toast.success("Push notifications enabled");
      } else {
        toast.error("Permission denied for push notifications");
      }
    } else {
      save({ ...prefs, pushEnabled: false });
    }
  };

  return (
    <div className="space-y-6 px-4 py-6">
      <h2 className="text-2xl font-bold text-foreground">Notification Settings</h2>

      {/* Global toggles */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {prefs.enabled ? (
                <Volume2 className="h-5 w-5 text-accent" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">Sound Notifications</p>
                <p className="text-xs text-muted-foreground">Play sounds for notifications</p>
              </div>
            </div>
            <Switch
              checked={prefs.enabled}
              onCheckedChange={(enabled) => save({ ...prefs, enabled })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {prefs.pushEnabled ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Browser push alerts</p>
              </div>
            </div>
            <Switch checked={prefs.pushEnabled} onCheckedChange={handleTogglePush} />
          </div>
        </CardContent>
      </Card>

      {/* Per-category sound selection */}
      {SOUND_CATEGORIES.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.key];
        const catPref = prefs.sounds[cat.key];
        return (
          <Card key={cat.key}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{cat.label}</CardTitle>
                </div>
                <Switch
                  checked={catPref.enabled}
                  onCheckedChange={(enabled) =>
                    save({
                      ...prefs,
                      sounds: {
                        ...prefs.sounds,
                        [cat.key]: { ...catPref, enabled },
                      },
                    })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">{cat.description}</p>
            </CardHeader>
            {catPref.enabled && (
              <CardContent className="grid grid-cols-2 gap-2 pt-0">
                {RINGTONES.map((tone) => {
                  const isSelected = catPref.ringtoneId === tone.id;
                  const isPlaying = playingId === tone.id;
                  return (
                    <button
                      key={tone.id}
                      onClick={() =>
                        save({
                          ...prefs,
                          sounds: {
                            ...prefs.sounds,
                            [cat.key]: { ...catPref, ringtoneId: tone.id },
                          },
                        })
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex flex-1 items-center gap-2 min-w-0">
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                        <span
                          className={cn(
                            "truncate text-xs font-medium",
                            isSelected ? "text-primary" : "text-foreground"
                          )}
                        >
                          {tone.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(tone.id);
                        }}
                      >
                        {isPlaying ? (
                          <Square className="h-3 w-3 text-destructive" />
                        ) : (
                          <Play className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    </button>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}

      {playingId && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
          <Badge
            variant="secondary"
            className="flex items-center gap-2 px-4 py-2 shadow-lg cursor-pointer"
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
