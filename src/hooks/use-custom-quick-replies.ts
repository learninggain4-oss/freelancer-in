import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomQuickReply {
  id: string;
  category: string;
  template_text: string;
  shortcut: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export const useCustomQuickReplies = () => {
  const queryClient = useQueryClient();

  const { data: customReplies = [], isLoading } = useQuery({
    queryKey: ["custom-quick-replies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_quick_replies")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as CustomQuickReply[];
    },
  });

  const addReply = useMutation({
    mutationFn: async (input: { category: string; template_text: string; shortcut?: string; created_by: string }) => {
      const { error } = await supabase.from("custom_quick_replies").insert({
        category: input.category,
        template_text: input.template_text,
        shortcut: input.shortcut || null,
        created_by: input.created_by,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-quick-replies"] });
      toast.success("Template added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteReply = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_quick_replies")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-quick-replies"] });
      toast.success("Template removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateReply = useMutation({
    mutationFn: async (input: { id: string; category?: string; template_text?: string; shortcut?: string }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (input.category) updates.category = input.category;
      if (input.template_text) updates.template_text = input.template_text;
      if (input.shortcut !== undefined) updates.shortcut = input.shortcut || null;
      const { error } = await supabase
        .from("custom_quick_replies")
        .update(updates)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-quick-replies"] });
      toast.success("Template updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Group custom replies by category
  const customCategories = customReplies.reduce<Record<string, CustomQuickReply[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  return { customReplies, customCategories, isLoading, addReply, deleteReply, updateReply };
};
