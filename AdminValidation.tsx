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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Validation</h2>
        <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee, project, or UTR..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              className="text-xs capitalize"
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {statuses.filter((s) => s !== "all").map((s) => {
          const count = confirmations.filter((c) => c.status === s).length;
          return (
            <Card key={s} className="cursor-pointer hover:border-primary/30" onClick={() => setStatusFilter(s)}>
              <CardContent className="flex flex-col items-center py-3">
                <span className="text-2xl font-bold text-foreground">{count}</span>
                <span className="text-[10px] capitalize text-muted-foreground">{s.replace("_", " ")}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Payment Confirmations ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No records found.</p>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className="flex-1 min-w-[150px]">
                      <p className="text-sm font-medium text-foreground">
                        {(c.project as any)?.name || "Unknown Project"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(c.employee as any)?.full_name?.[0] || "Unknown"} •{" "}
                        {(c.employee as any)?.user_code?.[0] || ""}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-foreground">
                      ₹{c.amount.toLocaleString("en-IN")}
                    </span>

                    <Badge className={`text-[10px] ${STATUS_COLORS[c.status] || ""}`}>
                      {c.status.replace("_", " ")}
                    </Badge>

                    {c.payment_method && (
                      <Badge variant="outline" className="text-[10px]">
                        {c.payment_method}
                      </Badge>
                    )}

                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </span>
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Confirmation Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Project</span>
                  <p className="font-medium">{(selected.project as any)?.name || "Unknown"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Employee</span>
                  <p className="font-medium">
                    {(selected.employee as any)?.full_name?.[0] || "Unknown"}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({(selected.employee as any)?.user_code?.[0]})
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount</span>
                  <p className="font-semibold text-primary">₹{selected.amount.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={`${STATUS_COLORS[selected.status] || ""}`}>
                    {selected.status.replace("_", " ")}
                  </Badge>
                </div>
                {selected.payment_method && (
                  <div>
                    <span className="text-muted-foreground">Payment Method</span>
                    <p className="font-medium">{selected.payment_method}</p>
                  </div>
                )}
                {selected.phone_number && (
                  <div>
                    <span className="text-muted-foreground">Phone</span>
                    <p className="font-medium">{selected.phone_number}</p>
                  </div>
                )}
                {selected.otp && (
                  <div>
                    <span className="text-muted-foreground">OTP</span>
                    <p className="font-mono font-bold">{selected.otp}</p>
                  </div>
                )}
                {selected.utr_number && (
                  <div>
                    <span className="text-muted-foreground">UTR Number</span>
                    <p className="font-mono font-medium">{selected.utr_number}</p>
                  </div>
                )}
                {selected.client_payment_info && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Client Payment Info</span>
                    <p className="font-medium">{selected.client_payment_info}</p>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <Separator />
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Created: {new Date(selected.created_at).toLocaleString("en-IN")}</p>
                {selected.method_selected_at && (
                  <p>Method Selected: {new Date(selected.method_selected_at).toLocaleString("en-IN")}</p>
                )}
                {selected.details_shared_at && (
                  <p>Details Shared: {new Date(selected.details_shared_at).toLocaleString("en-IN")}</p>
                )}
                {selected.otp_submitted_at && (
                  <p>OTP Submitted: {new Date(selected.otp_submitted_at).toLocaleString("en-IN")}</p>
                )}
              </div>

              {/* File Attachments */}
              {(selected.receipt_path || selected.qr_code_path) && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {selected.qr_code_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleViewFile(selected.qr_code_path, selected.qr_code_name)}
                      >
                        <Image className="h-3.5 w-3.5" />
                        View QR Code
                      </Button>
                    )}
                    {selected.receipt_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleViewFile(selected.receipt_path, selected.receipt_name)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View Receipt
                      </Button>
                    )}
                  </div>
                </>
              )}

              {/* Admin Share Payment Details */}
              {(selected.status === "method_selected" || selected.status === "initiated") && (
                <>
                  <Separator />
                  {!showShareForm ? (
                    <Button size="sm" variant="outline" onClick={() => setShowShareForm(true)} className="gap-1 w-full">
                      <Send className="h-3.5 w-3.5" />
                      Share Payment Details (Admin)
                    </Button>
                  ) : (
                    <div className="space-y-2 rounded-md border p-3">
                      <p className="text-xs font-medium">Admin: Share Payment Details</p>
                      <p className="text-[10px] text-muted-foreground">Select one or more options to share on behalf of the client</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {(["qr", "upi", "bank"] as const).map((t) => (
                          <label key={t} className="flex items-center gap-1 text-xs cursor-pointer">
                            <Checkbox checked={adminShareTypes.includes(t)} onCheckedChange={() => toggleAdminShareType(t)} />
                            {t === "qr" && <QrCode className="h-3 w-3" />}
                            {t === "upi" && <Smartphone className="h-3 w-3" />}
                            {t === "bank" && <Building2 className="h-3 w-3" />}
                            {t === "qr" ? "QR Code" : t === "upi" ? "UPI ID" : "Bank Details"}
                          </label>
                        ))}
                      </div>
                      {adminShareTypes.includes("qr") && (
                        <div>
                          <Label className="text-xs">Upload QR Code</Label>
                          <Input type="file" accept="image/*" onChange={(e) => setAdminQrFile(e.target.files?.[0] || null)} className="h-8 text-xs" />
                        </div>
                      )}
                      {adminShareTypes.includes("upi") && (
                        <div>
                          <Label className="text-xs">UPI ID</Label>
                          <Input value={adminUpiId} onChange={(e) => setAdminUpiId(e.target.value)} placeholder="example@upi" className="h-8 text-sm" />
                        </div>
                      )}
                      {adminShareTypes.includes("bank") && (
                        <div className="grid gap-2">
                          <Input value={adminBankHolder} onChange={(e) => setAdminBankHolder(e.target.value)} placeholder="Account Holder Name" className="h-8 text-sm" />
                          <Input value={adminBankName} onChange={(e) => setAdminBankName(e.target.value)} placeholder="Bank Name" className="h-8 text-sm" />
                          <Input value={adminBankAccount} onChange={(e) => setAdminBankAccount(e.target.value)} placeholder="Account Number" className="h-8 text-sm" />
                          <Input value={adminBankIfsc} onChange={(e) => setAdminBankIfsc(e.target.value)} placeholder="IFSC Code" className="h-8 text-sm" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAdminShareDetails(selected.id, selected.client_payment_info)} disabled={adminSharing || adminShareTypes.length === 0}>
                          {adminSharing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                          Share Details
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowShareForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Admin Actions */}
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Force Status:</span>
                  <Select
                    value={selected.status}
                    onValueChange={(val) => updateStatusMutation.mutate({ id: selected.id, status: val })}
                  >
                    <SelectTrigger className="h-9 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["initiated", "method_selected", "details_shared", "proof_submitted", "otp_submitted", "success", "failed"].map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1"
                    disabled={selected.status === "success"}
                    onClick={() => updateStatusMutation.mutate({ id: selected.id, status: "success" })}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Mark Success
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                    disabled={selected.status === "failed"}
                    onClick={() => updateStatusMutation.mutate({ id: selected.id, status: "failed" })}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Mark Failed
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" className="gap-1 ml-auto">
                        Delete Record
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this payment confirmation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this record. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(selected.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default AdminValidation;
