import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight } from "lucide-react";

const AdminServiceManagement = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newCatName, setNewCatName] = useState("");
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [editSkillId, setEditSkillId] = useState<string | null>(null);
  const [editSkillName, setEditSkillName] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-service-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("service_categories").select("*").order("name");
      return data || [];
    },
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["admin-service-skills"],
    queryFn: async () => {
      const { data } = await supabase.from("service_skills").select("*").order("name");
      return data || [];
    },
  });

  const addCategory = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("service_categories").insert({ name });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-service-categories"] }); setNewCatName(""); toast({ title: "Category added" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("service_categories").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-service-categories"] }); setEditCatId(null); toast({ title: "Category updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      // Delete skills first
      await supabase.from("service_skills").delete().eq("category_id", id);
      const { error } = await supabase.from("service_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-service-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-service-skills"] });
      toast({ title: "Category deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addSkill = useMutation({
    mutationFn: async ({ name, category_id }: { name: string; category_id: string }) => {
      const { error } = await supabase.from("service_skills").insert({ name, category_id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-service-skills"] }); setNewSkillName(""); toast({ title: "Skill added" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateSkill = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("service_skills").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-service-skills"] }); setEditSkillId(null); toast({ title: "Skill updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSkill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_skills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-service-skills"] }); toast({ title: "Skill deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Service Categories & Skills</h2>

      {/* Add Category */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add New Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Category name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
            <Button size="sm" disabled={!newCatName.trim()} onClick={() => addCategory.mutate(newCatName.trim())}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      {categories.map((cat) => {
        const catSkills = skills.filter((s) => s.category_id === cat.id);
        const isExpanded = expandedCat === cat.id;

        return (
          <Card key={cat.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedCat(isExpanded ? null : cat.id)}>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                {editCatId === cat.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input value={editCatName} onChange={(e) => setEditCatName(e.target.value)} className="h-8" />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCategory.mutate({ id: cat.id, name: editCatName })}>
                      <Check className="h-4 w-4 text-accent" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditCatId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-between">
                    <span className="font-semibold text-foreground">{cat.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="mr-2 text-xs text-muted-foreground">{catSkills.length} skills</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); }}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteCategory.mutate(cat.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent className="space-y-2 pl-12">
                {catSkills.map((sk) => (
                  <div key={sk.id} className="flex items-center gap-2">
                    {editSkillId === sk.id ? (
                      <>
                        <Input value={editSkillName} onChange={(e) => setEditSkillName(e.target.value)} className="h-8 flex-1" />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateSkill.mutate({ id: sk.id, name: editSkillName })}>
                          <Check className="h-4 w-4 text-accent" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditSkillId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-foreground">{sk.name}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditSkillId(sk.id); setEditSkillName(sk.name); }}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteSkill.mutate(sk.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <Input placeholder="New skill name" value={expandedCat === cat.id ? newSkillName : ""} onChange={(e) => setNewSkillName(e.target.value)} className="h-8" />
                  <Button size="sm" variant="outline" className="h-8" disabled={!newSkillName.trim()} onClick={() => addSkill.mutate({ name: newSkillName.trim(), category_id: cat.id })}>
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {categories.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">No categories yet. Add one above.</p>
      )}
    </div>
  );
};

export default AdminServiceManagement;
