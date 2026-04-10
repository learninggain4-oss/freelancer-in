import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase, ArrowLeft, ArrowRight, Loader2, Plus, Trash2,
  User, Phone, Building2, Heart, Wrench, CheckCircle2, Shield,
  GraduationCap, Calendar, Mail, Lock, Share2, Upload, FileText,
  Sparkles, Check, Factory, IndianRupee, MapPin, Tag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  registrationProfileSchema, type RegistrationFormData,
  type WorkExperienceEntry, type EmergencyContactEntry, type ServiceEntry,
  validateWorkExperience, validateEmergencyContact, validateService,
} from "@/lib/validations/registration";
import { AUTH_CSS, A1, A2 } from "@/components/layout/AuthPageShell";

/* ─── Page-level CSS for dark theme overrides ─── */
const REG_CSS = `
${AUTH_CSS}
.reg-input { background:rgba(255,255,255,.06) !important; border:1px solid rgba(255,255,255,.1) !important; color:white !important; border-radius:10px !important; }
.reg-input::placeholder { color:rgba(255,255,255,.25) !important; }
.reg-input:focus { border-color:#6366f1 !important; outline:none !important; }
.reg-select [data-radix-select-trigger] { background:rgba(255,255,255,.06) !important; border:1px solid rgba(255,255,255,.1) !important; color:white !important; border-radius:10px !important; }
.reg-textarea { background:rgba(255,255,255,.06) !important; border:1px solid rgba(255,255,255,.1) !important; color:white !important; border-radius:10px !important; resize:vertical; }
.reg-textarea::placeholder { color:rgba(255,255,255,.25) !important; }
.reg-section-badge { background:rgba(99,102,241,.12); border:1px solid rgba(99,102,241,.25); border-radius:10px; padding:8px 14px; display:flex; align-items:center; gap:8px; margin-bottom:16px; }
.reg-info-box { background:rgba(99,102,241,.08); border:1px solid rgba(99,102,241,.15); border-radius:10px; padding:12px 14px; }
.reg-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:18px; margin-bottom:14px; }
.reg-add-btn { width:100%; padding:10px; border-radius:10px; border:1px dashed rgba(99,102,241,.35); background:rgba(99,102,241,.06); color:#6366f1; font-weight:600; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all .2s; }
.reg-add-btn:hover { background:rgba(99,102,241,.14); border-color:rgba(99,102,241,.6); }
.step-dot-active { background:linear-gradient(135deg,#6366f1,#8b5cf6); box-shadow:0 0 16px rgba(99,102,241,.5); }
.step-dot-done { background:rgba(34,197,94,.25); border:2px solid rgba(34,197,94,.5) !important; }
.step-dot-pending { background:rgba(255,255,255,.04); }
`;

interface RegistrationFormProps { userType: "employee" | "employer"; }

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1969 }, (_, i) => String(currentYear - i));

