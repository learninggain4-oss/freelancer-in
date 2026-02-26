import { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Countdown display                                                  */
/* ------------------------------------------------------------------ */
const CountdownDisplay = ({ deadline }: { deadline: Date }) => {
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
      <Badge variant="destructive" className="text-[10px]">
        Time Expired
      </Badge>
    );

  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);

  return (
    <Badge variant="outline" className="text-[10px] gap-1">
      <Clock className="h-3 w-3" />
      {m}:{s.toString().padStart(2, "0")}
    </Badge>
  );
};

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
  initiated: { cls: "bg-warning/20 text-warning", text: "Awaiting Method Selection" },
  method_selected: { cls: "bg-primary/20 text-primary", text: "Awaiting Payment Details" },
  details_shared: { cls: "bg-primary/20 text-primary", text: "Awaiting Payment Proof" },
  utr_submitted: { cls: "bg-warning/20 text-warning", text: "Awaiting Verification" },
  success: { cls: "bg-accent/20 text-accent", text: "Payment Successful" },
  failed: { cls: "bg-destructive/20 text-destructive", text: "Payment Failed" },
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
  const [prMessage, setPrMessage] = useState("");

  const [selectedMethod, setSelectedMethod] = useState("");

  const [shareType, setShareType] = useState<ShareType>("upi");
  const [upiId, setUpiId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);

  const [utrNumber, setUtrNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

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

  const getDeadline = (ts: string | null, idx: number) => {
    if (!ts || !countdowns[idx]) return null;
    return new Date(
      new Date(ts).getTime() + countdowns[idx].duration_minutes * 60000
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
        message: prMessage || undefined,
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
      setPrMessage("");
      setShowInitForm(false);
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMethod = async () => {
    if (!selectedMethod || !confirmation) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("payment_confirmations")
        .update({
          payment_method: selectedMethod,
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
    if (!confirmation) return;
    setLoading(true);
    try {
      const info = clientInfo || {};
      if (shareType === "upi") {
        info.upi_id = upiId;
        info.phone_number = phoneNumber;
      } else if (shareType === "bank") {
        info.bank_holder = bankHolder;
        info.bank_name = bankName;
        info.bank_account = bankAccount;
        info.bank_ifsc = bankIfsc;
      }

      const updates: Record<string, any> = {
        details_shared_at: new Date().toISOString(),
        status: "details_shared",
        client_payment_info: JSON.stringify(info),
        phone_number: phoneNumber || confirmation.phone_number,
      };

      if (qrFile) {
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
    if (!confirmation || !utrNumber) return;
    setLoading(true);
    try {
      const updates: Record<string, any> = {
        utr_number: utrNumber,
        otp: otp || null,
        otp_submitted_at: new Date().toISOString(),
        status: "utr_submitted",
      };

      if (receiptFile) {
        const { path, name } = await uploadFile(receiptFile, "receipt");
        updates.receipt_path = path;
        updates.receipt_name = name;
      }

      const { error } = await supabase
        .from("payment_confirmations")
        .update(updates)
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

  const handleConfirmResult = async (result: "success" | "failed") => {
    if (!confirmation) return;
    setLoading(true);
    try {
      // Optionally upload client receipt
      const info = clientInfo || {};
      if (clientReceiptFile) {
        const { path, name } = await uploadFile(clientReceiptFile, "client-receipt");
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

          {/* =================== NO CONFIRMATION / INITIATE =================== */}
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
                <div className="flex flex-wrap gap-2 mt-1">
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
              <div>
                <Label className="text-xs">Message (optional)</Label>
                <Textarea
                  value={prMessage}
                  onChange={(e) => setPrMessage(e.target.value)}
                  placeholder="Instructions for the employee..."
                  className="text-sm min-h-[50px]"
                />
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

          {/* =================== INITIATED: Employee selects method =================== */}
          {status === "initiated" && (
            <>
              {clientInfo?.message && (
                <p className="text-xs bg-muted/50 rounded p-2 italic">
                  "{clientInfo.message}"
                </p>
              )}
              {!isClient ? (
                <div className="space-y-2">
                  <Label className="text-xs">Select Payment Method</Label>
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
                  <Button
                    size="sm"
                    onClick={handleSelectMethod}
                    disabled={loading || !selectedMethod}
                  >
                    {loading && (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    )}
                    Confirm Method
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Waiting for employee to select a payment method…
                </p>
              )}
            </>
          )}

          {/* =================== METHOD_SELECTED: Client shares details =================== */}
          {status === "method_selected" && (
            <>
              <div className="flex items-center gap-2">
                {(() => {
                  const dl = getDeadline(
                    confirmation?.method_selected_at ?? null,
                    0
                  );
                  return dl ? <CountdownDisplay deadline={dl} /> : null;
                })()}
              </div>
              {isClient ? (
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-xs font-medium">Share Payment Details</p>
                  <div className="flex gap-1.5">
                    {(["qr", "upi", "bank"] as ShareType[]).map((t) => (
                      <Button
                        key={t}
                        size="sm"
                        variant={shareType === t ? "default" : "outline"}
                        onClick={() => setShareType(t)}
                        className="text-xs h-7 gap-1"
                      >
                        {t === "qr" && <QrCode className="h-3 w-3" />}
                        {t === "upi" && <Smartphone className="h-3 w-3" />}
                        {t === "bank" && <Building2 className="h-3 w-3" />}
                        {t === "qr"
                          ? "QR Code"
                          : t === "upi"
                          ? "UPI"
                          : "Bank"}
                      </Button>
                    ))}
                  </div>

                  {shareType === "qr" && (
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

                  {shareType === "upi" && (
                    <div className="grid gap-2">
                      <div>
                        <Label className="text-xs">UPI ID</Label>
                        <Input
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="example@upi"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Phone Number</Label>
                        <Input
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+91..."
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {shareType === "bank" && (
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

                  <Button
                    size="sm"
                    onClick={handleShareDetails}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Send className="h-3 w-3 mr-1" />
                    )}
                    Share Details
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Waiting for client to share payment details…
                </p>
              )}
            </>
          )}

          {/* =================== DETAILS_SHARED: Employee submits proof =================== */}
          {status === "details_shared" && (
            <>
              <div className="flex items-center gap-2">
                {(() => {
                  const dl = getDeadline(
                    confirmation?.details_shared_at ?? null,
                    1
                  );
                  return dl ? <CountdownDisplay deadline={dl} /> : null;
                })()}
              </div>

              {/* Show shared details to both */}
              <div className="text-xs bg-muted/50 rounded p-2 space-y-1">
                <p className="font-medium text-foreground">Payment Details:</p>
                {clientInfo?.upi_id && <p>UPI: {clientInfo.upi_id}</p>}
                {clientInfo?.phone_number && (
                  <p>Phone: {clientInfo.phone_number}</p>
                )}
                {clientInfo?.bank_holder && (
                  <p>
                    Bank: {clientInfo.bank_holder} – {clientInfo.bank_name}
                  </p>
                )}
                {clientInfo?.bank_account && (
                  <p>
                    A/C: {clientInfo.bank_account} | IFSC:{" "}
                    {clientInfo.bank_ifsc}
                  </p>
                )}
                {qrUrl && (
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary underline"
                  >
                    <Eye className="h-3 w-3" /> View QR Code
                  </a>
                )}
              </div>

              {!isClient ? (
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-xs font-medium">Submit Payment Proof</p>
                  <div>
                    <Label className="text-xs">UTR / Reference Number</Label>
                    <Input
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="Enter UTR number"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">OTP (from payment app)</Label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP if applicable"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Upload Receipt</Label>
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
                    disabled={loading || !utrNumber}
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
                  Waiting for employee to submit payment proof…
                </p>
              )}
            </>
          )}

          {/* =================== UTR_SUBMITTED: Client verifies =================== */}
          {status === "utr_submitted" && (
            <>
              <div className="text-xs bg-muted/50 rounded p-2 space-y-1">
                <p className="font-medium text-foreground">Payment Proof:</p>
                <p>
                  UTR:{" "}
                  <span className="font-mono font-semibold">
                    {confirmation?.utr_number}
                  </span>
                </p>
                {confirmation?.otp && (
                  <p>
                    OTP:{" "}
                    <span className="font-mono font-semibold">
                      {confirmation.otp}
                    </span>
                  </p>
                )}
                {receiptUrl && (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary underline"
                  >
                    <Eye className="h-3 w-3" /> View Receipt
                  </a>
                )}
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
                        setClientReceiptFile(e.target.files?.[0] || null)
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
