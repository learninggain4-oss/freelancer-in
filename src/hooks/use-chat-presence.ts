import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PresenceState {
  onlineUsers: string[]; // profile IDs
  typingUsers: string[]; // profile IDs
}

export const useChatPresence = (chatRoomId: string | undefined) => {
  const { profile } = useAuth();
  const [presence, setPresence] = useState<PresenceState>({
    onlineUsers: [],
    typingUsers: [],
  });

  useEffect(() => {
    if (!chatRoomId || !profile?.id) return;

    const channel = supabase.channel(`presence:${chatRoomId}`, {
      config: { presence: { key: profile.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const online: string[] = [];
        const typing: string[] = [];
        Object.entries(state).forEach(([key, presences]) => {
          online.push(key);
          if (Array.isArray(presences) && presences.some((p: any) => p.is_typing)) {
            typing.push(key);
          }
        });
        setPresence({ onlineUsers: online, typingUsers: typing });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: profile.id,
            full_name: Array.isArray(profile.full_name)
              ? profile.full_name.join(" ")
              : profile.full_name,
            is_typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, profile?.id]);

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!chatRoomId || !profile?.id) return;
      const channel = supabase.channel(`presence:${chatRoomId}`);
      // We need to re-track with updated typing state
      // Instead, use a separate broadcast channel for typing
    },
    [chatRoomId, profile?.id]
  );

  return { ...presence, setTyping };
};

// Separate hook for typing broadcast (more efficient than presence re-tracking)
export const useTypingIndicator = (chatRoomId: string | undefined) => {
  const { profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!chatRoomId || !profile?.id) return;

    const channel = supabase.channel(`typing:${chatRoomId}`);
    
    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user_id !== profile.id) {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            if (payload.is_typing) {
              next.set(payload.user_id, payload.full_name);
            } else {
              next.delete(payload.user_id);
            }
            return next;
          });

          // Auto-clear after 3 seconds
          if (payload.is_typing) {
            setTimeout(() => {
              setTypingUsers((prev) => {
                const next = new Map(prev);
                next.delete(payload.user_id);
                return next;
              });
            }, 3000);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, profile?.id]);

  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (!chatRoomId || !profile?.id) return;
      const channel = supabase.channel(`typing:${chatRoomId}`);
      channel.send({
        type: "broadcast",
        event: "typing",
        payload: {
          user_id: profile.id,
          full_name: Array.isArray(profile.full_name)
            ? profile.full_name.join(" ")
            : profile.full_name,
          is_typing: isTyping,
        },
      });
    },
    [chatRoomId, profile?.id, profile?.full_name]
  );

  return { typingUsers, broadcastTyping };
};
