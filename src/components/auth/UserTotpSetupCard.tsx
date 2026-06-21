import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction, getToken } from "@/lib/supabase-functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

async function serverFetch(functionName: string, body?: object) {
  const token = await getToken();
  const res = await callEdgeFunction(functionName, { body, token });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || "Request failed");
  return data;
}

const UserTotpSetupCard = () => {
  const queryClient = useQueryClient();
  const [setupData, setSetupData] = useState<{ qrCodeDataUrl: string; formattedSecret: string; otpauthUrl: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["user-totp-status"],
    queryFn: async () => {
      const data = await serverFetch("totp-status");
      return data as { setup: boolean };
    },
  });

  const handleSetup = async () => {
    setLoading(true);
    try {
      const data = await serverFetch("totp-setup-init", {});
      setSetupData(data);
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
      await serverFetch("totp-setup-verify", { token: verifyCode });
      toast.success("Google Authenticator enabled successfully!");
      setSetupData(null);
      setVerifyCode("");
      queryClient.invalidateQueries({ queryKey: ["user-totp-status"] });
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
      await serverFetch("totp-disable", { token: disableCode });
      toast.success("Google Authenticator disabled");
      setDisableCode("");
      queryClient.invalidateQueries({ queryKey: ["user-totp-status"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (setupData?.formattedSecret) {
      navigator.clipboard.writeText(setupData.formattedSecret.replace(/\s/g, ""));
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

  const isEnabled = status?.setup ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          Google Authenticator (2FA)
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
              Secure your account with Google Authenticator. You'll be asked for a 6-digit code when logging in.
            </p>
            <Button onClick={handleSetup} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Set Up Google Authenticator
            </Button>
          </div>
        )}

        {!isEnabled && setupData && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">1. Scan this QR code with Google Authenticator:</p>
              <div className="flex justify-center rounded-lg border bg-white p-4">
                <img
                  src={setupData.qrCodeDataUrl}
                  alt="TOTP QR Code"
                  className="h-48 w-48"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">2. Or manually enter this secret key:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
                  {setupData.formattedSecret}
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
              Google Authenticator is active. You'll be prompted for a verification code during login.
            </p>
            <div className="space-y-2">
              <Label>Enter your current code to disable:</Label>
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

export default UserTotpSetupCard;
