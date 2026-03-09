import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  is_cleared: boolean;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

const NOTIFICATION_ROUTE_MAP: Record<string, string> = {
  withdrawal: "wallet/withdrawals",
  project: "projects",
  application: "requests",
  transaction: "wallet/transactions",
  attendance: "attendance",
  wallet: "wallet",
};

export const getNotificationRoute = (
  referenceType: string | null,
  referenceId: string | null,
  basePath: string
): string | null => {
  if (!referenceType) return null;
  if (referenceType === "chat" && referenceId) {
    return `${basePath}/projects/chat/${referenceId}`;
  }
  const segment = NOTIFICATION_ROUTE_MAP[referenceType];
  return segment ? `${basePath}/${segment}` : null;
};

export const useNotifications = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_cleared", false)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const clearNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_cleared: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const clearAllRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_cleared: true })
        .eq("user_id", user.id)
        .eq("is_read", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const basePath = profile?.user_type === "client" ? "/client" : "/employee";

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllRead,
    basePath,
  };
};
