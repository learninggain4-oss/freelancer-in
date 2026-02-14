import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, Building2, Calendar, Phone, User, AlertCircle,
  Tag, IndianRupee, FileText,
} from "lucide-react";

interface Props {
  profileId: string;
}

const ProfileRegistrationData = ({ profileId }: Props) => {
  const { data: workExperiences = [] } = useQuery({
    queryKey: ["work-experiences", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data } = await supabase
        .from("work_experiences")
        .select("*")
        .eq("profile_id", profileId)
        .order("start_year", { ascending: false });
      return data || [];
    },
  });

  const { data: emergencyContacts = [] } = useQuery({
    queryKey: ["emergency-contacts", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data } = await supabase
        .from("employee_emergency_contacts")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at");
      return data || [];
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["employee-services", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data } = await supabase
        .from("employee_services")
        .select("*, service_categories(name), employee_skill_selections(skill_id, service_skills(name))")
        .eq("profile_id", profileId)
        .order("created_at");
      return data || [];
    },
  });

  return (
    <>
      {/* Work Experiences */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" /> Work Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workExperiences.length === 0 ? (
            <p className="text-sm text-muted-foreground">No work experience added</p>
          ) : (
            <div className="space-y-4">
              {workExperiences.map((w: any, i: number) => (
                <div key={w.id} className={i > 0 ? "border-t pt-3" : ""}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{w.company_name}</p>
                    <Badge variant="outline" className="text-[10px] capitalize">{w.company_type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {w.start_year} – {w.is_current ? "Present" : w.end_year || "N/A"}
                  </p>
                  {w.work_description && (
                    <p className="text-xs text-muted-foreground mt-1">{w.work_description}</p>
                  )}
                  {w.certificate_name && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                      <FileText className="h-3 w-3" />
                      <span>{w.certificate_name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4" /> Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emergencyContacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No emergency contacts added</p>
          ) : (
            <div className="space-y-3">
              {emergencyContacts.map((c: any, i: number) => (
                <div key={c.id} className={i > 0 ? "border-t pt-3" : ""}>
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.contact_name}</p>
                      <p className="text-xs text-muted-foreground">{c.relationship}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span>{c.contact_phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" /> Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services added</p>
          ) : (
            <div className="space-y-4">
              {services.map((s: any, i: number) => (
                <div key={s.id} className={i > 0 ? "border-t pt-3" : ""}>
                  <p className="text-sm font-semibold text-foreground">{s.service_title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(s as any).service_categories?.name || "Uncategorized"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {s.hourly_rate}/hr
                    </span>
                    <span>Min ₹{s.minimum_budget}</span>
                  </div>
                  {(s as any).employee_skill_selections?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(s as any).employee_skill_selections.map((sel: any) => (
                        <Badge key={sel.skill_id} variant="secondary" className="text-[10px]">
                          {sel.service_skills?.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ProfileRegistrationData;
