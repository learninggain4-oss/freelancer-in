import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, IndianRupee, Calendar, CheckCircle, XCircle, Pencil, Eye, EyeOff, ChevronDown, ChevronUp, Save, Briefcase, Clock, TrendingUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const statusColor: Record<string, string> = {
  open: "bg-accent/10 text-accent", in_progress: "bg-primary/10 text-primary",
  payment_processing: "bg-warning/10 text-warning", completed: "bg-primary/10 text-primary",
  draft: "bg-muted text-muted-foreground", cancelled: "bg-destructive/10 text-destructive",
};

const AdminJobs = () => {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewProject, setViewProject] = useState<any>(null);
  const [expandedEdit, setExpandedEdit] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showCleared, setShowCleared] = useState(false);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["admin-jobs", search, statusFilter, showCleared],
    queryFn: async () => {
      let query = supabase.from("projects").select("*, client:client_id(full_name, user_code), category:category_id(name), assigned_employee:assigned_employee_id(full_name)").order("created_at", { ascending: false });
      if (search) query = query.ilike("name", `%${search}%`);
      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      if (!showCleared) query = query.eq("is_cleared", false);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase.from("projects").update({ admin_approved: approved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => { toast.success(approved ? "Approved!" : "Revoked"); queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const clearMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("projects").update({ is_cleared: true }).eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Cleared"); queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("projects").update({ is_cleared: false }).eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Restored"); queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (project: any) => {
      const { error } = await supabase.from("projects").update({ name: project.name, amount: Number(project.amount), requirements: project.requirements, status: project.status, remarks: project.remarks }).eq("id", project.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); setExpandedEdit(null); queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (p: any) => { if (expandedEdit === p.id) { setExpandedEdit(null); return; } setEditForm({ ...p }); setExpandedEdit(p.id); };

  // Stats
  const openJobs = projects.filter((p: any) => p.status === "open").length;
  const inProgressJobs = projects.filter((p: any) => p.status === "in_progress").length;
  const totalBudget = projects.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 border"
        style={{ 
          background: theme === 'black' 
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
            : 'linear-gradient(135deg, #6366f1 0%, #a5b4fc 100%)',
          borderColor: T.border 
        }}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Job Management</h1>
            <p className="text-white/80 font-medium">Manage all platform jobs and projects</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Jobs", value: projects.length, icon: Briefcase, color: "text-blue-400" },
          { label: "Open", value: openJobs, icon: CheckCircle, color: "text-emerald-400" },
          { label: "In Progress", value: inProgressJobs, icon: Clock, color: "text-amber-400" },
          { label: "Total Budget", value: `₹${totalBudget.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-violet-400" },
        ].map((s, idx) => (
          <Card key={idx} style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: T.sub }}>{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="text-xl font-bold" style={{ color: T.text }}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search jobs..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9" 
            style={{ background: T.input, borderColor: T.border, color: T.text }}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]" style={{ background: T.input, borderColor: T.border, color: T.text }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={{ background: theme === 'black' ? '#1a1a2e' : '#fff', borderColor: T.border }}>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 px-3 rounded-lg border" style={{ borderColor: T.border, background: T.nav }}>
          <Switch checked={showCleared} onCheckedChange={setShowCleared} id="show-cleared-jobs" />
          <Label htmlFor="show-cleared-jobs" className="text-xs cursor-pointer" style={{ color: T.sub }}>Show cleared</Label>
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />) : projects.length > 0 ? projects.map((p: any) => (
          <Card key={p.id} style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className={cn("transition-all hover:shadow-lg border-none shadow-none", p.is_cleared && "opacity-50 grayscale")}>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold shrink-0 border"
                    style={{ background: T.nav, borderColor: T.border, color: T.text }}
                  >
                    {p.name?.[0]?.toUpperCase() || "J"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: T.text }}>{p.name}</h3>
                    <p className="text-xs font-mono" style={{ color: T.sub }}>
                      {p.order_id} • {p.client?.full_name?.[0] || "Client"} ({p.client?.user_code?.[0] || ""})
                      {p.category?.name ? ` • ${p.category.name}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.is_cleared && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive bg-destructive/5">Cleared</Badge>}
                  <Badge className={cn("text-xs border-none", statusColor[p.status])}>{p.status?.replace("_", " ")}</Badge>
                  {p.admin_approved && <Badge variant="outline" className="text-[10px] border-accent/30 text-accent bg-accent/5">✓ Approved</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl px-4 py-3 border" style={{ background: T.nav, borderColor: T.border }}>
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: T.sub }}>Budget</p>
                  <p className="text-lg font-bold" style={{ color: T.text }}>₹{Number(p.amount).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-xl px-4 py-3 border" style={{ background: T.nav, borderColor: T.border }}>
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: T.sub }}>Val. Fees</p>
                  <p className="text-lg font-bold" style={{ color: T.text }}>₹{Number(p.validation_fees).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-xl px-4 py-3 border" style={{ background: T.nav, borderColor: T.border }}>
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: T.sub }}>Deadline</p>
                  <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: T.text }}>
                    <Calendar className="h-3.5 w-3.5 text-accent" />
                    {p.end_date || "None"}
                  </p>
                </div>
              </div>

              {p.assigned_employee && (
                <div className="flex items-center gap-2 text-xs py-2 px-3 rounded-lg w-fit" style={{ background: T.nav, color: T.sub }}>
                  <Users className="h-3.5 w-3.5" />
                  Assigned: <span className="font-bold" style={{ color: T.text }}>{p.assigned_employee.full_name?.[0]}</span>
                </div>
              )}

              <div className="flex gap-2 flex-wrap pt-2 border-t" style={{ borderColor: T.border }}>
                <Button size="sm" variant="outline" onClick={() => setViewProject(p)} className="h-9 rounded-xl border-white/10 hover:bg-white/5"><Eye className="mr-2 h-4 w-4" /> View Details</Button>
                <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="h-9 rounded-xl border-white/10 hover:bg-white/5">
                  {expandedEdit === p.id ? <ChevronUp className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                  {expandedEdit === p.id ? "Close Edit" : "Edit Job"}
                </Button>
                {!p.admin_approved ? (
                  <Button size="sm" onClick={() => approveMutation.mutate({ id: p.id, approved: true })} className="h-9 rounded-xl bg-accent hover:bg-accent/90"><CheckCircle className="mr-2 h-4 w-4" /> Approve</Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => approveMutation.mutate({ id: p.id, approved: false })} className="h-9 rounded-xl"><XCircle className="mr-2 h-4 w-4" /> Revoke</Button>
                )}
                {p.is_cleared ? (
                  <Button size="sm" variant="outline" onClick={() => restoreMutation.mutate(p.id)} className="h-9 rounded-xl">Restore</Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-destructive h-9 rounded-xl hover:bg-destructive/5 hover:text-destructive border-destructive/20"><EyeOff className="mr-2 h-4 w-4" /> Clear</Button></AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#0a0a1a] border-white/10">
                      <AlertDialogHeader><AlertDialogTitle className="text-white">Clear "{p.name}"?</AlertDialogTitle><AlertDialogDescription>This will move the job to the cleared list (soft-delete). It can be restored later.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => clearMutation.mutate(p.id)} className="bg-destructive hover:bg-destructive/90 text-white">Clear Job</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {expandedEdit === p.id && (
                <div className="mt-4 space-y-4 rounded-2xl border bg-white/5 p-6 animate-in fade-in slide-in-from-top-2" style={{ borderColor: T.border }}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold" style={{ color: T.sub }}>Name</Label>
                      <Input value={editForm.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold" style={{ color: T.sub }}>Budget (₹)</Label>
                      <Input type="number" value={editForm.amount} onChange={e => setEditForm((f: any) => ({ ...f, amount: e.target.value }))} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold" style={{ color: T.sub }}>Status</Label>
                      <Select value={editForm.status} onValueChange={v => setEditForm((f: any) => ({ ...f, status: v }))}>
                        <SelectTrigger style={{ background: T.input, borderColor: T.border, color: T.text }}><SelectValue /></SelectTrigger>
                        <SelectContent style={{ background: theme === 'black' ? '#1a1a2e' : '#fff', borderColor: T.border }}>
                          <SelectItem value="draft">Draft</SelectItem><SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold" style={{ color: T.sub }}>Requirements</Label>
                    <Textarea value={editForm.requirements} onChange={e => setEditForm((f: any) => ({ ...f, requirements: e.target.value }))} rows={4} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold" style={{ color: T.sub }}>Remarks</Label>
                    <Textarea value={editForm.remarks || ""} onChange={e => setEditForm((f: any) => ({ ...f, remarks: e.target.value }))} rows={2} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 h-11 rounded-xl font-bold" onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                    {updateMutation.isPending ? "Updating..." : "Update Job Details"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )) : (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-dashed" style={{ borderColor: T.border }}>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 mb-6">
              <Briefcase className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-lg font-medium" style={{ color: T.sub }}>No jobs found</p>
            <p className="text-sm" style={{ color: T.sub }}>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <Dialog open={!!viewProject} onOpenChange={() => setViewProject(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-[#0a0a1a]/95 backdrop-blur-xl border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{viewProject?.name}</DialogTitle>
          </DialogHeader>
          {viewProject && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Order ID", value: viewProject.order_id },
                  { label: "Status", value: <Badge className={statusColor[viewProject.status]}>{viewProject.status}</Badge> },
                  { label: "Budget", value: `₹${Number(viewProject.amount).toLocaleString("en-IN")}` },
                  { label: "Val. Fee", value: `₹${Number(viewProject.validation_fees).toLocaleString("en-IN")}` },
                  { label: "Category", value: viewProject.category?.name || "N/A" },
                  { label: "Approved", value: viewProject.admin_approved ? "Yes" : "No" },
                ].map(item => (
                  <div key={item.label} className="rounded-2xl bg-white/5 p-4 border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider font-bold mb-1 opacity-50">{item.label}</p>
                    <div className="text-sm font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
              {viewProject.summary && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-50">Summary</p>
                  <p className="text-sm leading-relaxed">{viewProject.summary}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider opacity-50">Requirements</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap rounded-2xl bg-white/5 p-4 border border-white/5">{viewProject.requirements}</p>
              </div>
              {viewProject.responsibility && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-50">Responsibility</p>
                  <p className="text-sm leading-relaxed">{viewProject.responsibility}</p>
                </div>
              )}
              {viewProject.remarks && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-50">Admin Remarks</p>
                  <p className="text-sm leading-relaxed text-accent italic">"{viewProject.remarks}"</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobs;
