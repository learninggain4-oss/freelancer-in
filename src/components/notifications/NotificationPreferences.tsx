import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Briefcase, Wallet, MessageSquare, Megaphone, Volume2, BellRing } from "lucide-react";

const PREF_KEY = "notification_prefs";

interface Prefs {
  project: boolean;
  withdrawal: boolean;
  transaction: boolean;
  system: boolean;
  sound: boolean;
  push: boolean;
}

const defaults: Prefs = {
  project: true,
  withdrawal: true,
  transaction: true,
  system: true,
  sound: true,
  push: false,
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

  const categories = [
    { key: "project" as const, label: "Project Updates", desc: "Applications, assignments, validation", icon: Briefcase },
    { key: "withdrawal" as const, label: "Withdrawal Updates", desc: "Status changes for withdrawals", icon: Wallet },
    { key: "transaction" as const, label: "Transaction Updates", desc: "Balance and payment notifications", icon: Wallet },
    { key: "system" as const, label: "System & Announcements", desc: "Admin announcements and alerts", icon: Megaphone },
  ];

  return (
    <div className="space-y-4">
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alert Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Sound Alerts</Label>
                <p className="text-xs text-muted-foreground">Play a chime for new notifications</p>
              </div>
            </div>
            <Switch checked={prefs.sound} onCheckedChange={() => toggle("sound")} />
          </div>
          <Separator />
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
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;
