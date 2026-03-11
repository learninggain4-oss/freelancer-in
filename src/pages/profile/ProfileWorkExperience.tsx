import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Building2, FileText, ArrowLeft, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface WorkExperience {
  id: string;
  profile_id: string;
  company_name: string;
  company_type: string;
  work_description: string | null;
  start_year: number;
  end_year: number | null;
  is_current: boolean;
  certificate_path: string | null;
  certificate_name: string | null;
  created_at: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

const ProfileWorkExperience = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const base = profile?.user_type === "employee" ? "/employee" : "/client";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    company_type: "private",
    work_description: "",
    start_year: currentYear,
    end_year: currentYear as number | null,
    is_current: false,
  });

  const { data: workExperiences = [] } = useQuery({
    queryKey: ["work-experiences", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("work_experiences")
        .select("*")
        .eq("profile_id", profile!.id)
        .order("start_year", { ascending: false });
      return (data || []) as unknown as WorkExperience[];
    },
  });

  const resetForm = () => {
    setForm({ company_name: "", company_type: "private", work_description: "", start_year: currentYear, end_year: currentYear, is_current: false });
    setAdding(false);
    setEditingId(null);
  };

  const startEdit = (w: WorkExperience) => {
    setForm({
      company_name: w.company_name,
      company_type: w.company_type,
      work_description: w.work_description ?? "",
      start_year: w.start_year,
      end_year: w.end_year,
      is_current: w.is_current,
    });
    setEditingId(w.id);
    setAdding(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.company_name.trim()) throw new Error("Company name is required.");
      const payload = {
        company_name: form.company_name.trim(),
        company_type: form.company_type,
        work_description: form.work_description.trim() || null,
        start_year: form.start_year,
        end_year: form.is_current ? null : form.end_year,
        is_current: form.is_current,
      };
      if (editingId) {
        const { error } = await supabase.from("work_experiences").update(payload as any).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("work_experiences").insert({ ...payload, profile_id: profile!.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Updated." : "Added.");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["work-experiences"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_experiences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted.");
      queryClient.invalidateQueries({ queryKey: ["work-experiences"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${base}/profile`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Work Experience</h1>
        {!adding && !editingId && (
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => { resetForm(); setAdding(true); }}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        )}
      </div>

      {(adding || editingId) && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-1">
              <Label className="text-xs">Company Name *</Label>
              <Input value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Company Type</Label>
              <Select value={form.company_type} onValueChange={(v) => setForm((p) => ({ ...p, company_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Work Description</Label>
              <Textarea value={form.work_description} onChange={(e) => setForm((p) => ({ ...p, work_description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Start Year *</Label>
                <Select value={String(form.start_year)} onValueChange={(v) => setForm((p) => ({ ...p, start_year: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {!form.is_current && (
                <div className="space-y-1">
                  <Label className="text-xs">End Year</Label>
                  <Select value={String(form.end_year ?? currentYear)} onValueChange={(v) => setForm((p) => ({ ...p, end_year: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_current} onCheckedChange={(v) => setForm((p) => ({ ...p, is_current: v, end_year: v ? null : currentYear }))} />
              <Label className="text-xs">Currently working here</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="mr-1 h-3 w-3" /> {editingId ? "Update" : "Save"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {workExperiences.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No work experience added</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workExperiences.map((w, i) => (
                <div key={w.id} className={i > 0 ? "border-t pt-3" : ""}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{w.company_name}</p>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px] capitalize">{w.company_type}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(w)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(w.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {w.start_year} – {w.is_current ? "Present" : w.end_year || "N/A"}
                  </p>
                  {w.work_description && (
                    <p className="text-xs text-muted-foreground mt-1">{w.work_description}</p>
                  )}
                  {w.certificate_name && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                      <FileText className="h-3 w-3" />
                      <span>{w.certificate_name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileWorkExperience;
