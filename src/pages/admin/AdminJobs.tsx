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

const statusColor: Record<string, string> = {
  open: "bg-accent/10 text-accent", in_progress: "bg-primary/10 text-primary",
  payment_processing: "bg-warning/10 text-warning", completed: "bg-primary/10 text-primary",
  draft: "bg-muted text-muted-foreground", cancelled: "bg-destructive/10 text-destructive",
};

const AdminJobs = () => {
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Job Management</h1>
        <p className="text-sm text-muted-foreground">Manage all platform jobs and projects</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Jobs", value: projects.length, icon: Briefcase, color: "text-primary", bg: "bg-primary/10" },
          { label: "Open", value: openJobs, icon: CheckCircle, color: "text-accent", bg: "bg-accent/10" },
          { label: "In Progress", value: inProgressJobs, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
          { label: "Total Budget", value: `₹${totalBudget.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", s.bg)}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch checked={showCleared} onCheckedChange={setShowCleared} id="show-cleared-jobs" />
          <Label htmlFor="show-cleared-jobs" className="text-xs text-muted-foreground">Show cleared</Label>
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-3">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />) : projects.length > 0 ? projects.map((p: any) => (
          <Card key={p.id} className={cn("transition-all hover:shadow-md", p.is_cleared && "opacity-50 border-dashed")}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground shrink-0">
                    {p.name?.[0]?.toUpperCase() || "J"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {p.order_id} • {p.client?.full_name?.[0] || "Client"} ({p.client?.user_code?.[0] || ""})
                      {p.category?.name ? ` • ${p.category.name}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {p.is_cleared && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
                  <Badge className={cn("text-xs", statusColor[p.status])}>{p.status?.replace("_", " ")}</Badge>
                  {p.admin_approved && <Badge variant="outline" className="text-[10px] border-accent text-accent">✓ Approved</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Budget</p>
                  <p className="text-sm font-semibold text-foreground">₹{Number(p.amount).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Val. Fees</p>
                  <p className="text-sm font-semibold text-foreground">₹{Number(p.validation_fees).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Deadline</p>
                  <p className="text-sm font-semibold text-foreground">{p.end_date || "None"}</p>
                </div>
              </div>

              {p.assigned_employee && (
                <p className="text-xs text-muted-foreground">Assigned: <span className="font-medium text-foreground">{p.assigned_employee.full_name?.[0]}</span></p>
              )}

              <div className="flex gap-1.5 flex-wrap pt-1">
                <Button size="sm" variant="outline" onClick={() => setViewProject(p)} className="h-8"><Eye className="mr-1 h-3 w-3" /> View</Button>
                <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="h-8">
                  {expandedEdit === p.id ? <ChevronUp className="mr-1 h-3 w-3" /> : <Pencil className="mr-1 h-3 w-3" />}
                  {expandedEdit === p.id ? "Close" : "Edit"}
                </Button>
                {!p.admin_approved ? (
                  <Button size="sm" onClick={() => approveMutation.mutate({ id: p.id, approved: true })} className="h-8"><CheckCircle className="mr-1 h-3 w-3" /> Approve</Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => approveMutation.mutate({ id: p.id, approved: false })} className="h-8"><XCircle className="mr-1 h-3 w-3" /> Revoke</Button>
                )}
                {p.is_cleared ? (
                  <Button size="sm" variant="outline" onClick={() => restoreMutation.mutate(p.id)} className="h-8">Restore</Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-destructive h-8"><EyeOff className="mr-1 h-3 w-3" /> Clear</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Clear "{p.name}"?</AlertDialogTitle><AlertDialogDescription>Soft-delete. Can be restored.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => clearMutation.mutate(p.id)}>Clear</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {expandedEdit === p.id && (
                <div className="mt-2 space-y-3 rounded-xl border bg-muted/20 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={editForm.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
                    <div className="space-y-1"><Label className="text-xs">Budget (₹)</Label><Input type="number" value={editForm.amount} onChange={e => setEditForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
                    <div className="space-y-1"><Label className="text-xs">Status</Label>
                      <Select value={editForm.status} onValueChange={v => setEditForm((f: any) => ({ ...f, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem><SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Requirements</Label><Textarea value={editForm.requirements} onChange={e => setEditForm((f: any) => ({ ...f, requirements: e.target.value }))} rows={2} /></div>
                  <div className="space-y-1"><Label className="text-xs">Remarks</Label><Textarea value={editForm.remarks || ""} onChange={e => setEditForm((f: any) => ({ ...f, remarks: e.target.value }))} rows={2} /></div>
                  <Button className="w-full" onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending}><Save className="mr-1 h-3 w-3" /> {updateMutation.isPending ? "Saving..." : "Save"}</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No jobs found</p>
          </div>
        )}
      </div>

      <Dialog open={!!viewProject} onOpenChange={() => setViewProject(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewProject?.name}</DialogTitle></DialogHeader>
          {viewProject && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Order ID", value: viewProject.order_id },
                  { label: "Status", value: <Badge className={statusColor[viewProject.status]}>{viewProject.status}</Badge> },
                  { label: "Budget", value: `₹${Number(viewProject.amount).toLocaleString("en-IN")}` },
                  { label: "Val. Fee", value: `₹${Number(viewProject.validation_fees).toLocaleString("en-IN")}` },
                  { label: "Category", value: viewProject.category?.name || "N/A" },
                  { label: "Approved", value: viewProject.admin_approved ? "Yes" : "No" },
                ].map(item => (
                  <div key={item.label} className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    <div className="text-sm font-medium text-foreground mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
              {viewProject.summary && <div><span className="font-medium">Summary:</span><p className="text-muted-foreground">{viewProject.summary}</p></div>}
              <div><span className="font-medium">Requirements:</span><p className="text-muted-foreground whitespace-pre-wrap">{viewProject.requirements}</p></div>
              {viewProject.responsibility && <div><span className="font-medium">Responsibility:</span><p className="text-muted-foreground">{viewProject.responsibility}</p></div>}
              {viewProject.remarks && <div><span className="font-medium">Remarks:</span><p className="text-muted-foreground">{viewProject.remarks}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobs;
