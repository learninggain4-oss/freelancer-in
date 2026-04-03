import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus, Trash2, Loader2, Clock, CalendarClock, Pencil, Send } from "lucide-react";
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
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

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
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
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
      <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-8 text-white shadow-2xl shadow-indigo-500/20">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-100 mb-2">
              <Megaphone className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Public Relations</span>
            </div>
            <h1 className="text-3xl font-bold">Announcements</h1>
            <p className="text-indigo-100/80 text-sm mt-1">
              Send popup messages to employees, clients, or everyone globally.
            </p>
          </div>
          <div className="flex gap-3">
            {announcements.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md rounded-2xl h-12 px-6">
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent style={{ background: T.card, borderColor: T.border, color: T.text }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all announcements?</AlertDialogTitle>
                    <AlertDialogDescription style={{ color: T.sub }}>This will permanently remove all {announcements.length} announcement(s). This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl" style={{ background: T.input, borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => clearAllMutation.mutate()} className="rounded-xl bg-destructive text-white">Delete All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={handleNewAnnouncement} className="gap-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl h-12 px-6 font-bold shadow-xl shadow-white/10">
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      {showForm && (
        <div className="animate-in slide-in-from-top duration-500">
          <AnnouncementForm
            editingAnnouncement={editingAnnouncement}
            onClose={handleCloseForm}
          />
        </div>
      )}

      <div 
        className="rounded-3xl border overflow-hidden"
        style={{ background: T.card, borderColor: T.border }}
      >
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: T.text }}>
            <Send className="h-5 w-5 opacity-50" />
            Active Broadcasts
          </h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
              <p style={{ color: T.sub }}>Fetching announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Megaphone className="h-8 w-8 opacity-20" style={{ color: T.text }} />
              </div>
              <p className="text-sm font-medium" style={{ color: T.sub }}>No announcements yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {announcements.map((a: any) => (
                <div
                  key={a.id}
                  className="group relative flex items-start justify-between gap-4 rounded-3xl border p-5 transition-all hover:scale-[1.01]"
                  style={{ background: T.input, borderColor: T.border }}
                >
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg leading-tight" style={{ color: T.text }}>{a.title}</h3>
                      <Badge className={`rounded-full border-none px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${audienceColor[a.target_audience] ?? ""}`}>
                        {audienceLabel[a.target_audience] ?? a.target_audience}
                      </Badge>
                      {a.target_user_ids && a.target_user_ids.length > 0 && (
                        <Badge variant="outline" className="rounded-full h-5 text-[10px]" style={{ color: T.sub, borderColor: T.border }}>
                          {a.target_user_ids.length} targeted user(s)
                        </Badge>
                      )}
                      {!a.is_active && (
                        <Badge variant="outline" className="rounded-full h-5 text-[10px]" style={{ color: T.sub, borderColor: T.border }}>Inactive</Badge>
                      )}
                      {a.is_active && a.scheduled_at && new Date(a.scheduled_at) > new Date() && (
                        <Badge className="rounded-full h-5 text-[10px] bg-blue-500/10 text-blue-500 border-none font-bold uppercase">Scheduled</Badge>
                      )}
                      {a.is_active && a.expires_at && new Date(a.expires_at) < new Date() && (
                        <Badge className="rounded-full h-5 text-[10px] bg-destructive/10 text-destructive border-none font-bold uppercase">Expired</Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: T.sub }}>{a.message}</p>
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="h-3 w-3" />
                        Created: {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      {a.scheduled_at && (
                        <span className="flex items-center gap-1.5" style={{ color: "#6366f1" }}>
                          <Clock className="h-3 w-3" />
                          Start: {new Date(a.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {a.expires_at && (
                        <span className="flex items-center gap-1.5" style={{ color: "#f87171" }}>
                          <Clock className="h-3 w-3" />
                          Ends: {new Date(a.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl"
                      style={{ background: T.card, color: T.text, border: `1px solid ${T.border}` }}
                      onClick={() => handleEdit(a)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    {a.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 px-4 rounded-xl border font-bold text-xs"
                        style={{ background: T.card, borderColor: T.border, color: T.text }}
                        onClick={() => deactivateMutation.mutate(a.id)}
                        disabled={deactivateMutation.isPending}
                      >
                        Deactivate
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10 border"
                          style={{ borderColor: "rgba(248, 113, 113, 0.2)", background: "rgba(248, 113, 113, 0.05)" }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent style={{ background: T.card, borderColor: T.border, color: T.text }}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
                          <AlertDialogDescription style={{ color: T.sub }}>This will permanently remove this broadcast from history.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl" style={{ background: T.input, borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(a.id)} className="rounded-xl bg-destructive text-white">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-3xl"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
