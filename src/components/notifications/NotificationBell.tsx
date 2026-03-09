import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const typeIcon: Record<string, string> = {
    info: "bg-primary/10 text-primary",
    success: "bg-accent/10 text-accent",
    warning: "bg-warning/10 text-warning",
    error: "bg-destructive/10 text-destructive",
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary"
              onClick={() => markAllAsRead.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markAsRead.mutate(n.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  !n.is_read && "bg-primary/5"
                )}
              >
                <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", typeIcon[n.type] ?? typeIcon.info)}>
                  {n.is_read ? <Check className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
