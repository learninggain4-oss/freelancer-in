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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Bell, Pencil, EyeOff, ChevronUp, Save, Send, Users, User, ShieldCheck, Filter, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

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
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCleared, setShowCleared] = useState(false);
  const [expandedEdit, setExpandedEdit] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Send push notification form state
  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushTarget, setPushTarget] = useState<"all" | "freelancers" | "employers" | "individual">("all");
  const [pushUserId, setPushUserId] = useState("");
  const [pushType, setPushType] = useState("info");

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

  // Fetch users for individual targeting
  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin-all-profiles-for-push"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, user_code, user_type")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const sendPushMutation = useMutation({
    mutationFn: async () => {
      if (!pushTitle.trim()) throw new Error("Title is required");

      if (pushTarget === "individual") {
        if (!pushUserId) throw new Error("Select a user");
        // Insert notification into DB (triggers OneSignal push via DB trigger)
        const { error } = await supabase.from("notifications").insert({
          user_id: pushUserId,
          title: pushTitle,
          message: pushMessage,
          type: pushType,
        });
        if (error) throw error;
      } else if (pushTarget === "all") {
        // Send to all users
        const targetUsers = allUsers;
        for (const u of targetUsers) {
          await supabase.from("notifications").insert({
            user_id: u.user_id,
            title: pushTitle,
            message: pushMessage,
            type: pushType,
          });
        }
        // Also send OneSignal push to all
        await supabase.functions.invoke("send-onesignal", {
          body: { action: "push_to_all", title: pushTitle, message: pushMessage, type: pushType },
        });
      } else {
        // freelancers or employers
        const targetUsers = allUsers.filter(u => u.user_type === (pushTarget === "freelancers" ? "employee" : "client"));
        for (const u of targetUsers) {
          await supabase.from("notifications").insert({
            user_id: u.user_id,
            title: pushTitle,
            message: pushMessage,
            type: pushType,
          });
        }
        // Send OneSignal to specific users
        const userIds = targetUsers.map(u => u.user_id);
        if (userIds.length > 0) {
          await supabase.functions.invoke("send-onesignal", {
            body: { action: "push_to_users", user_ids: userIds, title: pushTitle, message: pushMessage, type: pushType },
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Notification sent successfully!");
      setPushTitle("");
      setPushMessage("");
      setPushUserId("");
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
    onError: (e: any) => toast.error(e.message),
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
    <div className="space-y-6 pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-8 text-white shadow-2xl shadow-indigo-500/20">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-100 mb-2">
              <Bell className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Communication Center</span>
            </div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-indigo-100/80 text-sm mt-1">
              Broadcast messages and manage system notifications.
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20">
            <Switch 
              checked={showCleared} 
              onCheckedChange={setShowCleared} 
              id="show-cleared-notif" 
              className="data-[state=checked]:bg-white/40"
            />
            <Label htmlFor="show-cleared-notif" className="text-xs font-medium cursor-pointer">Show cleared</Label>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      {/* Send Push Notification Card */}
      <div 
        className="rounded-3xl border p-6 transition-all"
        style={{ background: T.card, borderColor: "rgba(99, 102, 241, 0.3)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Send className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold" style={{ color: T.text }}>Send Push Notification</h2>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: T.sub }}>Target Audience</Label>
              <Select value={pushTarget} onValueChange={(v: any) => setPushTarget(v)}>
                <SelectTrigger className="rounded-xl border-none h-11" style={{ background: T.input, color: T.text }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: T.card, borderColor: T.border, color: T.text }}>
                  <SelectItem value="all"><div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> All Users</div></SelectItem>
                  <SelectItem value="freelancers"><div className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Freelancers Only</div></SelectItem>
                  <SelectItem value="employers"><div className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Employers Only</div></SelectItem>
                  <SelectItem value="individual"><div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Individual User</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pushTarget === "individual" && (
              <div className="space-y-2 animate-in slide-in-from-right duration-300">
                <Label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: T.sub }}>Select User</Label>
                <Select value={pushUserId} onValueChange={setPushUserId}>
                  <SelectTrigger className="rounded-xl border-none h-11" style={{ background: T.input, color: T.text }}>
                    <SelectValue placeholder="Select user..." />
                  </SelectTrigger>
                  <SelectContent style={{ background: T.card, borderColor: T.border, color: T.text }}>
                    <ScrollArea className="h-60">
                      {allUsers.map((u) => (
                        <SelectItem key={u.user_id} value={u.user_id}>
                          {u.full_name?.[0] || "Unknown"} ({u.user_code?.[0] || ""})
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: T.sub }}>Title</Label>
              <Input 
                value={pushTitle} 
                onChange={(e) => setPushTitle(e.target.value)} 
                placeholder="Brief title..." 
                className="rounded-xl border-none h-11"
                style={{ background: T.input, color: T.text }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: T.sub }}>Priority / Type</Label>
              <Select value={pushType} onValueChange={setPushType}>
                <SelectTrigger className="rounded-xl border-none h-11" style={{ background: T.input, color: T.text }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: T.card, borderColor: T.border, color: T.text }}>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="success">Success / Confirmation</SelectItem>
                  <SelectItem value="warning">Warning / Action Required</SelectItem>
                  <SelectItem value="error">Critical / Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: T.sub }}>Message Content</Label>
            <Textarea 
              value={pushMessage} 
              onChange={(e) => setPushMessage(e.target.value)} 
              placeholder="What do you want to tell them?" 
              rows={3} 
              className="rounded-2xl border-none resize-none p-4"
              style={{ background: T.input, color: T.text }}
            />
          </div>

          <Button 
            className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 font-bold tracking-wide" 
            onClick={() => sendPushMutation.mutate()} 
            disabled={sendPushMutation.isPending || !pushTitle.trim()}
          >
            {sendPushMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
            {sendPushMutation.isPending ? "Sending Broadcast..." : "Send Notification"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors group-focus-within:text-indigo-500" style={{ color: T.sub }} />
          <Input 
            placeholder="Search notifications..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-12 h-12 rounded-2xl border-none" 
            style={{ background: T.card, color: T.text, border: `1px solid ${T.border}` }}
          />
        </div>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}>
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl animate-pulse" style={{ background: T.card }} />
          ))
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className="group relative overflow-hidden rounded-3xl border transition-all hover:scale-[1.01]"
              style={{ 
                background: T.card, 
                borderColor: T.border,
                opacity: n.is_cleared ? 0.6 : 1,
                backdropFilter: "blur(12px)"
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-2xl shrink-0" style={{ background: T.input }}>
                      <Bell className="h-5 w-5" style={{ color: n.type === 'error' ? '#f87171' : n.type === 'success' ? '#22c55e' : n.type === 'warning' ? '#fbbf24' : '#6366f1' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-lg" style={{ color: T.text }}>{n.title}</h3>
                        {typeBadge(n.type)}
                        {!n.is_read && <Badge variant="secondary" className="text-[10px] h-5 bg-indigo-500/10 text-indigo-500 border-none">New</Badge>}
                      </div>
                      <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: T.sub }}>{n.message}</p>
                    </div>
                  </div>
                  {n.is_cleared && (
                    <Badge variant="outline" className="border-none text-[10px]" style={{ background: "rgba(248, 113, 113, 0.1)", color: "#f87171" }}>
                      Cleared
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: T.border }}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-500 border border-indigo-500/20">
                        {(n.profile as any)?.full_name?.[0]?.charAt(0) || "?"}
                      </div>
                      <span className="text-xs font-medium" style={{ color: T.sub }}>
                        {(n.profile as any)?.full_name?.[0] || "Unknown"}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5" style={{ color: T.sub }}>
                        {(n.profile as any)?.user_code?.[0] || ""}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: T.sub }}>
                      {new Date(n.created_at).toLocaleString("en-IN", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => startEdit(n)} 
                      className="rounded-xl h-9 px-3"
                      style={{ background: expandedEdit === n.id ? T.badge : T.input, color: expandedEdit === n.id ? T.badgeFg : T.text }}
                    >
                      {expandedEdit === n.id ? <ChevronUp className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </Button>
                    
                    {n.is_cleared ? (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => restoreMutation.mutate(n.id)}
                        className="rounded-xl h-9 px-3"
                        style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e" }}
                      >
                        Restore
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="rounded-xl h-9 px-3 text-destructive hover:bg-destructive/10"
                            style={{ background: "rgba(248, 113, 113, 0.05)" }}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent style={{ background: T.card, borderColor: T.border, color: T.text }}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear this notification?</AlertDialogTitle>
                            <AlertDialogDescription style={{ color: T.sub }}>This will soft-delete the notification. It can be restored later.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl" style={{ background: T.input, borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => clearMutation.mutate(n.id)} className="rounded-xl bg-destructive text-white">Clear</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                {expandedEdit === n.id && (
                  <div className="mt-6 p-6 rounded-3xl border animate-in slide-in-from-top duration-300" style={{ background: T.nav, borderColor: T.border }}>
                    <div className="grid gap-4 sm:grid-cols-2 mb-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.sub }}>Notification Title</Label>
                        <Input 
                          value={editForm.title} 
                          onChange={(e) => setEditForm((f: any) => ({ ...f, title: e.target.value }))} 
                          className="rounded-xl border-none h-11"
                          style={{ background: T.input, color: T.text }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.sub }}>Internal Type</Label>
                        <Input 
                          value={editForm.type} 
                          onChange={(e) => setEditForm((f: any) => ({ ...f, type: e.target.value }))} 
                          placeholder="info / success / warning / error" 
                          className="rounded-xl border-none h-11"
                          style={{ background: T.input, color: T.text }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.sub }}>Message Text</Label>
                      <Textarea 
                        value={editForm.message} 
                        onChange={(e) => setEditForm((f: any) => ({ ...f, message: e.target.value }))} 
                        rows={2} 
                        className="rounded-2xl border-none resize-none p-4"
                        style={{ background: T.input, color: T.text }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl" style={{ background: T.input }}>
                      <Switch checked={editForm.is_read} onCheckedChange={(v) => setEditForm((f: any) => ({ ...f, is_read: v }))} />
                      <Label className="text-xs font-semibold cursor-pointer" style={{ color: T.text }}>Marked as read by user</Label>
                    </div>
                    <Button 
                      className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20" 
                      onClick={() => editMutation.mutate({ id: n.id, data: editForm })} 
                      disabled={editMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" /> {editMutation.isPending ? "Applying Changes..." : "Apply Manual Edits"}
                    </Button>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed" style={{ background: T.card, borderColor: T.border }}>
            <Bell className="h-12 w-12 mb-4 opacity-20" style={{ color: T.text }} />
            <p className="text-sm font-medium" style={{ color: T.sub }}>No notifications match your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
