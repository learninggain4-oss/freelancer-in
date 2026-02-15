import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus, Trash2, Loader2, Clock, CalendarClock, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AnnouncementForm from "@/components/admin/AnnouncementForm";
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
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);

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

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const ids = announcements.map((a: any) => a.id);
      if (ids.length === 0) return;
      const { error } = await supabase
        .from("announcements")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      const count = announcements.length;
      toast({ title: "All announcements deleted", description: `${count} announcement(s) were permanently removed.` });
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
  });

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
  };

  const handleNewAnnouncement = () => {
    setEditingAnnouncement(null);
    setShowForm(!showForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground">Send popup messages to employees, clients, or everyone</p>
        </div>
        <div className="flex gap-2">
          {announcements.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all announcements?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently remove all {announcements.length} announcement(s). This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => clearAllMutation.mutate()}>Delete All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={handleNewAnnouncement} className="gap-2">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </div>
      </div>

      {showForm && (
        <AnnouncementForm
          editingAnnouncement={editingAnnouncement}
          onClose={handleCloseForm}
        />
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
                      {a.target_user_ids && a.target_user_ids.length > 0 && (
                        <Badge variant="outline" className="text-muted-foreground">
                          {a.target_user_ids.length} user(s)
                        </Badge>
                      )}
                      {!a.is_active && (
                        <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                      )}
                      {a.is_active && a.scheduled_at && new Date(a.scheduled_at) > new Date() && (
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Scheduled</Badge>
                      )}
                      {a.is_active && a.expires_at && new Date(a.expires_at) < new Date() && (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20">Expired</Badge>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(a)}
                      title="Edit announcement"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
