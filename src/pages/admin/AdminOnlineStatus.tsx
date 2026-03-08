import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Wifi, WifiOff, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 15;
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

const AdminOnlineStatus = () => {
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
      <h2 className="text-2xl font-bold text-foreground">Online Status</h2>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Online Now</CardTitle>
            <Wifi className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">{onlineCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offline</CardTitle>
            <WifiOff className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">{offlineCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v: any) => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((u: any) => {
                    const online = isOnline(u.last_seen_at);
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-accent animate-pulse" : "bg-muted-foreground/40"}`} />
                            <span className={`text-xs font-medium ${online ? "text-accent" : "text-muted-foreground"}`}>
                              {online ? "Online" : "Offline"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{getName(u)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{getCode(u)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{u.user_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {u.last_seen_at
                            ? formatDistanceToNow(new Date(u.last_seen_at), { addSuffix: true })
                            : "Never"}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOnlineStatus;
