import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Briefcase, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { registrationSchema, type RegistrationFormData } from "@/lib/validations";

interface RegistrationFormProps {
  userType: "employee" | "client";
}

const steps = [
  { title: "Personal Info", fields: ["full_name", "gender", "date_of_birth", "marital_status", "education_level"] },
  { title: "Contact", fields: ["mobile_number", "whatsapp_number", "email", "password"] },
  { title: "Professional", fields: ["previous_job_details", "work_experience", "education_background"] },
  { title: "Emergency", fields: ["emergency_contact_name", "emergency_contact_relationship", "emergency_contact_phone"] },
];

const RegistrationForm = ({ userType }: RegistrationFormProps) => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      previous_job_details: "",
      work_experience: "",
      education_background: "",
    },
  });

  const progress = ((step + 1) / steps.length) * 100;

  const handleNext = async () => {
    const fields = steps[step].fields as (keyof RegistrationFormData)[];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { emailRedirectTo: window.location.origin },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      // 2. Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: authData.user.id,
        user_type: userType,
        full_name: data.full_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        marital_status: data.marital_status,
        education_level: data.education_level,
        mobile_number: data.mobile_number,
        whatsapp_number: data.whatsapp_number,
        email: data.email,
        previous_job_details: data.previous_job_details || null,
        work_experience: data.work_experience || null,
        education_background: data.education_background || null,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_relationship: data.emergency_contact_relationship,
        emergency_contact_phone: data.emergency_contact_phone,
      });

      if (profileError) throw profileError;

      toast({
        title: "Registration Successful!",
        description: "Your account is pending admin approval. You'll be notified within 6 hours.",
      });

      navigate("/verification-pending");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">
              {userType === "employee" ? "Employee" : "Client"} Registration
            </span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="mx-auto w-full max-w-lg px-4 pt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {steps.length}</span>
          <span>{steps[step].title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="mx-auto flex w-full max-w-lg items-center justify-center gap-2 px-4 py-4">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              i < step
                ? "bg-accent text-accent-foreground"
                : i === step
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-lg flex-1 px-4 pb-8">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{steps[step].title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 0: Personal Info */}
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" placeholder="Enter your full name" {...register("full_name")} />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select onValueChange={(v) => setValue("gender", v as any)} value={watch("gender")}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
                  {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Marital Status *</Label>
                  <Select onValueChange={(v) => setValue("marital_status", v as any)} value={watch("marital_status")}>
                    <SelectTrigger><SelectValue placeholder="Select marital status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.marital_status && <p className="text-xs text-destructive">{errors.marital_status.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education_level">Education Level *</Label>
                  <Input id="education_level" placeholder="e.g., Bachelor's in Computer Science" {...register("education_level")} />
                  {errors.education_level && <p className="text-xs text-destructive">{errors.education_level.message}</p>}
                </div>
              </>
            )}

            {/* Step 1: Contact Details */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mobile_number">Mobile Number *</Label>
                  <Input id="mobile_number" placeholder="10-digit mobile number" maxLength={10} {...register("mobile_number")} />
                  {errors.mobile_number && <p className="text-xs text-destructive">{errors.mobile_number.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
                  <Input id="whatsapp_number" placeholder="10-digit WhatsApp number" maxLength={10} {...register("whatsapp_number")} />
                  {errors.whatsapp_number && <p className="text-xs text-destructive">{errors.whatsapp_number.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" placeholder="Min 6 characters" {...register("password")} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
              </>
            )}

            {/* Step 2: Professional */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="previous_job_details">Previous Job Details</Label>
                  <Textarea id="previous_job_details" placeholder="Describe your previous roles..." rows={3} {...register("previous_job_details")} />
                  {errors.previous_job_details && <p className="text-xs text-destructive">{errors.previous_job_details.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_experience">Work Experience</Label>
                  <Textarea id="work_experience" placeholder="Years of experience and skills..." rows={3} {...register("work_experience")} />
                  {errors.work_experience && <p className="text-xs text-destructive">{errors.work_experience.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education_background">Education Background</Label>
                  <Textarea id="education_background" placeholder="Institutions attended, certifications..." rows={3} {...register("education_background")} />
                  {errors.education_background && <p className="text-xs text-destructive">{errors.education_background.message}</p>}
                </div>
              </>
            )}

            {/* Step 3: Emergency Contact */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name *</Label>
                  <Input id="emergency_contact_name" placeholder="Full name" {...register("emergency_contact_name")} />
                  {errors.emergency_contact_name && <p className="text-xs text-destructive">{errors.emergency_contact_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relationship">Relationship *</Label>
                  <Input id="emergency_contact_relationship" placeholder="e.g., Spouse, Parent" {...register("emergency_contact_relationship")} />
                  {errors.emergency_contact_relationship && <p className="text-xs text-destructive">{errors.emergency_contact_relationship.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone *</Label>
                  <Input id="emergency_contact_phone" placeholder="10-digit phone number" maxLength={10} {...register("emergency_contact_phone")} />
                  {errors.emergency_contact_phone && <p className="text-xs text-destructive">{errors.emergency_contact_phone.message}</p>}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <Button type="button" variant="outline" className="flex-1" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button type="button" className="flex-1" onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Submit Registration"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
