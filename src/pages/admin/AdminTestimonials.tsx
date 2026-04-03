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
import { Star, Plus, Trash2, Edit, Save, X, Upload, Image, MessageSquareQuote, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Badge } from "@/components/ui/badge";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

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

const BUCKET = "company-logos"; 

const AdminTestimonials = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
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

  useEffect(() => {
    const channel = supabase
      .channel('admin-testimonials-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

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

  const updateRating = useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      const { error } = await supabase.from("testimonials").update({ rating }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: "Rating updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
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

  const InlineRatingPicker = ({ id, value }: { id: string; value: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => updateRating.mutate({ id, rating: star })}
          className="hover:scale-125 transition-transform"
          title={`Set rating to ${star}`}
        >
          <Star
            className={cn("h-4 w-4 transition-colors", star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-300")}
          />
        </button>
      ))}
    </div>
  );

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
              <MessageSquareQuote className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">What Employers Say</h1>
              <p className="text-white/70">Manage testimonials displayed on the landing page</p>
            </div>
          </div>
          {!showAdd && (
            <Button 
              onClick={() => { resetForm(); setShowAdd(true); }} 
              className="gap-2 bg-white text-[#6366f1] hover:bg-white/90"
            >
              <Plus className="h-4 w-4" /> Add Testimonial
            </Button>
          )}
        </div>
      </div>

      {/* Add / Edit Form */}
      {showAdd && (
        <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <CardHeader className="border-b" style={{ borderColor: T.border }}>
            <CardTitle className="text-lg" style={{ color: T.text }}>{editingId ? "Edit Testimonial" : "New Testimonial"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Photo upload */}
            <div className="space-y-3">
              <Label style={{ color: T.text }}>Photo</Label>
              <div className="flex items-center gap-6">
                {photoPreview ? (
                  <div className="relative group">
                    <img src={photoPreview} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 p-0.5" style={{ borderColor: "#6366f1" }} />
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Upload className="h-5 w-5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed p-0.5" style={{ borderColor: T.border, background: T.input }}>
                    <Image className="h-8 w-8" style={{ color: T.sub }} />
                  </div>
                )}
                <div className="flex-1">
                  <Label htmlFor="photo-upload" className="cursor-pointer inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/5" style={{ borderColor: T.border, color: T.text }}>
                    <Upload className="h-4 w-4" /> Upload Professional Photo
                  </Label>
                  <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  <p className="text-xs mt-2" style={{ color: T.sub }}>Recommended: Square image, min 400x400px</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Name *</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="John Doe" 
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Role / Title *</Label>
                <Input 
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value })} 
                  placeholder="CEO, Company" 
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label style={{ color: T.text }}>Quote *</Label>
              <Textarea 
                value={form.quote} 
                onChange={(e) => setForm({ ...form, quote: e.target.value })} 
                placeholder="What the employer said about your services..." 
                rows={4} 
                style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                className="resize-none"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-3">
                <Label style={{ color: T.text }}>Rating</Label>
                <RatingPicker value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Display Order</Label>
                <Input 
                  type="number" 
                  value={form.display_order} 
                  onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} 
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label style={{ color: T.text }}>Show on Landing Page</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                disabled={!form.name || !form.role || !form.quote || addMutation.isPending || updateMutation.isPending}
                onClick={() => editingId ? updateMutation.mutate(editingId) : addMutation.mutate()}
                className="gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90"
              >
                <Save className="h-4 w-4" /> {editingId ? "Update Testimonial" : "Save Testimonial"}
              </Button>
              <Button variant="outline" onClick={resetForm} className="gap-2" style={{ borderColor: T.border, color: T.text }}>
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
        </div>
      ) : testimonials.length === 0 ? (
        <Card style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <CardContent className="py-16 text-center" style={{ color: T.sub }}>
            No testimonials yet. Add your first one to showcase employer satisfaction!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card 
              key={t.id} 
              style={{ 
                background: T.card, 
                border: `1px solid ${T.border}`,
                backdropFilter: "blur(12px)"
              }}
              className={cn("group relative transition-all hover:shadow-xl hover:shadow-indigo-500/5", !t.is_active && "opacity-60 grayscale")}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {t.photo_path ? (
                      <img src={t.photo_path} alt={t.name} className="h-14 w-14 rounded-full object-cover border-2 p-0.5" style={{ borderColor: "#6366f1" }} />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-bold text-xl" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc" }}>
                        {t.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold truncate" style={{ color: T.text }}>{t.name}</p>
                      <p className="text-[10px] uppercase font-semibold tracking-wider truncate" style={{ color: T.sub }}>{t.role}</p>
                      <div className="mt-1">
                        <InlineRatingPicker id={t.id} value={t.rating} />
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5" style={{ borderColor: T.border, color: T.sub }}>
                    #{t.display_order}
                  </Badge>
                </div>
                <p className="text-sm italic leading-relaxed line-clamp-4" style={{ color: T.text }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: T.border }}>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={t.is_active}
                      onCheckedChange={(v) => toggleActive.mutate({ id: t.id, is_active: v })}
                      className="scale-75"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.is_active ? "#4ade80" : T.sub }}>
                      {t.is_active ? "Live" : "Hidden"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => startEdit(t)} 
                      className="h-8 w-8 hover:bg-white/5"
                      style={{ color: T.sub }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                      onClick={() => { if(confirm("Delete testimonial?")) deleteMutation.mutate(t.id); }}
                    >
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
