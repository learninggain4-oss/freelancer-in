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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, CheckCircle2, XCircle, Clock, Search, Eye, User, Pencil, Trash2, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

type Verification = {
  id: string;
  profile_id: string;
  aadhaar_number: string;
  name_on_aadhaar: string;
  dob_on_aadhaar: string;
  address_on_aadhaar: string;
  front_image_path: string;
  back_image_path: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  verified_at: string | null;
  profiles: {
    full_name: string[];
    user_code: string[];
    email: string;
    user_type: string;
    date_of_birth: string | null;
    mobile_number: string | null;
  };
};

const AdminVerifications = () => {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name_on_aadhaar: "", aadhaar_number: "", dob_on_aadhaar: "", address_on_aadhaar: "" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  const [showCleared, setShowCleared] = useState(false);

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ["admin-verifications"],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aadhaar_verifications")
        .select("id, profile_id, aadhaar_number, name_on_aadhaar, dob_on_aadhaar, address_on_aadhaar, front_image_path, back_image_path, status, rejection_reason, created_at, verified_at, profiles!aadhaar_verifications_profile_id_fkey(full_name, user_code, email, user_type, date_of_birth, mobile_number)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Verification[];
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, status, reason, profileId, nameOnAadhaar }: { id: string; status: string; reason?: string; profileId: string; nameOnAadhaar: string }) => {
      const update: Record<string, unknown> = {
        status,
        verified_by: profile!.id,
        verified_at: new Date().toISOString(),
      };
      if (reason) update.rejection_reason = reason;
      const { error } = await supabase.from("aadhaar_verifications").update(update).eq("id", id);
      if (error) throw error;

      if (status === "verified") {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: [nameOnAadhaar] })
          .eq("id", profileId);
        if (profileError) throw profileError;
      }
    },
    onSuccess: (_, vars) => {
      toast.success(`Verification ${vars.status}${vars.status === "verified" ? " — profile name updated" : ""}`);
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedVerification(null);
      setRejectReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ ids, status, reason }: { ids: string[]; status: string; reason?: string }) => {
      const now = new Date().toISOString();
      for (const id of ids) {
        const v = verifications.find(v => v.id === id);
        if (!v) continue;
        const update: Record<string, unknown> = {
          status,
          verified_by: profile!.id,
          verified_at: now,
        };
        if (reason) update.rejection_reason = reason;
        const { error } = await supabase.from("aadhaar_verifications").update(update).eq("id", id);
        if (error) throw error;

        if (status === "verified") {
          await supabase.from("profiles").update({ full_name: [v.name_on_aadhaar] }).eq("id", v.profile_id);
        }
      }
    },
    onSuccess: (_, vars) => {
      toast.success(`${vars.ids.length} verification(s) updated to ${vars.status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedIds(new Set());
      setBulkRejectReason("");
      setShowBulkRejectDialog(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editForm }) => {
      const { error } = await supabase.from("aadhaar_verifications").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verification details updated");
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedVerification(null);
      setIsEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (v: Verification) => {
      await supabase.storage.from("aadhaar-documents").remove([v.front_image_path, v.back_image_path]);
      const { error } = await supabase.from("aadhaar_verifications").delete().eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verification record deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedVerification(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openDetail = async (v: Verification) => {
    setSelectedVerification(v);
    setRejectReason("");
    setIsEditing(false);
    setEditForm({ name_on_aadhaar: v.name_on_aadhaar, aadhaar_number: v.aadhaar_number, dob_on_aadhaar: v.dob_on_aadhaar, address_on_aadhaar: v.address_on_aadhaar });
    const { data: fData } = await supabase.storage.from("aadhaar-documents").createSignedUrl(v.front_image_path, 300);
    const { data: bData } = await supabase.storage.from("aadhaar-documents").createSignedUrl(v.back_image_path, 300);
    setFrontUrl(fData?.signedUrl ?? null);
    setBackUrl(bData?.signedUrl ?? null);
  };

  const filtered = verifications.filter((v) => {
    const statusMatch = tab === "all" || v.status === tab;
    if (!statusMatch) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      v.name_on_aadhaar.toLowerCase().includes(s) ||
      v.aadhaar_number.includes(s) ||
      v.profiles?.full_name?.[0]?.toLowerCase().includes(s) ||
      v.profiles?.user_code?.[0]?.toLowerCase().includes(s) ||
      v.profiles?.email?.toLowerCase().includes(s)
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

  const exportCSV = () => {
    const rows = [["Name on Aadhaar","Aadhaar (last 4)","User Name","User Code","Email","Status","Submitted","Verified At"]];
    filtered.forEach(v => rows.push([
      v.name_on_aadhaar || "—",
      v.aadhaar_number ? "****" + v.aadhaar_number.slice(-4) : "—",
      v.profiles?.full_name?.[0] || "—",
      v.profiles?.user_code?.[0] || "—",
      v.profiles?.email || "—",
      v.status,
      v.created_at ? new Date(v.created_at).toLocaleDateString("en-IN") : "—",
      v.verified_at ? new Date(v.verified_at).toLocaleDateString("en-IN") : "—",
    ]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const el = document.createElement("a");
    el.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    el.download = `aadhaar-verifications-${new Date().toISOString().slice(0,10)}.csv`;
    el.click();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      under_process: { variant: "outline", label: "Under Process" },
      verified: { variant: "default", label: "Verified" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const cfg = map[status] ?? map.pending;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-4 min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 rounded-2xl border" style={{ background: `linear-gradient(135deg, ${T.card} 0%, rgba(99,102,241,0.05) 100%)`, borderColor: T.border }}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/20">
              <ShieldCheck className="h-6 w-6 text-indigo-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Aadhaar Verifications</h1>
          </div>
          <p style={{ color: T.sub }}>Review and manage identity verification submissions</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:"rgba(99,102,241,.15)", border:"1px solid rgba(99,102,241,.3)", color:"#6366f1" }}>
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <div className="flex items-center gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <Switch checked={showCleared} onCheckedChange={setShowCleared} id="show-cleared-aadhaar" />
              <Label htmlFor="show-cleared-aadhaar" className="text-xs cursor-pointer" style={{ color: T.sub }}>Show cleared</Label>
            </div>
          </div>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors group-focus-within:text-indigo-500" style={{ color: T.sub }} />
        <Input 
          placeholder="Search by name, Aadhaar, email, or code..." 
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
                <p style={{ color: T.sub }}>No verifications found for this category</p>
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
                    onClick={() => openDetail(v)}
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
                                {v.profiles?.user_code?.[0]} • {v.aadhaar_number}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {statusBadge(v.status)}
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
                          {v.verified_at && (
                            <p className="text-[11px] flex items-center gap-1.5" style={{ color: T.sub }}>
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              Actioned {new Date(v.verified_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </p>
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
            <AlertDialogDescription>Provide a reason for rejecting these verifications.</AlertDialogDescription>
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

      <Dialog open={!!selectedVerification} onOpenChange={(open) => { if (!open) { setSelectedVerification(null); setFrontUrl(null); setBackUrl(null); setIsEditing(false); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl p-0 border-none shadow-2xl" style={{ backgroundColor: T.bg }}>
          <div className="sticky top-0 z-10 p-6 flex items-center justify-between border-b backdrop-blur-xl" style={{ backgroundColor: `${T.card}`, borderColor: T.border }}>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ShieldCheck className="h-6 w-6 text-indigo-500" />
              Verification Details
            </DialogTitle>
          </div>

          {selectedVerification && (
            <div className="p-6 space-y-6">
              {/* Admin action buttons */}
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-lg border-white/10 hover:bg-white/5"
                  onClick={() => { setIsEditing(!isEditing); if (!isEditing) setEditForm({ name_on_aadhaar: selectedVerification.name_on_aadhaar, aadhaar_number: selectedVerification.aadhaar_number, dob_on_aadhaar: selectedVerification.dob_on_aadhaar, address_on_aadhaar: selectedVerification.address_on_aadhaar }); }}
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
                      <AlertDialogTitle style={{ color: T.text }}>Delete Verification</AlertDialogTitle>
                      <AlertDialogDescription style={{ color: T.sub }}>This will permanently delete this Aadhaar verification record and its uploaded images. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-white/10" style={{ color: T.text }}>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selectedVerification)}>
                        {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Profile info */}
                <Card className="border-none shadow-lg overflow-hidden" style={{ backgroundColor: T.card }}>
                  <CardHeader className="pb-4 border-b border-white/5">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: T.sub }}>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {[
                      { label: "Name", value: selectedVerification.profiles?.full_name?.[0] },
                      { label: "User Code", value: selectedVerification.profiles?.user_code?.[0], mono: true },
                      { label: "User Type", value: selectedVerification.profiles?.user_type, badge: true },
                      { label: "Email", value: selectedVerification.profiles?.email },
                      { label: "Mobile", value: selectedVerification.profiles?.mobile_number ?? "—" },
                      { label: "Profile DOB", value: selectedVerification.profiles?.date_of_birth ?? "—" },
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

                {/* Aadhaar info - View or Edit mode */}
                <Card className="border-none shadow-lg overflow-hidden" style={{ backgroundColor: T.card }}>
                  <CardHeader className="pb-4 border-b border-white/5">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: T.sub }}>Aadhaar Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs" style={{ color: T.sub }}>Name on Aadhaar</Label>
                          <Input className="border-white/10" style={{ backgroundColor: T.input, color: T.text }} value={editForm.name_on_aadhaar} onChange={(e) => setEditForm(f => ({ ...f, name_on_aadhaar: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs" style={{ color: T.sub }}>Aadhaar Number</Label>
                          <Input className="border-white/10" style={{ backgroundColor: T.input, color: T.text }} value={editForm.aadhaar_number} onChange={(e) => setEditForm(f => ({ ...f, aadhaar_number: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs" style={{ color: T.sub }}>DOB on Aadhaar</Label>
                          <Input className="border-white/10" type="date" style={{ backgroundColor: T.input, color: T.text }} value={editForm.dob_on_aadhaar} onChange={(e) => setEditForm(f => ({ ...f, dob_on_aadhaar: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs" style={{ color: T.sub }}>Address</Label>
                          <Textarea className="border-white/10 min-h-[100px]" style={{ backgroundColor: T.input, color: T.text }} value={editForm.address_on_aadhaar} onChange={(e) => setEditForm(f => ({ ...f, address_on_aadhaar: e.target.value }))} />
                        </div>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20" disabled={editMutation.isPending} onClick={() => editMutation.mutate({ id: selectedVerification.id, data: editForm })}>
                          {editMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-medium uppercase opacity-40" style={{ color: T.text }}>Aadhaar Number</span>
                          <span className="text-sm font-bold tracking-widest" style={{ color: T.text }}>{selectedVerification.aadhaar_number}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-medium uppercase opacity-40" style={{ color: T.text }}>Name on Card</span>
                          <span className="text-sm font-medium" style={{ color: T.text }}>{selectedVerification.name_on_aadhaar}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-medium uppercase opacity-40" style={{ color: T.text }}>Date of Birth</span>
                          <span className="text-sm font-medium" style={{ color: T.text }}>{selectedVerification.dob_on_aadhaar}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-medium uppercase opacity-40" style={{ color: T.text }}>Address</span>
                          <span className="text-sm leading-relaxed" style={{ color: T.text }}>{selectedVerification.address_on_aadhaar}</span>
                        </div>
                        
                        {selectedVerification.profiles?.full_name?.[0] && (
                          <div className="mt-4 p-3 rounded-xl border flex items-center gap-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: T.border }}>
                            {selectedVerification.name_on_aadhaar.toLowerCase().trim() === selectedVerification.profiles.full_name[0].toLowerCase().trim()
                              ? <><div className="p-1.5 rounded-full bg-emerald-500/20"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div><span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Name matches profile</span></>
                              : <><div className="p-1.5 rounded-full bg-amber-500/20"><XCircle className="h-4 w-4 text-amber-500" /></div><span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Name mismatch</span></>
                            }
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Images */}
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { label: "Front Side", url: frontUrl },
                  { label: "Back Side", url: backUrl }
                ].map((img, i) => (
                  <div key={i} className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: T.text }}>{img.label}</p>
                    <div className="relative group aspect-[1.6/1] rounded-2xl overflow-hidden border border-white/5 bg-white/5">
                      {img.url ? (
                        <img src={img.url} alt={`Aadhaar ${img.label}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <Skeleton className="h-full w-full opacity-10" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <Button variant="secondary" size="sm" className="rounded-full shadow-xl" onClick={() => img.url && window.open(img.url, '_blank')}>
                          <Eye className="mr-2 h-4 w-4" /> View Full
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-4 py-4 border-t border-white/5">
                <span className="text-sm font-medium" style={{ color: T.sub }}>Current Status:</span>
                {statusBadge(selectedVerification.status)}
              </div>

              {(selectedVerification.status === "pending" || selectedVerification.status === "under_process") && (
                <div className="space-y-4 p-5 rounded-2xl border backdrop-blur-md" style={{ backgroundColor: 'rgba(99,102,241,0.03)', borderColor: 'rgba(99,102,241,0.1)' }}>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: T.text }}>Rejection Reason</Label>
                    <Textarea 
                      placeholder="Only required if you are rejecting this verification..." 
                      className="border-white/5 min-h-[80px] focus-visible:ring-red-500/30" 
                      style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: T.text }}
                      value={rejectReason} 
                      onChange={(e) => setRejectReason(e.target.value)} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20"
                      disabled={actionMutation.isPending}
                      onClick={() => actionMutation.mutate({ id: selectedVerification.id, status: "verified", profileId: selectedVerification.profile_id, nameOnAadhaar: selectedVerification.name_on_aadhaar })}
                    >
                      {actionMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="mr-2 h-5 w-5" /> Approve Verification</>}
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-12 border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl"
                      disabled={actionMutation.isPending || !rejectReason.trim()}
                      onClick={() => actionMutation.mutate({ id: selectedVerification.id, status: "rejected", reason: rejectReason, profileId: selectedVerification.profile_id, nameOnAadhaar: selectedVerification.name_on_aadhaar })}
                    >
                      <XCircle className="mr-2 h-5 w-5" /> Reject Application
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerifications;