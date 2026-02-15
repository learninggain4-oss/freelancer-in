import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SupportReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

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
  reactions?: SupportReaction[];
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

      // Fetch reactions
      const msgIds = (data || []).map((m: any) => m.id);
      let reactions: any[] = [];
      if (msgIds.length > 0) {
        const { data: rxns } = await supabase
          .from("support_message_reactions")
          .select("*")
          .in("message_id", msgIds);
        reactions = rxns || [];
      }

      return (data || []).map((msg: any) => ({
        ...msg,
        reactions: reactions.filter((r) => r.message_id === msg.id),
      })) as SupportMessage[];
    },
    enabled: !!conversationId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`support-msgs:${conversationId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "support_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["support-messages", conversationId] });
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "support_message_reactions",
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

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!profile?.id) return;
    const { data: existing } = await supabase
      .from("support_message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", profile.id)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existing) {
      await supabase.from("support_message_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("support_message_reactions").insert({
        message_id: messageId,
        user_id: profile.id,
        emoji,
      });
    }
  };

  return { messages, isLoading, sendMessage, toggleReaction };
};

/** Get or create a support conversation for the current user */
export const useMyConversation = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["my-support-conversation", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data: existing } = await supabase
        .from("support_conversations")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (existing) return existing;

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
            .neq("sender_id", conv.user_id);

          return {
            ...conv,
            last_message: lastMsg,
            unread_count: count || 0,
          };
        })
      );

      return enriched;
    },
    refetchInterval: 15000,
  });
};
