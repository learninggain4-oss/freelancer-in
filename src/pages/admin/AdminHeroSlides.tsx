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
import { Plus, Trash2, Pencil, Save, X, Upload, Image, GripVertical } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Hero Slideshow</h2>
          <p className="text-sm text-muted-foreground">Manage landing page slideshow images</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm} className="gap-2">
          <Plus className="h-4 w-4" /> Add Slide
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Slide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Slide title" />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Slide subtitle text" rows={2} />
            </div>
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-lg object-cover border" />
            )}
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => addMutation.mutate()} disabled={!form.title || addMutation.isPending} className="gap-2">
                <Save className="h-4 w-4" /> Save
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slides list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : slides.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No slides yet. Add your first slide.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {slides.map((slide) => {
            const isEditing = editingId === slide.id;
            return (
              <Card key={slide.id} className={isEditing ? "border-primary/30" : ""}>
                <CardContent className="p-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Replace Image</Label>
                          <Input type="file" accept="image/*" onChange={handleFileChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Subtitle</Label>
                        <Textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} rows={2} />
                      </div>
                      <div className="flex items-center gap-4">
                        {(imagePreview || slide.image_path) && (
                          <img src={imagePreview || slide.image_path!} alt="Preview" className="h-20 w-auto rounded-lg object-cover border" />
                        )}
                        <div className="flex items-center gap-2">
                          <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                          <Label>Active</Label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            updateMutation.mutate({
                              id: slide.id,
                              data: { title: form.title, subtitle: form.subtitle, is_active: form.is_active, image_path: slide.image_path },
                              newImage: imageFile || undefined,
                              oldImagePath: slide.image_path,
                            })
                          }
                          disabled={updateMutation.isPending}
                          className="gap-1"
                        >
                          <Save className="h-3.5 w-3.5" /> Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setImageFile(null); setImagePreview(null); }}>
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      {slide.image_path ? (
                        <img src={slide.image_path} alt={slide.title} className="h-16 w-28 shrink-0 rounded-lg object-cover border" />
                      ) : (
                        <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg border bg-muted">
                          <Image className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground truncate">{slide.title}</p>
                          <Badge variant={slide.is_active ? "default" : "secondary"} className="text-[10px]">
                            {slide.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{slide.subtitle || "No subtitle"}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Order: {slide.display_order}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(slide)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
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
