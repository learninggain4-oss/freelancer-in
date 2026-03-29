import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Globe, Monitor, Smartphone, Tablet, Users, UserCheck, Eye, RefreshCw, ShieldBan, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

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
    case "mobile": return <Smartphone className="h-4 w-4 text-muted-foreground" />;
    case "tablet": return <Tablet className="h-4 w-4 text-muted-foreground" />;
    default: return <Monitor className="h-4 w-4 text-muted-foreground" />;
  }
};

const AdminVisitors = () => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Visitors</h1>
          <p className="text-sm text-muted-foreground">Track visitors and manage IP blocks</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-primary/10 p-2.5"><Eye className="h-5 w-5 text-primary" /></div>
          <div><p className="text-sm text-muted-foreground">Total Visits</p><p className="text-2xl font-bold">{stats?.totalVisits ?? "—"}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-accent/10 p-2.5"><Users className="h-5 w-5 text-accent" /></div>
          <div><p className="text-sm text-muted-foreground">Unique Visitors</p><p className="text-2xl font-bold">{stats?.uniqueVisitors ?? "—"}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-emerald-500/10 p-2.5"><UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
          <div><p className="text-sm text-muted-foreground">Registered Visitors</p><p className="text-2xl font-bold">{stats?.registeredVisits ?? "—"}</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="visitors">
        <TabsList>
          <TabsTrigger value="visitors">All Visitors</TabsTrigger>
          <TabsTrigger value="blocked">
            Blocked IPs
            {blockedIps?.length ? <Badge variant="destructive" className="ml-2 text-xs">{blockedIps.length}</Badge> : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visitors" className="space-y-4 mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by IP, city, country, page..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
          </div>

          <Card><CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : !data?.length ? (
              <div className="py-12 text-center text-muted-foreground">No visitors found</div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden lg:table-cell">Page</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="hidden sm:table-cell">Device</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {data.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          {visitor.profile ? (
                            <p className="font-medium text-foreground">{visitor.profile.full_name?.[0]}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Anonymous</p>
                          )}
                          <p className="text-xs text-muted-foreground font-mono">{visitor.ip_address || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{[visitor.city, visitor.country].filter(Boolean).join(", ") || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{visitor.page_path || "/"}</code>
                      </TableCell>
                      <TableCell>
                        {visitor.profile ? (
                          <Badge variant="default" className="text-xs">{visitor.profile.user_type} • {visitor.profile.user_code?.[0]}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell"><DeviceIcon type={visitor.device_type} /></TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(visitor.visited_at), "dd MMM, HH:mm")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {visitor.ip_address && (
                          blockedSet.has(visitor.ip_address) ? (
                            <Button size="sm" variant="outline"
                              disabled={blockMutation.isPending}
                              onClick={() => blockMutation.mutate({ ip: visitor.ip_address!, action: "unblock" })}>
                              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Unblock
                            </Button>
                          ) : (
                            <Button size="sm" variant="destructive"
                              disabled={blockMutation.isPending}
                              onClick={() => blockMutation.mutate({ ip: visitor.ip_address!, action: "block" })}>
                              <ShieldBan className="mr-1 h-3.5 w-3.5" /> Block
                            </Button>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page + 1}</span>
            <Button variant="outline" size="sm" disabled={!data || data.length < pageSize} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="blocked" className="mt-4">
          <Card><CardContent className="p-0">
            {blockedLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : !blockedIps?.length ? (
              <div className="py-12 text-center text-muted-foreground">No blocked IPs</div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Blocked At</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {blockedIps.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell><span className="font-mono text-sm">{b.ip_address}</span></TableCell>
                      <TableCell><span className="text-sm text-muted-foreground">{b.reason || "—"}</span></TableCell>
                      <TableCell><span className="text-sm text-muted-foreground">{format(new Date(b.blocked_at), "dd MMM yyyy, HH:mm")}</span></TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline"
                          disabled={blockMutation.isPending}
                          onClick={() => blockMutation.mutate({ ip: b.ip_address, action: "unblock" })}>
                          <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVisitors;
