import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Clock, Landmark, Gift, CreditCard } from "lucide-react";

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
  const [clientPaymentSharing, setClientPaymentSharing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

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
        }
      }
      setLoading(false);
    };
    fetch();
  }, []);

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
      {/* Client Payment Sharing Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Client Payment Details Sharing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            When disabled, only admins can share payment details (QR/UPI/Bank) in the validation chat. Clients will see a message that this feature is managed by admin.
          </p>
          <div className="flex items-center justify-between">
            <Label htmlFor="client-sharing-toggle" className="text-sm font-medium">
              Allow clients to share payment details
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
                  toast({ title: "Settings saved", description: `Client payment sharing ${checked ? "enabled" : "disabled"}` });
                } catch (e: any) {
                  setClientPaymentSharing(!checked);
                  toast({ title: "Error", description: e.message, variant: "destructive" });
                } finally {
                  setSaving(null);
                }
              }}
            />
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
            Configure the prefix and number of digits for auto-generated user codes. Changes apply to new registrations only.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
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
              <p className="text-xs text-muted-foreground">
                Preview: <span className="font-mono font-bold">{empPrefix || "EMP"}{("0".repeat(Number(empDigits) || 5)).slice(0, -1)}1</span>
              </p>
              <Button
                size="sm"
                onClick={async () => {
                  if (!empPrefix.trim()) { toast({ title: "Invalid", description: "Prefix cannot be empty", variant: "destructive" }); return; }
                  const d = Number(empDigits);
                  if (isNaN(d) || d < 3 || d > 10) { toast({ title: "Invalid", description: "Digits must be 3-10", variant: "destructive" }); return; }
                  setSaving("emp_code");
                  try {
                    await supabase.from("app_settings").upsert({ key: "employee_code_prefix", value: empPrefix.trim() }, { onConflict: "key" });
                    await supabase.from("app_settings").upsert({ key: "employee_code_digits", value: String(d) }, { onConflict: "key" });
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
              <p className="text-xs text-muted-foreground">
                Preview: <span className="font-mono font-bold">{cltPrefix || "CLT"}{("0".repeat(Number(cltDigits) || 5)).slice(0, -1)}1</span>
              </p>
              <Button
                size="sm"
                onClick={async () => {
                  if (!cltPrefix.trim()) { toast({ title: "Invalid", description: "Prefix cannot be empty", variant: "destructive" }); return; }
                  const d = Number(cltDigits);
                  if (isNaN(d) || d < 3 || d > 10) { toast({ title: "Invalid", description: "Digits must be 3-10", variant: "destructive" }); return; }
                  setSaving("clt_code");
                  try {
                    await supabase.from("app_settings").upsert({ key: "client_code_prefix", value: cltPrefix.trim() }, { onConflict: "key" });
                    await supabase.from("app_settings").upsert({ key: "client_code_digits", value: String(d) }, { onConflict: "key" });
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
    </div>
  );
};

export default AdminSettings;