import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, ArrowLeft, ArrowRight, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  employeeRegistrationSchema,
  clientRegistrationSchema,
  type RegistrationFormData,
} from "@/lib/validations/registration";

interface RegistrationFormProps {
  userType: "employee" | "client";
}

const EMPLOYEE_STEPS = [
  { title: "Personal Info", key: "personal" },
  { title: "Contact Details", key: "contact" },
  { title: "Professional", key: "professional" },
  { title: "Emergency Contact", key: "emergency" },
  { title: "Services", key: "services" },
];

const CLIENT_STEPS = [
  { title: "Personal Info", key: "personal" },
  { title: "Contact Details", key: "contact" },
  { title: "Emergency Contact", key: "emergency" },
];

const RegistrationForm = ({ userType }: RegistrationFormProps) => {
  const isEmployee = userType === "employee";
  const steps = isEmployee ? EMPLOYEE_STEPS : CLIENT_STEPS;
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [certificateFiles, setCertificateFiles] = useState<Record<number, File>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch service categories & skills for employee registration
  const { data: categories } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("service_categories").select("*").order("name");
      return data ?? [];
    },
    enabled: isEmployee,
  });

  const { data: allSkills } = useQuery({
    queryKey: ["service-skills"],
    queryFn: async () => {
      const { data } = await supabase.from("service_skills").select("*").order("name");
      return data ?? [];
    },
    enabled: isEmployee,
  });

  const defaultValues: any = {
    full_name: "", gender: undefined, date_of_birth: "", marital_status: undefined,
    education_level: "", mobile_number: "", whatsapp_number: "", email: "", password: "",
    education_background: "",
    work_experiences: [],
    emergency_contacts: [{ contact_name: "", contact_phone: "", relationship: "" }],
    services: isEmployee ? [{ service_title: "", category_id: "", skill_ids: [], hourly_rate: 0, minimum_budget: 0 }] : [],
  };

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(isEmployee ? employeeRegistrationSchema : clientRegistrationSchema),
    defaultValues,
    mode: "onTouched",
  });

  const workExpArray = useFieldArray({ control: form.control, name: "work_experiences" });
  const emergencyArray = useFieldArray({ control: form.control, name: "emergency_contacts" });
  const servicesArray = useFieldArray({ control: form.control, name: "services" });

  // Auto-capitalize full name
  const watchName = form.watch("full_name");
  useEffect(() => {
    if (watchName && watchName !== watchName.toUpperCase()) {
      form.setValue("full_name", watchName.toUpperCase(), { shouldValidate: false });
    }
  }, [watchName]);

  const validateCurrentStep = async () => {
    const currentKey = steps[step].key;
    let fieldsToValidate: string[] = [];
    if (currentKey === "personal") fieldsToValidate = ["full_name", "gender", "date_of_birth", "marital_status", "education_level"];
    else if (currentKey === "contact") fieldsToValidate = ["mobile_number", "whatsapp_number", "email", "password"];
    else if (currentKey === "professional") fieldsToValidate = ["education_background"];
    else if (currentKey === "emergency") fieldsToValidate = ["emergency_contacts"];
    else if (currentKey === "services") fieldsToValidate = ["services"];
    return form.trigger(fieldsToValidate as any);
  };

  const checkDuplicates = async () => {
    const { full_name, mobile_number, email, whatsapp_number } = form.getValues();
    // Check via edge function or direct query - using RPC not available, check auth email
    const { data: existingAuth } = await supabase.auth.signInWithPassword({ email, password: "___check___" });
    // If sign-in doesn't fail with "Invalid login credentials", the email exists
    // Actually, let's just try signUp and handle the error. We'll check profiles for mobile/whatsapp/name.
    // Since profiles RLS blocks reading other profiles, we'll check during signup and handle errors.
    return true; // Duplicate check will be handled server-side via unique constraints and signup error
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();
    if (valid) {
      // On contact step, check for duplicate email
      if (steps[step].key === "contact") {
        // We'll let Supabase auth handle email uniqueness
      }
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: RegistrationFormData) => {
    setSubmitting(true);
    try {
      // 0. Fetch IP & geolocation
      let geoData: { ip?: string; city?: string; region?: string; country?: string; lat?: number; lon?: number } = {};
      try {
        const geoRes = await fetch("https://ipapi.co/json/");
        if (geoRes.ok) {
          const g = await geoRes.json();
          geoData = { ip: g.ip, city: g.city, region: g.region, country: g.country_name, lat: g.latitude, lon: g.longitude };
        }
      } catch { /* non-critical */ }

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { emailRedirectTo: window.location.origin },
      });

      if (authError) {
        if (authError.message?.includes("already registered")) {
          throw new Error("This email is already registered. Please login instead.");
        }
        throw authError;
      }
      if (!authData.user) throw new Error("Registration failed");

      // 2. Create profile
      const { data: profileData, error: profileError } = await supabase.from("profiles").insert([{
        user_id: authData.user.id,
        user_type: userType,
        full_name: [data.full_name],
        user_code: [],
        email: data.email,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        marital_status: data.marital_status,
        education_level: data.education_level,
        mobile_number: data.mobile_number,
        whatsapp_number: data.whatsapp_number,
        education_background: data.education_background || null,
        emergency_contact_name: data.emergency_contacts[0]?.contact_name || null,
        emergency_contact_phone: data.emergency_contacts[0]?.contact_phone || null,
        emergency_contact_relationship: data.emergency_contacts[0]?.relationship || null,
        registration_ip: geoData.ip || null,
        registration_city: geoData.city || null,
        registration_region: geoData.region || null,
        registration_country: geoData.country || null,
        registration_latitude: geoData.lat || null,
        registration_longitude: geoData.lon || null,
      } as any]).select("id").single();

      if (profileError) throw profileError;
      const profileId = profileData.id;

      // 3. Insert emergency contacts
      if (data.emergency_contacts.length > 0) {
        const contacts = data.emergency_contacts.map((c) => ({
          profile_id: profileId,
          contact_name: c.contact_name,
          contact_phone: c.contact_phone,
          relationship: c.relationship,
        }));
        await supabase.from("employee_emergency_contacts").insert(contacts as any);
      }

      // 4. Insert work experiences (employee only)
      if (isEmployee && data.work_experiences && data.work_experiences.length > 0) {
        for (let i = 0; i < data.work_experiences.length; i++) {
          const we = data.work_experiences[i];
          let certPath: string | null = null;
          let certName: string | null = null;

          // Upload certificate if exists
          const certFile = certificateFiles[i];
          if (certFile) {
            const filePath = `${authData.user.id}/${Date.now()}_${certFile.name}`;
            const { error: uploadErr } = await supabase.storage
              .from("work-certificates")
              .upload(filePath, certFile);
            if (!uploadErr) {
              certPath = filePath;
              certName = certFile.name;
            }
          }

          await supabase.from("work_experiences").insert({
            profile_id: profileId,
            company_name: we.company_name,
            company_type: we.company_type,
            work_description: we.work_description || null,
            start_year: we.start_year,
            end_year: we.is_current ? null : (we.end_year || null),
            is_current: we.is_current,
            certificate_path: certPath,
            certificate_name: certName,
          } as any);
        }
      }

      // 5. Insert services (employee only)
      if (isEmployee && data.services && data.services.length > 0) {
        for (const svc of data.services) {
          const { data: svcData } = await supabase.from("employee_services").insert({
            profile_id: profileId,
            service_title: svc.service_title,
            category_id: svc.category_id,
            hourly_rate: svc.hourly_rate,
            minimum_budget: svc.minimum_budget,
          } as any).select("id").single();

          if (svcData && svc.skill_ids && svc.skill_ids.length > 0) {
            const skillInserts = svc.skill_ids.map((skillId: string) => ({
              employee_service_id: svcData.id,
              skill_id: skillId,
            }));
            await supabase.from("employee_skill_selections").insert(skillInserts as any);
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

  const currentKey = steps[step].key;

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {isEmployee ? "Employee" : "Client"} Registration
              </h1>
              <p className="text-xs text-muted-foreground">
                Step {step + 1} of {steps.length} — {steps[step].title}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{steps[step].title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Step: Personal Info */}
                {currentKey === "personal" && (
                  <>
                    <FormField control={form.control} name="full_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl><Input placeholder="ENTER YOUR FULL NAME" {...field} className="uppercase" /></FormControl>
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

                {/* Step: Contact Details */}
                {currentKey === "contact" && (
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
                  </>
                )}

                {/* Step: Professional (employee only) */}
                {currentKey === "professional" && (
                  <>
                    <FormField control={form.control} name="education_background" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education Background</FormLabel>
                        <FormControl><Textarea placeholder="Institutions, degrees, certifications..." rows={3} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Work Experience (Optional)</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => workExpArray.append({
                            company_name: "", company_type: "private", work_description: "",
                            start_year: new Date().getFullYear(), end_year: undefined, is_current: false,
                          })}
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </Button>
                      </div>

                      {workExpArray.fields.map((field, idx) => (
                        <Card key={field.id} className="border-dashed">
                          <CardContent className="space-y-3 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">Experience #{idx + 1}</span>
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                workExpArray.remove(idx);
                                const newFiles = { ...certificateFiles };
                                delete newFiles[idx];
                                setCertificateFiles(newFiles);
                              }}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>

                            <FormField control={form.control} name={`work_experiences.${idx}.company_name`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name *</FormLabel>
                                <FormControl><Input placeholder="e.g. Tata Consultancy Services" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />

                            <FormField control={form.control} name={`work_experiences.${idx}.company_type`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Type *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="government">Government</SelectItem>
                                    <SelectItem value="ngo">NGO</SelectItem>
                                    <SelectItem value="freelance">Freelance</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )} />

                            <FormField control={form.control} name={`work_experiences.${idx}.work_description`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Work Description</FormLabel>
                                <FormControl><Textarea placeholder="Role, responsibilities..." rows={2} {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />

                            <div className="grid grid-cols-2 gap-3">
                              <FormField control={form.control} name={`work_experiences.${idx}.start_year`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Year *</FormLabel>
                                  <FormControl><Input type="number" min={1970} max={new Date().getFullYear()} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />

                              {!form.watch(`work_experiences.${idx}.is_current`) && (
                                <FormField control={form.control} name={`work_experiences.${idx}.end_year`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Year</FormLabel>
                                    <FormControl><Input type="number" min={1970} max={new Date().getFullYear()} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)} value={field.value ?? ""} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              )}
                            </div>

                            <FormField control={form.control} name={`work_experiences.${idx}.is_current`} render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="font-normal">Currently working here</FormLabel>
                              </FormItem>
                            )} />

                            <div>
                              <p className="mb-1 text-sm font-medium">Certificate Upload</p>
                              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-2 text-xs text-muted-foreground hover:border-primary">
                                <Upload className="h-3.5 w-3.5" />
                                {certificateFiles[idx] ? certificateFiles[idx].name : "Upload certificate (PDF/Image)"}
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setCertificateFiles({ ...certificateFiles, [idx]: file });
                                  }}
                                />
                              </label>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                {/* Step: Emergency Contacts */}
                {currentKey === "emergency" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Emergency Contacts *</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => emergencyArray.append({ contact_name: "", contact_phone: "", relationship: "" })}
                        className="gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    </div>

                    {emergencyArray.fields.map((field, idx) => (
                      <Card key={field.id} className="border-dashed">
                        <CardContent className="space-y-3 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Contact #{idx + 1}</span>
                            {idx > 0 && (
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => emergencyArray.remove(idx)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>

                          <FormField control={form.control} name={`emergency_contacts.${idx}.contact_name`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Name *</FormLabel>
                              <FormControl><Input placeholder="Emergency contact name" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`emergency_contacts.${idx}.contact_phone`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone *</FormLabel>
                              <FormControl><Input placeholder="10-digit phone number" maxLength={10} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`emergency_contacts.${idx}.relationship`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="parent">Parent</SelectItem>
                                  <SelectItem value="spouse">Spouse</SelectItem>
                                  <SelectItem value="sibling">Sibling</SelectItem>
                                  <SelectItem value="friend">Friend</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Step: Services (employee only) */}
                {currentKey === "services" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Your Services *</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => servicesArray.append({ service_title: "", category_id: "", skill_ids: [], hourly_rate: 0, minimum_budget: 0 })}
                        className="gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    </div>

                    {servicesArray.fields.map((field, idx) => {
                      const selectedCatId = form.watch(`services.${idx}.category_id`);
                      const catSkills = allSkills?.filter((s: any) => s.category_id === selectedCatId) ?? [];

                      return (
                        <Card key={field.id} className="border-dashed">
                          <CardContent className="space-y-3 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">Service #{idx + 1}</span>
                              {idx > 0 && (
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => servicesArray.remove(idx)}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </div>

                            <FormField control={form.control} name={`services.${idx}.service_title`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Service Title *</FormLabel>
                                <FormControl><Input placeholder="e.g. Web Development, Graphic Design" {...field} /></FormControl>
                                <FormDescription className="text-xs">Example: "Full Stack Web Development", "Logo & Brand Design"</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )} />

                            <FormField control={form.control} name={`services.${idx}.category_id`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Service Category *</FormLabel>
                                <Select onValueChange={(val) => {
                                  field.onChange(val);
                                  form.setValue(`services.${idx}.skill_ids`, []);
                                }} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    {categories?.map((cat: any) => (
                                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {(!categories || categories.length === 0) && (
                                  <p className="text-xs text-warning">No categories available yet. Admin needs to create them first.</p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )} />

                            {catSkills.length > 0 && (
                              <FormField control={form.control} name={`services.${idx}.skill_ids`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Skills</FormLabel>
                                  <div className="flex flex-wrap gap-2">
                                    {catSkills.map((skill: any) => {
                                      const isSelected = (field.value || []).includes(skill.id);
                                      return (
                                        <button
                                          key={skill.id}
                                          type="button"
                                          onClick={() => {
                                            const current = field.value || [];
                                            field.onChange(
                                              isSelected ? current.filter((id: string) => id !== skill.id) : [...current, skill.id]
                                            );
                                          }}
                                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                                            isSelected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                                          }`}
                                        >
                                          {skill.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              <FormField control={form.control} name={`services.${idx}.hourly_rate`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Hourly Rate (₹) *</FormLabel>
                                  <FormControl><Input type="number" min={0} placeholder="500" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />

                              <FormField control={form.control} name={`services.${idx}.minimum_budget`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Min Budget (₹) *</FormLabel>
                                  <FormControl><Input type="number" min={0} placeholder="5000" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
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
              {step < steps.length - 1 ? (
                <Button type="button" onClick={handleNext} className="flex-1 gap-1">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={submitting} className="flex-1 gap-1">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit Registration
                </Button>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Login here
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default RegistrationForm;
