import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Search, X, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useNotifications, getNotificationRoute } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const PAGE_SIZE = 15;

const TYPE_STYLES: Record<string, string> = {
  info: "bg-primary/10 text-primary",
  success: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
};

const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllRead,
    basePath,
  } = useNotifications();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Get saved preferences
  const savedPrefs = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("notification_prefs") || "{}");
    } catch {
      return {};
    }
  }, []);

  const filtered = useMemo(() => {
    let list = notifications;

    // Filter by preferences
    const categoryMap: Record<string, string[]> = {
      project: ["project", "application", "chat"],
      withdrawal: ["withdrawal"],
      transaction: ["transaction"],
      system: ["system", "announcement"],
    };
    const disabledTypes = Object.entries(savedPrefs)
      .filter(([, v]) => v === false)
      .flatMap(([k]) => categoryMap[k] || []);
    if (disabledTypes.length > 0) {
      list = list.filter((n) => !disabledTypes.includes(n.reference_type || ""));
    }

    // Tab filter
    if (tab === "unread") list = list.filter((n) => !n.is_read);
    if (tab === "read") list = list.filter((n) => n.is_read);

    // Type filter
    if (typeFilter) list = list.filter((n) => n.type === typeFilter);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q)
      );
    }

    return list;
  }, [notifications, tab, typeFilter, search, savedPrefs]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleClick = (n: (typeof notifications)[0]) => {
    if (!n.is_read) markAsRead.mutate(n.id);
    const route = getNotificationRoute(n.reference_type, n.reference_id, basePath);
    if (route) navigate(route);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) pages.push(i);
    }
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {pages.map((p, i) => {
            const prev = pages[i - 1];
            const showEllipsis = prev && p - prev > 1;
            return (
              <span key={p} className="contents">
                {showEllipsis && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    isActive={p === currentPage}
                    onClick={() => setPage(p)}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              </span>
            );
          })}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearAllRead.mutate()}
            disabled={clearAllRead.isPending}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clear read
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        {["info", "success", "warning", "error"].map((t) => (
          <Badge
            key={t}
            variant={typeFilter === t ? "default" : "outline"}
            className="cursor-pointer capitalize"
            onClick={() => { setTypeFilter(typeFilter === t ? null : t); setPage(1); }}
          >
            <Filter className="mr-1 h-3 w-3" />
            {t}
          </Badge>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-2">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
          ) : paginated.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No notifications found
            </p>
          ) : (
            paginated.map((n) => (
              <Card
                key={n.id}
                className={cn(
                  "flex items-start gap-3 p-4 transition-colors hover:bg-muted/50 cursor-pointer",
                  !n.is_read && "bg-primary/5 border-primary/20"
                )}
                onClick={() => handleClick(n)}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    TYPE_STYLES[n.type] ?? TYPE_STYLES.info
                  )}
                >
                  {n.is_read ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Bell className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                      {n.type}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification.mutate(n.id);
                  }}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </Card>
            ))
          )}

          {/* Pagination info */}
          {filtered.length > PAGE_SIZE && (
            <p className="text-center text-xs text-muted-foreground">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
          )}
          {renderPagination()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications;
