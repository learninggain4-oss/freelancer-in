import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare, ArrowLeft, ClipboardList, Clock, CheckCircle2,
  XCircle, ChevronRight, Send, Inbox,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  warm:  { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", input:"#fffdf7", nav:"#fef0d0", badge:"rgba(217,119,6,.1)", badgeFg:"#b45309" },
  forest: { bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", input:"#ffffff", nav:"#dcfce7", badge:"rgba(22,163,74,.1)", badgeFg:"#15803d" },
  ocean: { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", input:"#ffffff", nav:"#e0f2fe", badge:"rgba(14,165,233,.1)", badgeFg:"#0369a1" },
};

const getStatusConfig = (isDark: boolean): Record<string, { color: string; bg: string; border: string; icon: any; label: string }> => ({
  pending:  { color: isDark ? "#fbbf24" : "#b45309", bg: isDark ? "rgba(251,191,36,0.15)" : "rgba(180,83,9,0.1)",   border: isDark ? "rgba(251,191,36,0.3)" : "rgba(180,83,9,0.25)",   icon: Clock,        label: "Awaiting" },
  approved: { color: isDark ? "#4ade80" : "#16a34a", bg: isDark ? "rgba(74,222,128,0.15)" : "rgba(22,163,74,0.1)",  border: isDark ? "rgba(74,222,128,0.3)" : "rgba(22,163,74,0.25)",  icon: CheckCircle2, label: "Secured"  },
  rejected: { color: isDark ? "#f87171" : "#dc2626", bg: isDark ? "rgba(248,113,113,0.15)": "rgba(220,38,38,0.1)",  border: isDark ? "rgba(248,113,113,0.3)": "rgba(220,38,38,0.25)",  icon: XCircle,      label: "Closed"   },
});

const EmployeeRequests = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = pathname.startsWith("/freelancer") ? "/freelancer" : "/employee";
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const isDark = theme === "black";
  const statusConfig = getStatusConfig(isDark);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["freelancer-requests", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("*, project:project_id(name, amount, status)")
        .eq("employee_id", profile.id)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const counts = {
    pending: requests.filter((r: any) => r.status === "pending").length,
    approved: requests.filter((r: any) => r.status === "approved").length,
    rejected: requests.filter((r: any) => r.status === "rejected").length,
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text }} className="space-y-6 p-4 pb-24">
      {/* Hero Header */}
      <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }} className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}
              className="h-10 w-10 text-white hover:bg-white/20 rounded-2xl backdrop-blur-md">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-xl">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">My Requests</h1>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{requests.length} Application nodes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        {(["pending", "approved", "rejected"] as const).map((status) => {
          const cfg = statusConfig[status];
          return (
            <Card key={status} style={{ background: T.card, borderColor: cfg.border, backdropFilter: "blur(12px)" }} className="border-2 shadow-xl overflow-hidden">
              <CardContent className="flex flex-col items-center p-4 gap-2">
                <div style={{ background: cfg.bg }} className="flex h-10 w-10 items-center justify-center rounded-xl">
                  <cfg.icon style={{ color: cfg.color }} className="h-5 w-5" />
                </div>
                <span style={{ color: T.text }} className="text-xl font-black leading-none">{counts[status]}</span>
                <span style={{ color: T.sub }} className="text-[10px] font-black uppercase tracking-[0.2em]">{cfg.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request Cards */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} style={{ background: T.card }} className="h-32 w-full rounded-3xl opacity-50" />
          ))
        ) : requests.length > 0 ? (
          requests.map((r: any) => {
            const cfg = statusConfig[r.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <Card key={r.id} style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="overflow-hidden border shadow-xl hover:shadow-2xl transition-all relative">
                <div style={{ background: cfg.color }} className="absolute top-0 left-0 w-1.5 h-full opacity-60" />
                <CardContent className="p-5 pl-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div style={{ background: cfg.bg }} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                        <StatusIcon style={{ color: cfg.color }} className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 style={{ color: T.text }} className="font-bold text-lg leading-tight truncate">{r.project?.name ?? "Mission Code X"}</h3>
                        <div className="flex flex-col gap-1 mt-1">
                          <p style={{ color: T.sub }} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="h-3 w-3 opacity-70" /> {format(new Date(r.applied_at), "dd MMM yyyy")}
                          </p>
                          {r.project?.amount && (
                            <p style={{ color: isDark ? "#4ade80" : "#16a34a" }} className="text-xs font-black">
                              STAKE: ₹{Number(r.project.amount).toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <Badge style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + "40" }} className="border font-black text-[10px] uppercase tracking-widest px-3 py-1">
                        {cfg.label}
                      </Badge>
                      {r.status === "approved" && (
                        <Button size="sm" 
                          style={{ background: "rgba(99,102,241,0.1)", color: T.badgeFg, borderColor: "rgba(99,102,241,0.2)" }}
                          className="h-9 text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl border hover:bg-white/[0.05]"
                          onClick={() => navigate(`/freelancer/projects/chat/${r.project_id}`)}>
                          <MessageSquare className="h-3.5 w-3.5" /> Terminal
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div style={{ background: T.card, borderColor: T.border }} className="flex h-24 w-24 items-center justify-center rounded-[2.5rem] border shadow-2xl mb-6">
              <Inbox style={{ color: T.sub }} className="h-10 w-10 opacity-30" />
            </div>
            <p style={{ color: T.text }} className="text-lg font-black uppercase tracking-widest">No Active Nodes</p>
            <p style={{ color: T.sub }} className="text-xs font-bold mt-2 max-w-[280px] leading-relaxed opacity-70 uppercase tracking-tighter">
              You haven't initiated any requests. Explore the job catalog to begin operations.
            </p>
            <Button style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }} className="mt-8 gap-3 h-12 rounded-2xl font-black uppercase tracking-[0.15em] px-8 shadow-xl shadow-indigo-500/20 text-white" onClick={() => navigate(`${base}/projects`)}>
              <Send className="h-5 w-5" /> Explore Catalog
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeRequests;
