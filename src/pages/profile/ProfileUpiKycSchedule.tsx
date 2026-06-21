import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Clock, Loader2, Save, ShieldAlert, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const MAX_DURATION_MIN = 10;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const formatTime = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");

const toMinutes = (t: string) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const durationMinutes = (s: string, e: string) => {
  const sm = toMinutes(s);
  const em = toMinutes(e);
  if (sm == null || em == null) return null;
  let diff = em - sm;
  if (diff <= 0) diff += 24 * 60; // overnight
  return diff;
};

const formatCooldown = (ms: number) => {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
};

const ProfileUpiKycSchedule = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const basePath = pathname.startsWith("/freelancer")
    ? "/freelancer"
    : pathname.startsWith("/employer")
    ? "/employer"
    : "/employee";

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(i);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["kyc-window", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("kyc_window_start, kyc_window_end, kyc_window_changed_at")
        .eq("id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as {
        kyc_window_start: string | null;
        kyc_window_end: string | null;
        kyc_window_changed_at: string | null;
      } | null;
    },
  });

  useEffect(() => {
    setStart(formatTime(data?.kyc_window_start));
    setEnd(formatTime(data?.kyc_window_end));
  }, [data?.kyc_window_start, data?.kyc_window_end]);

  const cooldownLeft = (() => {
    if (!data?.kyc_window_changed_at) return 0;
    const changed = new Date(data.kyc_window_changed_at).getTime();
    const remaining = COOLDOWN_MS - (now - changed);
    return remaining > 0 ? remaining : 0;
  })();

  const dur = start && end ? durationMinutes(start, end) : null;
  const durationInvalid = dur != null && (dur < 1 || dur > MAX_DURATION_MIN);

  const save = async () => {
    if (!start || !end) {
      toast.error("Start and End time are required");
      return;
    }
    if (start === end) {
      toast.error("Start and End time cannot be the same");
      return;
    }
    const d = durationMinutes(start, end);
    if (d == null || d < 1 || d > MAX_DURATION_MIN) {
      toast.error(`Duration must be between 1 and ${MAX_DURATION_MIN} minutes`);
      return;
    }
    const sameAsExisting =
      start === formatTime(data?.kyc_window_start) &&
      end === formatTime(data?.kyc_window_end);

    setSaving(true);
    const update: Record<string, any> = {
      kyc_window_start: start,
      kyc_window_end: end,
    };
    // Only reset cooldown if the time window actually changed
    if (!sameAsExisting) update.kyc_window_changed_at = new Date().toISOString();

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", profile!.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["kyc-window"] });
    toast.success(
      sameAsExisting
        ? "KYC time window saved"
        : "Saved. For your security, the new window activates in 24 hours.",
    );
    navigate(`${basePath}/profile/upi-apps`);
  };

  const clear = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        kyc_window_start: null,
        kyc_window_end: null,
        kyc_window_changed_at: null,
      })
      .eq("id", profile!.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStart("");
    setEnd("");
    queryClient.invalidateQueries({ queryKey: ["kyc-window"] });
    toast.success("KYC time window cleared");
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/profile/upi-apps`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Setup KYC Enable Time</h1>
      </div>

      <Alert className="border-amber-500/40 bg-amber-500/5">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-700 dark:text-amber-400">Security Protocol</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed">
          <ul className="list-disc pl-4 space-y-1">
            <li>Maximum allowed duration between Start and End time is <b>{MAX_DURATION_MIN} minutes</b>.</li>
            <li>Whenever you change the time window, a <b>24-hour security hold</b> is applied before the new window becomes active.</li>
            <li>During the hold, the KYC Enable button stays disabled across all UPI apps.</li>
          </ul>
        </AlertDescription>
      </Alert>

      {cooldownLeft > 0 && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Security hold active</AlertTitle>
          <AlertDescription className="text-xs">
            Your new KYC time window will activate in <b>{formatCooldown(cooldownLeft)}</b>.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Daily Time Window
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              KYC Enable button will only be active between the start and end time you set, every day.
            </p>

            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>

            {dur != null && (
              <p className={`text-xs ${durationInvalid ? "text-destructive" : "text-muted-foreground"}`}>
                Duration: <b>{dur} min</b>
                {durationInvalid && ` — must be 1–${MAX_DURATION_MIN} minutes`}
              </p>
            )}

            <div className="flex gap-2">
              <Button className="flex-1 gap-2" onClick={save} disabled={saving || durationInvalid}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
              {(data?.kyc_window_start || data?.kyc_window_end) && (
                <Button variant="outline" className="gap-2" onClick={clear} disabled={saving}>
                  <Trash2 className="h-4 w-4" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileUpiKycSchedule;
