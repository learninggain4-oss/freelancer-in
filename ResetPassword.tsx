import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Briefcase, Loader2, CheckCircle, Check, X, AlertTriangle, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const getPasswordStrength = (pw: string) => {
  const checks = [
    { label: "At least 8 characters", met: pw.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(pw) },
    { label: "Lowercase letter", met: /[a-z]/.test(pw) },
    { label: "Number", met: /[0-9]/.test(pw) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter((c) => c.met).length;
  const level = score <= 1 ? "Weak" : score <= 3 ? "Fair" : score === 4 ? "Good" : "Strong";
  const color = score <= 1 ? "bg-destructive" : score <= 3 ? "bg-warning" : score === 4 ? "bg-primary" : "bg-accent";
  return { checks, score, level, color, percent: (score / checks.length) * 100 };
};

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Listen for PASSWORD_RECOVERY event and also check for existing session
  useEffect(() => {
    let handled = false;

    // Listen for auth state changes (PASSWORD_RECOVERY event from email link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (handled) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        handled = true;
        setSessionReady(true);
        setCheckingSession(false);
      } else if (event === "SIGNED_IN" && session) {
        // Some Supabase versions fire SIGNED_IN instead of PASSWORD_RECOVERY
        handled = true;
        setSessionReady(true);
        setCheckingSession(false);
      }
    });

    // Also check if session already exists (user may already be authenticated)
    const checkExistingSession = async () => {
      // Give the auth state listener a moment to process hash params
      await new Promise((r) => setTimeout(r, 1500));
      if (handled) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        handled = true;
        setSessionReady(true);
        setCheckingSession(false);
      } else {
        // Check if there are hash params in the URL that need processing
        const hash = window.location.hash;
        if (hash && (hash.includes("access_token") || hash.includes("type=recovery"))) {
          // Hash params exist but session not ready yet - wait a bit more
          await new Promise((r) => setTimeout(r, 2000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            handled = true;
            setSessionReady(true);
          } else {
            setSessionError("The reset link has expired or is invalid. Please request a new one.");
          }
        } else {
          setSessionError("No valid reset token found. Please request a new password reset link.");
        }
        setCheckingSession(false);
      }
    };

    checkExistingSession();

    return () => subscription.unsubscribe();
  }, []);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast({ title: "Password updated successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Briefcase className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create New Password</h1>
          <p className="text-sm text-muted-foreground">Enter your new password below</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Loading - waiting for recovery session */}
            {checkingSession && (
              <div className="space-y-4 text-center py-4">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Verifying your reset link...</p>
              </div>
            )}

            {/* Error - invalid or expired token */}
            {!checkingSession && sessionError && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <p className="text-sm font-medium text-foreground">Link Expired or Invalid</p>
                <p className="text-xs text-muted-foreground">{sessionError}</p>
                <Link to="/forgot-password">
                  <Button className="w-full gap-1">
                    <Mail className="h-4 w-4" />
                    Request New Reset Link
                  </Button>
                </Link>
              </div>
            )}

            {/* Success */}
            {!checkingSession && success && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <CheckCircle className="h-6 w-6 text-accent" />
                </div>
                <p className="text-sm font-medium text-foreground">Password updated!</p>
                <p className="text-xs text-muted-foreground">You can now login with your new password.</p>
                <Button className="w-full" onClick={() => navigate("/login")}>
                  Go to Login
                </Button>
              </div>
            )}

            {/* Reset form - session is ready */}
            {!checkingSession && sessionReady && !success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Strength</span>
                        <span className={`font-medium ${strength.score <= 1 ? "text-destructive" : strength.score <= 3 ? "text-warning" : "text-accent"}`}>
                          {strength.level}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.percent}%` }} />
                      </div>
                      <ul className="space-y-1">
                        {strength.checks.map((c) => (
                          <li key={c.label} className="flex items-center gap-1.5 text-xs">
                            {c.met ? <Check className="h-3 w-3 text-accent" /> : <X className="h-3 w-3 text-muted-foreground" />}
                            <span className={c.met ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-3 w-3" /> Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
