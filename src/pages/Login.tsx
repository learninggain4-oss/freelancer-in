import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, type LoginFormData } from "@/lib/validations/registration";
import { supabase } from "@/integrations/supabase/client";
import TotpVerifyDialog from "@/components/admin/TotpVerifyDialog";



const Login = () => {
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showTotpDialog, setShowTotpDialog] = useState(false);
  const [pendingAdminNav, setPendingAdminNav] = useState(false);
  const [pendingUserNav, setPendingUserNav] = useState<string | null>(null);
  const [captchaA, setCaptchaA] = useState(0);
  const [captchaB, setCaptchaB] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, profile, loading: authLoading } = useAuth();

  const regenerateCaptcha = useCallback(() => {
    setCaptchaA(Math.floor(Math.random() * 9) + 1);
    setCaptchaB(Math.floor(Math.random() * 9) + 1);
    setCaptchaAnswer("");
  }, []);

  useEffect(() => { regenerateCaptcha(); }, [regenerateCaptcha]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Check admin role when user is available
  useEffect(() => {
    if (!user) { setIsAdmin(null); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as const })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  // Redirect if already logged in
  if (!authLoading && user && profile && isAdmin !== null) {
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
    if (profile.approval_status !== "approved") {
      return <Navigate to="/verification-pending" replace />;
    }
    const base = profile.user_type === "employee" ? "/employee" : "/client";
    return <Navigate to={`${base}/dashboard`} replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) throw error;
      toast({ title: "Welcome back!" });
      // Actively navigate after sign-in instead of relying on reactive state
      const waitForProfile = async () => {
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 500));
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) break;
          const { data: prof } = await supabase
            .from("profiles")
            .select("user_type, approval_status")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (!prof) continue;
          if (prof.approval_status !== "approved") {
            navigate("/verification-pending", { replace: true });
            return;
          }
          const { data: adminCheck } = await supabase.rpc("has_role", {
            _user_id: session.user.id,
            _role: "admin" as const,
          });
          if (adminCheck) {
            // Check if admin has TOTP enabled
            const totpRes = await supabase.functions.invoke("admin-totp", {
              body: { action: "check_status" },
            });
            if (totpRes.data?.is_enabled) {
              setPendingAdminNav(true);
              setShowTotpDialog(true);
              return;
            }
            navigate("/admin/dashboard", { replace: true });
          } else {
            const base = prof.user_type === "employee" ? "/employee" : "/client";
            const dest = `${base}/dashboard`;
            // Check if user has TOTP enabled
            const userTotpRes = await supabase.functions.invoke("user-totp", {
              body: { action: "check_status_by_id", user_id: session.user.id },
            });
            if (userTotpRes.data?.is_enabled) {
              setPendingUserNav(dest);
              setShowTotpDialog(true);
              return;
            }
            navigate(dest, { replace: true });
          }
          return;
        }
      };
      waitForProfile();
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      regenerateCaptcha();
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
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Login to your account</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Enter your password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="text-right">
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  />
                  <label htmlFor="terms" className="text-xs leading-tight text-muted-foreground">
                    I agree to the{" "}
                    <Link to="/legal/terms-of-service" className="text-primary hover:underline" target="_blank">Terms of Service</Link>
                    {" "}and{" "}
                    <Link to="/legal/privacy-policy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>
                  </label>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    What is {captchaA} + {captchaB} =
                  </span>
                  <Input
                    type="number"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="?"
                    className="h-9 w-20 text-center"
                  />
                  <button
                    type="button"
                    onClick={regenerateCaptcha}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="New captcha"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={loading || !agreedToTerms || parseInt(captchaAnswer) !== captchaA + captchaB}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register/employee" className="font-medium text-primary hover:underline">Register here</Link>
        </p>
        <div className="mt-2 text-center">
        </div>
      </div>

      <TotpVerifyDialog
        open={showTotpDialog}
        onClose={() => {
          setShowTotpDialog(false);
          setPendingAdminNav(false);
          setPendingUserNav(null);
        }}
        onVerified={() => {
          setShowTotpDialog(false);
          if (pendingAdminNav) {
            setPendingAdminNav(false);
            navigate("/admin/dashboard", { replace: true });
          } else if (pendingUserNav) {
            const dest = pendingUserNav;
            setPendingUserNav(null);
            navigate(dest, { replace: true });
          }
        }}
        title={pendingAdminNav ? "Admin Verification" : "Two-Factor Verification"}
        description="Enter your Google Authenticator code to continue."
        functionName={pendingAdminNav ? "admin-totp" : "user-totp"}
      />
    </div>
  );
};

export default Login;
