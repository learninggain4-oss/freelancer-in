import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Star, Plus, Trash2, Edit, Save, X, Upload, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  photo_path: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const BUCKET = "company-logos"; // reuse existing public bucket for testimonial photos

const AdminTestimonials = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    name: "",
    role: "",
    quote: "",
    rating: 5,
    is_active: true,
    display_order: 0,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  const uploadPhoto = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `testimonials/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      let photo_path: string | null = null;
      if (photoFile) photo_path = await uploadPhoto(photoFile);
      const { error } = await supabase.from("testimonials").insert({
        name: form.name,
        role: form.role,
        quote: form.quote,
        rating: form.rating,
        is_active: form.is_active,
        display_order: form.display_order,
        photo_path,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      resetForm();
      toast({ title: "Testimonial added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      let photo_path: string | undefined;
      if (photoFile) photo_path = await uploadPhoto(photoFile);
      const updates: Record<string, unknown> = {
        name: form.name,
        role: form.role,
        quote: form.quote,
        rating: form.rating,
        is_active: form.is_active,
        display_order: form.display_order,
      };
      if (photo_path) updates.photo_path = photo_path;
      const { error } = await supabase.from("testimonials").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      resetForm();
      toast({ title: "Testimonial updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: "Testimonial deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("testimonials").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] }),
  });

  const resetForm = () => {
    setForm({ name: "", role: "", quote: "", rating: 5, is_active: true, display_order: 0 });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditingId(null);
    setShowAdd(false);
  };

  const startEdit = (t: Testimonial) => {
    setForm({
      name: t.name,
      role: t.role,
      quote: t.quote,
      rating: t.rating,
      is_active: t.is_active,
      display_order: t.display_order,
    });
    setPhotoPreview(t.photo_path);
    setPhotoFile(null);
    setEditingId(t.id);
    setShowAdd(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const RatingPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)}>
          <Star
            className={cn("h-6 w-6 transition-colors", star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
          />
        </button>
      ))}
    </div>
  );

  const RatingDisplay = ({ value }: { value: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn("h-4 w-4", star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">What Clients Say</h1>
          <p className="text-sm text-muted-foreground">Manage testimonials displayed on the landing page</p>
        </div>
        {!showAdd && (
          <Button onClick={() => { resetForm(); setShowAdd(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Testimonial
          </Button>
        )}
      </div>

      {/* Add / Edit Form */}
      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit Testimonial" : "New Testimonial"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo upload */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-16 w-16 rounded-full object-cover border" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-muted">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4" /> Upload Photo
                  </div>
                  <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </Label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Role / Title *</Label>
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="CEO, Company" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quote *</Label>
              <Textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} placeholder="What the client said..." rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Rating</Label>
                <RatingPicker value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                disabled={!form.name || !form.role || !form.quote || addMutation.isPending || updateMutation.isPending}
                onClick={() => editingId ? updateMutation.mutate(editingId) : addMutation.mutate()}
                className="gap-2"
              >
                <Save className="h-4 w-4" /> {editingId ? "Update" : "Save"}
              </Button>
              <Button variant="outline" onClick={resetForm} className="gap-2">
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : testimonials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No testimonials yet. Add your first one!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.id} className={cn("transition-opacity", !t.is_active && "opacity-50")}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  {t.photo_path ? (
                    <img src={t.photo_path} alt={t.name} className="h-12 w-12 rounded-full object-cover border shrink-0" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.role}</p>
                    <RatingDisplay value={t.rating} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">"{t.quote}"</p>
                <div className="flex items-center justify-between pt-2 border-t">
                  <Switch
                    checked={t.is_active}
                    onCheckedChange={(v) => toggleActive.mutate({ id: t.id, is_active: v })}
                  />
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(t)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
