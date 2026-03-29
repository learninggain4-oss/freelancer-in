import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { IndianRupee, CheckCircle, XCircle, Loader2, MessageSquare, Pencil, ChevronDown, ChevronUp, Save, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminRecoveryRequests = () => {
  const { profile } = useAuth();
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
        .select(`*, project:project_id(id, name, amount, validation_fees, status, assigned_employee_id), employee:employee_id(id, full_name, user_code, hold_balance, available_balance)`)
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
      const res = await fetch(`https://maysttckdfnnzvfeujaj.supabase.co/functions/v1/wallet-operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "admin_release_held_balance", project_id: projectId, admin_notes: adminNotes[requestId] || "", recovery_request_id: requestId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Operation failed");
      toast.success("Held balance released to employee's available balance.");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recovery Requests</h1>
          <p className="text-sm text-muted-foreground">Manage employee requests to recover held balances from rejected projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showCleared} onCheckedChange={setShowCleared} id="show-cleared-recovery" />
          <Label htmlFor="show-cleared-recovery" className="text-xs text-muted-foreground">Show cleared</Label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : requests.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No recovery requests found.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <Card key={req.id} className={req.is_cleared ? "opacity-60 border-dashed" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{req.project?.name || "Unknown Project"}</CardTitle>
                    <CardDescription>Employee: {req.employee?.full_name?.[0] || "Unknown"} ({req.employee?.user_code?.[0]})</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {req.is_cleared && <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">Cleared</Badge>}
                    {statusBadge(req.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4 rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Held Amount:</span>
                    <span className="font-semibold text-destructive">₹{Number(req.held_amount).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Employee Hold Balance:</span>
                    <span className="font-semibold text-foreground">₹{Number(req.employee?.hold_balance || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Validation Fees:</span>
                    <span className="font-semibold">₹{Number(req.project?.validation_fees || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-semibold">₹{Number(req.project?.amount || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">Requested: {new Date(req.created_at).toLocaleString("en-IN")}</div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(req)} className="gap-1">
                    {expandedEdit === req.id ? <ChevronUp className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    {expandedEdit === req.id ? "Close" : "Edit"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openSupportChat(req)} className="gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> Open Chat
                  </Button>

                  {req.status === "pending" && !req.is_cleared && (
                    <>
                      <Textarea placeholder="Admin notes (optional)" value={adminNotes[req.id] || ""}
                        onChange={(e) => setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                        className="w-full text-sm" rows={2} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" disabled={loading === req.id} className="gap-1">
                            {loading === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            Release Balance
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Release Held Balance?</AlertDialogTitle>
                            <AlertDialogDescription>This will transfer ₹{Number(req.held_amount).toLocaleString("en-IN")} from hold to available balance.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRelease(req.id, req.project_id, req.employee_id)}>Confirm Release</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" disabled={loading === req.id} className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10">
                            <XCircle className="h-3.5 w-3.5" /> Close Request
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Close Recovery Request?</AlertDialogTitle>
                            <AlertDialogDescription>This will close the request. Current balances will remain unchanged.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleReject(req.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirm Close</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}

                  {req.is_cleared ? (
                    <Button size="sm" variant="outline" onClick={() => restoreMutation.mutate(req.id)}>Restore</Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-1 text-destructive">
                          <EyeOff className="h-3.5 w-3.5" /> Clear
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear this recovery request?</AlertDialogTitle>
                          <AlertDialogDescription>This will soft-delete the request. It can be restored later.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => clearMutation.mutate(req.id)}>Clear</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Expandable Edit Row */}
                {expandedEdit === req.id && (
                  <div className="mt-3 space-y-3 rounded-lg border bg-muted/30 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Held Amount (₹)</Label>
                        <Input type="number" value={editForm.held_amount} onChange={(e) => setEditForm((f: any) => ({ ...f, held_amount: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Status</Label>
                        <Input value={editForm.status} onChange={(e) => setEditForm((f: any) => ({ ...f, status: e.target.value }))} placeholder="pending / resolved / rejected" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Admin Notes</Label>
                      <Textarea value={editForm.admin_notes} onChange={(e) => setEditForm((f: any) => ({ ...f, admin_notes: e.target.value }))} rows={2} />
                    </div>
                    <Button className="w-full" onClick={() => editMutation.mutate({ id: req.id, data: editForm })} disabled={editMutation.isPending}>
                      <Save className="mr-1 h-3 w-3" /> {editMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}

                {req.status !== "pending" && req.admin_notes && (
                  <div className="rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
                    <span className="font-medium">Admin Notes:</span> {req.admin_notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRecoveryRequests;
