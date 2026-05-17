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
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  warm:  { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", input:"#fffdf7", nav:"#fef0d0", badge:"rgba(217,119,6,.1)", badgeFg:"#b45309" },
  forest: { bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", input:"#ffffff", nav:"#dcfce7", badge:"rgba(22,163,74,.1)", badgeFg:"#15803d" },
  ocean: { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", input:"#ffffff", nav:"#e0f2fe", badge:"rgba(14,165,233,.1)", badgeFg:"#0369a1" },
};

const statusColor: Record<string, string> = {
  open: "rgba(99,102,241,0.15)",
  pending: "rgba(180,83,9,0.12)",
  approved: "rgba(22,163,74,0.12)",
  rejected: "rgba(220,38,38,0.12)",
  in_progress: "rgba(37,99,235,0.12)",
  job_confirmed: "rgba(124,58,237,0.12)",
  payment_processing: "rgba(180,83,9,0.12)",
  validation: "rgba(180,83,9,0.12)",
  completed: "rgba(22,163,74,0.12)",
  cancelled: "rgba(220,38,38,0.12)",
};

const getStatusText = (isDark: boolean): Record<string, string> => ({
  open:               isDark ? "#818cf8" : "#4338ca",
  pending:            isDark ? "#fbbf24" : "#b45309",
  approved:           isDark ? "#4ade80" : "#16a34a",
  rejected:           isDark ? "#f87171" : "#dc2626",
  in_progress:        isDark ? "#60a5fa" : "#2563eb",
  job_confirmed:      isDark ? "#a78bfa" : "#7c3aed",
  payment_processing: isDark ? "#fbbf24" : "#b45309",
  validation:         isDark ? "#fbbf24" : "#b45309",
  completed:          isDark ? "#4ade80" : "#16a34a",
  cancelled:          isDark ? "#f87171" : "#dc2626",
});

const getInfoColors = (isDark: boolean) => ({
  budget:     isDark ? "#4ade80" : "#16a34a",
  date:       isDark ? "#fbbf24" : "#b45309",
  employer:   isDark ? "#60a5fa" : "#2563eb",
  validation: isDark ? "#f87171" : "#dc2626",
});

const InquiryCard = ({ project: p, onApply, isPending, T, isDark }: { project: any; onApply: () => void; isPending: boolean; T: any; isDark: boolean }) => {
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

  const statusTextMap = getStatusText(isDark);
  const infoColors = getInfoColors(isDark);
  const sColor = statusColor[p.status] || (isDark ? "rgba(148,163,184,0.2)" : "rgba(100,116,139,0.12)");
  const sText = statusTextMap[p.status] || (isDark ? "#94a3b8" : "#475569");

  return (
    <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="overflow-hidden border shadow-xl hover:shadow-2xl transition-all group relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#6366f1] opacity-50" />
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-4 min-w-0">
            <div style={{ background: "rgba(99,102,241,0.15)" }} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
              <Briefcase className="h-6 w-6 text-[#6366f1]" />
            </div>
            <div className="min-w-0">
              <h3 style={{ color: T.text }} className="font-bold text-lg leading-tight truncate">{p.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span style={{ color: T.sub }} className="text-[10px] font-black uppercase tracking-widest">{p.order_id}</span>
                {p.category?.name && (
                  <Badge style={{ background: "rgba(99,102,241,0.1)", color: T.badgeFg, borderColor: "rgba(99,102,241,0.25)" }} variant="outline" className="text-[10px] h-5 px-2 py-0 border">
                    <Tag className="h-3 w-3 mr-1" /> {p.category.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Badge style={{ background: sColor, color: sText, borderColor: sText + "40" }} className="border text-[10px] font-bold uppercase tracking-widest shrink-0 px-2.5 py-1">
            {p.status}
          </Badge>
        </div>

        {/* Summary / Requirements */}
        <div className="space-y-2">
          {p.summary && <p style={{ color: T.sub }} className="text-sm leading-relaxed font-medium line-clamp-2">{p.summary}</p>}
          <p style={{ color: T.text }} className="text-sm leading-relaxed opacity-90 line-clamp-3">{p.requirements}</p>
        </div>

        {p.responsibility && (
          <div style={{ background: T.nav, borderColor: T.border }} className="rounded-xl p-4 text-xs border">
            <span style={{ color: T.text }} className="font-black uppercase tracking-wider block mb-1">Key Responsibility</span>
            <span style={{ color: T.sub }} className="font-medium">{p.responsibility}</span>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: IndianRupee, label: `₹${Number(p.amount).toLocaleString("en-IN")}`, sub: "Project Budget", color: infoColors.budget },
            { icon: Calendar, label: p.end_date ?? "Unlimited", sub: "Submission Goal", color: infoColors.date },
            { icon: User, label: p.employer?.full_name?.[0] ?? "Elite Employer", sub: "Posted By", color: infoColors.employer },
            { icon: FileText, label: `₹${Number(p.validation_fees).toLocaleString("en-IN")}`, sub: "Validation Fee", color: infoColors.validation },
          ].map((info, idx) => (
            <div key={idx} style={{ background: T.nav, borderColor: T.border }} className="flex items-center gap-3 rounded-2xl p-3 border group/item hover:border-[#6366f1]/50 transition-colors">
              <div style={{ background: info.color + "15" }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <info.icon style={{ color: info.color }} className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p style={{ color: T.text }} className="text-sm font-bold truncate">{info.label}</p>
                <p style={{ color: T.sub }} className="text-[10px] font-bold uppercase tracking-wider opacity-70">{info.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Documents */}
        {docs.length > 0 && (
          <div className="pt-2">
            <p style={{ color: T.text }} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-2 opacity-80">
              <Paperclip className="h-3 w-3" /> Technical Attachments ({docs.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {docs.map((d: any) => (
                <Button key={d.id} variant="outline" style={{ background: T.card, borderColor: T.border, color: T.text }} className="h-8 text-[11px] font-bold rounded-xl hover:border-[#6366f1]/50" onClick={() => downloadDoc(d.file_path)}>
                  <FileText className="mr-1.5 h-3.5 w-3.5 text-[#6366f1]" />
                  {d.file_name.length > 20 ? d.file_name.slice(0, 20) + "…" : d.file_name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Apply Button */}
        <Button
          size="lg"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          className="w-full gap-2 h-12 text-sm font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all border-0 text-white"
          onClick={onApply}
          disabled={isPending}
        >
          <Send className="h-5 w-5" /> Express Interest
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
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const isDark = theme === "black";

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
    queryKey: ["freelancer-inquiries", search, categoryFilter, mySkillsActive, mySkillCategoryIds],
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
    onSuccess: () => { toast.success("Application submitted!"); setConfirmProject(null); queryClient.invalidateQueries({ queryKey: ["freelancer-requests"] }); },
    onError: (e: any) => { toast.error(e.message); setConfirmProject(null); },
  });

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text }} className="space-y-6 p-4 pb-24">
      {/* Hero Header */}
      <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }} className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-xl">
            <Briefcase className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Job Terminal</h1>
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{inquiries.length} Opportunities detected</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#6366f1]" />
          <Input
            placeholder="Search premium roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: T.card, borderColor: T.border, color: T.text }}
            className="pl-12 h-14 rounded-2xl border text-base font-medium placeholder:opacity-50 focus:ring-2 focus:ring-[#6366f1]/30 transition-all"
          />
        </div>
        <div className="flex gap-3">
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setMySkillsActive(false); }} disabled={mySkillsActive}>
            <SelectTrigger style={{ background: T.card, borderColor: T.border, color: T.text }} className="flex-1 h-11 rounded-2xl text-xs font-bold uppercase tracking-wider border">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 opacity-70" />
                <SelectValue placeholder="Industry Filter" />
              </div>
            </SelectTrigger>
            <SelectContent style={{ background: T.card, borderColor: T.border }}>
              <SelectItem value="all">Global Catalog</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mySkillCategoryIds.length > 0 && (
            <Button
              variant={mySkillsActive ? "default" : "outline"}
              onClick={toggleMySkills}
              style={mySkillsActive ? { background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)", borderColor: "transparent" } : { background: T.card, borderColor: T.border, color: T.text }}
              className={cn(
                "gap-2 rounded-2xl h-11 text-[10px] font-black uppercase tracking-[0.15em] border px-4 shadow-xl transition-all",
                mySkillsActive && "text-white shadow-indigo-500/20"
              )}
            >
              <Sparkles className="h-4 w-4" />
              My Radar
            </Button>
          )}
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {loadingInquiries ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} style={{ background: T.card }} className="h-64 w-full rounded-3xl opacity-50" />)
        ) : inquiries.length > 0 ? (
          inquiries.map((p: any) => (
            <InquiryCard key={p.id} project={p} onApply={() => setConfirmProject(p)} isPending={applyMutation.isPending} T={T} isDark={isDark} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div style={{ background: T.card, borderColor: T.border }} className="flex h-24 w-24 items-center justify-center rounded-[2.5rem] border shadow-2xl mb-6">
              <Inbox style={{ color: T.sub }} className="h-10 w-10 opacity-30" />
            </div>
            <p style={{ color: T.text }} className="text-lg font-black uppercase tracking-widest">No Jobs Detected</p>
            <p style={{ color: T.sub }} className="text-xs font-bold mt-2 max-w-[280px] leading-relaxed opacity-70 uppercase tracking-tighter">
              The market is quiet right now. Expand your filters or update your skill radar.
            </p>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmProject} onOpenChange={(open) => { if (!open) setConfirmProject(null); }}>
        <AlertDialogContent style={{ background: T.bg, borderColor: T.border }} className="rounded-3xl border shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.text }} className="text-xl font-black uppercase tracking-tight">Initiate Application?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.sub }} className="text-sm font-medium leading-relaxed">
              Expressing interest for <span style={{ color: "#6366f1" }} className="font-black">"{confirmProject?.name}"</span>. 
              {confirmProject?.amount && (
                <span style={{ background: T.nav }} className="block mt-4 p-4 rounded-2xl border border-white/5 font-bold">
                  Budget: ₹{Number(confirmProject.amount).toLocaleString("en-IN")} <br/>
                  <span className="text-[10px] opacity-60 uppercase tracking-widest mt-1 block">Validation: ₹{Number(confirmProject.validation_fees).toLocaleString("en-IN")}</span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-6">
            <AlertDialogCancel style={{ background: T.card, borderColor: T.border, color: T.text }} className="rounded-2xl border-0 font-bold uppercase tracking-widest text-xs h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmProject && applyMutation.mutate(confirmProject.id)}
              disabled={applyMutation.isPending}
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
              className="rounded-2xl border-0 font-black uppercase tracking-[0.15em] text-xs h-12 text-white shadow-xl shadow-indigo-500/20"
            >
              {applyMutation.isPending ? "Transmitting..." : "Confirm Application"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeProjects;
