import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Save, X, Upload, Image, GripVertical, Presentation, Loader2 } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image_path: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const AdminHeroSlides = () => {
  const queryClient = useQueryClient();
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", is_active: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["admin-hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as HeroSlide[];
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("hero-slides")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from("hero-slides")
      .getPublicUrl(path);
    return urlData.publicUrl;
  };

  const deleteImage = async (url: string) => {
    const path = url.split("/hero-slides/")[1];
    if (path) {
      await supabase.storage.from("hero-slides").remove([path]);
    }
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      let imagePath: string | null = null;
      if (imageFile) imagePath = await uploadImage(imageFile);
      const maxOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.display_order)) + 1 : 0;
      const { error } = await supabase.from("hero_slides").insert({
        title: form.title,
        subtitle: form.subtitle,
        image_path: imagePath,
        is_active: form.is_active,
        display_order: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      toast({ title: "Slide added successfully" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, newImage, oldImagePath }: { id: string; data: Partial<HeroSlide>; newImage?: File; oldImagePath?: string | null }) => {
      let imagePath = data.image_path;
      if (newImage) {
        if (oldImagePath) await deleteImage(oldImagePath);
        imagePath = await uploadImage(newImage);
      }
      const { error } = await supabase
        .from("hero_slides")
        .update({ ...data, image_path: imagePath, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      toast({ title: "Slide updated" });
      setEditingId(null);
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (slide: HeroSlide) => {
      if (slide.image_path) await deleteImage(slide.image_path);
      const { error } = await supabase.from("hero_slides").delete().eq("id", slide.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      toast({ title: "Slide deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ title: "", subtitle: "", is_active: true });
    setImageFile(null);
    setImagePreview(null);
    setShowAddForm(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const startEdit = (slide: HeroSlide) => {
    setEditingId(slide.id);
    setForm({ title: slide.title, subtitle: slide.subtitle, is_active: slide.is_active });
    setImageFile(null);
    setImagePreview(null);
  };

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
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white/10 p-3 backdrop-blur-md">
              <Image className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Hero Slideshow</h1>
              <p className="text-white/70">Manage landing page slideshow images and content</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)} 
            disabled={showAddForm} 
            className="gap-2 bg-white text-[#6366f1] hover:bg-white/90"
          >
            <Plus className="h-4 w-4" /> Add Slide
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }} className="mb-6">
          <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
            <CardTitle className="text-lg" style={{ color: T.text }}>New Slide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Title</Label>
                <Input 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  placeholder="Slide title" 
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Image</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="cursor-pointer"
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: T.text }}>Subtitle</Label>
              <Textarea 
                value={form.subtitle} 
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })} 
                placeholder="Slide subtitle text" 
                rows={2} 
                style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                className="resize-none"
              />
            </div>
            {imagePreview && (
              <div className="relative w-full max-w-md overflow-hidden rounded-xl border" style={{ borderColor: T.border }}>
                <img src={imagePreview} alt="Preview" className="h-40 w-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label style={{ color: T.text }}>Active</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => addMutation.mutate()} disabled={!form.title || addMutation.isPending} className="gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90">
                <Save className="h-4 w-4" /> Save Slide
              </Button>
              <Button variant="outline" onClick={resetForm} style={{ borderColor: T.border, color: T.text }}>
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slides list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
        </div>
      ) : slides.length === 0 ? (
        <Card style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <CardContent className="py-12 text-center" style={{ color: T.sub }}>
            No slides yet. Add your first slide above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {slides.map((slide) => {
            const isEditing = editingId === slide.id;
            return (
              <Card 
                key={slide.id} 
                style={{ 
                  background: T.card, 
                  border: isEditing ? `1px solid #6366f1` : `1px solid ${T.border}`,
                  backdropFilter: "blur(12px)"
                }}
                className="overflow-hidden transition-all hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <CardContent className="p-0">
                  {isEditing ? (
                    <div className="p-6 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label style={{ color: T.text }}>Title</Label>
                          <Input 
                            value={form.title} 
                            onChange={(e) => setForm({ ...form, title: e.target.value })} 
                            style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label style={{ color: T.text }}>Replace Image</Label>
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label style={{ color: T.text }}>Subtitle</Label>
                        <Textarea 
                          value={form.subtitle} 
                          onChange={(e) => setForm({ ...form, subtitle: e.target.value })} 
                          rows={2} 
                          style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                          className="resize-none"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        {(imagePreview || slide.image_path) && (
                          <div className="h-24 w-40 shrink-0 overflow-hidden rounded-lg border" style={{ borderColor: T.border }}>
                            <img src={imagePreview || slide.image_path!} alt="Preview" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                          <Label style={{ color: T.text }}>Active</Label>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() =>
                            updateMutation.mutate({
                              id: slide.id,
                              data: { title: form.title, subtitle: form.subtitle, is_active: form.is_active, image_path: slide.image_path },
                              newImage: imageFile || undefined,
                              oldImagePath: slide.image_path,
                            })
                          }
                          disabled={updateMutation.isPending}
                          className="gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90"
                        >
                          <Save className="h-4 w-4" /> Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => { setEditingId(null); setImageFile(null); setImagePreview(null); }} style={{ borderColor: T.border, color: T.text }}>
                          <X className="h-4 w-4" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <GripVertical className="h-5 w-5 shrink-0" style={{ color: T.sub }} />
                        <div className="h-16 w-28 shrink-0 overflow-hidden rounded-xl border" style={{ borderColor: T.border }}>
                          {slide.image_path ? (
                            <img src={slide.image_path} alt={slide.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center" style={{ background: T.input }}>
                              <Image className="h-6 w-6" style={{ color: T.sub }} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold truncate" style={{ color: T.text }}>{slide.title}</p>
                            <Badge 
                              variant={slide.is_active ? "default" : "secondary"} 
                              className="text-[10px] px-1.5 h-4 uppercase font-bold tracking-wider"
                              style={slide.is_active ? { background: "rgba(74, 222, 128, 0.15)", color: "#4ade80", border: "1px solid rgba(74, 222, 128, 0.3)" } : {}}
                            >
                              {slide.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-xs truncate" style={{ color: T.sub }}>{slide.subtitle || "No subtitle"}</p>
                          <div className="flex items-center gap-3 mt-2">
                             <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>Order</span>
                                <Badge variant="outline" className="text-[10px] h-4 py-0" style={{ borderColor: T.border, color: T.text }}>#{slide.display_order}</Badge>
                             </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end shrink-0 gap-2 border-t sm:border-0 pt-3 sm:pt-0" style={{ borderColor: T.border }}>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => startEdit(slide)}
                          className="h-10 w-10 hover:bg-white/5"
                          style={{ color: T.sub }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Delete this slide?")) deleteMutation.mutate(slide);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminHeroSlides;
