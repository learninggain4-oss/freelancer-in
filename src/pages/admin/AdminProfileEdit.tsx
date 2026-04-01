import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Save, User, Mail, Phone, Calendar, GraduationCap, Briefcase,
  AlertCircle, ShieldCheck, ShieldOff, RotateCcw, BadgeCheck, Wallet, MapPin, Globe,
  Heart, CreditCard, Landmark, Users, History, Check, X, ShieldAlert
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import UserEntityManager from "@/components/admin/UserEntityManager";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { cn } from "@/lib/utils";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

type ProfileData = {
  id: string;
  full_name: string[];
  user_code: string[];
  email: string;
  user_type: string;
  approval_status: string;
  mobile_number: string | null;
  whatsapp_number: string | null;
  gender: string | null;
  date_of_birth: string | null;
  marital_status: string | null;
  education_level: string | null;
  previous_job_details: string | null;
  work_experience: string | null;
  education_background: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  upi_id: string | null;
  bank_account_number: string | null;
  bank_ifsc_code: string | null;
  bank_name: string | null;
  available_balance: number;
  hold_balance: number;
  approval_notes: string | null;
  is_disabled: boolean;
  disabled_reason: string | null;
  created_at: string;
  approved_at: string | null;
};

type RegistrationMeta = {
  ip_address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
};

