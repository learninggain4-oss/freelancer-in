import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft, PlusCircle, Clock, CheckCircle2, CreditCard,
  Zap, AlertCircle, ChevronRight, Loader2,
} from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", muted:"rgba(255,255,255,.03)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", muted:"#f1f5f9" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", muted:"#f1f5f9" },
  warm:  { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", input:"#fffdf7", muted:"#fef0d0" },
  forest:{ bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", input:"#ffffff", muted:"#dcfce7" },
  ocean: { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", input:"#ffffff", muted:"#e0f2fe" },
};

type PaymentMethod = {
  id: string;
  name: string;
  is_active: boolean;
  display_order: number;
  logo_path: string | null;
};

type Step = "loading" | "wait" | "amount" | "method" | "confirm" | "done";

const BUCKET = "payment-method-logos";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function AddMoneyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { theme } = useDashboardTheme();
  const T = (TH as any)[theme] ?? TH.white;

  const base = location.pathname.startsWith("/freelancer") ? "/freelancer"
    : location.pathname.startsWith("/employee") ? "/employee"
    : location.pathname.startsWith("/employer") ? "/employer"
    : "/employer";

  const [step, setStep] = useState<Step>("loading");
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [amount, setAmount] = useState("");
  const [amtError, setAmtError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [dbError, setDbError] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  // Fetch active payment methods + UPI banner from DB
  useEffect(() => {
    const fetchMethods = async () => {
      setMethodsLoading(true);
      try {
        const { data, error } = await supabase
          .from("payment_methods")
          .select("id, name, is_active, display_order, logo_path")
          .eq("is_active", true)
          .order("display_order", { ascending: true });
        if (!error && data) setPaymentMethods(data as PaymentMethod[]);
      } catch { /* silently ignore */ } finally {
        setMethodsLoading(false);
      }
    };

    const fetchBanner = async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "upi_banner_path")
          .maybeSingle();
        if (data?.value) {
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.value);
          setBannerUrl(urlData?.publicUrl || null);
        }
      } catch { /* ignore */ }
    };

    fetchMethods();
    fetchBanner();
  }, []);

  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const claimSlot = useCallback(async () => {
    setStep("loading");
    try {
      const { data, error } = await supabase.functions.invoke("wallet-operations", {
        body: { action: "claim_add_money_slot" },
      });
      const errMsg = data?.error || error?.message || "";
      if (errMsg.includes("does not exist") || errMsg.includes("relation") || errMsg.includes("42P01")) {
        setDbError(true);
        setStep("amount");
        return;
      }
      if (error || data?.error) {
        toast.error(errMsg || "Could not connect");
        navigate(`${base}/wallet`);
        return;
      }
      if (data?.claimed) {
        setStep("amount");
      } else {
        setWaitSeconds(data?.wait_seconds ?? 0);
        setStep("wait");
      }
    } catch {
      toast.error("Connection error. Please try again.");
      navigate(`${base}/wallet`);
    }
  }, [base, navigate]);

  useEffect(() => {
    claimSlot();
    return () => {
      supabase.functions.invoke("wallet-operations", { body: { action: "release_add_money_slot" } }).catch(() => {});
    };
  }, [claimSlot]);

  useEffect(() => {
    if (step !== "wait" || waitSeconds <= 0) return;
    const timer = setInterval(() => {
      setWaitSeconds(s => {
        if (s <= 1) { clearInterval(timer); claimSlot(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, waitSeconds, claimSlot]);

  const validateAmount = (val: string) => {
    const n = Number(val);
    if (!val || isNaN(n) || n <= 0) return "Please enter a valid amount";
    if (n < 100) return "Minimum amount is ₹100";
    if (n > 50000) return "Maximum amount is ₹50,000";
    if (n % 100 !== 0) return "Amount must be a multiple of ₹100 (e.g. ₹100, ₹200, ₹500)";
    return "";
  };

  const handleAmountNext = () => {
    const err = validateAmount(amount);
    if (err) { setAmtError(err); return; }
    setAmtError("");
    setStep("method");
  };

  const handleMethodNext = () => {
    if (!selectedMethod) { toast.error("Please select a payment method"); return; }
    setStep("confirm");
  };

  const handlePay = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("wallet-operations", {
        body: {
          action: "submit_deposit_request",
          amount: Number(amount),
          payment_method: selectedMethod,
          payment_details: paymentDetails,
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Submission failed");
        return;
      }
      setOrderId(data?.order_id || "");
      setStep("done");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const minutes = Math.floor(waitSeconds / 60);
  const secs = waitSeconds % 60;
  const waitFmt = `${minutes}:${String(secs).padStart(2, "0")}`;
  const amtNum = Number(amount) || 0;

  // Detect if selected method name contains "UPI" (case-insensitive)
  const isUpiSelected = selectedMethod.toLowerCase().includes("upi") ||
    selectedMethod.toLowerCase().includes("gpay") ||
    selectedMethod.toLowerCase().includes("phonepe") ||
    selectedMethod.toLowerCase().includes("paytm") ||
    selectedMethod.toLowerCase().includes("bhim");

  if (step === "loading") return (
    <div style={{ background: T.bg, minHeight: "100vh" }} className="flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p style={{ color: T.sub }} className="text-sm font-medium">Checking availability…</p>
      </div>
    </div>
  );

  if (step === "wait") return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text }} className="flex flex-col items-center justify-center gap-6 p-6">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/20">
        <Clock className="h-12 w-12 text-amber-500" />
      </div>
      <div className="text-center space-y-2 max-w-xs">
        <h2 className="text-2xl font-black">Please Wait</h2>
        <p style={{ color: T.sub }} className="text-sm leading-relaxed">
          Another user is currently in the Add Money flow. Your session will start automatically when they finish.
        </p>
      </div>
      <div className="rounded-3xl border px-10 py-6 text-center space-y-1" style={{ background: T.card, borderColor: T.border }}>
        <p style={{ color: T.sub }} className="text-[10px] font-black uppercase tracking-widest">Time Remaining</p>
        <p className="text-5xl font-black tabular-nums text-amber-500">{waitFmt}</p>
        <p style={{ color: T.sub }} className="text-xs">minutes : seconds</p>
      </div>
      <Button variant="outline" onClick={() => navigate(`${base}/wallet`)}
        className="rounded-2xl" style={{ borderColor: T.border, color: T.sub }}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
      </Button>
    </div>
  );

  if (step === "done") return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text }} className="flex flex-col items-center justify-center gap-6 p-6">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/20 animate-bounce-once">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      </div>
      <div className="text-center space-y-2 max-w-sm">
        <h2 className="text-2xl font-black">Request Submitted!</h2>
        <p style={{ color: T.sub }} className="text-sm leading-relaxed">
          Your deposit request for <strong className="text-emerald-500">{fmt(amtNum)}</strong> has been submitted.
          Admin will verify your payment and credit the wallet shortly.
        </p>
      </div>
      {orderId && (
        <div className="rounded-2xl border px-6 py-4 text-center space-y-1 w-full max-w-xs" style={{ background: T.card, borderColor: T.border }}>
          <p style={{ color: T.sub }} className="text-[10px] font-black uppercase tracking-widest">Order ID</p>
          <p className="text-lg font-black tracking-widest text-indigo-400">{orderId}</p>
        </div>
      )}
      <div className="rounded-2xl border p-4 w-full max-w-xs space-y-1.5" style={{ background: T.muted, borderColor: T.border }}>
        <p style={{ color: T.sub }} className="text-[10px] font-black uppercase tracking-widest mb-2">What happens next?</p>
        {["Admin verifies your payment", "Wallet gets credited within 24 hours", "You'll receive a notification"].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-400">{i+1}</div>
            <p style={{ color: T.sub }} className="text-xs">{s}</p>
          </div>
        ))}
      </div>
      <Button className="w-full max-w-xs h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest"
        onClick={() => navigate(`${base}/wallet`)}>
        Back to Wallet
      </Button>
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text }} className="max-w-md mx-auto p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl"
          style={{ color: T.sub }} onClick={() => {
            if (step === "method") setStep("amount");
            else if (step === "confirm") setStep("method");
            else navigate(`${base}/wallet`);
          }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-black tracking-tight">Add Money</h1>
          <p style={{ color: T.sub }} className="text-[10px] font-bold uppercase tracking-widest">FlexPay Wallet</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {["amount","method","confirm"].map((s, i) => (
            <div key={s} className="h-1.5 w-6 rounded-full transition-all duration-300"
              style={{ background: ["amount","method","confirm"].indexOf(step) >= i ? "#6366f1" : T.border }} />
          ))}
        </div>
      </div>

      {step === "amount" && dbError && (
        <div className="rounded-2xl p-4 flex items-start gap-3 text-sm border" style={{ background: "rgba(217,119,6,.08)", borderColor: "rgba(217,119,6,.3)", color: "#b45309" }}>
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-black">Database setup pending</p>
            <p className="text-xs opacity-80 mt-0.5">Admin needs to run the migration SQL in Supabase Dashboard. The Add Money page will work fully once that's done.</p>
          </div>
        </div>
      )}

      {/* Step: Amount */}
      {step === "amount" && (
        <div className="space-y-5 animate-fade-in-up">
          <div className="rounded-3xl p-6 space-y-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="text-center space-y-1">
              <p style={{ color: T.sub }} className="text-[10px] font-black uppercase tracking-widest">Enter Amount</p>
              <p style={{ color: T.sub }} className="text-xs">Min ₹100 · Max ₹50,000 · Multiples of ₹100 only</p>
            </div>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-black text-indigo-400">₹</span>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                min={100} max={50000} step={100}
                onChange={e => { setAmount(e.target.value); setAmtError(""); }}
                onBlur={() => setAmtError(validateAmount(amount))}
                className="h-20 pl-12 text-4xl font-black border-0 rounded-2xl text-center focus-visible:ring-indigo-500/30"
                style={{ background: T.input, color: T.text }}
              />
            </div>
            {amtError && (
              <div className="flex items-center gap-2 text-rose-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{amtError}</span>
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 2000, 5000].map(q => (
                <button key={q} onClick={() => { setAmount(String(q)); setAmtError(""); }}
                  className="rounded-xl py-2 text-xs font-black uppercase tracking-wide transition-all active:scale-95"
                  style={{ background: Number(amount) === q ? "#6366f1" : T.muted, color: Number(amount) === q ? "#fff" : T.sub, border: `1px solid ${Number(amount) === q ? "#6366f1" : T.border}` }}>
                  ₹{q >= 1000 ? `${q/1000}K` : q}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20"
            onClick={handleAmountNext} disabled={!amount}>
            Continue <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Step: Method — fetched from DB */}
      {step === "method" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: T.muted, border: `1px solid ${T.border}` }}>
            <span style={{ color: T.sub }} className="text-xs font-bold uppercase tracking-widest">Amount</span>
            <span className="font-black text-lg text-indigo-400">{fmt(amtNum)}</span>
          </div>
          <p style={{ color: T.sub }} className="text-[10px] font-black uppercase tracking-widest px-1">Select Payment Method</p>

          {methodsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="rounded-2xl p-6 text-center flex flex-col items-center gap-3"
              style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <CreditCard className="h-8 w-8 opacity-30" style={{ color: T.sub }} />
              <div>
                <p className="font-black text-sm" style={{ color: T.text }}>No payment methods available</p>
                <p className="text-xs mt-1" style={{ color: T.sub }}>Please contact admin to enable payment methods.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {paymentMethods.map(m => {
                const active = selectedMethod === m.name;
                const logoUrl = getLogoUrl(m.logo_path);
                return (
                  <button key={m.id} onClick={() => setSelectedMethod(m.name)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]"
                    style={{
                      background: active ? "rgba(99,102,241,0.12)" : T.card,
                      border: `1.5px solid ${active ? "#6366f1" : T.border}`
                    }}>
                    {/* Logo or fallback icon */}
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white"
                      style={{ border: `1px solid ${T.border}` }}>
                      {logoUrl ? (
                        <img src={logoUrl} alt={m.name} className="h-full w-full object-contain p-1.5" />
                      ) : (
                        <Zap className="h-5 w-5 text-indigo-400" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-black" style={{ color: T.text }}>{m.name}</p>
                    </div>
                    <div className="h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: active ? "#6366f1" : T.border, background: active ? "#6366f1" : "transparent" }}>
                      {active && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* UPI Banner — shown when a UPI-type method is selected */}
          {isUpiSelected && bannerUrl && (
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: T.border }}>
              <img src={bannerUrl} alt="UPI Payment Details" className="w-full object-contain" />
            </div>
          )}

          {/* UPI ID input for UPI-type methods */}
          {isUpiSelected && (
            <div className="rounded-2xl p-4 space-y-2" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <p style={{ color: T.sub }} className="text-[10px] font-black uppercase tracking-widest">Your UPI ID</p>
              <Input placeholder="yourname@upi" value={paymentDetails.upi_id || ""}
                onChange={e => setPaymentDetails(d => ({ ...d, upi_id: e.target.value }))}
                className="rounded-xl border-0 font-medium" style={{ background: T.input, color: T.text }} />
              <p style={{ color: T.sub }} className="text-[10px]">Enter the UPI ID you used to make the payment</p>
            </div>
          )}

          <Button className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20"
            onClick={handleMethodNext} disabled={!selectedMethod || paymentMethods.length === 0}>
            Continue <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="rounded-3xl p-6 space-y-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="h-1 -mx-6 -mt-6 rounded-t-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <PlusCircle className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="font-black" style={{ color: T.text }}>Confirm Deposit</p>
                <p style={{ color: T.sub }} className="text-xs">Review your deposit details</p>
              </div>
            </div>
            {[
              ["Amount", fmt(amtNum), "text-2xl font-black text-emerald-500"],
              ["Payment Method", selectedMethod, "font-bold text-indigo-400"],
              ...(paymentDetails.upi_id ? [["UPI ID", paymentDetails.upi_id, "font-medium"]] : []),
              ["Name", Array.isArray(profile?.full_name) ? profile.full_name[0] : profile?.full_name || "—", "font-medium"],
            ].map(([label, value, cls]) => (
              <div key={label as string} className="flex items-center justify-between py-2"
                style={{ borderBottom: `1px solid ${T.border}` }}>
                <span style={{ color: T.sub }} className="text-xs font-black uppercase tracking-widest">{label}</span>
                <span style={{ color: T.text }} className={cls as string}>{value as string}</span>
              </div>
            ))}
            <div className="rounded-2xl p-3 text-xs leading-relaxed" style={{ background: T.muted, color: T.sub }}>
              After clicking Pay, send <strong className="text-indigo-400">{fmt(amtNum)}</strong> via <strong>{selectedMethod}</strong> to the admin's payment details. Admin will verify and credit your FlexPay wallet within 24 hours.
            </div>
          </div>
          <Button className="w-full h-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-black uppercase tracking-widest text-lg shadow-2xl shadow-indigo-600/30 transition-all active:scale-[0.98]"
            onClick={handlePay} disabled={submitting}>
            {submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing…</> : <>Pay {fmt(amtNum)}</>}
          </Button>
        </div>
      )}
    </div>
  );
}
