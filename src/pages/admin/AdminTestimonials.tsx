import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Pencil, Save, X, Star } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  display_order: number;
  is_active: boolean;
}

const AdminTestimonials = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", quote: "", rating: 5, display_order: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", role: "", quote: "", rating: 5 });

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials" as any)
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as unknown as Testimonial[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      const maxOrder = testimonials.length > 0 ? Math.max(...testimonials.map((t) => t.display_order)) : 0;
      const { error } = await supabase
        .from("testimonials" as any)
        .insert({ ...item, display_order: maxOrder + 1 } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      setNewItem({ name: "", role: "", quote: "", rating: 5 });
      setShowAdd(false);
      toast.success("Testimonial added");
    },
    onError: () => toast.error("Failed to add testimonial"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Testimonial> & { id: string }) => {
      const { error } = await supabase.from("testimonials" as any).update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      setEditingId(null);
      toast.success("Testimonial updated");
    },
    onError: () => toast.error("Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast.success("Testimonial deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const startEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setEditForm({ name: t.name, role: t.role, quote: t.quote, rating: t.rating, display_order: t.display_order });
  };

  const RatingPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}>
          <Star className={`h-5 w-5 transition-colors ${s <= value ? "fill-warning text-warning" : "text-muted"}`} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">What Clients Say</h2>
        <Button onClick={() => setShowAdd(true)} disabled={showAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Testimonial
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Testimonial</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Client name" value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Role / Title" value={newItem.role} onChange={(e) => setNewItem((p) => ({ ...p, role: e.target.value }))} />
            <Textarea placeholder="Quote / Testimonial text" value={newItem.quote} onChange={(e) => setNewItem((p) => ({ ...p, quote: e.target.value }))} rows={3} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rating:</span>
              <RatingPicker value={newItem.rating} onChange={(v) => setNewItem((p) => ({ ...p, rating: v }))} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMutation.mutate(newItem)} disabled={!newItem.name.trim() || !newItem.quote.trim() || addMutation.isPending}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : testimonials.length === 0 ? (
        <p className="text-muted-foreground text-sm">No testimonials yet.</p>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                {editingId === t.id ? (
                  <div className="space-y-3">
                    <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" />
                    <Input value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))} placeholder="Role" />
                    <Textarea value={editForm.quote} onChange={(e) => setEditForm((p) => ({ ...p, quote: e.target.value }))} rows={3} />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rating:</span>
                        <RatingPicker value={editForm.rating} onChange={(v) => setEditForm((p) => ({ ...p, rating: v }))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground">Order:</label>
                        <Input type="number" className="w-20" value={editForm.display_order} onChange={(e) => setEditForm((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="gap-1" onClick={() => updateMutation.mutate({ id: t.id, ...editForm })} disabled={updateMutation.isPending}>
                        <Save className="h-3 w-3" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-3 w-3" /> Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <span className="text-xs text-muted-foreground">• {t.role}</span>
                      </div>
                      <div className="flex gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= t.rating ? "fill-warning text-warning" : "text-muted"}`} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 italic">"{t.quote}"</p>
                      <p className="mt-1 text-xs text-muted-foreground">Order: {t.display_order}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={t.is_active} onCheckedChange={(checked) => updateMutation.mutate({ id: t.id, is_active: checked })} />
                      <Button size="icon" variant="ghost" onClick={() => startEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="h-4 w-4" /></Button>
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
