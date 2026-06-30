import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Send,
  Tag,
  Paperclip,
  Sparkles,
  Briefcase,
  Filter,
  ChevronDown,
  MapPin,
  Inbox,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: {
    bg: "#070714",
    card: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.08)",
    text: "#e2e8f0",
    sub: "#94a3b8",
    input: "rgba(255,255,255,.07)",
    nav: "rgba(255,255,255,.04)",
    badge: "rgba(99,102,241,.2)",
    badgeFg: "#a5b4fc",
  },
  white: {
    bg: "#f0f4ff",
    card: "#ffffff",
    border: "rgba(0,0,0,.08)",
    text: "#1e293b",
    sub: "#64748b",
    input: "#f8fafc",
    nav: "#f1f5f9",
    badge: "rgba(99,102,241,.1)",
    badgeFg: "#4f46e5",
  },
  wb: {
    bg: "#f0f4ff",
    card: "#ffffff",
    border: "rgba(0,0,0,.08)",
    text: "#1e293b",
    sub: "#64748b",
    input: "#f8fafc",
    nav: "#f1f5f9",
    badge: "rgba(99,102,241,.1)",
    badgeFg: "#4f46e5",
  },
  warm: {
    bg: "#fef6e4",
    card: "#fffdf7",
    border: "rgba(180,83,9,.1)",
    text: "#1c1a17",
    sub: "#78716c",
    input: "#fffdf7",
    nav: "#fef0d0",
    badge: "rgba(217,119,6,.1)",
    badgeFg: "#b45309",
  },
  forest: {
    bg: "#f1faf4",
    card: "#ffffff",
    border: "rgba(21,128,61,.1)",
    text: "#0f2d18",
    sub: "#4b7c5d",
    input: "#ffffff",
    nav: "#dcfce7",
    badge: "rgba(22,163,74,.1)",
    badgeFg: "#15803d",
  },
  ocean: {
    bg: "#f0f9ff",
    card: "#ffffff",
    border: "rgba(14,165,233,.1)",
    text: "#0c4a6e",
    sub: "#4b83a3",
    input: "#ffffff",
    nav: "#e0f2fe",
    badge: "rgba(14,165,233,.1)",
    badgeFg: "#0369a1",
  },
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
  open: isDark ? "#818cf8" : "#4338ca",
  pending: isDark ? "#fbbf24" : "#b45309",
  approved: isDark ? "#4ade80" : "#16a34a",
  rejected: isDark ? "#f87171" : "#dc2626",
  in_progress: isDark ? "#60a5fa" : "#2563eb",
  job_confirmed: isDark ? "#a78bfa" : "#7c3aed",
  payment_processing: isDark ? "#fbbf24" : "#b45309",
  validation: isDark ? "#fbbf24" : "#b45309",
  completed: isDark ? "#4ade80" : "#16a34a",
  cancelled: isDark ? "#f87171" : "#dc2626",
});

const getInfoColors = (isDark: boolean) => ({
  budget: isDark ? "#4ade80" : "#16a34a",
  date: isDark ? "#fbbf24" : "#b45309",
  employer: isDark ? "#60a5fa" : "#2563eb",
  validation: isDark ? "#f87171" : "#dc2626",
});

const InquiryCard = ({
  project: p,
  onApply,
  isPending,
  T,
  isDark,
}: {
  project: any;
  onApply: () => void;
  isPending: boolean;
  T: any;
  isDark: boolean;
}) => {
  const { data: docs = [] } = useQuery({
    queryKey: ["project-docs", p.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_documents")
        .select("id, file_name, file_path")
        .eq("project_id", p.id);
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
    <Card
      style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(16px)" }}
      className="overflow-hidden border shadow-sm hover:shadow-xl hover:scale-[1.01] hover:border-[#6366f1]/30 transition-all duration-300 group relative flex flex-col justify-between rounded-2xl"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#6366f1] opacity-40 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                style={{ background: "rgba(99,102,241,0.12)" }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300"
              >
                <Briefcase className="h-5 w-5 text-[#6366f1]" />
              </div>
              <div className="min-w-0">
                <h3
                  style={{ color: T.text }}
                  className="font-bold text-base leading-tight truncate group-hover:text-[#6366f1] transition-colors"
                >
                  {p.name}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span style={{ color: T.sub }} className="text-[10px] font-semibold tracking-wider opacity-80">
                    {p.order_id}
                  </span>
                  {p.category?.name && (
                    <Badge
                      style={{
                        background: "rgba(99,102,241,0.06)",
                        color: T.badgeFg,
                        borderColor: "rgba(99,102,241,0.15)",
                      }}
                      variant="outline"
                      className="text-[10px] h-5 px-2 py-0 border font-medium rounded-md"
                    >
                      <Tag className="h-2.5 w-2.5 mr-1 text-[#6366f1]" /> {p.category.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Badge
              style={{ background: sColor, color: sText, borderColor: sText + "25" }}
              className="border text-[10px] font-bold uppercase tracking-wider shrink-0 px-2.5 py-0.5 rounded-full"
            >
              {p.status}
            </Badge>
          </div>

          {/* Summary / Requirements */}
          <div className="space-y-2">
            {p.summary && (
              <p style={{ color: T.sub }} className="text-xs leading-relaxed font-medium line-clamp-2 opacity-90">
                {p.summary}
              </p>
            )}
            <p style={{ color: T.text }} className="text-sm leading-relaxed opacity-80 line-clamp-3 font-normal">
              {p.requirements}
            </p>
          </div>

          {p.responsibility && (
            <div
              style={{ background: T.nav, borderColor: T.border }}
              className="rounded-xl p-3.5 text-xs border border-dashed"
            >
              <span
                style={{ color: T.text }}
                className="font-bold uppercase tracking-wider block mb-1 text-[10px] opacity-80"
              >
                Key Responsibility
              </span>
              <span style={{ color: T.sub }} className="font-medium leading-relaxed">
                {p.responsibility}
              </span>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {[
              {
                icon: IndianRupee,
                label: `₹${Number(p.amount).toLocaleString("en-IN")}`,
                sub: "Project Budget",
                color: infoColors.budget,
              },
              { icon: Calendar, label: p.end_date ?? "Unlimited", sub: "Submission Goal", color: infoColors.date },
              {
                icon: User,
                label: p.employer?.full_name?.[0] ?? "Elite Employer",
                sub: "Posted By",
                color: infoColors.employer,
              },
              {
                icon: FileText,
                label: `₹${Number(p.validation_fees).toLocaleString("en-IN")}`,
                sub: "Validation Fee",
                color: infoColors.validation,
              },
            ].map((info, idx) => (
              <div
                key={idx}
                style={{ background: T.nav, borderColor: T.border }}
                className="flex items-center gap-2.5 rounded-xl p-2.5 border transition-colors duration-200"
              >
                <div
                  style={{ background: info.color + "12" }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                >
                  <info.icon style={{ color: info.color }} className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p style={{ color: T.text }} className="text-xs font-bold truncate tracking-tight">
                    {info.label}
                  </p>
                  <p
                    style={{ color: T.sub }}
                    className="text-[9px] font-semibold uppercase tracking-wider opacity-60 mt-0.5"
                  >
                    {info.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents & Action */}
        <div className="space-y-4 pt-3 mt-auto">
          {docs.length > 0 && (
            <div className="border-t pt-3" style={{ borderColor: T.border }}>
              <p
                style={{ color: T.text }}
                className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 opacity-70"
              >
                <Paperclip className="h-3 w-3 text-[#6366f1]" /> Technical Attachments ({docs.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {docs.map((d: any) => (
                  <Button
                    key={d.id}
                    variant="outline"
                    style={{ background: T.card, borderColor: T.border, color: T.text }}
                    className="h-7 px-2.5 text-[10px] font-medium rounded-lg hover:border-[#6366f1]/40 transition-colors"
                    onClick={() => downloadDoc(d.file_path)}
                  >
                    <FileText className="mr-1 h-3 w-3 text-[#6366f1]" />
                    <span className="truncate max-w-[120px]">{d.file_name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button
            size="lg"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
            className="w-full gap-2 h-11 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 border-0 text-white"
            onClick={onApply}
            disabled={isPending}
          >
            <Send className="h-4 w-4" /> Express Interest
          </Button>
        </div>
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
      const { data, error } = await supabase
        .from("employee_services")
        .select("category_id")
        .eq("profile_id", profile.id);
      if (error) throw error;
      return [...new Set(data.map((s: any) => s.category_id))];
    },
    enabled: !!profile?.id,
  });

  const toggleMySkills = () => {
    setMySkillsActive((prev) => !prev);
    setCategoryFilter("all");
  };

  const { data: inquiries = [], isLoading: loadingInquiries } = useQuery({
    queryKey: ["freelancer-inquiries", search, categoryFilter, mySkillsActive, mySkillCategoryIds],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, client:client_id(full_name), category:category_id(name)")
        .eq("status", "open")
        .order("created_at", { ascending: false });
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
      const { error } = await supabase
        .from("project_applications")
        .insert({ project_id: projectId, employee_id: profile.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application submitted!");
      setConfirmProject(null);
      queryClient.invalidateQueries({ queryKey: ["freelancer-requests"] });
    },
    onError: (e: any) => {
      toast.error(e.message);
      setConfirmProject(null);
    },
  });

  return (
    <div
      style={{ background: T.bg, minHeight: "100vh", color: T.text }}
      className="space-y-6 p-4 md:p-6 lg:p-8 pb-24 max-w-[1600px] mx-auto transition-colors duration-300"
    >
      {/* Hero Header */}
      <div
        style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-xl"
      >
        <div className="absolute -right-6 -top-6 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md shadow-inner">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight uppercase">Job Terminal</h1>
              <p className="text-xs font-medium opacity-85 uppercase tracking-wider mt-0.5">
                {inquiries.length} Opportunities detected
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-opacity-40 rounded-xl">
        <div className="relative group md:col-span-6 lg:col-span-7">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#6366f1]" />
          <Input
            placeholder="Search premium roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: T.card, borderColor: T.border, color: T.text }}
            className="pl-11 h-12 rounded-xl border text-sm font-medium placeholder:opacity-50 focus-visible:ring-1 focus-visible:ring-[#6366f1] transition-all"
          />
        </div>

        <div className="flex gap-2.5 md:col-span-6 lg:col-span-5">
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v);
              setMySkillsActive(false);
            }}
            disabled={mySkillsActive}
          >
            <SelectTrigger
              style={{ background: T.card, borderColor: T.border, color: T.text }}
              className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-wider border px-4"
            >
              <div className="flex items-center gap-2 truncate">
                <Filter className="h-3.5 w-3.5 opacity-70 shrink-0" />
                <SelectValue placeholder="Industry Filter" />
              </div>
            </SelectTrigger>
            <SelectContent style={{ background: T.card, borderColor: T.border }}>
              <SelectItem value="all">Global Catalog</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {mySkillCategoryIds.length > 0 && (
            <Button
              variant={mySkillsActive ? "default" : "outline"}
              onClick={toggleMySkills}
              style={
                mySkillsActive
                  ? { background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)", borderColor: "transparent" }
                  : { background: T.card, borderColor: T.border, color: T.text }
              }
              className={cn(
                "gap-2 rounded-xl h-12 text-[10px] font-bold uppercase tracking-wider border px-4 transition-all duration-200 shrink-0",
                mySkillsActive && "text-white shadow-md shadow-indigo-500/10",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              My Radar
            </Button>
          )}
        </div>
      </div>

      {/* Job Cards Layout Area */}
      <div>
        {loadingInquiries ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                style={{ background: T.card }}
                className="h-72 w-full rounded-2xl opacity-40 animate-pulse"
              />
            ))}
          </div>
        ) : inquiries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {inquiries.map((p: any) => (
              <InquiryCard
                key={p.id}
                project={p}
                onApply={() => setConfirmProject(p)}
                isPending={applyMutation.isPending}
                T={T}
                isDark={isDark}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-opacity-20"
            style={{ borderColor: T.border }}
          >
            <div
              style={{ background: T.card, borderColor: T.border }}
              className="flex h-20 w-20 items-center justify-center rounded-2xl border shadow-md mb-4"
            >
              <Inbox style={{ color: T.sub }} className="h-8 w-8 opacity-40" />
            </div>
            <p style={{ color: T.text }} className="text-base font-bold uppercase tracking-wider">
              No Jobs Detected
            </p>
            <p
              style={{ color: T.sub }}
              className="text-xs font-medium mt-1.5 max-w-[320px] leading-relaxed opacity-70 tracking-normal px-4"
            >
              The market is quiet right now. Try expanding your filters or update your skill radar.
            </p>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog
        open={!!confirmProject}
        onOpenChange={(open) => {
          if (!open) setConfirmProject(null);
        }}
      >
        <AlertDialogContent
          style={{ background: T.bg, borderColor: T.border }}
          className="rounded-2xl border shadow-xl max-w-md"
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.text }} className="text-lg font-bold uppercase tracking-tight">
              Initiate Application?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.sub }} className="text-sm font-medium leading-relaxed mt-2">
              Expressing interest for{" "}
              <span style={{ color: "#6366f1" }} className="font-extrabold">
                "{confirmProject?.name}"
              </span>
              .
              {confirmProject?.amount && (
                <span
                  style={{ background: T.nav, borderColor: T.border }}
                  className="block mt-4 p-4 rounded-xl border font-bold text-xs space-y-1"
                >
                  <span style={{ color: T.text }} className="block">
                    Budget: ₹{Number(confirmProject.amount).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] opacity-70 uppercase tracking-wider block font-medium">
                    Validation: ₹{Number(confirmProject.validation_fees).toLocaleString("en-IN")}
                  </span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2.5 mt-5">
            <AlertDialogCancel
              style={{ background: T.card, borderColor: T.border, color: T.text }}
              className="rounded-xl font-bold uppercase tracking-wider text-xs h-11 border"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmProject && applyMutation.mutate(confirmProject.id)}
              disabled={applyMutation.isPending}
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
              className="rounded-xl border-0 font-bold uppercase tracking-wider text-xs h-11 text-white shadow-md hover:shadow-indigo-500/20"
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
