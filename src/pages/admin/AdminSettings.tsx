import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Clock, Landmark } from "lucide-react";

const AdminSettings = () => {
  const { toast } = useToast();
  const [countdownHours, setCountdownHours] = useState("");
  const [maxBankAttempts, setMaxBankAttempts] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["approval_countdown_hours", "max_bank_verification_attempts"]);
      if (data) {
        for (const row of data) {
          if (row.key === "approval_countdown_hours") setCountdownHours(row.value);
          if (row.key === "max_bank_verification_attempts") setMaxBankAttempts(row.value);
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
            Users will see this countdown after registration while waiting for admin approval.
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
    </div>
  );
};

export default AdminSettings;