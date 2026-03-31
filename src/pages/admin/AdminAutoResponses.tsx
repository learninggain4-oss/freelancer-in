import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminTimeSlotManagement from "./AdminTimeSlotManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus, Pencil, Trash2, Copy, Eye, Search, ArrowUp, ArrowDown,
  Loader2, MessageSquare, Download, Upload, ToggleLeft, ToggleRight,
  Clock, Zap, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutoResponseButton {
  key: string;
  label: string;
  next_step?: string;
  is_enabled?: boolean;
}

interface AutoResponse {
  id: string;
  step_key: string;
  message_text: string;
  buttons: AutoResponseButton[];
  display_order: number;
  is_enabled: boolean;
  typing_enabled: boolean;
  typing_duration_seconds: number;
  trigger_type: string;
  trigger_value: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

const defaultForm: Omit<AutoResponse, "id" | "created_at" | "updated_at"> = {
  step_key: "",
  message_text: "",
  buttons: [],
  display_order: 0,
  is_enabled: true,
  typing_enabled: true,
  typing_duration_seconds: 10,
  trigger_type: "button_click",
  trigger_value: null,
  language: "en",
};

const formatHour = (h: number, m: number) => {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const AdminAutoResponses = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [editDialog, setEditDialog] = useState<{ open: boolean; data: any | null }>({ open: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; data: any | null }>({ open: false, data: null });
  const [editButtons, setEditButtons] = useState<AutoResponseButton[]>([]);

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ["admin-auto-responses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upgrade_auto_responses")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        buttons: Array.isArray(r.buttons) ? r.buttons : [],
      })) as AutoResponse[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (form: any) => {
      const payload = {
        step_key: form.step_key,
        message_text: form.message_text,
        buttons: form.buttons,
        display_order: form.display_order,
        is_enabled: form.is_enabled,
        typing_enabled: form.typing_enabled,
        typing_duration_seconds: form.typing_duration_seconds,
        trigger_type: form.trigger_type,
        trigger_value: form.trigger_value || null,
        language: form.language,
      };

      if (form.id) {
        const { error } = await supabase.from("upgrade_auto_responses").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("upgrade_auto_responses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Auto response saved");
      setEditDialog({ open: false, data: null });
      queryClient.invalidateQueries({ queryKey: ["admin-auto-responses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("upgrade_auto_responses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Auto response deleted");
      setDeleteDialog({ open: false, id: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-auto-responses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("upgrade_auto_responses").update({ is_enabled: enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-auto-responses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase.from("upgrade_auto_responses").update({ display_order: newOrder }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-auto-responses"] });
    },
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filtered.length) return;
    const item = filtered[index];
    const target = filtered[targetIndex];
    reorderMutation.mutate({ id: item.id, newOrder: target.display_order });
    reorderMutation.mutate({ id: target.id, newOrder: item.display_order });
  };

  const openEdit = (data?: AutoResponse) => {
    if (data) {
      setEditButtons([...(data.buttons || [])]);
      setEditDialog({ open: true, data: { ...data } });
    } else {
      setEditButtons([]);
      setEditDialog({
        open: true,
        data: { ...defaultForm, display_order: responses.length },
      });
    }
  };

  const duplicateItem = (item: AutoResponse) => {
    const dup = {
      ...defaultForm,
      ...item,
      id: undefined,
      step_key: item.step_key + "_copy",
      display_order: responses.length,
    };
    setEditButtons([...(item.buttons || [])]);
    setEditDialog({ open: true, data: dup });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(responses, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auto-responses-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error("Invalid format");
        for (const item of data) {
          const { id, created_at, updated_at, ...rest } = item;
          await supabase.from("upgrade_auto_responses").upsert({
            ...rest,
            step_key: rest.step_key,
          }, { onConflict: "step_key" });
        }
        toast.success("Backup restored successfully");
        queryClient.invalidateQueries({ queryKey: ["admin-auto-responses"] });
      } catch (err: any) {
        toast.error("Import failed: " + err.message);
      }
    };
    input.click();
  };

  const addButton = () => {
    setEditButtons(prev => [...prev, { key: `btn_${Date.now()}`, label: "", next_step: "", is_enabled: true }]);
  };

  const updateButton = (index: number, field: string, value: any) => {
    setEditButtons(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  const removeButton = (index: number) => {
    setEditButtons(prev => prev.filter((_, i) => i !== index));
  };

  const filtered = responses.filter(r => {
    if (statusFilter === "enabled" && !r.is_enabled) return false;
    if (statusFilter === "disabled" && r.is_enabled) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.step_key.toLowerCase().includes(q) || r.message_text.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auto Response Management</h1>
          <p className="text-sm text-muted-foreground">Manage wallet upgrade chat auto responses & time slots</p>
        </div>
      </div>

      <Tabs defaultValue="responses" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="responses" className="gap-1.5">
            <MessageSquare className="h-4 w-4" /> Auto Responses
          </TabsTrigger>
          <TabsTrigger value="timeslots" className="gap-1.5">
            <Clock className="h-4 w-4" /> Time Slot Management
          </TabsTrigger>
        </TabsList>

        {/* ===== AUTO RESPONSES TAB ===== */}
        <TabsContent value="responses" className="space-y-4">
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5">
              <Download className="h-4 w-4" /> Backup
            </Button>
            <Button size="sm" variant="outline" onClick={handleImport} className="gap-1.5">
              <Upload className="h-4 w-4" /> Restore
            </Button>
            <Button size="sm" onClick={() => openEdit()} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Response
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by key or message..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="flex gap-1">
                  {(["all", "enabled", "disabled"] as const).map(s => (
                    <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize">
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No auto responses found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Step Key</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Buttons</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Typing</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Lang</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r, index) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs text-muted-foreground">{r.display_order}</TableCell>
                          <TableCell className="font-mono text-xs">{r.step_key}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs">{r.message_text || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{r.buttons.length} btn</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{r.trigger_type}</TableCell>
                          <TableCell className="text-xs">
                            {r.typing_enabled ? `${r.typing_duration_seconds}s` : "Off"}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={r.is_enabled}
                              onCheckedChange={(v) => toggleMutation.mutate({ id: r.id, enabled: v })}
                            />
                          </TableCell>
                          <TableCell className="text-xs uppercase">{r.language}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end flex-wrap">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveItem(index, "up")} disabled={index === 0}>
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveItem(index, "down")} disabled={index === filtered.length - 1}>
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPreviewDialog({ open: true, data: r })}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => duplicateItem(r)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialog({ open: true, id: r.id })}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TIME SLOT MANAGEMENT TAB ===== */}
        <TabsContent value="timeslots">
          <AdminTimeSlotManagement />
        </TabsContent>
      </Tabs>

      {/* Edit Auto Response Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(o) => { if (!o) setEditDialog({ open: false, data: null }); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog.data?.id ? "Edit" : "Add"} Auto Response</DialogTitle>
          </DialogHeader>
          {editDialog.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Step Key *</Label>
                  <Input
                    value={editDialog.data.step_key}
                    onChange={e => setEditDialog(prev => ({ ...prev, data: { ...prev.data, step_key: e.target.value } }))}
                    placeholder="e.g. language_select"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={editDialog.data.language}
                    onValueChange={v => setEditDialog(prev => ({ ...prev, data: { ...prev.data, language: v } }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="ml">Malayalam</SelectItem>
                      <SelectItem value="ur">Urdu</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message Text</Label>
                <Textarea
                  value={editDialog.data.message_text}
                  onChange={e => setEditDialog(prev => ({ ...prev, data: { ...prev.data, message_text: e.target.value } }))}
                  placeholder="Enter the message content..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select
                    value={editDialog.data.trigger_type}
                    onValueChange={v => setEditDialog(prev => ({ ...prev, data: { ...prev.data, trigger_type: v } }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_message">First Message</SelectItem>
                      <SelectItem value="button_click">Button Click</SelectItem>
                      <SelectItem value="time_based">Time Based</SelectItem>
                      <SelectItem value="keyword">Keyword</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trigger Value</Label>
                  <Input
                    value={editDialog.data.trigger_value || ""}
                    onChange={e => setEditDialog(prev => ({ ...prev, data: { ...prev.data, trigger_value: e.target.value } }))}
                    placeholder="e.g. keyword or step name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={editDialog.data.display_order}
                    onChange={e => setEditDialog(prev => ({ ...prev, data: { ...prev.data, display_order: parseInt(e.target.value) || 0 } }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={editDialog.data.typing_enabled}
                    onCheckedChange={v => setEditDialog(prev => ({ ...prev, data: { ...prev.data, typing_enabled: v } }))}
                  />
                  <Label>Typing Animation</Label>
                </div>
                <div className="space-y-2">
                  <Label>Typing Duration (s)</Label>
                  <Input
                    type="number"
                    value={editDialog.data.typing_duration_seconds}
                    onChange={e => setEditDialog(prev => ({ ...prev, data: { ...prev.data, typing_duration_seconds: parseInt(e.target.value) || 10 } }))}
                    min={1}
                    max={60}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editDialog.data.is_enabled}
                  onCheckedChange={v => setEditDialog(prev => ({ ...prev, data: { ...prev.data, is_enabled: v } }))}
                />
                <Label>Enabled</Label>
              </div>

              {/* Buttons Management */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Buttons / Options</Label>
                  <Button size="sm" variant="outline" onClick={addButton} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Button
                  </Button>
                </div>
                {editButtons.map((btn, i) => (
                  <div key={i} className="flex gap-2 items-center border rounded-lg p-2">
                    <Input
                      placeholder="Key"
                      value={btn.key}
                      onChange={e => updateButton(i, "key", e.target.value)}
                      className="w-28"
                    />
                    <Input
                      placeholder="Label"
                      value={btn.label}
                      onChange={e => updateButton(i, "label", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Next step"
                      value={btn.next_step || ""}
                      onChange={e => updateButton(i, "next_step", e.target.value)}
                      className="w-32"
                    />
                    <Switch
                      checked={btn.is_enabled !== false}
                      onCheckedChange={v => updateButton(i, "is_enabled", v)}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeButton(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, data: null })}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate({ ...editDialog.data, buttons: editButtons })}
              disabled={saveMutation.isPending || !editDialog.data?.step_key}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Auto Response Confirmation */}
      <Dialog open={deleteDialog.open} onOpenChange={(o) => { if (!o) setDeleteDialog({ open: false, id: "" }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Auto Response</DialogTitle>
            <DialogDescription>Are you sure you want to delete this message? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: "" })}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteDialog.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(o) => { if (!o) setPreviewDialog({ open: false, data: null }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Message Preview</DialogTitle>
          </DialogHeader>
          {previewDialog.data && (
            <div className="space-y-3 bg-muted/30 rounded-xl p-4">
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-muted text-foreground rounded-bl-md">
                  <p className="text-[10px] font-semibold text-primary mb-1">🤖 FlexPay Bot</p>
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{previewDialog.data.message_text}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-1">{formatFullTimestamp(new Date())}</p>
                </div>
              </div>
              {previewDialog.data.buttons?.length > 0 && (
                <div className="ml-2 space-y-1.5">
                  {previewDialog.data.buttons.map((btn: any, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        "block w-full max-w-[85%] text-left rounded-xl border px-4 py-2.5 text-sm font-medium",
                        btn.is_enabled !== false
                          ? "bg-background text-foreground border-primary/20"
                          : "bg-muted/50 text-muted-foreground border-border/30 opacity-60"
                      )}
                    >
                      {btn.label || btn.key}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

const formatFullTimestamp = (date: Date) => format(date, "EEEE, dd MMMM yyyy — hh:mm a");

export default AdminAutoResponses;
