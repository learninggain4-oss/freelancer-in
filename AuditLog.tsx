import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  FileText, Search, RefreshCw, Loader2, ChevronDown, ChevronUp,
  Filter, Download, Clock, User, Shield, Database, Settings,
  AlertTriangle, UserCheck, Ban, Key, Server, RotateCcw, Eye,
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_profile_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  admin_email?: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  login: User,
  logout: User,
  settings_change: Settings,
  user_approve: UserCheck,
  user_reject: Ban,
  user_block: Ban,
  user_delete: Ban,
  role_change: Shield,
  ip_whitelist_change: Shield,
  env_var_change: Key,
  db_switch: Database,
  server_restart: Server,
  maintenance_toggle: Server,
  backup_create: Download,
  config_change: Settings,
  security_alert: AlertTriangle,
  system_health_check: Eye,
  emergency_recovery: AlertTriangle,
  config_rollback: RotateCcw,
  pending_action_created: Clock,
  pending_action_approved: UserCheck,
  pending_action_rejected: Ban,
  permission_change_recorded: Shield,
  data_deletion_requested: AlertTriangle,
};

const ACTION_COLORS: Record<string, string> = {
  login: "bg-green-500/10 text-green-600",
  logout: "bg-gray-500/10 text-gray-600",
  settings_change: "bg-blue-500/10 text-blue-600",
  user_approve: "bg-green-500/10 text-green-600",
  user_reject: "bg-red-500/10 text-red-600",
  user_block: "bg-red-500/10 text-red-600",
  user_delete: "bg-red-500/10 text-red-600",
  role_change: "bg-purple-500/10 text-purple-600",
  ip_whitelist_change: "bg-amber-500/10 text-amber-600",
  env_var_change: "bg-amber-500/10 text-amber-600",
  db_switch: "bg-red-500/10 text-red-600",
  server_restart: "bg-red-500/10 text-red-600",
  maintenance_toggle: "bg-amber-500/10 text-amber-600",
  backup_create: "bg-blue-500/10 text-blue-600",
  config_change: "bg-blue-500/10 text-blue-600",
  security_alert: "bg-red-500/10 text-red-600",
  system_health_check: "bg-green-500/10 text-green-600",
  emergency_recovery: "bg-red-500/10 text-red-600",
  config_rollback: "bg-amber-500/10 text-amber-600",
  pending_action_created: "bg-blue-500/10 text-blue-600",
  pending_action_approved: "bg-green-500/10 text-green-600",
  pending_action_rejected: "bg-red-500/10 text-red-600",
  permission_change_recorded: "bg-purple-500/10 text-purple-600",
  data_deletion_requested: "bg-red-500/10 text-red-600",
};

const AuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("7d");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  const fetchLogs = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    if (reset) setPage(0);
    setLoading(true);

    try {
      const now = new Date();
      let fromDate: string | undefined;

      switch (timeFilter) {
        case "1h":
          fromDate = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
          break;
        case "24h":
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case "7d":
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case "30d":
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
      }

      let query = supabase
        .from("admin_audit_logs")
        .select("id, admin_id, action, target_profile_id, details, created_at")
        .order("created_at", { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (fromDate) {
        query = query.gte("created_at", fromDate);
      }

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const entries: AuditLogEntry[] = (data || []).map((row) => ({
        ...row,
        details: row.details as Record<string, unknown> | null,
      }));

      if (reset) {
        setLogs(entries);
      } else {
        setLogs((prev) => [...prev, ...entries]);
      }
      setHasMore(entries.length === PAGE_SIZE);
    } catch (e: any) {
      toast.error(`Failed to load audit logs: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [page, timeFilter, actionFilter]);

  useEffect(() => {
    fetchLogs(true);
  }, [timeFilter, actionFilter]);

  const handleLoadMore = () => {
    setPage((p) => p + 1);
    fetchLogs();
  };

  const handleExport = () => {
    const csv = [
      "Timestamp,Admin,Action,Target,Details",
      ...logs.map((log) =>
        [
          new Date(log.created_at).toISOString(),
          log.admin_id,
          log.action,
          log.target_profile_id || "",
          JSON.stringify(log.details || {}),
        ]
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.admin_id.toLowerCase().includes(q) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(q)
    );
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();

  const stats = {
    total: filteredLogs.length,
    critical: filteredLogs.filter((l) =>
      ["db_switch", "server_restart", "emergency_recovery", "user_delete"].includes(l.action)
    ).length,
    security: filteredLogs.filter((l) =>
      ["security_alert", "ip_whitelist_change", "role_change"].includes(l.action)
    ).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            Complete record of all admin actions and system events
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1 text-xs">
          <Download className="h-3 w-3" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/10 p-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">Critical Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Shield className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.security}</p>
                <p className="text-xs text-muted-foreground">Security Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="h-9 w-32 text-xs">
                <Clock className="mr-1.5 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-9 w-40 text-xs">
                <Filter className="mr-1.5 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(true)}
              disabled={loading}
              className="h-9 gap-1"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No audit log entries found
            </p>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2">
                {filteredLogs.map((log) => {
                  const ActionIcon = ACTION_ICONS[log.action] || FileText;
                  const colorClass = ACTION_COLORS[log.action] || "bg-gray-500/10 text-gray-600";

                  return (
                    <div
                      key={log.id}
                      className="rounded-lg border p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedLog(expandedLog === log.id ? null : log.id)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-1.5 ${colorClass}`}>
                          <ActionIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {log.action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </p>
                            {["db_switch", "server_restart", "emergency_recovery"].includes(log.action) && (
                              <Badge variant="destructive" className="text-[9px]">Critical</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()} · Admin: {log.admin_id.slice(0, 8)}...
                          </p>
                        </div>
                        {expandedLog === log.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      {expandedLog === log.id && (
                        <div className="mt-3 rounded bg-muted/50 p-3 space-y-2">
                          <div className="grid gap-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Admin ID</span>
                              <code className="font-mono">{log.admin_id}</code>
                            </div>
                            {log.target_profile_id && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Target</span>
                                <code className="font-mono">{log.target_profile_id}</code>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Timestamp</span>
                              <code className="font-mono">{new Date(log.created_at).toISOString()}</code>
                            </div>
                          </div>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Details</p>
                              <code className="block whitespace-pre-wrap text-[11px] text-foreground bg-background rounded p-2 border">
                                {JSON.stringify(log.details, null, 2)}
                              </code>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="pt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="gap-1"
                  >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;
