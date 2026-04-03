import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CreditCard,
  Send,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  QrCode,
  Building2,
  Smartphone,
  Eye,
  RefreshCw,
  Copy,
  Download,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Countdown display with label                                       */
/* ------------------------------------------------------------------ */
const CountdownDisplay = ({
  deadline,
  label,
}: {
  deadline: Date;
  label?: string;
}) => {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, deadline.getTime() - Date.now())
  );

  useEffect(() => {
    const iv = setInterval(
      () => setRemaining(Math.max(0, deadline.getTime() - Date.now())),
      1000
    );
    return () => clearInterval(iv);
  }, [deadline]);

  if (remaining <= 0)
    return (
      <Badge variant="destructive" className="text-[10px] gap-1">
        <Clock className="h-3 w-3" />
        {label ? `${label} — ` : ""}Time Expired
      </Badge>
    );

  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);

  return (
    <Badge variant="outline" className="text-[10px] gap-1">
      <Clock className="h-3 w-3" />
      {label ? `${label}: ` : ""}
      {m}:{s.toString().padStart(2, "0")}
    </Badge>
  );
};

/* ------------------------------------------------------------------ */
/*  Copy helper                                                        */
/* ------------------------------------------------------------------ */
const CopyButton = ({ text, label }: { text: string; label?: string }) => (
  <button
    onClick={() => {
      navigator.clipboard.writeText(text);
      toast.success(`${label || "Text"} copied!`);
    }}
    className="inline-flex items-center gap-0.5 text-primary hover:underline text-[10px]"
    title="Copy"
  >
    <Copy className="h-3 w-3" />
    Copy
  </button>
);

/* ------------------------------------------------------------------ */
/*  Types / helpers                                                    */
/* ------------------------------------------------------------------ */
interface Props {
  projectId: string;
  isClient: boolean;
  employeeId: string | null;
  projectStatus: string;
}

type ShareType = "qr" | "upi" | "bank";

const ACTIVE_STATUSES = [
  "in_progress",
  "job_confirmed",
  "payment_processing",
  "validation",
];

const STATUS_LABELS: Record<string, { cls: string; text: string }> = {
  initiated: {
    cls: "bg-warning/20 text-warning",
    text: "Awaiting Method Selection",
  },
  method_selected: {
    cls: "bg-primary/20 text-primary",
    text: "Awaiting Payment Details",
  },
  details_shared: {
    cls: "bg-primary/20 text-primary",
    text: "Awaiting Payment Proof",
  },
  proof_submitted: {
    cls: "bg-warning/20 text-warning",
    text: "Awaiting OTP Verification",
  },
  otp_submitted: {
    cls: "bg-warning/20 text-warning",
    text: "Auto Checking…",
  },
  success: { cls: "bg-accent/20 text-accent", text: "Payment Successful" },
  failed: {
    cls: "bg-destructive/20 text-destructive",
    text: "Payment Failed",
  },
};

