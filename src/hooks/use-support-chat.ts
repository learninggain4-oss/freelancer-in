import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  file_path: string | null;
  file_name: string | null;
  is_read: boolean;
  created_at: string;
  sender?: { full_name: string[]; user_type: string } | null;
}

export const useSupportChat = (conversationId: string | undefined) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["support-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("support_messages")
        .select("*, sender:sender_id(full_name, user_type)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as SupportMessage[];
    },
    enabled: !!conversationId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`support-messages:${conversationId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "support_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["support-messages", conversationId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  // Mark as read
  useEffect(() => {
    if (!conversationId || !profile?.id || messages.length === 0) return;
    const unreadIds = messages
      .filter((m) => !m.is_read && m.sender_id !== profile.id)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      supabase
        .from("support_messages")
        .update({ is_read: true })
        .in("id", unreadIds)
        .then();
    }
  }, [messages, conversationId, profile?.id]);

  const sendMessage = async (content: string, filePath?: string, fileName?: string) => {
    if (!conversationId || !profile?.id) return;
    const insert: any = {
      conversation_id: conversationId,
      sender_id: profile.id,
      content,
    };
    if (filePath) insert.file_path = filePath;
    if (fileName) insert.file_name = fileName;
    const { error } = await supabase.from("support_messages").insert(insert);
    if (error) throw error;
  };

  return { messages, isLoading, sendMessage };
};

/** Get or create a support conversation for the current user */
export const useMyConversation = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["my-support-conversation", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      // Try to find existing
      const { data: existing } = await supabase
        .from("support_conversations")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (existing) return existing;

      // Create new
      const { data: created, error } = await supabase
        .from("support_conversations")
        .insert({ user_id: profile.id })
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    enabled: !!profile?.id,
  });
};

/** Admin: list all support conversations with user info and last message */
export const useAllConversations = () => {
  return useQuery({
    queryKey: ["admin-support-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_conversations")
        .select("*, user:user_id(full_name, user_type, user_code, email)")
        .order("updated_at", { ascending: false });
      if (error) throw error;

      // Fetch last message + unread count for each conversation
      const enriched = await Promise.all(
        (data || []).map(async (conv: any) => {
          const { data: lastMsg } = await supabase
            .from("support_messages")
            .select("content, created_at, sender_id, is_read")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from("support_messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", conv.user_id); // unread from user perspective doesn't matter, we want unread for admin

          return {
            ...conv,
            last_message: lastMsg,
            // For admin, unread = messages sent by user that admin hasn't read
            unread_count: count || 0,
          };
        })
      );

      return enriched;
    },
    refetchInterval: 15000,
  });
};
