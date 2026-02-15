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
import { Landmark, CheckCircle2, XCircle, Clock, Search, Eye, User, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bank Verifications</h1>
          <p className="text-sm text-muted-foreground">Review and manage bank detail verifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showCleared} onCheckedChange={setShowCleared} id="show-cleared-bank" />
          <Label htmlFor="show-cleared-bank" className="text-xs text-muted-foreground">Show cleared</Label>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, code, email, account..." className="pl-9"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setSelectedIds(new Set()); }}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="under_process">Processing</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {/* Bulk action bar */}
          {actionableFiltered.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Checkbox checked={allActionableSelected} onCheckedChange={toggleSelectAll} />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                </span>
              </div>
              {selectedIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <Button size="sm" disabled={bulkActionMutation.isPending}
                    onClick={() => bulkActionMutation.mutate({ ids: Array.from(selectedIds), status: "verified" })}>
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Verify ({selectedIds.size})
                  </Button>
                  <Button size="sm" variant="secondary" disabled={bulkActionMutation.isPending}
                    onClick={() => bulkActionMutation.mutate({ ids: Array.from(selectedIds), status: "under_process" })}>
                    <Clock className="mr-1 h-3 w-3" /> Under Process ({selectedIds.size})
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" disabled={bulkActionMutation.isPending}
                    onClick={() => setShowBulkRejectDialog(true)}>
                    <XCircle className="mr-1 h-3 w-3" /> Reject ({selectedIds.size})
                  </Button>
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
          ) : filtered.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No verifications found</CardContent></Card>
          ) : (
            filtered.map((v) => {
              const isActionable = v.status === "pending" || v.status === "under_process";
              return (
                <Card key={v.id} className="transition-colors hover:bg-muted/30">
                  <CardContent className="flex items-center gap-3 p-4">
                    {isActionable && (
                      <Checkbox
                        checked={selectedIds.has(v.id)}
                        onCheckedChange={() => toggleSelect(v.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="flex-1 cursor-pointer" onClick={() => { setSelected(v); setNewStatus(v.status); setRejectReason(v.rejection_reason || ""); setIsEditing(false); setEditForm({ bank_holder_name: v.profiles?.bank_holder_name || "", bank_name: v.profiles?.bank_name || "", bank_account_number: v.profiles?.bank_account_number || "", bank_ifsc_code: v.profiles?.bank_ifsc_code || "", upi_id: v.profiles?.upi_id || "" }); }}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{v.profiles?.full_name?.[0] ?? "—"}</span>
                            <Badge variant="outline" className="text-[10px]">{v.profiles?.user_type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {v.profiles?.user_code?.[0]} • {v.profiles?.bank_name || v.profiles?.upi_id || "No details"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted {new Date(v.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderBadge(v.status)}
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
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

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setIsEditing(false); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" /> Bank Verification Details
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* Admin action buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setIsEditing(!isEditing); if (!isEditing) setEditForm({ bank_holder_name: selected.profiles?.bank_holder_name || "", bank_name: selected.profiles?.bank_name || "", bank_account_number: selected.profiles?.bank_account_number || "", bank_ifsc_code: selected.profiles?.bank_ifsc_code || "", upi_id: selected.profiles?.upi_id || "" }); }}>
                  <Pencil className="mr-1 h-3 w-3" /> {isEditing ? "Cancel Edit" : "Edit"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Bank Verification</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete this bank verification record and any uploaded proof document. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selected)}>
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Profile Information</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {selected.profiles?.full_name?.[0]}</p>
                  <p><span className="text-muted-foreground">Code:</span> {selected.profiles?.user_code?.[0]}</p>
                  <p><span className="text-muted-foreground">Type:</span> {selected.profiles?.user_type}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selected.profiles?.email}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Bank Details</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Holder Name</Label>
                        <Input value={editForm.bank_holder_name} onChange={(e) => setEditForm(f => ({ ...f, bank_holder_name: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Bank Name</Label>
                        <Input value={editForm.bank_name} onChange={(e) => setEditForm(f => ({ ...f, bank_name: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Account Number</Label>
                        <Input value={editForm.bank_account_number} onChange={(e) => setEditForm(f => ({ ...f, bank_account_number: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">IFSC Code</Label>
                        <Input value={editForm.bank_ifsc_code} onChange={(e) => setEditForm(f => ({ ...f, bank_ifsc_code: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">UPI ID</Label>
                        <Input value={editForm.upi_id} onChange={(e) => setEditForm(f => ({ ...f, upi_id: e.target.value }))} />
                      </div>
                      <Button className="w-full" disabled={editMutation.isPending} onClick={() => editMutation.mutate({ profileId: selected.profile_id, data: editForm })}>
                        {editMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p><span className="text-muted-foreground">Holder Name:</span> {selected.profiles?.bank_holder_name || "—"}</p>
                      <p><span className="text-muted-foreground">Bank Name:</span> {selected.profiles?.bank_name || "—"}</p>
                      <p><span className="text-muted-foreground">Account Number:</span> {selected.profiles?.bank_account_number || "—"}</p>
                      <p><span className="text-muted-foreground">IFSC Code:</span> {selected.profiles?.bank_ifsc_code || "—"}</p>
                      <p><span className="text-muted-foreground">UPI ID:</span> {selected.profiles?.upi_id || "—"}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selected.document_name && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Uploaded Proof Document</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{selected.document_name}</p>
                    <Button variant="outline" size="sm" onClick={async () => {
                      if (!selected.document_path) return;
                      const { data } = await supabase.storage.from("bank-documents").createSignedUrl(selected.document_path, 300);
                      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                      else toast.error("Could not generate download link");
                    }}>
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> View Document
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Current Status:</span>
                  {renderBadge(selected.status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Attempt:</span>
                  <Badge variant="outline">{selected.attempt_count}</Badge>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Update Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_process">Under Process</SelectItem>
                      <SelectItem value="verified">Verified (Success)</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newStatus === "rejected" && (
                  <Textarea placeholder="Rejection reason (required)" value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)} className="min-h-[60px]" />
                )}

                <Button className="w-full" disabled={actionMutation.isPending || (newStatus === "rejected" && !rejectReason.trim()) || newStatus === selected.status}
                  onClick={() => actionMutation.mutate({ id: selected.id, status: newStatus, reason: newStatus === "rejected" ? rejectReason : undefined })}>
                  {actionMutation.isPending ? "Updating..." : "Update Status"}
                </Button>
              </div>

              {selected.rejection_reason && selected.status === "rejected" && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium">Rejection Reason:</p>
                  <p className="text-xs">{selected.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBankVerifications;