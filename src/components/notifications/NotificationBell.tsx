import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import NotificationPanel from "./NotificationPanel";

const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const basePath = profile?.user_type === "client" ? "/client" : "/employee";

  return (
    <>
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(true)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="top" className="h-[85vh] p-0">
          <SheetTitle className="sr-only">Notifications</SheetTitle>
          <NotificationPanel
            onClose={() => setOpen(false)}
            onViewAll={() => {
              setOpen(false);
              navigate(`${basePath}/notifications`);
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default NotificationBell;
