import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Globe, Monitor, Smartphone, Tablet, Users, UserCheck, Eye, RefreshCw, ShieldBan, ShieldCheck, MapPin, Activity } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt, safeDist } from "@/lib/admin-date";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

interface SiteVisitor {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  page_path: string | null;
  referrer: string | null;
  profile_id: string | null;
  visited_at: string;
  city: string | null;
  country: string | null;
  device_type: string | null;
  profile?: {
    full_name: string[];
    user_type: string;
    user_code: string[];
  } | null;
}

interface BlockedIp {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_at: string;
  blocked_by: string | null;
}

const DeviceIcon = ({ type }: { type: string | null }) => {
  switch (type) {
    case "mobile": return <Smartphone className="h-4 w-4" />;
    case "tablet": return <Tablet className="h-4 w-4" />;
    default: return <Monitor className="h-4 w-4" />;
  }
};

const AdminVisitors = () => {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-visitors", page, search],
    queryFn: async () => {
      let query = (supabase as any)
        .from("site_visitors")
        .select("*, profile:profiles!site_visitors_profile_id_fkey(full_name, user_type, user_code)")
        .order("visited_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (search) {
        query = query.or(`ip_address.ilike.%${search}%,city.ilike.%${search}%,country.ilike.%${search}%,page_path.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as SiteVisitor[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-visitors-stats"],
    queryFn: async () => {
      const { count: totalVisits } = await (supabase as any)
        .from("site_visitors").select("*", { count: "exact", head: true });
      const { count: registeredVisits } = await (supabase as any)
        .from("site_visitors").select("*", { count: "exact", head: true }).not("profile_id", "is", null);
      const { data: uniqueIps } = await (supabase as any)
        .from("site_visitors").select("ip_address").not("ip_address", "is", null);
      const uniqueCount = new Set((uniqueIps || []).map((r: any) => r.ip_address)).size;
      return { totalVisits: totalVisits || 0, registeredVisits: registeredVisits || 0, uniqueVisitors: uniqueCount };
    },
  });

  const { data: blockedIps, isLoading: blockedLoading } = useQuery({
    queryKey: ["admin-blocked-ips"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("blocked_ips")
        .select("*")
        .order("blocked_at", { ascending: false });
      if (error) throw error;
      return data as BlockedIp[];
    },
  });

  const blockedSet = new Set((blockedIps || []).map((b) => b.ip_address));

  const blockMutation = useMutation({
    mutationFn: async ({ ip, action }: { ip: string; action: "block" | "unblock" }) => {
      const { data, error } = await supabase.functions.invoke("manage-ip-block", {
        body: { action, ip_address: ip },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.action === "block" ? "IP Blocked" : "IP Unblocked" });
      qc.invalidateQueries({ queryKey: ["admin-blocked-ips"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div 
        className="relative overflow-hidden rounded-3xl p-8 border"
        style={{ 
          background: theme === 'black' 
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
            : 'linear-gradient(135deg, #6366f1 0%, #a5b4fc 100%)',
          borderColor: T.border 
        }}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Visitor Traffic</h1>
              <p className="text-white/80 font-medium">Real-time monitoring and security management</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Visits", value: stats?.totalVisits ?? "—", icon: Eye, color: "text-blue-400" },
          { label: "Unique Visitors", value: stats?.uniqueVisitors ?? "—", icon: Users, color: "text-emerald-400" },
          { label: "Registered Visitors", value: stats?.registeredVisits ?? "—", icon: UserCheck, color: "text-violet-400" },
        ].map((s, idx) => (
          <Card key={idx} style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-white/5 p-3.5 border border-white/5">
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: T.sub }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: T.text }}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="visitors">
        <TabsList style={{ background: T.card, borderColor: T.border }} className="border p-1 rounded-xl h-11">
          <TabsTrigger value="visitors" className="rounded-lg h-9 px-6 data-[state=active]:bg-primary data-[state=active]:text-white">All Visitors</TabsTrigger>
          <TabsTrigger value="blocked" className="rounded-lg h-9 px-6 data-[state=active]:bg-destructive data-[state=active]:text-white">
            Blocked IPs
            {blockedIps?.length ? <Badge className="ml-2 h-5 min-w-[20px] px-1 bg-white/20 text-white border-none">{blockedIps.length}</Badge> : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visitors" className="space-y-4 mt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by IP, city, country, page..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }} 
              className="pl-11"
              style={{ background: T.input, borderColor: T.border, color: T.text }}
            />
          </div>

          <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24" style={{ color: T.sub }}>
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  Loading visitors...
                </div>
              ) : !data?.length ? (
                <div className="py-24 text-center" style={{ color: T.sub }}>No visitors found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader style={{ background: T.nav }}>
                      <TableRow style={{ borderColor: T.border }} className="hover:bg-transparent">
                        <TableHead style={{ color: T.sub }}>Visitor</TableHead>
                        <TableHead style={{ color: T.sub }} className="hidden md:table-cell">Location</TableHead>
                        <TableHead style={{ color: T.sub }} className="hidden lg:table-cell">Page Path</TableHead>
                        <TableHead style={{ color: T.sub }}>Account</TableHead>
                        <TableHead style={{ color: T.sub }} className="hidden sm:table-cell text-center">Device</TableHead>
                        <TableHead style={{ color: T.sub }}>Time</TableHead>
                        <TableHead style={{ color: T.sub }} className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((visitor) => (
                        <TableRow key={visitor.id} style={{ borderColor: T.border }} className="hover:bg-white/5 transition-colors">
                          <TableCell>
                            <div className="space-y-0.5">
                              {visitor.profile ? (
                                <p className="font-semibold" style={{ color: T.text }}>{visitor.profile.full_name?.[0]}</p>
                              ) : (
                                <p className="text-sm italic" style={{ color: T.sub }}>Anonymous</p>
                              )}
                              <p className="text-xs font-mono opacity-60" style={{ color: T.sub }}>{visitor.ip_address || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 opacity-50" style={{ color: T.sub }} />
                              <span className="text-sm font-medium" style={{ color: T.text }}>
                                {[visitor.city, visitor.country].filter(Boolean).join(", ") || "Unknown"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <code className="text-[10px] px-2 py-1 rounded-lg border border-white/5 font-mono" style={{ background: T.nav, color: T.sub }}>
                              {visitor.page_path || "/"}
                            </code>
                          </TableCell>
                          <TableCell>
                            {visitor.profile ? (
                              <div className="flex flex-col gap-1">
                                <Badge style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", borderColor: "transparent" }} className="text-[10px] w-fit">
                                  {visitor.profile.user_type}
                                </Badge>
                                <span className="text-[10px] font-mono opacity-50" style={{ color: T.sub }}>{visitor.profile.user_code?.[0]}</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-[10px] opacity-40 border-white/10" style={{ color: T.sub }}>Guest</Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-center">
                            <div className="flex justify-center" style={{ color: T.sub }}>
                              <DeviceIcon type={visitor.device_type} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col whitespace-nowrap">
                              <span className="text-sm font-medium" style={{ color: T.text }}>{safeFmt(visitor.visited_at, "dd MMM, HH:mm")}</span>
                              <span className="text-[10px] opacity-50" style={{ color: T.sub }}>Visited</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {visitor.ip_address && (
                              blockedSet.has(visitor.ip_address) ? (
                                <Button size="sm" variant="outline"
                                  className="h-8 rounded-lg border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                  disabled={blockMutation.isPending}
                                  onClick={() => blockMutation.mutate({ ip: visitor.ip_address!, action: "unblock" })}>
                                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Unblock
                                </Button>
                              ) : (
                                <Button size="sm" variant="destructive"
                                  className="h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 shadow-none"
                                  disabled={blockMutation.isPending}
                                  onClick={() => blockMutation.mutate({ ip: visitor.ip_address!, action: "block" })}>
                                  <ShieldBan className="mr-1.5 h-3.5 w-3.5" /> Block
                                </Button>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 0} 
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white"
            >
              Previous
            </Button>
            <span className="text-sm font-medium" style={{ color: T.sub }}>Page {page + 1}</span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!data || data.length < pageSize} 
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white"
            >
              Next
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="blocked" className="mt-6">
          <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none overflow-hidden">
            <CardContent className="p-0">
              {blockedLoading ? (
                <div className="flex flex-col items-center justify-center py-24" style={{ color: T.sub }}>
                  <Loader2 className="h-8 w-8 animate-spin text-destructive mb-4" />
                  Loading blocked IPs...
                </div>
              ) : !blockedIps?.length ? (
                <div className="py-24 text-center" style={{ color: T.sub }}>No blocked IPs found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader style={{ background: T.nav }}>
                      <TableRow style={{ borderColor: T.border }} className="hover:bg-transparent">
                        <TableHead style={{ color: T.sub }}>IP Address</TableHead>
                        <TableHead style={{ color: T.sub }}>Reason</TableHead>
                        <TableHead style={{ color: T.sub }}>Blocked At</TableHead>
                        <TableHead style={{ color: T.sub }} className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blockedIps.map((b) => (
                        <TableRow key={b.id} style={{ borderColor: T.border }} className="hover:bg-white/5 transition-colors">
                          <TableCell><span className="font-mono text-sm font-bold" style={{ color: T.text }}>{b.ip_address}</span></TableCell>
                          <TableCell><span className="text-sm" style={{ color: T.sub }}>{b.reason || "No reason specified"}</span></TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium" style={{ color: T.text }}>{safeFmt(b.blocked_at, "dd MMM yyyy")}</span>
                              <span className="text-[10px] opacity-50" style={{ color: T.sub }}>{safeFmt(b.blocked_at, "HH:mm")}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline"
                              className="h-8 rounded-lg border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              disabled={blockMutation.isPending}
                              onClick={() => blockMutation.mutate({ ip: b.ip_address, action: "unblock" })}>
                              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Unblock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVisitors;
