import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, IndianRupee, Calendar, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const statusColor: Record<string, string> = {
  open: "bg-accent/10 text-accent",
  in_progress: "bg-primary/10 text-primary",
  payment_processing: "bg-warning/10 text-warning",
  completed: "bg-primary/10 text-primary",
  draft: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  pending: "bg-warning/10 text-warning",
  approved: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
};

const ClientProjects = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: myProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["client-projects", profile?.id, search],
    queryFn: async () => {
      if (!profile?.id) return [];
      let query = supabase
        .from("projects")
        .select("*, category:category_id(name)")
        .eq("client_id", profile.id)
        .order("created_at", { ascending: false });
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["client-applications", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("*, employee:employee_id(full_name, user_code, work_experience), project:project_id(name, client_id)")
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter((r: any) => r.project?.client_id === profile.id);
    },
    enabled: !!profile?.id,
  });

  const { data: submissions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ["client-submissions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_submissions")
        .select("*, employee:employee_id(full_name), project:project_id(name, client_id)")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter((s: any) => s.project?.client_id === profile.id);
    },
    enabled: !!profile?.id,
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("project_applications")
        .update({ status: status as any, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application updated");
      queryClient.invalidateQueries({ queryKey: ["client-applications"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job deleted");
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
        <Button size="sm" onClick={() => navigate("/client/projects/create")}><Plus className="mr-1 h-4 w-4" /> New</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="projects" className="flex-1 text-xs">My Jobs</TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 text-xs">Requests</TabsTrigger>
          <TabsTrigger value="submissions" className="flex-1 text-xs">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4 space-y-3">
          {loadingProjects ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : myProjects.length > 0 ? (
            myProjects.map((p: any) => (
              <Card key={p.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{p.order_id}{p.category?.name ? ` • ${p.category.name}` : ""}</p>
                    </div>
                    <Badge className={statusColor[p.status]}>{p.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />₹{Number(p.amount).toLocaleString("en-IN")}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{p.end_date ?? "No deadline"}</span>
                  </div>
                  {!p.admin_approved && p.status !== "draft" && (
                    <Badge variant="outline" className="text-xs text-warning border-warning">Pending Admin Approval</Badge>
                  )}
                  <div className="flex gap-2">
                    {(p.status === "draft" || p.status === "open") && (
                      <>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/client/projects/create?edit=${p.id}`)}>
                          <Pencil className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Job?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {(p.status === "in_progress" || p.status === "payment_processing" || p.status === "completed" || p.status === "cancelled") && (
                      <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/client/projects/chat/${p.id}`)}>
                        <MessageSquare className="mr-1 h-3 w-3" /> Validation Chat
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No jobs yet. Create one!</p>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4 space-y-3">
          {loadingRequests ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          ) : requests.length > 0 ? (
            requests.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{r.employee?.full_name ?? "Employee"}</h3>
                      <p className="text-xs text-muted-foreground">{r.employee?.user_code} • {r.employee?.work_experience ?? "N/A"}</p>
                    </div>
                    <Badge className={statusColor[r.status]}>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Job: {r.project?.name}</p>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => updateApplicationMutation.mutate({ id: r.id, status: "approved" })}>Approve</Button>
                      <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => updateApplicationMutation.mutate({ id: r.id, status: "rejected" })}>Reject</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No employee requests</p>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-4 space-y-3">
          {loadingSubs ? (
            <Skeleton className="h-16 w-full" />
          ) : submissions.length > 0 ? (
            submissions.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{s.project?.name ?? "Job"}</h3>
                    <p className="text-xs text-muted-foreground">{s.employee?.full_name} • {new Date(s.submitted_at).toLocaleDateString()}</p>
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

export default ClientProjects;
