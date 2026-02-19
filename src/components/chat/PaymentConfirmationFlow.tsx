import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  "GPay",
  "PhonePe",
  "Paytm",
  "Amazon Pay",
  "BHIM UPI",
  "Other",
];

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
}

interface Props {
  projectId: string;
  isClient: boolean;
  assignedEmployeeId: string | null;
}

const PaymentConfirmationFlow = ({ projectId, isClient, assignedEmployeeId }: Props) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");

  // Fetch all payment confirmations for this project
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
  });

  const confirmation = confirmations.length > 0 ? confirmations[0] : null;
  const failedCount = confirmations.filter((c) => c.status === "failure").length;

  // Fetch countdown setting
  const { data: countdownSeconds = 60 } = useQuery({
    queryKey: ["payment-otp-countdown"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "payment_otp_countdown_seconds")
        .maybeSingle();
      return data ? Number(data.value) : 60;
    },
    staleTime: 60000,
  });

  // Fetch admin settings for re-initiation
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

  // --- Client: Initiate Payment Confirmation ---
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
      if (selectedMethod) {
        insertData.payment_method = selectedMethod;
      }
      const { error } = await (supabase as any)
        .from("payment_confirmations")
        .insert(insertData);
      if (error) throw error;
      toast.success("Payment Confirmation shared with employee.");
      setAmount("");
      setSelectedMethod("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Employee: Submit Payment Details (Send OTP) ---
  const handleSendOtp = async () => {
    if (!confirmation || !paymentMethod || !phoneNumber.trim()) return;
    if (phoneNumber.trim().length < 10) {
      toast.error("Enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("payment_confirmations")
        .update({
          payment_method: paymentMethod,
          phone_number: phoneNumber.trim(),
          status: "pending_otp",
        })
        .eq("id", confirmation.id);
      if (error) throw error;
      toast.success("Payment details sent! Now enter the OTP from your payment app.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Employee: Submit OTP ---
  const handleSubmitOtp = async () => {
    if (!confirmation || !otpValue.trim()) return;
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("payment_confirmations")
        .update({
          otp: otpValue.trim(),
          otp_submitted_at: new Date().toISOString(),
          status: "otp_submitted",
        })
        .eq("id", confirmation.id);
      if (error) throw error;
      setOtpValue("");
      toast.success("OTP submitted successfully.");
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
      toast.success(result === "success" ? "Payment marked as successful!" : "Payment marked as failed.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return null;

  const canReinitiate = isClient && reinitiationEnabled && failedCount < maxRetries;

  // No active confirmation — show initiate form for client only
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
            {confirmation?.status === "failure" ? "Re-initiate Payment" : "Share Payment Confirmation"}
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
            <Label className="text-xs">Payment Method (optional)</Label>
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Choose payment app..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            onClick={handleInitiate}
            disabled={loading || !amount || Number(amount) <= 0}
            className="gap-1.5 w-full"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
            {confirmation?.status === "failure" ? "Re-initiate Payment" : "Share Payment Confirmation"}
          </Button>
        </div>
      </PaymentCard>
    );
  }

  // Completed states
  if (confirmation.status === "success") {
    return (
      <PaymentCard>
        <div className="flex items-center gap-2 text-accent">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold text-sm">Payment Successful</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          ₹{confirmation.amount}
          {confirmation.payment_method && ` • Via ${confirmation.payment_method}`}
          {confirmation.phone_number && ` • ${confirmation.phone_number}`}
        </p>
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
          ₹{confirmation.amount}
          {confirmation.payment_method && ` • Via ${confirmation.payment_method}`}
        </p>
        {isClient && (
          <p className="text-xs text-destructive/80 mt-1">
            Maximum retry attempts ({maxRetries}) reached. Contact admin for assistance.
          </p>
        )}
      </PaymentCard>
    );
  }

  // === INITIATED: Employee needs to fill payment details ===
  if (confirmation.status === "initiated") {
    if (!isClient) {
      return (
        <PaymentCard>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Payment Confirmation Request</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Amount: <strong className="text-foreground">₹{confirmation.amount}</strong>
            {confirmation.payment_method && (
              <> • Preferred: <strong className="text-foreground">{confirmation.payment_method}</strong></>
            )}
          </p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Select Payment App</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Choose payment app..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Phone Number</Label>
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="h-9 text-sm"
                maxLength={10}
              />
            </div>
            <Button
              size="sm"
              onClick={handleSendOtp}
              disabled={loading || !paymentMethod || phoneNumber.length < 10}
              className="gap-1.5 w-full"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send OTP
            </Button>
          </div>
        </PaymentCard>
      );
    }
    // Client view — waiting
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
          {confirmation.payment_method && ` • ${confirmation.payment_method}`}
        </p>
      </PaymentCard>
    );
  }

  // === PENDING_OTP: Employee needs to enter OTP ===
  if (confirmation.status === "pending_otp") {
    if (!isClient) {
      return (
        <PaymentCard>
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Enter OTP</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Enter the OTP received from <strong>{confirmation.payment_method}</strong> on your phone.
            <br />Amount: <strong>₹{confirmation.amount}</strong>
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter OTP"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="h-9 text-sm flex-1 font-mono tracking-widest"
              maxLength={8}
            />
            <Button
              size="sm"
              onClick={handleSubmitOtp}
              disabled={loading || !otpValue.trim()}
              className="gap-1"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Submit
            </Button>
          </div>
        </PaymentCard>
      );
    }
    // Client view
    return (
      <PaymentCard>
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Payment Details Received</span>
        </div>
        <div className="text-xs space-y-1 text-muted-foreground">
          <p>Amount: <strong className="text-foreground">₹{confirmation.amount}</strong></p>
          <p>Payment App: <strong className="text-foreground">{confirmation.payment_method}</strong></p>
          <p>Phone: <strong className="text-foreground">{confirmation.phone_number}</strong></p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
          <span className="text-xs text-muted-foreground">Waiting for employee to submit OTP...</span>
        </div>
      </PaymentCard>
    );
  }

  // === OTP_SUBMITTED: Countdown + Client sees OTP + Success/Failure buttons ===
  if (confirmation.status === "otp_submitted") {
    if (!isClient) {
      return (
        <PaymentCard>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-accent" />
            <span className="font-semibold text-sm">OTP Submitted</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Your OTP has been submitted for ₹{confirmation.amount}. Waiting for client to confirm payment...
          </p>
          <OtpCountdown
            submittedAt={confirmation.otp_submitted_at!}
            totalSeconds={countdownSeconds}
          />
        </PaymentCard>
      );
    }
    // Client view
    return (
      <PaymentCard>
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Payment Confirmation</span>
        </div>
        <div className="text-xs space-y-1 text-muted-foreground mb-2">
          <p>Amount: <strong className="text-foreground">₹{confirmation.amount}</strong></p>
          <p>Payment App: <strong className="text-foreground">{confirmation.payment_method}</strong></p>
          <p>Phone: <strong className="text-foreground">{confirmation.phone_number}</strong></p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 mb-3">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-sm font-mono font-bold tracking-[0.3em] text-primary">
            {confirmation.otp}
          </span>
        </div>
        <OtpCountdown
          submittedAt={confirmation.otp_submitted_at!}
          totalSeconds={countdownSeconds}
        />
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

  return null;
};

// --- Wrapper Card ---
const PaymentCard = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-4 my-2 rounded-lg border bg-card p-4 shadow-sm">
    {children}
  </div>
);

// --- OTP Countdown Timer ---
const OtpCountdown = ({ submittedAt, totalSeconds }: { submittedAt: string; totalSeconds: number }) => {
  const totalMs = totalSeconds * 1000;
  const [remaining, setRemaining] = useState(() => {
    const deadline = new Date(submittedAt).getTime() + totalMs;
    return Math.max(0, deadline - Date.now());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const deadline = new Date(submittedAt).getTime() + totalMs;
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left);
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [submittedAt, totalMs]);

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
          <Clock className="h-3 w-3" /> Time remaining
        </span>
        <span className={`font-mono font-medium ${remaining < 15000 ? "text-destructive" : "text-warning"}`}>
          {String(mins).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
};

export default PaymentConfirmationFlow;
