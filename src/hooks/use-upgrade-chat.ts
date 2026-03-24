import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UpgradeMessage {
  id: string;
  upgrade_request_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const useUpgradeChat = (upgradeRequestId: string | undefined) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["upgrade-messages", upgradeRequestId],
    queryFn: async () => {
      if (!upgradeRequestId) return [];
      const { data, error } = await supabase
        .from("upgrade_request_messages")
        .select("*")
        .eq("upgrade_request_id", upgradeRequestId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as UpgradeMessage[];
    },
    enabled: !!upgradeRequestId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!upgradeRequestId) return;
    const channel = supabase
      .channel(`upgrade-msgs:${upgradeRequestId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "upgrade_request_messages",
        filter: `upgrade_request_id=eq.${upgradeRequestId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["upgrade-messages", upgradeRequestId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [upgradeRequestId, queryClient]);

  // Mark as read
  useEffect(() => {
    if (!upgradeRequestId || !profile?.id || messages.length === 0) return;
    const unreadIds = messages
      .filter((m) => !m.is_read && m.sender_id !== profile.id)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      supabase
        .from("upgrade_request_messages")
        .update({ is_read: true })
        .in("id", unreadIds)
        .then();
    }
  }, [messages, upgradeRequestId, profile?.id]);

  const sendMessage = async (content: string) => {
    if (!upgradeRequestId || !profile?.id) return;
    const { error } = await supabase.from("upgrade_request_messages").insert({
      upgrade_request_id: upgradeRequestId,
      sender_id: profile.id,
      content,
    });
    if (error) throw error;
  };

  return { messages, isLoading, sendMessage };
};
