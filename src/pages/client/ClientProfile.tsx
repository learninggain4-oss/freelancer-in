import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User, Briefcase, Landmark, Building2, AlertCircle,
  ShieldCheck, BadgeCheck, ChevronRight, Wallet,
  Mail, Phone, Calendar, GraduationCap, Copy, Check, Coins,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfilePhotoUpload from "@/components/profile/ProfilePhotoUpload";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const ClientProfile = () => {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: aadhaarStatus } = useQuery({
    queryKey: ["aadhaar-status", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("aadhaar_verifications")
        .select("status")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      return data?.status ?? null;
    },
  });

  const { data: bankVerifStatus } = useQuery({
    queryKey: ["bank-verif-status", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_verifications")
        .select("status")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      return data?.status ?? null;
    },
  });

  const { data: projectsCount } = useQuery({
    queryKey: ["projects-count", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("client_id", profile!.id);
      return count ?? 0;
    },
  });

  const { data: bankAccountsCount } = useQuery({
    queryKey: ["bank-accounts-count", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("user_bank_accounts")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profile!.id);
      return count ?? 0;
    },
  });

  const { data: emergencyCount } = useQuery({
    queryKey: ["emergency-count", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("employee_emergency_contacts")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profile!.id);
      return count ?? 0;
    },
  });

  const { data: servicesCount } = useQuery({
    queryKey: ["services-count", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("employee_services")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profile!.id);
      return count ?? 0;
    },
  });

  const { data: rewardCoins } = useQuery({
    queryKey: ["profile-completion-reward"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "coin_reward_profile_completion")
        .maybeSingle();
      return data?.value ? parseInt(data.value) : 1000;
    },
  });

  const isVerified = aadhaarStatus === "verified";
  const walletNumber = (profile as any)?.wallet_number ?? "—";
  const fullName = Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Client";
  const userCode = Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—";

  // Profile completion: 9 criteria
  const personalFilled = !!(profile?.full_name && profile?.email && profile?.mobile_number && profile?.date_of_birth && profile?.gender);
  const professionalFilled = !!(profile?.education_level);
  const bankAdded = (bankAccountsCount ?? 0) >= 1;
  const workExpFilled = !!(profile?.work_experience);
  const serviceFilled = (servicesCount ?? 0) >= 1;
  const emergencyFilled = (emergencyCount ?? 0) >= 1;
  const aadhaarDone = aadhaarStatus === "verified";
  const bankVerifDone = bankVerifStatus === "verified";
  const photoUploaded = !!(profile?.profile_photo_path);

  const completionItems = [personalFilled, professionalFilled, bankAdded, workExpFilled, serviceFilled, emergencyFilled, aadhaarDone, bankVerifDone, photoUploaded];
  const filledCount = completionItems.filter(Boolean).length;
  const completion = Math.round((filledCount / completionItems.length) * 100);

  const handleCopyWallet = () => {
    if (walletNumber !== "—") {
      navigator.clipboard.writeText(walletNumber);
      setCopied(true);
      toast.success("Wallet number copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sections = [
    { icon: User, label: "Personal Information", path: "/client/profile/personal", color: "text-primary", desc: "Name, gender, DOB & more" },
    { icon: Briefcase, label: "Professional", path: "/client/profile/professional", color: "text-accent", desc: "Education & background" },
    { icon: Landmark, label: "Bank Details", path: "/client/profile/bank-details", color: "text-warning", desc: "Account & IFSC details" },
    { icon: Building2, label: "Work Experience", path: "/client/profile/work-experience", color: "text-secondary", desc: "Past roles & certificates" },
    { icon: Briefcase, label: "Services", path: "/client/profile/services", color: "text-primary", desc: "Service preferences" },
    { icon: AlertCircle, label: "Emergency Contacts", path: "/client/profile/emergency-contacts", color: "text-destructive", desc: "Safety contacts" },
    {
      icon: ShieldCheck,
      label: "Self Real Name Verification",
      path: "/client/profile/aadhaar-verification",
      color: "text-accent",
      desc: "Identity verification",
      badge: aadhaarStatus,
    },
    {
      icon: Landmark,
      label: "Self Bank Verification",
      path: "/client/profile/bank-verification",
      color: "text-primary",
      desc: "Bank account verification",
      badge: bankVerifStatus,
    },
  ];

  const statusBadgeVariant = (status: string | null) => {
    if (!status) return "secondary";
    if (status === "verified") return "default";
    if (status === "rejected") return "destructive";
    return "secondary";
  };

  const completionColor = completion >= 80 ? "text-accent" : completion >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-5 p-4 pb-24 min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      {/* Profile Hero Card */}
      <Card className="overflow-hidden border-0 shadow-xl" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-90" />
        <CardContent className="relative px-4 pb-6 pt-0">
          <div className="flex flex-col items-center -mt-12">
            <div className="rounded-full border-4 border-card bg-card p-1 shadow-2xl" style={{ background: T.card, borderColor: T.border }}>
              <ProfilePhotoUpload />
            </div>
            <h1 className="mt-4 flex items-center gap-2 text-2xl font-bold tracking-tight">
              {fullName}
              {isVerified && <BadgeCheck className="h-6 w-6 text-indigo-400" />}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs tracking-wider border-indigo-500/30 text-indigo-400" style={{ background: T.badge }}>
                {userCode}
              </Badge>
              <Badge className="text-[10px] capitalize font-semibold px-3" style={{ background: profile?.approval_status === "approved" ? "#4ade8020" : T.badge, color: profile?.approval_status === "approved" ? "#4ade80" : T.badgeFg }}>
                {profile?.approval_status ?? "pending"}
              </Badge>
            </div>
          </div>

          {/* Quick Info Pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {profile?.email && (
              <div className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.sub }}>
                <Mail className="h-3.5 w-3.5 text-indigo-400" />
                <span className="max-w-[160px] truncate">{profile.email}</span>
              </div>
            )}
            {profile?.mobile_number && (
              <div className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.sub }}>
                <Phone className="h-3.5 w-3.5 text-indigo-400" />
                <span>{profile.mobile_number}</span>
              </div>
            )}
            {profile?.date_of_birth && (
              <div className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.sub }}>
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                <span>{format(new Date(profile.date_of_birth), "dd MMM yyyy")}</span>
              </div>
            )}
            {profile?.education_level && (
              <div className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.sub }}>
                <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                <span className="capitalize">{profile.education_level}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wallet Number Card */}
      <Card className="border-0 bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-xl backdrop-blur-md">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Wallet Number</p>
              <p className="font-mono text-lg font-bold tracking-[0.2em]">{walletNumber}</p>
            </div>
          </div>
          <button
            onClick={handleCopyWallet}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 transition-all hover:bg-white/30 active:scale-90"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </CardContent>
      </Card>

      {/* Profile Completion */}
      <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }} className="border-0 shadow-lg">
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-indigo-400">Profile Completion</span>
            <span className={`text-2xl font-black ${completionColor}`}>{completion}%</span>
          </div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20">
              <Coins className="h-3 w-3 text-amber-500" />
            </div>
            <span className="text-xs font-bold text-amber-500/90">
              Reward: +{rewardCoins ?? 1000} Coins on 100% completion
            </span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-indigo-500/10">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
              style={{ width: `${completion}%` }}
            />
          </div>
          {completion < 100 && (
            <p className="mt-3 text-xs leading-relaxed" style={{ color: T.sub }}>
              Complete all sections: Personal Info, Professional, Bank Details, Work Experience, Services, Emergency Contacts, Photo, Self Real Name & Bank Verification.
            </p>
          )}
          {completion === 100 && (
            <p className="mt-3 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4" /> 🎉 Your profile is 100% complete!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Projects", val: projectsCount ?? 0, color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "KYC", val: isVerified ? "✓" : "—", color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Coins", val: profile?.coin_balance ?? 0, color: "text-amber-400", bg: "bg-amber-500/10" }
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-lg" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
            <CardContent className="flex flex-col items-center p-4">
              <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                <span className={`text-lg font-black ${s.color}`}>{s.val}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Menu */}
      <div className="pt-2">
        <h2 className="mb-4 text-xs font-black uppercase tracking-[0.2em]" style={{ color: T.sub }}>Manage Profile</h2>
        <div className="space-y-3">
          {sections.map((section) => (
            <button
              key={section.path}
              onClick={() => navigate(section.path)}
              className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all active:scale-[0.98] shadow-lg"
              style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110" style={{ background: T.input, border: `1px solid ${T.border}` }}>
                <section.icon className={`h-6 w-6 ${section.color.replace('text-', 'text-indigo-400')}`} style={{ color: section.color === 'text-primary' ? '#6366f1' : section.color === 'text-accent' ? '#8b5cf6' : section.color === 'text-warning' ? '#fbbf24' : section.color === 'text-destructive' ? '#f87171' : '#6366f1' }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold tracking-tight" style={{ color: T.text }}>{section.label}</span>
                <span className="block text-[11px] font-medium" style={{ color: T.sub }}>{section.desc}</span>
              </div>
              {section.badge && (
                <Badge 
                  className="text-[10px] font-bold capitalize mr-1"
                  style={{ 
                    background: section.badge === 'verified' ? '#4ade8020' : section.badge === 'rejected' ? '#f8717120' : T.badge,
                    color: section.badge === 'verified' ? '#4ade80' : section.badge === 'rejected' ? '#f87171' : T.badgeFg,
                    border: `1px solid ${section.badge === 'verified' ? '#4ade8030' : section.badge === 'rejected' ? '#f8717130' : T.border}`
                  }}
                >
                  {section.badge}
                </Badge>
              )}
              <ChevronRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: T.sub }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
