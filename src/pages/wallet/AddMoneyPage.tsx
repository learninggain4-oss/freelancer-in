// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft, PlusCircle, CheckCircle2, CreditCard,
  Zap, AlertCircle, ChevronRight, Loader2, Gift, Clock, Settings,
} from "lucide-react";
import { getFirstTimeDepositCashback } from "@/utils/deposit-utils";

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

type Step = "amount" | "method" | "confirm" | "done";

const BUCKET = "payment-method-logos";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function AddMoneyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { theme } = useDashboardTheme();
  const T = (TH as any)[theme] ?? TH.white;

  const roleBase = (() => {
    const t = String((profile as any)?.user_type || "").toLowerCase();
    if (t === "freelancer" || t === "employee") return "/freelancer";
    if (t === "employer" || t === "client") return "/employer";
    return null;
  })();
  const pathBase = location.pathname.startsWith("/freelancer") ? "/freelancer"
    : location.pathname.startsWith("/employee") ? "/freelancer"
    : location.pathname.startsWith("/employer") ? "/employer"
    : location.pathname.startsWith("/client") ? "/employer"
    : "/employer";
  const base = roleBase || pathBase;

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [amtError, setAmtError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
  const [referenceId, setReferenceId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [cashbackPercent, setCashbackPercent] = useState(0);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [timeSlot, setTimeSlot] = useState<{ start_time: string; end_time: string; status: string; updated_at?: string | null } | null | undefined>(undefined);

  // Fetch active payment methods from DB
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

    fetchMethods();
  }, []);

  // Load user's add money time slot
  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from("add_money_time_slots")
      .select("start_time, end_time, status, updated_at")
      .eq("profile_id", profile.id)
      .maybeSingle()
      .then(({ data }) => setTimeSlot(data ?? null));
  }, [profile?.id]);

  // Load configured cashback percentage for deposit offers
  useEffect(() => {
    const loadCashback = async () => {
      try {
        const cashback = await getFirstTimeDepositCashback();
        setCashbackPercent(cashback);
      } catch (e) {
        console.error("Error loading deposit cashback:", e);
      }
    };

    loadCashback();
  }, []);

  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };


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

  const generateOrderNumber = () => `DEP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const handleMethodNext = () => {
    if (!selectedMethod) { toast.error("Please select a payment method"); return; }
    const phone = (paymentDetails.phone_number || "").trim();
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setReferenceId(generateOrderNumber());
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
          order_id: referenceId,
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Submission failed");
        return;
      }
      const responseOrderId = data?.order_id || referenceId;
      const requestIdFromResponse = data?.request_id;

      if (requestIdFromResponse) {
        navigate(`/wallet/deposit/${requestIdFromResponse}`);
        return;
      }

      // Fallback: some backends return only order_id; resolve request id client-side.
      const { data: createdReq } = await supabase
        .from("deposit_requests")
        .select("id")
        .eq("order_id", responseOrderId)
        .eq("profile_id", profile?.id || "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (createdReq?.id) {
        navigate(`/wallet/deposit/${createdReq.id}`);
        return;
      }

      // Last fallback if DB read is delayed.
      setOrderId(responseOrderId || "");
      setStep("done");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const amtNum = Number(amount) || 0;
  const selectedMethodData = paymentMethods.find(m => m.name === selectedMethod);

  // Time window check
  const now = new Date();
  const nowTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const timeSlotLoaded = timeSlot !== undefined;
  const hasTimeSlot = !!timeSlot;
  const cooldownActive = (() => {
    if (!timeSlot?.updated_at) return false;
    // epoch (1970) means admin set this slot → no cooldown
    if (new Date(timeSlot.updated_at).getFullYear() < 2000) return false;
    return (now.getTime() - new Date(timeSlot.updated_at).getTime()) < 24 * 60 * 60 * 1000;
  })();
  const isTimeAllowed = hasTimeSlot && !cooldownActive && timeSlot!.status === "active" && nowTime >= timeSlot!.start_time && nowTime <= timeSlot!.end_time;

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
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl gap-1.5 text-xs font-bold"
            style={{ color: hasTimeSlot ? (isTimeAllowed ? "#16a34a" : "#d97706") : "#6366f1", background: hasTimeSlot ? (isTimeAllowed ? "rgba(22,163,74,.08)" : "rgba(217,119,6,.08)") : "rgba(99,102,241,.08)", border: `1px solid ${hasTimeSlot ? (isTimeAllowed ? "rgba(22,163,74,.25)" : "rgba(217,119,6,.25)") : "rgba(99,102,241,.25)"}` }}
            onClick={() => navigate(`${base}/wallet/add-money-setup`)}>
            <Clock className="h-3.5 w-3.5" />
            {!hasTimeSlot ? "Setup Time" : isTimeAllowed ? "In Window" : "Set Time"}
          </Button>
          <div className="flex items-center gap-1">
            {["amount","method","confirm"].map((s, i) => (
              <div key={s} className="h-1.5 w-6 rounded-full transition-all duration-300"
                style={{ background: ["amount","method","confirm"].indexOf(step) >= i ? "#6366f1" : T.border }} />
            ))}
          </div>
        </div>
      </div>

      {/* First-Time Deposit Cashback Badge */}
      {cashbackPercent > 0 && (
        <div className="animate-fade-in-up rounded-2xl p-4 border-2" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.08))", borderColor: "rgba(34,197,94,0.3)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg" style={{ background: "linear-gradient(135deg, #22c55e, #10b981)" }}>
              🎉
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black" style={{ color: "#10b981" }}>Deposit Cashback</p>
              <p style={{ color: T.sub }} className="text-xs">Get <span className="font-bold text-emerald-500">{cashbackPercent}% cashback</span> on this deposit</p>
            </div>
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
          {/* Time window warnings */}
          {timeSlotLoaded && !hasTimeSlot && (
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.2)" }}>
              <Clock className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-indigo-400">Time window not set up</p>
                <p style={{ color: T.sub }} className="text-xs mt-0.5 leading-relaxed">You need to set up your 10-minute add money window before you can continue.</p>
                <button onClick={() => navigate(`${base}/wallet/add-money-setup`)}
                  className="mt-2 text-xs font-black text-indigo-400 underline underline-offset-2">
                  Set up now →
                </button>
              </div>
            </div>
          )}
          {timeSlotLoaded && hasTimeSlot && cooldownActive && (
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(217,119,6,.06)", border: "1px solid rgba(217,119,6,.2)" }}>
              <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-400">24-hour activation in progress</p>
                <p style={{ color: T.sub }} className="text-xs mt-0.5 leading-relaxed">
                  Your time slot was recently set up or changed. It will become active <strong className="text-amber-400">24 hours after the last update</strong>. Please wait before adding money.
                </p>
              </div>
            </div>
          )}
          {timeSlotLoaded && hasTimeSlot && !cooldownActive && !isTimeAllowed && (
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(217,119,6,.06)", border: "1px solid rgba(217,119,6,.2)" }}>
              <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-400">Outside your time window</p>
                <p style={{ color: T.sub }} className="text-xs mt-0.5 leading-relaxed">
                  Add money is available from <strong className="text-amber-400">{timeSlot!.start_time}</strong> to <strong className="text-amber-400">{timeSlot!.end_time}</strong> only.
                  Current time: <strong>{nowTime}</strong>
                </p>
                <button onClick={() => navigate(`${base}/wallet/add-money-setup`)}
                  className="mt-2 text-xs font-black text-amber-400 underline underline-offset-2">
                  Change time window →
                </button>
              </div>
            </div>
          )}
          <Button className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 disabled:opacity-40"
            onClick={handleAmountNext} disabled={!amount || (timeSlotLoaded && !isTimeAllowed)}>
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
                        <img loading="lazy" decoding="async" src={logoUrl} alt={m.name} className="h-full w-full object-contain p-1.5" />
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

          {/* Phone Number input for all payment methods */}
          {selectedMethod && (
            <div className="rounded-2xl p-4 space-y-2" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <p style={{ color: T.sub }} className="text-[10px] font-black uppercase tracking-widest">Phone Number</p>
              <Input placeholder="9876543210" value={paymentDetails.phone_number || ""}
                onChange={e => setPaymentDetails(d => ({ ...d, phone_number: e.target.value }))}
                className="rounded-xl border-0 font-medium" style={{ background: T.input, color: T.text }} />
              <p style={{ color: T.sub }} className="text-[10px]">Enter the 10-digit phone number linked to your {selectedMethod} account.</p>
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
              { label: "Amount", value: fmt(amtNum), className: "text-2xl font-black text-emerald-500" },
              {
                label: "Payment Method",
                value: (
                  <div className="flex items-center gap-2">
                    {selectedMethodData?.logo_path ? (
                      <img loading="lazy" decoding="async" src={getLogoUrl(selectedMethodData.logo_path)} alt={selectedMethod} className="h-5 w-5 rounded-sm object-contain" />
                    ) : (
                      <div className="h-5 w-5 rounded-sm bg-indigo-500/10" />
                    )}
                    <span>{selectedMethod}</span>
                  </div>
                ),
                className: "font-bold text-indigo-400"
              },
              ...(paymentDetails.phone_number ? [{ label: "Phone Number", value: paymentDetails.phone_number, className: "font-medium" }] : []),
              { label: "Full Name", value: Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name || "—", className: "font-medium" },
              { label: "Reference ID", value: referenceId || "—", className: "font-medium text-sm text-slate-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2"
                style={{ borderBottom: `1px solid ${T.border}` }}>
                <span style={{ color: T.sub }} className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                <div style={{ color: T.text }} className={item.className}>{item.value}</div>
              </div>
            ))}
            <div className="rounded-2xl p-3 text-xs leading-relaxed" style={{ background: T.muted, color: T.sub }}>
              After clicking Pay, send <strong className="text-indigo-400">{fmt(amtNum)}</strong> via <strong>{selectedMethod}</strong> to the admin's payment details. Admin will verify and credit your FlexPay wallet within 24 hours.
            </div>
            <div className="rounded-2xl p-3 border" style={{ background: "rgba(239,68,68,.08)", borderColor: "rgba(239,68,68,.3)", color: "#fecaca" }}>
              <p className="text-xs font-bold mb-1">⚠️ Important Warning:</p>
              <p className="text-xs leading-relaxed">Complete your payment within 8 minutes. After this time, the payment refund will be unavailable.</p>
            </div>
          </div>
          <Button className="w-full h-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-black uppercase tracking-widest text-lg shadow-2xl shadow-indigo-600/30 transition-all active:scale-[0.98]"
            onClick={() => setShowPayConfirm(true)} disabled={submitting}>
            {submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing…</> : <>Pay {fmt(amtNum)}</>}
          </Button>
        </div>
      )}

      {/* Pay Confirmation Modal */}
      {showPayConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{
            background: T.bg, border: `1px solid ${T.border}`, borderRadius: 18,
            padding: 24, maxWidth: 340, width: "100%", animation: "fadeUp .3s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(99,102,241,.12)", display: "flex",
                alignItems: "center", justifyContent: "center"
              }}>
                <AlertCircle size={22} color="#6366f1" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: T.text }}>Confirm Payment</h3>
            </div>
            <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.6, marginBottom: 6 }}>
              You are about to send:
            </p>
            <div style={{
              background: T.card, borderRadius: 12, padding: 16, marginBottom: 20,
              border: `1px solid ${T.border}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: ".05em" }}>Amount</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: "#10b981" }}>{fmt(amtNum)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: ".05em" }}>Method</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{selectedMethod}</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.5, marginBottom: 20 }}>
              ⏱️ <strong>Important:</strong> Complete your payment within 8 minutes. After this time, the payment refund will be unavailable.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Button
                className="flex-1 h-11 rounded-xl border font-bold"
                style={{
                  background: T.card, borderColor: T.border, color: T.text,
                  cursor: "pointer"
                }}
                onClick={() => setShowPayConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-black text-white"
                onClick={() => {
                  setShowPayConfirm(false);
                  handlePay();
                }}
              >
                Confirm & Pay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
