import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Loader2 } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, type LoginFormData } from "@/lib/validations/registration";
import { supabase } from "@/integrations/supabase/client";

const RECAPTCHA_SITE_KEY = "6Lev72osAAAAAAlPrwq6vGMs4pt3wBDjOqWT9gB5";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, profile, loading: authLoading } = useAuth();

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

  const verifyCaptcha = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-captcha", {
        body: { token },
      });
      if (error) return false;
      return data?.success === true;
    } catch {
      return false;
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    if (!captchaToken) {
      toast({ title: "Please complete the CAPTCHA", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        toast({ title: "CAPTCHA verification failed", description: "Please try again.", variant: "destructive" });
        captchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }
      const { error } = await signIn(data.email, data.password);
      if (error) throw error;
      toast({ title: "Welcome back!" });
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      captchaRef.current?.reset();
      setCaptchaToken(null);
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
                <div className="flex justify-center">
                  <ReCAPTCHA
                    ref={captchaRef}
                    sitekey={RECAPTCHA_SITE_KEY}
                    onChange={(token) => setCaptchaToken(token)}
                    onExpired={() => setCaptchaToken(null)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !captchaToken}>
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
          <Link to="/"><Button variant="ghost" size="sm">← Back to Home</Button></Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
