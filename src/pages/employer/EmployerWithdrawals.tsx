import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { IndianRupee, User, Check, X, History as HistoryIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WithdrawalCountdown } from "@/components/withdrawal/WithdrawalCountdown";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
};

const ClientWithdrawals = () => {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ["employer-withdrawals", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("withdrawals")
        .select("id, employee_id, amount, method, status, review_notes, reviewed_at, reviewed_by, requested_at, order_id, freelancer:employee_id(full_name, user_code)")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, reject_reason }: { id: string; status: string; reject_reason?: string }) => {
      const res = await supabase.functions.invoke("wallet-operations", {
        body: { action: "process_withdrawal", withdrawal_id: id, status, reject_reason },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: (_, vars) => {
      toast.success(`Withdrawal ${vars.status}`);
      setRejectReasons((prev) => { const next = { ...prev }; delete next[vars.id]; return next; });
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["client-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["client-transactions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pending = withdrawals.filter((w: any) => w.status === "pending");
  const history = withdrawals.filter((w: any) => w.status !== "pending");

  const getEmployeeName = (emp: any) => {
    if (!emp) return "Freelancer";
    return Array.isArray(emp.full_name) ? emp.full_name.join(" ") : emp.full_name;
  };

  return (
    <div className="space-y-6 p-4 pb-24 min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
          <HistoryIcon className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: T.text }}>Withdrawals</h1>
          <p className="text-xs font-medium" style={{ color: T.sub }}>Review freelancer payment requests</p>
        </div>
      </div>

      <Card className="border-0 shadow-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
        <div className="h-1 bg-gradient-to-r from-amber-500/50 to-amber-500/10" />
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2" style={{ color: T.text }}>
            <Clock className="h-4 w-4 text-amber-500" /> Pending Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl opacity-20" />)
          ) : pending.length > 0 ? (
            pending.map((w: any) => (
              <div key={w.id} className="space-y-4 rounded-2xl p-5 shadow-sm transition-all" style={{ background: T.input, border: `1px solid ${T.border}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 font-black text-indigo-400 border border-white/5">
                      {getEmployeeName(w.freelancer).charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight" style={{ color: T.text }}>
                        {getEmployeeName(w.freelancer)}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>
                        {Array.isArray(w.freelancer?.user_code) ? w.freelancer.user_code.join("") : w.freelancer?.user_code} • {w.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="flex items-center text-lg font-black text-emerald-400">
                      <IndianRupee className="h-4 w-4" />{Number(w.amount).toLocaleString("en-IN")}
                    </span>
                    {w.order_id && (
                      <p className="text-[9px] font-mono text-white/30 tracking-tighter">ID: {w.order_id}</p>
                    )}
                  </div>
                </div>
                
                <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                  <WithdrawalCountdown requestedAt={w.requested_at} />
                </div>

                <Textarea
                  placeholder="Reason for rejection (optional)"
                  value={rejectReasons[w.id] || ""}
                  onChange={(e) => setRejectReasons((prev) => ({ ...prev, [w.id]: e.target.value }))}
                  className="min-h-[80px] text-sm rounded-xl border-0 bg-white/5 focus-visible:ring-indigo-500/30 placeholder:text-white/20"
                  style={{ color: T.text }}
                />

                <div className="flex gap-3">
                  <Button 
                    size="sm" 
                    className="flex-1 h-11 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20" 
                    onClick={() => updateMutation.mutate({ id: w.id, status: "approved" })} 
                    disabled={updateMutation.isPending}
                  >
                    <Check className="mr-2 h-4 w-4" /> Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-11 rounded-2xl font-black border-rose-500/30 text-rose-500 hover:bg-rose-500/10" 
                    onClick={() => updateMutation.mutate({ id: w.id, status: "rejected", reject_reason: rejectReasons[w.id] || undefined })} 
                    disabled={updateMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center rounded-2xl border-2 border-dashed border-white/5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-30">No pending requests</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2" style={{ color: T.text }}>
            <HistoryIcon className="h-4 w-4 text-indigo-400" /> History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length > 0 ? (
            history.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between rounded-2xl p-4 transition-all hover:bg-white/5" style={{ background: T.input, border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xs font-black" style={{ color: T.sub }}>
                    {getEmployeeName(w.freelancer).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-tight" style={{ color: T.text }}>{getEmployeeName(w.freelancer)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-black text-indigo-400/80">₹{Number(w.amount).toLocaleString("en-IN")}</span>
                      <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">• {new Date(w.requested_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <Badge 
                  className="px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg"
                  style={{ 
                    background: w.status === 'completed' || w.status === 'approved' ? '#4ade8020' : w.status === 'rejected' ? '#f8717120' : T.badge,
                    color: w.status === 'completed' || w.status === 'approved' ? '#4ade80' : w.status === 'rejected' ? '#f87171' : T.badgeFg,
                    border: `1px solid ${w.status === 'completed' || w.status === 'approved' ? '#4ade8030' : w.status === 'rejected' ? '#f8717130' : T.border}`
                  }}
                >
                  {w.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="py-12 text-center rounded-2xl border-2 border-dashed border-white/5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-30">No history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientWithdrawals;
