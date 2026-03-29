import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRBAC } from "@/hooks/use-rbac";
import { useActivityLogger } from "@/hooks/use-activity-logger";
import { StabilityFrame, StabilityReadOnlyBadge, useCanMutateStability } from "./StabilityShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Req = Tables<"stability_export_requests">;

export default function ExportControlPage() {
  const { profile } = useAuth();
  const { role } = useRBAC();
  const { logActivity } = useActivityLogger();
  const canMutate = useCanMutateStability();
  const [rows, setRows] = useState<Req[]>([]);
  const [scope, setScope] = useState("users_sample");
  const [maxRows, setMaxRows] = useState("1000");
  const [expiresHours, setExpiresHours] = useState("24");
  const [note, setNote] = useState("");
  const [maxMb, setMaxMb] = useState("50");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("stability_export_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    setRows(data || []);
  }, []);

  useEffect(() => {
    load();
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "stability_max_export_mb")
      .maybeSingle()
      .then(({ data }) => data && setMaxMb(data.value));
  }, [load]);

  const submit = async () => {
    if (!profile?.id || !canMutate) return;
    const exp = new Date(Date.now() + (parseInt(expiresHours, 10) || 24) * 3600 * 1000).toISOString();
    const { error } = await supabase.from("stability_export_requests").insert({
      requested_by: profile.id,
      scope,
      status: "pending",
      notes: note || null,
      max_rows: parseInt(maxRows, 10) || 500,
      expires_at: exp,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await logActivity({
      action: "config_change",
      details: { area: "export_request", scope },
    });
    toast.success("Request submitted");
    setNote("");
    load();
  };

  const approve = async (id: string) => {
    if (!profile?.id || role !== "super_admin") {
      toast.error("Super Admin approves");
      return;
    }
    await supabase
      .from("stability_export_requests")
      .update({ status: "approved", approved_by: profile.id })
      .eq("id", id);
    await logActivity({ action: "config_change", details: { area: "export_approved", id } });
    toast.success("Approved");
    load();
  };

  const reject = async (id: string) => {
    if (!profile?.id) return;
    await supabase
      .from("stability_export_requests")
      .update({ status: "rejected", approved_by: profile.id })
      .eq("id", id);
    load();
  };

  const saveLimit = async () => {
    if (!canMutate) return;
    await supabase
      .from("app_settings")
      .upsert({ key: "stability_max_export_mb", value: maxMb }, { onConflict: "key" });
    toast.success("Export size cap saved");
  };

  return (
    <StabilityFrame
      title="Data export & leak prevention"
      subtitle="Approval workflow and row caps. Always mask PII in downstream jobs; watermark in export workers."
    >
      <StabilityReadOnlyBadge />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global export cap (MB)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-end">
          <Input className="w-28" value={maxMb} onChange={(e) => setMaxMb(e.target.value)} />
          <Button size="sm" onClick={saveLimit} disabled={!canMutate}>
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New export request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 max-w-lg">
          <div>
            <Label>Scope label</Label>
            <Input value={scope} onChange={(e) => setScope(e.target.value)} />
          </div>
          <div>
            <Label>Max rows</Label>
            <Input value={maxRows} onChange={(e) => setMaxRows(e.target.value)} type="number" />
          </div>
          <div>
            <Label>Expires (hours)</Label>
            <Input value={expiresHours} onChange={(e) => setExpiresHours(e.target.value)} type="number" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button onClick={submit} disabled={!canMutate}>
            Submit
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Queue</CardTitle>
          <CardDescription>Super Admin can approve. Requester ids are profile UUIDs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {rows.map((r) => (
            <div key={r.id} className="rounded border p-2 flex flex-wrap justify-between gap-2">
              <div>
                <span className="font-medium">{r.scope}</span> · {r.status} · max {r.max_rows}
                <div className="text-xs text-muted-foreground font-mono">requester: {r.requested_by}</div>
              </div>
              {r.status === "pending" && role === "super_admin" && (
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => approve(r.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => reject(r.id)}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </StabilityFrame>
  );
}
