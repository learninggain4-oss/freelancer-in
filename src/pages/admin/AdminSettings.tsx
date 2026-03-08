import { useState, useEffect, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
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
import { Loader2, Save, Clock, Landmark, Gift, CreditCard, RefreshCw, Download, Search, X } from "lucide-react";
import TotpSetupCard from "@/components/admin/TotpSetupCard";

type ClientPaymentRow = {
  id: string;
  full_name: string[];
  user_code: string[];
  email: string;
  payment_sharing_enabled: boolean;
};

const AdminSettings = () => {
  const { toast } = useToast();
  const [countdownHours, setCountdownHours] = useState("");
  const [maxBankAttempts, setMaxBankAttempts] = useState("");
  const [signupBonus, setSignupBonus] = useState("");
  const [jobBonus, setJobBonus] = useState("");
  const [referralTerms, setReferralTerms] = useState("");
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  // Client payment sharing per-client state
  const [clients, setClients] = useState<ClientPaymentRow[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [clientsLoading, setClientsLoading] = useState(false);
  const [updatingClients, setUpdatingClients] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const handleCheckUpdate = useCallback(async () => {
    setChecking(true);
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations();
      if (registrations?.length) {
        await Promise.all(registrations.map((r) => r.update()));
      }
      // Wait briefly for needRefresh to potentially change
      await new Promise((r) => setTimeout(r, 1500));
      if (!needRefresh) {
        toast({ title: "You're up to date!", description: "No new updates available." });
      }
    } catch {
      toast({ title: "Could not check for updates", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  }, [needRefresh, toast]);

  const handleUpdate = useCallback(() => {
    setUpdating(true);
    setUpdateProgress(0);
    const interval = setInterval(() => {
      setUpdateProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
    updateServiceWorker(true).finally(() => {
      clearInterval(interval);
      setUpdateProgress(100);
      setTimeout(() => window.location.reload(), 300);
    });
  }, [updateServiceWorker]);

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
          "client_code_separator",
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

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">App Settings</h2>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Approval Countdown Timer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Set the countdown time (in hours) shown on the verification pending page.
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>Countdown Hours</Label>
              <Input type="number" min="1" max="72" value={countdownHours} onChange={(e) => setCountdownHours(e.target.value)} />
            </div>
            <Button onClick={() => handleSaveSetting("approval_countdown_hours", countdownHours, "Countdown", 1, 72)} disabled={saving === "approval_countdown_hours"} className="gap-1">
              {saving === "approval_countdown_hours" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="h-4 w-4 text-primary" />
            Bank Verification Attempts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Maximum number of times a user can resubmit bank verification after rejection.
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>Max Attempts</Label>
              <Input type="number" min="1" max="99" value={maxBankAttempts} onChange={(e) => setMaxBankAttempts(e.target.value)} />
            </div>
            <Button onClick={() => handleSaveSetting("max_bank_verification_attempts", maxBankAttempts, "Max attempts", 1, 99)} disabled={saving === "max_bank_verification_attempts"} className="gap-1">
              {saving === "max_bank_verification_attempts" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral Bonus Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4 text-primary" />
            Referral Bonus Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure the bonus amounts awarded when a referred user signs up or completes a job.
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>Signup Bonus (₹)</Label>
              <Input type="number" min="0" max="99999" value={signupBonus} onChange={(e) => setSignupBonus(e.target.value)} />
            </div>
            <Button onClick={() => handleSaveSetting("referral_signup_bonus", signupBonus, "Signup bonus", 0, 99999)} disabled={saving === "referral_signup_bonus"} className="gap-1">
              {saving === "referral_signup_bonus" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>Job Completion Bonus (₹)</Label>
              <Input type="number" min="0" max="99999" value={jobBonus} onChange={(e) => setJobBonus(e.target.value)} />
            </div>
            <Button onClick={() => handleSaveSetting("referral_job_bonus", jobBonus, "Job bonus", 0, 99999)} disabled={saving === "referral_job_bonus"} className="gap-1">
              {saving === "referral_job_bonus" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral Terms & Conditions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4 text-primary" />
            Referral Terms & Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Edit the referral program terms shown to users on their account settings page.
          </p>
          <Textarea
            rows={8}
            value={referralTerms}
            onChange={(e) => setReferralTerms(e.target.value)}
            placeholder="Enter referral terms and conditions..."
          />
          <Button onClick={() => handleSaveText("referral_terms_conditions", referralTerms, "Referral T&C")} disabled={saving === "referral_terms_conditions"} className="gap-1">
            {saving === "referral_terms_conditions" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Terms
          </Button>
        </CardContent>
      </Card>

      {/* Client Payment Details Sharing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Client Payment Details Sharing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Global toggle */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Global toggle: When disabled, no client can share payment details regardless of individual settings.
            </p>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="client-sharing-toggle" className="text-sm font-medium">
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
          <div className="space-y-3 rounded-lg border p-3">
            <h4 className="text-sm font-semibold">Per-Client Payment Sharing</h4>
            <p className="text-xs text-muted-foreground">
              Select clients and enable/disable payment sharing individually. Both the global toggle and the individual setting must be enabled for a client to share.
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or email…"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {clientSearch && (
                <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2" onClick={() => setClientSearch("")}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Bulk actions */}
            {selectedClientIds.size > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                <span className="font-medium">{selectedClientIds.size} selected</span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" disabled={updatingClients} onClick={() => handleBulkToggle(true)} className="h-7 text-xs">
                    {updatingClients ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                    Enable Selected
                  </Button>
                  <Button size="sm" variant="outline" disabled={updatingClients} onClick={() => handleBulkToggle(false)} className="h-7 text-xs">
                    Disable Selected
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedClientIds(new Set())} className="h-7 text-xs">
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Client list */}
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {clientsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : filteredClients.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No clients found</p>
              ) : (
                <>
                  {/* Select all header */}
                  <div className="flex items-center gap-3 border-b pb-2">
                    <Checkbox
                      checked={filteredClients.length > 0 && filteredClients.every((c) => selectedClientIds.has(c.id))}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-xs font-medium text-muted-foreground">Select All ({filteredClients.length})</span>
                  </div>
                  {filteredClients.map((client) => (
                    <div key={client.id} className="flex items-center gap-3 rounded-md px-1 py-1.5 hover:bg-muted/40">
                      <Checkbox
                        checked={selectedClientIds.has(client.id)}
                        onCheckedChange={() => toggleClientSelection(client.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{client.full_name?.[0] || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {client.user_code?.[0] || "—"} · {client.email}
                        </p>
                      </div>
                      <Switch
                        checked={client.payment_sharing_enabled}
                        onCheckedChange={() => handleSingleToggle(client)}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Code Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            User Code Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure the prefix, digits, separator, and date components for auto-generated user codes. Changes apply to new registrations only.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Employee Code */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Employee Code</h4>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Prefix</Label>
                  <Input value={empPrefix} onChange={(e) => setEmpPrefix(e.target.value.toUpperCase())} placeholder="EMP" maxLength={10} />
                </div>
                <div className="w-24">
                  <Label>Digits</Label>
                  <Input type="number" min="3" max="10" value={empDigits} onChange={(e) => setEmpDigits(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Separator</Label>
                <Select value={empSeparator} onValueChange={setEmpSeparator}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Hyphen (-)</SelectItem>
                    <SelectItem value="/">Slash (/)</SelectItem>
                    <SelectItem value=".">Dot (.)</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <Label htmlFor="emp-year" className="text-sm">Include Year</Label>
                <Switch id="emp-year" checked={empIncludeYear} onCheckedChange={(checked) => { setEmpIncludeYear(checked); if (!checked) setEmpIncludeMonth(false); }} />
              </div>
              {empIncludeYear && (
                <div className="flex items-center justify-between rounded-lg border p-2.5">
                  <Label htmlFor="emp-month" className="text-sm">Include Month</Label>
                  <Switch id="emp-month" checked={empIncludeMonth} onCheckedChange={setEmpIncludeMonth} />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Preview: <span className="font-mono font-bold">{(() => {
                  const p = empPrefix || "EMP";
                  const s = empSeparator === "none" ? "" : empSeparator;
                  const d = Number(empDigits) || 5;
                  const num = "0".repeat(d - 1) + "1";
                  const year = new Date().getFullYear().toString();
                  const month = String(new Date().getMonth() + 1).padStart(2, "0");
                  let code = p;
                  if (empIncludeYear) {
                    code += s + year;
                    if (empIncludeMonth) code += s + month;
                  }
                  code += (empIncludeYear ? s : "") + num;
                  return code;
                })()}</span>
              </p>
              <Button
                size="sm"
                onClick={async () => {
                  if (!empPrefix.trim()) { toast({ title: "Invalid", description: "Prefix cannot be empty", variant: "destructive" }); return; }
                  const d = Number(empDigits);
                  if (isNaN(d) || d < 3 || d > 10) { toast({ title: "Invalid", description: "Digits must be 3-10", variant: "destructive" }); return; }
                  setSaving("emp_code");
                  try {
                    await Promise.all([
                      supabase.from("app_settings").upsert({ key: "employee_code_prefix", value: empPrefix.trim() }, { onConflict: "key" }),
                      supabase.from("app_settings").upsert({ key: "employee_code_digits", value: String(d) }, { onConflict: "key" }),
                      supabase.from("app_settings").upsert({ key: "employee_code_separator", value: empSeparator === "none" ? "" : empSeparator }, { onConflict: "key" }),
                      supabase.from("app_settings").upsert({ key: "employee_code_include_year", value: String(empIncludeYear) }, { onConflict: "key" }),
                      supabase.from("app_settings").upsert({ key: "employee_code_include_month", value: String(empIncludeMonth) }, { onConflict: "key" }),
                    ]);
                    toast({ title: "Saved", description: "Employee code settings updated" });
                  } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
                  finally { setSaving(null); }
                }}
                disabled={saving === "emp_code"}
                className="gap-1"
              >
                {saving === "emp_code" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Employee Code
              </Button>
            </div>

            {/* Client Code */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Client Code</h4>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Prefix</Label>
                  <Input value={cltPrefix} onChange={(e) => setCltPrefix(e.target.value.toUpperCase())} placeholder="CLT" maxLength={10} />
                </div>
                <div className="w-24">
                  <Label>Digits</Label>
                  <Input type="number" min="3" max="10" value={cltDigits} onChange={(e) => setCltDigits(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Separator</Label>
                <Select value={cltSeparator} onValueChange={setCltSeparator}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Hyphen (-)</SelectItem>
                    <SelectItem value="/">Slash (/)</SelectItem>
                    <SelectItem value=".">Dot (.)</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <Label htmlFor="clt-year" className="text-sm">Include Year</Label>
                <Switch id="clt-year" checked={cltIncludeYear} onCheckedChange={(checked) => { setCltIncludeYear(checked); if (!checked) setCltIncludeMonth(false); }} />
              </div>
              {cltIncludeYear && (
                <div className="flex items-center justify-between rounded-lg border p-2.5">
                  <Label htmlFor="clt-month" className="text-sm">Include Month</Label>
                  <Switch id="clt-month" checked={cltIncludeMonth} onCheckedChange={setCltIncludeMonth} />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Preview: <span className="font-mono font-bold">{(() => {
                  const p = cltPrefix || "CLT";
                  const s = cltSeparator === "none" ? "" : cltSeparator;
                  const d = Number(cltDigits) || 5;
                  const num = "0".repeat(d - 1) + "1";
                  const year = new Date().getFullYear().toString();
                  const month = String(new Date().getMonth() + 1).padStart(2, "0");
                  let code = p;
                  if (cltIncludeYear) {
                    code += s + year;
                    if (cltIncludeMonth) code += s + month;
                  }
                  code += (cltIncludeYear ? s : "") + num;
                  return code;
                })()}</span>
              </p>
              <Button
                size="sm"
                onClick={async () => {
                  if (!cltPrefix.trim()) { toast({ title: "Invalid", description: "Prefix cannot be empty", variant: "destructive" }); return; }
                  const d = Number(cltDigits);
                  if (isNaN(d) || d < 3 || d > 10) { toast({ title: "Invalid", description: "Digits must be 3-10", variant: "destructive" }); return; }
                  setSaving("clt_code");
                  try {
                    await Promise.all([
                      supabase.from("app_settings").upsert({ key: "client_code_prefix", value: cltPrefix.trim() }, { onConflict: "key" }),
                      supabase.from("app_settings").upsert({ key: "client_code_digits", value: String(d) }, { onConflict: "key" }),
                      supabase.from("app_settings").upsert({ key: "client_code_separator", value: cltSeparator === "none" ? "" : cltSeparator }, { onConflict: "key" }),
                      supabase.from("app_settings").upsert({ key: "client_code_include_year", value: String(cltIncludeYear) }, { onConflict: "key" }),
                      supabase.from("app_settings").upsert({ key: "client_code_include_month", value: String(cltIncludeMonth) }, { onConflict: "key" }),
                    ]);
                    toast({ title: "Saved", description: "Client code settings updated" });
                  } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
                  finally { setSaving(null); }
                }}
                disabled={saving === "clt_code"}
                className="gap-1"
              >
                {saving === "clt_code" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Client Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Updates */}
      <Card className={needRefresh ? "border-primary/30 bg-primary/5" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" />
            App Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {updating ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Updating... {Math.min(Math.round(updateProgress), 100)}%</p>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${Math.min(updateProgress, 100)}%` }}
                />
              </div>
            </div>
          ) : needRefresh ? (
            <>
              <p className="text-sm text-muted-foreground">A new version is available. Update now to get the latest features and fixes.</p>
              <Button onClick={handleUpdate} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" /> Update Now
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Your app is up to date.</p>
              <Button variant="outline" onClick={handleCheckUpdate} disabled={checking} className="w-full gap-2">
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Check for Updates
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <TotpSetupCard />
    </div>
  );
};

export default AdminSettings;
