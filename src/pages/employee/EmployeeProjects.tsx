import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, IndianRupee, Calendar, User, FileText, Send, Tag,
  Paperclip, Sparkles, Briefcase, Filter, ChevronDown, MapPin, Inbox,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColor: Record<string, string> = {
  open: "bg-accent/10 text-accent border-accent/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-accent/10 text-accent border-accent/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  job_confirmed: "bg-primary/10 text-primary border-primary/20",
  payment_processing: "bg-warning/10 text-warning border-warning/20",
  validation: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const InquiryCard = ({ project: p, onApply, isPending }: { project: any; onApply: () => void; isPending: boolean }) => {
  const { data: docs = [] } = useQuery({
    queryKey: ["project-docs", p.id],
    queryFn: async () => {
      const { data } = await supabase.from("project_documents").select("id, file_name, file_path").eq("project_id", p.id);
      return data ?? [];
    },
  });

  const downloadDoc = async (filePath: string) => {
    const { data } = await supabase.storage.from("project-documents").createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all group">
      <div className="h-0.5 bg-gradient-to-r from-primary/60 via-accent/60 to-primary/60" />
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground font-mono">{p.order_id}</span>
                {p.category?.name && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 border-primary/20 text-primary">
                    <Tag className="h-2.5 w-2.5 mr-0.5" /> {p.category.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Badge className={cn("border text-[10px] shrink-0", statusColor[p.status])}>{p.status}</Badge>
        </div>

        {/* Summary / Requirements */}
        {p.summary && <p className="text-sm text-muted-foreground leading-relaxed">{p.summary}</p>}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{p.requirements}</p>
        {p.responsibility && (
          <div className="rounded-lg bg-muted/40 p-2.5 text-xs">
            <span className="font-semibold text-foreground">Responsibility:</span>{" "}
            <span className="text-muted-foreground">{p.responsibility}</span>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: IndianRupee, label: `₹${Number(p.amount).toLocaleString("en-IN")}`, sub: "Budget" },
            { icon: Calendar, label: p.end_date ?? "No deadline", sub: "Deadline" },
            { icon: User, label: p.client?.full_name?.[0] ?? "Client", sub: "Client" },
            { icon: FileText, label: `₹${Number(p.validation_fees).toLocaleString("en-IN")}`, sub: "Val. Fee" },
          ].map((info, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-lg bg-muted/30 p-2 border border-border/40">
              <info.icon className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{info.label}</p>
                <p className="text-[10px] text-muted-foreground">{info.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Documents */}
        {docs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Paperclip className="h-3 w-3" /> Attachments ({docs.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {docs.map((d: any) => (
                <Button key={d.id} variant="outline" size="sm" className="h-7 text-xs rounded-lg border-border/60" onClick={() => downloadDoc(d.file_path)}>
                  <FileText className="mr-1 h-3 w-3 text-primary" />
                  {d.file_name.length > 18 ? d.file_name.slice(0, 18) + "…" : d.file_name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Apply Button */}
        <Button
          size="sm"
          className="w-full gap-2 h-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm shadow-primary/20"
          onClick={onApply}
          disabled={isPending}
        >
          <Send className="h-4 w-4" /> Apply for this Job
        </Button>
      </CardContent>
    </Card>
  );
};

const EmployeeProjects = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [mySkillsActive, setMySkillsActive] = useState(false);
  const [confirmProject, setConfirmProject] = useState<any>(null);
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: mySkillCategoryIds = [] } = useQuery({
    queryKey: ["my-skill-categories", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase.from("employee_services").select("category_id").eq("profile_id", profile.id);
      if (error) throw error;
      return [...new Set(data.map((s: any) => s.category_id))];
    },
    enabled: !!profile?.id,
  });

  const toggleMySkills = () => { setMySkillsActive((prev) => !prev); setCategoryFilter("all"); };

  const { data: inquiries = [], isLoading: loadingInquiries } = useQuery({
    queryKey: ["employee-inquiries", search, categoryFilter, mySkillsActive, mySkillCategoryIds],
    queryFn: async () => {
      let query = supabase.from("projects")
        .select("*, client:client_id(full_name), category:category_id(name)")
        .eq("status", "open").order("created_at", { ascending: false });
      if (search) query = query.ilike("name", `%${search}%`);
      if (mySkillsActive && mySkillCategoryIds.length > 0) query = query.in("category_id", mySkillCategoryIds);
      else if (categoryFilter !== "all") query = query.eq("category_id", categoryFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("project_applications").insert({ project_id: projectId, employee_id: profile.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Application submitted!"); setConfirmProject(null); queryClient.invalidateQueries({ queryKey: ["employee-requests"] }); },
    onError: (e: any) => { toast.error(e.message); setConfirmProject(null); },
  });

  return (
    <div className="space-y-5 pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary-foreground/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Available Jobs</h1>
            <p className="text-xs text-primary-foreground/70">{inquiries.length} open positions</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl border-border/60 bg-muted/30 focus:bg-background"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setMySkillsActive(false); }} disabled={mySkillsActive}>
            <SelectTrigger className="flex-1 h-9 rounded-xl text-xs border-border/60">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mySkillCategoryIds.length > 0 && (
            <Button
              variant={mySkillsActive ? "default" : "outline"}
              size="sm"
              onClick={toggleMySkills}
              className={cn(
                "gap-1.5 rounded-xl h-9 text-xs",
                mySkillsActive && "bg-gradient-to-r from-accent to-accent/80 shadow-sm shadow-accent/20"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              My Skills
            </Button>
          )}
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-3">
        {loadingInquiries ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
        ) : inquiries.length > 0 ? (
          inquiries.map((p: any) => (
            <InquiryCard key={p.id} project={p} onApply={() => setConfirmProject(p)} isPending={applyMutation.isPending} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No open jobs available</p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-[220px]">
              Check back later or adjust your filters
            </p>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmProject} onOpenChange={(open) => { if (!open) setConfirmProject(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Application</AlertDialogTitle>
            <AlertDialogDescription>
              Apply for <span className="font-semibold text-foreground">"{confirmProject?.name}"</span>?
              {confirmProject?.amount && (
                <span className="block mt-2 text-foreground/80">
                  Budget: ₹{Number(confirmProject.amount).toLocaleString("en-IN")} • Fee: ₹{Number(confirmProject.validation_fees).toLocaleString("en-IN")}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmProject && applyMutation.mutate(confirmProject.id)}
              disabled={applyMutation.isPending}
              className="rounded-xl bg-gradient-to-r from-primary to-primary/80"
            >
              {applyMutation.isPending ? "Applying..." : "Yes, Apply"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeProjects;
