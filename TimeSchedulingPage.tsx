import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StabilityFrame, StabilityReadOnlyBadge, useCanMutateStability } from "./StabilityShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function TimeSchedulingPage() {
  const canMutate = useCanMutateStability();
  const [tz, setTz] = useState("Asia/Kolkata");
  const [serverNow, setServerNow] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "stability_app_timezone")
      .maybeSingle()
      .then(({ data }) => data && setTz(data.value));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setServerNow(new Date().toISOString()), 1000);
    return () => clearInterval(t);
  }, []);

  const save = async () => {
    if (!canMutate) return;
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
    } catch {
      toast.error("Invalid IANA timezone");
      return;
    }
    await supabase.from("app_settings").upsert({ key: "stability_app_timezone", value: tz }, { onConflict: "key" });
    toast.success("Timezone saved");
  };

  const runPreview = () => {
    try {
      const local = new Date().toLocaleString("en-IN", { timeZone: tz });
      setPreview(local);
    } catch {
      setPreview("Invalid");
    }
  };

  return (
    <StabilityFrame
      title="Time & scheduling safety"
      subtitle="Application timezone for Edge workers and scheduling hints. NTP sync is the responsibility of your host OS / Supabase project."
    >
      <StabilityReadOnlyBadge />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Browser UTC</CardTitle>
          <CardDescription>{serverNow}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configured timezone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div>
            <Label>IANA zone</Label>
            <Input value={tz} onChange={(e) => setTz(e.target.value)} className="w-56 font-mono" />
          </div>
          <Button onClick={save} disabled={!canMutate}>
            Save
          </Button>
          <Button variant="outline" onClick={runPreview}>
            Preview now()
          </Button>
          {preview && <Badge variant="secondary">{preview}</Badge>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cron & tasks</CardTitle>
          <CardDescription>
            Register real schedules in Supabase Dashboard (pg_cron) or GitHub Actions. Store human-readable notes in
            app_settings if needed.
          </CardDescription>
        </CardHeader>
      </Card>
    </StabilityFrame>
  );
}
