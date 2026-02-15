import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, ArrowLeft, ArrowRight, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

const RegistrationForm = ({ userType }: RegistrationFormProps) => {
  const isEmployee = userType === "employee";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const stepLabels = ["Personal Info", "Contact Details", "Work Experience", "Emergency Contact", "Services"];

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceEntry[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactEntry[]>([emptyContact()]);
  const [services, setServices] = useState<ServiceEntry[]>([emptyService()]);
  const [arrayErrors, setArrayErrors] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState(() => searchParams.get("ref")?.toUpperCase() || "");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationProfileSchema),
    defaultValues: {
      full_name: "", gender: undefined, date_of_birth: "", marital_status: undefined,
      education_level: "", mobile_number: "", whatsapp_number: "", email: "", password: "",
      education_background: "",
    },
    mode: "onTouched",
  });

  // Fetch service categories and skills
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

  // Map step index to content type
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

    // Form field validation
    const fields = formFieldsForStep(step);
    if (fields.length > 0) {
      const valid = await form.trigger(fields as any);
      if (!valid) return false;
    }

    // Duplicate check after contact step
    if (type === "contact") {
      const values = form.getValues();
      try {
        const { data: dupes, error } = await supabase.rpc("check_registration_duplicates", {
          p_email: values.email,
          p_full_name: values.full_name.toUpperCase(),
          p_mobile: values.mobile_number,
          p_whatsapp: values.whatsapp_number,
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

    // Work experience validation (optional, but validate entries that exist)
    if (type === "work") {
      const errors: string[] = [];
      workExperiences.forEach((w, i) => {
        const err = validateWorkExperience(w);
        if (err) errors.push(`Experience ${i + 1}: ${err}`);
      });
      if (errors.length > 0) { setArrayErrors(errors); return false; }
    }

    // Emergency contact validation
    if (type === "emergency") {
      if (emergencyContacts.length === 0) { setArrayErrors(["At least one emergency contact is required"]); return false; }
      const errors: string[] = [];
      emergencyContacts.forEach((c, i) => {
        const err = validateEmergencyContact(c);
        if (err) errors.push(`Contact ${i + 1}: ${err}`);
      });
      if (errors.length > 0) { setArrayErrors(errors); return false; }
    }

    // Services validation
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
    if (valid) setStep((s) => Math.min(s + 1, stepLabels.length - 1));
  };

  const handleBack = () => { setStep((s) => Math.max(s - 1, 0)); setArrayErrors([]); };

  const onSubmit = async (data: RegistrationFormData) => {
    // Validate last step first
    const lastStepValid = await validateCurrentStep();
    if (!lastStepValid) return;

    setSubmitting(true);
    try {
      // Geo data
      let geoData: any = {};
      try {
        const geoRes = await fetch("https://ipapi.co/json/");
        if (geoRes.ok) {
          const g = await geoRes.json();
          geoData = { ip: g.ip, city: g.city, region: g.region, country: g.country_name, lat: g.latitude, lon: g.longitude };
        }
      } catch { /* non-critical */ }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert([{
        user_id: userId,
        user_type: userType,
        full_name: [data.full_name.toUpperCase()],
        user_code: [],
        email: data.email,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        marital_status: data.marital_status,
        education_level: data.education_level,
        mobile_number: data.mobile_number,
        whatsapp_number: data.whatsapp_number,
        education_background: data.education_background || null,
        referred_by: referralCode.trim() || null,
      } as any]);
      if (profileError) throw profileError;

      // The profile id = userId (default is auth.uid())
      const profileId = userId;

      // Store registration metadata in separate admin-only table
      await supabase.from("registration_metadata" as any).insert([{
        profile_id: profileId,
        ip_address: geoData.ip || null,
        city: geoData.city || null,
        region: geoData.region || null,
        country: geoData.country || null,
        latitude: geoData.lat || null,
        longitude: geoData.lon || null,
      }] as any);

      // Insert work experiences
      for (const w of workExperiences) {
        let certPath: string | null = null;
        let certName: string | null = null;
        if (w.certificate_file) {
          const ext = w.certificate_file.name.split(".").pop();
          const path = `${profileId}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("work-certificates")
            .upload(path, w.certificate_file);
          if (!uploadError) {
            certPath = path;
            certName = w.certificate_file.name;
          }
        }
        await supabase.from("work_experiences").insert({
          profile_id: profileId,
          company_name: w.company_name,
          company_type: w.company_type,
          work_description: w.work_description || null,
          start_year: Number(w.start_year),
          end_year: w.is_current ? null : Number(w.end_year),
          is_current: w.is_current,
          certificate_path: certPath,
          certificate_name: certName,
        });
      }

      // Insert emergency contacts
      for (const c of emergencyContacts) {
        await supabase.from("employee_emergency_contacts").insert({
          profile_id: profileId,
          contact_name: c.contact_name,
          contact_phone: c.contact_phone,
          relationship: c.relationship,
        });
      }

      // Insert services
      {
        for (const s of services) {
          if (!s.category_id || !s.service_title) continue;
          const { data: svcData } = await supabase.from("employee_services").insert({
            profile_id: profileId,
            category_id: s.category_id,
            service_title: s.service_title,
            hourly_rate: Number(s.hourly_rate) || 0,
            minimum_budget: Number(s.minimum_budget) || 0,
          }).select("id").single();

          if (svcData && s.skill_ids.length > 0) {
            const skillInserts = s.skill_ids.map((skillId) => ({
              employee_service_id: svcData.id,
              skill_id: skillId,
            }));
            await supabase.from("employee_skill_selections").insert(skillInserts);
          }
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

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{isEmployee ? "Employee" : "Client"} Registration</h1>
              <p className="text-xs text-muted-foreground">Step {step + 1} of {stepLabels.length} — {stepLabels[step]}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 flex gap-1.5">
          {stepLabels.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* Error messages for array validations */}
        {arrayErrors.length > 0 && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            {arrayErrors.map((e, i) => (
              <p key={i} className="text-sm text-destructive">{e}</p>
            ))}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{stepLabels[step]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* STEP: Personal Info */}
                {stepType === "personal" && (
                  <>
                    <FormField control={form.control} name="full_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className="uppercase"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Name will be stored in uppercase</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
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
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="marital_status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marital Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
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
                        <FormLabel>Education Level *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select education" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="high_school">High School</SelectItem>
                            <SelectItem value="diploma">Diploma</SelectItem>
                            <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                            <SelectItem value="masters">Master's Degree</SelectItem>
                            <SelectItem value="phd">PhD</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}

                {/* STEP: Contact Details */}
                {stepType === "contact" && (
                  <>
                    <FormField control={form.control} name="mobile_number" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number *</FormLabel>
                        <FormControl><Input placeholder="10-digit mobile number" maxLength={10} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="whatsapp_number" render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number *</FormLabel>
                        <FormControl><Input placeholder="10-digit WhatsApp number" maxLength={10} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl><Input type="password" placeholder="Min 8 characters" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="space-y-2">
                      <Label>Referral Code (optional)</Label>
                      <Input
                        placeholder="Enter referral code if you have one"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="uppercase"
                      />
                      <p className="text-xs text-muted-foreground">Got a referral code from a friend? Enter it here.</p>
                    </div>
                  </>
                )}

                {/* STEP: Work Experience (Employee only, optional) */}
                {stepType === "work" && (
                  <>
                    <p className="text-sm text-muted-foreground">Add your work experience below. This step is optional — you can skip if you have no prior experience.</p>
                    <FormField control={form.control} name="education_background" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education Background</FormLabel>
                        <FormControl><Textarea placeholder="Institutions, degrees, certifications..." rows={2} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {workExperiences.map((w, i) => (
                      <div key={i} className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Experience {i + 1}</Label>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setWorkExperiences((prev) => prev.filter((_, j) => j !== i))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input placeholder="Company Name *" value={w.company_name} onChange={(e) => updateWorkExp(i, "company_name", e.target.value)} />
                        <Select value={w.company_type} onValueChange={(v) => updateWorkExp(i, "company_type", v)}>
                          <SelectTrigger><SelectValue placeholder="Company Type *" /></SelectTrigger>
                          <SelectContent>
                            {companyTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Textarea placeholder="Work description (optional)" rows={2} value={w.work_description} onChange={(e) => updateWorkExp(i, "work_description", e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={w.start_year} onValueChange={(v) => updateWorkExp(i, "start_year", v)}>
                            <SelectTrigger><SelectValue placeholder="Start Year *" /></SelectTrigger>
                            <SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                          </Select>
                          {!w.is_current && (
                            <Select value={w.end_year} onValueChange={(v) => updateWorkExp(i, "end_year", v)}>
                              <SelectTrigger><SelectValue placeholder="End Year *" /></SelectTrigger>
                              <SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={w.is_current} onCheckedChange={(c) => updateWorkExp(i, "is_current", !!c)} id={`current-${i}`} />
                          <Label htmlFor={`current-${i}`} className="text-sm">Currently working here</Label>
                        </div>
                        <div>
                          <Label className="text-sm">Certificate (optional)</Label>
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="mt-1" onChange={(e) => updateWorkExp(i, "certificate_file", e.target.files?.[0] || null)} />
                        </div>
                      </div>
                    ))}

                    <Button type="button" variant="outline" size="sm" className="w-full gap-1" onClick={() => setWorkExperiences((prev) => [...prev, emptyWorkExp()])}>
                      <Plus className="h-4 w-4" /> Add Work Experience
                    </Button>
                  </>
                )}

                {/* STEP: Emergency Contact */}
                {stepType === "emergency" && (
                  <>
                    <p className="text-sm text-muted-foreground">Add at least one emergency contact. You can add more using the button below.</p>

                    {emergencyContacts.map((c, i) => (
                      <div key={i} className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Contact {i + 1}</Label>
                          {emergencyContacts.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setEmergencyContacts((prev) => prev.filter((_, j) => j !== i))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input placeholder="Contact Name *" value={c.contact_name} onChange={(e) => updateContact(i, "contact_name", e.target.value)} />
                        <Input placeholder="10-digit Phone Number *" maxLength={10} value={c.contact_phone} onChange={(e) => updateContact(i, "contact_phone", e.target.value)} />
                        <Select value={c.relationship} onValueChange={(v) => updateContact(i, "relationship", v)}>
                          <SelectTrigger><SelectValue placeholder="Relationship *" /></SelectTrigger>
                          <SelectContent>
                            {relationships.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}

                    <Button type="button" variant="outline" size="sm" className="w-full gap-1" onClick={() => setEmergencyContacts((prev) => [...prev, emptyContact()])}>
                      <Plus className="h-4 w-4" /> Add Another Contact
                    </Button>
                  </>
                )}

                {/* STEP: Services (Employee only) */}
                {stepType === "services" && (
                  <>
                    {categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No service categories have been configured yet. You can skip this step and update your services later.</p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">Add the services you offer. Select a category, provide a title, and set your rates.</p>

                        {services.map((s, i) => {
                          const categorySkills = allSkills.filter((sk) => sk.category_id === s.category_id);
                          return (
                            <div key={i} className="space-y-3 rounded-lg border p-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Service {i + 1}</Label>
                                {services.length > 1 && (
                                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setServices((prev) => prev.filter((_, j) => j !== i))}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <Select value={s.category_id} onValueChange={(v) => updateService(i, "category_id", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Category *" /></SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <div>
                                <Input placeholder="Service Title *" value={s.service_title} onChange={(e) => updateService(i, "service_title", e.target.value)} />
                                <p className="mt-1 text-xs text-muted-foreground">
                                  e.g., Full Stack Web Development, Graphic Design, Content Writing & SEO
                                </p>
                              </div>
                              {categorySkills.length > 0 && (
                                <div>
                                  <Label className="text-sm">Skills</Label>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {categorySkills.map((sk) => {
                                      const selected = s.skill_ids.includes(sk.id);
                                      return (
                                        <Badge
                                          key={sk.id}
                                          variant={selected ? "default" : "outline"}
                                          className="cursor-pointer"
                                          onClick={() => {
                                            const newIds = selected
                                              ? s.skill_ids.filter((id) => id !== sk.id)
                                              : [...s.skill_ids, sk.id];
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
                                  <Label className="text-xs">Hourly Rate (₹) *</Label>
                                  <Input type="number" min="0" placeholder="0" value={s.hourly_rate} onChange={(e) => updateService(i, "hourly_rate", e.target.value)} />
                                </div>
                                <div>
                                  <Label className="text-xs">Minimum Budget (₹) *</Label>
                                  <Input type="number" min="0" placeholder="0" value={s.minimum_budget} onChange={(e) => updateService(i, "minimum_budget", e.target.value)} />
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <Button type="button" variant="outline" size="sm" className="w-full gap-1" onClick={() => setServices((prev) => [...prev, emptyService()])}>
                          <Plus className="h-4 w-4" /> Add Another Service
                        </Button>
                      </>
                    )}
                  </>
                )}

              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="mt-4 flex gap-3">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1 gap-1">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              )}
              {step < stepLabels.length - 1 ? (
                <Button type="button" onClick={handleNext} className="flex-1 gap-1">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <div className="mt-2 flex items-start space-x-2 col-span-full w-full">
                    <Checkbox
                      id="reg-terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    />
                    <label htmlFor="reg-terms" className="text-xs leading-tight text-muted-foreground">
                      I agree to the{" "}
                      <Link to="/legal/terms-of-service" className="text-primary hover:underline" target="_blank">Terms of Service</Link>
                      {" "}and{" "}
                      <Link to="/legal/privacy-policy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>
                    </label>
                  </div>
                  <Button type="submit" disabled={submitting || !agreedToTerms} className="flex-1 gap-1">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Submit Registration
                  </Button>
                </>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Login here</Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default RegistrationForm;
