import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Shield, ShieldBan, ShieldCheck, Search, Plus, Trash2,
  Globe, Clock, User, Loader2, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminIpBlocking = () => {
  const [newIp, setNewIp] = useState("");
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [unblockTarget, setUnblockTarget] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: blockedIps = [], isLoading } = useQuery({
    queryKey: ["admin-blocked-ips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_ips")
        .select("*, blocker:blocked_by(full_name)")
        .order("blocked_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      if (!newIp.trim()) throw new Error("IP address is required");
      const res = await supabase.functions.invoke("manage-ip-block", {
        body: { action: "block", ip_address: newIp.trim(), reason: reason.trim() || null },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      toast.success(`IP ${newIp} blocked`);
      setNewIp("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-blocked-ips"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const unblockMutation = useMutation({
    mutationFn: async (ip: string) => {
      const res = await supabase.functions.invoke("manage-ip-block", {
        body: { action: "unblock", ip_address: ip },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      toast.success("IP unblocked");
      setUnblockTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-blocked-ips"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = blockedIps.filter((ip: any) =>
    ip.ip_address?.toLowerCase().includes(search.toLowerCase()) ||
    ip.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/90 via-destructive/70 to-destructive/50 p-6 text-destructive-foreground">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <ShieldBan className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">IP Blocking</h1>
            <p className="text-sm opacity-80">{blockedIps.length} IPs currently blocked</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 mb-2">
              <ShieldBan className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-foreground">{blockedIps.length}</p>
            <p className="text-[10px] text-muted-foreground">Blocked</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 mb-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {blockedIps.filter((ip: any) => {
                const d = new Date(ip.blocked_at);
                const now = new Date();
                return now.getTime() - d.getTime() < 24 * 60 * 60 * 1000;
              }).length}
            </p>
            <p className="text-[10px] text-muted-foreground">Last 24h</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 mb-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">Active</p>
            <p className="text-[10px] text-muted-foreground">Protection</p>
          </CardContent>
        </Card>
      </div>

      {/* Block New IP */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex-row items-center gap-2 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
            <Plus className="h-4 w-4 text-destructive" />
          </div>
          <CardTitle className="text-sm font-semibold">Block New IP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address (e.g. 192.168.1.1)"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              className="flex-1"
            />
          </div>
          <Textarea
            placeholder="Reason for blocking (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
          <Button
            onClick={() => blockMutation.mutate()}
            disabled={blockMutation.isPending || !newIp.trim()}
            className="w-full bg-destructive hover:bg-destructive/90"
          >
            {blockMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldBan className="mr-2 h-4 w-4" />}
            Block IP Address
          </Button>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search blocked IPs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Blocked IPs List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex-row items-center gap-2 pb-3">
          <Shield className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Blocked IPs</CardTitle>
          <Badge variant="secondary" className="ml-auto text-[10px]">{filtered.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <ShieldCheck className="h-12 w-12 text-accent/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No blocked IPs</p>
              <p className="text-xs text-muted-foreground">All clear!</p>
            </div>
          ) : (
            filtered.map((ip: any) => (
              <div key={ip.id} className="flex items-start gap-3 rounded-xl border p-3 hover:bg-muted/30 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                  <Globe className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground font-mono">{ip.ip_address}</p>
                  {ip.reason && <p className="text-xs text-muted-foreground mt-0.5">{ip.reason}</p>}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(ip.blocked_at), "dd MMM yyyy, hh:mm a")}
                    </span>
                    {ip.blocker?.full_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {Array.isArray(ip.blocker.full_name) ? ip.blocker.full_name.join(" ") : ip.blocker.full_name}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-accent border-accent/30 hover:bg-accent/10"
                  onClick={() => setUnblockTarget(ip)}
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Unblock
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Unblock Confirm */}
      <AlertDialog open={!!unblockTarget} onOpenChange={(o) => !o && setUnblockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock IP Address?</AlertDialogTitle>
            <AlertDialogDescription>
              This will allow <span className="font-mono font-bold">{unblockTarget?.ip_address}</span> to access the website again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unblockTarget && unblockMutation.mutate(unblockTarget.ip_address)}
              disabled={unblockMutation.isPending}
            >
              {unblockMutation.isPending ? "Unblocking..." : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminIpBlocking;
