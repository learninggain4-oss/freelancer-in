import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { playNotificationSound, showBrowserPush } from "@/utils/notification-sounds";

/**
 * Global hook: shows a toast when a new chat message arrives
 * and the user is NOT currently viewing that chat room.
 */
export const useChatNotifications = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const locationRef = useRef(location.pathname);

  // Keep a ref so the realtime callback always sees the latest path
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("global-chat-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            sender_id: string;
            chat_room_id: string;
            content: string;
            parent_message_id: string | null;
          };

          // Don't notify for own messages
          if (msg.sender_id === profile.id) return;

          // Don't notify if user is already viewing this chat
          if (locationRef.current.includes("/chat/")) return;

          // Fetch sender name for the toast
          const { data: sender } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", msg.sender_id)
            .maybeSingle();

          const senderName =
            sender?.full_name?.[0] ?? "Someone";
          const preview =
            msg.content.length > 60
              ? msg.content.slice(0, 60) + "…"
              : msg.content;

          toast.info(`${senderName}: ${preview}`, {
            description: "New chat message",
            duration: 5000,
          });

          playNotificationSound("chat");
          showBrowserPush(senderName, preview, "chat");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);
};

