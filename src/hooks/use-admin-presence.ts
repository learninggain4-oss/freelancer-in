import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAdminPresence = (upgradeRequestId: string | undefined) => {
  const { profile } = useAuth();
  const [adminOnline, setAdminOnline] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Poll admin online status every 30s
  const checkAdminOnline = useCallback(async () => {
    try {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (!adminRoles || adminRoles.length === 0) {
        setAdminOnline(false);
        return false;
      }
      const adminUserIds = adminRoles.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("last_seen_at")
        .in("user_id", adminUserIds);
      if (!profiles || profiles.length === 0) {
        setAdminOnline(false);
        return false;
      }
      const now = Date.now();
      const online = profiles.some((p: any) => {
        if (!p.last_seen_at) return false;
        return (now - new Date(p.last_seen_at).getTime()) < 5 * 60 * 1000;
      });
      setAdminOnline(online);
      return online;
    } catch {
      setAdminOnline(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkAdminOnline();
    const interval = setInterval(checkAdminOnline, 30000);
    return () => clearInterval(interval);
  }, [checkAdminOnline]);

  // Typing indicator via broadcast
  useEffect(() => {
    if (!upgradeRequestId) return;
    const channel = supabase
      .channel(`upgrade-typing:${upgradeRequestId}`)
      .on("broadcast", { event: "typing" }, (payload: any) => {
        const data = payload.payload;
        if (data?.userId === profile?.id) return; // ignore own typing
        if (data?.isTyping) {
          setIsAdminTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsAdminTyping(false), 3000);
        } else {
          setIsAdminTyping(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [upgradeRequestId, profile?.id]);

  // Broadcast own typing
  const broadcastTyping = useCallback((isTyping: boolean) => {
    if (!upgradeRequestId || !profile?.id) return;
    supabase.channel(`upgrade-typing:${upgradeRequestId}`).send({
      type: "broadcast",
      event: "typing",
      payload: {
        userId: profile.id,
        userName: profile.full_name?.join(" ") || "Employee",
        isTyping,
      },
    });
  }, [upgradeRequestId, profile?.id, profile?.full_name]);

  return { adminOnline, isAdminTyping, broadcastTyping, checkAdminOnline };
};
