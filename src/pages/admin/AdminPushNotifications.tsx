import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminPushNotifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ["push-subscribers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("push_subscriptions")
        .select("user_id, profile_id, created_at, endpoint");
      if (error) throw error;
      const rows = (data || []) as any[];

      // Fetch profile names
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

      // Group by user_id
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

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Push Notifications</h2>
        <p className="text-muted-foreground">Send push notifications to users with enabled notifications</p>
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
            <Input
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="send-all"
              checked={sendToAll}
              onCheckedChange={(checked) => setSendToAll(!!checked)}
            />
            <label htmlFor="send-all" className="text-sm font-medium cursor-pointer">
              Send to all subscribers
            </label>
          </div>
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

      {/* Subscribers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Subscribers
            <Badge variant="secondary">{subscribers.length}</Badge>
          </CardTitle>
          <CardDescription>Users who have enabled push notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : subscribers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No subscribers yet</p>
          ) : (
            <div className="space-y-2">
              {subscribers.map((sub: any) => (
                <div
                  key={sub.user_id}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
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
