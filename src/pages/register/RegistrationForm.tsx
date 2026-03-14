import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase, ArrowLeft, ArrowRight, Loader2, Plus, Trash2,
  User, Phone, Building2, Heart, Wrench, CheckCircle2, Shield,
  GraduationCap, Calendar, Mail, Lock, Share2, Upload, FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  registrationProfileSchema,
  type RegistrationFormData,
  type WorkExperienceEntry,
  type EmergencyContactEntry,
  type ServiceEntry,
  validateWorkExperience,
  validateEmergencyContact,
  validateService,
} from "@/lib/validations/registration";

interface RegistrationFormProps {
  userType: "employee" | "client";
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1969 }, (_, i) => String(currentYear - i));

const companyTypes = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
  { value: "government", label: "Government" },
  { value: "ngo", label: "NGO" },
  { value: "startup", label: "Startup" },
  { value: "freelance", label: "Freelance" },
  { value: "other", label: "Other" },
];

const relationships = [
  { value: "parent", label: "Parent" },
  { value: "spouse", label: "Spouse" },
  { value: "sibling", label: "Sibling" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

const emptyWorkExp = (): WorkExperienceEntry => ({
  company_name: "", company_type: "", work_description: "", start_year: "", end_year: "", is_current: false, certificate_file: null,
});

const emptyContact = (): EmergencyContactEntry => ({
  contact_name: "", contact_phone: "", relationship: "",
});

const emptyService = (): ServiceEntry => ({
  category_id: "", service_title: "", hourly_rate: "", minimum_budget: "", skill_ids: [],
});

const stepConfig = [
  { label: "Personal Info", icon: User, description: "Tell us about yourself" },
  { label: "Contact Details", icon: Phone, description: "How can we reach you?" },
  { label: "Work Experience", icon: Building2, description: "Your professional journey" },
  { label: "Emergency Contact", icon: Heart, description: "Who should we contact?" },
  { label: "Services", icon: Wrench, description: "What do you offer?" },
];

const RegistrationForm = ({ userType }: RegistrationFormProps) => {
  const isEmployee = userType === "employee";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceEntry[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactEntry[]>([emptyContact()]);
  const [services, setServices] = useState<ServiceEntry[]>([emptyService()]);
  const [arrayErrors, setArrayErrors] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState(() => searchParams.get("ref")?.toUpperCase() || "");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationProfileSchema),
    defaultValues: {
      full_name: "", gender: undefined, date_of_birth: "", marital_status: undefined,
      education_level: "", mobile_number: "", whatsapp_number: "", email: "", password: "",
      education_background: "",
    },
    mode: "onTouched",
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("service_categories").select("*").order("name");
      return data || [];
    },
  });

  const { data: allSkills = [] } = useQuery({
    queryKey: ["service-skills"],
    queryFn: async () => {
      const { data } = await supabase.from("service_skills").select("*").order("name");
      return data || [];
    },
  });

  const getStepType = (s: number) => {
    if (s === 0) return "personal";
    if (s === 1) return "contact";
    if (s === 2) return "work";
    if (s === 3) return "emergency";
    if (s === 4) return "services";
    return "personal";
  };

  const formFieldsForStep = (s: number): string[] => {
    const type = getStepType(s);
    if (type === "personal") return ["full_name", "gender", "date_of_birth", "marital_status", "education_level"];
    if (type === "contact") return ["mobile_number", "whatsapp_number", "email", "password"];
    return [];
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    const type = getStepType(step);
    setArrayErrors([]);
    const fields = formFieldsForStep(step);
    if (fields.length > 0) {
      const valid = await form.trigger(fields as any);
      if (!valid) return false;
    }
    if (type === "contact") {
      const values = form.getValues();
      try {
        const { data: dupes, error } = await supabase.rpc("check_registration_duplicates", {
          p_email: values.email, p_full_name: values.full_name.toUpperCase(),
          p_mobile: values.mobile_number, p_whatsapp: values.whatsapp_number,
        });
        if (error) throw error;
        if (dupes && typeof dupes === "object" && Object.keys(dupes).length > 0) {
          const msgs = Object.values(dupes as Record<string, string>);
          msgs.forEach((m) => toast({ title: "Duplicate found", description: m, variant: "destructive" }));
          return false;
        }
      } catch (err: any) {
        toast({ title: "Validation error", description: err.message, variant: "destructive" });
        return false;
      }
    }
    if (type === "work") {
      const errors: string[] = [];
      workExperiences.forEach((w, i) => {
        const err = validateWorkExperience(w);
        if (err) errors.push(`Experience ${i + 1}: ${err}`);
      });
      if (errors.length > 0) { setArrayErrors(errors); return false; }
    }
    if (type === "emergency") {
      if (emergencyContacts.length === 0) { setArrayErrors(["At least one emergency contact is required"]); return false; }
      const errors: string[] = [];
      emergencyContacts.forEach((c, i) => {
        const err = validateEmergencyContact(c);
        if (err) errors.push(`Contact ${i + 1}: ${err}`);
      });
      if (errors.length > 0) { setArrayErrors(errors); return false; }
    }
    if (type === "services") {
      if (categories.length > 0 && services.length > 0) {
        const errors: string[] = [];
        services.forEach((s, i) => {
          const err = validateService(s);
          if (err) errors.push(`Service ${i + 1}: ${err}`);
        });
        if (errors.length > 0) { setArrayErrors(errors); return false; }
      }
    }
    return true;
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();
    if (valid) {
      setCompletedSteps((prev) => new Set([...prev, step]));
      setStep((s) => Math.min(s + 1, stepConfig.length - 1));
    }
  };

  const handleBack = () => { setStep((s) => Math.max(s - 1, 0)); setArrayErrors([]); };

  const onSubmit = async (data: RegistrationFormData) => {
    const lastStepValid = await validateCurrentStep();
    if (!lastStepValid) return;
    setSubmitting(true);
    try {
      let geoData: any = {};
      try {
        const geoRes = await fetch("https://ipapi.co/json/");
        if (geoRes.ok) {
          const g = await geoRes.json();
          geoData = { ip: g.ip, city: g.city, region: g.region, country: g.country_name, lat: g.latitude, lon: g.longitude };
        }
      } catch { /* non-critical */ }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email, password: data.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      const userId = authData.user.id;
      const { error: profileError } = await supabase.from("profiles").insert([{
        user_id: userId, user_type: userType, full_name: [data.full_name.toUpperCase()],
        user_code: [], email: data.email, gender: data.gender, date_of_birth: data.date_of_birth,
        marital_status: data.marital_status, education_level: data.education_level,
        mobile_number: data.mobile_number, whatsapp_number: data.whatsapp_number,
        education_background: data.education_background || null, referred_by: referralCode.trim() || null,
      } as any]);
      if (profileError) throw profileError;

      const profileId = userId;
      await supabase.from("registration_metadata" as any).insert([{
        profile_id: profileId, ip_address: geoData.ip || null, city: geoData.city || null,
        region: geoData.region || null, country: geoData.country || null,
        latitude: geoData.lat || null, longitude: geoData.lon || null,
      }] as any);

      for (const w of workExperiences) {
        let certPath: string | null = null;
        let certName: string | null = null;
        if (w.certificate_file) {
          const ext = w.certificate_file.name.split(".").pop();
          const path = `${profileId}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("work-certificates").upload(path, w.certificate_file);
          if (!uploadError) { certPath = path; certName = w.certificate_file.name; }
        }
        await supabase.from("work_experiences").insert({
          profile_id: profileId, company_name: w.company_name, company_type: w.company_type,
          work_description: w.work_description || null, start_year: Number(w.start_year),
          end_year: w.is_current ? null : Number(w.end_year), is_current: w.is_current,
          certificate_path: certPath, certificate_name: certName,
        });
      }

      for (const c of emergencyContacts) {
        await supabase.from("employee_emergency_contacts").insert({
          profile_id: profileId, contact_name: c.contact_name,
          contact_phone: c.contact_phone, relationship: c.relationship,
        });
      }

      for (const s of services) {
        if (!s.category_id || !s.service_title) continue;
        const { data: svcData } = await supabase.from("employee_services").insert({
          profile_id: profileId, category_id: s.category_id, service_title: s.service_title,
          hourly_rate: Number(s.hourly_rate) || 0, minimum_budget: Number(s.minimum_budget) || 0,
        }).select("id").single();
        if (svcData && s.skill_ids.length > 0) {
          const skillInserts = s.skill_ids.map((skillId) => ({ employee_service_id: svcData.id, skill_id: skillId }));
          await supabase.from("employee_skill_selections").insert(skillInserts);
        }
      }

      toast({ title: "Registration successful!", description: "Your account is pending admin approval." });
      navigate("/verification-pending");
    } catch (error: any) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateWorkExp = (index: number, field: keyof WorkExperienceEntry, value: any) => {
    setWorkExperiences((prev) => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
  };
  const updateContact = (index: number, field: keyof EmergencyContactEntry, value: string) => {
    setEmergencyContacts((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };
  const updateService = (index: number, field: keyof ServiceEntry, value: any) => {
    setServices((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const stepType = getStepType(step);
  const progressPercent = ((step + 1) / stepConfig.length) * 100;
  const StepIcon = stepConfig[step].icon;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-4 pb-8 pt-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-white/10" />
        </div>
        <div className="relative mx-auto max-w-lg">
          {/* Back Button */}
          <Link to="/" className="inline-flex">
            <Button variant="ghost" size="icon" className="mb-3 h-9 w-9 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Briefcase className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-primary-foreground">
                {isEmployee ? "Employee" : "Client"} Registration
              </h1>
              <p className="mt-0.5 text-sm text-primary-foreground/70">
                Join our freelancing platform today
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <StepIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary-foreground">{stepConfig[step].label}</span>
                <span className="text-xs font-medium text-primary-foreground/60">Step {step + 1}/{stepConfig.length}</span>
              </div>
              <p className="text-xs text-primary-foreground/60">{stepConfig[step].description}</p>
            </div>
          </div>

          {/* Step Progress Dots */}
          <div className="mt-4 flex items-center gap-2">
            {stepConfig.map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  i < step
                    ? "border-white/40 bg-white/30"
                    : i === step
                      ? "border-white bg-white/20 ring-2 ring-white/30 ring-offset-1 ring-offset-transparent"
                      : "border-white/20 bg-white/5"
                }`}>
                  {completedSteps.has(i) ? (
                    <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <span className={`text-xs font-bold ${i <= step ? "text-primary-foreground" : "text-primary-foreground/40"}`}>
                      {i + 1}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-tight text-center ${i <= step ? "text-primary-foreground/80" : "text-primary-foreground/30"}`}>
                  {stepConfig[i].label.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={progressPercent} className="h-1.5 bg-white/20 [&>div]:bg-white/80" />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="mx-auto w-full max-w-lg px-4 -mt-2">
        {/* Error messages */}
        {arrayErrors.length > 0 && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 shadow-sm">
            {arrayErrors.map((e, i) => (
              <p key={i} className="flex items-center gap-2 text-sm text-destructive">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                {e}
              </p>
            ))}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="border-0 shadow-lg">
              <CardContent className="space-y-5 p-5">

                {/* STEP: Personal Info */}
                {stepType === "personal" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Personal Information</span>
                    </div>

                    <FormField control={form.control} name="full_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className="uppercase border-muted bg-muted/30 focus:bg-background"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Name will be stored in uppercase</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Gender <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="border-muted bg-muted/30 focus:bg-background"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> DOB <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl><Input type="date" {...field} className="border-muted bg-muted/30 focus:bg-background" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="marital_status" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Marital Status <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="border-muted bg-muted/30 focus:bg-background"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="married">Married</SelectItem>
                              <SelectItem value="divorced">Divorced</SelectItem>
                              <SelectItem value="widowed">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="education_level" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 text-sm">
                            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" /> Education <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="border-muted bg-muted/30 focus:bg-background"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="high_school">High School</SelectItem>
                              <SelectItem value="diploma">Diploma</SelectItem>
                              <SelectItem value="bachelors">Bachelor's</SelectItem>
                              <SelectItem value="masters">Master's</SelectItem>
                              <SelectItem value="phd">PhD</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {/* STEP: Contact Details */}
                {stepType === "contact" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Contact Details</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="mobile_number" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Mobile <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl><Input placeholder="10-digit" maxLength={10} {...field} className="border-muted bg-muted/30 focus:bg-background" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="whatsapp_number" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">WhatsApp <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input placeholder="10-digit" maxLength={10} {...field} className="border-muted bg-muted/30 focus:bg-background" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl><Input type="email" placeholder="you@example.com" {...field} className="border-muted bg-muted/30 focus:bg-background" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-sm">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Password <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl><Input type="password" placeholder="Min 8 characters" {...field} className="border-muted bg-muted/30 focus:bg-background" /></FormControl>
                        <FormDescription className="text-xs flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Minimum 8 characters for security
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="space-y-2 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 p-3">
                      <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Share2 className="h-3.5 w-3.5" /> Referral Code (optional)
                      </Label>
                      <Input
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="uppercase border-muted bg-background"
                      />
                      <p className="text-xs text-muted-foreground">Got a referral code from a friend? Enter it to earn bonus coins!</p>
                    </div>
                  </div>
                )}

                {/* STEP: Work Experience */}
                {stepType === "work" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Professional Background</span>
                    </div>

                    <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
                      <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        This step is optional — you can skip it if you have no prior experience. Add details to strengthen your profile!
                      </p>
                    </div>

                    <FormField control={form.control} name="education_background" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-sm">
                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" /> Education Background
                        </FormLabel>
                        <FormControl><Textarea placeholder="Institutions, degrees, certifications..." rows={2} {...field} className="border-muted bg-muted/30 focus:bg-background" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {workExperiences.map((w, i) => (
                      <div key={i} className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                              <Building2 className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <Label className="text-sm font-semibold">Experience {i + 1}</Label>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setWorkExperiences((prev) => prev.filter((_, j) => j !== i))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input placeholder="Company Name *" value={w.company_name} onChange={(e) => updateWorkExp(i, "company_name", e.target.value)} className="border-muted bg-muted/30" />
                        <Select value={w.company_type} onValueChange={(v) => updateWorkExp(i, "company_type", v)}>
                          <SelectTrigger className="border-muted bg-muted/30"><SelectValue placeholder="Company Type *" /></SelectTrigger>
                          <SelectContent>
                            {companyTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Textarea placeholder="Work description (optional)" rows={2} value={w.work_description} onChange={(e) => updateWorkExp(i, "work_description", e.target.value)} className="border-muted bg-muted/30" />
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={w.start_year} onValueChange={(v) => updateWorkExp(i, "start_year", v)}>
                            <SelectTrigger className="border-muted bg-muted/30"><SelectValue placeholder="Start Year *" /></SelectTrigger>
                            <SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                          </Select>
                          {!w.is_current && (
                            <Select value={w.end_year} onValueChange={(v) => updateWorkExp(i, "end_year", v)}>
                              <SelectTrigger className="border-muted bg-muted/30"><SelectValue placeholder="End Year *" /></SelectTrigger>
                              <SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={w.is_current} onCheckedChange={(c) => updateWorkExp(i, "is_current", !!c)} id={`current-${i}`} />
                          <Label htmlFor={`current-${i}`} className="text-sm">Currently working here</Label>
                        </div>
                        <div className="rounded-lg border border-dashed border-muted-foreground/20 p-3">
                          <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Upload className="h-3.5 w-3.5" /> Certificate (optional)
                          </Label>
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="mt-1.5 border-0 p-0 text-sm" onChange={(e) => updateWorkExp(i, "certificate_file", e.target.files?.[0] || null)} />
                        </div>
                      </div>
                    ))}

                    <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 border-dashed" onClick={() => setWorkExperiences((prev) => [...prev, emptyWorkExp()])}>
                      <Plus className="h-4 w-4" /> Add Work Experience
                    </Button>
                  </div>
                )}

                {/* STEP: Emergency Contact */}
                {stepType === "emergency" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                      <Heart className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Emergency Contacts</span>
                    </div>

                    <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                      <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                        Add at least one emergency contact. This information will be kept private and only used in critical situations.
                      </p>
                    </div>

                    {emergencyContacts.map((c, i) => (
                      <div key={i} className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
                              <Heart className="h-3.5 w-3.5 text-accent" />
                            </div>
                            <Label className="text-sm font-semibold">Contact {i + 1}</Label>
                          </div>
                          {emergencyContacts.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setEmergencyContacts((prev) => prev.filter((_, j) => j !== i))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input placeholder="Contact Name *" value={c.contact_name} onChange={(e) => updateContact(i, "contact_name", e.target.value)} className="border-muted bg-muted/30" />
                        <Input placeholder="10-digit Phone Number *" maxLength={10} value={c.contact_phone} onChange={(e) => updateContact(i, "contact_phone", e.target.value)} className="border-muted bg-muted/30" />
                        <Select value={c.relationship} onValueChange={(v) => updateContact(i, "relationship", v)}>
                          <SelectTrigger className="border-muted bg-muted/30"><SelectValue placeholder="Relationship *" /></SelectTrigger>
                          <SelectContent>
                            {relationships.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}

                    <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 border-dashed" onClick={() => setEmergencyContacts((prev) => [...prev, emptyContact()])}>
                      <Plus className="h-4 w-4" /> Add Another Contact
                    </Button>
                  </div>
                )}

                {/* STEP: Services */}
                {stepType === "services" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Your Services</span>
                    </div>

                    {categories.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 p-6 text-center">
                        <Wrench className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No service categories configured yet. You can update your services later from your profile.</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">Add the services you offer. Select a category, set your rates, and pick your skills.</p>

                        {services.map((s, i) => {
                          const categorySkills = allSkills.filter((sk) => sk.category_id === s.category_id);
                          return (
                            <div key={i} className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                    <Wrench className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                  <Label className="text-sm font-semibold">Service {i + 1}</Label>
                                </div>
                                {services.length > 1 && (
                                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setServices((prev) => prev.filter((_, j) => j !== i))}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <Select value={s.category_id} onValueChange={(v) => updateService(i, "category_id", v)}>
                                <SelectTrigger className="border-muted bg-muted/30"><SelectValue placeholder="Select Category *" /></SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <div>
                                <Input placeholder="Service Title *" value={s.service_title} onChange={(e) => updateService(i, "service_title", e.target.value)} className="border-muted bg-muted/30" />
                                <p className="mt-1 text-xs text-muted-foreground">e.g., Full Stack Development, Graphic Design</p>
                              </div>
                              {categorySkills.length > 0 && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Skills</Label>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {categorySkills.map((sk) => {
                                      const selected = s.skill_ids.includes(sk.id);
                                      return (
                                        <Badge
                                          key={sk.id}
                                          variant={selected ? "default" : "outline"}
                                          className={`cursor-pointer transition-all ${selected ? "shadow-sm" : "hover:border-primary/40"}`}
                                          onClick={() => {
                                            const newIds = selected ? s.skill_ids.filter((id) => id !== sk.id) : [...s.skill_ids, sk.id];
                                            updateService(i, "skill_ids", newIds);
                                          }}
                                        >
                                          {sk.name}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Hourly Rate (₹) *</Label>
                                  <Input type="number" min="0" placeholder="0" value={s.hourly_rate} onChange={(e) => updateService(i, "hourly_rate", e.target.value)} className="border-muted bg-muted/30" />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Min Budget (₹) *</Label>
                                  <Input type="number" min="0" placeholder="0" value={s.minimum_budget} onChange={(e) => updateService(i, "minimum_budget", e.target.value)} className="border-muted bg-muted/30" />
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 border-dashed" onClick={() => setServices((prev) => [...prev, emptyService()])}>
                          <Plus className="h-4 w-4" /> Add Another Service
                        </Button>
                      </>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="mt-4 space-y-3 pb-8">
              {step === stepConfig.length - 1 && (
                <div className="flex items-start space-x-2 rounded-lg border bg-card p-3 shadow-sm">
                  <Checkbox
                    id="reg-terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="reg-terms" className="text-xs leading-relaxed text-muted-foreground">
                    I agree to the{" "}
                    <Link to="/legal/terms-of-service" className="font-medium text-primary hover:underline" target="_blank">Terms of Service</Link>
                    {" "}and{" "}
                    <Link to="/legal/privacy-policy" className="font-medium text-primary hover:underline" target="_blank">Privacy Policy</Link>
                  </label>
                </div>
              )}

              <div className="flex gap-3">
                {step > 0 && (
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1 gap-1.5 shadow-sm">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                )}
                {step < stepConfig.length - 1 ? (
                  <Button type="button" onClick={handleNext} className="flex-1 gap-1.5 shadow-sm">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={submitting || !agreedToTerms} className="flex-1 gap-1.5 shadow-sm">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Submit Registration
                  </Button>
                )}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">Login here</Link>
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default RegistrationForm;
