import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User, Briefcase, Landmark, Building2, AlertCircle,
  ShieldCheck, BadgeCheck, ChevronRight, Wallet,
  Mail, Phone, Calendar, GraduationCap, Copy, Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfilePhotoUpload from "@/components/profile/ProfilePhotoUpload";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

const ClientProfile = () => {
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

  const isVerified = aadhaarStatus === "verified";
  const walletNumber = (profile as any)?.wallet_number ?? "—";
  const fullName = Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Client";
  const userCode = Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—";

  const fields = [
    profile?.full_name, profile?.email, profile?.mobile_number,
    profile?.whatsapp_number, profile?.date_of_birth, profile?.gender,
    profile?.education_level, profile?.work_experience,
    profile?.emergency_contact_name, profile?.emergency_contact_phone,
    profile?.bank_name, profile?.bank_account_number,
  ];
  const filled = fields.filter(Boolean).length;
  const completion = Math.round((filled / fields.length) * 100);

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
      label: "Aadhaar Verification",
      path: "/client/profile/aadhaar-verification",
      color: "text-accent",
      desc: "Identity verification",
      badge: aadhaarStatus,
    },
    {
      icon: Landmark,
      label: "Bank Verification",
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
    <div className="space-y-5 p-4 pb-24">
      {/* Profile Hero Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="h-20 bg-gradient-to-r from-primary to-primary/70" />
        <CardContent className="relative px-4 pb-5 pt-0">
          <div className="flex flex-col items-center -mt-14">
            <div className="rounded-full border-4 border-card bg-card">
              <ProfilePhotoUpload />
            </div>
            <h1 className="mt-3 flex items-center gap-2 text-xl font-bold text-foreground">
              {fullName}
              {isVerified && <BadgeCheck className="h-5 w-5 text-accent" />}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs tracking-wider">
                {userCode}
              </Badge>
              <Badge variant={profile?.approval_status === "approved" ? "default" : "secondary"} className="text-[10px] capitalize">
                {profile?.approval_status ?? "pending"}
              </Badge>
            </div>
          </div>

          {/* Quick Info Pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {profile?.email && (
              <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="max-w-[140px] truncate">{profile.email}</span>
              </div>
            )}
            {profile?.mobile_number && (
              <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{profile.mobile_number}</span>
              </div>
            )}
            {profile?.date_of_birth && (
              <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(profile.date_of_birth), "dd MMM yyyy")}</span>
              </div>
            )}
            {profile?.education_level && (
              <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <GraduationCap className="h-3 w-3" />
                <span className="capitalize">{profile.education_level}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wallet Number Card */}
      <Card className="border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs opacity-80">Wallet Number</p>
              <p className="font-mono text-base font-semibold tracking-widest">{walletNumber}</p>
            </div>
          </div>
          <button
            onClick={handleCopyWallet}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20 transition-colors hover:bg-primary-foreground/30 active:scale-95"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </CardContent>
      </Card>

      {/* Profile Completion */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Profile Completion</span>
            <span className={`text-lg font-bold ${completionColor}`}>{completion}%</span>
          </div>
          <Progress value={completion} className="h-2.5" />
          {completion < 100 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Complete your profile for a better experience on the platform.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center p-3">
            <span className="text-lg font-bold text-primary">{projectsCount ?? 0}</span>
            <span className="text-[11px] text-muted-foreground">Projects</span>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center p-3">
            <span className="text-lg font-bold text-accent">
              {isVerified ? "✓" : "—"}
            </span>
            <span className="text-[11px] text-muted-foreground">KYC</span>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center p-3">
            <span className="text-lg font-bold text-warning">
              {profile?.coin_balance ?? 0}
            </span>
            <span className="text-[11px] text-muted-foreground">Coins</span>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Menu */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Manage Profile</h2>
        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.path}
              onClick={() => navigate(section.path)}
              className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:bg-muted/50 hover:shadow-sm active:scale-[0.98]"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted ${section.color}`}>
                <section.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-foreground">{section.label}</span>
                <span className="block text-[11px] text-muted-foreground">{section.desc}</span>
              </div>
              {section.badge && (
                <Badge variant={statusBadgeVariant(section.badge)} className="text-[10px] capitalize mr-1">
                  {section.badge}
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
