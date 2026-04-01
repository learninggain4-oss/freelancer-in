import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2, Search, ShieldCheck, Eye, Download, CheckCircle, XCircle,
  Clock, CreditCard, FileText, Image, RefreshCw, Send, QrCode, Smartphone, Building2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

type PaymentConfirmation = {
  id: string;
  project_id: string;
  employee_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  phone_number: string | null;
  otp: string | null;
  utr_number: string | null;
  receipt_path: string | null;
  receipt_name: string | null;
  qr_code_path: string | null;
  qr_code_name: string | null;
  client_payment_info: string | null;
  method_selected_at: string | null;
  details_shared_at: string | null;
  otp_submitted_at: string | null;
  created_at: string;
  updated_at: string;
  project?: { name: string; client_id: string; status: string };
  employee?: { full_name: string[]; user_code: string[] };
};

const STATUS_COLORS: Record<string, string> = {
  initiated: "bg-muted text-muted-foreground",
  method_selected: "bg-blue-500/10 text-blue-600",
  details_shared: "bg-amber-500/10 text-amber-600",
  proof_submitted: "bg-orange-500/10 text-orange-600",
  otp_submitted: "bg-purple-500/10 text-purple-600",
  success: "bg-accent/10 text-accent",
  failed: "bg-destructive/10 text-destructive",
};

