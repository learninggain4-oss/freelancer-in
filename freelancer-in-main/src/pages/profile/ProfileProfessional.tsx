import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Briefcase, Save, X, Edit, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

const ProfileProfessional = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { pathname } = useLocation();
  const base = pathname.startsWith("/freelancer") ? "/freelancer" : pathname.startsWith("/employer") ? "/employer" : "/employee";

  const startEditing = () => {
    setForm({
      education_level: profile?.education_level ?? "",
      education_background: profile?.education_background ?? "",
      work_experience: profile?.work_experience ?? "",
      previous_job_details: profile?.previous_job_details ?? "",
    });
    setEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update(form as any).eq("id", profile!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated successfully.");
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

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${base}/profile`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Professional</h1>
        {!editing && (
          <Button variant="outline" size="sm" className="ml-auto" onClick={startEditing}>
            <Edit className="mr-1 h-3 w-3" /> Edit
          </Button>
        )}
      </div>

      {editing ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-1">
              <Label className="text-xs">Education Level</Label>
              <Input value={form.education_level ?? ""} onChange={(e) => setForm((p) => ({ ...p, education_level: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Education Background</Label>
              <Input value={form.education_background ?? ""} onChange={(e) => setForm((p) => ({ ...p, education_background: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Work Experience</Label>
              <Input value={form.work_experience ?? ""} onChange={(e) => setForm((p) => ({ ...p, work_experience: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Previous Jobs</Label>
              <Input value={form.previous_job_details ?? ""} onChange={(e) => setForm((p) => ({ ...p, previous_job_details: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="mr-1 h-3 w-3" /> Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-1 pt-6">
            <InfoRow icon={GraduationCap} label="Education Level" value={profile?.education_level} />
            <InfoRow icon={GraduationCap} label="Education Background" value={profile?.education_background} />
            <InfoRow icon={Briefcase} label="Work Experience" value={profile?.work_experience} />
            <InfoRow icon={Briefcase} label="Previous Jobs" value={profile?.previous_job_details} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileProfessional;
