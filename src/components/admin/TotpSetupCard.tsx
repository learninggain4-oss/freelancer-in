import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const TotpSetupCard = () => {
  const queryClient = useQueryClient();
  const [setupData, setSetupData] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["admin-totp-status"],
    queryFn: async () => {
      const res = await supabase.functions.invoke("admin-totp", {
        body: { action: "check_status" },
      });
      if (res.error) throw new Error(res.error.message);
      return res.data as { is_enabled: boolean };
    },
  });

  const handleSetup = async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-totp", {
        body: { action: "setup" },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      setSetupData(res.data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error("Enter a 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-totp", {
        body: { action: "enable", code: verifyCode },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success("2FA enabled successfully!");
      setSetupData(null);
      setVerifyCode("");
      queryClient.invalidateQueries({ queryKey: ["admin-totp-status"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode || disableCode.length !== 6) {
      toast.error("Enter a 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-totp", {
        body: { action: "disable", code: disableCode },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success("2FA disabled");
      setDisableCode("");
      queryClient.invalidateQueries({ queryKey: ["admin-totp-status"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const isEnabled = status?.is_enabled ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          Two-Factor Authentication (2FA)
          {isEnabled ? (
            <Badge variant="default" className="ml-2">Enabled</Badge>
          ) : (
            <Badge variant="secondary" className="ml-2">Disabled</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEnabled && !setupData && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Secure your admin account with Google Authenticator. You'll need to enter a 6-digit code when logging in and performing sensitive actions.
            </p>
            <Button onClick={handleSetup} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Set Up 2FA
            </Button>
          </div>
        )}

        {!isEnabled && setupData && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">1. Scan this QR code with Google Authenticator:</p>
              <div className="flex justify-center rounded-lg border bg-white p-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpauth_url)}`}
                  alt="TOTP QR Code"
                  className="h-48 w-48"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">2. Or manually enter this secret key:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
                  {setupData.secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>3. Enter the 6-digit code from your app to verify:</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="font-mono text-center text-lg tracking-widest"
                />
                <Button onClick={handleEnable} disabled={loading || verifyCode.length !== 6}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Enable"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {isEnabled && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              2FA is active. You'll be prompted for a verification code during login and sensitive actions like wallet transfers.
            </p>
            <div className="space-y-2">
              <Label>Enter code to disable 2FA:</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="000000"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="font-mono text-center text-lg tracking-widest"
                />
                <Button variant="destructive" onClick={handleDisable} disabled={loading || disableCode.length !== 6}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldOff className="mr-2 h-4 w-4" /> Disable</>}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TotpSetupCard;
