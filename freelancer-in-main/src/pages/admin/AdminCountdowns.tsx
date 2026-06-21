import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, Pencil, X, Clock, Check, Eye, EyeOff, Timer, Save
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { cn } from "@/lib/utils";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

type Countdown = {
  id: string;
  name: string;
  duration_minutes: number;
  is_active: boolean;
  is_cleared: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

const AdminCountdowns = () => {
  const qc = useQueryClient();
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState("10");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [showCleared, setShowCleared] = useState(false);

  const { data: countdowns = [], isLoading } = useQuery({
    queryKey: ["admin-countdowns", showCleared],
    queryFn: async () => {
      let q = supabase.from("countdowns").select("*").order("display_order", { ascending: true });
      if (!showCleared) q = q.eq("is_cleared", false);
      const { data, error } = await q;
      if (error) throw error;
      return data as Countdown[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({ name, duration }: { name: string; duration: number }) => {
      const maxOrder = countdowns.reduce((m, r) => Math.max(m, r.display_order), 0);
      const { error } = await supabase.from("countdowns").insert({
        name,
        duration_minutes: duration,
        display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-countdowns"] });
      setNewName("");
      setNewDuration("10");
      setShowAdd(false);
      toast.success("Countdown added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("countdowns").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-countdowns"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, duration }: { id: string; name: string; duration: number }) => {
      const { error } = await supabase.from("countdowns").update({ name, duration_minutes: duration }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-countdowns"] });
      setEditId(null);
      toast.success("Countdown updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const clearMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("countdowns").update({ is_cleared: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-countdowns"] });
      toast.success("Countdown cleared");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("countdowns").update({ is_cleared: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-countdowns"] });
      toast.success("Countdown restored");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("countdowns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-countdowns"] });
      toast.success("Countdown deleted permanently");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleAdd = () => {
    const d = Number(newDuration);
    if (!newName.trim() || isNaN(d) || d < 1) {
      toast.error("Enter a valid name and duration (min 1 minute)");
      return;
    }
    addMutation.mutate({ name: newName.trim(), duration: d });
  };

  const handleSaveEdit = () => {
    if (!editId) return;
    const d = Number(editDuration);
    if (!editName.trim() || isNaN(d) || d < 1) {
      toast.error("Enter a valid name and duration");
      return;
    }
    updateMutation.mutate({ id: editId, name: editName.trim(), duration: d });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#6366f1" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Premium Hero Section */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 mb-8"
        style={{ 
          background: theme === "black" 
            ? "linear-gradient(135deg, #1e1b4b 0%, #070714 100%)" 
            : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          border: `1px solid ${T.border}`
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white/10 p-3 backdrop-blur-md">
              <Timer className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">System Countdowns</h1>
              <p className="text-white/70">Configure operational timers and process deadlines</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCleared(!showCleared)}
              className="h-10 border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              {showCleared ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showCleared ? "Hide Cleared" : "Show Cleared"}
            </Button>
            {!showAdd && (
              <Button 
                onClick={() => setShowAdd(true)} 
                className="h-10 gap-2 bg-white text-[#6366f1] hover:bg-white/90"
              >
                <Plus className="h-4 w-4" /> Add Countdown
              </Button>
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <CardHeader className="border-b" style={{ borderColor: T.border }}>
            <CardTitle className="text-lg" style={{ color: T.text }}>New Countdown Timer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-end">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Timer Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Method Selection Timer"
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Duration (Minutes)</Label>
                <Input
                  type="number"
                  min="1"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={addMutation.isPending} className="flex-1 gap-2 bg-[#6366f1] hover:bg-[#6366f1]/90">
                  {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create Timer
                </Button>
                <Button variant="outline" onClick={() => setShowAdd(false)} style={{ borderColor: T.border, color: T.text }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
        <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: T.text }}>
            <Clock className="h-5 w-5 text-[#6366f1]" />
            Timer Configuration ({countdowns.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {countdowns.length === 0 ? (
            <p className="py-12 text-center text-sm" style={{ color: T.sub }}>No countdowns configured yet.</p>
          ) : (
            <div className="grid gap-4">
              {countdowns.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border p-4 transition-all hover:bg-white/5",
                    c.is_cleared && "opacity-60 grayscale"
                  )}
                  style={{ 
                    borderColor: editId === c.id ? "#6366f1" : T.border,
                    background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"
                  }}
                >
                  {editId === c.id ? (
                    <div className="flex flex-1 flex-col sm:flex-row gap-4 items-end sm:items-center">
                      <div className="flex-1 w-full space-y-1">
                        <Label className="text-[10px] uppercase font-bold tracking-widest px-1" style={{ color: T.sub }}>Timer Name</Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                          className="h-10"
                          autoFocus
                        />
                      </div>
                      <div className="w-full sm:w-32 space-y-1">
                        <Label className="text-[10px] uppercase font-bold tracking-widest px-1" style={{ color: T.sub }}>Min</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                          style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                          className="h-10"
                        />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button size="sm" className="flex-1 sm:flex-none bg-[#6366f1] hover:bg-[#6366f1]/90" onClick={handleSaveEdit}>
                          <Save className="h-4 w-4 mr-2" /> Save
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none" style={{ borderColor: T.border, color: T.text }} onClick={() => setEditId(null)}>
                          <X className="h-4 w-4 mr-2" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#a5b4fc" }}>
                          <Timer className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate" style={{ color: T.text }}>{c.name}</p>
                          <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>
                            Created: {new Date(c.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 justify-end">
                        <Badge 
                          variant="outline" 
                          className="font-mono text-xs px-2 h-7"
                          style={{ borderColor: T.border, color: "#a5b4fc", background: "rgba(99, 102, 241, 0.05)" }}
                        >
                          {c.duration_minutes}m
                        </Badge>
                        
                        <Badge 
                          variant={c.is_active ? "default" : "secondary"} 
                          className="text-[10px] px-2 h-7 uppercase tracking-wider"
                          style={c.is_active ? { background: "rgba(74, 222, 128, 0.15)", color: "#4ade80", border: "1px solid rgba(74, 222, 128, 0.3)" } : {}}
                        >
                          {c.is_cleared ? "Cleared" : c.is_active ? "Active" : "Disabled"}
                        </Badge>

                        <div className="flex items-center gap-1.5 border-l pl-3 ml-1" style={{ borderColor: T.border }}>
                          {!c.is_cleared && (
                            <Switch
                              checked={c.is_active}
                              onCheckedChange={(checked) => toggleActive.mutate({ id: c.id, is_active: checked })}
                              className="scale-75"
                            />
                          )}

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-white/5"
                            style={{ color: T.sub }}
                            onClick={() => {
                              setEditId(c.id);
                              setEditName(c.name);
                              setEditDuration(String(c.duration_minutes));
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {c.is_cleared ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-3 text-xs font-bold uppercase tracking-wider hover:bg-white/5"
                              style={{ color: "#a5b4fc" }}
                              onClick={() => restoreMutation.mutate(c.id)}
                            >
                              Restore
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-white/5"
                              style={{ color: T.sub }}
                              onClick={() => clearMutation.mutate(c.id)}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(24px)" }}>
                              <AlertDialogHeader>
                                <AlertDialogTitle style={{ color: T.text }}>Delete "{c.name}"?</AlertDialogTitle>
                                <AlertDialogDescription style={{ color: T.sub }}>
                                  This will permanently remove this countdown configuration.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel style={{ borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(c.id)}
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                  Delete Permanently
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCountdowns;
