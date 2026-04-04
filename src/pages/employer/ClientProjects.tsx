import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, IndianRupee, Calendar, MessageSquare, Pencil, Trash2, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const statusColor: Record<string, string> = {
  open: "bg-accent/10 text-accent",
  in_progress: "bg-primary/10 text-primary",
  job_confirmed: "bg-primary/10 text-primary",
  payment_processing: "bg-warning/10 text-warning",
  validation: "bg-warning/10 text-warning",
  completed: "bg-primary/10 text-primary",
  draft: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  pending: "bg-warning/10 text-warning",
  approved: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
};

const ClientProjects = () => {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: myProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["employer-projects", profile?.id, search],
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
    queryKey: ["employer-applications", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("*, freelancer:employee_id(full_name, user_code, work_experience), project:project_id(name, client_id)")
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter((r: any) => r.project?.client_id === profile.id);
    },
    enabled: !!profile?.id,
  });

  const { data: submissions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ["employer-submissions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_submissions")
        .select("*, freelancer:employee_id(full_name), project:project_id(name, client_id)")
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
    <div className="space-y-6 p-4 pb-24 min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 shadow-2xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Jobs Dashboard</h1>
                <p className="text-xs font-medium text-white/70">Manage your projects & submissions</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => navigate("/employer/projects/create")}
              className="rounded-xl bg-white text-indigo-700 hover:bg-white/90 shadow-lg font-bold"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create New
            </Button>
          </div>

          <div className="relative mt-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
            <Input 
              placeholder="Search jobs by name..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="h-12 border-0 bg-white/10 pl-11 text-white placeholder:text-white/40 focus-visible:ring-white/30 rounded-2xl backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="w-full p-1 h-14 rounded-2xl border mb-6" style={{ background: T.nav, borderColor: T.border }}>
          <TabsTrigger value="projects" className="flex-1 rounded-xl text-xs font-bold data-[state=active]:shadow-lg" style={{ color: T.text }}>My Jobs</TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 rounded-xl text-xs font-bold data-[state=active]:shadow-lg" style={{ color: T.text }}>Requests</TabsTrigger>
          <TabsTrigger value="submissions" className="flex-1 rounded-xl text-xs font-bold data-[state=active]:shadow-lg" style={{ color: T.text }}>Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loadingProjects ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl opacity-20" />)
          ) : myProjects.length > 0 ? (
            myProjects.map((p: any) => (
              <Card key={p.id} className="border-0 shadow-xl group overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold tracking-tight" style={{ color: T.text }}>{p.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-tighter" style={{ borderColor: T.border, color: T.sub }}>{p.order_id}</Badge>
                        {p.category?.name && <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>• {p.category.name}</span>}
                      </div>
                    </div>
                    <Badge 
                      className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm"
                      style={{ 
                        background: `${statusColor[p.status]?.split(' ')[0]}20` || T.badge,
                        color: statusColor[p.status]?.split(' ')[1] || T.badgeFg,
                        border: `1px solid ${statusColor[p.status]?.split(' ')[1]}30`
                      }}
                    >
                      {p.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 p-3 rounded-xl" style={{ background: T.input, border: `1px solid ${T.border}` }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Budget</span>
                      <span className="flex items-center gap-1 text-sm font-black text-emerald-400"><IndianRupee className="h-3.5 w-3.5" />{Number(p.amount).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 rounded-xl" style={{ background: T.input, border: `1px solid ${T.border}` }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Deadline</span>
                      <span className="flex items-center gap-1 text-sm font-bold" style={{ color: T.text }}><Calendar className="h-3.5 w-3.5 text-indigo-400" />{p.end_date ?? "No deadline"}</span>
                    </div>
                  </div>

                  {!p.admin_approved && p.status !== "draft" && (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 border border-amber-500/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending Admin Approval</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {(p.status === "draft" || p.status === "open") && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-10 rounded-xl font-bold border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10" 
                          onClick={() => navigate(`/employer/projects/create?edit=${p.id}`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit Job
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-10 w-10 rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#070714] border-white/10 rounded-3xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Job?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">This action cannot be undone. All related applications will be lost.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white/5 border-white/10 text-white rounded-xl">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {(p.status === "in_progress" || p.status === "job_confirmed" || p.status === "payment_processing" || p.status === "validation" || p.status === "completed" || p.status === "cancelled") && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full h-11 rounded-2xl font-bold bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20" 
                        onClick={() => navigate(`/employer/projects/chat/${p.id}`)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" /> Validation Chat
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-white/5" style={{ background: T.card }}>
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-white/20" />
              </div>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.2em]">No jobs found</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loadingRequests ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl opacity-20" />)
          ) : requests.length > 0 ? (
            requests.map((r: any) => (
              <Card key={r.id} className="border-0 shadow-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-black" style={{ background: T.input, color: T.text, border: `1px solid ${T.border}` }}>
                        {r.freelancer?.full_name?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <h3 className="text-base font-bold tracking-tight" style={{ color: T.text }}>{r.freelancer?.full_name ?? "Freelancer"}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>{r.freelancer?.user_code} • {r.freelancer?.work_experience ?? "Fresh"}</p>
                      </div>
                    </div>
                    <Badge 
                      className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg"
                      style={{ 
                        background: `${statusColor[r.status]?.split(' ')[0]}20` || T.badge,
                        color: statusColor[r.status]?.split(' ')[1] || T.badgeFg,
                        border: `1px solid ${statusColor[r.status]?.split(' ')[1]}30`
                      }}
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-xl border border-white/5" style={{ background: T.input }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Applying for Job</p>
                    <p className="text-sm font-bold" style={{ color: T.text }}>{r.project?.name}</p>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-3 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1 h-11 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20" 
                        onClick={() => updateApplicationMutation.mutate({ id: r.id, status: "approved" })}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-11 rounded-2xl font-black border-rose-500/30 text-rose-500 hover:bg-rose-500/10" 
                        onClick={() => updateApplicationMutation.mutate({ id: r.id, status: "rejected" })}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-white/5" style={{ background: T.card }}>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.2em]">No requests yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loadingSubs ? (
            <Skeleton className="h-20 w-full rounded-2xl opacity-20" />
          ) : submissions.length > 0 ? (
            submissions.map((s: any) => (
              <Card key={s.id} className="border-0 shadow-xl" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold tracking-tight" style={{ color: T.text }}>{s.project?.name ?? "Job"}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>
                      Submitted by <span className="text-indigo-400">{s.freelancer?.full_name}</span> • {new Date(s.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1 font-black uppercase tracking-widest text-[9px] rounded-lg">
                    Submitted
                  </Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-white/5" style={{ background: T.card }}>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.2em]">No submissions yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientProjects;
