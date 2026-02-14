import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, X, Tag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminServiceCategories = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState("");
  const [newSkill, setNewSkill] = useState<Record<string, string>>({});
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  // Fetch countdown setting
  const { data: countdownHours } = useQuery({
    queryKey: ["app-settings", "approval_countdown_hours"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "approval_countdown_hours").maybeSingle();
      return data?.value ?? "6";
    },
  });

  const [countdownInput, setCountdownInput] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-service-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("service_categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: skills } = useQuery({
    queryKey: ["admin-service-skills"],
    queryFn: async () => {
      const { data } = await supabase.from("service_skills").select("*").order("name");
      return data ?? [];
    },
  });

  const addCategory = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("service_categories").insert({ name } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-categories"] });
      setNewCategory("");
      toast({ title: "Category added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-service-skills"] });
      toast({ title: "Category deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("service_categories").update({ name } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-categories"] });
      setEditingCategory(null);
      toast({ title: "Category updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addSkill = useMutation({
    mutationFn: async ({ category_id, name }: { category_id: string; name: string }) => {
      const { error } = await supabase.from("service_skills").insert({ category_id, name } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-skills"] });
      setNewSkill({});
      toast({ title: "Skill added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSkill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_skills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-skills"] });
      toast({ title: "Skill deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCountdown = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase.from("app_settings").update({ value, updated_by: profile?.id } as any).eq("key", "approval_countdown_hours");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast({ title: "Countdown updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Service Categories & Skills</h2>

      {/* Countdown Setting */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Approval Countdown Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={168}
              placeholder={countdownHours ?? "6"}
              value={countdownInput}
              onChange={(e) => setCountdownInput(e.target.value)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">hours</span>
            <Button
              size="sm"
              disabled={!countdownInput}
              onClick={() => {
                if (countdownInput) updateCountdown.mutate(countdownInput);
                setCountdownInput("");
              }}
            >
              <Save className="mr-1 h-3 w-3" /> Save
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Currently: {countdownHours ?? "6"} hours</p>
        </CardContent>
      </Card>

      {/* Add Category */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Web Development"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Button size="sm" disabled={!newCategory.trim()} onClick={() => addCategory.mutate(newCategory.trim())}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories & Skills */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        categories?.map((cat: any) => {
          const catSkills = skills?.filter((s: any) => s.category_id === cat.id) ?? [];
          return (
            <Card key={cat.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  {editingCategory === cat.id ? (
                    <div className="flex items-center gap-2">
                      <Input value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} className="h-8 w-48" />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCategory.mutate({ id: cat.id, name: editCategoryName })}>
                        <Save className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCategory(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">{cat.name}</CardTitle>
                    </div>
                  )}
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingCategory(cat.id); setEditCategoryName(cat.name); }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteCategory.mutate(cat.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {catSkills.map((skill: any) => (
                    <Badge key={skill.id} variant="secondary" className="gap-1">
                      {skill.name}
                      <button onClick={() => deleteSkill.mutate(skill.id)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add skill..."
                    value={newSkill[cat.id] || ""}
                    onChange={(e) => setNewSkill({ ...newSkill, [cat.id]: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={!newSkill[cat.id]?.trim()}
                    onClick={() => {
                      addSkill.mutate({ category_id: cat.id, name: newSkill[cat.id].trim() });
                      setNewSkill({ ...newSkill, [cat.id]: "" });
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default AdminServiceCategories;
