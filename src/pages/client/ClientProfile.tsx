import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  User, Mail, Phone, Calendar, GraduationCap, Briefcase,
  BadgeCheck, Save, X, Landmark, Edit, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import AadhaarVerificationCard from "@/components/verification/AadhaarVerificationCard";
import BankVerificationCard from "@/components/verification/BankVerificationCard";
import ProfileRegistrationData from "@/components/profile/ProfileRegistrationData";
import ProfilePhotoUpload from "@/components/profile/ProfilePhotoUpload";
import ReviewsList from "@/components/reviews/ReviewsList";

const ClientProfile = () => {
  const { profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

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

  const isVerified = aadhaarStatus === "verified";

  const fields = [
    profile?.full_name, profile?.email, profile?.mobile_number,
    profile?.whatsapp_number, profile?.date_of_birth, profile?.gender,
    profile?.education_level, profile?.work_experience,
    profile?.emergency_contact_name, profile?.emergency_contact_phone,
  ];
  const filled = fields.filter(Boolean).length;
  const completion = Math.round((filled / fields.length) * 100);

  const startEditing = () => {
    setForm({
      mobile_number: profile?.mobile_number ?? "",
      whatsapp_number: profile?.whatsapp_number ?? "",
      education_level: profile?.education_level ?? "",
      work_experience: profile?.work_experience ?? "",
      emergency_contact_name: profile?.emergency_contact_name ?? "",
      emergency_contact_phone: profile?.emergency_contact_phone ?? "",
      emergency_contact_relationship: profile?.emergency_contact_relationship ?? "",
      bank_holder_name: (profile as any)?.bank_holder_name ?? "",
      bank_name: profile?.bank_name ?? "",
      bank_account_number: profile?.bank_account_number ?? "",
      bank_ifsc_code: profile?.bank_ifsc_code ?? "",
      upi_id: profile?.upi_id ?? "",
    });
    setEditing(true);
  };

  const saveEditMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update(form as any)
        .eq("id", profile!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully.");
      setEditing(false);
      refreshProfile();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value || "Not provided"}</p>
      </div>
    </div>
  );

  const EditField = ({ label, field }: { label: string; field: string }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        value={form[field] ?? ""}
        onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="space-y-6 p-4">
      {/* Header with Photo */}
      <div className="flex items-start gap-4">
        <ProfilePhotoUpload />
        <div className="flex-1 min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            {profile?.full_name ?? "Client"}
            {isVerified && <BadgeCheck className="h-5 w-5 text-accent" />}
          </h1>
          <p className="text-sm text-muted-foreground">
            {profile?.user_code ?? "—"} •{" "}
            <Badge variant={profile?.approval_status === "approved" ? "default" : "secondary"} className="text-[10px]">
              {profile?.approval_status ?? "pending"}
            </Badge>
          </p>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Edit className="mr-1 h-3 w-3" /> Edit
          </Button>
        )}
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

      {/* Editing Form */}
      {editing && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Edit Your Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <EditField label="Mobile Number" field="mobile_number" />
            <EditField label="WhatsApp Number" field="whatsapp_number" />
            <EditField label="Education Level" field="education_level" />
            <EditField label="Work Experience" field="work_experience" />
            <EditField label="Emergency Contact Name" field="emergency_contact_name" />
            <EditField label="Emergency Contact Phone" field="emergency_contact_phone" />
            <EditField label="Emergency Contact Relationship" field="emergency_contact_relationship" />
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Bank Details</p>
              <div className="space-y-3">
                <EditField label="Account Holder Name" field="bank_holder_name" />
                <EditField label="Bank Name" field="bank_name" />
                <EditField label="Account Number" field="bank_account_number" />
                <EditField label="IFSC Code" field="bank_ifsc_code" />
                <EditField label="UPI ID" field="upi_id" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => saveEditMutation.mutate()} disabled={saveEditMutation.isPending}>
                <Save className="mr-1 h-3 w-3" /> Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profile Completion</span>
            <span className="font-semibold text-foreground">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Personal</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          <InfoRow icon={Mail} label="Email" value={profile?.email} />
          <InfoRow icon={Phone} label="Mobile" value={profile?.mobile_number} />
          <InfoRow icon={Phone} label="WhatsApp" value={profile?.whatsapp_number} />
          <InfoRow icon={Calendar} label="Date of Birth" value={profile?.date_of_birth} />
          <InfoRow icon={User} label="Gender" value={profile?.gender} />
          <InfoRow icon={User} label="Marital Status" value={profile?.marital_status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Briefcase className="h-4 w-4" /> Professional</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          <InfoRow icon={GraduationCap} label="Education" value={profile?.education_level} />
          <InfoRow icon={Briefcase} label="Experience" value={profile?.work_experience} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-4 w-4" /> Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow icon={User} label="Account Holder Name" value={(profile as any)?.bank_holder_name} />
          <InfoRow icon={Landmark} label="Bank Name" value={profile?.bank_name} />
          <InfoRow icon={Landmark} label="Account Number" value={profile?.bank_account_number} />
          <InfoRow icon={Landmark} label="IFSC Code" value={profile?.bank_ifsc_code} />
          <InfoRow icon={Landmark} label="UPI ID" value={profile?.upi_id} />
        </CardContent>
      </Card>

      {profile?.id && <ProfileRegistrationData profileId={profile.id} />}

      {profile?.id && <ReviewsList profileId={profile.id} />}

      <AadhaarVerificationCard />
      <BankVerificationCard />
    </div>
  );
};

export default ClientProfile;
