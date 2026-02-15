import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  target_audience: string;
}

const AnnouncementPopup = () => {
  const { user, profile } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    const fetchAnnouncement = async () => {
      // Determine which audiences apply to this user
      const audiences = ["everyone"];
      if (profile.user_type === "employee") audiences.push("employees");
      if (profile.user_type === "client") audiences.push("clients");

      // Get active announcements not yet dismissed by this user
      const { data: dismissed } = await supabase
        .from("announcement_dismissals")
        .select("announcement_id")
        .eq("user_id", user.id);

      const dismissedIds = (dismissed ?? []).map((d: any) => d.announcement_id);

      const { data: announcements } = await supabase
        .from("announcements")
        .select("id, title, message, target_audience")
        .eq("is_active", true)
        .in("target_audience", audiences)
        .order("created_at", { ascending: false });

      // Find the first undismissed one
      const undismissed = (announcements ?? []).find(
        (a: any) => !dismissedIds.includes(a.id)
      );

      if (undismissed) {
        setAnnouncement(undismissed);
        setOpen(true);
      }
    };

    fetchAnnouncement();
  }, [user, profile]);

  const handleDismiss = async () => {
    if (!announcement || !user) return;
    setOpen(false);

    await supabase.from("announcement_dismissals").insert({
      announcement_id: announcement.id,
      user_id: user.id,
    });

    setAnnouncement(null);
  };

  if (!announcement) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>{announcement.title}</DialogTitle>
          </div>
          <DialogDescription className="whitespace-pre-wrap pt-2 text-foreground/80">
            {announcement.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleDismiss} className="w-full sm:w-auto">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementPopup;
