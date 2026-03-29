import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StabilityFrame, StabilityReadOnlyBadge, useCanMutateStability } from "./StabilityShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";

type ScanRow = Tables<"stability_orphan_scans">;

export default function DataCleanupPage() {
  const { profile } = useAuth();
  const canMutate = useCanMutateStability();
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState("weekly");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("stability_orphan_scans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setScans(data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runScan = async () => {
    if (!profile?.id || !canMutate) return;
    setLoading(true);
    const checks: Record<string, unknown> = { at: new Date().toISOString(), checks: [] as object[] };

    try {
      const { count: roomCount } = await supabase.from("chat_rooms").select("id", { count: "exact", head: true });
      const { data: rooms } = await supabase.from("chat_rooms").select("id").limit(8000);
      const roomSet = new Set((rooms || []).map((r) => r.id));
      const { data: sampleMsg } = await supabase.from("messages").select("id, chat_room_id").limit(400);
      const orphanMsg =
        sampleMsg?.filter((m) => !roomSet.has(m.chat_room_id)).length ?? 0;
      (checks.checks as object[]).push({
        name: "messages_sample_orphan_room",
        sampleSize: sampleMsg?.length ?? 0,
        suspectCount: orphanMsg,
        note: roomCount && roomCount > 8000 ? "Room list truncated — full scan needs SQL" : null,
      });

      const { data: buckets } = await supabase.storage.listBuckets();
      (checks.checks as object[]).push({
        name: "storage_buckets",
        count: buckets?.length ?? 0,
      });

      const { error: insErr } = await supabase.from("stability_orphan_scans").insert({
        summary: checks,
        status: "completed",
        created_by: profile.id,
      });
      if (insErr) throw insErr;
      toast.success("Scan recorded");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    if (!canMutate) return;
    await supabase.from("app_settings").upsert(
      { key: "stability_cleanup_schedule", value: schedule },
      { onConflict: "key" }
    );
    toast.success("Schedule preference saved (enforce via pg_cron / worker)");
  };

  return (
    <StabilityFrame
      title="Orphaned data & cleanup"
      subtitle="Heuristic scans from the admin client. Heavy reconciliation and cascade deletes should run as trusted SQL or Edge Functions."
    >
      <StabilityReadOnlyBadge />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orphan data scanner</CardTitle>
          <CardDescription>
            Sample-based checks only. Expand with backend jobs for full referential integrity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={runScan} disabled={loading || !canMutate}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run scan now"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cleanup schedule (metadata)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-end">
          <div>
            <Label>Frequency hint</Label>
            <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} className="w-40" />
          </div>
          <Button variant="outline" onClick={saveSchedule} disabled={!canMutate}>
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-64">
            <pre className="text-xs whitespace-pre-wrap">
              {scans.map((s) => JSON.stringify(s.summary, null, 2)).join("\n---\n")}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </StabilityFrame>
  );
}
