import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Briefcase,
  Plus,
  Users,
  IndianRupee,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
};

const ClientDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: activeCount = 0 } = useQuery({
    queryKey: ["client-active-projects", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("client_id", profile.id)
        .in("status", ["open", "in_progress"]);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const { data: recentRequests = [], isLoading } = useQuery({
    queryKey: ["client-recent-requests", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("*, employee:employee_id(full_name), project:project_id(name, client_id)")
        .order("applied_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      // Filter to only this client's projects
      return (data ?? []).filter((r: any) => r.project?.client_id === profile.id);
    },
    enabled: !!profile?.id,
  });

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome, {profile?.full_name ?? "Client"}</h1>
        <p className="text-sm text-muted-foreground">Code: <span className="font-mono font-medium text-foreground">{profile?.user_code ?? "—"}</span></p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground"><Wallet className="h-4 w-4" /><span className="text-xs">Balance</span></div>
            <p className="mt-1 text-xl font-bold text-foreground"><IndianRupee className="inline h-4 w-4" />{(profile?.available_balance ?? 0).toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4" /><span className="text-xs">Active Projects</span></div>
            <p className="mt-1 text-xl font-bold text-foreground">{activeCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate("/client/projects/create")}>
          <Plus className="h-5 w-5 text-primary" /><span className="text-xs">New Project</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate("/client/wallet")}>
          <Wallet className="h-5 w-5 text-accent" /><span className="text-xs">Add Money</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" /> Employee Requests</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/client/projects")}>View All <ArrowRight className="ml-1 h-3 w-3" /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : recentRequests.length > 0 ? (
            recentRequests.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.employee?.full_name ?? "Employee"}</p>
                  <p className="text-xs text-muted-foreground">{r.project?.name ?? "Project"}</p>
                </div>
                <Badge className={statusColor[r.status]}>{r.status}</Badge>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No requests yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboard;
