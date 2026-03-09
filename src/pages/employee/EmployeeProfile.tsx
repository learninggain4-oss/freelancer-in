import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User, Briefcase, Landmark, Building2, AlertCircle,
  ShieldCheck, BadgeCheck, ChevronRight, Wallet, CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfilePhotoUpload from "@/components/profile/ProfilePhotoUpload";

const EmployeeProfile = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

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

  const isVerified = aadhaarStatus === "verified";

  const fields = [
    profile?.full_name, profile?.email, profile?.mobile_number,
    profile?.whatsapp_number, profile?.date_of_birth, profile?.gender,
    profile?.education_level, profile?.work_experience,
    profile?.emergency_contact_name, profile?.emergency_contact_phone,
  ];
  const filled = fields.filter(Boolean).length;
  const completion = Math.round((filled / fields.length) * 100);

  const sections = [
    { icon: User, label: "Personal Information", path: "/employee/profile/personal", color: "text-primary" },
    { icon: Briefcase, label: "Professional", path: "/employee/profile/professional", color: "text-accent" },
    { icon: Landmark, label: "Bank Details", path: "/employee/profile/bank-details", color: "text-warning" },
    { icon: CreditCard, label: "UPI Payment Apps", path: "/employee/profile/upi-apps", color: "text-accent" },
    { icon: Building2, label: "Work Experience", path: "/employee/profile/work-experience", color: "text-secondary" },
    { icon: Briefcase, label: "Services", path: "/employee/profile/services", color: "text-primary" },
    { icon: AlertCircle, label: "Emergency Contacts", path: "/employee/profile/emergency-contacts", color: "text-destructive" },
    {
      icon: ShieldCheck,
      label: "Aadhaar Verification",
      path: "/employee/profile/aadhaar-verification",
      color: "text-accent",
      badge: aadhaarStatus,
    },
    {
      icon: Landmark,
      label: "Bank Verification",
      path: "/employee/profile/bank-verification",
      color: "text-primary",
      badge: bankVerifStatus,
    },
  ];

  const statusBadgeVariant = (status: string | null) => {
    if (!status) return "secondary";
    if (status === "verified") return "default";
    if (status === "rejected") return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <ProfilePhotoUpload />
        <div className="flex-1 min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            {Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Employee"}
            {isVerified && <BadgeCheck className="h-5 w-5 text-accent" />}
          </h1>
          <p className="text-sm text-muted-foreground">
            {Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—"} •{" "}
            <Badge variant={profile?.approval_status === "approved" ? "default" : "secondary"} className="text-[10px]">
              {profile?.approval_status ?? "pending"}
            </Badge>
          </p>
        </div>
      </div>

      {/* Wallet Number */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Wallet className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Wallet Number</p>
            <p className="text-base font-mono font-semibold text-foreground tracking-wider">
              {(profile as any)?.wallet_number ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profile Completion</span>
            <span className="font-semibold text-foreground">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
        </CardContent>
      </Card>

      {/* Navigation Menu */}
      <div className="space-y-2">
        {sections.map((section) => (
          <button
            key={section.path}
            onClick={() => navigate(section.path)}
            className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/50 active:scale-[0.98]"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted ${section.color}`}>
              <section.icon className="h-5 w-5" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground">{section.label}</span>
            {section.badge && (
              <Badge variant={statusBadgeVariant(section.badge)} className="text-[10px] capitalize mr-1">
                {section.badge}
              </Badge>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmployeeProfile;
