import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, User, Phone, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfileEmergencyContacts = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const base = profile?.user_type === "employee" ? "/employee" : "/client";

  const { data: emergencyContacts = [] } = useQuery({
    queryKey: ["emergency-contacts", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("employee_emergency_contacts")
        .select("*")
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
        <h1 className="text-xl font-bold text-foreground">Emergency Contacts</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {emergencyContacts.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No emergency contacts added</p>
            </div>
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
    </div>
  );
};

export default ProfileEmergencyContacts;
