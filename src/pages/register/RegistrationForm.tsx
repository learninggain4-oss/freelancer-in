import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fullRegistrationSchema, type RegistrationFormData } from "@/lib/validations/registration";



interface RegistrationFormProps {
  userType: "employee" | "client";
}

const steps = [
  { title: "Personal Info", fields: ["full_name", "gender", "date_of_birth", "marital_status", "education_level"] },
  { title: "Contact Details", fields: ["mobile_number", "whatsapp_number", "email", "password"] },
  { title: "Professional", fields: ["previous_job_details", "work_experience", "education_background"] },
  { title: "Emergency Contact", fields: ["emergency_contact_name", "emergency_contact_phone", "emergency_contact_relationship"] },
];

const RegistrationForm = ({ userType }: RegistrationFormProps) => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(fullRegistrationSchema),
    defaultValues: {
      full_name: "", gender: undefined, date_of_birth: "", marital_status: undefined,
      education_level: "", mobile_number: "", whatsapp_number: "", email: "", password: "",
      previous_job_details: "", work_experience: "", education_background: "",
      emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: "",
    },
    mode: "onTouched",
  });

  const currentFields = steps[step].fields;

  const validateCurrentStep = async () => {
    const result = await form.trigger(currentFields as any);
    return result;
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1));
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

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      // 2. Create profile
      const { error: profileError } = await supabase.from("profiles").insert([{
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
        previous_job_details: data.previous_job_details || null,
        work_experience: data.work_experience || null,
        education_background: data.education_background || null,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        emergency_contact_relationship: data.emergency_contact_relationship,
        registration_ip: geoData.ip || null,
        registration_city: geoData.city || null,
        registration_region: geoData.region || null,
        registration_country: geoData.country || null,
        registration_latitude: geoData.lat || null,
        registration_longitude: geoData.lon || null,
      } as any]);

      if (profileError) throw profileError;

      toast({ title: "Registration successful!", description: "Your account is pending admin approval." });
      navigate("/verification-pending");
    } catch (error: any) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const isEmployee = userType === "employee";

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
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
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
                {/* Step 1: Personal Info */}
                {step === 0 && (
                  <>
                    <FormField control={form.control} name="full_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl><Input placeholder="Enter your full name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                          </FormControl>
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
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                          </FormControl>
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
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select education" /></SelectTrigger>
                          </FormControl>
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

                {/* Step 2: Contact Details */}
                {step === 1 && (
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
                        <FormControl><Input type="password" placeholder="Min 6 characters" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}

                {/* Step 3: Professional Background */}
                {step === 2 && (
                  <>
                    <FormField control={form.control} name="previous_job_details" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Job Details</FormLabel>
                        <FormControl><Textarea placeholder="Describe your previous roles..." rows={3} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="work_experience" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Experience</FormLabel>
                        <FormControl><Textarea placeholder="Years and areas of experience..." rows={3} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="education_background" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education Background</FormLabel>
                        <FormControl><Textarea placeholder="Institutions, degrees, certifications..." rows={3} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}

                {/* Step 4: Emergency Contact */}
                {step === 3 && (
                  <>
                    <FormField control={form.control} name="emergency_contact_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name *</FormLabel>
                        <FormControl><Input placeholder="Emergency contact name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="emergency_contact_phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone *</FormLabel>
                        <FormControl><Input placeholder="10-digit phone number" maxLength={10} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="emergency_contact_relationship" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                          </FormControl>
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
