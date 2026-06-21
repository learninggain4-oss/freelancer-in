import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/supabase-functions";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { IndianRupee, CheckCircle, XCircle, Loader2, MessageSquare, Pencil, ChevronDown, ChevronUp, Save, EyeOff, ShieldAlert, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const AdminRecoveryRequests = () => {
  const { profile } = useAuth();
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [showCleared, setShowCleared] = useState(false);
  const [expandedEdit, setExpandedEdit] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-recovery-requests", showCleared],
    queryFn: async () => {
      let query = supabase
        .from("recovery_requests")
        .select(`*, project:project_id(id, name, amount, validation_fees, status, assigned_employee_id), freelancer:employee_id(id, full_name, user_code, hold_balance, available_balance)`)
        .order("created_at", { ascending: false });
      if (!showCleared) query = query.eq("is_cleared", false);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const clearMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recovery_requests").update({ is_cleared: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recovery request cleared");
      queryClient.invalidateQueries({ queryKey: ["admin-recovery-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recovery_requests").update({ is_cleared: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recovery request restored");
      queryClient.invalidateQueries({ queryKey: ["admin-recovery-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("recovery_requests").update({
        admin_notes: data.admin_notes || null,
        held_amount: Number(data.held_amount),
        status: data.status,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recovery request updated");
      setExpandedEdit(null);
      queryClient.invalidateQueries({ queryKey: ["admin-recovery-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleRelease = async (requestId: string, projectId: string, employeeId: string) => {
    setLoading(requestId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const res = await callEdgeFunction("wallet-operations", {
        method: "POST",
        body: { action: "admin_release_held_balance", project_id: projectId, admin_notes: adminNotes[requestId] || "", recovery_request_id: requestId },
        token,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Operation failed");
      toast.success("Held balance released to freelancer's available balance.");
      queryClient.invalidateQueries({ queryKey: ["admin-recovery-requests"] });
    } catch (e: any) { toast.error(e.message); } finally { setLoading(null); }
  };

  const handleReject = async (requestId: string) => {
    setLoading(requestId);
    try {
      const { error } = await supabase.from("recovery_requests").update({
        status: "rejected", admin_notes: adminNotes[requestId] || "Rejected by admin",
        resolved_at: new Date().toISOString(), resolved_by: profile?.id,
      }).eq("id", requestId);
      if (error) throw error;
      toast.success("Recovery request rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-recovery-requests"] });
    } catch (e: any) { toast.error(e.message); } finally { setLoading(null); }
  };

  const openSupportChat = async (request: any) => {
    const { data: existing } = await supabase.from("chat_rooms").select("id").eq("recovery_request_id", request.id).eq("type", "support").maybeSingle();
    if (existing) { navigate(`/admin/recovery-chat/${request.project_id}?room=${existing.id}`); return; }
    const { data: newRoom, error } = await supabase.from("chat_rooms").insert({ project_id: request.project_id, type: "support", recovery_request_id: request.id }).select("id").single();
    if (error) { toast.error("Failed to create support chat room"); return; }
    navigate(`/admin/recovery-chat/${request.project_id}?room=${newRoom.id}`);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="border-warning text-warning">Pending</Badge>;
      case "resolved": return <Badge className="bg-accent text-accent-foreground">Resolved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const startEdit = (req: any) => {
    if (expandedEdit === req.id) { setExpandedEdit(null); return; }
    setEditForm({ admin_notes: req.admin_notes || "", held_amount: req.held_amount, status: req.status });
    setExpandedEdit(req.id);
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-amber-500 p-8 text-white shadow-2xl shadow-amber-500/20">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-100 mb-2">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Risk Management</span>
            </div>
            <h1 className="text-3xl font-bold">Recovery Requests</h1>
            <p className="text-amber-100/80 text-sm mt-1">
              Manage freelancer requests to recover held balances from rejected projects.
            </p>
          </div>
          <div 
            className="flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20"
          >
            <Switch 
              checked={showCleared} 
              onCheckedChange={setShowCleared} 
              id="show-cleared-recovery" 
              className="data-[state=checked]:bg-white/40"
            />
            <Label htmlFor="show-cleared-recovery" className="text-xs font-medium cursor-pointer">
              Show cleared
            </Label>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-4" />
          <p style={{ color: T.sub }}>Loading recovery requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div 
          className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed"
          style={{ background: T.card, borderColor: T.border }}
        >
          <History className="h-12 w-12 mb-4 opacity-20" style={{ color: T.text }} />
          <p className="text-sm font-medium" style={{ color: T.sub }}>No recovery requests found</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((req: any) => (
            <div 
              key={req.id} 
              className="group relative overflow-hidden rounded-3xl border transition-all hover:scale-[1.01]"
              style={{ 
                background: T.card, 
                borderColor: req.is_cleared ? T.border : (req.status === "pending" ? "rgba(245, 158, 11, 0.3)" : T.border),
                opacity: req.is_cleared ? 0.6 : 1,
                backdropFilter: "blur(12px)"
              }}
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold" style={{ color: T.text }}>
                        {req.project?.name || "Unknown Project"}
                      </h3>
                      {req.is_cleared && (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-tighter" style={{ borderColor: "#f87171", color: "#f87171" }}>
                          Cleared
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: T.sub }}>
                      Freelancer: <span className="font-semibold" style={{ color: T.text }}>{req.freelancer?.full_name?.[0] || "Unknown"}</span> ({req.freelancer?.user_code?.[0]})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(req.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Held Amount", value: req.held_amount, icon: IndianRupee, color: "#f87171", isCurrency: true },
                    { label: "Hold Balance", value: req.freelancer?.hold_balance || 0, icon: History, color: "#6366f1", isCurrency: true },
                    { label: "Validation Fees", value: req.project?.validation_fees || 0, icon: ShieldAlert, color: "#fbbf24", isCurrency: true },
                    { label: "Project Budget", value: req.project?.amount || 0, icon: IndianRupee, color: "#22c55e", isCurrency: true },
                  ].map((stat, i) => (
                    <div key={i} className="p-3 rounded-2xl border" style={{ background: T.input, borderColor: T.border }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.sub }}>{stat.label}</p>
                      <div className="flex items-center gap-1">
                        {stat.isCurrency && <span className="text-xs font-semibold" style={{ color: stat.color }}>₹</span>}
                        <span className="text-sm font-bold" style={{ color: T.text }}>
                          {Number(stat.value).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => startEdit(req)} 
                      className="rounded-xl h-10 px-4"
                      style={{ background: expandedEdit === req.id ? T.badge : T.input, color: expandedEdit === req.id ? T.badgeFg : T.text }}
                    >
                      {expandedEdit === req.id ? <ChevronUp className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                      {expandedEdit === req.id ? "Close Editor" : "Edit Request"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => openSupportChat(req)} 
                      className="rounded-xl h-10 px-4 border"
                      style={{ background: T.input, borderColor: T.border, color: T.text }}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" style={{ color: "#6366f1" }} /> 
                      Open Chat
                    </Button>
                    
                    {req.is_cleared ? (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => restoreMutation.mutate(req.id)}
                        className="rounded-xl h-10 px-4"
                        style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e" }}
                      >
                        Restore Request
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="rounded-xl h-10 px-4 text-destructive"
                            style={{ background: "rgba(248, 113, 113, 0.1)" }}
                          >
                            <EyeOff className="mr-2 h-4 w-4" /> Clear
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent style={{ background: T.card, borderColor: T.border, color: T.text }}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear this recovery request?</AlertDialogTitle>
                            <AlertDialogDescription style={{ color: T.sub }}>This will soft-delete the request. It can be restored later.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl" style={{ background: T.input, borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => clearMutation.mutate(req.id)} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">Clear</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  {req.status === "pending" && !req.is_cleared && (
                    <div className="space-y-4 pt-4 border-t animate-in fade-in duration-500" style={{ borderColor: T.border }}>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: T.sub }}>Decision Notes</Label>
                        <Textarea 
                          placeholder="Admin notes for the freelancer..." 
                          value={adminNotes[req.id] || ""}
                          onChange={(e) => setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          className="rounded-2xl border-none min-h-[80px]" 
                          style={{ background: T.input, color: T.text }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="lg" disabled={loading === req.id} className="rounded-2xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20">
                              {loading === req.id ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                              Release Balance
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent style={{ background: T.card, borderColor: T.border, color: T.text }}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Release Held Balance?</AlertDialogTitle>
                              <AlertDialogDescription style={{ color: T.sub }}>
                                This will transfer ₹{Number(req.held_amount).toLocaleString("en-IN")} from hold to available balance.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl" style={{ background: T.input, borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRelease(req.id, req.project_id, req.employee_id)} className="rounded-xl bg-emerald-600 text-white">Confirm Release</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="lg" variant="ghost" disabled={loading === req.id} className="rounded-2xl px-6 border text-destructive hover:bg-destructive/10" style={{ borderColor: "rgba(248, 113, 113, 0.3)" }}>
                              <XCircle className="mr-2 h-5 w-5" /> Reject Request
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent style={{ background: T.card, borderColor: T.border, color: T.text }}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject Recovery Request?</AlertDialogTitle>
                              <AlertDialogDescription style={{ color: T.sub }}>This will close the request. Current balances will remain unchanged.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl" style={{ background: T.input, borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleReject(req.id)} className="rounded-xl bg-destructive text-white">Confirm Reject</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}

                  {expandedEdit === req.id && (
                    <div className="mt-4 p-6 rounded-3xl border animate-in slide-in-from-top duration-300" style={{ background: T.nav, borderColor: T.border }}>
                      <div className="grid gap-4 sm:grid-cols-2 mb-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: T.sub }}>Held Amount (₹)</Label>
                          <Input 
                            type="number" 
                            value={editForm.held_amount} 
                            onChange={(e) => setEditForm((f: any) => ({ ...f, held_amount: e.target.value }))} 
                            className="rounded-xl border-none h-11"
                            style={{ background: T.input, color: T.text }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: T.sub }}>Internal Status</Label>
                          <Input 
                            value={editForm.status} 
                            onChange={(e) => setEditForm((f: any) => ({ ...f, status: e.target.value }))} 
                            placeholder="pending / resolved / rejected" 
                            className="rounded-xl border-none h-11"
                            style={{ background: T.input, color: T.text }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: T.sub }}>Internal Notes</Label>
                        <Textarea 
                          value={editForm.admin_notes} 
                          onChange={(e) => setEditForm((f: any) => ({ ...f, admin_notes: e.target.value }))} 
                          rows={2} 
                          className="rounded-2xl border-none"
                          style={{ background: T.input, color: T.text }}
                        />
                      </div>
                      <Button className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20" onClick={() => editMutation.mutate({ id: req.id, data: editForm })} disabled={editMutation.isPending}>
                        <Save className="mr-2 h-4 w-4" /> {editMutation.isPending ? "Saving..." : "Apply Manual Changes"}
                      </Button>
                    </div>
                  )}

                  {req.status !== "pending" && req.admin_notes && (
                    <div className="rounded-2xl p-4 text-xs italic" style={{ background: T.input, color: T.sub }}>
                      <span className="font-bold uppercase tracking-widest text-[10px] block mb-1" style={{ color: T.sub }}>Admin Resolution:</span>
                      {req.admin_notes}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-widest pt-2" style={{ color: T.sub }}>
                    <span>Requested: {new Date(req.created_at).toLocaleString("en-IN")}</span>
                    {req.resolved_at && <span>Resolved: {new Date(req.resolved_at).toLocaleString("en-IN")}</span>}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRecoveryRequests;
