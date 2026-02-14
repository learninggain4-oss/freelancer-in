import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Clock } from "lucide-react";

const AdminSettings = () => {
  const { toast } = useToast();
  const [countdownHours, setCountdownHours] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "approval_countdown_hours")
        .maybeSingle();
      if (data) setCountdownHours(data.value);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    const hours = Number(countdownHours);
    if (isNaN(hours) || hours <= 0) {
      toast({ title: "Invalid value", description: "Enter a positive number", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "approval_countdown_hours", value: String(hours) }, { onConflict: "key" });
      if (error) throw error;
      toast({ title: "Settings saved", description: `Countdown set to ${hours} hours` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
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
            <Button onClick={handleSave} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
