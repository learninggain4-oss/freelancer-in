import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WithdrawalPasswordCard = () => {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.functions
      .invoke("withdrawal-password", { body: { action: "status" } })
      .then(({ data, error }) => {
        if (!error && data) setHasPassword(data.has_password);
      });
  }, []);

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (hasPassword && !currentPassword) {
      toast.error("Enter your current withdrawal password");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("withdrawal-password", {
        body: {
          action: "set",
          password: newPassword,
          ...(hasPassword ? { current_password: currentPassword } : {}),
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success(hasPassword ? "Withdrawal password updated" : "Withdrawal password created");
      setHasPassword(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (hasPassword === null) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-5 w-5 text-primary" />
          Withdrawal Password
          {hasPassword && <ShieldCheck className="h-4 w-4 text-accent" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {hasPassword
            ? "Your withdrawal password is set. You'll need it each time you request a withdrawal. You can change it below."
            : "Set a withdrawal password to secure your fund withdrawals. You'll be asked to enter it every time you request a withdrawal."}
        </p>

        {hasPassword && (
          <div className="space-y-2">
            <Label>Current Password</Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>{hasPassword ? "New Password" : "Create Password"}</Label>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-10 w-10"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Confirm Password</Label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-10 w-10"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button className="w-full" onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : hasPassword ? (
            "Update Withdrawal Password"
          ) : (
            "Create Withdrawal Password"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WithdrawalPasswordCard;
