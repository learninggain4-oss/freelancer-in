import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Megaphone, Plus, Trash2, Loader2, Clock, CalendarClock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const audienceLabel: Record<string, string> = {
  everyone: "Everyone",
  employees: "Employees Only",
  clients: "Clients Only",
};

const audienceColor: Record<string, string> = {
  everyone: "bg-primary/10 text-primary",
  employees: "bg-accent/10 text-accent",
  clients: "bg-warning/10 text-warning",
};

const AdminAnnouncements = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("everyone");
  const [showForm, setShowForm] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("announcements").insert({
        title: title.trim(),
        message: message.trim(),
        target_audience: target,
        created_by: profile?.id,
        scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Announcement created", description: "Users will see this popup on their next visit." });
      setTitle("");
      setMessage("");
      setTarget("everyone");
      setScheduledAt(undefined);
      setExpiresAt(undefined);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Announcement deactivated" });
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Announcement deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground">Send popup messages to employees, clients, or everyone</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="employees">Employees Only</SelectItem>
                  <SelectItem value="clients">Clients Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule For (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarClock className="mr-2 h-4 w-4" />
                      {scheduledAt ? format(scheduledAt, "PPP p") : "Immediately"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={scheduledAt} onSelect={(day) => {
                      if (!day) { setScheduledAt(undefined); return; }
                      const prev = scheduledAt;
                      if (prev) { day.setHours(prev.getHours(), prev.getMinutes()); }
                      setScheduledAt(day);
                    }} disabled={(date) => date < new Date(new Date().toDateString())} className="p-3 pointer-events-auto" />
                    {scheduledAt && (
                      <div className="flex items-center gap-2 px-3 pb-3">
                        <Input type="time" className="flex-1" value={format(scheduledAt, "HH:mm")} onChange={(e) => {
                          const [h, m] = e.target.value.split(":").map(Number);
                          const d = new Date(scheduledAt);
                          d.setHours(h, m);
                          setScheduledAt(d);
                        }} />
                        <Button variant="ghost" size="sm" onClick={() => setScheduledAt(undefined)}>Clear</Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Expires On (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Clock className="mr-2 h-4 w-4" />
                      {expiresAt ? format(expiresAt, "PPP p") : "Never"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={expiresAt} onSelect={(day) => {
                      if (!day) { setExpiresAt(undefined); return; }
                      const prev = expiresAt;
                      if (prev) { day.setHours(prev.getHours(), prev.getMinutes()); }
                      else { day.setHours(23, 59); }
                      setExpiresAt(day);
                    }} disabled={(date) => date < new Date(new Date().toDateString())} className="p-3 pointer-events-auto" />
                    {expiresAt && (
                      <div className="flex items-center gap-2 px-3 pb-3">
                        <Input type="time" className="flex-1" value={format(expiresAt, "HH:mm")} onChange={(e) => {
                          const [h, m] = e.target.value.split(":").map(Number);
                          const d = new Date(expiresAt);
                          d.setHours(h, m);
                          setExpiresAt(d);
                        }} />
                        <Button variant="ghost" size="sm" onClick={() => setExpiresAt(undefined)}>Clear</Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!title.trim() || !message.trim() || createMutation.isPending}
                className="gap-2"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Megaphone className="h-4 w-4" />
                {scheduledAt ? "Schedule Announcement" : "Publish Announcement"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a: any) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{a.title}</p>
                      <Badge className={audienceColor[a.target_audience] ?? ""}>
                        {audienceLabel[a.target_audience] ?? a.target_audience}
                      </Badge>
                      {!a.is_active && (
                        <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.message}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground/70">
                      <span>
                        Created: {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {a.scheduled_at && (
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          Scheduled: {new Date(a.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                      {a.expires_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires: {new Date(a.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {a.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateMutation.mutate(a.id)}
                        disabled={deactivateMutation.isPending}
                      >
                        Deactivate
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently remove this announcement.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(a.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnnouncements;
