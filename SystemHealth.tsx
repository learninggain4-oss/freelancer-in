import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Activity, Heart, Server, Database, Globe, Wifi, HardDrive,
  AlertTriangle, CheckCircle, XCircle, RefreshCw, Loader2,
  Monitor, Cpu, Clock, Zap, Shield, BarChart3, TrendingUp,
  AlertCircle, Info,
} from "lucide-react";

interface HealthCheck {
  name: string;
  status: "healthy" | "warning" | "error" | "checking";
  message: string;
  latency?: number;
  lastChecked?: string;
}

interface CompatibilityCheck {
  feature: string;
  supported: boolean;
  fallback?: string;
  severity: "critical" | "warning" | "info";
}

const SystemHealth = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const [compatChecks, setCompatChecks] = useState<CompatibilityCheck[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time metrics
  const [metrics, setMetrics] = useState({
    dbLatency: 0,
    apiLatency: 0,
    authLatency: 0,
    storageLatency: 0,
    uptime: "N/A",
    activeUsers: 0,
    totalRequests24h: 0,
    errorRate: 0,
  });

  // Error log
  const [errorLog, setErrorLog] = useState<{ timestamp: string; type: string; message: string; severity: string }[]>([]);

  const runHealthChecks = useCallback(async () => {
    setIsRunningChecks(true);

    const checks: HealthCheck[] = [
      { name: "Database Connection", status: "checking", message: "Checking..." },
      { name: "Authentication Service", status: "checking", message: "Checking..." },
      { name: "Storage Service", status: "checking", message: "Checking..." },
      { name: "Edge Functions", status: "checking", message: "Checking..." },
      { name: "Realtime Service", status: "checking", message: "Checking..." },
      { name: "API Gateway", status: "checking", message: "Checking..." },
    ];
    setHealthChecks([...checks]);

    // Database check
    try {
      const start = performance.now();
      const { error } = await supabase.from("app_settings").select("key").limit(1);
      const latency = Math.round(performance.now() - start);
      checks[0] = {
        name: "Database Connection",
        status: error ? "error" : latency > 500 ? "warning" : "healthy",
        message: error ? error.message : `Connected - ${latency}ms`,
        latency,
        lastChecked: new Date().toISOString(),
      };
      setMetrics((m) => ({ ...m, dbLatency: latency }));
    } catch (e: any) {
      checks[0] = { name: "Database Connection", status: "error", message: e.message, lastChecked: new Date().toISOString() };
    }
    setHealthChecks([...checks]);

    // Auth check
    try {
      const start = performance.now();
      const { error } = await supabase.auth.getSession();
      const latency = Math.round(performance.now() - start);
      checks[1] = {
        name: "Authentication Service",
        status: error ? "error" : latency > 500 ? "warning" : "healthy",
        message: error ? error.message : `Active - ${latency}ms`,
        latency,
        lastChecked: new Date().toISOString(),
      };
      setMetrics((m) => ({ ...m, authLatency: latency }));
    } catch (e: any) {
      checks[1] = { name: "Authentication Service", status: "error", message: e.message, lastChecked: new Date().toISOString() };
    }
    setHealthChecks([...checks]);

    // Storage check
    try {
      const start = performance.now();
      const { error } = await supabase.storage.listBuckets();
      const latency = Math.round(performance.now() - start);
      checks[2] = {
        name: "Storage Service",
        status: error ? "error" : latency > 1000 ? "warning" : "healthy",
        message: error ? error.message : `Available - ${latency}ms`,
        latency,
        lastChecked: new Date().toISOString(),
      };
      setMetrics((m) => ({ ...m, storageLatency: latency }));
    } catch (e: any) {
      checks[2] = { name: "Storage Service", status: "error", message: e.message, lastChecked: new Date().toISOString() };
    }
    setHealthChecks([...checks]);

    // Edge Functions check
    try {
      const start = performance.now();
      const { error } = await supabase.functions.invoke("admin-totp", {
        body: { action: "check_status" },
      });
      const latency = Math.round(performance.now() - start);
      checks[3] = {
        name: "Edge Functions",
        status: latency > 2000 ? "warning" : "healthy",
        message: `Responsive - ${latency}ms`,
        latency,
        lastChecked: new Date().toISOString(),
      };
    } catch {
      checks[3] = {
        name: "Edge Functions",
        status: "warning",
        message: "Function responded with non-success (may need auth)",
        lastChecked: new Date().toISOString(),
      };
    }
    setHealthChecks([...checks]);

    // Realtime check
    try {
      const start = performance.now();
      const channel = supabase.channel("health-check");
      await new Promise<void>((resolve) => {
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") resolve();
        });
        setTimeout(resolve, 3000); // Timeout after 3s
      });
      const latency = Math.round(performance.now() - start);
      supabase.removeChannel(channel);
      checks[4] = {
        name: "Realtime Service",
        status: latency > 2000 ? "warning" : "healthy",
        message: `Connected - ${latency}ms`,
        latency,
        lastChecked: new Date().toISOString(),
      };
    } catch {
      checks[4] = {
        name: "Realtime Service",
        status: "warning",
        message: "Could not establish realtime connection",
        lastChecked: new Date().toISOString(),
      };
    }
    setHealthChecks([...checks]);

    // API Gateway check
    try {
      const start = performance.now();
      const res = await fetch(`https://maysttckdfnnzvfeujaj.supabase.co/rest/v1/`, {
        headers: {
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1heXN0dGNrZGZubnp2ZmV1amFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTg1NTksImV4cCI6MjA4NjI3NDU1OX0.tIawlM0-rePDtGD-EKT1klugKYZvaEnJPlQ-emmwxTo",
        },
      });
      const latency = Math.round(performance.now() - start);
      checks[5] = {
        name: "API Gateway",
        status: res.ok ? (latency > 500 ? "warning" : "healthy") : "error",
        message: res.ok ? `Reachable - ${latency}ms` : `HTTP ${res.status}`,
        latency,
        lastChecked: new Date().toISOString(),
      };
      setMetrics((m) => ({ ...m, apiLatency: latency }));
    } catch (e: any) {
      checks[5] = { name: "API Gateway", status: "error", message: e.message, lastChecked: new Date().toISOString() };
    }
    setHealthChecks([...checks]);

    // Fetch active users count
    try {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "approved");
      setMetrics((m) => ({ ...m, activeUsers: count || 0 }));
    } catch {
      // Ignore
    }

    setIsRunningChecks(false);
  }, []);

  const runCompatibilityChecks = useCallback(() => {
    const checks: CompatibilityCheck[] = [
      {
        feature: "localStorage",
        supported: typeof localStorage !== "undefined",
        fallback: "In-memory storage",
        severity: "critical",
      },
      {
        feature: "WebSocket (Realtime)",
        supported: typeof WebSocket !== "undefined",
        fallback: "HTTP polling",
        severity: "warning",
      },
      {
        feature: "Service Worker (PWA)",
        supported: "serviceWorker" in navigator,
        fallback: "Standard web app",
        severity: "info",
      },
      {
        feature: "Web Crypto API",
        supported: typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined",
        fallback: "Reduced encryption capability",
        severity: "warning",
      },
      {
        feature: "Clipboard API",
        supported: typeof navigator.clipboard !== "undefined",
        fallback: "Manual copy",
        severity: "info",
      },
      {
        feature: "Geolocation API",
        supported: "geolocation" in navigator,
        fallback: "IP-based location",
        severity: "info",
      },
      {
        feature: "Camera API (MediaDevices)",
        supported: typeof navigator.mediaDevices !== "undefined",
        fallback: "File upload only",
        severity: "info",
      },
      {
        feature: "Push Notifications",
        supported: "Notification" in window,
        fallback: "In-app notifications only",
        severity: "warning",
      },
      {
        feature: "IndexedDB",
        supported: typeof indexedDB !== "undefined",
        fallback: "localStorage fallback",
        severity: "info",
      },
      {
        feature: "HTTPS Connection",
        supported: location.protocol === "https:" || location.hostname === "localhost",
        fallback: "Security features may be limited",
        severity: "critical",
      },
    ];
    setCompatChecks(checks);
  }, []);

  useEffect(() => {
    runHealthChecks();
    runCompatibilityChecks();
  }, [runHealthChecks, runCompatibilityChecks]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(runHealthChecks, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, runHealthChecks]);

  const overallHealth = healthChecks.length
    ? healthChecks.some((c) => c.status === "error")
      ? "error"
      : healthChecks.some((c) => c.status === "warning")
      ? "warning"
      : healthChecks.some((c) => c.status === "checking")
      ? "checking"
      : "healthy"
    : "checking";

  const healthColor = {
    healthy: "text-green-600",
    warning: "text-amber-500",
    error: "text-destructive",
    checking: "text-muted-foreground",
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">System Health & Monitoring</h2>
          <p className="text-sm text-muted-foreground">
            Real-time system diagnostics, performance monitoring, and compatibility checks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-1 text-xs"
          >
            {autoRefresh ? <Pause className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
            {autoRefresh ? "Pause" : "Auto-Refresh"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={runHealthChecks}
            disabled={isRunningChecks}
            className="gap-1 text-xs"
          >
            {isRunningChecks ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div
        className={`flex items-center gap-3 rounded-lg border p-4 ${
          overallHealth === "healthy"
            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
            : overallHealth === "warning"
            ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
            : overallHealth === "error"
            ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
            : "border-border"
        }`}
      >
        <Heart className={`h-5 w-5 ${healthColor[overallHealth]}`} />
        <div>
          <p className={`text-sm font-medium ${healthColor[overallHealth]}`}>
            System {overallHealth === "healthy" ? "Healthy" : overallHealth === "warning" ? "Warning" : overallHealth === "error" ? "Error" : "Checking..."}
          </p>
          <p className="text-xs text-muted-foreground">
            {healthChecks.filter((c) => c.status === "healthy").length}/{healthChecks.length} services healthy
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="services" className="text-xs">Services</TabsTrigger>
          <TabsTrigger value="compatibility" className="text-xs">Compatibility</TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-xs">Diagnostics</TabsTrigger>
        </TabsList>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Latency Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Database", value: `${metrics.dbLatency}ms`, icon: Database, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "API Gateway", value: `${metrics.apiLatency}ms`, icon: Globe, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "Auth Service", value: `${metrics.authLatency}ms`, icon: Shield, color: "text-purple-500", bg: "bg-purple-500/10" },
              { label: "Storage", value: `${metrics.storageLatency}ms`, icon: HardDrive, color: "text-amber-500", bg: "bg-amber-500/10" },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg ${m.bg} p-2`}>
                      <m.icon className={`h-4 w-4 ${m.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.label} Latency</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Monitor className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.activeUsers}</p>
                    <p className="text-xs text-muted-foreground">Approved Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <Zap className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{healthChecks.filter((c) => c.status === "healthy").length}</p>
                    <p className="text-xs text-muted-foreground">Services Online</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-500/10 p-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{healthChecks.filter((c) => c.status === "error").length}</p>
                    <p className="text-xs text-muted-foreground">Service Errors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SERVICES TAB */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-4 w-4 text-primary" />
                Service Health Checks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthChecks.map((check) => (
                <div key={check.name} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={check.status} />
                      <div>
                        <p className="text-sm font-medium">{check.name}</p>
                        <p className="text-xs text-muted-foreground">{check.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {check.latency !== undefined && (
                        <Badge
                          variant={check.latency < 200 ? "default" : check.latency < 500 ? "secondary" : "destructive"}
                          className="text-[10px]"
                        >
                          {check.latency}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                  {check.latency !== undefined && (
                    <div className="mt-2">
                      <Progress
                        value={Math.min((check.latency / 2000) * 100, 100)}
                        className="h-1"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Connection Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wifi className="h-4 w-4 text-primary" />
                Connection Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Network Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`h-2 w-2 rounded-full ${navigator.onLine ? "bg-green-500" : "bg-red-500"}`} />
                    <p className="text-sm font-medium">{navigator.onLine ? "Online" : "Offline"}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Connection Type</p>
                  <p className="text-sm font-medium mt-1">
                    {(navigator as any).connection?.effectiveType || "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPATIBILITY TAB */}
        <TabsContent value="compatibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Monitor className="h-4 w-4 text-primary" />
                Platform Compatibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Checks browser and runtime capabilities. Features with fallbacks will still work with reduced functionality.
              </p>
              {compatChecks.map((check) => (
                <div
                  key={check.feature}
                  className={`rounded-lg border p-3 ${
                    !check.supported
                      ? check.severity === "critical"
                        ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                        : check.severity === "warning"
                        ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
                        : ""
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {check.supported ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : check.severity === "critical" ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : check.severity === "warning" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Info className="h-4 w-4 text-blue-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{check.feature}</p>
                        {!check.supported && check.fallback && (
                          <p className="text-xs text-muted-foreground">
                            Fallback: {check.fallback}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={check.supported ? "default" : check.severity === "critical" ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {check.supported ? "Supported" : "Unsupported"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Environment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4 text-primary" />
                Environment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                {[
                  { label: "Browser", value: navigator.userAgent.split(")")[0].split("(")[1] || "Unknown" },
                  { label: "Platform", value: navigator.platform || "Unknown" },
                  { label: "Language", value: navigator.language },
                  { label: "Cookies Enabled", value: navigator.cookieEnabled ? "Yes" : "No" },
                  { label: "Screen Resolution", value: `${screen.width}x${screen.height}` },
                  { label: "Color Depth", value: `${screen.colorDepth}-bit` },
                  { label: "Timezone", value: Intl.DateTimeFormat().resolvedOptions().timeZone },
                  { label: "Protocol", value: location.protocol },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between rounded border bg-muted/30 p-2.5">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono font-medium truncate ml-2 max-w-[60%] text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DIAGNOSTICS TAB */}
        <TabsContent value="diagnostics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="h-4 w-4 text-primary" />
                System Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Run diagnostic checks to identify potential issues.
              </p>

              <Button
                onClick={async () => {
                  toast.info("Running full system diagnostics...");
                  await runHealthChecks();
                  runCompatibilityChecks();
                  toast.success("Diagnostics complete");
                }}
                disabled={isRunningChecks}
                className="gap-1"
              >
                {isRunningChecks ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                Run Full Diagnostics
              </Button>

              {/* Diagnostic Results Summary */}
              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="text-sm font-semibold mb-3">Diagnostic Summary</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Services Health</span>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">{healthChecks.filter((c) => c.status === "healthy").length} healthy</span>
                        <span className="text-amber-500">{healthChecks.filter((c) => c.status === "warning").length} warning</span>
                        <span className="text-destructive">{healthChecks.filter((c) => c.status === "error").length} error</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Platform Compatibility</span>
                      <span>
                        {compatChecks.filter((c) => c.supported).length}/{compatChecks.length} features supported
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Avg. API Latency</span>
                      <span className="font-mono">
                        {Math.round(
                          (metrics.dbLatency + metrics.apiLatency + metrics.authLatency + metrics.storageLatency) / 4
                        )}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Network Status</span>
                      <Badge variant={navigator.onLine ? "default" : "destructive"} className="text-xs">
                        {navigator.onLine ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                  <div className="space-y-2">
                    {healthChecks
                      .filter((c) => c.status === "warning" || c.status === "error")
                      .map((c) => (
                        <div key={c.name} className="flex items-start gap-2 text-xs">
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                          <span>
                            <strong>{c.name}:</strong> {c.message}
                            {c.latency && c.latency > 500 && " - Consider checking network or service performance."}
                          </span>
                        </div>
                      ))}
                    {compatChecks
                      .filter((c) => !c.supported && c.severity !== "info")
                      .map((c) => (
                        <div key={c.feature} className="flex items-start gap-2 text-xs">
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                          <span>
                            <strong>{c.feature}:</strong> Not supported.{" "}
                            {c.fallback && `Fallback: ${c.fallback}`}
                          </span>
                        </div>
                      ))}
                    {healthChecks.every((c) => c.status === "healthy") &&
                      compatChecks.every((c) => c.supported || c.severity === "info") && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          All systems operational. No issues detected.
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemHealth;
