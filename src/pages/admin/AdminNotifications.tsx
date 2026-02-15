import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Bell, Pencil, EyeOff, ChevronUp, Save } from "lucide-react";
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
  profile?: { full_name: string[]; user_code: string[] };
};

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCleared, setShowCleared] = useState(false);
  const [expandedEdit, setExpandedEdit] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin-notifications", search, showCleared],
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*, profile:user_id(full_name, user_code)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!showCleared) query = query.eq("is_cleared", false);
      const { data, error } = await query;
      if (error) throw error;
      let results = (data || []) as unknown as Notification[];
      if (search) {
        const s = search.toLowerCase();
        results = results.filter(n =>
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

  const startEdit = (n: Notification) => {
    if (expandedEdit === n.id) { setExpandedEdit(null); return; }
    setEditForm({ title: n.title, message: n.message, type: n.type, is_read: n.is_read });
    setExpandedEdit(n.id);
  };

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Notification Management</h1>
        <div className="flex items-center gap-2">
          <Switch checked={showCleared} onCheckedChange={setShowCleared} id="show-cleared-notif" />
          <Label htmlFor="show-cleared-notif" className="text-xs text-muted-foreground">Show cleared</Label>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <Card key={n.id} className={n.is_cleared ? "opacity-60 border-dashed" : ""}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground text-sm">{n.title}</span>
                      {typeBadge(n.type)}
                      {!n.is_read && <Badge variant="secondary" className="text-[10px]">Unread</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-xs text-muted-foreground">
                      To: {(n.profile as any)?.full_name?.[0] || "Unknown"} ({(n.profile as any)?.user_code?.[0] || ""}) •{" "}
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {n.is_cleared && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
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
                        <Input value={editForm.type} onChange={(e) => setEditForm((f: any) => ({ ...f, type: e.target.value }))} placeholder="info / success / warning / error" />
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
