import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Plus, Trash2, FileText, Clock, RotateCcw, Briefcase, IndianRupee, Layers, FileUp } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

interface DocFile {
  file: File;
  id: string;
}

const CreateProject = () => {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    validationFees: "",
    requirements: "",
    remarks: "",
    startDate: "",
    endDate: "",
    categoryId: "",
    summary: "",
    responsibility: "",
    scheduledPublishAt: "",
    scheduledPublishTime: "",
  });
  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [existingDocs, setExistingDocs] = useState<any[]>([]);
  const [docsToDelete, setDocsToDelete] = useState<string[]>([]);

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch skills for selected category
  const { data: skills = [] } = useQuery({
    queryKey: ["service-skills", form.categoryId],
    queryFn: async () => {
      if (!form.categoryId) return [];
      const { data, error } = await supabase
        .from("service_skills")
        .select("*")
        .eq("category_id", form.categoryId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!form.categoryId,
  });

  // Load existing project for editing
  useQuery({
    queryKey: ["edit-project", editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", editId)
        .single();
      if (error) throw error;
      setForm({
        name: data.name || "",
        amount: String(data.amount || ""),
        validationFees: String(data.validation_fees || ""),
        requirements: data.requirements || "",
        remarks: data.remarks || "",
        startDate: data.start_date || "",
        endDate: data.end_date || "",
        categoryId: data.category_id || "",
        summary: data.summary || "",
        responsibility: data.responsibility || "",
        scheduledPublishAt: data.scheduled_publish_at ? data.scheduled_publish_at.split("T")[0] : "",
        scheduledPublishTime: data.scheduled_publish_at ? data.scheduled_publish_at.split("T")[1]?.slice(0, 5) : "",
      });
      // Load existing docs
      const { data: docs } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", editId);
      setExistingDocs(docs || []);
      return data;
    },
    enabled: !!editId,
  });

  const clearForm = () => {
    setForm({
      name: "", amount: "", validationFees: "", requirements: "", remarks: "",
      startDate: "", endDate: "", categoryId: "", summary: "", responsibility: "",
      scheduledPublishAt: "", scheduledPublishTime: "",
    });
    setDocuments([]);
    setDocsToDelete([]);
    setExistingDocs([]);
  };

  const addDocument = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newDocs: DocFile[] = Array.from(files).map((f) => ({
      file: f,
      id: crypto.randomUUID(),
    }));
    setDocuments((prev) => [...prev, ...newDocs]);
    e.target.value = "";
  };

  const removeNewDoc = (id: string) => setDocuments((prev) => prev.filter((d) => d.id !== id));
  const removeExistingDoc = (id: string) => {
    setDocsToDelete((prev) => [...prev, id]);
    setExistingDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const uploadDocuments = async (projectId: string) => {
    // Delete marked docs
    for (const docId of docsToDelete) {
      const doc = existingDocs.find((d) => d.id === docId) || { file_path: "" };
      if (doc.file_path) {
        await supabase.storage.from("project-documents").remove([doc.file_path]);
      }
      await supabase.from("project_documents").delete().eq("id", docId);
    }

    // Upload new docs
    for (const doc of documents) {
      const filePath = `${projectId}/${crypto.randomUUID()}-${doc.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("project-documents")
        .upload(filePath, doc.file);
      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }
      await supabase.from("project_documents").insert({
        project_id: projectId,
        file_name: doc.file.name,
        file_path: filePath,
        file_size: doc.file.size,
        uploaded_by: profile!.id,
      });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (publishNow: boolean) => {
      if (!profile?.id) throw new Error("Not authenticated");
      if (!form.name || !form.amount || !form.requirements) throw new Error("Please fill all required fields");

      let scheduledAt: string | null = null;
      if (!publishNow && form.scheduledPublishAt) {
        const time = form.scheduledPublishTime || "00:00";
        scheduledAt = `${form.scheduledPublishAt}T${time}:00`;
      }

      const projectData = {
        name: form.name,
        amount: Number(form.amount),
        validation_fees: Number(form.validationFees) || 0,
        requirements: form.requirements,
        remarks: form.remarks || null,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        category_id: form.categoryId || null,
        summary: form.summary || null,
        responsibility: form.responsibility || null,
        scheduled_publish_at: scheduledAt,
        status: publishNow ? ("open" as const) : ("draft" as const),
      };

      if (editId) {
        const { error } = await supabase.from("projects").update(projectData).eq("id", editId);
        if (error) throw error;
        await uploadDocuments(editId);
        return editId;
      } else {
        const { data, error } = await supabase
          .from("projects")
          .insert({ ...projectData, client_id: profile.id })
          .select("id")
          .single();
        if (error) throw error;
        await uploadDocuments(data.id);
        return data.id;
      }
    },
    onSuccess: (_, publishNow) => {
      toast.success(editId ? "Job updated!" : publishNow ? "Job published!" : "Job saved as draft!");
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      navigate("/client/projects");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4 pb-24 min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" style={{ color: T.text }} />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: T.text }}>{editId ? "Edit Job" : "Create Job"}</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: T.sub }}>Project details & configuration</p>
        </div>
      </div>

      <Card className="border-0 shadow-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
          <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2" style={{ color: T.text }}>
            <Briefcase className="h-5 w-5 text-indigo-400" /> Job Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          {/* Order ID - shown on edit only */}
          {editId && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Job Order ID</Label>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 w-fit">
                <Badge variant="outline" className="font-mono text-sm border-indigo-500/30 text-indigo-400">ID: {editId.slice(0, 8)}</Badge>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Job Name *</Label>
            <Input 
              placeholder="e.g. E-Commerce Website Development" 
              value={form.name} 
              onChange={(e) => update("name", e.target.value)}
              className="h-12 rounded-2xl border-0 bg-white/5 focus-visible:ring-indigo-500/30 font-bold"
              style={{ color: T.text }}
            />
          </div>

          {/* Category & Skill */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                <Layers className="h-3 w-3" /> Service Category
              </Label>
              <Select value={form.categoryId} onValueChange={(v) => update("categoryId", v)}>
                <SelectTrigger className="h-12 rounded-2xl border-0 bg-white/5 focus:ring-indigo-500/30 font-bold">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#070714] border-white/10 rounded-2xl">
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id} className="focus:bg-white/10 text-white rounded-lg">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Required Skills</Label>
              <div className="flex flex-wrap gap-2 rounded-2xl border border-white/5 bg-white/5 p-3 min-h-[48px] items-center">
                {skills.length > 0 ? skills.map((s: any) => (
                  <Badge key={s.id} variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-1 px-2.5">
                    {s.name}
                  </Badge>
                )) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 px-2">Select a category to see skills</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                <IndianRupee className="h-3 w-3" /> Budget (₹) *
              </Label>
              <Input 
                type="number" 
                placeholder="25000" 
                value={form.amount} 
                onChange={(e) => update("amount", e.target.value)} 
                className="h-12 rounded-2xl border-0 bg-white/5 focus-visible:ring-indigo-500/30 font-bold text-emerald-400"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                <IndianRupee className="h-3 w-3" /> Validation Fee (₹)
              </Label>
              <Input 
                type="number" 
                placeholder="500" 
                value={form.validationFees} 
                onChange={(e) => update("validationFees", e.target.value)} 
                className="h-12 rounded-2xl border-0 bg-white/5 focus-visible:ring-indigo-500/30 font-bold"
                style={{ color: T.text }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Job Summary</Label>
            <Textarea 
              placeholder="Brief summary of the job..." 
              value={form.summary} 
              onChange={(e) => update("summary", e.target.value)} 
              rows={3} 
              className="rounded-2xl border-0 bg-white/5 focus-visible:ring-indigo-500/30 font-medium resize-none"
              style={{ color: T.text }}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Detailed Requirements *</Label>
            <Textarea 
              placeholder="Describe your job requirements in detail..." 
              value={form.requirements} 
              onChange={(e) => update("requirements", e.target.value)} 
              rows={5} 
              className="rounded-2xl border-0 bg-white/5 focus-visible:ring-indigo-500/30 font-medium"
              style={{ color: T.text }}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Responsibility</Label>
            <Textarea 
              placeholder="What the freelancer will be responsible for..." 
              value={form.responsibility} 
              onChange={(e) => update("responsibility", e.target.value)} 
              rows={3} 
              className="rounded-2xl border-0 bg-white/5 focus-visible:ring-indigo-500/30 font-medium"
              style={{ color: T.text }}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Remarks</Label>
            <Textarea 
              placeholder="Any additional notes or remarks..." 
              value={form.remarks} 
              onChange={(e) => update("remarks", e.target.value)} 
              rows={3} 
              className="rounded-2xl border-0 bg-white/5 focus-visible:ring-indigo-500/30 font-medium"
              style={{ color: T.text }}
            />
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
              <FileUp className="h-3 w-3" /> Project Documents
            </Label>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} accept="*/*" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {existingDocs.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-4 group transition-all hover:bg-white/10">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                      <FileText className="h-4 w-4 text-indigo-400" />
                    </div>
                    <span className="truncate max-w-[140px] font-bold" style={{ color: T.text }}>{d.file_name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-500/10" onClick={() => removeExistingDoc(d.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-2xl bg-indigo-500/5 border border-indigo-500/20 p-4 group transition-all hover:bg-indigo-500/10">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                      <FileText className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="truncate max-w-[140px] font-bold text-indigo-300">{d.file.name}</span>
                      <span className="text-[10px] font-bold opacity-40 uppercase">{(d.file.size / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-500/10" onClick={() => removeNewDoc(d.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <button 
                type="button" 
                onClick={addDocument}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/5 bg-white/5 p-4 text-center transition-all hover:bg-white/10 hover:border-indigo-500/30 active:scale-[0.98]"
              >
                <Plus className="h-6 w-6 text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Add Document</span>
              </button>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-4 pt-4">
            <div className="h-px bg-white/5" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Start Date</Label>
                <Input 
                  type="date" 
                  value={form.startDate} 
                  onChange={(e) => update("startDate", e.target.value)} 
                  className="h-12 rounded-2xl border-0 bg-white/5 focus-visible:ring-indigo-500/30 font-bold"
                  style={{ color: T.text }}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">End Date</Label>
                <Input 
                  type="date" 
                  value={form.endDate} 
                  onChange={(e) => update("endDate", e.target.value)} 
                  className="h-12 rounded-2xl border-0 bg-white/5 focus-visible:ring-indigo-500/30 font-bold"
                  style={{ color: T.text }}
                />
              </div>
            </div>
          </div>

          {/* Schedule Publishing */}
          <Card className="border-0 shadow-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em]" style={{ color: T.text }}>
                <Clock className="h-4 w-4 text-indigo-400" />
                Schedule Publishing
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Publish Date</Label>
                  <Input 
                    type="date" 
                    value={form.scheduledPublishAt} 
                    onChange={(e) => update("scheduledPublishAt", e.target.value)} 
                    className="h-11 rounded-xl border-0 bg-black/20 focus-visible:ring-indigo-500/30 font-bold"
                    style={{ color: T.text }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Publish Time</Label>
                  <Input 
                    type="time" 
                    value={form.scheduledPublishTime} 
                    onChange={(e) => update("scheduledPublishTime", e.target.value)} 
                    className="h-11 rounded-xl border-0 bg-black/20 focus-visible:ring-indigo-500/30 font-bold"
                    style={{ color: T.text }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
            <Button 
              className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all" 
              onClick={() => saveMutation.mutate(true)} 
              disabled={saveMutation.isPending}
            >
              <Send className="mr-3 h-5 w-5" /> {editId ? "Update & Publish" : "Publish Job"}
            </Button>
            
            {form.scheduledPublishAt && (
              <Button 
                variant="secondary" 
                className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 active:scale-[0.98] transition-all" 
                onClick={() => saveMutation.mutate(false)} 
                disabled={saveMutation.isPending}
                style={{ color: T.text }}
              >
                <Clock className="mr-3 h-5 w-5 text-indigo-400" /> Save & Schedule
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-12 rounded-2xl font-black uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all" 
                onClick={() => saveMutation.mutate(false)} 
                disabled={saveMutation.isPending}
                style={{ color: T.text }}
              >
                Save Draft
              </Button>
              <Button 
                variant="ghost" 
                className="h-12 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-500/10 text-rose-500 active:scale-[0.98] transition-all" 
                onClick={clearForm}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProject;
