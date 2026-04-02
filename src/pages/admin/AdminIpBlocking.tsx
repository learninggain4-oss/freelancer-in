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
  Globe, Clock, User, Loader2, AlertTriangle, UserCheck
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { cn } from "@/lib/utils";
import { safeFmt, safeDist } from "@/lib/admin-date";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const AdminIpBlocking = () => {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
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
      <div 
        className="relative overflow-hidden rounded-2xl p-8 border"
        style={{ 
          background: theme === 'black' 
            ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' 
            : 'linear-gradient(135deg, #ef4444 0%, #fca5a5 100%)',
          borderColor: T.border 
        }}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl">
            <ShieldBan className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Security Firewall</h1>
            <p className="text-white/80 font-medium">Manage IP restrictions and platform protection</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Blocked IPs", value: blockedIps.length, icon: ShieldBan, color: "text-destructive" },
          { 
            label: "Last 24h", 
            value: blockedIps.filter((ip: any) => {
              const d = new Date(ip.blocked_at);
              const now = new Date();
              return now.getTime() - d.getTime() < 24 * 60 * 60 * 1000;
            }).length, 
            icon: AlertTriangle, 
            color: "text-amber-400" 
          },
          { label: "Protection", value: "Active", icon: ShieldCheck, color: "text-emerald-400" },
        ].map((s, idx) => (
          <Card key={idx} style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none">
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="rounded-2xl bg-white/5 p-3 mb-3 border border-white/5">
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <p className="text-sm font-medium" style={{ color: T.sub }}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: T.text }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Block New IP Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none overflow-hidden">
            <CardHeader className="border-b" style={{ borderColor: T.border }}>
              <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ color: T.text }}>
                <Plus className="h-4 w-4 text-destructive" />
                Block New Address
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold" style={{ color: T.sub }}>IP Address</Label>
                <Input
                  placeholder="e.g. 192.168.1.1"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  style={{ background: T.input, borderColor: T.border, color: T.text }}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold" style={{ color: T.sub }}>Reason for blocking</Label>
                <Textarea
                  placeholder="Enter reason (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  style={{ background: T.input, borderColor: T.border, color: T.text }}
                  className="rounded-xl resize-none"
                />
              </div>
              <Button
                onClick={() => blockMutation.mutate()}
                disabled={blockMutation.isPending || !newIp.trim()}
                className="w-full bg-destructive hover:bg-destructive/90 h-11 rounded-xl font-bold"
              >
                {blockMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldBan className="mr-2 h-4 w-4" />}
                Restrict IP Access
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Blocked IPs List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search blocked IPs or reasons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
              style={{ background: T.input, borderColor: T.border, color: T.text }}
            />
          </div>

          <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none overflow-hidden">
            <CardHeader className="flex-row items-center justify-between pb-3 border-b" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold" style={{ color: T.text }}>Active Blocks</CardTitle>
              </div>
              <Badge variant="outline" className="border-white/10" style={{ color: T.sub }}>{filtered.length} Restricted</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24" style={{ color: T.sub }}>
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  Loading database...
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center py-24 text-center" style={{ color: T.sub }}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-6">
                    <ShieldCheck className="h-8 w-8 text-emerald-500 opacity-20" />
                  </div>
                  <p className="text-lg font-medium">All Clear!</p>
                  <p className="text-sm">No IP addresses are currently restricted</p>
                </div>
              ) : (
                filtered.map((ip: any) => (
                  <div key={ip.id} style={{ background: T.nav, borderColor: T.border }} className="flex items-start gap-4 rounded-2xl border p-4 hover:bg-white/5 transition-colors">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/10">
                      <Globe className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-mono tracking-tight" style={{ color: T.text }}>{ip.ip_address}</p>
                      {ip.reason && <p className="text-xs mt-1 leading-relaxed italic opacity-80" style={{ color: T.sub }}>"{ip.reason}"</p>}
                      <div className="flex items-center gap-4 mt-2 text-[11px] font-medium" style={{ color: T.sub }}>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 opacity-50" />
                          {safeFmt(ip.blocked_at, "dd MMM, hh:mm a")}
                        </span>
                        {ip.blocker?.full_name && (
                          <span className="flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 opacity-50" />
                            By: {Array.isArray(ip.blocker.full_name) ? ip.blocker.full_name.join(" ") : ip.blocker.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-9 rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold"
                      onClick={() => setUnblockTarget(ip)}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1.5" /> Unblock
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unblock Confirm */}
      <AlertDialog open={!!unblockTarget} onOpenChange={(o) => !o && setUnblockTarget(null)}>
        <AlertDialogContent className="bg-[#0a0a1a]/95 backdrop-blur-xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Lift IP Restriction?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This will restore access for <span className="font-mono font-bold text-emerald-400">{unblockTarget?.ip_address}</span>. The visitor will be able to access the platform immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unblockTarget && unblockMutation.mutate(unblockTarget.ip_address)}
              disabled={unblockMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
            >
              {unblockMutation.isPending ? "Unblocking..." : "Confirm Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminIpBlocking;
