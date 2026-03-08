import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfileWorkExperience = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const base = profile?.user_type === "employee" ? "/employee" : "/client";

  const { data: workExperiences = [] } = useQuery({
    queryKey: ["work-experiences", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("work_experiences")
        .select("*")
        .eq("profile_id", profile!.id)
        .order("start_year", { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${base}/profile`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Work Experience</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {workExperiences.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No work experience added</p>
            </div>
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
    </div>
  );
};

export default ProfileWorkExperience;