const AdminProfileEdit = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [regMeta, setRegMeta] = useState<RegistrationMeta | null>(null);

  // Form state
  const [form, setForm] = useState({
    full_name: "",
    user_code: "",
    email: "",
    mobile_number: "",
    whatsapp_number: "",
    gender: "",
    date_of_birth: "",
    marital_status: "",
    education_level: "",
    previous_job_details: "",
    work_experience: "",
    education_background: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    approval_status: "",
    approval_notes: "",
    is_disabled: false,
    disabled_reason: "",
    upi_id: "",
    bank_name: "",
    bank_account_number: "",
    bank_ifsc_code: "",
  });

  useEffect(() => {
    if (!profileId) return;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: p }, { data: av }, { data: meta }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, user_code, email, user_type, approval_status, mobile_number, whatsapp_number, gender, date_of_birth, marital_status, education_level, previous_job_details, work_experience, education_background, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, upi_id, bank_account_number, bank_ifsc_code, bank_name, available_balance, hold_balance, approval_notes, is_disabled, disabled_reason, created_at, approved_at")
          .eq("id", profileId)
          .single(),
        supabase
          .from("aadhaar_verifications")
          .select("status")
          .eq("profile_id", profileId)
          .maybeSingle(),
        supabase
          .from("registration_metadata" as any)
          .select("ip_address, city, region, country, latitude, longitude")
          .eq("profile_id", profileId)
          .maybeSingle(),
      ]);
      if (p) {
        setProfile(p as ProfileData);
        setForm({
          full_name: p.full_name?.[0] || "",
          user_code: p.user_code?.[0] || "",
          email: p.email || "",
          mobile_number: p.mobile_number || "",
          whatsapp_number: p.whatsapp_number || "",
          gender: p.gender || "",
          date_of_birth: p.date_of_birth || "",
          marital_status: p.marital_status || "",
          education_level: p.education_level || "",
          previous_job_details: p.previous_job_details || "",
          work_experience: p.work_experience || "",
          education_background: p.education_background || "",
          emergency_contact_name: p.emergency_contact_name || "",
          emergency_contact_phone: p.emergency_contact_phone || "",
          emergency_contact_relationship: p.emergency_contact_relationship || "",
          approval_status: p.approval_status || "pending",
          approval_notes: p.approval_notes || "",
          is_disabled: p.is_disabled ?? false,
          disabled_reason: p.disabled_reason || "",
          upi_id: p.upi_id || "",
          bank_name: p.bank_name || "",
          bank_account_number: p.bank_account_number || "",
          bank_ifsc_code: p.bank_ifsc_code || "",
        });
      }
      setAadhaarVerified(av?.status === "verified");
      setRegMeta((meta as unknown as RegistrationMeta) || null);
      setLoading(false);
    };
    fetchData();
  }, [profileId]);

  const updateField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: [form.full_name],
        user_code: [form.user_code],
        email: form.email,
        mobile_number: form.mobile_number || null,
        whatsapp_number: form.whatsapp_number || null,
        gender: (form.gender || null) as any,
        date_of_birth: form.date_of_birth || null,
        marital_status: (form.marital_status || null) as any,
        education_level: form.education_level || null,
        previous_job_details: form.previous_job_details || null,
        work_experience: form.work_experience || null,
        education_background: form.education_background || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        emergency_contact_relationship: form.emergency_contact_relationship || null,
        approval_status: form.approval_status as any,
        approval_notes: form.approval_notes || null,
        is_disabled: form.is_disabled,
        disabled_reason: form.disabled_reason || null,
        upi_id: form.upi_id || null,
        bank_name: form.bank_name || null,
        bank_account_number: form.bank_account_number || null,
        bank_ifsc_code: form.bank_ifsc_code || null,
        approved_at: form.approval_status === "approved" ? new Date().toISOString() : profile.approved_at,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save changes: " + error.message);
    } else {
      toast.success("Profile updated successfully");
      setProfile((prev) =>
        prev ? { ...prev, full_name: [form.full_name], email: form.email, approval_status: form.approval_status } : prev
      );
    }
  };

  const handleResetBalance = async () => {
    if (!profile) return;
    const { error } = await supabase
      .from("profiles")
      .update({ available_balance: 0, hold_balance: 0 })
      .eq("id", profile.id);
    if (error) {
      toast.error("Failed to reset balance");
    } else {
      toast.success("Balance reset to ₹0");
      setProfile((prev) => (prev ? { ...prev, available_balance: 0, hold_balance: 0 } : prev));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
           <Skeleton className="h-10 w-10 rounded-full" />
           <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
           </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
           <Skeleton className="h-96 w-full rounded-2xl" />
           <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-xl font-bold" style={{ color: T.text }}>Profile Not Found</p>
        <p className="text-sm mb-6" style={{ color: T.sub }}>The requested user profile does not exist or has been removed.</p>
        <Button variant="outline" onClick={() => navigate("/admin/users")} style={{ borderColor: T.border, color: T.text }}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to User List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Header & Main Actions */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center justify-between">
        <div className="flex items-center gap-5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/admin/users")}
            className="h-11 w-11 rounded-xl hover:bg-white/5 border transition-all"
            style={{ borderColor: T.border, color: T.sub }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: T.text }}>
                {form.full_name || "User Profile"}
              </h1>
              {aadhaarVerified && (
                <div className="flex items-center gap-1.5 bg-[#4ade8015] text-[#4ade80] px-2 py-0.5 rounded-full border border-[#4ade8030]">
                  <BadgeCheck className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="font-mono text-xs font-bold" style={{ color: "#a5b4fc" }}>{profile.user_code?.[0]}</span>
              <span className="text-xs opacity-30" style={{ color: T.text }}>•</span>
              <Badge variant="outline" className="capitalize text-[10px] font-bold border-[#6366f130] text-[#a5b4fc] bg-[#6366f105]">
                {profile.user_type}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize text-[10px] font-bold px-2",
                  form.approval_status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                  form.approval_status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  "bg-amber-500/10 text-amber-400 border-amber-500/20"
                )}
              >
                {form.approval_status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <Button 
             onClick={handleSave} 
             disabled={saving}
             className="h-11 px-6 bg-[#6366f1] hover:bg-[#6366f1]/90 shadow-lg shadow-indigo-500/20"
           >
             {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             Save All Changes
           </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sidebar Controls */}
        <div className="space-y-8 lg:col-span-1">
          {/* Account Status Card */}
          <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
            <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
              <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold" style={{ color: T.sub }}>
                <ShieldCheck className="h-4 w-4 text-[#6366f1]" />
                Account Authority
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Approval Level</Label>
                <Select value={form.approval_status} onValueChange={(v) => updateField("approval_status", v)}>
                  <SelectTrigger style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="approved">Approved Access</SelectItem>
                    <SelectItem value="rejected">Rejected / Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label style={{ color: T.text }}>Authority Notes</Label>
                <Textarea
                  value={form.approval_notes}
                  onChange={(e) => updateField("approval_notes", e.target.value)}
                  placeholder="Internal notes about this user's status..."
                  className="min-h-[80px]"
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>

              <Separator style={{ background: T.border }} />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      {form.is_disabled ? <ShieldOff className="h-4 w-4 text-red-400" /> : <ShieldCheck className="h-4 w-4 text-green-400" />}
                      <span className="font-bold text-sm" style={{ color: T.text }}>
                        {form.is_disabled ? "Login Restricted" : "Active Access"}
                      </span>
                   </div>
                   <Switch
                     checked={form.is_disabled}
                     onCheckedChange={(checked) => updateField("is_disabled", checked)}
                   />
                </div>
                {form.is_disabled && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label style={{ color: T.text }}>Restriction Reason</Label>
                    <Input
                      value={form.disabled_reason}
                      onChange={(e) => updateField("disabled_reason", e.target.value)}
                      placeholder="Why is this account restricted?"
                      style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Wallet Summary Card */}
          <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
            <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
              <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold" style={{ color: T.sub }}>
                <Wallet className="h-4 w-4 text-[#a78bfa]" />
                Wallet Capital
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 rounded-xl border" style={{ background: "rgba(74, 222, 128, 0.05)", borderColor: "rgba(74, 222, 128, 0.1)" }}>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-green-400 opacity-70">Available</p>
                    <p className="text-xl font-bold text-green-400 mt-1">₹{profile.available_balance}</p>
                 </div>
                 <div className="p-3 rounded-xl border" style={{ background: "rgba(248, 113, 113, 0.05)", borderColor: "rgba(248, 113, 113, 0.1)" }}>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-red-400 opacity-70">On Hold</p>
                    <p className="text-xl font-bold text-red-400 mt-1">₹{profile.hold_balance}</p>
                 </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset Financials
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(24px)" }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle style={{ color: T.text }}>Reset Wallet Balances?</AlertDialogTitle>
                    <AlertDialogDescription style={{ color: T.sub }}>
                      This will permanently set all balances to ₹0 for {form.full_name}. This action is logged and irreversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel style={{ borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetBalance} className="bg-red-500 hover:bg-red-600">Proceed with Reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          {regMeta && (
            <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
              <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold" style={{ color: T.sub }}>
                  <Globe className="h-4 w-4 text-[#60a5fa]" />
                  Session Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                 <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold tracking-widest opacity-50" style={{ color: T.text }}>Registration IP</Label>
                    <div className="flex items-center gap-2 font-mono text-sm" style={{ color: T.text }}>
                       <MapPin className="h-3 w-3 opacity-50" />
                       {regMeta.ip_address || "Unknown"}
                    </div>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold tracking-widest opacity-50" style={{ color: T.text }}>Geolocation</Label>
                    <div className="text-sm font-medium" style={{ color: T.text }}>
                       {[regMeta.city, regMeta.region, regMeta.country].filter(Boolean).join(", ") || "Geo-metadata missing"}
                    </div>
                    {regMeta.latitude && (
                      <p className="text-[10px] font-mono opacity-50 mt-1" style={{ color: T.text }}>
                        Lat: {regMeta.latitude.toFixed(4)}, Lng: {regMeta.longitude?.toFixed(4)}
                      </p>
                    )}
                 </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Identity & Contact Section */}
          <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
            <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
              <CardTitle className="flex items-center gap-2 text-base font-bold" style={{ color: T.text }}>
                <User className="h-5 w-5 text-[#6366f1]" />
                Identity & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Official Name</Label>
                  <Input 
                    value={form.full_name} 
                    onChange={(e) => updateField("full_name", e.target.value)} 
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Strategic User Code</Label>
                  <Input 
                    value={form.user_code} 
                    onChange={(e) => updateField("user_code", e.target.value)} 
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Communication Email</Label>
                  <Input 
                    type="email" 
                    value={form.email} 
                    onChange={(e) => updateField("email", e.target.value)} 
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Primary Mobile</Label>
                  <Input 
                    value={form.mobile_number} 
                    onChange={(e) => updateField("mobile_number", e.target.value)} 
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>WhatsApp Interface</Label>
                  <Input 
                    value={form.whatsapp_number} 
                    onChange={(e) => updateField("whatsapp_number", e.target.value)} 
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                   <Label style={{ color: T.text }}>Date of Birth</Label>
                   <Input 
                     type="date" 
                     value={form.date_of_birth} 
                     onChange={(e) => updateField("date_of_birth", e.target.value)} 
                     style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                     className="h-11"
                   />
                </div>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-3 mt-6">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
                    <SelectTrigger style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} className="h-11">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Marital Status</Label>
                  <Select value={form.marital_status} onValueChange={(v) => updateField("marital_status", v)}>
                    <SelectTrigger style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} className="h-11">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Education Level</Label>
                  <Input 
                    value={form.education_level} 
                    onChange={(e) => updateField("education_level", e.target.value)} 
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Context */}
          <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
            <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
              <CardTitle className="flex items-center gap-2 text-base font-bold" style={{ color: T.text }}>
                <Briefcase className="h-5 w-5 text-[#a78bfa]" />
                Professional Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Industry Tenure & Details</Label>
                <Textarea 
                  value={form.work_experience} 
                  onChange={(e) => updateField("work_experience", e.target.value)} 
                  rows={3} 
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Previous Occupational History</Label>
                <Textarea 
                  value={form.previous_job_details} 
                  onChange={(e) => updateField("previous_job_details", e.target.value)} 
                  rows={3} 
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Academic Background</Label>
                <Textarea 
                  value={form.education_background} 
                  onChange={(e) => updateField("education_background", e.target.value)} 
                  rows={3} 
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Infrastructure */}
          <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
            <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
              <CardTitle className="flex items-center gap-2 text-base font-bold" style={{ color: T.text }}>
                <Landmark className="h-5 w-5 text-[#4ade80]" />
                Payment Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Digital ID (UPI)</Label>
                  <Input 
                    value={form.upi_id} 
                    onChange={(e) => updateField("upi_id", e.target.value)} 
                    placeholder="example@upi"
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Banking Institution</Label>
                  <Input 
                    value={form.bank_name} 
                    onChange={(e) => updateField("bank_name", e.target.value)} 
                    placeholder="e.g. HDFC Bank"
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Account Identifier</Label>
                  <Input 
                    value={form.bank_account_number} 
                    onChange={(e) => updateField("bank_account_number", e.target.value)} 
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Bank Swift / IFSC</Label>
                  <Input 
                    value={form.bank_ifsc_code} 
                    onChange={(e) => updateField("bank_ifsc_code", e.target.value)} 
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11 font-mono uppercase"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Safety Protocol */}
          <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
            <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
              <CardTitle className="flex items-center gap-2 text-base font-bold" style={{ color: T.text }}>
                <Heart className="h-5 w-5 text-red-400" />
                Emergency Protocols
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Liaison Name</Label>
                  <Input 
                    value={form.emergency_contact_name} 
                    onChange={(e) => updateField("emergency_contact_name", e.target.value)} 
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Liaison Phone</Label>
                  <Input 
                    value={form.emergency_contact_phone} 
                    onChange={(e) => updateField("emergency_contact_phone", e.target.value)} 
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Relationship Matrix</Label>
                  <Input 
                    value={form.emergency_contact_relationship} 
                    onChange={(e) => updateField("emergency_contact_relationship", e.target.value)} 
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Entities */}
          <UserEntityManager profileId={profileId!} />
        </div>
      </div>
    </div>
  );
};

export default AdminProfileEdit;
