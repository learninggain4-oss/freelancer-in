import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User, Briefcase, Landmark, Building2, AlertCircle,
  ShieldCheck, BadgeCheck, ChevronRight, Wallet, CreditCard,
  Mail, Phone, Calendar, GraduationCap, Copy, Check, Coins,
  Star, Shield, Sparkles
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
  warm:  { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", input:"#fffdf7", nav:"#fef0d0", badge:"rgba(217,119,6,.1)", badgeFg:"#b45309" },
  forest: { bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", input:"#ffffff", nav:"#dcfce7", badge:"rgba(22,163,74,.1)", badgeFg:"#15803d" },
  ocean: { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", input:"#ffffff", nav:"#e0f2fe", badge:"rgba(14,165,233,.1)", badgeFg:"#0369a1" },
};

const EmployeeProfile = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const isDark = theme === "black";
  const clrGreen = isDark ? "#4ade80" : "#16a34a";
  const clrAmber = isDark ? "#fbbf24" : "#b45309";

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
  const fullName = Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Freelancer";
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
    { icon: User, label: "Personal Information", path: "/freelancer/profile/personal", color: "#6366f1", desc: "Name, gender, DOB & more" },
    { icon: Briefcase, label: "Professional", path: "/freelancer/profile/professional", color: "#8b5cf6", desc: "Education & background" },
    { icon: Landmark, label: "Bank Details", path: "/freelancer/profile/bank-details", color: "#fbbf24", desc: "Account & IFSC details" },
    { icon: CreditCard, label: "UPI Payment Apps", path: "/freelancer/profile/upi-apps", color: "#a78bfa", desc: "Manage UPI apps" },
    { icon: Building2, label: "Work Experience", path: "/freelancer/profile/work-experience", color: "#60a5fa", desc: "Past roles & certificates" },
    { icon: Star, label: "Services", path: "/freelancer/profile/services", color: "#4ade80", desc: `${servicesCount ?? 0} services listed` },
    { icon: AlertCircle, label: "Emergency Contacts", path: "/freelancer/profile/emergency-contacts", color: "#f87171", desc: "Safety contacts" },
    {
      icon: ShieldCheck,
      label: "Self Real Name Verification",
      path: "/freelancer/profile/aadhaar-verification",
      color: "#8b5cf6",
      desc: "Identity verification",
      badge: aadhaarStatus,
    },
    {
      icon: Shield,
      label: "Self Bank Verification",
      path: "/freelancer/profile/bank-verification",
      color: "#6366f1",
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

  const completionColor = completion >= 80 ? clrGreen : completion >= 50 ? clrAmber : (isDark ? "#f87171" : "#dc2626");

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text }} className="space-y-5 p-4 pb-24">
      {/* Profile Hero Card */}
      <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="overflow-hidden border shadow-2xl">
        <div className="h-28 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#6366f1]" />
        <CardContent className="relative px-4 pb-6 pt-0">
          <div className="flex flex-col items-center -mt-14">
            <div style={{ borderColor: T.bg, background: T.bg }} className="rounded-full border-[6px] shadow-xl overflow-hidden">
              <ProfilePhotoUpload />
            </div>
            <h1 className="mt-4 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
              {fullName}
              {isVerified && <BadgeCheck className="h-6 w-6 text-[#4ade80]" />}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge style={{ background: T.badge, color: T.badgeFg, borderColor: T.border }} variant="outline" className="font-mono text-xs tracking-wider px-3 py-1">
                {userCode}
              </Badge>
              <Badge style={{ 
                background: profile?.approval_status === "approved" ? "rgba(74,222,128,.15)" : "rgba(251,191,36,.15)",
                color: profile?.approval_status === "approved" ? clrGreen : clrAmber,
                borderColor: profile?.approval_status === "approved" ? "rgba(74,222,128,.2)" : "rgba(251,191,36,.2)"
              }} className="text-[10px] capitalize font-bold px-3 py-1 border">
                {profile?.approval_status ?? "pending"}
              </Badge>
            </div>
          </div>

          {/* Quick Info Pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {[
              { icon: Mail, value: profile?.email },
              { icon: Phone, value: profile?.mobile_number },
              { icon: Calendar, value: profile?.date_of_birth ? format(new Date(profile.date_of_birth), "dd MMM yyyy") : null },
              { icon: GraduationCap, value: profile?.education_level },
            ].filter(i => i.value).map((item, idx) => (
              <div key={idx} style={{ background: T.nav, border: `1px solid ${T.border}` }} className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium">
                <item.icon className="h-3.5 w-3.5 opacity-70" />
                <span className="max-w-[150px] truncate opacity-90">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Wallet Number Card */}
      <Card style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", borderColor: "transparent" }} className="border-0 text-white shadow-xl">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Wallet ID</p>
              <p className="font-mono text-lg font-bold tracking-[0.2em]">{walletNumber}</p>
            </div>
          </div>
          <button
            onClick={handleCopyWallet}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md transition-all hover:bg-white/30 active:scale-95"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </CardContent>
      </Card>

      {/* Profile Completion */}
      <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-xl">
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <span style={{ color: T.text }} className="text-sm font-bold uppercase tracking-wider opacity-80">Profile Mastery</span>
            <span style={{ color: completionColor }} className="text-2xl font-black">{completion}%</span>
          </div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/20">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <span className="text-xs font-bold text-amber-400">
              +{rewardCoins ?? 1000} Coins on 100% completion
            </span>
          </div>
          <div style={{ background: T.border }} className="h-3 rounded-full overflow-hidden">
            <div 
              style={{ width: `${completion}%`, background: `linear-gradient(to right, #6366f1, ${completionColor})` }} 
              className="h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
            />
          </div>
          {completion < 100 ? (
            <p style={{ color: T.sub }} className="mt-4 text-[11px] leading-relaxed">
              Unlock your full potential! Complete all sections to earn rewards and gain higher visibility among clients.
            </p>
          ) : (
            <p className="mt-4 text-[11px] font-bold flex items-center gap-1.5" style={{ color: clrGreen }}>
              <BadgeCheck className="h-3.5 w-3.5" /> Congratulations! Your profile is elite.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Services", value: servicesCount ?? 0, color: isDark ? "#818cf8" : "#4f46e5" },
          { label: "KYC", value: isVerified ? "Elite" : "Basic", color: isDark ? "#c4b5fd" : "#7c3aed" },
          { label: "Coins", value: profile?.coin_balance ?? 0, color: clrAmber },
        ].map((stat, i) => (
          <Card key={i} style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-xl">
            <CardContent className="flex flex-col items-center p-4">
              <span style={{ color: stat.color }} className="text-xl font-black">{stat.value}</span>
              <span style={{ color: T.sub }} className="text-[10px] font-bold uppercase tracking-widest mt-1">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Menu */}
      <div className="pt-2">
        <h2 style={{ color: T.sub }} className="mb-4 text-xs font-black uppercase tracking-[0.2em] px-1">Control Panel</h2>
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <button
              key={section.path}
              onClick={() => navigate(section.path)}
              style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}
              className="group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:bg-white/[0.02] hover:shadow-2xl active:scale-[0.98]"
            >
              <div style={{ background: `${section.color}15` }} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110">
                <section.icon style={{ color: section.color }} className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span style={{ color: T.text }} className="block text-sm font-bold tracking-tight">{section.label}</span>
                <span style={{ color: T.sub }} className="block text-[11px] font-medium opacity-80">{section.desc}</span>
              </div>
              <div className="flex items-center gap-2">
                {section.badge && (
                  <Badge style={{ 
                    background: section.badge === 'verified' ? 'rgba(74,222,128,.1)' : 'rgba(251,191,36,.1)',
                    color: section.badge === 'verified' ? clrGreen : clrAmber,
                    borderColor: section.badge === 'verified' ? 'rgba(74,222,128,.2)' : 'rgba(251,191,36,.2)'
                  }} className="text-[9px] capitalize px-2 py-0 border">
                    {section.badge}
                  </Badge>
                )}
                <ChevronRight style={{ color: T.sub }} className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
