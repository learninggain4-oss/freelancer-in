import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, Star, Upload, X, GripVertical, Pencil, Save } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  display_order: number;
  is_active: boolean;
  photo_path: string | null;
}

const AdminTestimonials = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", role: "", quote: "", rating: 5 });
  const [editForm, setEditForm] = useState<Partial<Testimonial>>({});
  const [uploading, setUploading] = useState<string | null>(null);

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

  const addMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = testimonials.length > 0 ? Math.max(...testimonials.map(t => t.display_order)) + 1 : 0;
      const { error } = await supabase.from("testimonials").insert({
        name: form.name,
        role: form.role,
        quote: form.quote,
        rating: form.rating,
        display_order: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      setForm({ name: "", role: "", quote: "", rating: 5 });
      toast({ title: "Testimonial added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Testimonial> }) => {
      const { error } = await supabase.from("testimonials").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      setEditingId(null);
      toast({ title: "Testimonial updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
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
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handlePhotoUpload = async (id: string, file: File) => {
    setUploading(id);
    try {
      const ext = file.name.split(".").pop();
      const path = `testimonials/${id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(path);
      await supabase.from("testimonials").update({ photo_path: urlData.publicUrl }).eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: "Photo uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const removePhoto = async (id: string) => {
    await supabase.from("testimonials").update({ photo_path: null }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    toast({ title: "Photo removed" });
  };

  const startEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setEditForm({ name: t.name, role: t.role, quote: t.quote, rating: t.rating });
  };

  const RatingPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)}>
          <Star className={`h-5 w-5 ${s <= value ? "fill-warning text-warning" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">What Clients Say</h1>

      {/* Add new */}
      <Card>
        <CardHeader><CardTitle className="text-base">Add Testimonial</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Client name" />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Startup Founder" />
            </div>
          </div>
          <div>
            <Label>Quote</Label>
            <Textarea value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} placeholder="What the client said..." rows={3} />
          </div>
          <div>
            <Label>Rating</Label>
            <RatingPicker value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!form.name || !form.quote || addMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : testimonials.length === 0 ? (
        <p className="text-muted-foreground">No testimonials yet.</p>
      ) : (
        <div className="space-y-4">
          {testimonials.map(t => (
            <Card key={t.id} className="relative">
              <CardContent className="p-4 sm:p-6">
                {editingId === t.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Name</Label>
                        <Input value={editForm.name ?? ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Input value={editForm.role ?? ""} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <Label>Quote</Label>
                      <Textarea value={editForm.quote ?? ""} onChange={e => setEditForm(f => ({ ...f, quote: e.target.value }))} rows={3} />
                    </div>
                    <div>
                      <Label>Rating</Label>
                      <RatingPicker value={editForm.rating ?? 5} onChange={r => setEditForm(f => ({ ...f, rating: r }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateMutation.mutate({ id: t.id, updates: editForm })}>
                        <Save className="mr-1 h-4 w-4" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {/* Photo */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                        {t.photo_path ? (
                          <img src={t.photo_path} alt={t.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-primary">{t.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload(t.id, file);
                            }}
                          />
                          <span className="text-xs text-primary hover:underline">
                            {uploading === t.id ? "Uploading…" : "Upload"}
                          </span>
                        </label>
                        {t.photo_path && (
                          <button onClick={() => removePhoto(t.id)} className="text-xs text-destructive hover:underline">Remove</button>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">{t.name}</p>
                        <span className="text-xs text-muted-foreground">· {t.role}</span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= t.rating ? "fill-warning text-warning" : "text-muted"}`} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{t.quote}"</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Active</Label>
                        <Switch checked={t.is_active} onCheckedChange={v => updateMutation.mutate({ id: t.id, updates: { is_active: v } })} />
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
