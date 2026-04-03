import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Landmark, CheckCircle2, XCircle, Clock, Search, Eye, User, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

type BankVerification = {
  id: string;
  profile_id: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  verified_at: string | null;
  document_path: string | null;
  document_name: string | null;
  attempt_count: number;
  profiles: {
    full_name: string[];
    user_code: string[];
    email: string;
    user_type: string;
    bank_holder_name: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_ifsc_code: string | null;
    upi_id: string | null;
  };
};

const statusBadgeConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "secondary", label: "Pending" },
  under_process: { variant: "outline", label: "Under Process" },
  verified: { variant: "default", label: "Verified" },
  rejected: { variant: "destructive", label: "Rejected" },
};

const AdminBankVerifications = () => {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState<BankVerification | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bank_holder_name: "", bank_name: "", bank_account_number: "", bank_ifsc_code: "", upi_id: "" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  const [showCleared, setShowCleared] = useState(false);

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ["admin-bank-verifications"],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_verifications")
        .select("id, profile_id, status, rejection_reason, created_at, verified_at, document_path, document_name, attempt_count, profiles!bank_verifications_profile_id_fkey(full_name, user_code, email, user_type, bank_holder_name, bank_name, bank_account_number, bank_ifsc_code, upi_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BankVerification[];
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const update: Record<string, unknown> = {
        status,
        verified_by: profile!.id,
        verified_at: new Date().toISOString(),
      };
      if (status === "rejected" && reason) update.rejection_reason = reason;
      else update.rejection_reason = null;

      const { error } = await supabase.from("bank_verifications").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`Bank verification updated to ${vars.status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-bank-verifications"] });
      setSelected(null);
      setRejectReason("");
      setNewStatus("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ ids, status, reason }: { ids: string[]; status: string; reason?: string }) => {
      const now = new Date().toISOString();
      for (const id of ids) {
        const update: Record<string, unknown> = {
          status,
          verified_by: profile!.id,
          verified_at: now,
        };
        if (status === "rejected" && reason) update.rejection_reason = reason;
        else update.rejection_reason = null;

        const { error } = await supabase.from("bank_verifications").update(update).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast.success(`${vars.ids.length} bank verification(s) updated to ${vars.status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-bank-verifications"] });
      setSelectedIds(new Set());
      setBulkRejectReason("");
      setShowBulkRejectDialog(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: async ({ profileId, data }: { profileId: string; data: typeof editForm }) => {
      const { error } = await supabase.from("profiles").update({
        bank_holder_name: data.bank_holder_name || null,
        bank_name: data.bank_name || null,
        bank_account_number: data.bank_account_number || null,
        bank_ifsc_code: data.bank_ifsc_code || null,
        upi_id: data.upi_id || null,
      }).eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bank details updated");
      queryClient.invalidateQueries({ queryKey: ["admin-bank-verifications"] });
      setSelected(null);
      setIsEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (v: BankVerification) => {
      if (v.document_path) {
        await supabase.storage.from("bank-documents").remove([v.document_path]);
      }
      const { error } = await supabase.from("bank_verifications").delete().eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bank verification record deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-bank-verifications"] });
      setSelected(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = verifications.filter((v) => {
    const statusMatch = tab === "all" || v.status === tab;
    if (!statusMatch) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      v.profiles?.full_name?.[0]?.toLowerCase().includes(s) ||
      v.profiles?.user_code?.[0]?.toLowerCase().includes(s) ||
      v.profiles?.email?.toLowerCase().includes(s) ||
      v.profiles?.bank_account_number?.includes(s) ||
      v.profiles?.upi_id?.toLowerCase().includes(s)
    );
  });

  const actionableFiltered = filtered.filter(v => v.status === "pending" || v.status === "under_process");
  const allActionableSelected = actionableFiltered.length > 0 && actionableFiltered.every(v => selectedIds.has(v.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allActionableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(actionableFiltered.map(v => v.id)));
    }
  };

  const renderBadge = (status: string) => {
    const cfg = statusBadgeConfig[status] ?? statusBadgeConfig.pending;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-4 min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 rounded-2xl border" style={{ background: `linear-gradient(135deg, ${T.card} 0%, rgba(99,102,241,0.05) 100%)`, borderColor: T.border }}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/20">
              <Landmark className="h-6 w-6 text-indigo-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Bank Verifications</h1>
          </div>
          <p style={{ color: T.sub }}>Review and manage bank detail verifications</p>
        </div>
        <div className="flex items-center gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <Switch checked={showCleared} onCheckedChange={setShowCleared} id="show-cleared-bank" />
            <Label htmlFor="show-cleared-bank" className="text-xs cursor-pointer" style={{ color: T.sub }}>Show cleared</Label>
          </div>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors group-focus-within:text-indigo-500" style={{ color: T.sub }} />
        <Input 
          placeholder="Search by name, code, email, account..." 
          className="pl-10 h-12 border-none transition-all focus-visible:ring-1 focus-visible:ring-indigo-500/50" 
          style={{ backgroundColor: T.input, color: T.text }}
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setSelectedIds(new Set()); }} className="w-full">
        <TabsList className="w-full grid grid-cols-5 h-12 p-1 gap-1" style={{ backgroundColor: T.nav }}>
          {["pending", "under_process", "verified", "rejected", "all"].map((t) => (
            <TabsTrigger 
              key={t} 
              value={t} 
              className="rounded-lg capitalize transition-all data-[state=active]:shadow-lg"
              style={{ 
                color: tab === t ? T.text : T.sub,
                backgroundColor: tab === t ? T.card : "transparent"
              }}
            >
              {t.replace("_", " ")}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-6 space-y-4">
          {/* Bulk action bar */}
          {actionableFiltered.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border backdrop-blur-md transition-all" style={{ backgroundColor: T.card, borderColor: T.border }}>
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={allActionableSelected} 
                  onCheckedChange={toggleSelectAll}
                  className="border-white/20 data-[state=checked]:bg-indigo-500"
                />
                <span className="text-sm font-medium" style={{ color: T.sub }}>
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all pending"}
                </span>
              </div>
              {selectedIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <Button 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-500/20"
                    disabled={bulkActionMutation.isPending}
                    onClick={() => bulkActionMutation.mutate({ ids: Array.from(selectedIds), status: "verified" })}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Verify
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-white/10 hover:bg-white/5"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    disabled={bulkActionMutation.isPending}
                    onClick={() => bulkActionMutation.mutate({ ids: Array.from(selectedIds), status: "under_process" })}
                  >
                    <Clock className="mr-2 h-4 w-4" /> Process
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    disabled={bulkActionMutation.isPending}
                    onClick={() => setShowBulkRejectDialog(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl opacity-20" style={{ backgroundColor: T.card }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed py-12" style={{ backgroundColor: "transparent", borderColor: T.border }}>
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-white/5 mb-4">
                  <Search className="h-8 w-8 opacity-20" />
                </div>
                <p style={{ color: T.sub }}>No bank verifications found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map((v) => {
                const isActionable = v.status === "pending" || v.status === "under_process";
                return (
                  <Card 
                    key={v.id} 
                    className="group transition-all hover:scale-[1.005] active:scale-[0.995] border cursor-pointer overflow-hidden" 
                    style={{ backgroundColor: T.card, borderColor: T.border }}
                    onClick={() => { setSelected(v); setNewStatus(v.status); setRejectReason(v.rejection_reason || ""); setIsEditing(false); setEditForm({ bank_holder_name: v.profiles?.bank_holder_name || "", bank_name: v.profiles?.bank_name || "", bank_account_number: v.profiles?.bank_account_number || "", bank_ifsc_code: v.profiles?.bank_ifsc_code || "", upi_id: v.profiles?.upi_id || "" }); }}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      {isActionable && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(v.id)}
                            onCheckedChange={() => toggleSelect(v.id)}
                            className="border-white/20 data-[state=checked]:bg-indigo-500"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                              <User className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold truncate" style={{ color: T.text }}>{v.profiles?.full_name?.[0] ?? "—"}</span>
                                <Badge 
                                  variant="outline" 
                                  className="text-[10px] uppercase tracking-wider font-semibold"
                                  style={{ backgroundColor: T.badge, color: T.badgeFg, borderColor: "transparent" }}
                                >
                                  {v.profiles?.user_type}
                                </Badge>
                              </div>
                              <p className="text-xs font-mono opacity-60 truncate" style={{ color: T.sub }}>
                                {v.profiles?.user_code?.[0]} • {v.profiles?.bank_name || v.profiles?.upi_id || "No details"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {renderBadge(v.status)}
                            <div className="p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="h-4 w-4" style={{ color: T.sub }} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/5">
                          <p className="text-[11px] flex items-center gap-1.5" style={{ color: T.sub }}>
                            <Clock className="h-3 w-3" />
                            Submitted {new Date(v.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </p>
                          {v.attempt_count > 1 && (
                            <Badge variant="outline" className="text-[10px] py-0 border-white/10" style={{ color: T.sub }}>
                              Attempt {v.attempt_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>


      {/* Bulk Reject Dialog */}
      <AlertDialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {selectedIds.size} Verification(s)</AlertDialogTitle>
            <AlertDialogDescription>Provide a reason for rejecting these bank verifications.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Rejection reason (required)" value={bulkRejectReason}
            onChange={(e) => setBulkRejectReason(e.target.value)} className="min-h-[80px]" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!bulkRejectReason.trim() || bulkActionMutation.isPending}
              onClick={() => bulkActionMutation.mutate({ ids: Array.from(selectedIds), status: "rejected", reason: bulkRejectReason })}>
              {bulkActionMutation.isPending ? "Rejecting..." : "Reject All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setIsEditing(false); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl p-0 border-none shadow-2xl" style={{ backgroundColor: T.bg }}>
          <div className="sticky top-0 z-10 p-6 flex items-center justify-between border-b backdrop-blur-xl" style={{ backgroundColor: `${T.card}`, borderColor: T.border }}>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Landmark className="h-6 w-6 text-indigo-500" />
              Bank Verification Details
            </DialogTitle>
          </div>

          {selected && (
            <div className="p-6 space-y-6">
              {/* Admin action buttons */}
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-lg border-white/10 hover:bg-white/5"
                  onClick={() => { setIsEditing(!isEditing); if (!isEditing) setEditForm({ bank_holder_name: selected.profiles?.bank_holder_name || "", bank_name: selected.profiles?.bank_name || "", bank_account_number: selected.profiles?.bank_account_number || "", bank_ifsc_code: selected.profiles?.bank_ifsc_code || "", upi_id: selected.profiles?.upi_id || "" }); }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> {isEditing ? "Cancel" : "Edit Details"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-white/10" style={{ backgroundColor: T.bg }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle style={{ color: T.text }}>Delete Bank Verification</AlertDialogTitle>
                      <AlertDialogDescription style={{ color: T.sub }}>This will permanently delete this bank verification record and any uploaded proof document. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-white/10" style={{ color: T.text }}>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selected)}>
                        {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-none shadow-lg overflow-hidden" style={{ backgroundColor: T.card }}>
                  <CardHeader className="pb-4 border-b border-white/5">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: T.sub }}>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {[
                      { label: "Name", value: selected.profiles?.full_name?.[0] },
                      { label: "User Code", value: selected.profiles?.user_code?.[0], mono: true },
                      { label: "User Type", value: selected.profiles?.user_type, badge: true },
                      { label: "Email", value: selected.profiles?.email },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <span className="text-[10px] font-medium uppercase opacity-40" style={{ color: T.text }}>{item.label}</span>
                        {item.badge ? (
                          <Badge variant="outline" className="w-fit" style={{ backgroundColor: T.badge, color: T.badgeFg, borderColor: "transparent" }}>{item.value}</Badge>
                        ) : (
                          <span className={`text-sm ${item.mono ? 'font-mono' : 'font-medium'}`} style={{ color: T.text }}>{item.value}</span>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg overflow-hidden" style={{ backgroundColor: T.card }}>
                  <CardHeader className="pb-4 border-b border-white/5">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: T.sub }}>Bank Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs" style={{ color: T.sub }}>Holder Name</Label>
                          <Input className="border-white/10" style={{ backgroundColor: T.input, color: T.text }} value={editForm.bank_holder_name} onChange={(e) => setEditForm(f => ({ ...f, bank_holder_name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs" style={{ color: T.sub }}>Bank Name</Label>
                          <Input className="border-white/10" style={{ backgroundColor: T.input, color: T.text }} value={editForm.bank_name} onChange={(e) => setEditForm(f => ({ ...f, bank_name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs" style={{ color: T.sub }}>Account Number</Label>
                          <Input className="border-white/10" style={{ backgroundColor: T.input, color: T.text }} value={editForm.bank_account_number} onChange={(e) => setEditForm(f => ({ ...f, bank_account_number: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs" style={{ color: T.sub }}>IFSC Code</Label>
                          <Input className="border-white/10" style={{ backgroundColor: T.input, color: T.text }} value={editForm.bank_ifsc_code} onChange={(e) => setEditForm(f => ({ ...f, bank_ifsc_code: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs" style={{ color: T.sub }}>UPI ID</Label>
                          <Input className="border-white/10" style={{ backgroundColor: T.input, color: T.text }} value={editForm.upi_id} onChange={(e) => setEditForm(f => ({ ...f, upi_id: e.target.value }))} />
                        </div>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20" disabled={editMutation.isPending} onClick={() => editMutation.mutate({ profileId: selected.profile_id, data: editForm })}>
                          {editMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-medium uppercase opacity-40" style={{ color: T.text }}>Holder Name</span>
                          <span className="text-sm font-medium" style={{ color: T.text }}>{selected.profiles?.bank_holder_name || "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-medium uppercase opacity-40" style={{ color: T.text }}>Bank Name</span>
                          <span className="text-sm font-medium" style={{ color: T.text }}>{selected.profiles?.bank_name || "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-medium uppercase opacity-40" style={{ color: T.text }}>Account Number</span>
                          <span className="text-sm font-bold tracking-widest" style={{ color: T.text }}>{selected.profiles?.bank_account_number || "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-medium uppercase opacity-40" style={{ color: T.text }}>IFSC Code</span>
                          <span className="text-sm font-mono" style={{ color: T.text }}>{selected.profiles?.bank_ifsc_code || "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-medium uppercase opacity-40" style={{ color: T.text }}>UPI ID</span>
                          <span className="text-sm font-medium text-indigo-400" style={{ color: T.text }}>{selected.profiles?.upi_id || "—"}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {selected.document_name && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: T.text }}>Uploaded Proof Document</p>
                  <div className="flex items-center justify-between p-4 rounded-2xl border bg-white/5" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10">
                        <Landmark className="h-5 w-5 text-indigo-400" />
                      </div>
                      <span className="text-sm font-medium truncate max-w-[200px]" style={{ color: T.text }}>{selected.document_name}</span>
                    </div>
                    <Button variant="secondary" size="sm" className="rounded-xl shadow-lg" onClick={async () => {
                      if (!selected.document_path) return;
                      const { data } = await supabase.storage.from("bank-documents").createSignedUrl(selected.document_path, 300);
                      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                      else toast.error("Could not generate download link");
                    }}>
                      <Eye className="mr-2 h-4 w-4" /> View Document
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-6 py-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: T.sub }}>Current Status:</span>
                  {renderBadge(selected.status)}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: T.sub }}>Attempt:</span>
                  <Badge variant="outline" className="border-white/10" style={{ color: T.text }}>{selected.attempt_count}</Badge>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-4 p-5 rounded-2xl border backdrop-blur-md" style={{ backgroundColor: 'rgba(99,102,241,0.03)', borderColor: 'rgba(99,102,241,0.1)' }}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: T.text }}>Update Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="border-white/10 h-11" style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: T.text }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10" style={{ backgroundColor: T.bg }}>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_process">Under Process</SelectItem>
                        <SelectItem value="verified">Verified (Success)</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newStatus === "rejected" && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: T.text }}>Rejection Reason</label>
                      <Textarea 
                        placeholder="Required for rejection..." 
                        className="border-white/10 min-h-[44px] h-11 focus-visible:ring-red-500/30" 
                        style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: T.text }}
                        value={rejectReason} 
                        onChange={(e) => setRejectReason(e.target.value)} 
                      />
                    </div>
                  )}
                </div>

                <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20" disabled={actionMutation.isPending || (newStatus === "rejected" && !rejectReason.trim()) || newStatus === selected.status}
                  onClick={() => actionMutation.mutate({ id: selected.id, status: newStatus, reason: newStatus === "rejected" ? rejectReason : undefined })}>
                  {actionMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Status"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBankVerifications;