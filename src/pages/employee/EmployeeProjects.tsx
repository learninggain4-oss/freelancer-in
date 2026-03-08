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
  MessageSquare,
  Send,
  Tag,
  Paperclip,
  Sparkles,
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
  job_confirmed: "bg-primary/10 text-primary",
  payment_processing: "bg-warning/10 text-warning",
  validation: "bg-warning/10 text-warning",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

/** Inquiry card with Order ID, category, documents */
const InquiryCard = ({ project: p, onApply, isPending }: { project: any; onApply: () => void; isPending: boolean }) => {
  const { data: docs = [] } = useQuery({
    queryKey: ["project-docs", p.id],
    queryFn: async () => {
      const { data } = await supabase.from("project_documents").select("id, file_name, file_path").eq("project_id", p.id);
      return data ?? [];
    },
  });

  const downloadDoc = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from("project-documents").createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{p.name}</h3>
            <p className="text-xs text-muted-foreground">
              {p.order_id}
              {p.category?.name && <> • <Tag className="inline h-3 w-3" /> {p.category.name}</>}
            </p>
          </div>
          <Badge className={statusColor[p.status]}>{p.status}</Badge>
        </div>
        {p.summary && <p className="text-sm text-muted-foreground">{p.summary}</p>}
        <p className="text-sm text-muted-foreground">{p.requirements}</p>
        {p.responsibility && (
          <div className="text-xs"><span className="font-medium text-foreground">Responsibility:</span> <span className="text-muted-foreground">{p.responsibility}</span></div>
        )}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />₹{Number(p.amount).toLocaleString("en-IN")}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{p.end_date ?? "No deadline"}</span>
          <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.client?.full_name?.[0] ?? "Client"}</span>
          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />Fee: ₹{Number(p.validation_fees).toLocaleString("en-IN")}</span>
        </div>
        {docs.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground flex items-center gap-1"><Paperclip className="h-3 w-3" /> Documents ({docs.length})</p>
            <div className="flex flex-wrap gap-1">
              {docs.map((d: any) => (
                <Button key={d.id} variant="outline" size="sm" className="h-7 text-xs" onClick={() => downloadDoc(d.file_path, d.file_name)}>
                  <FileText className="mr-1 h-3 w-3" /> {d.file_name.length > 20 ? d.file_name.slice(0, 20) + "…" : d.file_name}
                </Button>
              ))}
            </div>
          </div>
        )}
        <Button size="sm" className="w-full" onClick={onApply} disabled={isPending}>
          <Send className="mr-2 h-4 w-4" /> Apply
        </Button>
      </CardContent>
    </Card>
  );
};

const EmployeeProjects = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [mySkillsActive, setMySkillsActive] = useState(false);
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch employee's registered service category IDs
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

  // Fetch open projects (inquiries)
  const { data: inquiries = [], isLoading: loadingInquiries } = useQuery({
    queryKey: ["employee-inquiries", search, categoryFilter, mySkillsActive, mySkillCategoryIds],
    queryFn: async () => {
      let query = supabase.
      from("projects").
      select("*, client:client_id(full_name), category:category_id(name)").
      eq("status", "open").
      order("created_at", { ascending: false });
      if (search) query = query.ilike("name", `%${search}%`);
      if (mySkillsActive && mySkillCategoryIds.length > 0) {
        query = query.in("category_id", mySkillCategoryIds);
      } else if (categoryFilter !== "all") {
        query = query.eq("category_id", categoryFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch my applications (requests)
  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["employee-requests", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase.
      from("project_applications").
      select("*, project:project_id(name)").
      eq("employee_id", profile.id).
      order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Fetch my submissions
  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ["employee-submissions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase.
      from("project_submissions").
      select("*, project:project_id(name, end_date)").
      eq("employee_id", profile.id).
      order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Apply to project
  const applyMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("project_applications").insert({
        project_id: projectId,
        employee_id: profile.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application submitted!");
      queryClient.invalidateQueries({ queryKey: ["employee-requests"] });
    },
    onError: (e: any) => toast.error(e.message)
  });

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-foreground">Jobs</h1>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setMySkillsActive(false); }} disabled={mySkillsActive}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {mySkillCategoryIds.length > 0 && (
        <Button
          variant={mySkillsActive ? "default" : "outline"}
          size="sm"
          onClick={toggleMySkills}
          className="gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          My Skills
        </Button>
      )}

      <div className="space-y-3">
        {loadingInquiries ?
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />) :
          inquiries.length > 0 ?
            inquiries.map((p: any) =>
              <InquiryCard key={p.id} project={p} onApply={() => applyMutation.mutate(p.id)} isPending={applyMutation.isPending} />
            ) :
            <p className="py-8 text-center text-sm text-muted-foreground">No open projects available</p>
        }
      </div>
    </div>);

};

export default EmployeeProjects;