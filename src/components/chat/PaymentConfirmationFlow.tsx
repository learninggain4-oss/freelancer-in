import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Smartphone,
  RefreshCw,
  IndianRupee,
  Upload,
  FileText,
  QrCode,
  Landmark,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentConfirmation {
  id: string;
  project_id: string;
  employee_id: string;
  payment_method: string | null;
  phone_number: string | null;
  otp: string | null;
  otp_submitted_at: string | null;
  status: string;
  amount: number;
  created_at: string;
  updated_at: string;
  utr_number: string | null;
  receipt_path: string | null;
  receipt_name: string | null;
  qr_code_path: string | null;
  qr_code_name: string | null;
  client_payment_info: string | null;
  method_selected_at: string | null;
  details_shared_at: string | null;
}

interface Props {
  projectId: string;
  isClient: boolean;
  assignedEmployeeId: string | null;
  chatRoomId?: string;
}

const sendSystemMessage = async (chatRoomId: string | undefined, senderId: string | undefined, content: string) => {
  if (!chatRoomId || !senderId) return;
  await supabase.from("messages").insert({
    chat_room_id: chatRoomId,
    sender_id: senderId,
    content,
  });
};

const PaymentConfirmationFlow = ({ projectId, isClient, assignedEmployeeId, chatRoomId }: Props) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [employeeSelectedMethod, setEmployeeSelectedMethod] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Fetch payment methods from DB
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("payment_methods")
        .select("id, name, is_active, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as { id: string; name: string; is_active: boolean; display_order: number }[];
    },
    staleTime: 60000,
  });

  // Fetch countdown settings
  const { data: methodCountdown = 600 } = useQuery({
    queryKey: ["payment-method-countdown"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "payment_method_countdown_seconds")
        .maybeSingle();
      return data ? Number(data.value) : 600;
    },
    staleTime: 60000,
  });

  const { data: detailsCountdown = 420 } = useQuery({
    queryKey: ["payment-details-countdown"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "payment_details_countdown_seconds")
        .maybeSingle();
      return data ? Number(data.value) : 420;
    },
    staleTime: 60000,
  });

  // Fetch all payment confirmations
  const { data: confirmations = [], isLoading } = useQuery({
    queryKey: ["payment-confirmations", projectId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("payment_confirmations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PaymentConfirmation[];
    },
    refetchInterval: 10000,
    placeholderData: (prev: any) => prev,
  });

  const confirmation = confirmations.length > 0 ? confirmations[0] : null;
  const failedCount = confirmations.filter((c) => c.status === "failure").length;

  // Fetch admin re-initiation settings
  const { data: adminPaymentSettings } = useQuery({
    queryKey: ["payment-admin-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["payment_max_retries", "payment_reinitiation_enabled"]);
      const settings = { maxRetries: 3, enabled: true };
      if (data) {
        for (const row of data) {
          if (row.key === "payment_max_retries") settings.maxRetries = Number(row.value) || 3;
          if (row.key === "payment_reinitiation_enabled") settings.enabled = row.value === "true";
        }
      }
      return settings;
    },
    staleTime: 60000,
  });

  const maxRetries = adminPaymentSettings?.maxRetries ?? 3;
  const reinitiationEnabled = adminPaymentSettings?.enabled ?? true;

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`payment-confirmation:${projectId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "payment_confirmations",
        filter: `project_id=eq.${projectId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["payment-confirmations", projectId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, queryClient]);

  // --- Client: Initiate Payment Request ---
  const handleInitiate = async () => {
    if (!assignedEmployeeId) return;
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const insertData: any = {
        project_id: projectId,
        employee_id: assignedEmployeeId,
        status: "initiated",
        amount: amt,
      };
      if (selectedMethods.length > 0) {
        insertData.payment_method = selectedMethods.join(", ");
      }
      const { error } = await (supabase as any)
        .from("payment_confirmations")
        .insert(insertData);
      if (error) throw error;
      const methodsText = selectedMethods.length > 0 ? ` (Methods: ${selectedMethods.join(", ")})` : "";
      await sendSystemMessage(chatRoomId, profile?.id, `💳 Payment Request — ₹${amt}${methodsText}`);
      toast.success("Payment Request sent to employee.");
      setAmount("");
      setSelectedMethods([]);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Employee: Select Payment Method ---
  const handleSelectMethod = async () => {
    if (!confirmation || !employeeSelectedMethod) return;
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("payment_confirmations")
        .update({
          payment_method: employeeSelectedMethod,
          status: "method_selected",
          method_selected_at: new Date().toISOString(),
        })
        .eq("id", confirmation.id);
      if (error) throw error;
      await sendSystemMessage(chatRoomId, profile?.id, `💳 Payment method selected: ${employeeSelectedMethod}`);
      toast.success("Payment method selected. Waiting for client to share payment details.");
      setEmployeeSelectedMethod("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Client: Share Payment Details (QR, UPI, Bank) ---
  const handleShareDetails = async () => {
    if (!confirmation) return;
    if (!upiId.trim() && !bankDetails.trim() && !qrCodeFile) {
      toast.error("Please provide at least one payment detail (QR Code, UPI ID, or Bank details).");
      return;
    }
    setLoading(true);
    try {
      let qrPath: string | null = null;
      let qrName: string | null = null;

      if (qrCodeFile) {
        const ext = qrCodeFile.name.split(".").pop();
        const filePath = `${projectId}/${confirmation.id}/qr-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("payment-attachments")
          .upload(filePath, qrCodeFile);
        if (uploadErr) throw uploadErr;
        qrPath = filePath;
        qrName = qrCodeFile.name;
      }

      const paymentInfo: any = {};
      if (upiId.trim()) paymentInfo.upi_id = upiId.trim();
      if (bankDetails.trim()) paymentInfo.bank_details = bankDetails.trim();

      const { error } = await (supabase as any)
        .from("payment_confirmations")
        .update({
          status: "details_shared",
          details_shared_at: new Date().toISOString(),
          qr_code_path: qrPath,
          qr_code_name: qrName,
          client_payment_info: Object.keys(paymentInfo).length > 0 ? JSON.stringify(paymentInfo) : null,
        })
        .eq("id", confirmation.id);
      if (error) throw error;
      await sendSystemMessage(chatRoomId, profile?.id, `💳 Payment details shared with employee`);
      toast.success("Payment details shared with employee.");
      setUpiId("");
      setBankDetails("");
      setQrCodeFile(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Employee: Mark as Paid with UTR + Receipt ---
  const handleMarkPaid = async () => {
    if (!confirmation || !utrNumber.trim()) {
      toast.error("Please enter the UTR number.");
      return;
    }
    setLoading(true);
    try {
      let rPath: string | null = null;
      let rName: string | null = null;

      if (receiptFile) {
        const ext = receiptFile.name.split(".").pop();
        const filePath = `${projectId}/${confirmation.id}/receipt-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("payment-attachments")
          .upload(filePath, receiptFile);
        if (uploadErr) throw uploadErr;
        rPath = filePath;
        rName = receiptFile.name;
      }

      const { error } = await (supabase as any)
        .from("payment_confirmations")
        .update({
          status: "paid",
          utr_number: utrNumber.trim(),
          receipt_path: rPath,
          receipt_name: rName,
          otp_submitted_at: new Date().toISOString(), // reuse for paid timestamp
        })
        .eq("id", confirmation.id);
      if (error) throw error;
      await sendSystemMessage(chatRoomId, profile?.id, `💳 Payment submitted — UTR: ${utrNumber.trim()}`);
      toast.success("Payment submitted! Waiting for client confirmation.");
      setUtrNumber("");
      setReceiptFile(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Client: Mark Success/Failure ---
  const handleResult = async (result: "success" | "failure") => {
    if (!confirmation) return;
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("payment_confirmations")
        .update({ status: result })
        .eq("id", confirmation.id);
      if (error) throw error;
      const emoji = result === "success" ? "✅" : "❌";
      await sendSystemMessage(chatRoomId, profile?.id, `${emoji} Payment ${result === "success" ? "confirmed successful" : "marked as failed"} — ₹${confirmation.amount}`);
      toast.success(result === "success" ? "Payment marked as successful!" : "Payment marked as failed.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return null;

  const canReinitiate = isClient && reinitiationEnabled && failedCount < maxRetries;

  // ===== No active confirmation — show initiate form for client =====
  if (!confirmation || (confirmation.status === "failure" && canReinitiate)) {
    if (!isClient) {
      if (confirmation?.status === "failure") {
        return (
          <PaymentCard>
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">Payment Failed</span>
            </div>
            {confirmation.payment_method && (
              <p className="text-xs text-muted-foreground mt-1">
                Via {confirmation.payment_method} • ₹{confirmation.amount}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Waiting for client to re-initiate...</p>
          </PaymentCard>
        );
      }
      return null;
    }
    return (
      <PaymentCard>
        {confirmation?.status === "failure" && (
          <div className="flex items-center gap-2 text-destructive mb-3">
            <XCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Previous payment failed</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {failedCount}/{maxRetries} attempts used
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          {confirmation?.status === "failure" ? (
            <RefreshCw className="h-4 w-4 text-primary" />
          ) : (
            <CreditCard className="h-4 w-4 text-primary" />
          )}
          <span className="font-semibold text-sm">
            {confirmation?.status === "failure" ? "Re-initiate Payment" : "Payment Request"}
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Amount (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 text-sm pl-8"
                min="1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Payment Methods (for employee to choose from)</Label>
            <div className="mt-1.5 space-y-2 rounded-md border p-2.5">
              {paymentMethods.length === 0 ? (
                <p className="text-xs text-muted-foreground">No payment methods available. Admin must activate them.</p>
              ) : (
                paymentMethods.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedMethods.includes(m.name)}
                      onCheckedChange={(checked) => {
                        setSelectedMethods((prev) =>
                          checked ? [...prev, m.name] : prev.filter((n) => n !== m.name)
                        );
                      }}
                    />
                    <span className="text-sm">{m.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleInitiate}
            disabled={loading || !amount || Number(amount) <= 0}
            className="gap-1.5 w-full"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
            {confirmation?.status === "failure" ? "Re-initiate Payment" : "Send Payment Request"}
          </Button>
        </div>
      </PaymentCard>
    );
  }

  // ===== Completed states =====
  if (confirmation.status === "success") {
    return (
      <PaymentCard>
        <div className="flex items-center gap-2 text-accent">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold text-sm">Payment Successful</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1 space-y-1">
          <p>₹{confirmation.amount}{confirmation.payment_method && ` • Via ${confirmation.payment_method}`}</p>
          {confirmation.utr_number && <p>UTR: <strong className="text-foreground font-mono">{confirmation.utr_number}</strong></p>}
        </div>
        {confirmation.receipt_path && <ReceiptLink path={confirmation.receipt_path} name={confirmation.receipt_name} />}
      </PaymentCard>
    );
  }

  if (confirmation.status === "failure" && !canReinitiate) {
    return (
      <PaymentCard>
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="h-5 w-5" />
          <span className="font-semibold text-sm">Payment Failed</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          ₹{confirmation.amount}{confirmation.payment_method && ` • Via ${confirmation.payment_method}`}
        </p>
        {isClient && (
          <p className="text-xs text-destructive/80 mt-1">
            Maximum retry attempts ({maxRetries}) reached. Contact admin for assistance.
          </p>
        )}
      </PaymentCard>
    );
  }

  // ===== STEP 1: INITIATED — Employee selects payment method =====
  if (confirmation.status === "initiated") {
    if (!isClient) {
      return (
        <PaymentCard>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Payment Request</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Amount: <strong className="text-foreground">₹{confirmation.amount}</strong>
          </p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Select Payment Method</Label>
              <Select value={employeeSelectedMethod} onValueChange={setEmployeeSelectedMethod}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Choose payment method..." />
                </SelectTrigger>
                <SelectContent>
                  {(confirmation.payment_method
                    ? confirmation.payment_method.split(",").map((n: string) => n.trim()).filter(Boolean)
                    : paymentMethods.map((m) => m.name)
                  ).map((name: string) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={handleSelectMethod}
              disabled={loading || !employeeSelectedMethod}
              className="gap-1.5 w-full"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Confirm Payment Method
            </Button>
          </div>
        </PaymentCard>
      );
    }
    return (
      <PaymentCard>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">
            Waiting for employee to select payment method...
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Amount: <strong className="text-foreground">₹{confirmation.amount}</strong>
          {confirmation.payment_method && ` • Methods: ${confirmation.payment_method}`}
        </p>
      </PaymentCard>
    );
  }

  // ===== STEP 2: METHOD_SELECTED — Client shares QR/UPI/Bank details =====
  if (confirmation.status === "method_selected") {
    if (isClient) {
      return (
        <PaymentCard>
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Share Payment Details</span>
          </div>
          <CountdownTimer
            startedAt={confirmation.method_selected_at!}
            totalSeconds={methodCountdown}
            label="Time to share details"
          />
          <p className="text-xs text-muted-foreground my-2">
            Employee selected: <strong className="text-foreground">{confirmation.payment_method}</strong>
            <br />Amount: <strong className="text-foreground">₹{confirmation.amount}</strong>
          </p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs flex items-center gap-1"><QrCode className="h-3 w-3" /> Upload QR Code</Label>
              <input
                ref={qrInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setQrCodeFile(e.target.files?.[0] || null)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => qrInputRef.current?.click()}
                className="gap-1.5 w-full mt-1"
              >
                <Upload className="h-3.5 w-3.5" />
                {qrCodeFile ? qrCodeFile.name : "Choose QR Code Image"}
              </Button>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Hash className="h-3 w-3" /> UPI ID</Label>
              <Input
                placeholder="e.g. name@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Landmark className="h-3 w-3" /> Bank Details</Label>
              <Textarea
                placeholder="Account number, IFSC code, bank name..."
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                className="text-sm"
                rows={3}
              />
            </div>
            <Button
              size="sm"
              onClick={handleShareDetails}
              disabled={loading || (!upiId.trim() && !bankDetails.trim() && !qrCodeFile)}
              className="gap-1.5 w-full"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Share Payment Details
            </Button>
          </div>
        </PaymentCard>
      );
    }
    // Employee view — waiting
    return (
      <PaymentCard>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">
            Waiting for client to share payment details...
          </span>
        </div>
        <CountdownTimer
          startedAt={confirmation.method_selected_at!}
          totalSeconds={methodCountdown}
          label="Client time remaining"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Method: <strong className="text-foreground">{confirmation.payment_method}</strong> • Amount: <strong className="text-foreground">₹{confirmation.amount}</strong>
        </p>
      </PaymentCard>
    );
  }

  // ===== STEP 3: DETAILS_SHARED — Employee sees details + marks Paid =====
  if (confirmation.status === "details_shared") {
    const paymentInfo = confirmation.client_payment_info ? JSON.parse(confirmation.client_payment_info) : {};

    if (!isClient) {
      return (
        <PaymentCard>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Payment Details from Client</span>
          </div>
          <CountdownTimer
            startedAt={confirmation.details_shared_at!}
            totalSeconds={detailsCountdown}
            label="Time to complete payment"
          />
          <div className="text-xs space-y-1 text-muted-foreground my-2">
            <p>Amount: <strong className="text-foreground">₹{confirmation.amount}</strong></p>
            <p>Method: <strong className="text-foreground">{confirmation.payment_method}</strong></p>
            {paymentInfo.upi_id && <p>UPI ID: <strong className="text-foreground font-mono">{paymentInfo.upi_id}</strong></p>}
            {paymentInfo.bank_details && (
              <div>
                <p className="font-medium text-foreground">Bank Details:</p>
                <p className="whitespace-pre-wrap text-foreground">{paymentInfo.bank_details}</p>
              </div>
            )}
          </div>
          {confirmation.qr_code_path && <QrCodeImage path={confirmation.qr_code_path} name={confirmation.qr_code_name} />}

          <div className="space-y-3 mt-3 border-t pt-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="font-semibold text-sm">Mark as Paid</span>
            </div>
            <div>
              <Label className="text-xs">UTR Number *</Label>
              <Input
                placeholder="Enter UTR / Transaction ID"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="h-9 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Upload Payment Receipt (optional)</Label>
              <input
                ref={receiptInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => receiptInputRef.current?.click()}
                className="gap-1.5 w-full mt-1"
              >
                <Upload className="h-3.5 w-3.5" />
                {receiptFile ? receiptFile.name : "Choose Receipt File"}
              </Button>
            </div>
            <Button
              size="sm"
              onClick={handleMarkPaid}
              disabled={loading || !utrNumber.trim()}
              className="gap-1.5 w-full"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Paid — Submit
            </Button>
          </div>
        </PaymentCard>
      );
    }
    // Client view — waiting for employee to pay
    return (
      <PaymentCard>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">
            Waiting for employee to complete payment...
          </span>
        </div>
        <CountdownTimer
          startedAt={confirmation.details_shared_at!}
          totalSeconds={detailsCountdown}
          label="Employee time remaining"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Method: <strong className="text-foreground">{confirmation.payment_method}</strong> • ₹{confirmation.amount}
        </p>
      </PaymentCard>
    );
  }

  // ===== STEP 4: PAID — Client sees UTR + Receipt, can confirm/reject =====
  if (confirmation.status === "paid") {
    if (isClient) {
      return (
        <PaymentCard>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Employee Payment Submitted</span>
          </div>
          <div className="text-xs space-y-1 text-muted-foreground mb-3">
            <p>Amount: <strong className="text-foreground">₹{confirmation.amount}</strong></p>
            <p>Method: <strong className="text-foreground">{confirmation.payment_method}</strong></p>
            <p>UTR Number: <strong className="text-foreground font-mono">{confirmation.utr_number}</strong></p>
          </div>
          {confirmation.receipt_path && <ReceiptLink path={confirmation.receipt_path} name={confirmation.receipt_name} />}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => handleResult("success")}
              disabled={loading}
              className="gap-1 flex-1"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Payment Success
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResult("failure")}
              disabled={loading}
              className="gap-1 flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Payment Failure
            </Button>
          </div>
        </PaymentCard>
      );
    }
    // Employee view — waiting for client confirmation
    return (
      <PaymentCard>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-4 w-4 text-accent" />
          <span className="font-semibold text-sm">Payment Submitted</span>
        </div>
        <p className="text-xs text-muted-foreground">
          UTR: <strong className="text-foreground font-mono">{confirmation.utr_number}</strong> • ₹{confirmation.amount}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Waiting for client to confirm payment...</p>
      </PaymentCard>
    );
  }

  // Legacy statuses (pending_otp, otp_submitted) — show generic waiting
  if (confirmation.status === "pending_otp" || confirmation.status === "otp_submitted") {
    return (
      <PaymentCard>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">Payment in progress...</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">₹{confirmation.amount}</p>
      </PaymentCard>
    );
  }

  return null;
};

// --- Wrapper Card ---
const PaymentCard = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-4 my-2 rounded-lg border bg-card p-4 shadow-sm">
    {children}
  </div>
);

// --- Countdown Timer ---
const CountdownTimer = ({ startedAt, totalSeconds, label }: { startedAt: string; totalSeconds: number; label?: string }) => {
  const totalMs = totalSeconds * 1000;
  const [remaining, setRemaining] = useState(() => {
    const deadline = new Date(startedAt).getTime() + totalMs;
    return Math.max(0, deadline - Date.now());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const deadline = new Date(startedAt).getTime() + totalMs;
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left);
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, totalMs]);

  const secs = Math.floor(remaining / 1000);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  const progress = (remaining / totalMs) * 100;

  if (remaining <= 0) {
    return (
      <p className="text-xs font-medium text-destructive flex items-center gap-1">
        <Clock className="h-3 w-3" /> Time expired
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" /> {label || "Time remaining"}
        </span>
        <span className={`font-mono font-medium ${remaining < 30000 ? "text-destructive" : "text-warning"}`}>
          {String(mins).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
};

// --- QR Code Image Preview ---
const QrCodeImage = ({ path, name }: { path: string; name: string | null }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUrl = async () => {
      const { data } = await supabase.storage
        .from("payment-attachments")
        .createSignedUrl(path, 3600);
      if (data?.signedUrl) setUrl(data.signedUrl);
    };
    getUrl();
  }, [path]);

  if (!url) return null;
  return (
    <div className="mt-2">
      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
        <QrCode className="h-3 w-3" /> QR Code
      </p>
      <img src={url} alt={name || "QR Code"} className="max-w-[200px] rounded-md border" />
    </div>
  );
};

// --- Receipt Link ---
const ReceiptLink = ({ path, name }: { path: string; name: string | null }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUrl = async () => {
      const { data } = await supabase.storage
        .from("payment-attachments")
        .createSignedUrl(path, 3600);
      if (data?.signedUrl) setUrl(data.signedUrl);
    };
    getUrl();
  }, [path]);

  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
    >
      <FileText className="h-3 w-3" />
      {name || "View Receipt"}
    </a>
  );
};

export default PaymentConfirmationFlow;
