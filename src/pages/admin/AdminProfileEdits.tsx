import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, User, Edit, History, Clock, UserCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { cn } from "@/lib/utils";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const AdminProfileEdits = () => {
  const { profile: adminProfile } = useAuth();
  const queryClient = useQueryClient();
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-edit-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, user_type, email, edit_request_status, edit_requested_at")
        .eq("edit_request_status", "requested" as any)
        .order("edit_requested_at" as any, { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["admin-edit-requests-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, user_type, email, edit_request_status, edit_requested_at, edit_reviewed_at")
        .in("edit_request_status", ["approved", "rejected", "used"] as any[])
        .order("edit_reviewed_at" as any, { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const updateData: Record<string, any> = {
        edit_request_status: status,
        edit_reviewed_at: new Date().toISOString(),
        edit_reviewed_by: adminProfile?.id,
      };
      if (status === "rejected" && reason) {
        updateData.edit_request_reason = reason;
      }
      const { error } = await supabase.from("profiles").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`Edit request ${vars.status}`);
      setRejectReasons((p) => { const n = { ...p }; delete n[vars.id]; return n; });
      queryClient.invalidateQueries({ queryKey: ["admin-edit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-edit-requests-history"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getName = (p: any) => Array.isArray(p.full_name) ? p.full_name.join(" ") : p.full_name;
  const getCode = (p: any) => Array.isArray(p.user_code) ? p.user_code.join("") : p.user_code;

  return (
    <div className="space-y-6 pb-20">
      {/* Premium Hero Section */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 mb-8"
        style={{ 
          background: theme === "black" 
            ? "linear-gradient(135deg, #1e1b4b 0%, #070714 100%)" 
            : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          border: `1px solid ${T.border}`
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white/10 p-3 backdrop-blur-md">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Profile Permissions</h1>
              <p className="text-white/70">Review and moderate requests from users to edit their profile data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Pending Requests Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Clock className="h-5 w-5 text-[#6366f1]" />
            <h2 className="text-xl font-bold" style={{ color: T.text }}>Pending Requests</h2>
            <Badge 
              variant="outline" 
              className="ml-2 font-mono"
              style={{ background: "rgba(99, 102, 241, 0.1)", color: "#a5b4fc", borderColor: "rgba(99, 102, 241, 0.3)" }}
            >
              {requests.length}
            </Badge>
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl opacity-20" />)
            ) : requests.length > 0 ? (
              requests.map((r: any) => (
                <Card 
                  key={r.id} 
                  style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}
                  className="overflow-hidden transition-all hover:border-[#6366f1]/30"
                >
                  <CardContent className="p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#a5b4fc" }}>
                          {getName(r)?.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-lg leading-none" style={{ color: T.text }}>{getName(r)}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold" style={{ color: "#a5b4fc" }}>{getCode(r)}</span>
                            <span className="text-xs opacity-50" style={{ color: T.text }}>•</span>
                            <span className="text-xs" style={{ color: T.sub }}>{r.email}</span>
                          </div>
                          <p className="text-[10px] uppercase font-bold tracking-widest pt-1" style={{ color: T.sub }}>
                            Requested: {new Date(r.edit_requested_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="w-fit uppercase text-[10px] font-bold tracking-tighter h-6 px-2" style={{ background: "rgba(99, 102, 241, 0.05)", color: "#a5b4fc", borderColor: "rgba(99, 102, 241, 0.2)" }}>
                        {r.user_type}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: T.sub }}>Rejection Reason (if applicable)</Label>
                      <Textarea
                        placeholder="Enter reason for rejection..."
                        value={rejectReasons[r.id] || ""}
                        onChange={(e) => setRejectReasons((p) => ({ ...p, [r.id]: e.target.value }))}
                        className="min-h-[80px] resize-none"
                        style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        className="flex-1 bg-[#4ade80] hover:bg-[#4ade80]/90 text-black font-bold h-11" 
                        onClick={() => updateMutation.mutate({ id: r.id, status: "approved" })} 
                        disabled={updateMutation.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" /> Approve Access
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 border-[#f87171] text-[#f87171] hover:bg-[#f87171]/10 font-bold h-11" 
                        onClick={() => updateMutation.mutate({ id: r.id, status: "rejected", reason: rejectReasons[r.id] })} 
                        disabled={updateMutation.isPending}
                      >
                        <X className="mr-2 h-4 w-4" /> Reject Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 rounded-3xl border-2 border-dashed" style={{ borderColor: T.border, color: T.sub }}>
                <Check className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">No pending profile edit requests at the moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* History Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <History className="h-5 w-5 text-[#a78bfa]" />
            <h2 className="text-xl font-bold" style={{ color: T.text }}>Recent History</h2>
          </div>

          <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }} className="overflow-hidden">
            <CardContent className="p-0">
              {history.length > 0 ? (
                <div className="divide-y" style={{ borderColor: T.border }}>
                  {history.map((r: any) => {
                    const status = r.edit_request_status;
                    const isRejected = status === "rejected";
                    const isApproved = status === "approved" || status === "used";
                    
                    return (
                      <div key={r.id} className="p-4 flex items-center justify-between gap-4 transition-colors hover:bg-white/5">
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate" style={{ color: T.text }}>{getName(r)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] font-bold" style={{ color: T.sub }}>{getCode(r)}</span>
                            <span className="text-[10px]" style={{ color: T.sub }}>•</span>
                            <span className="text-[10px]" style={{ color: T.sub }}>{r.edit_reviewed_at ? new Date(r.edit_reviewed_at).toLocaleDateString() : "—"}</span>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="text-[9px] uppercase font-bold px-1.5 h-5 shrink-0"
                          style={{ 
                            background: isApproved ? "rgba(74, 222, 128, 0.1)" : isRejected ? "rgba(248, 113, 113, 0.1)" : "rgba(148, 163, 184, 0.1)",
                            color: isApproved ? "#4ade80" : isRejected ? "#f87171" : T.sub,
                            borderColor: isApproved ? "rgba(74, 222, 128, 0.3)" : isRejected ? "rgba(248, 113, 113, 0.3)" : "rgba(148, 163, 184, 0.3)"
                          }}
                        >
                          {status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-sm" style={{ color: T.sub }}>No processing history yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileEdits;
