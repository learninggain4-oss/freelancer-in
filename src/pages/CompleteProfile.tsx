import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const phoneRegex = /^[6-9]\d{9}$/;

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

const CompleteProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<"password" | "profile">("password");
  const [loading, setLoading] = useState(false);

  // Password fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const strength = getPasswordStrength(password);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
      toast({ title: "Password set successfully!" });
      setStep("profile");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast({ title: "Full name is required (min 2 characters)", variant: "destructive" });
      return;
    }
    if (!gender) {
      toast({ title: "Please select gender", variant: "destructive" });
      return;
    }
    if (!dateOfBirth) {
      toast({ title: "Date of birth is required", variant: "destructive" });
      return;
    }
    if (!mobileNumber || !phoneRegex.test(mobileNumber)) {
      toast({ title: "Enter a valid 10-digit Indian mobile number", variant: "destructive" });
      return;
    }
    if (!whatsappNumber || !phoneRegex.test(whatsappNumber)) {
      toast({ title: "Enter a valid 10-digit WhatsApp number", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Check for duplicates
      const upperName = fullName.trim().toUpperCase();
      const { data: dupes } = await supabase.rpc("check_registration_duplicates", {
        p_email: "",
        p_full_name: upperName,
        p_mobile: mobileNumber,
        p_whatsapp: whatsappNumber,
      });

      if (dupes && typeof dupes === "object") {
        const dupeObj = dupes as Record<string, string>;
        const errors = Object.values(dupeObj).filter(Boolean);
        if (errors.length > 0) {
          toast({ title: "Duplicate found", description: errors.join(". "), variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: [upperName],
          gender: gender as any,
          date_of_birth: dateOfBirth,
          marital_status: maritalStatus ? (maritalStatus as any) : null,
          education_level: educationLevel || null,
          mobile_number: mobileNumber,
          whatsapp_number: whatsappNumber,
        })
        .eq("user_id", user!.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: "Profile completed successfully! 🎉" });

      // Navigate to appropriate dashboard
      if (profile?.user_type === "employee") {
        navigate("/freelancer/dashboard", { replace: true });
      } else {
        navigate("/employer/dashboard", { replace: true });
      }
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
          <h1 className="text-2xl font-bold text-foreground">
            {step === "password" ? "Set Your Password" : "Complete Your Profile"}
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            {step === "password"
              ? "Create a password for your account"
              : "Fill in your details to get started"}
          </p>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-2">
            <div className={`h-2 w-8 rounded-full ${step === "password" ? "bg-primary" : "bg-accent"}`} />
            <div className={`h-2 w-8 rounded-full ${step === "profile" ? "bg-primary" : "bg-muted"}`} />
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            {step === "password" ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  Set Password & Continue
                </Button>
              </form>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender <span className="text-destructive">*</span></Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth <span className="text-destructive">*</span></Label>
                  <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Marital Status</Label>
                  <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                    <SelectTrigger><SelectValue placeholder="Select (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Education Level</Label>
                  <Input
                    placeholder="e.g., Bachelor's in CS"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="10-digit Indian mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Number <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="10-digit WhatsApp number"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Complete Profile
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfile;
