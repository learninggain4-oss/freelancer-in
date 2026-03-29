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
  Loader2, Plus, Trash2, Edit2, X, Clock, Check, Eye, EyeOff,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Countdowns</h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCleared(!showCleared)}
            className="gap-1"
          >
            {showCleared ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showCleared ? "Hide Cleared" : "Show Cleared"}
          </Button>
          <Button onClick={() => setShowAdd(!showAdd)} size="sm" className="gap-1">
            {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAdd ? "Cancel" : "Add Countdown"}
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 pt-4">
            <div className="flex-1 min-w-[180px]">
              <Label>Countdown Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Method Selection Timer"
              />
            </div>
            <div className="w-32">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min="1"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
              />
            </div>
            <Button onClick={handleAdd} disabled={addMutation.isPending} className="gap-1">
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            All Countdowns ({countdowns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {countdowns.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No countdowns yet.</p>
          ) : (
            <div className="space-y-2">
              {countdowns.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/30 ${
                    c.is_cleared ? "opacity-50" : ""
                  }`}
                >
                  {editId === c.id ? (
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 flex-1 min-w-[140px]"
                        autoFocus
                      />
                      <Input
                        type="number"
                        min="1"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        className="h-8 w-24"
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                        <Check className="h-3.5 w-3.5 text-accent" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {c.duration_minutes} min
                      </Badge>
                    </>
                  )}

                  {editId !== c.id && (
                    <>
                      <Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px]">
                        {c.is_cleared ? "Cleared" : c.is_active ? "Active" : "Disabled"}
                      </Badge>

                      {!c.is_cleared && (
                        <Switch
                          checked={c.is_active}
                          onCheckedChange={(checked) => toggleActive.mutate({ id: c.id, is_active: checked })}
                        />
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditId(c.id);
                          setEditName(c.name);
                          setEditDuration(String(c.duration_minutes));
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>

                      {c.is_cleared ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => restoreMutation.mutate(c.id)}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => clearMutation.mutate(c.id)}
                        >
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{c.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this countdown.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(c.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
