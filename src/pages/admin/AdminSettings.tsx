import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Clock, Landmark, Gift, CreditCard, Search, X, Coins, CheckCircle, Briefcase, Calendar, Star, Users, Receipt, Settings } from "lucide-react";
import TotpSetupCard from "@/components/admin/TotpSetupCard";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Badge } from "@/components/ui/badge";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

type ClientPaymentRow = {
  id: string;
  full_name: string[];
  user_code: string[];
  email: string;
  payment_sharing_enabled: boolean;
};

const AdminSettings = () => {
  const { toast } = useToast();
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const [countdownHours, setCountdownHours] = useState("");
  const [maxBankAttempts, setMaxBankAttempts] = useState("");
  const [signupBonus, setSignupBonus] = useState("");
  const [jobBonus, setJobBonus] = useState("");
  const [referralTerms, setReferralTerms] = useState("");
  const [coinRate, setCoinRate] = useState("");
  const [minCoinConversion, setMinCoinConversion] = useState("");
  const [rewardCompleteProfile, setRewardCompleteProfile] = useState("");
  const [rewardCompleteProject, setRewardCompleteProject] = useState("");
  const [rewardDailyAttendance, setRewardDailyAttendance] = useState("");
  const [reward5StarReview, setReward5StarReview] = useState("");
  const [rewardReferral10, setRewardReferral10] = useState("");
  const [empPrefix, setEmpPrefix] = useState("");
  const [cltPrefix, setCltPrefix] = useState("");
  const [empDigits, setEmpDigits] = useState("");
  const [cltDigits, setCltDigits] = useState("");
  const [empIncludeYear, setEmpIncludeYear] = useState(false);
  const [empIncludeMonth, setEmpIncludeMonth] = useState(false);
  const [cltIncludeYear, setCltIncludeYear] = useState(false);
  const [cltIncludeMonth, setCltIncludeMonth] = useState(false);
  const [empSeparator, setEmpSeparator] = useState("-");
  const [cltSeparator, setCltSeparator] = useState("-");
  const [clientPaymentSharing, setClientPaymentSharing] = useState(true);
  const [orderIdLength, setOrderIdLength] = useState("15");
  const [orderIdPrefix, setOrderIdPrefix] = useState("");
  const [orderIdIncludeYear, setOrderIdIncludeYear] = useState(false);
  const [orderIdIncludeMonth, setOrderIdIncludeMonth] = useState(false);
  const [orderIdIncludeDate, setOrderIdIncludeDate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Client payment sharing per-client state
  const [clients, setClients] = useState<ClientPaymentRow[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [clientsLoading, setClientsLoading] = useState(false);
  const [updatingClients, setUpdatingClients] = useState(false);

  const fetchClients = useCallback(async () => {
    setClientsLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, user_code, email, payment_sharing_enabled")
      .eq("user_type", "client")
      .eq("approval_status", "approved")
      .order("full_name", { ascending: true });
    setClients((data as ClientPaymentRow[]) || []);
    setClientsLoading(false);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [
          "approval_countdown_hours",
          "max_bank_verification_attempts",
          "referral_signup_bonus",
          "referral_job_bonus",
          "referral_terms_conditions",
          "employee_code_prefix",
          "client_code_prefix",
          "employee_code_digits",
          "client_code_digits",
          "client_payment_sharing_enabled",
          "employee_code_include_year",
          "employee_code_include_month",
          "client_code_include_year",
          "client_code_include_month",
          "employee_code_separator",
          "coin_conversion_rate",
          "min_coin_conversion",
          "client_code_separator",
          "coin_reward_complete_profile",
          "coin_reward_complete_project",
          "coin_reward_daily_attendance",
          "coin_reward_5star_review",
          "coin_reward_referral_10",
          "withdrawal_order_id_length",
          "withdrawal_order_id_prefix",
          "withdrawal_order_id_include_year",
          "withdrawal_order_id_include_month",
          "withdrawal_order_id_include_date",
        ]);
      if (data) {
        for (const row of data) {
          if (row.key === "approval_countdown_hours") setCountdownHours(row.value);
          if (row.key === "max_bank_verification_attempts") setMaxBankAttempts(row.value);
          if (row.key === "referral_signup_bonus") setSignupBonus(row.value);
          if (row.key === "referral_job_bonus") setJobBonus(row.value);
          if (row.key === "referral_terms_conditions") setReferralTerms(row.value.replace(/\\n/g, "\n"));
          if (row.key === "employee_code_prefix") setEmpPrefix(row.value);
          if (row.key === "client_code_prefix") setCltPrefix(row.value);
          if (row.key === "employee_code_digits") setEmpDigits(row.value);
          if (row.key === "client_code_digits") setCltDigits(row.value);
          if (row.key === "client_payment_sharing_enabled") setClientPaymentSharing(row.value !== "false");
          if (row.key === "employee_code_include_year") setEmpIncludeYear(row.value === "true");
          if (row.key === "employee_code_include_month") setEmpIncludeMonth(row.value === "true");
          if (row.key === "client_code_include_year") setCltIncludeYear(row.value === "true");
          if (row.key === "client_code_include_month") setCltIncludeMonth(row.value === "true");
          if (row.key === "employee_code_separator") setEmpSeparator(row.value || "none");
          if (row.key === "client_code_separator") setCltSeparator(row.value || "none");
          if (row.key === "coin_conversion_rate") setCoinRate(row.value);
          if (row.key === "min_coin_conversion") setMinCoinConversion(row.value);
          if (row.key === "coin_reward_complete_profile") setRewardCompleteProfile(row.value);
          if (row.key === "coin_reward_complete_project") setRewardCompleteProject(row.value);
          if (row.key === "coin_reward_daily_attendance") setRewardDailyAttendance(row.value);
          if (row.key === "coin_reward_5star_review") setReward5StarReview(row.value);
          if (row.key === "coin_reward_referral_10") setRewardReferral10(row.value);
          if (row.key === "withdrawal_order_id_length") setOrderIdLength(row.value || "15");
          if (row.key === "withdrawal_order_id_prefix") setOrderIdPrefix(row.value || "");
          if (row.key === "withdrawal_order_id_include_year") setOrderIdIncludeYear(row.value === "true");
          if (row.key === "withdrawal_order_id_include_month") setOrderIdIncludeMonth(row.value === "true");
          if (row.key === "withdrawal_order_id_include_date") setOrderIdIncludeDate(row.value !== "false");
        }
      }
      setLoading(false);
    };
    fetch();
    fetchClients();
  }, [fetchClients]);

  const handleSaveSetting = async (key: string, value: string, label: string, min = 1, max = 999) => {
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      toast({ title: "Invalid value", description: `Enter a number between ${min} and ${max}`, variant: "destructive" });
      return;
    }
    setSaving(key);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key, value: String(num) }, { onConflict: "key" });
      if (error) throw error;
      toast({ title: "Settings saved", description: `${label} set to ${num}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveText = async (key: string, value: string, label: string) => {
    if (!value.trim()) {
      toast({ title: "Invalid value", description: "Content cannot be empty", variant: "destructive" });
      return;
    }
    setSaving(key);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key, value: value.replace(/\n/g, "\\n") }, { onConflict: "key" });
      if (error) throw error;
      toast({ title: "Settings saved", description: `${label} updated` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const toggleClientSelection = (id: string) => {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visible = filteredClients.map((c) => c.id);
    const allSelected = visible.every((id) => selectedClientIds.has(id));
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visible.forEach((id) => next.delete(id));
      } else {
        visible.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleBulkToggle = async (enable: boolean) => {
    if (selectedClientIds.size === 0) {
      toast({ title: "No clients selected", variant: "destructive" });
      return;
    }
    setUpdatingClients(true);
    const ids = Array.from(selectedClientIds);
    const { error } = await supabase
      .from("profiles")
      .update({ payment_sharing_enabled: enable })
      .in("id", ids);
    setUpdatingClients(false);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `${ids.length} client(s) payment sharing ${enable ? "enabled" : "disabled"}` });
      setSelectedClientIds(new Set());
      fetchClients();
    }
  };

  const handleSingleToggle = async (client: ClientPaymentRow) => {
    const newVal = !client.payment_sharing_enabled;
    // Optimistic update
    setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, payment_sharing_enabled: newVal } : c));
    const { error } = await supabase
      .from("profiles")
      .update({ payment_sharing_enabled: newVal })
      .eq("id", client.id);
    if (error) {
      setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, payment_sharing_enabled: !newVal } : c));
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
  };

  const filteredClients = clients.filter((c) => {
    if (!clientSearch.trim()) return true;
    const q = clientSearch.toLowerCase();
    return (
      (c.full_name?.[0] || "").toLowerCase().includes(q) ||
      (c.user_code?.[0] || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "#6366f1" }} /></div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Premium Hero Section */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 mb-8"
        style={{ 
          background: theme === "black" 
            ? "linear-gradient(135deg, #1a1a2e 0%, #070714 100%)" 
            : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          border: `1px solid ${T.border}`
        }}
      >
        <div className="relative z-10 flex items-center gap-4">
          <div className="rounded-full bg-white/10 p-3 backdrop-blur-md">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">App Settings</h1>
            <p className="text-white/70">Configure global application behavior and business rules</p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="grid gap-6">
        <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: T.text }}>
              <Clock className="h-5 w-5 text-[#6366f1]" />
              Approval Countdown Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <p className="text-sm" style={{ color: T.sub }}>
              Set the countdown time (in hours) shown on the verification pending page.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label style={{ color: T.text }}>Countdown Hours</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="72" 
                  value={countdownHours} 
                  onChange={(e) => setCountdownHours(e.target.value)}
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <Button 
                onClick={() => handleSaveSetting("approval_countdown_hours", countdownHours, "Countdown", 1, 72)} 
                disabled={saving === "approval_countdown_hours"} 
                className="gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white"
              >
                {saving === "approval_countdown_hours" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: T.text }}>
              <Landmark className="h-5 w-5 text-[#6366f1]" />
              Bank Verification Attempts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <p className="text-sm" style={{ color: T.sub }}>
              Maximum number of times a user can resubmit bank verification after rejection.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label style={{ color: T.text }}>Max Attempts</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="99" 
                  value={maxBankAttempts} 
                  onChange={(e) => setMaxBankAttempts(e.target.value)}
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <Button 
                onClick={() => handleSaveSetting("max_bank_verification_attempts", maxBankAttempts, "Max attempts", 1, 99)} 
                disabled={saving === "max_bank_verification_attempts"} 
                className="gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white"
              >
                {saving === "max_bank_verification_attempts" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: T.text }}>
              <Receipt className="h-5 w-5 text-[#6366f1]" />
              Withdrawal Order ID Format
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <p className="text-sm" style={{ color: T.sub }}>
              Configure the format of the auto-generated Order ID for withdrawal requests.
            </p>

            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label style={{ color: T.text }}>Prefix (optional)</Label>
                <Input 
                  placeholder="e.g. WD, ORD" 
                  value={orderIdPrefix} 
                  onChange={(e) => setOrderIdPrefix(e.target.value.toUpperCase())} 
                  maxLength={10} 
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <Button onClick={async () => {
                setSaving("withdrawal_order_id_prefix");
                try {
                  await supabase.from("app_settings").upsert({ key: "withdrawal_order_id_prefix", value: orderIdPrefix }, { onConflict: "key" });
                  toast({ title: "Saved", description: `Prefix set to "${orderIdPrefix || "(none)"}"` });
                } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
                finally { setSaving(null); }
              }} disabled={saving === "withdrawal_order_id_prefix"} className="gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white">
                {saving === "withdrawal_order_id_prefix" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.sub }}>Include in Order ID</Label>
              {[
                { label: "Include Year (YY)", key: "withdrawal_order_id_include_year", checked: orderIdIncludeYear, set: setOrderIdIncludeYear },
                { label: "Include Month (MM)", key: "withdrawal_order_id_include_month", checked: orderIdIncludeMonth, set: setOrderIdIncludeMonth },
                { label: "Include Date (DD)", key: "withdrawal_order_id_include_date", checked: orderIdIncludeDate, set: setOrderIdIncludeDate },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-xl p-4 transition-all" style={{ background: T.input, border: `1px solid ${T.border}` }}>
                  <Label htmlFor={item.key} className="text-sm font-medium" style={{ color: T.text }}>{item.label}</Label>
                  <Switch id={item.key} checked={item.checked} onCheckedChange={async (checked) => {
                    item.set(checked);
                    setSaving(item.key);
                    try {
                      await supabase.from("app_settings").upsert({ key: item.key, value: String(checked) }, { onConflict: "key" });
                      toast({ title: "Saved", description: `${item.label} ${checked ? "enabled" : "disabled"}` });
                    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
                    finally { setSaving(null); }
                  }} />
                </div>
              ))}
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label style={{ color: T.text }}>Random Digits Length</Label>
                <Input 
                  type="number" 
                  min="5" 
                  max="30" 
                  value={orderIdLength} 
                  onChange={(e) => setOrderIdLength(e.target.value)} 
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <Button 
                onClick={() => handleSaveSetting("withdrawal_order_id_length", orderIdLength, "Order ID length", 5, 30)} 
                disabled={saving === "withdrawal_order_id_length"} 
                className="gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white"
              >
                {saving === "withdrawal_order_id_length" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>

            <div className="rounded-xl p-4" style={{ background: theme === "black" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", border: `1px dashed ${T.border}` }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.sub }}>Preview format</p>
              <p className="text-xl font-mono font-bold tracking-tight" style={{ color: "#6366f1" }}>
                {orderIdPrefix ? `${orderIdPrefix}` : ""}
                {orderIdIncludeDate ? "DD" : ""}
                {orderIdIncludeMonth ? "MM" : ""}
                {orderIdIncludeYear ? "YY" : ""}
                {`${"X".repeat(Math.min(Number(orderIdLength) || 5, 8))}...`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: T.text }}>
              <Gift className="h-5 w-5 text-[#6366f1]" />
              Referral Bonus Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <p className="text-sm" style={{ color: T.sub }}>
              Configure the bonus amounts awarded when a referred user signs up or completes a job.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label style={{ color: T.text }}>Signup Bonus (₹)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="99999" 
                  value={signupBonus} 
                  onChange={(e) => setSignupBonus(e.target.value)} 
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <Button 
                onClick={() => handleSaveSetting("referral_signup_bonus", signupBonus, "Signup bonus", 0, 99999)} 
                disabled={saving === "referral_signup_bonus"} 
                className="gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white"
              >
                {saving === "referral_signup_bonus" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label style={{ color: T.text }}>Job Completion Bonus (₹)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="99999" 
                  value={jobBonus} 
                  onChange={(e) => setJobBonus(e.target.value)} 
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <Button 
                onClick={() => handleSaveSetting("referral_job_bonus", jobBonus, "Job bonus", 0, 99999)} 
                disabled={saving === "referral_job_bonus"} 
                className="gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white"
              >
                {saving === "referral_job_bonus" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: T.text }}>
              <Receipt className="h-5 w-5 text-[#6366f1]" />
              Referral Terms & Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <p className="text-sm" style={{ color: T.sub }}>
              Edit the referral program terms shown to users on their account settings page.
            </p>
            <Textarea
              rows={8}
              value={referralTerms}
              onChange={(e) => setReferralTerms(e.target.value)}
              placeholder="Enter referral terms and conditions..."
              style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
              className="resize-none"
            />
            <Button 
              onClick={() => handleSaveText("referral_terms_conditions", referralTerms, "Referral T&C")} 
              disabled={saving === "referral_terms_conditions"} 
              className="gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white w-full sm:w-auto"
            >
              {saving === "referral_terms_conditions" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Terms
            </Button>
          </CardContent>
        </Card>

        {/* Client Payment Details Sharing */}
        <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: T.text }}>
              <CreditCard className="h-5 w-5 text-[#6366f1]" />
              Client Payment Details Sharing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {/* Global toggle */}
            <div className="space-y-4">
              <p className="text-sm" style={{ color: T.sub }}>
                Global toggle: When disabled, no client can share payment details regardless of individual settings.
              </p>
              <div className="flex items-center justify-between rounded-xl p-4 transition-all" style={{ background: T.input, border: `1px solid ${T.border}` }}>
                <Label htmlFor="client-sharing-toggle" className="text-sm font-semibold" style={{ color: T.text }}>
                  Allow clients to share payment details (Global)
                </Label>
                <Switch
                  id="client-sharing-toggle"
                  checked={clientPaymentSharing}
                  disabled={saving === "client_payment_sharing"}
                  onCheckedChange={async (checked) => {
                    setClientPaymentSharing(checked);
                    setSaving("client_payment_sharing");
                    try {
                      const { error } = await supabase
                        .from("app_settings")
                        .upsert({ key: "client_payment_sharing_enabled", value: String(checked) }, { onConflict: "key" });
                      if (error) throw error;
                      toast({ title: "Settings saved", description: `Global payment sharing ${checked ? "enabled" : "disabled"}` });
                    } catch (e: any) {
                      setClientPaymentSharing(!checked);
                      toast({ title: "Error", description: e.message, variant: "destructive" });
                    } finally {
                      setSaving(null);
                    }
                  }}
                />
              </div>
            </div>

            {/* Per-client controls */}
            <div className="space-y-4 rounded-xl p-4" style={{ background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${T.border}` }}>
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: T.text }}>Per-Client Payment Sharing</h4>
              <p className="text-xs" style={{ color: T.sub }}>
                Enable or disable sharing for specific clients. Global setting must be ON for these to take effect.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.sub }} />
                  <Input
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-9 h-10 rounded-lg"
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkToggle(true)}
                    disabled={selectedClientIds.size === 0 || updatingClients}
                    className="flex-1 h-10 border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80]/10"
                  >
                    Enable Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkToggle(false)}
                    disabled={selectedClientIds.size === 0 || updatingClients}
                    className="flex-1 h-10 border-[#f87171] text-[#f87171] hover:bg-[#f87171]/10"
                  >
                    Disable Selected
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden" style={{ borderColor: T.border }}>
                <div className="max-h-[400px] overflow-y-auto">
                  {clientsLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#6366f1]" /></div>
                  ) : filteredClients.length === 0 ? (
                    <div className="py-8 text-center text-sm" style={{ color: T.sub }}>No clients found</div>
                  ) : (
                    <table className="w-full text-left text-sm border-collapse">
                      <thead style={{ background: T.nav, color: T.sub }}>
                        <tr>
                          <th className="p-3 w-10">
                            <Checkbox
                              checked={filteredClients.length > 0 && filteredClients.every(c => selectedClientIds.has(c.id))}
                              onCheckedChange={toggleSelectAll}
                            />
                          </th>
                          <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Client</th>
                          <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                          <th className="p-3 font-semibold uppercase tracking-wider text-[10px] text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody style={{ color: T.text }}>
                        {filteredClients.map((c) => (
                          <tr key={c.id} className="border-t transition-colors hover:bg-white/5" style={{ borderColor: T.border }}>
                            <td className="p-3">
                              <Checkbox
                                checked={selectedClientIds.has(c.id)}
                                onCheckedChange={() => toggleClientSelection(c.id)}
                              />
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{c.full_name?.[0] || "No Name"}</div>
                              <div className="text-[10px]" style={{ color: T.sub }}>{c.user_code?.[0]}</div>
                            </td>
                            <td className="p-3">
                              <Badge 
                                variant={c.payment_sharing_enabled ? "default" : "secondary"}
                                style={{ 
                                  background: c.payment_sharing_enabled ? "rgba(74, 222, 128, 0.15)" : "rgba(148, 163, 184, 0.15)",
                                  color: c.payment_sharing_enabled ? "#4ade80" : T.sub,
                                  border: `1px solid ${c.payment_sharing_enabled ? "rgba(74, 222, 128, 0.3)" : "rgba(148, 163, 184, 0.3)"}`
                                }}
                              >
                                {c.payment_sharing_enabled ? "Sharing ON" : "Sharing OFF"}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <Switch
                                checked={c.payment_sharing_enabled}
                                onCheckedChange={() => handleSingleToggle(c)}
                                className="scale-75"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TOTP Management */}
        <div className="grid gap-6 sm:grid-cols-2">
          <TotpSetupCard />
          <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
            <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
              <CardTitle className="flex items-center gap-2 text-lg" style={{ color: T.text }}>
                <Coins className="h-5 w-5 text-[#6366f1]" />
                Coin Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <p className="text-sm" style={{ color: T.sub }}>
                Define how much 1 coin is worth in ₹ and minimum conversion amount.
              </p>
              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Label style={{ color: T.text }}>1 Coin = (₹)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={coinRate} 
                      onChange={(e) => setCoinRate(e.target.value)} 
                      style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    />
                  </div>
                  <Button onClick={() => handleSaveSetting("coin_conversion_rate", coinRate, "Coin rate", 0.01, 100)} disabled={saving === "coin_conversion_rate"} className="gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white">
                    <Save className="h-4 w-4" /> Save
                  </Button>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Label style={{ color: T.text }}>Min Conversion Amount (Coins)</Label>
                    <Input 
                      type="number" 
                      value={minCoinConversion} 
                      onChange={(e) => setMinCoinConversion(e.target.value)} 
                      style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    />
                  </div>
                  <Button onClick={() => handleSaveSetting("min_coin_conversion", minCoinConversion, "Min conversion", 1, 10000)} disabled={saving === "min_coin_conversion"} className="gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white">
                    <Save className="h-4 w-4" /> Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coin Rewards */}
        <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: T.text }}>
              <Star className="h-5 w-5 text-[#fbbf24]" />
              Coin Rewards Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <p className="text-sm" style={{ color: T.sub }}>
              Set coin rewards for various user activities across the platform.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Profile Completion", key: "coin_reward_complete_profile", val: rewardCompleteProfile, set: setRewardCompleteProfile, icon: Users },
                { label: "Project Completion", key: "coin_reward_complete_project", val: rewardCompleteProject, set: setRewardCompleteProject, icon: Briefcase },
                { label: "Daily Attendance", key: "coin_reward_daily_attendance", val: rewardDailyAttendance, set: setRewardDailyAttendance, icon: Calendar },
                { label: "5-Star Review", key: "coin_reward_5star_review", val: reward5StarReview, set: setReward5StarReview, icon: Star },
                { label: "Referral (10 users)", key: "coin_reward_referral_10", val: rewardReferral10, set: setRewardReferral10, icon: Gift },
              ].map((reward) => (
                <div key={reward.key} className="space-y-3 rounded-xl p-4 transition-all" style={{ background: T.input, border: `1px solid ${T.border}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <reward.icon className="h-4 w-4 text-[#6366f1]" />
                    <Label className="text-sm font-semibold" style={{ color: T.text }}>{reward.label}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={reward.val} 
                      onChange={(e) => reward.set(e.target.value)} 
                      style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
                      className="h-9"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleSaveSetting(reward.key, reward.val, reward.label, 0, 1000)} 
                      disabled={saving === reward.key}
                      className="h-9 bg-[#6366f1] hover:bg-[#6366f1]/90"
                    >
                      {saving === reward.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Code Settings */}
        <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: T.text }}>
              <Users className="h-5 w-5 text-[#6366f1]" />
              User Code Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Employee Code */}
              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2" style={{ color: T.text }}>
                  <div className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
                  Employee Code Settings
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label style={{ color: T.text }}>Prefix</Label>
                    <Input value={empPrefix} onChange={(e) => setEmpPrefix(e.target.value.toUpperCase())} style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ color: T.text }}>Digits</Label>
                    <Input type="number" value={empDigits} onChange={(e) => setEmpDigits(e.target.value)} style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
                  </div>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "Include Year", checked: empIncludeYear, set: setEmpIncludeYear },
                    { label: "Include Month", checked: empIncludeMonth, set: setEmpIncludeMonth },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg p-3" style={{ background: T.input, border: `1px solid ${T.border}` }}>
                      <Label className="text-xs" style={{ color: T.text }}>{item.label}</Label>
                      <Switch checked={item.checked} onCheckedChange={item.set} />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Separator</Label>
                  <Select value={empSeparator} onValueChange={setEmpSeparator}>
                    <SelectTrigger style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="-">Hyphen (-)</SelectItem>
                      <SelectItem value="_">Underscore (_)</SelectItem>
                      <SelectItem value="/">Slash (/)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full bg-[#6366f1] hover:bg-[#6366f1]/90"
                  onClick={async () => {
                    setSaving("emp_code");
                    try {
                      await Promise.all([
                        supabase.from("app_settings").upsert({ key: "employee_code_prefix", value: empPrefix }, { onConflict: "key" }),
                        supabase.from("app_settings").upsert({ key: "employee_code_digits", value: empDigits }, { onConflict: "key" }),
                        supabase.from("app_settings").upsert({ key: "employee_code_include_year", value: String(empIncludeYear) }, { onConflict: "key" }),
                        supabase.from("app_settings").upsert({ key: "employee_code_include_month", value: String(empIncludeMonth) }, { onConflict: "key" }),
                        supabase.from("app_settings").upsert({ key: "employee_code_separator", value: empSeparator }, { onConflict: "key" }),
                      ]);
                      toast({ title: "Employee settings saved" });
                    } finally { setSaving(null); }
                  }}
                  disabled={saving === "emp_code"}
                >
                  Save Employee Config
                </Button>
              </div>

              {/* Client Code */}
              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2" style={{ color: T.text }}>
                  <div className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
                  Client Code Settings
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label style={{ color: T.text }}>Prefix</Label>
                    <Input value={cltPrefix} onChange={(e) => setCltPrefix(e.target.value.toUpperCase())} style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ color: T.text }}>Digits</Label>
                    <Input type="number" value={cltDigits} onChange={(e) => setCltDigits(e.target.value)} style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
                  </div>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "Include Year", checked: cltIncludeYear, set: setCltIncludeYear },
                    { label: "Include Month", checked: cltIncludeMonth, set: setCltIncludeMonth },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg p-3" style={{ background: T.input, border: `1px solid ${T.border}` }}>
                      <Label className="text-xs" style={{ color: T.text }}>{item.label}</Label>
                      <Switch checked={item.checked} onCheckedChange={item.set} />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Separator</Label>
                  <Select value={cltSeparator} onValueChange={setCltSeparator}>
                    <SelectTrigger style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="-">Hyphen (-)</SelectItem>
                      <SelectItem value="_">Underscore (_)</SelectItem>
                      <SelectItem value="/">Slash (/)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full bg-[#a78bfa] hover:bg-[#a78bfa]/90"
                  onClick={async () => {
                    setSaving("clt_code");
                    try {
                      await Promise.all([
                        supabase.from("app_settings").upsert({ key: "client_code_prefix", value: cltPrefix }, { onConflict: "key" }),
                        supabase.from("app_settings").upsert({ key: "client_code_digits", value: cltDigits }, { onConflict: "key" }),
                        supabase.from("app_settings").upsert({ key: "client_code_include_year", value: String(cltIncludeYear) }, { onConflict: "key" }),
                        supabase.from("app_settings").upsert({ key: "client_code_include_month", value: String(cltIncludeMonth) }, { onConflict: "key" }),
                        supabase.from("app_settings").upsert({ key: "client_code_separator", value: cltSeparator }, { onConflict: "key" }),
                      ]);
                      toast({ title: "Client settings saved" });
                    } finally { setSaving(null); }
                  }}
                  disabled={saving === "clt_code"}
                >
                  Save Client Config
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
