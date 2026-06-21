import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, IndianRupee, ArrowLeft, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

const ProfileServices = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const base = pathname.startsWith("/freelancer") ? "/freelancer" : pathname.startsWith("/employer") ? "/employer" : "/employee";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ service_title: "", category_id: "", hourly_rate: "0", minimum_budget: "0" });

  const { data: services = [] } = useQuery({
    queryKey: ["freelancer-services", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("employee_services")
        .select("*, service_categories(name), employee_skill_selections(skill_id, service_skills(name))")
        .eq("profile_id", profile!.id)
        .order("created_at");
      return data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("service_categories").select("id, name").order("name");
      return data || [];
    },
  });

  const resetForm = () => {
    setForm({ service_title: "", category_id: "", hourly_rate: "0", minimum_budget: "0" });
    setAdding(false);
    setEditingId(null);
  };

  const startEdit = (s: any) => {
    setForm({
      service_title: s.service_title,
      category_id: s.category_id,
      hourly_rate: String(s.hourly_rate),
      minimum_budget: String(s.minimum_budget),
    });
    setEditingId(s.id);
    setAdding(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.service_title.trim()) throw new Error("Service title is required.");
      if (!form.category_id) throw new Error("Category is required.");
      const payload = {
        service_title: form.service_title.trim(),
        category_id: form.category_id,
        hourly_rate: Number(form.hourly_rate) || 0,
        minimum_budget: Number(form.minimum_budget) || 0,
      };
      if (editingId) {
        const { error } = await supabase.from("employee_services").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employee_services").insert({ ...payload, profile_id: profile!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Updated." : "Added.");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["freelancer-services"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employee_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted.");
      queryClient.invalidateQueries({ queryKey: ["freelancer-services"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${base}/profile`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Services</h1>
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
              <Label className="text-xs">Service Title *</Label>
              <Input value={form.service_title} onChange={(e) => setForm((p) => ({ ...p, service_title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category *</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm((p) => ({ ...p, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Hourly Rate (₹)</Label>
                <Input type="number" value={form.hourly_rate} onChange={(e) => setForm((p) => ({ ...p, hourly_rate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Budget (₹)</Label>
                <Input type="number" value={form.minimum_budget} onChange={(e) => setForm((p) => ({ ...p, minimum_budget: e.target.value }))} />
              </div>
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
          {services.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Briefcase className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No services added</p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((s: any, i: number) => (
                <div key={s.id} className={i > 0 ? "border-t pt-3" : ""}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{s.service_title}</p>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(s)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(s.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.service_categories?.name || "Uncategorized"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {s.hourly_rate}/hr
                    </span>
                    <span>Min ₹{s.minimum_budget}</span>
                  </div>
                  {s.employee_skill_selections?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.employee_skill_selections.map((sel: any) => (
                        <Badge key={sel.skill_id} variant="secondary" className="text-[10px]">
                          {sel.service_skills?.name}
                        </Badge>
                      ))}
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

export default ProfileServices;
