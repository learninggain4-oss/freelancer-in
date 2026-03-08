import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, IndianRupee, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfileServices = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const base = profile?.user_type === "employee" ? "/employee" : "/client";

  const { data: services = [] } = useQuery({
    queryKey: ["employee-services", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("employee_services")
        .select("*, service_categories(name), employee_skill_selections(skill_id, service_skills(name))")
        .eq("profile_id", profile!.id)
        .order("created_at");
      return data || [];
    },
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${base}/profile`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Services</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {services.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Briefcase className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No services added</p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((s: any, i: number) => (
                <div key={s.id} className={i > 0 ? "border-t pt-3" : ""}>
                  <p className="text-sm font-semibold text-foreground">{s.service_title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.service_categories?.name || "Uncategorized"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {s.hourly_rate}/hr
                    </span>
                    <span>Min ₹{s.minimum_budget}</span>
                  </div>
                  {s.employee_skill_selections?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.employee_skill_selections.map((sel: any) => (
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
    </div>
  );
};

export default ProfileServices;