const AdminValidation = () => {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showShareForm, setShowShareForm] = useState(false);
  const [adminShareTypes, setAdminShareTypes] = useState<("qr" | "upi" | "bank")[]>([]);
  const [adminUpiId, setAdminUpiId] = useState("");
  const [adminBankHolder, setAdminBankHolder] = useState("");
  const [adminBankName, setAdminBankName] = useState("");
  const [adminBankAccount, setAdminBankAccount] = useState("");
  const [adminBankIfsc, setAdminBankIfsc] = useState("");
  const [adminQrFile, setAdminQrFile] = useState<File | null>(null);
  const [adminSharing, setAdminSharing] = useState(false);

  const { data: confirmations = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-payment-confirmations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_confirmations")
        .select("*, project:project_id(name, client_id, status), employee:employee_id(full_name, user_code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PaymentConfirmation[];
    },
    refetchInterval: 15000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("payment_confirmations")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payment-confirmations"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_confirmations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payment-confirmations"] });
      setSelectedId(null);
      toast.success("Record deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleAdminShareType = (t: "qr" | "upi" | "bank") => {
    setAdminShareTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const handleAdminShareDetails = async (confirmationId: string, existingInfo: string | null) => {
    if (adminShareTypes.length === 0) return;
    setAdminSharing(true);
    try {
      const info = existingInfo ? JSON.parse(existingInfo) : {};
      info.shared_types = adminShareTypes;
      if (adminShareTypes.includes("upi")) info.upi_id = adminUpiId;
      if (adminShareTypes.includes("bank")) {
        info.bank_holder = adminBankHolder;
        info.bank_name = adminBankName;
        info.bank_account = adminBankAccount;
        info.bank_ifsc = adminBankIfsc;
      }

      const updates: Record<string, any> = {
        details_shared_at: new Date().toISOString(),
        status: "details_shared",
        client_payment_info: JSON.stringify(info),
      };

      if (adminShareTypes.includes("qr") && adminQrFile) {
        const ext = adminQrFile.name.split(".").pop();
        const path = `${confirmationId}/admin-qr-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("payment-attachments").upload(path, adminQrFile);
        if (uploadErr) throw uploadErr;
        updates.qr_code_path = path;
        updates.qr_code_name = adminQrFile.name;
      }

      const { error } = await supabase.from("payment_confirmations").update(updates).eq("id", confirmationId);
      if (error) throw error;
      toast.success("Payment details shared by admin!");
      setShowShareForm(false);
      setAdminShareTypes([]);
      setAdminUpiId("");
      setAdminBankHolder("");
      setAdminBankName("");
      setAdminBankAccount("");
      setAdminBankIfsc("");
      setAdminQrFile(null);
      qc.invalidateQueries({ queryKey: ["admin-payment-confirmations"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdminSharing(false);
    }
  };

  const filtered = confirmations.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const empName = (c.employee as any)?.full_name?.[0]?.toLowerCase() || "";
      const projName = (c.project as any)?.name?.toLowerCase() || "";
      const utr = c.utr_number?.toLowerCase() || "";
      return empName.includes(term) || projName.includes(term) || utr.includes(term);
    }
    return true;
  });

  const selected = confirmations.find((c) => c.id === selectedId);

  const getSignedUrl = async (path: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("payment-attachments").createSignedUrl(path, 300);
    return data?.signedUrl || null;
  };

  const handleViewFile = async (path: string | null, name: string | null) => {
    const url = await getSignedUrl(path);
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("Could not load file");
    }
  };

  const statuses = ["all", "initiated", "method_selected", "details_shared", "proof_submitted", "otp_submitted", "success", "failed"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 rounded-2xl border" style={{ background: `linear-gradient(135deg, ${T.card} 0%, rgba(99,102,241,0.05) 100%)`, borderColor: T.border }}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/20">
              <ShieldCheck className="h-6 w-6 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Project Validation</h2>
          </div>
          <p style={{ color: T.sub }}>Monitor and validate project payment flows</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} className="border-white/10 hover:bg-white/5 rounded-xl h-11 px-6 gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Filters & Stats */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px] group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors group-focus-within:text-indigo-500" style={{ color: T.sub }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee, project, or UTR..."
              className="pl-10 h-12 border-none transition-all focus-visible:ring-1 focus-visible:ring-indigo-500/50"
              style={{ backgroundColor: T.input, color: T.text }}
            />
          </div>
          <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-black/20 border border-white/5">
            {statuses.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="ghost"
                onClick={() => setStatusFilter(s)}
                className={`text-xs capitalize h-8 rounded-lg transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-lg' : 'opacity-60 hover:opacity-100'}`}
              >
                {s === "all" ? "All" : s.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex gap-3">
            {statuses.filter((s) => s !== "all").map((s) => {
              const count = confirmations.filter((c) => c.status === s).length;
              const isActive = statusFilter === s;
              return (
                <Card 
                  key={s} 
                  className={`inline-flex flex-col items-center justify-center min-w-[120px] p-4 border transition-all cursor-pointer hover:scale-105 ${isActive ? 'ring-2 ring-indigo-500/50' : ''}`} 
                  style={{ backgroundColor: T.card, borderColor: isActive ? 'rgba(99,102,241,0.5)' : T.border }}
                  onClick={() => setStatusFilter(s)}
                >
                  <span className="text-2xl font-bold mb-1" style={{ color: isActive ? '#818cf8' : T.text }}>{count}</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">{s.replace("_", " ")}</span>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-2xl overflow-hidden" style={{ backgroundColor: T.card }}>
        <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
          <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: T.sub }}>
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            Validation Workflow Logs ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="p-4 rounded-full bg-white/5 mb-4">
                <RefreshCw className="h-8 w-8 opacity-20" />
              </div>
              <p style={{ color: T.sub }}>No validation records match your filters.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="divide-y divide-white/5">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className="group flex items-center gap-4 p-5 transition-all hover:bg-white/5 cursor-pointer"
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-indigo-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate text-sm">
                        {(c.project as any)?.name || "Unknown Project"}
                      </p>
                      <p className="text-xs opacity-50 truncate" style={{ color: T.text }}>
                        {(c.employee as any)?.full_name?.[0] || "Unknown"} •{" "}
                        <span className="font-mono">{(c.employee as any)?.user_code?.[0] || ""}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm">₹{c.amount.toLocaleString("en-IN")}</p>
                      <p className="text-[10px] opacity-40 uppercase tracking-tighter">
                        {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                      <Badge className={`text-[9px] px-2 py-0 border-none uppercase tracking-widest font-bold ${STATUS_COLORS[c.status] || ""}`}>
                        {c.status.replace("_", " ")}
                      </Badge>
                      {c.payment_method && (
                        <span className="text-[10px] opacity-50 italic">via {c.payment_method}</span>
                      )}
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-4 w-4 opacity-20" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        {selected && (
          <DialogContent className="max-w-2xl p-0 border-none shadow-2xl overflow-hidden rounded-2xl" style={{ backgroundColor: T.bg }}>
            <div className="p-6 border-b border-white/5 flex items-center justify-between" style={{ backgroundColor: T.card }}>
              <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                <CreditCard className="h-6 w-6 text-indigo-500" />
                Validation Detail
              </DialogTitle>
            </div>

            <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
              {/* Top Stats */}
              <div className="grid grid-cols-3 gap-4">
                 <div className="p-4 rounded-2xl border border-white/5 bg-white/5 text-center">
                    <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Amount</p>
                    <p className="text-xl font-bold text-indigo-400">₹{selected.amount.toLocaleString("en-IN")}</p>
                 </div>
                 <div className="p-4 rounded-2xl border border-white/5 bg-white/5 text-center">
                    <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Status</p>
                    <Badge className={`text-[10px] border-none ${STATUS_COLORS[selected.status] || ""}`}>
                      {selected.status.replace("_", " ")}
                    </Badge>
                 </div>
                 <div className="p-4 rounded-2xl border border-white/5 bg-white/5 text-center">
                    <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Method</p>
                    <p className="text-sm font-bold uppercase tracking-tight">{selected.payment_method || "Pending"}</p>
                 </div>
              </div>

              {/* Data Grid */}
              <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-30">Assignment Info</h4>
                       <div className="space-y-3">
                          <div className="flex flex-col">
                             <span className="text-[10px] opacity-40 uppercase">Project</span>
                             <span className="font-bold">{(selected.project as any)?.name || "Unknown"}</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] opacity-40 uppercase">Employee</span>
                             <span className="font-bold">{(selected.employee as any)?.full_name?.[0] || "Unknown"} <span className="opacity-30 font-mono text-xs">({(selected.employee as any)?.user_code?.[0]})</span></span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-30">Transaction Details</h4>
                       <div className="space-y-3">
                          <div className="flex justify-between">
                             <span className="text-sm opacity-50">Phone Number</span>
                             <span className="text-sm font-mono">{selected.phone_number || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-sm opacity-50">UTR Number</span>
                             <span className="text-sm font-mono text-indigo-400">{selected.utr_number || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-sm opacity-50">OTP Verification</span>
                             <span className="text-sm font-bold tracking-widest bg-white/5 px-2 rounded">{selected.otp || "—"}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-30">Workflow Timeline</h4>
                       <div className="space-y-2 border-l-2 border-white/5 ml-1 pl-4">
                          {[
                            { label: "Initiated", time: selected.created_at },
                            { label: "Method Selected", time: selected.method_selected_at },
                            { label: "Details Shared", time: selected.details_shared_at },
                            { label: "OTP Submitted", time: selected.otp_submitted_at },
                          ].filter(t => t.time).map((t, i) => (
                            <div key={i} className="relative flex flex-col mb-4">
                               <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                               <span className="text-[10px] font-bold uppercase tracking-tighter opacity-80">{t.label}</span>
                               <span className="text-[10px] opacity-40">{new Date(t.time!).toLocaleString()}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Attachments */}
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-30">Attachments</h4>
                       <div className="flex gap-2">
                          {selected.qr_code_path && (
                            <Button size="sm" variant="secondary" className="flex-1 rounded-xl gap-2" onClick={() => handleViewFile(selected.qr_code_path, selected.qr_code_name)}>
                              <QrCode className="h-4 w-4" /> QR Code
                            </Button>
                          )}
                          {selected.receipt_path && (
                            <Button size="sm" variant="secondary" className="flex-1 rounded-xl gap-2" onClick={() => handleViewFile(selected.receipt_path, selected.receipt_name)}>
                              <Image className="h-4 w-4" /> Receipt
                            </Button>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Admin Interaction Section */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Admin Actions</h4>
                   <Badge variant="outline" className="text-[9px] border-white/10 uppercase">Security Overrides</Badge>
                </div>

                {/* Share Details Form */}
                {(selected.status === "method_selected" || selected.status === "initiated") && (
                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-4">
                    {!showShareForm ? (
                      <div className="text-center space-y-3 py-2">
                        <p className="text-xs opacity-60">Clients need payment credentials. Share them manually?</p>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 px-8" onClick={() => setShowShareForm(true)}>
                          <Send className="h-3.5 w-3.5" /> Start Sharing Details
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Share Payment Methods</p>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowShareForm(false)}><X className="h-3 w-3" /></Button>
                        </div>
                        
                        <div className="flex gap-4 p-3 rounded-xl bg-black/20 border border-white/5">
                          {(["qr", "upi", "bank"] as const).map((t) => (
                            <label key={t} className={`flex items-center gap-2 text-[10px] font-bold uppercase cursor-pointer transition-opacity ${adminShareTypes.includes(t) ? 'opacity-100' : 'opacity-30'}`}>
                              <Checkbox checked={adminShareTypes.includes(t)} onCheckedChange={() => toggleAdminShareType(t)} className="border-white/20" />
                              {t === "qr" && <QrCode className="h-3 w-3" />}
                              {t === "upi" && <Smartphone className="h-3 w-3" />}
                              {t === "bank" && <Building2 className="h-3 w-3" />}
                              {t === "qr" ? "QR" : t === "upi" ? "UPI" : "Bank"}
                            </label>
                          ))}
                        </div>

                        <div className="grid gap-3">
                          {adminShareTypes.includes("qr") && (
                            <div className="space-y-1.5 p-3 rounded-xl bg-black/20 border border-white/5">
                              <Label className="text-[10px] uppercase opacity-40">QR Code File</Label>
                              <Input type="file" accept="image/*" onChange={(e) => setAdminQrFile(e.target.files?.[0] || null)} className="h-9 text-xs border-white/10 bg-transparent" />
                            </div>
                          )}
                          {adminShareTypes.includes("upi") && (
                            <div className="space-y-1.5 p-3 rounded-xl bg-black/20 border border-white/5">
                              <Label className="text-[10px] uppercase opacity-40">UPI ID</Label>
                              <Input value={adminUpiId} onChange={(e) => setAdminUpiId(e.target.value)} placeholder="example@upi" className="h-9 text-xs border-white/10 bg-transparent" />
                            </div>
                          )}
                          {adminShareTypes.includes("bank") && (
                            <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-3">
                              <Label className="text-[10px] uppercase opacity-40">Bank Details</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Input value={adminBankHolder} onChange={(e) => setAdminBankHolder(e.target.value)} placeholder="Holder Name" className="h-8 text-xs border-white/10 bg-transparent" />
                                <Input value={adminBankName} onChange={(e) => setAdminBankName(e.target.value)} placeholder="Bank Name" className="h-8 text-xs border-white/10 bg-transparent" />
                                <Input value={adminBankAccount} onChange={(e) => setAdminBankAccount(e.target.value)} placeholder="Account Number" className="h-8 text-xs border-white/10 bg-transparent" />
                                <Input value={adminBankIfsc} onChange={(e) => setAdminBankIfsc(e.target.value)} placeholder="IFSC Code" className="h-8 text-xs border-white/10 bg-transparent" />
                              </div>
                            </div>
                          )}
                        </div>

                        <Button 
                          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg" 
                          onClick={() => handleAdminShareDetails(selected.id, selected.client_payment_info)} 
                          disabled={adminSharing || adminShareTypes.length === 0}
                        >
                          {adminSharing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                          Push Details to Client
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Overrides */}
                <div className="grid grid-cols-[1fr,auto] gap-4 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase opacity-40">Force Lifecycle Status</Label>
                    <Select
                      value={selected.status}
                      onValueChange={(val) => updateStatusMutation.mutate({ id: selected.id, status: val })}
                    >
                      <SelectTrigger className="h-10 border-white/10" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10" style={{ backgroundColor: T.bg }}>
                        {["initiated", "method_selected", "details_shared", "proof_submitted", "otp_submitted", "success", "failed"].map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-xl px-4" disabled={selected.status === "success"} onClick={() => updateStatusMutation.mutate({ id: selected.id, status: "success" })}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Success
                    </Button>
                    <Button size="sm" variant="outline" className="h-10 border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl px-4" disabled={selected.status === "failed"} onClick={() => updateStatusMutation.mutate({ id: selected.id, status: "failed" })}>
                      <XCircle className="h-4 w-4 mr-2" /> Fail
                    </Button>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full h-10 border border-white/5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl">
                      <Trash2 className="h-4 w-4 mr-2" /> Purge Record
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-white/10" style={{ backgroundColor: T.bg }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle style={{ color: T.text }}>Delete Log Entry?</AlertDialogTitle>
                      <AlertDialogDescription style={{ color: T.sub }}>
                        This will remove all proof and history for this specific payment attempt. It cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-white/10" style={{ color: T.text }}>Keep it</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 text-white" onClick={() => deleteMutation.mutate(selected.id)}>
                        Delete Log
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default AdminValidation;