const parseClientInfo = (raw: string | null) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
const PaymentExchangePanel = ({
  projectId,
  isClient,
  employeeId,
  projectStatus,
}: Props) => {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showInitForm, setShowInitForm] = useState(false);

  /* --- Form states --- */
  const [prAmount, setPrAmount] = useState("");
  const [prMethods, setPrMethods] = useState<string[]>([]);
  const [prWarning, setPrWarning] = useState("");
  const [showPrWarning, setShowPrWarning] = useState(false);

  const [selectedMethod, setSelectedMethod] = useState("");
  const [empPhone, setEmpPhone] = useState("");

  const [shareTypes, setShareTypes] = useState<ShareType[]>([]);
  const [upiId, setUpiId] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [shareWarning, setShareWarning] = useState("");
  const [showShareWarning, setShowShareWarning] = useState(false);

  const [utrNumber, setUtrNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSentAt, setOtpSentAt] = useState<Date | null>(null);

  const [clientReceiptFile, setClientReceiptFile] = useState<File | null>(null);

  /* --- Queries --- */
  const { data: confirmation } = useQuery({
    queryKey: ["payment-confirmation", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_confirmations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    refetchInterval: 10000,
    placeholderData: (prev: any) => prev,
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      return data || [];
    },
  });

  const { data: countdowns = [] } = useQuery({
    queryKey: ["countdowns-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("countdowns")
        .select("*")
        .eq("is_active", true)
        .eq("is_cleared", false)
        .order("display_order");
      return data || [];
    },
  });

  const { data: clientSharingEnabled = true } = useQuery({
    queryKey: ["client-payment-sharing-setting"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "client_payment_sharing_enabled")
        .maybeSingle();
      return data?.value !== "false";
    },
  });

  // Signed URLs for attachments
  const { data: qrUrl } = useQuery({
    queryKey: ["signed-url", confirmation?.qr_code_path],
    queryFn: async () => {
      if (!confirmation?.qr_code_path) return null;
      const { data } = await supabase.storage
        .from("payment-attachments")
        .createSignedUrl(confirmation.qr_code_path, 600);
      return data?.signedUrl || null;
    },
    enabled: !!confirmation?.qr_code_path,
  });

  const { data: receiptUrl } = useQuery({
    queryKey: ["signed-url", confirmation?.receipt_path],
    queryFn: async () => {
      if (!confirmation?.receipt_path) return null;
      const { data } = await supabase.storage
        .from("payment-attachments")
        .createSignedUrl(confirmation.receipt_path, 600);
      return data?.signedUrl || null;
    },
    enabled: !!confirmation?.receipt_path,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["payment-confirmation", projectId] });

  /* --- Derived --- */
  const isActive = ACTIVE_STATUSES.includes(projectStatus);
  const status = confirmation?.status || "";
  const clientInfo = parseClientInfo(confirmation?.client_payment_info ?? null);
  const showPanel = isActive || confirmation;

  if (!showPanel) return null;

  const canInitiate =
    isClient &&
    (!confirmation || status === "failed" || status === "success") &&
    isActive;

  /* --- Countdown lookup by name --- */
  const findCountdown = (name: string) =>
    countdowns.find(
      (c: any) => c.name.toLowerCase() === name.toLowerCase()
    );

  const getDeadlineByName = (ts: string | null, countdownName: string) => {
    if (!ts) return null;
    const cd = findCountdown(countdownName);
    if (!cd) return null;
    return new Date(new Date(ts).getTime() + cd.duration_minutes * 60000);
  };

  /* --- Helpers --- */
  const uploadFile = async (file: File, prefix: string) => {
    const ext = file.name.split(".").pop();
    const path = `${projectId}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("payment-attachments")
      .upload(path, file);
    if (error) throw error;
    return { path, name: file.name };
  };

  const allMethodNames = paymentMethods.map((m: any) => m.name);
  const allSelected =
    allMethodNames.length > 0 &&
    allMethodNames.every((n: string) => prMethods.includes(n));

  const toggleSelectAll = () => {
    if (allSelected) {
      setPrMethods([]);
    } else {
      setPrMethods([...allMethodNames]);
    }
  };

  const toggleShareType = (t: ShareType) => {
    setShareTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  /* ================================================================ */
  /*  ACTIONS                                                          */
  /* ================================================================ */

  const handleInitiate = async () => {
    if (!prAmount || prMethods.length === 0 || !employeeId) return;
    setLoading(true);
    try {
      const info = JSON.stringify({
        methods: prMethods,
        warning: showPrWarning && prWarning ? prWarning : undefined,
      });
      const { error } = await supabase.from("payment_confirmations").insert({
        project_id: projectId,
        employee_id: employeeId,
        amount: Number(prAmount),
        client_payment_info: info,
        status: "initiated",
      });
      if (error) throw error;
      toast.success("Payment Request sent!");
      setPrAmount("");
      setPrMethods([]);
      setPrWarning("");
      setShowPrWarning(false);
      setShowInitForm(false);
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMethod = async () => {
    if (!selectedMethod || !confirmation || !empPhone.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("payment_confirmations")
        .update({
          payment_method: selectedMethod,
          phone_number: empPhone.trim(),
          method_selected_at: new Date().toISOString(),
          status: "method_selected",
        })
        .eq("id", confirmation.id);
      if (error) throw error;
      toast.success("Payment method selected!");
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareDetails = async () => {
    if (!confirmation || shareTypes.length === 0) return;
    setLoading(true);
    try {
      const info = clientInfo || {};
      info.shared_types = shareTypes;

      if (shareTypes.includes("upi")) {
        info.upi_id = upiId;
      }
      if (shareTypes.includes("bank")) {
        info.bank_holder = bankHolder;
        info.bank_name = bankName;
        info.bank_account = bankAccount;
        info.bank_ifsc = bankIfsc;
      }
      if (showShareWarning && shareWarning) {
        info.share_warning = shareWarning;
      }

      const updates: Record<string, any> = {
        details_shared_at: new Date().toISOString(),
        status: "details_shared",
        client_payment_info: JSON.stringify(info),
      };

      if (shareTypes.includes("qr") && qrFile) {
        const { path, name } = await uploadFile(qrFile, "qr");
        updates.qr_code_path = path;
        updates.qr_code_name = name;
      }

      const { error } = await supabase
        .from("payment_confirmations")
        .update(updates)
        .eq("id", confirmation.id);
      if (error) throw error;
      toast.success("Payment details shared!");
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!confirmation || utrNumber.length !== 12 || !receiptFile) return;
    setLoading(true);
    try {
      const { path, name } = await uploadFile(receiptFile, "receipt");
      const { error } = await supabase
        .from("payment_confirmations")
        .update({
          utr_number: utrNumber,
          receipt_path: path,
          receipt_name: name,
          status: "proof_submitted",
        })
        .eq("id", confirmation.id);
      if (error) throw error;
      toast.success("Payment proof submitted!");
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!confirmation || !otp.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("payment_confirmations")
        .update({
          otp: otp.trim(),
          otp_submitted_at: new Date().toISOString(),
          status: "otp_submitted",
        })
        .eq("id", confirmation.id);
      if (error) throw error;
      toast.success("OTP sent for verification!");
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResult = async (result: "success" | "failed") => {
    if (!confirmation) return;
    setLoading(true);
    try {
      const info = clientInfo || {};
      if (clientReceiptFile) {
        const { path, name } = await uploadFile(
          clientReceiptFile,
          "client-receipt"
        );
        info.client_receipt_path = path;
        info.client_receipt_name = name;
      }

      const { error } = await supabase
        .from("payment_confirmations")
        .update({
          status: result,
          client_payment_info: JSON.stringify(info),
        })
        .eq("id", confirmation.id);
      if (error) throw error;
      toast.success(
        result === "success"
          ? "Payment confirmed successfully!"
          : "Payment marked as failed."
      );
      setClientReceiptFile(null);
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="border-b">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span>Payment Exchange</span>
          {status && STATUS_LABELS[status] && (
            <Badge className={cn("text-[10px]", STATUS_LABELS[status].cls)}>
              {STATUS_LABELS[status].text}
            </Badge>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          {/* Amount badge */}
          {confirmation && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold">
                ₹{Number(confirmation.amount).toLocaleString("en-IN")}
              </span>
              {confirmation.payment_method && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="outline" className="text-xs">
                    {confirmation.payment_method}
                  </Badge>
                </>
              )}
            </div>
          )}

          {/* =================== INITIATE (Client) =================== */}
          {canInitiate && !showInitForm && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowInitForm(true)}
              className="gap-1"
            >
              <Send className="h-3 w-3" />
              {status === "failed"
                ? "Re-initiate Payment Request"
                : "Start Payment Request"}
            </Button>
          )}

          {canInitiate && showInitForm && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-xs font-medium">Payment Request (PR)</p>
              <div>
                <Label className="text-xs">Amount (₹)</Label>
                <Input
                  type="number"
                  value={prAmount}
                  onChange={(e) => setPrAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Payment Methods</Label>
                <div className="mt-1 space-y-1">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer font-medium text-primary">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                    Select All
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {paymentMethods.map((m: any) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-1.5 text-xs cursor-pointer"
                      >
                        <Checkbox
                          checked={prMethods.includes(m.name)}
                          onCheckedChange={(c) =>
                            setPrMethods((prev) =>
                              c
                                ? [...prev, m.name]
                                : prev.filter((n) => n !== m.name)
                            )
                          }
                        />
                        {m.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox
                    checked={showPrWarning}
                    onCheckedChange={(c) => setShowPrWarning(!!c)}
                  />
                  <AlertTriangle className="h-3 w-3 text-warning" />
                  Send Warning Message
                </label>
                {showPrWarning && (
                  <Textarea
                    value={prWarning}
                    onChange={(e) => setPrWarning(e.target.value)}
                    placeholder="Enter warning message for the freelancer..."
                    className="text-sm min-h-[50px] mt-1"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInitiate}
                  disabled={loading || !prAmount || prMethods.length === 0}
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Send className="h-3 w-3 mr-1" />
                  )}
                  Send Payment Request
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowInitForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!confirmation && !isClient && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No payment request yet.
            </p>
          )}

          {/* =================== INITIATED: Freelancer selects method + phone =================== */}
          {status === "initiated" && (
            <>
              {clientInfo?.warning && (
                <div className="flex items-start gap-1.5 text-xs bg-warning/10 border border-warning/30 rounded p-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                  <span className="text-warning font-medium">
                    {clientInfo.warning}
                  </span>
                </div>
              )}
              {!isClient ? (
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-xs font-medium">Select Payment Method</p>
                  <Select
                    value={selectedMethod}
                    onValueChange={setSelectedMethod}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Choose method..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(clientInfo?.methods || []).map((m: string) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div>
                    <Label className="text-xs">
                      Payment App Phone Number
                    </Label>
                    <Input
                      value={empPhone}
                      onChange={(e) => setEmpPhone(e.target.value)}
                      placeholder="+91XXXXXXXXXX"
                      className="h-8 text-sm"
                      maxLength={13}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSelectMethod}
                    disabled={
                      loading || !selectedMethod || !empPhone.trim()
                    }
                  >
                    {loading && (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    )}
                    Confirm Method
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Waiting for freelancer to select a payment method…
                </p>
              )}
            </>
          )}

          {/* =================== METHOD_SELECTED: Client sees phone + shares details =================== */}
          {status === "method_selected" && (
            <>
              {/* Auto Matching Countdown */}
              <div className="flex items-center gap-2">
                {(() => {
                  const dl = getDeadlineByName(
                    confirmation?.method_selected_at ?? null,
                    "Auto Matching"
                  );
                  return dl ? (
                    <CountdownDisplay
                      deadline={dl}
                      label="Auto Matching"
                    />
                  ) : null;
                })()}
              </div>

              {/* Freelancer phone visible to client */}
              {confirmation?.phone_number && (
                <div className="text-xs bg-muted/50 rounded p-2 space-y-1">
                  <p className="font-medium text-foreground">
                    Freelancer Payment App Phone:
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">
                      {confirmation.phone_number}
                    </span>
                    <CopyButton
                      text={confirmation.phone_number}
                      label="Phone number"
                    />
                  </div>
                </div>
              )}

              {isClient && clientSharingEnabled ? (
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-xs font-medium">
                    Share Payment Details
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Select one or more options to share
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(["qr", "upi", "bank"] as ShareType[]).map((t) => (
                      <label
                        key={t}
                        className="flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <Checkbox
                          checked={shareTypes.includes(t)}
                          onCheckedChange={() => toggleShareType(t)}
                        />
                        {t === "qr" && (
                          <QrCode className="h-3 w-3" />
                        )}
                        {t === "upi" && (
                          <Smartphone className="h-3 w-3" />
                        )}
                        {t === "bank" && (
                          <Building2 className="h-3 w-3" />
                        )}
                        {t === "qr"
                          ? "QR Code"
                          : t === "upi"
                          ? "UPI ID"
                          : "Bank Details"}
                      </label>
                    ))}
                  </div>

                  {shareTypes.includes("qr") && (
                    <div>
                      <Label className="text-xs">Upload QR Code</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setQrFile(e.target.files?.[0] || null)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  )}

                  {shareTypes.includes("upi") && (
                    <div>
                      <Label className="text-xs">UPI ID</Label>
                      <Input
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="example@upi"
                        className="h-8 text-sm"
                      />
                    </div>
                  )}

                  {shareTypes.includes("bank") && (
                    <div className="grid gap-2">
                      <Input
                        value={bankHolder}
                        onChange={(e) => setBankHolder(e.target.value)}
                        placeholder="Account Holder Name"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Bank Name"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="Account Number"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value)}
                        placeholder="IFSC Code"
                        className="h-8 text-sm"
                      />
                    </div>
                  )}

                  {/* Warning message option */}
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Checkbox
                      checked={showShareWarning}
                      onCheckedChange={(c) => setShowShareWarning(!!c)}
                    />
                    <AlertTriangle className="h-3 w-3 text-warning" />
                    Send Warning Message
                  </label>
                  {showShareWarning && (
                    <Textarea
                      value={shareWarning}
                      onChange={(e) => setShareWarning(e.target.value)}
                      placeholder="Enter warning message..."
                      className="text-sm min-h-[50px]"
                    />
                  )}

                  <Button
                    size="sm"
                    onClick={handleShareDetails}
                    disabled={loading || shareTypes.length === 0}
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Send className="h-3 w-3 mr-1" />
                    )}
                    Share Details
                  </Button>
                </div>
              ) : isClient && !clientSharingEnabled ? (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                  Payment details sharing is managed by admin. Please wait for the admin to share payment details.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Waiting for payment details to be shared…
                </p>
              )}
            </>
          )}

          {/* =================== DETAILS_SHARED: Freelancer submits proof =================== */}
          {status === "details_shared" && (
            <>
              {/* Auto Payment Remaining Countdown */}
              <div className="flex items-center gap-2">
                {(() => {
                  const dl = getDeadlineByName(
                    confirmation?.details_shared_at ?? null,
                    "Auto Payment Remaining"
                  );
                  return dl ? (
                    <CountdownDisplay
                      deadline={dl}
                      label="Auto Payment Remaining"
                    />
                  ) : null;
                })()}
              </div>

              {/* Warning message from client */}
              {clientInfo?.share_warning && (
                <div className="flex items-start gap-1.5 text-xs bg-warning/10 border border-warning/30 rounded p-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                  <span className="text-warning font-medium">
                    {clientInfo.share_warning}
                  </span>
                </div>
              )}

              {/* Shared details visible to both */}
              <div className="text-xs bg-muted/50 rounded p-2 space-y-1">
                <p className="font-medium text-foreground">
                  Payment Details:
                </p>
                {clientInfo?.upi_id && (
                  <div className="flex items-center gap-2">
                    <span>UPI: {clientInfo.upi_id}</span>
                    {!isClient && (
                      <CopyButton
                        text={clientInfo.upi_id}
                        label="UPI ID"
                      />
                    )}
                  </div>
                )}
                {clientInfo?.bank_holder && (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span>
                        Bank: {clientInfo.bank_holder} –{" "}
                        {clientInfo.bank_name}
                      </span>
                      {!isClient && (
                        <CopyButton
                          text={`${clientInfo.bank_holder}, ${clientInfo.bank_name}, A/C: ${clientInfo.bank_account}, IFSC: ${clientInfo.bank_ifsc}`}
                          label="Bank details"
                        />
                      )}
                    </div>
                    <p>
                      A/C: {clientInfo.bank_account} | IFSC:{" "}
                      {clientInfo.bank_ifsc}
                    </p>
                  </div>
                )}
                {qrUrl && (
                  <div className="flex items-center gap-2">
                    <a
                      href={qrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary underline"
                    >
                      <Eye className="h-3 w-3" /> View QR Code
                    </a>
                    {!isClient && (
                      <a
                        href={qrUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-primary hover:underline text-[10px]"
                      >
                        <Download className="h-3 w-3" /> Download
                      </a>
                    )}
                  </div>
                )}
              </div>

              {!isClient ? (
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-xs font-medium">
                    Submit Payment Proof
                  </p>
                  <div>
                    <Label className="text-xs">
                      UTR / Reference Number (12 digits)
                    </Label>
                    <Input
                      value={utrNumber}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 12);
                        setUtrNumber(val);
                      }}
                      placeholder="Enter 12-digit UTR number"
                      className="h-8 text-sm font-mono"
                      maxLength={12}
                    />
                    {utrNumber && utrNumber.length !== 12 && (
                      <p className="text-[10px] text-destructive mt-0.5">
                        UTR must be exactly 12 digits
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">
                      Upload Payment Receipt *
                    </Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) =>
                        setReceiptFile(e.target.files?.[0] || null)
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSubmitProof}
                    disabled={
                      loading ||
                      utrNumber.length !== 12 ||
                      !receiptFile
                    }
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Upload className="h-3 w-3 mr-1" />
                    )}
                    Submit Proof
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Waiting for freelancer to submit payment proof…
                </p>
              )}
            </>
          )}

          {/* =================== PROOF_SUBMITTED: Freelancer enters OTP =================== */}
          {status === "proof_submitted" && (
            <>
              {/* Show proof to both */}
              <div className="text-xs bg-muted/50 rounded p-2 space-y-1">
                <p className="font-medium text-foreground">
                  Payment Proof:
                </p>
                <div className="flex items-center gap-2">
                  <span>
                    UTR:{" "}
                    <span className="font-mono font-semibold">
                      {confirmation?.utr_number}
                    </span>
                  </span>
                  {isClient && confirmation?.utr_number && (
                    <CopyButton
                      text={confirmation.utr_number}
                      label="UTR number"
                    />
                  )}
                </div>
                {receiptUrl && (
                  <div className="flex items-center gap-2">
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary underline"
                    >
                      <Eye className="h-3 w-3" /> View Receipt
                    </a>
                    {isClient && (
                      <a
                        href={receiptUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-primary hover:underline text-[10px]"
                      >
                        <Download className="h-3 w-3" /> Download
                      </a>
                    )}
                  </div>
                )}
              </div>

              {!isClient ? (
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-xs font-medium">Send OTP</p>
                  {/* Show phone number (read-only, from method_selected step) */}
                  <div className="text-xs bg-muted/50 rounded p-2">
                    <p className="text-muted-foreground">Payment App Phone Number:</p>
                    <p className="font-mono font-semibold">{confirmation?.phone_number || "—"}</p>
                  </div>

                  {!otpSent ? (
                    <>
                      {/* Send OTP button */}
                      <Button
                        size="sm"
                        onClick={() => {
                          setOtpSent(true);
                          setOtpSentAt(new Date());
                        }}
                        disabled={!confirmation?.phone_number}
                        className="gap-1"
                      >
                        <Send className="h-3 w-3" />
                        Send OTP
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Send OTP countdown */}
                      <div className="flex items-center gap-2">
                        {(() => {
                          if (!otpSentAt) return null;
                          const cd = findCountdown("Send Otp");
                          if (!cd) return null;
                          const dl = new Date(otpSentAt.getTime() + cd.duration_minutes * 60000);
                          return <CountdownDisplay deadline={dl} label="Send OTP" />;
                        })()}
                      </div>
                      <div>
                        <Label className="text-xs">Enter OTP</Label>
                        <Input
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter OTP from payment app"
                          className="h-8 text-sm font-mono"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSendOtp}
                        disabled={loading || !otp.trim()}
                      >
                        {loading ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Send className="h-3 w-3 mr-1" />
                        )}
                        Submit OTP
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Client sees phone number */}
                  {confirmation?.phone_number && (
                    <div className="text-xs bg-muted/50 rounded p-2 space-y-1">
                      <p className="font-medium text-foreground">Freelancer Payment App Phone:</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{confirmation.phone_number}</span>
                        <CopyButton text={confirmation.phone_number} label="Phone number" />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Waiting for freelancer to send OTP…
                  </p>
                </>
              )}
            </>
          )}

          {/* =================== OTP_SUBMITTED: Client verifies =================== */}
          {status === "otp_submitted" && (
            <>
              {/* Send OTP Countdown + Auto Checking Countdown */}
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const dl = getDeadlineByName(
                    confirmation?.otp_submitted_at ?? null,
                    "Send Otp"
                  );
                  return dl ? (
                    <CountdownDisplay
                      deadline={dl}
                      label="Send OTP"
                    />
                  ) : null;
                })()}
                {(() => {
                  const dl = getDeadlineByName(
                    confirmation?.otp_submitted_at ?? null,
                    "Auto Checking"
                  );
                  return dl ? (
                    <CountdownDisplay
                      deadline={dl}
                      label="Auto Checking"
                    />
                  ) : null;
                })()}
              </div>

              {/* Proof + OTP details */}
              <div className="text-xs bg-muted/50 rounded p-2 space-y-1">
                <p className="font-medium text-foreground">
                  Payment Proof & OTP:
                </p>
                <div className="flex items-center gap-2">
                  <span>
                    UTR:{" "}
                    <span className="font-mono font-semibold">
                      {confirmation?.utr_number}
                    </span>
                  </span>
                  {isClient && confirmation?.utr_number && (
                    <CopyButton
                      text={confirmation.utr_number}
                      label="UTR number"
                    />
                  )}
                </div>
                {receiptUrl && (
                  <div className="flex items-center gap-2">
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary underline"
                    >
                      <Eye className="h-3 w-3" /> View Receipt
                    </a>
                    {isClient && (
                      <a
                        href={receiptUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-primary hover:underline text-[10px]"
                      >
                        <Download className="h-3 w-3" /> Download
                      </a>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>
                    Phone:{" "}
                    <span className="font-mono font-semibold">
                      {confirmation?.phone_number}
                    </span>
                  </span>
                  {isClient && confirmation?.phone_number && (
                    <CopyButton
                      text={confirmation.phone_number}
                      label="Phone number"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    OTP:{" "}
                    <span className="font-mono font-semibold">
                      {confirmation?.otp}
                    </span>
                  </span>
                </div>
              </div>

              {isClient ? (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">
                      Upload Confirmation Receipt (optional)
                    </Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) =>
                        setClientReceiptFile(
                          e.target.files?.[0] || null
                        )
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleConfirmResult("success")}
                      disabled={loading}
                      className="gap-1"
                    >
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      Confirm Success
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleConfirmResult("failed")}
                      disabled={loading}
                      className="gap-1"
                    >
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      Mark Failed
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Waiting for client to verify payment…
                </p>
              )}
            </>
          )}

          {/* =================== SUCCESS =================== */}
          {status === "success" && (
            <div className="flex items-center gap-2 rounded bg-accent/10 p-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                Payment Verified Successfully
              </span>
            </div>
          )}

          {/* =================== FAILED =================== */}
          {status === "failed" && !showInitForm && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded bg-destructive/10 p-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Payment Verification Failed
                </span>
              </div>
              {isClient && isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowInitForm(true)}
                  className="gap-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                  Re-initiate Payment Request
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentExchangePanel;
