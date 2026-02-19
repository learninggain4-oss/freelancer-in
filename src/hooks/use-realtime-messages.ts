import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  file_path: string | null;
  file_name: string | null;
  is_read: boolean;
  is_deleted: boolean;
  edited_at: string | null;
  parent_message_id: string | null;
  created_at: string;
  sender?: { full_name: string[]; user_type: string } | null;
  reactions?: Reaction[];
  reply_count?: number;
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export const useRealtimeMessages = (chatRoomId: string | undefined) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", chatRoomId],
    queryFn: async () => {
      if (!chatRoomId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:sender_id(full_name, user_type)")
        .eq("chat_room_id", chatRoomId)
        .is("parent_message_id", null) // Only top-level messages
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Fetch reactions for all messages
      const messageIds = (data || []).map((m: any) => m.id);
      let reactions: any[] = [];
      if (messageIds.length > 0) {
        const { data: rxns } = await supabase
          .from("message_reactions")
          .select("*")
          .in("message_id", messageIds);
        reactions = rxns || [];
      }

      // Fetch reply counts
      const { data: replyCounts } = await supabase
        .from("messages")
        .select("parent_message_id")
        .in("parent_message_id", messageIds);

      const replyCountMap = new Map<string, number>();
      (replyCounts || []).forEach((r: any) => {
        replyCountMap.set(r.parent_message_id, (replyCountMap.get(r.parent_message_id) || 0) + 1);
      });

      return (data || []).map((msg: any) => ({
        ...msg,
        reactions: reactions.filter((r) => r.message_id === msg.id),
        reply_count: replyCountMap.get(msg.id) || 0,
      })) as Message[];
    },
    enabled: !!chatRoomId,
    refetchInterval: 15000,
  });

  // Subscribe to real-time changes (INSERT, UPDATE, DELETE)
  useEffect(() => {
    if (!chatRoomId) return;

    const channel = supabase
      .channel(`messages:${chatRoomId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `chat_room_id=eq.${chatRoomId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", chatRoomId] });
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "message_reactions",
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", chatRoomId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, queryClient]);

  // Mark messages as read
  useEffect(() => {
    if (!chatRoomId || !profile?.id || messages.length === 0) return;
    const unreadIds = messages
      .filter((m) => !m.is_read && m.sender_id !== profile.id)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      supabase
        .from("messages")
        .update({ is_read: true })
        .in("id", unreadIds)
        .then();
    }
  }, [messages, chatRoomId, profile?.id]);

  const sendMessage = async (content: string, parentMessageId?: string, filePath?: string, fileName?: string) => {
    if (!chatRoomId || !profile?.id) return;
    const insert: any = {
      chat_room_id: chatRoomId,
      sender_id: profile.id,
      content,
    };
    if (parentMessageId) insert.parent_message_id = parentMessageId;
    if (filePath) insert.file_path = filePath;
    if (fileName) insert.file_name = fileName;
    const { error } = await supabase.from("messages").insert(insert);
    if (error) throw error;
  };

  const editMessage = async (messageId: string, newContent: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ content: newContent, edited_at: new Date().toISOString() })
      .eq("id", messageId);
    if (error) throw error;
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ is_deleted: true, content: "" })
      .eq("id", messageId);
    if (error) throw error;
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!profile?.id) return;
    // Check if already reacted
    const { data: existing } = await supabase
      .from("message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", profile.id)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existing) {
      await supabase.from("message_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("message_reactions").insert({
        message_id: messageId,
        user_id: profile.id,
        emoji,
      });
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
  };
};

// Separate hook for thread messages (must be called at top level)
export const useThreadMessages = (parentMessageId: string | undefined) => {
  return useQuery({
    queryKey: ["thread-messages", parentMessageId],
    queryFn: async () => {
      if (!parentMessageId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:sender_id(full_name, user_type)")
        .eq("parent_message_id", parentMessageId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const messageIds = (data || []).map((m: any) => m.id);
      let reactions: any[] = [];
      if (messageIds.length > 0) {
        const { data: rxns } = await supabase
          .from("message_reactions")
          .select("*")
          .in("message_id", messageIds);
        reactions = rxns || [];
      }
      return (data || []).map((msg: any) => ({
        ...msg,
        reactions: reactions.filter((r: any) => r.message_id === msg.id),
        reply_count: 0,
      })) as Message[];
    },
    enabled: !!parentMessageId,
  });
};
