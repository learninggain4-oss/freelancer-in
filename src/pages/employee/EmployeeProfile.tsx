import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Briefcase,
  AlertCircle,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

const EmployeeProfile = () => {
  const { profile } = useAuth();

  // Calculate profile completion
  const fields = [
    profile?.full_name,
    profile?.email,
    profile?.mobile_number,
    profile?.whatsapp_number,
    profile?.date_of_birth,
    profile?.gender,
    profile?.education_level,
    profile?.work_experience,
    profile?.bank_account_number,
    profile?.upi_id,
    profile?.emergency_contact_name,
    profile?.emergency_contact_phone,
  ];
  const filled = fields.filter(Boolean).length;
  const completion = Math.round((filled / fields.length) * 100);

  const handleEditRequest = () => {
    toast.info("Edit request sent to admin. You'll be notified once approved.");
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value || "Not provided"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{profile?.full_name ?? "Employee"}</h1>
          <p className="text-sm text-muted-foreground">
            {profile?.user_code ?? "—"} •{" "}
            <Badge variant={profile?.approval_status === "approved" ? "default" : "secondary"} className="text-[10px]">
              {profile?.approval_status ?? "pending"}
            </Badge>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleEditRequest}>
          <Edit className="mr-1 h-3 w-3" /> Edit
        </Button>
      </div>

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

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow icon={Mail} label="Email" value={profile?.email} />
          <InfoRow icon={Phone} label="Mobile" value={profile?.mobile_number} />
          <InfoRow icon={Phone} label="WhatsApp" value={profile?.whatsapp_number} />
          <InfoRow icon={Calendar} label="Date of Birth" value={profile?.date_of_birth} />
          <InfoRow icon={User} label="Gender" value={profile?.gender} />
          <InfoRow icon={User} label="Marital Status" value={profile?.marital_status} />
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" /> Professional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow icon={GraduationCap} label="Education Level" value={profile?.education_level} />
          <InfoRow icon={GraduationCap} label="Education Background" value={profile?.education_background} />
          <InfoRow icon={Briefcase} label="Work Experience" value={profile?.work_experience} />
          <InfoRow icon={Briefcase} label="Previous Jobs" value={profile?.previous_job_details} />
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4" /> Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow icon={User} label="Name" value={profile?.emergency_contact_name} />
          <InfoRow icon={Phone} label="Phone" value={profile?.emergency_contact_phone} />
          <InfoRow icon={User} label="Relationship" value={profile?.emergency_contact_relationship} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeProfile;
