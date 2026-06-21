import { useState } from "react";
import { Bell, Check, Trash2, MessageCircle, Briefcase, AlertTriangle, Megaphone, Inbox, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications, type Notification } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";

type FilterTab = "all" | "unread" | "chat" | "project" | "alert";

const typeConfig: Record<string, { icon: React.ElementType; classes: string; label: string }> = {
  info: { icon: Briefcase, classes: "bg-primary/10 text-primary", label: "Project" },
  success: { icon: Megaphone, classes: "bg-accent/10 text-accent", label: "Announcement" },
  warning: { icon: AlertTriangle, classes: "bg-warning/10 text-warning", label: "Alert" },
  error: { icon: AlertTriangle, classes: "bg-destructive/10 text-destructive", label: "Alert" },
  chat: { icon: MessageCircle, classes: "bg-secondary/20 text-secondary-foreground", label: "Chat" },
};

function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return "Earlier";
}

function groupByDate(items: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  for (const n of items) {
    const key = getDateGroup(n.created_at);
    (groups[key] ??= []).push(n);
  }
  return groups;
}

interface NotificationPanelProps {
  onClose: () => void;
  onViewAll?: () => void;
}

const NotificationPanel = ({ onClose, onViewAll }: NotificationPanelProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllRead } = useNotifications();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered = notifications.filter((n) => {
    switch (activeTab) {
      case "unread": return !n.is_read;
      case "chat": return n.reference_type === "chat" || n.type === "chat";
      case "project": return n.type === "info" || n.reference_type === "project";
      case "alert": return n.type === "warning" || n.type === "error";
      default: return true;
    }
  });

  const grouped = groupByDate(filtered);
  const groupOrder = ["Today", "Yesterday", "Earlier"];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => markAllAsRead.mutate()}>
              <Check className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
          {notifications.some((n) => n.is_read) && (
            <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => clearAllRead.mutate()}>
              <Trash2 className="mr-1 h-3 w-3" /> Clear read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b px-4 py-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 text-xs">Unread</TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 text-xs">Chat</TabsTrigger>
            <TabsTrigger value="project" className="flex-1 text-xs">Projects</TabsTrigger>
            <TabsTrigger value="alert" className="flex-1 text-xs">Alerts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Notification List */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Inbox className="mb-3 h-12 w-12 opacity-40" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs">You're all caught up!</p>
          </div>
        ) : (
          groupOrder.map((group) => {
            const items = grouped[group];
            if (!items?.length) return null;
            return (
              <div key={group}>
                <div className="sticky top-0 z-10 bg-muted/80 px-4 py-1.5 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
                </div>
                {items.map((n) => {
                  const config = typeConfig[n.type] ?? typeConfig.info;
                  const Icon = config.icon;
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "group flex items-start gap-3 border-b px-4 py-3 transition-colors",
                        !n.is_read && "bg-primary/5"
                      )}
                    >
                      <button
                        onClick={() => !n.is_read && markAsRead.mutate(n.id)}
                        className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", config.classes)}
                      >
                        {n.is_read ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{n.title}</p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.message}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => deleteNotification.mutate(n.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </ScrollArea>

      {/* View All link */}
      {onViewAll && (
        <div className="border-t px-4 py-2">
          <Button variant="ghost" className="w-full text-xs text-primary" onClick={onViewAll}>
            <ExternalLink className="mr-1 h-3 w-3" /> View all notifications
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
