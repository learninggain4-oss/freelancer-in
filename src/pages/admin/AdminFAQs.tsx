import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Pencil, Save, X } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

const AdminFAQs = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ question: "", answer: "", display_order: 0 });
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [showAdd, setShowAdd] = useState(false);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs" as any)
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as unknown as FAQ[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (faq: { question: string; answer: string }) => {
      const maxOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.display_order)) : 0;
      const { error } = await supabase
        .from("faqs" as any)
        .insert({ question: faq.question, answer: faq.answer, display_order: maxOrder + 1 } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      setNewFaq({ question: "", answer: "" });
      setShowAdd(false);
      toast.success("FAQ added");
    },
    onError: () => toast.error("Failed to add FAQ"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; question?: string; answer?: string; display_order?: number; is_active?: boolean }) => {
      const { error } = await supabase.from("faqs" as any).update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      setEditingId(null);
      toast.success("FAQ updated");
    },
    onError: () => toast.error("Failed to update FAQ"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("FAQ deleted");
    },
    onError: () => toast.error("Failed to delete FAQ"),
  });

  const startEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setEditForm({ question: faq.question, answer: faq.answer, display_order: faq.display_order });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">FAQ Management</h2>
        <Button onClick={() => setShowAdd(true)} disabled={showAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add FAQ
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Question"
              value={newFaq.question}
              onChange={(e) => setNewFaq((p) => ({ ...p, question: e.target.value }))}
            />
            <Textarea
              placeholder="Answer"
              value={newFaq.answer}
              onChange={(e) => setNewFaq((p) => ({ ...p, answer: e.target.value }))}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => addMutation.mutate(newFaq)}
                disabled={!newFaq.question.trim() || !newFaq.answer.trim() || addMutation.isPending}
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : faqs.length === 0 ? (
        <p className="text-muted-foreground text-sm">No FAQs yet. Add one to get started.</p>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.id}>
              <CardContent className="p-4">
                {editingId === faq.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editForm.question}
                      onChange={(e) => setEditForm((p) => ({ ...p, question: e.target.value }))}
                    />
                    <Textarea
                      value={editForm.answer}
                      onChange={(e) => setEditForm((p) => ({ ...p, answer: e.target.value }))}
                      rows={3}
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground">Order:</label>
                      <Input
                        type="number"
                        className="w-20"
                        value={editForm.display_order}
                        onChange={(e) => setEditForm((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => updateMutation.mutate({ id: faq.id, ...editForm })}
                        disabled={updateMutation.isPending}
                      >
                        <Save className="h-3 w-3" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{faq.question}</p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Order: {faq.display_order}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={faq.is_active}
                        onCheckedChange={(checked) => updateMutation.mutate({ id: faq.id, is_active: checked })}
                      />
                      <Button size="icon" variant="ghost" onClick={() => startEdit(faq)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(faq.id)}
                      >
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

export default AdminFAQs;
