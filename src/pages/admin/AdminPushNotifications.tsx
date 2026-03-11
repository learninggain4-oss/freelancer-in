import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell, Send, Users, Loader2, Search, UserCheck, Briefcase } from "lucide-react";
import { toast } from "sonner";

const AdminPushNotifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("employees");

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
      return Object.values(grouped);
    },
  });

  const employees = useMemo(
    () => subscribers.filter((s: any) => s.user_type === "employee"),
    [subscribers]
  );
  const clients = useMemo(
    () => subscribers.filter((s: any) => s.user_type === "client"),
    [subscribers]
  );

  const currentList = activeTab === "employees" ? employees : clients;
  const filteredList = useMemo(() => {
    if (!searchQuery) return currentList;
    const q = searchQuery.toLowerCase();
    return currentList.filter(
      (s: any) => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error, data } = await supabase.functions.invoke("send-push-notification", {
        body: {
          title,
          message,
          send_to_all: sendToAll,
          user_ids: sendToAll ? [] : selectedUsers,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Push sent to ${data.sent} device(s)${data.failed ? `, ${data.failed} failed` : ""}`);
      setTitle("");
      setMessage("");
      setSelectedUsers([]);
      setSendToAll(false);
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

  const selectAllInTab = () => {
    const ids = filteredList.map((s: any) => s.user_id);
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      const allSelected = ids.every((id: string) => newSet.has(id));
      if (allSelected) {
        ids.forEach((id: string) => newSet.delete(id));
      } else {
        ids.forEach((id: string) => newSet.add(id));
      }
      return Array.from(newSet);
    });
  };

  const allInTabSelected =
    filteredList.length > 0 && filteredList.every((s: any) => selectedUsers.includes(s.user_id));

  const renderUserList = (list: any[]) => (
    <div className="space-y-2">
      {list.length === 0 ? (
        <p className="text-center py-6 text-muted-foreground text-sm">No subscribers found</p>
      ) : (
        list.map((sub: any) => (
          <div
            key={sub.user_id}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
              selectedUsers.includes(sub.user_id)
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => { if (!sendToAll) toggleUser(sub.user_id); }}
          >
            {!sendToAll && (
              <Checkbox
                checked={selectedUsers.includes(sub.user_id)}
                onCheckedChange={() => toggleUser(sub.user_id)}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{sub.name}</p>
              <p className="text-xs text-muted-foreground truncate">{sub.email}</p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {sub.device_count} device{sub.device_count > 1 ? "s" : ""}
            </Badge>
          </div>
        ))
      )}
    </div>
  );

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
          <div className="flex items-center gap-2">
            <Checkbox id="send-all" checked={sendToAll} onCheckedChange={(checked) => { setSendToAll(!!checked); if (checked) setSelectedUsers([]); }} />
            <label htmlFor="send-all" className="text-sm font-medium cursor-pointer">
              Send to all subscribers
            </label>
          </div>
          {!sendToAll && selectedUsers.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""} selected
            </p>
          )}
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={!title || !message || sendMutation.isPending || (!sendToAll && selectedUsers.length === 0)}
            className="w-full gap-2"
          >
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Send Push Notification
          </Button>
        </CardContent>
      </Card>

      {/* Subscribers with tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Subscribers
            <Badge variant="secondary">{subscribers.length}</Badge>
          </CardTitle>
          <CardDescription>Select individual employees or clients to target</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchQuery(""); }}>
            <TabsList className="w-full">
              <TabsTrigger value="employees" className="flex-1 gap-2">
                <UserCheck className="h-4 w-4" />
                Employees
                <Badge variant="outline" className="ml-1 text-xs">{employees.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex-1 gap-2">
                <Briefcase className="h-4 w-4" />
                Clients
                <Badge variant="outline" className="ml-1 text-xs">{clients.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {!sendToAll && filteredList.length > 0 && (
                <Button variant="outline" size="sm" onClick={selectAllInTab}>
                  {allInTabSelected ? "Deselect All" : "Select All"}
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <TabsContent value="employees">{renderUserList(filteredList)}</TabsContent>
                <TabsContent value="clients">{renderUserList(filteredList)}</TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPushNotifications;
