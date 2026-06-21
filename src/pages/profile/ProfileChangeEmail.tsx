import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, KeyRound, Mail, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";

const EXPIRY_SECONDS = 180;

const getBasePath = (pathname: string) =>
  pathname.startsWith("/freelancer") ? "/freelancer" : pathname.startsWith("/employer") ? "/employer" : "/employee";

const ProfileChangeEmail = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = getBasePath(pathname);
  const [email, setEmail] = useState("");
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const hasVerifiedChange = useMemo(() => {
    return !!user?.email && !!profile?.email && user.email.toLowerCase() !== profile.email.toLowerCase();
  }, [profile?.email, user?.email]);

  useEffect(() => {
    if (!sentAt) return;
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - sentAt) / 1000);
      setSecondsLeft(Math.max(EXPIRY_SECONDS - elapsed, 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sentAt]);

  useEffect(() => {
    if (!hasVerifiedChange || !profile?.id || !user?.email) return;
    supabase
      .from("profiles")
      .update({ email: user.email } as any)
      .eq("id", profile.id)
      .then(({ error }) => {
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Email ID changed successfully.");
        refreshProfile();
      });
  }, [hasVerifiedChange, profile?.id, refreshProfile, user?.email]);

  const sendVerification = async () => {
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail) {
      toast.error("Enter new email ID.");
      return;
    }
    if (nextEmail === profile?.email?.toLowerCase()) {
      toast.error("Enter a different email ID.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser(
      { email: nextEmail },
      { emailRedirectTo: `${window.location.origin}${base}/profile/change-email` },
    );
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSentAt(Date.now());
    setSecondsLeft(EXPIRY_SECONDS);
    setCode("");
    toast.success("Verification code sent to the new email ID.");
  };

  const verifyCode = async (nextCode = code) => {
    const token = nextCode.trim();
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail || token.length < 6 || verifying) return;

    setVerifying(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: nextEmail,
      token,
      type: "email_change",
    });
    setVerifying(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const verifiedEmail = data.user?.email || nextEmail;
    if (profile?.id) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ email: verifiedEmail } as any)
        .eq("id", profile.id);
      if (profileError) {
        toast.error(profileError.message);
        return;
      }
    }

    toast.success("Email ID changed successfully.");
    refreshProfile();
    navigate(`${base}/profile/personal`);
  };

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${base}/profile/personal`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Change Email ID</h1>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start gap-3 rounded-md border p-3">
            <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Current Email ID</p>
              <p className="truncate text-sm font-medium">{profile?.email || "Not provided"}</p>
            </div>
          </div>

          {hasVerifiedChange ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4" />
                Verification completed
              </div>
              <p className="mt-1 text-xs">Your email ID is being updated in your profile.</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="text-xs">New Email ID</Label>
                <Input
                  type="email"
                  value={email}
                  placeholder="Enter new email ID"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {sentAt && (
                <div className="rounded-md border p-3 text-sm">
                  <p className="font-medium">Verification code sent</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter the code from your email. This request expires in {minutes}:{seconds}.
                  </p>
                </div>
              )}

              {sentAt && (
                <div className="space-y-1">
                  <Label className="text-xs">Verification Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={code}
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="Enter 8-digit code"
                      className="pl-9 text-center text-lg font-semibold tracking-[0.3em]"
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, "").slice(0, 8);
                        setCode(next);
                        if (next.length === 8) verifyCode(next);
                      }}
                      disabled={verifying || secondsLeft === 0}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {verifying
                      ? "Verifying code..."
                      : "Verification starts automatically after entering the full code."}
                  </p>
                </div>
              )}

              <Button className="w-full" onClick={sendVerification} disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                {sentAt ? "Resend Verification Code" : "Send Verification Code"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileChangeEmail;
