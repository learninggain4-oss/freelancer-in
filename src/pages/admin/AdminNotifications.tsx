import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search, Bell, Pencil, EyeOff, ChevronUp, Save, Send, CheckCheck, Trash2,
  Filter, X, Users, UserCheck, Building2, User,
} from "lucide-react";
import { toast } from "sonner";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
  is_cleared: boolean;
  profile?: { full_name: string[]; user_code: string[]; user_type: string };
};

/* ───────── Send Notification Form ───────── */
const SendNotificationForm = ({ onSent }: { onSent: () => void }) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [target, setTarget] = useState<"all" | "employees" | "clients" | "specific">("all");
  const [specificUserId, setSpecificUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-for-notif", userSearch],
    queryFn: async () => {
      if (!userSearch || userSearch.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, user_code, user_type")
        .or(`full_name.cs.{${userSearch}},user_code.cs.{${userSearch}}`)
        .limit(10);
      return data || [];
    },
    enabled: target === "specific" && userSearch.length >= 2,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      let userIds: string[] = [];
      if (target === "specific") {
        if (!specificUserId) throw new Error("Select a user");
        userIds = [specificUserId];
      } else {
        let query = supabase.from("profiles").select("user_id");
        if (target === "employees") query = query.eq("user_type", "employee");
        if (target === "clients") query = query.eq("user_type", "client");
        const { data } = await query;
        userIds = (data || []).map((p) => p.user_id);
      }
      if (userIds.length === 0) throw new Error("No users found for this target");

      const rows = userIds.map((uid) => ({
        user_id: uid,
        title,
        message,
        type,
      }));

      // Insert in batches of 100
      for (let i = 0; i < rows.length; i += 100) {
        const { error } = await supabase.from("notifications").insert(rows.slice(i, i + 100));
        if (error) throw error;
      }
      return userIds.length;
    },
    onSuccess: (count) => {
      toast.success(`Notification sent to ${count} user(s)`);
      setTitle("");
      setMessage("");
      setType("info");
      setTarget("all");
      setSpecificUserId("");
      setUserSearch("");
      setOpen(false);
      onSent();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <Button onClick={() => setOpen(!open)} className="gap-2">
        <Send className="h-4 w-4" />
        Send Notification
      </Button>

      {open && (
        <Card className="mt-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Compose Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Notification message..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Target Audience</Label>
              <Select value={target} onValueChange={(v: any) => { setTarget(v); setSpecificUserId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all"><span className="flex items-center gap-1.5"><Users className="h-3 w-3" /> All Users</span></SelectItem>
                  <SelectItem value="employees"><span className="flex items-center gap-1.5"><UserCheck className="h-3 w-3" /> All Employees</span></SelectItem>
                  <SelectItem value="clients"><span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> All Clients</span></SelectItem>
                  <SelectItem value="specific"><span className="flex items-center gap-1.5"><User className="h-3 w-3" /> Specific User</span></SelectItem>
                </SelectContent>
              </Select>
            </div>

            {target === "specific" && (
              <div className="space-y-2">
                <Input
                  placeholder="Search user by name or code..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {users.length > 0 && (
                  <div className="rounded-lg border bg-card max-h-36 overflow-y-auto divide-y">
                    {users.map((u: any) => (
                      <button
                        key={u.user_id}
                        onClick={() => { setSpecificUserId(u.user_id); setUserSearch(u.full_name?.[0] || ""); }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${specificUserId === u.user_id ? "bg-primary/10" : ""}`}
                      >
                        <span className="font-medium text-foreground">{u.full_name?.[0]}</span>
                        <Badge variant="outline" className="text-[10px]">{u.user_code?.[0]}</Badge>
                        <Badge variant="secondary" className="ml-auto text-[10px]">{u.user_type}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={() => sendMutation.mutate()}
              disabled={!title.trim() || !message.trim() || sendMutation.isPending}
            >
              {sendMutation.isPending ? "Sending..." : "Send Notification"}
              <Send className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ───────── Main Page ───────── */
const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCleared, setShowCleared] = useState(false);
  const [expandedEdit, setExpandedEdit] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterReadStatus, setFilterReadStatus] = useState<string>("all");
  const [filterUserType, setFilterUserType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin-notifications", search, showCleared, filterType, filterReadStatus, filterUserType],
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*, profile:user_id(full_name, user_code, user_type)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!showCleared) query = query.eq("is_cleared", false);
      if (filterType !== "all") query = query.eq("type", filterType);
      if (filterReadStatus === "unread") query = query.eq("is_read", false);
      if (filterReadStatus === "read") query = query.eq("is_read", true);
      const { data, error } = await query;
      if (error) throw error;
      let results = (data || []) as unknown as Notification[];

      if (filterUserType !== "all") {
        results = results.filter((n) => (n.profile as any)?.user_type === filterUserType);
      }
      if (search) {
        const s = search.toLowerCase();
        results = results.filter((n) =>
          n.title.toLowerCase().includes(s) ||
          n.message.toLowerCase().includes(s) ||
          (n.profile as any)?.full_name?.[0]?.toLowerCase().includes(s) ||
          (n.profile as any)?.user_code?.[0]?.toLowerCase().includes(s)
        );
      }
      return results;
    },
  });

  const clearMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_cleared: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Notification cleared"); queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_cleared: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Notification restored"); queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("notifications").update({
        title: data.title,
        message: data.message,
        type: data.type,
        is_read: data.is_read,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notification updated");
      setExpandedEdit(null);
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Bulk actions
  const bulkClearMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("notifications").update({ is_cleared: true }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${selectedIds.size} notification(s) cleared`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkMarkReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${selectedIds.size} notification(s) marked as read`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (n: Notification) => {
    if (expandedEdit === n.id) { setExpandedEdit(null); return; }
    setEditForm({ title: n.title, message: n.message, type: n.type, is_read: n.is_read });
    setExpandedEdit(n.id);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const activeFilterCount = [filterType !== "all", filterReadStatus !== "all", filterUserType !== "all"].filter(Boolean).length;

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      info: "bg-primary/15 text-primary border-primary/30",
      success: "bg-accent/15 text-accent border-accent/30",
      warning: "bg-warning/15 text-warning border-warning/30",
      error: "bg-destructive/15 text-destructive border-destructive/30",
    };
    return <Badge variant="outline" className={map[type] || ""}>{type}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">Notification Management</h1>
        <div className="flex items-center gap-2">
          <Switch checked={showCleared} onCheckedChange={setShowCleared} id="show-cleared-notif" />
          <Label htmlFor="show-cleared-notif" className="text-xs text-muted-foreground">Show cleared</Label>
        </div>
      </div>

      {/* Send Notification */}
      <SendNotificationForm onSent={() => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] })} />

      {/* Search & Filter bar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 min-w-4 rounded-full px-1 text-[10px]">{activeFilterCount}</Badge>
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardContent className="flex flex-wrap gap-3 p-3">
            <div className="space-y-1 min-w-[140px]">
              <Label className="text-xs">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[140px]">
              <Label className="text-xs">Read Status</Label>
              <Select value={filterReadStatus} onValueChange={setFilterReadStatus}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[140px]">
              <Label className="text-xs">User Type</Label>
              <Select value={filterUserType} onValueChange={setFilterUserType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="employee">Employees</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="self-end text-xs gap-1"
              onClick={() => { setFilterType("all"); setFilterReadStatus("all"); setFilterUserType("all"); }}
            >
              <X className="h-3 w-3" /> Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions Bar */}
      {notifications.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === notifications.length && notifications.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-input"
            />
            Select all ({notifications.length})
          </label>
          {selectedIds.size > 0 && (
            <>
              <span className="text-xs text-primary font-medium">{selectedIds.size} selected</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => bulkMarkReadMutation.mutate(Array.from(selectedIds))}
                disabled={bulkMarkReadMutation.isPending}
              >
                <CheckCheck className="h-3 w-3" /> Mark Read
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive">
                    <EyeOff className="h-3 w-3" /> Clear Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear {selectedIds.size} notification(s)?</AlertDialogTitle>
                    <AlertDialogDescription>These will be soft-deleted and can be restored later.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => bulkClearMutation.mutate(Array.from(selectedIds))}>Clear</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      )}

      {/* Notification List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <Card key={n.id} className={`${n.is_cleared ? "opacity-60 border-dashed" : ""} ${selectedIds.has(n.id) ? "ring-2 ring-primary/30" : ""}`}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(n.id)}
                    onChange={() => toggleSelect(n.id)}
                    className="mt-1 rounded border-input"
                  />
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Bell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground text-sm">{n.title}</span>
                      {typeBadge(n.type)}
                      {!n.is_read && <Badge variant="secondary" className="text-[10px]">Unread</Badge>}
                      {n.is_cleared && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-xs text-muted-foreground">
                      To: {(n.profile as any)?.full_name?.[0] || "Unknown"} ({(n.profile as any)?.user_code?.[0] || ""})
                      {(n.profile as any)?.user_type && (
                        <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0">{(n.profile as any)?.user_type}</Badge>
                      )}
                      {" • "}
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap pl-7">
                  <Button size="sm" variant="outline" onClick={() => startEdit(n)}>
                    {expandedEdit === n.id ? <ChevronUp className="mr-1 h-3 w-3" /> : <Pencil className="mr-1 h-3 w-3" />}
                    {expandedEdit === n.id ? "Close" : "Edit"}
                  </Button>
                  {n.is_cleared ? (
                    <Button size="sm" variant="outline" onClick={() => restoreMutation.mutate(n.id)}>Restore</Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-destructive">
                          <EyeOff className="mr-1 h-3 w-3" /> Clear
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear this notification?</AlertDialogTitle>
                          <AlertDialogDescription>Soft-delete this notification. It can be restored later.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => clearMutation.mutate(n.id)}>Clear</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Expandable Edit Row */}
                {expandedEdit === n.id && (
                  <div className="mt-3 space-y-3 rounded-lg border bg-muted/30 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Title</Label>
                        <Input value={editForm.title} onChange={(e) => setEditForm((f: any) => ({ ...f, title: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={editForm.type} onValueChange={(v) => setEditForm((f: any) => ({ ...f, type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Message</Label>
                      <Textarea value={editForm.message} onChange={(e) => setEditForm((f: any) => ({ ...f, message: e.target.value }))} rows={2} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={editForm.is_read} onCheckedChange={(v) => setEditForm((f: any) => ({ ...f, is_read: v }))} />
                      <Label className="text-xs">Mark as read</Label>
                    </div>
                    <Button className="w-full" onClick={() => editMutation.mutate({ id: n.id, data: editForm })} disabled={editMutation.isPending}>
                      <Save className="mr-1 h-3 w-3" /> {editMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No notifications found</p>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
