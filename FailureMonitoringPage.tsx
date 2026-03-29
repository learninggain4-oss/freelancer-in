import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StabilityFrame, StabilityReadOnlyBadge } from "./StabilityShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

const WATCH = [
  "security_alert",
  "server_restart",
  "maintenance_toggle",
  "config_change",
  "db_switch",
  "emergency_recovery",
];

export default function FailureMonitoringPage() {
  const [rows, setRows] = useState<
    { id: string; action: string; created_at: string; details: unknown }[]
  >([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("admin_audit_logs")
      .select("id, action, created_at, details")
      .in("action", WATCH)
      .order("created_at", { ascending: false })
      .limit(80);
    setRows(data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <StabilityFrame
      title="Silent failure & task health"
      subtitle="Surrogate monitoring via audit stream. Add error tracking (Sentry) and job tables for full coverage."
    >
      <StabilityReadOnlyBadge />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent risk events</CardTitle>
            <CardDescription>Filtered admin_audit_logs</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            <div className="space-y-2 text-xs">
              {rows.map((r) => (
                <div key={r.id} className="rounded border p-2">
                  <Badge variant="outline">{r.action}</Badge>{" "}
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                  <pre className="mt-1 text-[10px] overflow-x-auto max-h-20">{JSON.stringify(r.details)}</pre>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </StabilityFrame>
  );
}
