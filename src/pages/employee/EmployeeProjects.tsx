import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  IndianRupee,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Send,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  open: "bg-accent/10 text-accent",
  pending: "bg-warning/10 text-warning",
  approved: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-primary/10 text-primary",
};

const EmployeeProjects = () => {
  const [search, setSearch] = useState("");
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch open projects (inquiries)
  const { data: inquiries = [], isLoading: loadingInquiries } = useQuery({
    queryKey: ["employee-inquiries", search],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, client:client_id(full_name)")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch my applications (requests)
  const { data: requests = [], isLoading: loadingRequests } = useQuery({
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

  // Fetch my submissions
  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ["employee-submissions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_submissions")
        .select("*, project:project_id(name, end_date)")
        .eq("employee_id", profile.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Apply to project
  const applyMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("project_applications").insert({
        project_id: projectId,
        employee_id: profile.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application submitted!");
      queryClient.invalidateQueries({ queryKey: ["employee-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-foreground">Projects</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="inquiries" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="inquiries" className="flex-1 text-xs">Inquiries</TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 text-xs">Requests</TabsTrigger>
          <TabsTrigger value="submissions" className="flex-1 text-xs">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="inquiries" className="mt-4 space-y-3">
          {loadingInquiries ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
          ) : inquiries.length > 0 ? (
            inquiries.map((p: any) => (
              <Card key={p.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <Badge className={statusColor[p.status]}>{p.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.requirements}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />₹{Number(p.amount).toLocaleString("en-IN")}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{p.end_date ?? "No deadline"}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.client?.full_name ?? "Client"}</span>
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" />Fee: ₹{Number(p.validation_fees).toLocaleString("en-IN")}</span>
                  </div>
                  <Button size="sm" className="w-full" onClick={() => applyMutation.mutate(p.id)} disabled={applyMutation.isPending}>
                    <Send className="mr-2 h-4 w-4" /> Apply
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No open projects available</p>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4 space-y-3">
          {loadingRequests ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : requests.length > 0 ? (
            requests.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{r.project?.name ?? "Project"}</h3>
                    <p className="text-xs text-muted-foreground">Applied: {new Date(r.applied_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className={statusColor[r.status]}>{r.status}</Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No applications yet</p>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-4 space-y-3">
          {loadingSubmissions ? (
            <Skeleton className="h-16 w-full" />
          ) : submissions.length > 0 ? (
            submissions.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{s.project?.name ?? "Project"}</h3>
                    <p className="text-xs text-muted-foreground">Submitted: {new Date(s.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary">Submitted</Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No submissions yet</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeProjects;
