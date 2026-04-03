import { useEffect, useCallback } from "react";
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
  _optimistic?: boolean;
}

const fetchMessages = async (conversationId: string): Promise<SupportMessage[]> => {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*, sender:sender_id(full_name, user_type)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;

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
};

const fetchSingleMessage = async (messageId: string): Promise<SupportMessage | null> => {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*, sender:sender_id(full_name, user_type)")
    .eq("id", messageId)
    .maybeSingle();
  if (error || !data) return null;
  return { ...data, reactions: [] } as SupportMessage;
};

export const useSupportChat = (conversationId: string | undefined) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const QK = ["support-messages", conversationId];

  const { data: messages = [], isLoading } = useQuery({
    queryKey: QK,
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 4_000,
    refetchInterval: 5_000,          // poll every 5 s — catches admin msgs if RT misses
    refetchIntervalInBackground: false,
  });

  // ── Real-time subscriptions ──────────────────────────────────────────
  // Strategy: TWO parallel channels for maximum reliability
  //   1. Broadcast channel (`bc:conv:<id>`) — bypasses RLS entirely.
  //      Both sender (user/admin) explicitly broadcast a "ping" after each insert.
  //      Receiver triggers a full refetch immediately.
  //   2. postgres_changes (no server-side filter) — secondary safety net
  //      for cases where the broadcast is missed (reconnects, tab focus, etc.)
  useEffect(() => {
    if (!conversationId) return;

    // ── Channel 1: Broadcast (RLS-free, instant) ──
    const broadcastChannel = supabase
      .channel(`bc:conv:${conversationId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "new_message" }, () => {
        // Immediately refetch the full message list
        queryClient.invalidateQueries({ queryKey: QK });
      })
      .subscribe();

    // ── Channel 2: postgres_changes (no row filter — client-side filter instead) ──
    const pgChannel = supabase
      .channel(`pg:conv:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages" },
        async (payload) => {
          if ((payload.new as any).conversation_id !== conversationId) return;
          let newMsg: SupportMessage | null = await fetchSingleMessage((payload.new as any).id);
          if (!newMsg) {
            newMsg = { ...(payload.new as any), reactions: [] } as SupportMessage;
          }
          queryClient.setQueryData<SupportMessage[]>(QK, (prev = []) => {
            const withoutOpt = prev.filter(
              (m) => !m._optimistic || m.content !== newMsg!.content || m.sender_id !== newMsg!.sender_id
            );
            if (withoutOpt.some((m) => m.id === newMsg!.id)) return withoutOpt;
            return [...withoutOpt, newMsg!];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "support_messages" },
        async (payload) => {
          if ((payload.new as any).conversation_id !== conversationId) return;
          const updated = await fetchSingleMessage((payload.new as any).id);
          if (!updated) return;
          queryClient.setQueryData<SupportMessage[]>(QK, (prev = []) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "support_messages" },
        (payload) => {
          queryClient.setQueryData<SupportMessage[]>(QK, (prev = []) =>
            prev.filter((m) => m.id !== (payload.old as any).id)
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_message_reactions" },
        () => { queryClient.invalidateQueries({ queryKey: QK }); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(pgChannel);
    };
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mark incoming messages as read ─────────────────────────────────
  useEffect(() => {
    if (!conversationId || !profile?.id || messages.length === 0) return;
    const unreadIds = messages
      .filter((m) => !m.is_read && m.sender_id !== profile.id && !m._optimistic)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      supabase
        .from("support_messages")
        .update({ is_read: true })
        .in("id", unreadIds)
        .then();
    }
  }, [messages, conversationId, profile?.id]);

  // ── Send with optimistic update ─────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, filePath?: string, fileName?: string) => {
      if (!conversationId || !profile?.id) return;

      const tempId = `opt-${Date.now()}`;
      const optimistic: SupportMessage = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: profile.id,
        content,
        file_path: filePath ?? null,
        file_name: fileName ?? null,
        is_read: false,
        created_at: new Date().toISOString(),
        reactions: [],
        _optimistic: true,
      };

      // Show immediately
      queryClient.setQueryData<SupportMessage[]>(QK, (prev = []) => [...prev, optimistic]);

      const insert: any = { conversation_id: conversationId, sender_id: profile.id, content };
      if (filePath) insert.file_path = filePath;
      if (fileName) insert.file_name = fileName;

      const { error } = await supabase.from("support_messages").insert(insert);
      if (error) {
        // Roll back optimistic on failure
        queryClient.setQueryData<SupportMessage[]>(QK, (prev = []) =>
          prev.filter((m) => m.id !== tempId)
        );
        throw error;
      }
      // Broadcast a "ping" so the OTHER side's broadcast listener refetches immediately
      // (bypasses RLS — works even when postgres_changes events are blocked)
      supabase
        .channel(`bc:conv:${conversationId}`)
        .send({ type: "broadcast", event: "new_message", payload: {} });
    },
    [conversationId, profile?.id, queryClient] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Delete single message (optimistic + API) ────────────────────────
  const deleteMessage = useCallback(
    async (messageId: string, senderId: string) => {
      if (!profile?.id) return;
      const isAdmin = (profile as any)?.user_type === "admin";
      if (!isAdmin && senderId !== profile.id) throw new Error("You can only delete your own messages");

      // Optimistically remove from cache immediately
      queryClient.setQueryData<SupportMessage[]>(QK, (prev = []) =>
        prev.filter((m) => m.id !== messageId)
      );

      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token ?? "";
        const res = await fetch("/functions/v1/support-delete-message", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messageId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Delete failed");
      } catch (err: any) {
        // Restore on failure by refetching
        queryClient.invalidateQueries({ queryKey: QK });
        throw err;
      }
    },
    [profile?.id, queryClient] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Clear all messages in conversation (optimistic + API) ──────────
  const clearHistory = useCallback(
    async (conversationId: string) => {
      if (!profile?.id) return;

      // Optimistically clear cache immediately
      queryClient.setQueryData<SupportMessage[]>(QK, []);

      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token ?? "";
        const res = await fetch("/functions/v1/support-clear-history", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ conversationId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Clear failed");
      } catch (err: any) {
        // Restore on failure by refetching
        queryClient.invalidateQueries({ queryKey: QK });
        throw err;
      }
    },
    [profile?.id, queryClient] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Reactions ───────────────────────────────────────────────────────
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
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
    },
    [profile?.id]
  );

  return { messages, isLoading, sendMessage, deleteMessage, clearHistory, toggleReaction };
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
  const queryClient = useQueryClient();
  const AQK = ["admin-support-conversations"];

  useEffect(() => {
    const channel = supabase
      .channel("admin-support-conv-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, () => {
        queryClient.invalidateQueries({ queryKey: AQK });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "support_conversations" }, () => {
        queryClient.invalidateQueries({ queryKey: AQK });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return useQuery({
    queryKey: AQK,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_conversations")
        .select("*, user:user_id(full_name, user_type, user_code, email, last_seen_at, profile_photo_path)")
        .order("created_at", { ascending: true });
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
            .eq("sender_id", conv.user_id);   // messages FROM user that admin hasn't read

          return { ...conv, last_message: lastMsg, unread_count: count || 0 };
        })
      );

      return enriched;
    },
    staleTime: 10000,
  });
};
