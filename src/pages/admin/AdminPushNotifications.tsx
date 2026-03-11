import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Send, Users, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

type TargetMode = "all" | "employees" | "clients" | "custom";

const AdminPushNotifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetMode, setTargetMode] = useState<TargetMode>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ["push-subscribers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("push_subscriptions")
        .select("user_id, profile_id, created_at, endpoint");
      if (error) throw error;
      const rows = (data || []) as any[];

      const profileIds = [...new Set(rows.map((s) => s.profile_id).filter(Boolean))];
      let profileMap: Record<string, any> = {};
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, user_type")
          .in("id", profileIds as string[]);
        profileMap = (profiles || []).reduce((acc: any, p) => {
          acc[p.id] = { name: p.full_name?.[0] || p.email, email: p.email, user_type: p.user_type };
          return acc;
        }, {});
      }

      const grouped: Record<string, any> = {};
      for (const sub of rows) {
        if (!grouped[sub.user_id]) {
          const profile = sub.profile_id ? profileMap[sub.profile_id] : null;
          grouped[sub.user_id] = {
            user_id: sub.user_id,
            name: profile?.name || "Unknown",
            email: profile?.email || "",
            user_type: profile?.user_type || "",
            device_count: 0,
            created_at: sub.created_at,
          };
        }
        grouped[sub.user_id].device_count++;
      }
      return Object.values(grouped) as any[];
    },
  });

  const filteredSubscribers = useMemo(() => {
    let list = subscribers;
    if (targetMode === "employees") list = list.filter((s: any) => s.user_type === "employee");
    if (targetMode === "clients") list = list.filter((s: any) => s.user_type === "client");
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s: any) => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q));
    }
    return list;
  }, [subscribers, targetMode, searchQuery]);

  const resolvedUserIds = useMemo(() => {
    if (targetMode === "all") return [];
    if (targetMode === "custom") return selectedUsers;
    return filteredSubscribers.map((s: any) => s.user_id);
  }, [targetMode, selectedUsers, filteredSubscribers]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          title,
          message,
          send_to_all: targetMode === "all",
          user_ids: resolvedUserIds,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Push sent to ${data.sent} device(s)${data.failed ? `, ${data.failed} failed` : ""}`);
      setTitle("");
      setMessage("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send notifications");
    },
  });

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredSubscribers.map((s: any) => s.user_id);
    setSelectedUsers((prev) => [...new Set([...prev, ...visibleIds])]);
  };

  const deselectAllVisible = () => {
    const visibleIds = new Set(filteredSubscribers.map((s: any) => s.user_id));
    setSelectedUsers((prev) => prev.filter((id) => !visibleIds.has(id)));
  };

  const employeeCount = subscribers.filter((s: any) => s.user_type === "employee").length;
  const clientCount = subscribers.filter((s: any) => s.user_type === "client").length;

  const canSend =
    title &&
    message &&
    !sendMutation.isPending &&
    (targetMode === "all" || targetMode === "employees" || targetMode === "clients"
      ? filteredSubscribers.length > 0
      : selectedUsers.length > 0);

  const targetLabel =
    targetMode === "all"
      ? `all ${subscribers.length} subscriber(s)`
      : targetMode === "employees"
      ? `${filteredSubscribers.length} employee(s)`
      : targetMode === "clients"
      ? `${filteredSubscribers.length} client(s)`
      : `${selectedUsers.length} selected user(s)`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Push Notifications</h2>
        <p className="text-muted-foreground">Send push notifications to employees and clients</p>
      </div>

      {/* Compose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Compose Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input placeholder="Notification title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea placeholder="Notification message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Send To</label>
            <Tabs value={targetMode} onValueChange={(v) => { setTargetMode(v as TargetMode); setSelectedUsers([]); }}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="all">All ({subscribers.length})</TabsTrigger>
                <TabsTrigger value="employees">Employees ({employeeCount})</TabsTrigger>
                <TabsTrigger value="clients">Clients ({clientCount})</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Button
            onClick={() => sendMutation.mutate()}
            disabled={!canSend}
            className="w-full gap-2"
          >
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Send to {targetLabel}
          </Button>
        </CardContent>
      </Card>

      {/* Subscribers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Subscribers
            <Badge variant="secondary">{filteredSubscribers.length}</Badge>
          </CardTitle>
          <CardDescription>
            {targetMode === "all" ? "All subscribers" : targetMode === "custom" ? "Select individual users" : `Showing ${targetMode}`}
          </CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {targetMode === "custom" && filteredSubscribers.length > 0 && (
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={selectAllVisible}>Select all visible</Button>
              <Button variant="outline" size="sm" onClick={deselectAllVisible}>Deselect all visible</Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No subscribers found</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredSubscribers.map((sub: any) => (
                <div
                  key={sub.user_id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                    targetMode === "custom" && selectedUsers.includes(sub.user_id) ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => targetMode === "custom" && toggleUser(sub.user_id)}
                  role={targetMode === "custom" ? "button" : undefined}
                >
                  {targetMode === "custom" && (
                    <Checkbox
                      checked={selectedUsers.includes(sub.user_id)}
                      onCheckedChange={() => toggleUser(sub.user_id)}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{sub.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{sub.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize shrink-0">
                    {sub.user_type}
                  </Badge>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {sub.device_count} device{sub.device_count > 1 ? "s" : ""}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPushNotifications;
