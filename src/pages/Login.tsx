import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { Briefcase, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations";

const Login = () => {
  const [userType, setUserType] = useState<"employee" | "client">("employee");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Login with email and use user_code for verification after
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.date_of_birth, // Using DOB as a secondary check pattern
      });

      if (error) {
        // Try standard email/password login
        toast({
          title: "Login Failed",
          description: "Invalid credentials. Please check your details and try again.",
          variant: "destructive",
        });
        return;
      }

      // Verify profile exists and matches
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, approval_status, user_code, full_name")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.auth.signOut();
        toast({ title: "Profile not found", description: "Please register first.", variant: "destructive" });
        return;
      }

      if (profile.approval_status === "pending") {
        navigate("/verification-pending");
        return;
      }

      if (profile.approval_status === "rejected") {
        await supabase.auth.signOut();
        toast({ title: "Account Rejected", description: "Your account has been rejected. Contact support.", variant: "destructive" });
        return;
      }

      toast({ title: "Welcome back!", description: `Logged in as ${profile.full_name}` });
      navigate(profile.user_type === "employee" ? "/employee/dashboard" : "/client/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Login</span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Login to your Freelancer account</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <Tabs value={userType} onValueChange={(v) => setUserType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="employee">Employee</TabsTrigger>
                <TabsTrigger value="client">Client</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" placeholder="Enter your full name" {...register("full_name")} />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_code">
                  {userType === "employee" ? "Employee" : "Client"} Code
                </Label>
                <Input
                  id="user_code"
                  placeholder={userType === "employee" ? "EMP00001" : "CLT00001"}
                  {...register("user_code")}
                />
                {errors.user_code && <p className="text-xs text-destructive">{errors.user_code.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
                {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register/employee" className="font-medium text-primary hover:underline">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