const companyTypes = [
  { value: "private", label: "Private" }, { value: "public", label: "Public" },
  { value: "government", label: "Government" }, { value: "ngo", label: "NGO" },
  { value: "startup", label: "Startup" }, { value: "freelance", label: "Freelance" },
  { value: "other", label: "Other" },
];
const relationships = [
  { value: "parent", label: "Parent" }, { value: "spouse", label: "Spouse" },
  { value: "sibling", label: "Sibling" }, { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

const emptyWorkExp = (): WorkExperienceEntry => ({ company_name: "", company_type: "", work_description: "", start_year: "", end_year: "", is_current: false, certificate_file: null });
const emptyContact = (): EmergencyContactEntry => ({ contact_name: "", contact_phone: "", relationship: "" });
const emptyService = (): ServiceEntry => ({ category_id: "", service_title: "", hourly_rate: "", minimum_budget: "", skill_ids: [] });

const freelancerStepConfig = [
  { label: "Personal Info",    icon: User,      description: "Tell us about yourself",    color: A1 },
  { label: "Contact Details",  icon: Phone,     description: "How can we reach you?",      color: "#0ea5e9" },
  { label: "Work Experience",  icon: Building2, description: "Your professional journey",  color: "#22c55e" },
  { label: "Emergency Contact",icon: Heart,     description: "Who should we contact?",     color: "#f43f5e" },
  { label: "Services",         icon: Wrench,    description: "What do you offer?",         color: "#f59e0b" },
];

const employerStepConfig = [
  { label: "Personal Info",    icon: User,      description: "Tell us about yourself",    color: A1 },
  { label: "Contact Details",  icon: Phone,     description: "How can we reach you?",      color: "#0ea5e9" },
  { label: "Business Info",    icon: Factory,   description: "About your company",         color: "#f59e0b" },
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
  "Puducherry","Chandigarh","Andaman & Nicobar Islands","Lakshadweep",
  "Dadra & Nagar Haveli and Daman & Diu",
];

const INDUSTRY_SECTORS = [
  "Information Technology","Finance & Banking","Healthcare","Education","Manufacturing",
  "Retail & E-commerce","Construction & Real Estate","Hospitality & Tourism","Media & Entertainment",
  "Logistics & Supply Chain","Agriculture","Legal Services","Marketing & Advertising","Other",
];

const BUSINESS_TYPES = [
  "Sole Proprietorship","Partnership Firm","LLP","Private Limited (Pvt. Ltd.)",
  "Public Limited (Ltd.)","OPC (One Person Company)","NGO / Trust","Startup","Other",
];

/* Shared input style prop */
const inp: React.CSSProperties = { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "white", borderRadius: 10 };

const RegistrationForm = ({ userType }: RegistrationFormProps) => {
  const isFreelancer = userType === "employee";
  const stepConfig = isFreelancer ? freelancerStepConfig : employerStepConfig;
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
  const [employerBiz, setEmployerBiz] = useState({
    company_name: "", business_type: "", industry_sector: "",
    gst_number: "", business_description: "",
    typical_budget_min: "", typical_budget_max: "",
    preferred_categories: [] as string[], city: "", state: "",
  });
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [countdownUnits, setCountdownUnits] = useState(300);
  const [showSuccess, setShowSuccess] = useState(false);
  const [redirectSec, setRedirectSec] = useState(30);

  useEffect(() => {
    if (!submitted || showSuccess) return;
    if (countdownUnits <= 0) { setShowSuccess(true); return; }
    const t = setTimeout(() => setCountdownUnits(s => s - 1), 600);
    return () => clearTimeout(t);
  }, [submitted, countdownUnits, showSuccess]);

  useEffect(() => {
    if (!showSuccess) return;
    if (redirectSec <= 0) { navigate("/login"); return; }
    const t = setTimeout(() => setRedirectSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [showSuccess, redirectSec, navigate]);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationProfileSchema),
    defaultValues: { full_name: "", gender: undefined, date_of_birth: "", marital_status: undefined, education_level: "", mobile_number: "", whatsapp_number: "", email: "", password: "", education_background: "" },
    mode: "onTouched",
  });

  const { data: categories = [] } = useQuery({ queryKey: ["service-categories"], queryFn: async () => { const { data } = await supabase.from("service_categories").select("*").order("name"); return data || []; } });
  const { data: allSkills = [] } = useQuery({ queryKey: ["service-skills"], queryFn: async () => { const { data } = await supabase.from("service_skills").select("*").order("name"); return data || []; } });

  const getStepType = (s: number) => {
    if (!isFreelancer) return (["personal","contact","business"] as const)[s] ?? "personal";
    return (["personal","contact","work","emergency","services"] as const)[s] ?? "personal";
  };

  const formFieldsForStep = (s: number): string[] => {
    if (s === 0) return ["full_name","gender","date_of_birth","marital_status","education_level"];
    if (s === 1) return ["mobile_number","whatsapp_number","email","password"];
    return [];
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    const type = getStepType(step); setArrayErrors([]);
    const fields = formFieldsForStep(step);
    if (fields.length > 0) { const valid = await form.trigger(fields as any); if (!valid) return false; }
    if (type === "work") {
      const errors: string[] = [];
      workExperiences.forEach((w, i) => { const e = validateWorkExperience(w); if (e) errors.push(`Experience ${i+1}: ${e}`); });
      if (errors.length) { setArrayErrors(errors); return false; }
    }
    if (type === "emergency") {
      if (!emergencyContacts.length) { setArrayErrors(["At least one emergency contact is required"]); return false; }
      const errors: string[] = [];
      emergencyContacts.forEach((c, i) => { const e = validateEmergencyContact(c); if (e) errors.push(`Contact ${i+1}: ${e}`); });
      if (errors.length) { setArrayErrors(errors); return false; }
    }
    if (type === "services" && categories.length > 0 && services.length > 0) {
      const errors: string[] = [];
      services.forEach((s, i) => { const e = validateService(s); if (e) errors.push(`Service ${i+1}: ${e}`); });
      if (errors.length) { setArrayErrors(errors); return false; }
    }
    return true;
  };

  const skippableSteps = ["work", "emergency", "services"];
  const isSkippable = skippableSteps.includes(getStepType(step));

  const handleNext = async () => {
    const valid = await validateCurrentStep();
    if (valid) { setCompletedSteps(p => new Set([...p, step])); setStep(s => Math.min(s+1, stepConfig.length-1)); }
  };
  const handleSkip = () => { setArrayErrors([]); setStep(s => Math.min(s+1, stepConfig.length-1)); };
  const handleBack = () => { setStep(s => Math.max(s-1, 0)); setArrayErrors([]); };

  const onSubmit = async (data: RegistrationFormData) => {
    const lastValid = await validateCurrentStep(); if (!lastValid) return;
    setSubmitting(true);
    try {
      let geoData: any = {};
      try { const r = await fetch("https://ipapi.co/json/"); if (r.ok) { const g = await r.json(); geoData = { ip: g.ip, city: g.city, region: g.region, country: g.country_name, lat: g.latitude, lon: g.longitude }; } } catch {}

      const uType = userType === "employer" ? "client" : "employee";

      // Helper: create profile directly after getting userId (works for both new and duplicate email)
      const insertProfileAndRelated = async (userId: string, supabaseClient: typeof supabase) => {
        const newProfileId = crypto.randomUUID();
        const { data: profileData, error: profileError } = await supabaseClient.from("profiles").insert([{
          id: newProfileId, user_id: userId, user_type: uType,
          full_name: [data.full_name.toUpperCase()], user_code: [], email: data.email,
          gender: data.gender, date_of_birth: data.date_of_birth,
          marital_status: data.marital_status, education_level: data.education_level,
          mobile_number: data.mobile_number, whatsapp_number: data.whatsapp_number,
          education_background: data.education_background || null,
          referred_by: referralCode.trim() || null, approval_status: "approved",
        } as any]).select("id").single();
        if (profileError) throw profileError;
        return (profileData as any)?.id || newProfileId;
      };

      // Helper: register via server API (fallback when can't sign in with existing account)
      const registerViaServer = async () => {
        const payload = {
          email: data.email, user_type: uType, full_name: data.full_name,
          gender: data.gender, date_of_birth: data.date_of_birth,
          marital_status: data.marital_status, education_level: data.education_level,
          mobile_number: data.mobile_number, whatsapp_number: data.whatsapp_number,
          education_background: data.education_background || null,
          referred_by: referralCode.trim() || null, approval_status: "approved",
          geo: geoData,
          employer_biz: uType === "client" ? employerBiz : undefined,
          work_experiences: workExperiences.filter(w => w.company_name.trim()).map(w => ({
            company_name: w.company_name, company_type: w.company_type,
            work_description: w.work_description || null, start_year: w.start_year,
            end_year: w.is_current ? null : w.end_year, is_current: w.is_current,
          })),
          emergency_contacts: emergencyContacts.filter(c => c.contact_name.trim()),
          services: services.filter(s => s.category_id && s.service_title).map(s => ({
            category_id: s.category_id, service_title: s.service_title,
            hourly_rate: s.hourly_rate, minimum_budget: s.minimum_budget,
            skill_ids: s.skill_ids,
          })),
        };
        const res = await fetch("/functions/v1/public-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        let result: any = {};
        try { result = JSON.parse(text); } catch { throw new Error("Registration failed. Please try again."); }
        if (!res.ok) throw new Error(result.error || "Registration failed");
        return result.profile_id as string;
      };

      // Helper: insert all related data after profile is created
      const insertRelatedData = async (profileId: string, supabaseClient: typeof supabase) => {
        try { await supabaseClient.from("registration_metadata" as any).insert([{ profile_id: profileId, ip_address: geoData.ip||null, city: geoData.city||null, region: geoData.region||null, country: geoData.country||null, latitude: geoData.lat||null, longitude: geoData.lon||null }] as any); } catch {}
        if (uType === "client") {
          try {
            await supabaseClient.from("employer_profiles" as any).insert([{
              profile_id: profileId,
              company_name: employerBiz.company_name || null,
              business_type: employerBiz.business_type || null,
              industry_sector: employerBiz.industry_sector || null,
              gst_number: employerBiz.gst_number || null,
              business_description: employerBiz.business_description || null,
              typical_budget_min: employerBiz.typical_budget_min ? Number(employerBiz.typical_budget_min) : null,
              typical_budget_max: employerBiz.typical_budget_max ? Number(employerBiz.typical_budget_max) : null,
              preferred_categories: employerBiz.preferred_categories.length ? employerBiz.preferred_categories : null,
              city: employerBiz.city || null, state: employerBiz.state || null,
            }] as any);
          } catch (e) { console.warn("Employer profile save deferred:", e); }
        }
        for (const w of workExperiences.filter(w => w.company_name.trim())) {
          let certPath: string | null = null, certName: string | null = null;
          if (w.certificate_file) { const ext = w.certificate_file.name.split(".").pop(); const fpath = `${profileId}/${crypto.randomUUID()}.${ext}`; const { error: ue } = await supabaseClient.storage.from("work-certificates").upload(fpath, w.certificate_file); if (!ue) { certPath = fpath; certName = w.certificate_file.name; } }
          try { await supabaseClient.from("work_experiences").insert({ profile_id: profileId, company_name: w.company_name, company_type: w.company_type, work_description: w.work_description||null, start_year: Number(w.start_year), end_year: w.is_current ? null : Number(w.end_year), is_current: w.is_current, certificate_path: certPath, certificate_name: certName }); } catch {}
        }
        for (const c of emergencyContacts.filter(c => c.contact_name.trim())) {
          try { await supabaseClient.from("employee_emergency_contacts").insert({ profile_id: profileId, contact_name: c.contact_name, contact_phone: c.contact_phone, relationship: c.relationship }); } catch {}
        }
        for (const s of services) {
          if (!s.category_id || !s.service_title) continue;
          try {
            const { data: svcData } = await supabaseClient.from("employee_services").insert({ profile_id: profileId, category_id: s.category_id, service_title: s.service_title, hourly_rate: Number(s.hourly_rate)||0, minimum_budget: Number(s.minimum_budget)||0 }).select("id").single();
            if (svcData && s.skill_ids.length > 0) { try { await supabaseClient.from("employee_skill_selections").insert(s.skill_ids.map((skillId: string) => ({ employee_service_id: svcData.id, skill_id: skillId }))); } catch {} }
          } catch {}
        }
      };

      // Helper: handle duplicate email — sign in with same password → create new profile
      const handleDuplicateEmail = async () => {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: data.email, password: data.password,
        });
        if (signInErr || !signInData?.user) {
          // Wrong password or can't sign in → use server-side admin path
          await registerViaServer();
          return;
        }
        // Signed in successfully — create new profile with active session
        const userId = signInData.user.id;
        const profileId = await insertProfileAndRelated(userId, supabase);
        await insertRelatedData(profileId, supabase);
      };

      const { data: authData, error: authError } = await supabase.auth.signUp({ email: data.email, password: data.password, options: { emailRedirectTo: window.location.origin } });

      // Detect duplicate email
      const isEmailTaken = authError?.message?.toLowerCase().includes("already") ||
                           authError?.message?.toLowerCase().includes("registered") ||
                           authError?.message?.toLowerCase().includes("exists") ||
                           (!authError && !authData?.user);
      if (isEmailTaken) {
        await handleDuplicateEmail();
        setSubmitted(true);
        return;
      }

      if (authError) throw authError;
      if (!authData?.user) { setSubmitted(true); return; } // email confirmation pending
      // New user — insert profile then all related data
      const userId = authData.user.id;
      const profileId = await insertProfileAndRelated(userId, supabase);
      await insertRelatedData(profileId, supabase);
      setSubmitted(true);
    } catch (error: any) {
      const msg: string = error?.message || "";
      const friendlyMsg = msg.includes("invalid input value for enum")
        ? "Account type error — please contact support."
        : msg || "Something went wrong. Please try again.";
      toast({ title: "Registration failed", description: friendlyMsg, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const updateWorkExp = (i: number, f: keyof WorkExperienceEntry, v: any) => setWorkExperiences(p => p.map((w, j) => j === i ? { ...w, [f]: v } : w));
  const updateContact = (i: number, f: keyof EmergencyContactEntry, v: string) => setEmergencyContacts(p => p.map((c, j) => j === i ? { ...c, [f]: v } : c));
  const updateService = (i: number, f: keyof ServiceEntry, v: any) => setServices(p => p.map((s, j) => j === i ? { ...s, [f]: v } : s));

  const stepType = getStepType(step);
  const progressPercent = ((step + 1) / stepConfig.length) * 100;
  const StepIcon = stepConfig[step].icon;
  const stepColor = stepConfig[step].color;

  const cMins = Math.floor(countdownUnits / 100);
  const cSecs = countdownUnits % 100;
  const cProgress = ((300 - countdownUnits) / 300) * 100;

  const REG_STEPS = [
    { label: "Registration Started",        emoji: "🚀", threshold: 270, tickAt: "2m:70s" },
    { label: "Basic Details Submitted",     emoji: "📋", threshold: 240, tickAt: "2m:40s" },
    { label: "Email Verification",          emoji: "📧", threshold: 200, tickAt: "2m:00s" },
    { label: "Mobile Verification",         emoji: "📱", threshold: 170, tickAt: "1m:70s" },
    { label: "Username & Profile Setup",    emoji: "👤", threshold: 140, tickAt: "1m:40s" },
    { label: "Terms & Conditions",          emoji: "📜", threshold: 100, tickAt: "1m:00s" },
    { label: "Profile Completeness Check",  emoji: "🔍", threshold: 80,  tickAt: "0m:80s" },
    { label: "Security / Fraud Check",      emoji: "🛡️", threshold: 70,  tickAt: "0m:70s" },
    { label: "Account Status Processing",   emoji: "⚙️", threshold: 40,  tickAt: "0m:40s" },
    { label: "Wallet Account Activated",    emoji: "💳", threshold: 10,  tickAt: "0m:10s" },
  ];
  const activeIdx = REG_STEPS.findIndex(s => countdownUnits > s.threshold);
  const stepsDoneCount = REG_STEPS.filter(s => countdownUnits <= s.threshold).length;
  const isAllDone = stepsDoneCount === REG_STEPS.length;
  const CONFETTI_COLORS = ["#6366f1","#22c55e","#f59e0b","#ec4899","#818cf8","#38bdf8","#a78bfa"];
  const CONFETTI_LEFT = [4,9,15,22,29,36,43,50,57,63,69,75,81,87,92,96,12,34,56,78,25,47,65,83];

  if (submitted) return (
    <div style={{ background: "linear-gradient(160deg,#0a0e1a 0%,#0f1629 40%,#0d1220 100%)", color: "white", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)}50%{box-shadow:0 0 0 14px rgba(99,102,241,0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes checkBounce{0%{transform:scale(0) rotate(-45deg);opacity:0}60%{transform:scale(1.25) rotate(5deg);opacity:1}80%{transform:scale(0.9)}100%{transform:scale(1) rotate(0deg);opacity:1}}
        @keyframes stepSlideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes activeGlow{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.5)}50%{box-shadow:0 0 0 6px rgba(99,102,241,0.0)}}
        @keyframes dotPulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
        @keyframes ringRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes doneRowGlow{from{background:rgba(34,197,94,0.18)}to{background:rgba(34,197,94,0.07)}}
        @keyframes rowCollapse{0%{opacity:1;max-height:60px;padding-top:9px;padding-bottom:9px;margin-bottom:0}60%{opacity:1}85%{opacity:0;max-height:60px;padding-top:9px;padding-bottom:9px}100%{opacity:0;max-height:0;padding-top:0;padding-bottom:0;margin-bottom:-6px}}
        @keyframes digitFlip{0%{transform:translateY(-60%);opacity:0}60%{transform:translateY(8%)}100%{transform:translateY(0);opacity:1}}
        @keyframes cardBorderFlash{0%{opacity:0}15%{opacity:1}100%{opacity:0}}
        @keyframes particleFloat{0%{transform:translateY(0) scale(1);opacity:0.7}50%{opacity:0.35}100%{transform:translateY(-110px) scale(0.5);opacity:0}}
        @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(800deg);opacity:0}}
        @keyframes stepBadgeFlip{0%{transform:translateY(-10px) scale(0.8);opacity:0}70%{transform:translateY(2px) scale(1.05)}100%{transform:translateY(0) scale(1);opacity:1}}
        @keyframes textReveal{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0% 0 0)}}
        @keyframes celebPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.6),0 0 40px rgba(34,197,94,0.2)}50%{box-shadow:0 0 0 18px rgba(34,197,94,0),0 0 60px rgba(34,197,94,0.35)}}
      `}</style>

      {/* Confetti burst when all steps done */}
      {isAllDone && !showSuccess && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
          {CONFETTI_LEFT.map((left, i) => (
            <div key={i} style={{
              position: "absolute", top: "-12px", left: `${left}%`,
              width: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
              height: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
              borderRadius: i % 4 === 0 ? "50%" : i % 4 === 1 ? 2 : "1px",
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animation: `confettiFall ${1.4 + (i % 5) * 0.25}s cubic-bezier(.2,.8,.4,1) forwards ${i * 0.07}s`
            }} />
          ))}
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 440, animation: "fadeUp .5s ease both" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Briefcase size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: "white" }}>Freelancer<span style={{ color: "#6366f1" }}>.</span>in</span>
          </div>
        </div>

        {showSuccess ? (
          /* ── SUCCESS SCREEN ── */
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 24, padding: "40px 28px", textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "pulse 2s ease-in-out infinite", boxShadow: "0 0 40px rgba(34,197,94,0.2)" }}>
              <CheckCircle2 size={38} color="#22c55e" />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>Registration Successful!</h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
              Your {isFreelancer ? "Freelancer" : "Employer"} account has been created and activated. Welcome aboard!
            </p>
            <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: 20 }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0 }}>
                Redirecting to Login in{" "}
                <strong style={{ color: "#818cf8", fontSize: 16 }}>{redirectSec}</strong> seconds…
              </p>
            </div>
            <button
              onClick={() => navigate("/login")}
              style={{ width: "100%", padding: "13px", borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}
            >
              Go to Login Now
            </button>
          </div>
        ) : (
          /* ── COUNTDOWN SCREEN ── */
          <div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "28px 24px", marginBottom: 12, position: "relative", overflow: "hidden" }}>

              {/* Floating background particles */}
              {[0,1,2,3,4,5,6,7].map(i => (
                <div key={i} style={{ position: "absolute", bottom: "-8px", left: `${8 + i * 11}%`, width: i%2===0?4:3, height: i%2===0?4:3, borderRadius: "50%",
                  background: i%3===0?"rgba(99,102,241,0.55)":i%3===1?"rgba(139,92,246,0.45)":"rgba(34,197,94,0.45)",
                  animation: `particleFloat ${3.2 + i*0.65}s ease-in-out infinite ${i*0.45}s`, pointerEvents: "none" }} />
              ))}

              {/* Card border flash on step change */}
              <div key={`flash-${activeIdx}`} style={{ position: "absolute", inset: 0, borderRadius: 24, border: "1.5px solid rgba(99,102,241,0.75)",
                animation: "cardBorderFlash 1.1s ease forwards", pointerEvents: "none", zIndex: 2 }} />

              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: 24, position: "relative", zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(99,102,241,0.15)", border: "2px solid rgba(99,102,241,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", animation: "pulse 3s ease-in-out infinite" }}>
                  <Loader2 size={28} color="#818cf8" style={{ animation: "spin 2s linear infinite" }} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: "0 0 6px" }}>Processing Registration…</h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0 }}>Please stay on this page. Do not close the browser.</p>
              </div>

              {/* Timer with digit flip */}
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", textAlign: "center", margin: "0 0 14px" }}>Time Remaining</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
                {[{ val: cMins, label: "MIN" }, { val: cSecs, label: "SEC" }].map(({ val, label }, i) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 16, padding: "14px 0", width: 90, textAlign: "center", boxShadow: "0 4px 20px rgba(99,102,241,0.35),inset 0 1px 0 rgba(255,255,255,0.15)", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)", backgroundSize: "200% 100%", animation: "shimmer 2s infinite" }} />
                      <p key={`${label}-${val}`} style={{ fontSize: 36, fontWeight: 900, color: "#ffffff", fontFamily: "Inter,monospace", lineHeight: 1, margin: 0, letterSpacing: "-1px", textShadow: "0 1px 4px rgba(0,0,0,0.3)", position: "relative", animation: "digitFlip 0.25s ease both" }}>
                        {String(val).padStart(2, "0")}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, margin: "4px 0 0", position: "relative" }}>{label}</p>
                    </div>
                    {i === 0 && <p style={{ color: "#6366f1", fontWeight: 900, fontSize: 28, lineHeight: 1, margin: 0, textShadow: "0 0 12px rgba(99,102,241,0.5)" }}>:</p>}
                  </div>
                ))}
              </div>

              {/* Step progress dots bar */}
              <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 16 }}>
                {REG_STEPS.map((_, i) => {
                  const isDotDone = i < stepsDoneCount;
                  const isDotActive = i === activeIdx;
                  return (
                    <div key={i} style={{ height: 5, borderRadius: 3,
                      width: isDotActive ? 20 : 8,
                      background: isDotDone ? "linear-gradient(90deg,#22c55e,#4ade80)" : isDotActive ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.1)",
                      boxShadow: isDotActive ? "0 0 8px rgba(99,102,241,0.7)" : isDotDone ? "0 0 6px rgba(34,197,94,0.4)" : "none",
                      transition: "all 0.4s ease" }} />
                  );
                })}
              </div>

              {/* Step counter badge */}
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <span key={`badge-${activeIdx}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20,
                  background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                  fontSize: 11, fontWeight: 700, color: "#a5b4fc", letterSpacing: 0.5,
                  animation: "stepBadgeFlip 0.4s cubic-bezier(.36,1.56,.64,1) both" }}>
                  Step {Math.min(activeIdx + 1, REG_STEPS.length)} <span style={{ color: "rgba(255,255,255,0.3)" }}>of</span> {REG_STEPS.length}
                </span>
              </div>

              {/* Steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative", zIndex: 1 }}>
                {REG_STEPS.map(({ label, emoji, threshold }, idx) => {
                  const done = countdownUnits <= threshold;
                  const active = idx === activeIdx;
                  if (!done && !active) return null;
                  return (
                    <div key={label}
                      style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 12, overflow: "hidden",
                        padding: "9px 12px",
                        background: done ? "rgba(34,197,94,0.07)" : active ? "rgba(99,102,241,0.10)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${done ? "rgba(34,197,94,0.22)" : active ? "rgba(99,102,241,0.28)" : "rgba(255,255,255,0.05)"}`,
                        animation: done
                          ? "rowCollapse 0.7s ease forwards 0.5s"
                          : active ? "stepSlideIn 0.35s ease both" : "none" }}>

                      {/* Icon circle */}
                      <div style={{ position: "relative", width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {active && (
                          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#818cf8", borderRightColor: "rgba(129,140,248,0.3)", animation: "ringRotate 1s linear infinite" }} />
                        )}
                        <div key={`icon-${done}`} style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                          background: done ? "rgba(34,197,94,0.18)" : active ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                          animation: active ? "activeGlow 1.8s ease-in-out infinite" : "none" }}>
                          {done
                            ? <CheckCircle2 size={15} color="#22c55e" style={{ animation: "checkBounce 0.4s cubic-bezier(.36,1.56,.64,1) both" }} />
                            : active
                              ? <Loader2 size={13} color="#818cf8" style={{ animation: "spin 1.2s linear infinite" }} />
                              : <span style={{ fontSize: 13, opacity: 0.35 }}>{emoji}</span>
                          }
                        </div>
                      </div>

                      {/* Label with typewriter reveal */}
                      <p key={`lbl-${label}`} style={{ flex: 1, fontSize: 12, fontWeight: active ? 700 : done ? 600 : 500,
                        color: done ? "#86efac" : active ? "#c7d2fe" : "rgba(255,255,255,0.28)", margin: 0, lineHeight: 1.3,
                        display: "inline-block", overflow: "hidden", whiteSpace: "nowrap",
                        animation: active ? "textReveal 0.55s steps(28) both" : "none" }}>
                        {emoji} {label}
                        {active && (
                          <span style={{ display: "inline-flex", gap: 3, marginLeft: 6 }}>
                            {[0,1,2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#818cf8", display: "inline-block", animation: `dotPulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                          </span>
                        )}
                      </p>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warning card */}
            <div style={{ padding: "14px 16px", borderRadius: 16, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, marginTop: 1 }}>
                  <Sparkles size={15} color="#f59e0b" />
                </div>
                <div>
                  <p style={{ color: "#fbbf24", fontWeight: 700, fontSize: 12, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>⚠ Multiple Account Policy</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                    Creating <strong style={{ color: "rgba(255,255,255,0.75)" }}>multiple accounts</strong> is strictly prohibited on Freelancer.in. Users found with duplicate accounts will be <strong style={{ color: "#fca5a5" }}>permanently banned</strong> and any pending earnings or coins will be <strong style={{ color: "#fca5a5" }}>forfeited</strong>. One person, one account — always.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ background: "#070714", color: "white", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif", overflowX: "hidden" }}>
      <style>{REG_CSS}</style>

      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.15) 0%,transparent 70%)", animation: "orbGlow 6s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: 0, right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.12) 0%,transparent 70%)", animation: "orbGlow 8s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(20px)", background: "rgba(7,7,20,.85)" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(99,102,241,.5)" }}>
            <Briefcase size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "white" }}>Freelancer<span style={{ color: A1 }}>.</span>in</span>
        </Link>
        <Link to="/login" style={{ color: "rgba(255,255,255,.5)", fontSize: 13, textDecoration: "none", fontWeight: 600, padding: "7px 18px", borderRadius: 9, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "white")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.5)")}>
          Sign In
        </Link>
      </nav>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 580, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* Hero header */}
        <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeInUp .5s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: `${stepColor}18`, border: `1px solid ${stepColor}35`, marginBottom: 16 }}>
            <StepIcon size={13} color={stepColor} />
            <span style={{ fontSize: 11, fontWeight: 700, color: stepColor, letterSpacing: 1.5, textTransform: "uppercase" }}>
              {isFreelancer ? "Freelancer" : "Employer"} Registration
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 6, letterSpacing: "-0.5px" }}>
            {stepConfig[step].label}
          </h1>
          <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14 }}>{stepConfig[step].description}</p>
        </div>

        {/* Step progress */}
        <div style={{ marginBottom: 28, animation: "fadeInUp .5s ease both .05s" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            {stepConfig.map((sc, i) => {
              const Icon = sc.icon;
              const isDone = completedSteps.has(i);
              const isActive = i === step;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${isActive ? stepColor : isDone ? "#22c55e" : "rgba(255,255,255,.1)"}`, background: isActive ? `${stepColor}22` : isDone ? "rgba(34,197,94,.12)" : "rgba(255,255,255,.03)", boxShadow: isActive ? `0 0 16px ${stepColor}44` : "none", transition: "all .3s" }}>
                    {isDone ? <Check size={14} color="#22c55e" /> : <Icon size={14} color={isActive ? stepColor : "rgba(255,255,255,.3)"} />}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? stepColor : isDone ? "#22c55e" : "rgba(255,255,255,.3)", textAlign: "center", lineHeight: 1.2 }}>
                    {sc.label.split(" ")[0]}
                  </span>
                  {i < stepConfig.length - 1 && (
                    <div style={{ position: "absolute", height: 2, background: isDone ? "rgba(34,197,94,.4)" : "rgba(255,255,255,.08)" }} />
                  )}
                </div>
              );
            })}
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg,${A1},${A2})`, width: `${progressPercent}%`, transition: "width .4s ease", boxShadow: `0 0 10px ${A1}66` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>Step {step + 1} of {stepConfig.length}</span>
            <span style={{ fontSize: 11, color: A1, fontWeight: 600 }}>{Math.round(progressPercent)}% complete</span>
          </div>
        </div>

        {/* Error messages */}
        {arrayErrors.length > 0 && (
          <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)" }}>
            {arrayErrors.map((e, i) => (
              <p key={i} style={{ color: "#ef4444", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />{e}
              </p>
            ))}
          </div>
        )}

        {/* Main form glass card */}
        <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 20, padding: "28px 24px", backdropFilter: "blur(20px)", boxShadow: "0 24px 60px rgba(0,0,0,.35)", animation: "fadeInUp .5s ease both .1s" }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>

              {/* ── STEP 0: Personal Info ── */}
              {stepType === "personal" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div className="reg-section-badge">
                    <User size={15} color={A1} />
                    <span style={{ color: A1, fontSize: 13, fontWeight: 600 }}>Personal Information</span>
                  </div>

                  <FormField control={form.control} name="full_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>
                        Full Name <span style={{ color: "#ef4444" }}>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} className="reg-input" style={inp} />
                      </FormControl>
                      <FormDescription style={{ color: "rgba(255,255,255,.3)", fontSize: 11 }}>Name will be stored in uppercase</FormDescription>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )} />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>Gender <span style={{ color: "#ef4444" }}>*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger style={inp}><SelectValue placeholder="Select" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>Date of Birth <span style={{ color: "#ef4444" }}>*</span></FormLabel>
                        <FormControl><Input type="date" {...field} className="reg-input" style={inp} /></FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <FormField control={form.control} name="marital_status" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>Marital Status <span style={{ color: "#ef4444" }}>*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger style={inp}><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="education_level" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>Education <span style={{ color: "#ef4444" }}>*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger style={inp}><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="high_school">High School</SelectItem>
                            <SelectItem value="diploma">Diploma</SelectItem>
                            <SelectItem value="bachelors">Bachelor's</SelectItem>
                            <SelectItem value="masters">Master's</SelectItem>
                            <SelectItem value="phd">PhD</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                  </div>
                </div>
              )}

              {/* ── STEP 1: Contact Details ── */}
              {stepType === "contact" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div className="reg-section-badge">
                    <Phone size={15} color="#0ea5e9" />
                    <span style={{ color: "#0ea5e9", fontSize: 13, fontWeight: 600 }}>Contact Details</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <FormField control={form.control} name="mobile_number" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>Mobile <span style={{ color: "#ef4444" }}>*</span></FormLabel>
                        <FormControl><Input placeholder="10-digit" maxLength={10} {...field} className="reg-input" style={inp} /></FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="whatsapp_number" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>WhatsApp <span style={{ color: "#ef4444" }}>*</span></FormLabel>
                        <FormControl><Input placeholder="10-digit" maxLength={10} {...field} className="reg-input" style={inp} /></FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>Email <span style={{ color: "#ef4444" }}>*</span></FormLabel>
                      <FormControl>
                        <div style={{ position: "relative" }}>
                          <Mail size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)" }} />
                          <Input type="email" placeholder="you@example.com" {...field} className="reg-input" style={{ ...inp, paddingLeft: 38 }} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>Password <span style={{ color: "#ef4444" }}>*</span></FormLabel>
                      <FormControl>
                        <div style={{ position: "relative" }}>
                          <Lock size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)" }} />
                          <Input type="password" placeholder="Min 8 characters" {...field} className="reg-input" style={{ ...inp, paddingLeft: 38 }} />
                        </div>
                      </FormControl>
                      <FormDescription style={{ color: "rgba(255,255,255,.3)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                        <Shield size={11} /> Minimum 8 characters
                      </FormDescription>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )} />

                  <div style={{ padding: "14px", borderRadius: 12, border: "1px dashed rgba(99,102,241,.3)", background: "rgba(99,102,241,.06)" }}>
                    <Label style={{ color: "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Share2 size={12} /> Referral Code (optional)
                    </Label>
                    <Input placeholder="Enter referral code" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} className="reg-input" style={{ ...inp, textTransform: "uppercase" }} />
                    <p style={{ color: "rgba(255,255,255,.3)", fontSize: 11, marginTop: 6 }}>Got a referral code? Enter it to earn bonus coins!</p>
                  </div>
                </div>
              )}

              {/* ── STEP 2 (Employer): Business Info ── */}
              {stepType === "business" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div className="reg-section-badge">
                    <Factory size={15} color="#f59e0b" />
                    <span style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600 }}>Company / Business Information</span>
                  </div>
                  <div className="reg-info-box" style={{ display: "flex", gap: 8 }}>
                    <Sparkles size={14} color={A1} style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ color: "rgba(255,255,255,.45)", fontSize: 12, lineHeight: 1.6 }}>
                      All fields are optional — you can update your business profile later from the Employer Dashboard.
                    </p>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Building2 size={13} color="#f59e0b" /> Company / Business Name
                    </label>
                    <Input
                      placeholder="e.g. Acme Technologies Pvt. Ltd."
                      value={employerBiz.company_name}
                      onChange={e => setEmployerBiz(p => ({ ...p, company_name: e.target.value }))}
                      className="reg-input" style={inp}
                    />
                  </div>

                  {/* Business Type + Industry */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Business Type</label>
                      <Select value={employerBiz.business_type} onValueChange={v => setEmployerBiz(p => ({ ...p, business_type: v }))}>
                        <SelectTrigger style={inp}><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Industry Sector</label>
                      <Select value={employerBiz.industry_sector} onValueChange={v => setEmployerBiz(p => ({ ...p, industry_sector: v }))}>
                        <SelectTrigger style={inp}><SelectValue placeholder="Select sector" /></SelectTrigger>
                        <SelectContent>
                          {INDUSTRY_SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* GST Number */}
                  <div>
                    <label style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <FileText size={13} color="rgba(255,255,255,.4)" /> GST Number <span style={{ color: "rgba(255,255,255,.3)", fontSize: 11, fontWeight: 400, marginLeft: 4 }}>(optional)</span>
                    </label>
                    <Input
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      maxLength={15}
                      value={employerBiz.gst_number}
                      onChange={e => setEmployerBiz(p => ({ ...p, gst_number: e.target.value.toUpperCase() }))}
                      className="reg-input" style={{ ...inp, fontFamily: "monospace", letterSpacing: 1 }}
                    />
                  </div>

                  {/* Business Description */}
                  <div>
                    <label style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Briefcase size={13} color="rgba(255,255,255,.4)" /> Business Description
                    </label>
                    <Textarea
                      placeholder="Briefly describe your company, products/services, and what kind of freelancers you typically hire…"
                      rows={3}
                      value={employerBiz.business_description}
                      onChange={e => setEmployerBiz(p => ({ ...p, business_description: e.target.value }))}
                      className="reg-input" style={{ ...inp, padding: "10px 12px", minHeight: 88, resize: "vertical" }}
                    />
                  </div>

                  {/* Budget Range */}
                  <div>
                    <label style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <IndianRupee size={13} color="#22c55e" /> Typical Hiring Budget (INR)
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)", fontSize: 13, fontWeight: 600, pointerEvents: "none" }}>₹</span>
                        <Input
                          type="number" min={0} placeholder="Min budget"
                          value={employerBiz.typical_budget_min}
                          onChange={e => setEmployerBiz(p => ({ ...p, typical_budget_min: e.target.value }))}
                          className="reg-input" style={{ ...inp, paddingLeft: 26 }}
                        />
                      </div>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)", fontSize: 13, fontWeight: 600, pointerEvents: "none" }}>₹</span>
                        <Input
                          type="number" min={0} placeholder="Max budget"
                          value={employerBiz.typical_budget_max}
                          onChange={e => setEmployerBiz(p => ({ ...p, typical_budget_max: e.target.value }))}
                          className="reg-input" style={{ ...inp, paddingLeft: 26 }}
                        />
                      </div>
                    </div>
                    <p style={{ color: "rgba(255,255,255,.25)", fontSize: 11, marginTop: 5 }}>Per project / assignment range you usually hire for</p>
                  </div>

                  {/* Preferred Categories */}
                  {categories.length > 0 && (
                    <div>
                      <label style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <Tag size={13} color="#818cf8" /> Preferred Freelancer Categories
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {categories.map((cat: any) => {
                          const selected = employerBiz.preferred_categories.includes(cat.id);
                          return (
                            <button
                              key={cat.id} type="button"
                              onClick={() => setEmployerBiz(p => ({
                                ...p,
                                preferred_categories: selected
                                  ? p.preferred_categories.filter(id => id !== cat.id)
                                  : [...p.preferred_categories, cat.id]
                              }))}
                              style={{
                                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s",
                                background: selected ? "rgba(99,102,241,.25)" : "rgba(255,255,255,.05)",
                                border: selected ? "1px solid rgba(99,102,241,.6)" : "1px solid rgba(255,255,255,.1)",
                                color: selected ? "#a5b4fc" : "rgba(255,255,255,.5)",
                              }}
                            >
                              {selected && <Check size={11} style={{ marginRight: 5, display: "inline" }} />}
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* City + State */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <MapPin size={13} color="#f43f5e" /> City
                      </label>
                      <Input
                        placeholder="e.g. Mumbai"
                        value={employerBiz.city}
                        onChange={e => setEmployerBiz(p => ({ ...p, city: e.target.value }))}
                        className="reg-input" style={inp}
                      />
                    </div>
                    <div>
                      <label style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>State</label>
                      <Select value={employerBiz.state} onValueChange={v => setEmployerBiz(p => ({ ...p, state: v }))}>
                        <SelectTrigger style={inp}><SelectValue placeholder="Select state" /></SelectTrigger>
                        <SelectContent className="max-h-56">
                          {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Work Experience ── */}
              {stepType === "work" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="reg-section-badge">
                    <Building2 size={15} color="#22c55e" />
                    <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 600 }}>Professional Background</span>
                  </div>
                  <div className="reg-info-box" style={{ display: "flex", gap: 8 }}>
                    <Sparkles size={14} color={A1} style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ color: "rgba(255,255,255,.45)", fontSize: 12, lineHeight: 1.6 }}>
                      This step is optional — skip if you have no prior experience. Details strengthen your profile!
                    </p>
                  </div>

                  <FormField control={form.control} name="education_background" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>Education Background</FormLabel>
                      <FormControl><Textarea placeholder="Institutions, degrees, certifications…" rows={2} {...field} className="reg-input" style={{ ...inp, padding: "10px 12px", minHeight: 72, resize: "vertical" }} /></FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )} />

                  {workExperiences.map((w, i) => (
                    <div key={i} className="reg-card">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(34,197,94,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Building2 size={13} color="#22c55e" />
                          </div>
                          <span style={{ color: "white", fontWeight: 600, fontSize: 13 }}>Experience {i + 1}</span>
                        </div>
                        <button type="button" onClick={() => setWorkExperiences(p => p.filter((_,j) => j!==i))} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <Input placeholder="Company Name *" value={w.company_name} onChange={e => updateWorkExp(i, "company_name", e.target.value)} className="reg-input" style={inp} />
                        <Select value={w.company_type} onValueChange={v => updateWorkExp(i, "company_type", v)}>
                          <SelectTrigger style={inp}><SelectValue placeholder="Company Type *" /></SelectTrigger>
                          <SelectContent>{companyTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Textarea placeholder="Work description (optional)" rows={2} value={w.work_description} onChange={e => updateWorkExp(i, "work_description", e.target.value)} className="reg-input" style={{ ...inp, padding: "10px 12px", minHeight: 64, resize: "vertical" }} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <Select value={w.start_year} onValueChange={v => updateWorkExp(i, "start_year", v)}>
                            <SelectTrigger style={inp}><SelectValue placeholder="Start Year *" /></SelectTrigger>
                            <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                          </Select>
                          {!w.is_current && (
                            <Select value={w.end_year} onValueChange={v => updateWorkExp(i, "end_year", v)}>
                              <SelectTrigger style={inp}><SelectValue placeholder="End Year *" /></SelectTrigger>
                              <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Checkbox checked={w.is_current} onCheckedChange={c => updateWorkExp(i, "is_current", !!c)} id={`current-${i}`} />
                          <label htmlFor={`current-${i}`} style={{ color: "rgba(255,255,255,.6)", fontSize: 12, cursor: "pointer" }}>Currently working here</label>
                        </div>
                        <div style={{ padding: "12px", borderRadius: 10, border: "1px dashed rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)" }}>
                          <label style={{ color: "rgba(255,255,255,.4)", fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <Upload size={12} /> Certificate (optional)
                          </label>
                          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ color: "rgba(255,255,255,.6)", fontSize: 12, border: "none", background: "none", padding: 0 }} onChange={e => updateWorkExp(i, "certificate_file", e.target.files?.[0] || null)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="reg-add-btn" onClick={() => setWorkExperiences(p => [...p, emptyWorkExp()])}>
                    <Plus size={14} /> Add Work Experience
                  </button>
                </div>
              )}

              {/* ── STEP 3: Emergency Contact ── */}
              {stepType === "emergency" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="reg-section-badge">
                    <Heart size={15} color="#f43f5e" />
                    <span style={{ color: "#f43f5e", fontSize: 13, fontWeight: 600 }}>Emergency Contacts</span>
                  </div>
                  <div style={{ ...inp, padding: "12px 14px", borderRadius: 10, display: "flex", gap: 8, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.18)" }}>
                    <Shield size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ color: "rgba(255,255,255,.45)", fontSize: 12, lineHeight: 1.6 }}>
                      Add at least one emergency contact. This info is kept private and used only in critical situations.
                    </p>
                  </div>

                  {emergencyContacts.map((c, i) => (
                    <div key={i} className="reg-card">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(244,63,94,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Heart size={13} color="#f43f5e" />
                          </div>
                          <span style={{ color: "white", fontWeight: 600, fontSize: 13 }}>Contact {i + 1}</span>
                        </div>
                        {emergencyContacts.length > 1 && (
                          <button type="button" onClick={() => setEmergencyContacts(p => p.filter((_,j) => j!==i))} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <Input placeholder="Contact Name *" value={c.contact_name} onChange={e => updateContact(i, "contact_name", e.target.value)} className="reg-input" style={inp} />
                        <Input placeholder="10-digit Phone Number *" maxLength={10} value={c.contact_phone} onChange={e => updateContact(i, "contact_phone", e.target.value)} className="reg-input" style={inp} />
                        <Select value={c.relationship} onValueChange={v => updateContact(i, "relationship", v)}>
                          <SelectTrigger style={inp}><SelectValue placeholder="Relationship *" /></SelectTrigger>
                          <SelectContent>{relationships.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="reg-add-btn" style={{ borderColor: "rgba(244,63,94,.35)", color: "#f43f5e" }} onClick={() => setEmergencyContacts(p => [...p, emptyContact()])}>
                    <Plus size={14} /> Add Another Contact
                  </button>
                </div>
              )}

              {/* ── STEP 4: Services ── */}
              {stepType === "services" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="reg-section-badge">
                    <Wrench size={15} color="#f59e0b" />
                    <span style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600 }}>Your Services</span>
                  </div>

                  {categories.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", borderRadius: 14, border: "1px dashed rgba(255,255,255,.1)", background: "rgba(255,255,255,.02)" }}>
                      <Wrench size={32} color="rgba(255,255,255,.2)" style={{ margin: "0 auto 12px" }} />
                      <p style={{ color: "rgba(255,255,255,.35)", fontSize: 13 }}>No service categories configured yet. You can update your services later from your profile.</p>
                    </div>
                  ) : (
                    <>
                      <p style={{ color: "rgba(255,255,255,.4)", fontSize: 12 }}>Add the services you offer. Select a category, set your rates, and pick your skills.</p>
                      {services.map((s, i) => {
                        const categorySkills = allSkills.filter((sk: any) => sk.category_id === s.category_id);
                        return (
                          <div key={i} className="reg-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(245,158,11,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Wrench size={13} color="#f59e0b" />
                                </div>
                                <span style={{ color: "white", fontWeight: 600, fontSize: 13 }}>Service {i + 1}</span>
                              </div>
                              {services.length > 1 && (
                                <button type="button" onClick={() => setServices(p => p.filter((_,j) => j!==i))} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              <Select value={s.category_id} onValueChange={v => updateService(i, "category_id", v)}>
                                <SelectTrigger style={inp}><SelectValue placeholder="Select Category *" /></SelectTrigger>
                                <SelectContent>{categories.map((cat: any) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                              </Select>
                              <div>
                                <Input placeholder="Service Title *" value={s.service_title} onChange={e => updateService(i, "service_title", e.target.value)} className="reg-input" style={inp} />
                                <p style={{ color: "rgba(255,255,255,.3)", fontSize: 11, marginTop: 4 }}>e.g., Full Stack Development, Graphic Design</p>
                              </div>
                              {categorySkills.length > 0 && (
                                <div>
                                  <Label style={{ color: "rgba(255,255,255,.4)", fontSize: 12 }}>Skills</Label>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                    {categorySkills.map((sk: any) => {
                                      const selected = s.skill_ids.includes(sk.id);
                                      return (
                                        <span key={sk.id} onClick={() => { const newIds = selected ? s.skill_ids.filter(id => id!==sk.id) : [...s.skill_ids, sk.id]; updateService(i, "skill_ids", newIds); }}
                                          style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s", background: selected ? `rgba(99,102,241,.25)` : "rgba(255,255,255,.05)", border: `1px solid ${selected ? "rgba(99,102,241,.5)" : "rgba(255,255,255,.1)"}`, color: selected ? A1 : "rgba(255,255,255,.5)" }}>
                                          {sk.name}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div>
                                  <label style={{ color: "rgba(255,255,255,.4)", fontSize: 12, display: "block", marginBottom: 5 }}>Hourly Rate (₹) *</label>
                                  <Input type="number" min="0" placeholder="0" value={s.hourly_rate} onChange={e => updateService(i, "hourly_rate", e.target.value)} className="reg-input" style={inp} />
                                </div>
                                <div>
                                  <label style={{ color: "rgba(255,255,255,.4)", fontSize: 12, display: "block", marginBottom: 5 }}>Min Budget (₹) *</label>
                                  <Input type="number" min="0" placeholder="0" value={s.minimum_budget} onChange={e => updateService(i, "minimum_budget", e.target.value)} className="reg-input" style={inp} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <button type="button" className="reg-add-btn" style={{ borderColor: "rgba(245,158,11,.35)", color: "#f59e0b" }} onClick={() => setServices(p => [...p, emptyService()])}>
                        <Plus size={14} /> Add Another Service
                      </button>
                    </>
                  )}
                </div>
              )}

            </form>
          </Form>
        </div>

        {/* Navigation */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12, animation: "fadeInUp .5s ease both .15s" }}>
          {/* Terms (last step) */}
          {step === stepConfig.length - 1 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
              <Checkbox id="reg-terms" checked={agreedToTerms} onCheckedChange={c => setAgreedToTerms(c === true)} style={{ marginTop: 2 }} />
              <label htmlFor="reg-terms" style={{ fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.5, cursor: "pointer" }}>
                I agree to the{" "}
                <Link to="/legal/terms-of-service" target="_blank" style={{ color: A1 }}>Terms of Service</Link>{" "}and{" "}
                <Link to="/legal/privacy-policy" target="_blank" style={{ color: A1 }}>Privacy Policy</Link>
              </label>
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 12 }}>
              {step > 0 && (
                <button type="button" onClick={handleBack} style={{ flex: 1, padding: "13px", borderRadius: 14, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.7)", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <ArrowLeft size={15} /> Back
                </button>
              )}
              {step < stepConfig.length - 1 ? (
                <button type="button" onClick={handleNext} style={{ flex: 1, padding: "13px", borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 8px 24px rgba(99,102,241,.35)" }}>
                  Next <ArrowRight size={15} />
                </button>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} style={{ flex: 1 }}>
                    <button type="submit" disabled={submitting || !agreedToTerms} style={{ width: "100%", padding: "13px", borderRadius: 14, background: submitting || !agreedToTerms ? "rgba(99,102,241,.3)" : `linear-gradient(135deg,${A1},${A2})`, color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: submitting || !agreedToTerms ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: submitting || !agreedToTerms ? "none" : "0 8px 24px rgba(99,102,241,.35)" }}>
                      {submitting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={16} />}
                      {submitting ? "Submitting…" : "Submit Registration"}
                    </button>
                  </form>
                </Form>
              )}
            </div>

            {/* Skip button — optional steps (work, emergency) */}
            {isSkippable && step < stepConfig.length - 1 && (
              <button
                type="button"
                onClick={handleSkip}
                style={{ width: "100%", padding: "10px", borderRadius: 12, border: "1px dashed rgba(255,255,255,.15)", background: "transparent", color: "rgba(255,255,255,.4)", fontWeight: 500, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,.4)"; e.currentTarget.style.color = "#a5b4fc"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.15)"; e.currentTarget.style.color = "rgba(255,255,255,.4)"; }}
              >
                Skip for now — I'll add this later
              </button>
            )}

            {/* Skip & Submit — services step (last step) */}
            {getStepType(step) === "services" && step === stepConfig.length - 1 && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} style={{ width: "100%" }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    onClick={() => { setServices([]); }}
                    style={{ width: "100%", padding: "10px", borderRadius: 12, border: "1px dashed rgba(255,255,255,.15)", background: "transparent", color: "rgba(255,255,255,.4)", fontWeight: 500, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .2s" }}
                    onMouseEnter={e => { if (!submitting) { e.currentTarget.style.borderColor = "rgba(99,102,241,.4)"; e.currentTarget.style.color = "#a5b4fc"; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.15)"; e.currentTarget.style.color = "rgba(255,255,255,.4)"; }}
                  >
                    Skip Services — Submit Registration
                  </button>
                </form>
              </Form>
            )}
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.35)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: A1, fontWeight: 700, textDecoration: "none" }}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
