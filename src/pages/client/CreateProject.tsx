import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Plus, Trash2, FileText, Clock, RotateCcw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DocFile {
  file: File;
  id: string;
}

const CreateProject = () => {
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
    <div className="space-y-4 p-4 pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{editId ? "Edit Job" : "Create Job"}</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Job Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order ID - shown on edit only */}
          {editId && (
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Order ID</Label>
              <Badge variant="outline" className="text-sm">Auto-generated on save</Badge>
            </div>
          )}

          <div className="space-y-2">
            <Label>Job Name *</Label>
            <Input placeholder="e.g. E-Commerce Website" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>

          {/* Category & Skill */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Service Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => update("categoryId", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex flex-wrap gap-1 rounded-md border border-input p-2 min-h-[40px]">
                {skills.length > 0 ? skills.map((s: any) => (
                  <Badge key={s.id} variant="secondary" className="text-xs">{s.name}</Badge>
                )) : (
                  <span className="text-xs text-muted-foreground">Select a category</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Budget (₹) *</Label>
              <Input type="number" placeholder="25000" value={form.amount} onChange={(e) => update("amount", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Validation Fee (₹)</Label>
              <Input type="number" placeholder="500" value={form.validationFees} onChange={(e) => update("validationFees", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea placeholder="Brief summary of the job..." value={form.summary} onChange={(e) => update("summary", e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Requirements *</Label>
            <Textarea placeholder="Describe your job requirements..." value={form.requirements} onChange={(e) => update("requirements", e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Responsibility</Label>
            <Textarea placeholder="What the freelancer will be responsible for..." value={form.responsibility} onChange={(e) => update("responsibility", e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea placeholder="Any additional notes..." value={form.remarks} onChange={(e) => update("remarks", e.target.value)} rows={2} />
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <Label>Documents</Label>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} accept="*/*" />
            <div className="space-y-2">
              {existingDocs.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border border-input p-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate max-w-[200px]">{d.file_name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeExistingDoc(d.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border border-input p-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="truncate max-w-[200px]">{d.file.name}</span>
                    <span className="text-xs text-muted-foreground">({(d.file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeNewDoc(d.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addDocument}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Document
              </Button>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
            </div>
          </div>

          {/* Schedule Publishing */}
          <Card className="border-dashed">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Schedule Publishing (Optional)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Publish Date</Label>
                  <Input type="date" value={form.scheduledPublishAt} onChange={(e) => update("scheduledPublishAt", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Publish Time</Label>
                  <Input type="time" value={form.scheduledPublishTime} onChange={(e) => update("scheduledPublishTime", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button className="w-full" onClick={() => saveMutation.mutate(true)} disabled={saveMutation.isPending}>
              <Send className="mr-2 h-4 w-4" /> Publish Job
            </Button>
            {form.scheduledPublishAt && (
              <Button variant="secondary" className="w-full" onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending}>
                <Clock className="mr-2 h-4 w-4" /> Save & Schedule
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending}>
                Save Draft
              </Button>
              <Button variant="ghost" className="flex-1" onClick={clearForm}>
                <RotateCcw className="mr-1 h-4 w-4" /> Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProject;
