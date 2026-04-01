import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, Briefcase, Target, Layers, Settings2, Save } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { cn } from "@/lib/utils";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const AdminServiceManagement = () => {
  const qc = useQueryClient();
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const [newCatName, setNewCatName] = useState("");
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [editSkillId, setEditSkillId] = useState<string | null>(null);
  const [editSkillName, setEditSkillName] = useState("");

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ["admin-service-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("service_categories").select("*").order("name");
      return data || [];
    },
  });

  const { data: skills = [], isLoading: loadingSkills } = useQuery({
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-service-categories"] }); setNewCatName(""); toast.success("Category added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("service_categories").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-service-categories"] }); setEditCatId(null); toast.success("Category updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("service_skills").delete().eq("category_id", id);
      const { error } = await supabase.from("service_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-service-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-service-skills"] });
      toast.success("Category deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addSkill = useMutation({
    mutationFn: async ({ name, category_id }: { name: string; category_id: string }) => {
      const { error } = await supabase.from("service_skills").insert({ name, category_id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-service-skills"] }); setNewSkillName(""); toast.success("Skill added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSkill = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("service_skills").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-service-skills"] }); setEditSkillId(null); toast.success("Skill updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSkill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_skills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-service-skills"] }); toast.success("Skill deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Premium Hero Section */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 mb-8"
        style={{ 
          background: theme === "black" 
            ? "linear-gradient(135deg, #1e1b4b 0%, #070714 100%)" 
            : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          border: `1px solid ${T.border}`
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white/10 p-3 backdrop-blur-md">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Service Management</h1>
              <p className="text-white/70">Define and organize the specialized skills and service categories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Form & Stats */}
        <div className="space-y-6 lg:col-span-1">
          <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
            <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: T.sub }}>
                <Plus className="h-4 w-4 text-[#6366f1]" />
                New Category
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               <div className="space-y-2">
                 <Label style={{ color: T.text }}>Category Name</Label>
                 <Input 
                   placeholder="e.g. Technology, Healthcare..." 
                   value={newCatName} 
                   onChange={(e) => setNewCatName(e.target.value)} 
                   style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                   className="h-11"
                 />
               </div>
               <Button 
                 className="w-full h-11 bg-[#6366f1] hover:bg-[#6366f1]/90 shadow-lg shadow-indigo-500/20" 
                 disabled={!newCatName.trim() || addCategory.isPending} 
                 onClick={() => addCategory.mutate(newCatName.trim())}
               >
                 {addCategory.isPending ? <Check className="animate-pulse" /> : <Plus className="mr-2 h-4 w-4" />}
                 Create Category
               </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-2xl border" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>Total Categories</p>
                <p className="text-2xl font-bold mt-1" style={{ color: T.text }}>{categories.length}</p>
             </div>
             <div className="p-4 rounded-2xl border" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>Total Skills</p>
                <p className="text-2xl font-bold mt-1" style={{ color: T.text }}>{skills.length}</p>
             </div>
          </div>
        </div>

        {/* Right Column: Categories List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-5 w-5 text-[#6366f1]" />
            <h2 className="text-xl font-bold" style={{ color: T.text }}>Inventory Structure</h2>
          </div>

          <div className="space-y-4">
            {loadingCats ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 w-full animate-pulse rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }} />)
            ) : categories.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border-2 border-dashed" style={{ borderColor: T.border, color: T.sub }}>
                 <Layers className="mx-auto h-12 w-12 mb-4 opacity-20" />
                 <p className="text-lg font-medium">No categories established</p>
                 <p className="text-sm">Start by creating your first service category</p>
              </div>
            ) : (
              categories.map((cat) => {
                const catSkills = skills.filter((s) => s.category_id === cat.id);
                const isExpanded = expandedCat === cat.id;

                return (
                  <Card 
                    key={cat.id} 
                    style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}
                    className={cn(
                      "transition-all overflow-hidden",
                      isExpanded && "ring-1 ring-[#6366f140]"
                    )}
                  >
                    <div className="p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-white/5" 
                          onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                          style={{ color: T.sub }}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        
                        {editCatId === cat.id ? (
                          <div className="flex flex-1 items-center gap-2 max-w-md">
                            <Input 
                              value={editCatName} 
                              onChange={(e) => setEditCatName(e.target.value)} 
                              className="h-9 font-bold" 
                              style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-green-400 hover:bg-green-400/10" onClick={() => updateCategory.mutate({ id: cat.id, name: editCatName })}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-red-400 hover:bg-red-400/10" onClick={() => setEditCatId(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                            <span className="font-bold text-lg truncate" style={{ color: T.text }}>{cat.name}</span>
                            <Badge variant="outline" className="text-[10px] h-5 opacity-70" style={{ background: "rgba(99, 102, 241, 0.05)", color: "#a5b4fc", borderColor: "rgba(99, 102, 241, 0.2)" }}>
                               {catSkills.length} SKILLS
                            </Badge>
                          </div>
                        )}
                      </div>

                      {editCatId !== cat.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-white/5" onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); }} style={{ color: T.sub }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => deleteCategory.mutate(cat.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2">
                        <div className="space-y-2 mb-6">
                           <div className="flex items-center gap-2 mb-3">
                              <Target className="h-3 w-3 text-[#6366f1]" />
                              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>Skillset Management</span>
                           </div>
                           
                           {catSkills.length === 0 ? (
                             <p className="text-xs italic py-4" style={{ color: T.sub }}>No skills defined for this category yet.</p>
                           ) : (
                             <div className="grid gap-2 sm:grid-cols-2">
                               {catSkills.map((sk) => (
                                 <div 
                                   key={sk.id} 
                                   className="flex items-center gap-3 rounded-xl p-3 border group/skill" 
                                   style={{ background: T.nav, border: `1px solid ${T.border}` }}
                                 >
                                   {editSkillId === sk.id ? (
                                     <>
                                       <Input 
                                         value={editSkillName} 
                                         onChange={(e) => setEditSkillName(e.target.value)} 
                                         className="h-8 flex-1" 
                                         style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
                                         autoFocus
                                       />
                                       <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400" onClick={() => updateSkill.mutate({ id: sk.id, name: editSkillName })}>
                                         <Check className="h-4 w-4" />
                                       </Button>
                                       <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => setEditSkillId(null)}>
                                         <X className="h-4 w-4" />
                                       </Button>
                                     </>
                                   ) : (
                                     <>
                                       <span className="flex-1 text-sm font-medium truncate" style={{ color: T.text }}>{sk.name}</span>
                                       <div className="flex items-center gap-1 opacity-0 group-hover/skill:opacity-100 transition-opacity">
                                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/5" onClick={() => { setEditSkillId(sk.id); setEditSkillName(sk.name); }} style={{ color: T.sub }}>
                                            <Edit2 className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteSkill.mutate(sk.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                       </div>
                                     </>
                                   )}
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                        
                        <div className="flex gap-2 p-1 rounded-xl border border-dashed" style={{ borderColor: T.border }}>
                          <Input 
                            placeholder="Add strategic skill..." 
                            value={newSkillName} 
                            onChange={(e) => setNewSkillName(e.target.value)} 
                            className="h-10 border-none bg-transparent" 
                            style={{ color: T.text }}
                          />
                          <Button 
                            size="sm" 
                            className="h-10 px-4 bg-[#6366f1]/10 text-[#a5b4fc] hover:bg-[#6366f1]/20 border border-[#6366f130]" 
                            disabled={!newSkillName.trim() || addSkill.isPending} 
                            onClick={() => addSkill.mutate({ name: newSkillName.trim(), category_id: cat.id })}
                          >
                            <Plus className="mr-1 h-4 w-4" /> Add Skill
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminServiceManagement;
