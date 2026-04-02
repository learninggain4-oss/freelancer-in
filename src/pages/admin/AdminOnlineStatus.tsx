import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Wifi, WifiOff, Users, ChevronLeft, ChevronRight, Activity, Globe } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt, safeDist } from "@/lib/admin-date";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const PAGE_SIZE = 15;
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

const AdminOnlineStatus = () => {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");
  const [page, setPage] = useState(1);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-online-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, user_type, email, approval_status, last_seen_at, profile_photo_path")
        .order("last_seen_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30_000,
  });

  const now = Date.now();

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    return now - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
  };

  const filtered = users.filter((u: any) => {
    const online = isOnline(u.last_seen_at);
    if (filter === "online" && !online) return false;
    if (filter === "offline" && online) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    const name = (u.full_name || []).join(" ").toLowerCase();
    const code = (u.user_code || []).join("").toLowerCase();
    return name.includes(q) || code.includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onlineCount = users.filter((u: any) => isOnline(u.last_seen_at)).length;
  const offlineCount = users.length - onlineCount;

  const getName = (u: any) => (u.full_name || []).join(" ") || "—";
  const getCode = (u: any) => (u.user_code || []).join("") || "—";

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 border"
        style={{ 
          background: theme === 'black' 
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
            : 'linear-gradient(135deg, #6366f1 0%, #a5b4fc 100%)',
          borderColor: T.border 
        }}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Online Presence</h1>
            <p className="text-white/80 font-medium">Real-time platform activity and user status</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {[
          { label: "Total Users", value: users.length, icon: Users, color: "text-blue-400" },
          { label: "Online Now", value: onlineCount, icon: Wifi, color: "text-emerald-400" },
          { label: "Offline", value: offlineCount, icon: WifiOff, color: "text-slate-400" },
        ].map((s, idx) => (
          <Card key={idx} style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: T.sub }}>{s.label}</p>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-bold" style={{ color: T.text }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
              style={{ background: T.input, borderColor: T.border, color: T.text }}
            />
          </div>
          <Select value={filter} onValueChange={(v: any) => { setFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]" style={{ background: T.input, borderColor: T.border, color: T.text }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: theme === 'black' ? '#1a1a2e' : '#fff', borderColor: T.border }}>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader style={{ background: T.nav }}>
                  <TableRow style={{ borderColor: T.border }} className="hover:bg-transparent">
                    <TableHead style={{ color: T.sub }}>Presence</TableHead>
                    <TableHead style={{ color: T.sub }}>User Info</TableHead>
                    <TableHead style={{ color: T.sub }}>Type</TableHead>
                    <TableHead style={{ color: T.sub }}>Email Contact</TableHead>
                    <TableHead style={{ color: T.sub }}>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} style={{ borderColor: T.border }}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-20 opacity-20" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-24" style={{ color: T.sub }}>
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((u: any) => {
                      const online = isOnline(u.last_seen_at);
                      return (
                        <TableRow key={u.id} style={{ borderColor: T.border }} className="hover:bg-white/5 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-slate-600"}`} />
                              <span className={`text-xs font-bold uppercase tracking-wider ${online ? "text-emerald-400" : "text-slate-500"}`}>
                                {online ? "Online" : "Offline"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold" style={{ color: T.text }}>{getName(u)}</p>
                              <p className="text-xs font-mono opacity-60" style={{ color: T.sub }}>{getCode(u)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize border-white/10" style={{ color: T.sub }}>{u.user_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm opacity-80" style={{ color: T.text }}>{u.email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col whitespace-nowrap">
                              <span className="text-sm font-medium" style={{ color: T.text }}>
                                {u.last_seen_at
                                  ? safeDist(u.last_seen_at, "—", { addSuffix: true })
                                  : "Never"}
                              </span>
                              {u.last_seen_at && (
                                <span className="text-[10px] opacity-50" style={{ color: T.sub }}>
                                  {safeFmt(u.last_seen_at, "HH:mm, dd MMM")}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: T.sub }}>
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              style={{ background: T.card, borderColor: T.border }}
              className="rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              disabled={page === totalPages} 
              onClick={() => setPage(page + 1)}
              style={{ background: T.card, borderColor: T.border }}
              className="rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOnlineStatus;
