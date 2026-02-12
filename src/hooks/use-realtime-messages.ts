import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  created_at: string;
  sender?: { full_name: string[]; user_type: string } | null;
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
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!chatRoomId,
  });

  useEffect(() => {
    if (!chatRoomId) return;

    const channel = supabase
      .channel(`messages:${chatRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", chatRoomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, queryClient]);

  const sendMessage = async (content: string) => {
    if (!chatRoomId || !profile?.id) return;
    const { error } = await supabase.from("messages").insert({
      chat_room_id: chatRoomId,
      sender_id: profile.id,
      content,
    });
    if (error) throw error;
  };

  return { messages, isLoading, sendMessage };
};
