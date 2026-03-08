import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
};

const EmployeeRequests = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["employee-requests", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("*, project:project_id(name)")
        .eq("employee_id", profile.id)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">My Requests</h1>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : requests.length > 0 ? (
          requests.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {r.project?.name ?? "Project"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Applied: {new Date(r.applied_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/employee/projects/chat/${r.project_id}`)
                      }
                    >
                      <MessageSquare className="mr-1 h-3 w-3" /> Chat
                    </Button>
                  )}
                  <Badge className={statusColor[r.status] ?? "bg-muted text-muted-foreground"}>
                    {r.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No job applications yet
          </p>
        )}
      </div>
    </div>
  );
};

export default EmployeeRequests;
