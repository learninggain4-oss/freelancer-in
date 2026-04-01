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
  Clock, Zap, Filter, Save, X, Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

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

const AdminAutoResponses = () => {
  const queryClient = useQueryClient();
  const { theme } = useDashboardTheme();
  const T = TH[theme];
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
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Automation Hub</h1>
              <p className="text-white/70">Manage wallet upgrade auto-responses and operational time slots</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-10 border-white/20 bg-white/10 text-white hover:bg-white/20 gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" variant="outline" onClick={handleImport} className="h-10 border-white/20 bg-white/10 text-white hover:bg-white/20 gap-2">
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Button size="sm" onClick={() => openEdit()} className="h-10 gap-2 bg-white text-[#6366f1] hover:bg-white/90">
              <Plus className="h-4 w-4" /> Add Logic
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="responses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 rounded-xl" style={{ background: T.nav }}>
          <TabsTrigger value="responses" className="gap-2 rounded-lg py-2 data-[state=active]:bg-[#6366f1] data-[state=active]:text-white">
            <MessageSquare className="h-4 w-4" /> Logic Steps
          </TabsTrigger>
          <TabsTrigger value="timeslots" className="gap-2 rounded-lg py-2 data-[state=active]:bg-[#6366f1] data-[state=active]:text-white">
            <Clock className="h-4 w-4" /> Time Slots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="space-y-6 pt-6">
          <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
            <CardHeader className="pb-3 border-b" style={{ borderColor: T.border }}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.sub }} />
                  <Input 
                    placeholder="Search logic steps..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="pl-9 h-11"
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>
                <div className="flex gap-1 p-1 rounded-lg" style={{ background: T.input }}>
                  {(["all", "enabled", "disabled"] as const).map(s => (
                    <Button 
                      key={s} 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setStatusFilter(s)} 
                      className={cn(
                        "capitalize h-9 rounded-md transition-all px-4",
                        statusFilter === s ? "bg-[#6366f1] text-white" : ""
                      )}
                      style={statusFilter === s ? {} : { color: T.sub }}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20" style={{ color: T.sub }}>
                  <MessageSquare className="mx-auto h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No automation steps found</p>
                  <p className="text-sm">Try changing your search or adding a new step</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ background: T.nav, borderColor: T.border }}>
                        <TableHead className="w-12 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>#</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>Logic Step / Key</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>Response Message</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>Options</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>Trigger</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>Typing</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>Status</TableHead>
                        <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest px-6" style={{ color: T.sub }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r, index) => (
                        <TableRow key={r.id} className="transition-colors hover:bg-white/5" style={{ borderColor: T.border }}>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono text-[10px] h-5 px-1.5" style={{ borderColor: T.border, color: T.sub }}>{r.display_order}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-mono font-bold text-xs" style={{ color: T.text }}>{r.step_key}</span>
                              <Badge 
                                variant="outline" 
                                className="w-fit text-[9px] uppercase font-bold px-1 h-4"
                                style={{ background: "rgba(167, 139, 250, 0.1)", color: "#a78bfa", borderColor: "rgba(167, 139, 250, 0.3)" }}
                              >
                                {r.language}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="truncate text-xs leading-relaxed" style={{ color: T.sub }}>{r.message_text || "—"}</p>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className="text-[10px] h-5"
                              style={{ background: "rgba(99, 102, 241, 0.1)", color: "#a5b4fc", border: "1px solid rgba(99, 102, 241, 0.3)" }}
                            >
                              {r.buttons.length} Buttons
                            </Badge>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col gap-1">
                               <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>{r.trigger_type}</span>
                               {r.trigger_value && <span className="text-[9px] opacity-50 font-mono truncate max-w-[80px]" style={{ color: T.text }}>{r.trigger_value}</span>}
                             </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-[10px] font-bold" style={{ color: r.typing_enabled ? "#4ade80" : T.sub }}>
                              {r.typing_enabled ? `${r.typing_duration_seconds}s` : "Off"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={r.is_enabled}
                              onCheckedChange={(v) => toggleMutation.mutate({ id: r.id, enabled: v })}
                              className="scale-75"
                            />
                          </TableCell>
                          <TableCell className="text-right px-6">
                            <div className="flex gap-1 justify-end">
                              <div className="flex flex-col gap-1 mr-2">
                                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md hover:bg-white/5" onClick={() => moveItem(index, "up")} disabled={index === 0}>
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md hover:bg-white/5" onClick={() => moveItem(index, "down")} disabled={index === filtered.length - 1}>
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-white/5" onClick={() => setPreviewDialog({ open: true, data: r })}>
                                <Eye className="h-4 w-4" style={{ color: T.sub }} />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-white/5" onClick={() => openEdit(r)}>
                                <Pencil className="h-4 w-4" style={{ color: T.sub }} />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-white/5" onClick={() => duplicateItem(r)}>
                                <Copy className="h-4 w-4" style={{ color: T.sub }} />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => setDeleteDialog({ open: true, id: r.id })}>
                                <Trash2 className="h-4 w-4" />
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

        <TabsContent value="timeslots" className="pt-6">
          <AdminTimeSlotManagement />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog - Styled for Glassmorphism */}
      <Dialog open={editDialog.open} onOpenChange={(o) => { if (!o) setEditDialog({ open: false, data: null }); }}>
        <DialogContent 
          className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl"
          style={{ background: T.bg }}
        >
          <div className="p-6 border-b" style={{ borderColor: T.border, background: T.nav }}>
             <DialogTitle className="text-xl font-bold flex items-center gap-2" style={{ color: T.text }}>
                <Settings2 className="h-5 w-5 text-[#6366f1]" />
                {editDialog.data?.id ? "Edit Automation Logic" : "New Automation Step"}
             </DialogTitle>
             <DialogDescription style={{ color: T.sub }}>Configure how the chat-bot responds to user interactions.</DialogDescription>
          </div>
          
          <ScrollArea className="flex-1 p-6">
            {editDialog.data && (
              <div className="space-y-8 pb-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label style={{ color: T.text }}>Logic Step Key *</Label>
                    <Input
                      value={editDialog.data.step_key}
                      onChange={e => setEditDialog(prev => ({ ...prev, data: { ...prev.data, step_key: e.target.value } }))}
                      placeholder="e.g. language_select"
                      style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ color: T.text }}>Response Language</Label>
                    <Select
                      value={editDialog.data.language}
                      onValueChange={v => setEditDialog(prev => ({ ...prev, data: { ...prev.data, language: v } }))}
                    >
                      <SelectTrigger style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}><SelectValue /></SelectTrigger>
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
                  <Label style={{ color: T.text }}>Message Content</Label>
                  <Textarea
                    value={editDialog.data.message_text}
                    onChange={e => setEditDialog(prev => ({ ...prev, data: { ...prev.data, message_text: e.target.value } }))}
                    placeholder="Enter the chat message text..."
                    rows={4}
                    style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label style={{ color: T.text }}>Trigger Mechanism</Label>
                    <Select
                      value={editDialog.data.trigger_type}
                      onValueChange={v => setEditDialog(prev => ({ ...prev, data: { ...prev.data, trigger_type: v } }))}
                    >
                      <SelectTrigger style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first_message">Entrypoint (First Message)</SelectItem>
                        <SelectItem value="button_click">Button Interaction</SelectItem>
                        <SelectItem value="time_based">Time Delay</SelectItem>
                        <SelectItem value="keyword">Keyword Detection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label style={{ color: T.text }}>Trigger Identifier</Label>
                    <Input
                      value={editDialog.data.trigger_value || ""}
                      onChange={e => setEditDialog(prev => ({ ...prev, data: { ...prev.data, trigger_value: e.target.value } }))}
                      placeholder="e.g. step_name or keyword"
                      style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 items-end">
                  <div className="space-y-2">
                    <Label style={{ color: T.text }}>Sequence Order</Label>
                    <Input
                      type="number"
                      value={editDialog.data.display_order}
                      onChange={e => setEditDialog(prev => ({ ...prev, data: { ...prev.data, display_order: parseInt(e.target.value) || 0 } }))}
                      style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ color: T.text }}>Typing Delay (s)</Label>
                    <Input
                      type="number"
                      value={editDialog.data.typing_duration_seconds}
                      onChange={e => setEditDialog(prev => ({ ...prev, data: { ...prev.data, typing_duration_seconds: parseInt(e.target.value) || 10 } }))}
                      min={1}
                      max={60}
                      style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={editDialog.data.typing_enabled}
                        onCheckedChange={v => setEditDialog(prev => ({ ...prev, data: { ...prev.data, typing_enabled: v } }))}
                      />
                      <Label style={{ color: T.text }}>Typing Status</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={editDialog.data.is_enabled}
                        onCheckedChange={v => setEditDialog(prev => ({ ...prev, data: { ...prev.data, is_enabled: v } }))}
                      />
                      <Label style={{ color: T.text }}>Step Active</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t" style={{ borderColor: T.border }}>
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold" style={{ color: T.text }}>Reply Options (Buttons)</Label>
                    <Button size="sm" variant="outline" onClick={addButton} className="gap-2 h-9 border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1]/10">
                      <Plus className="h-4 w-4" /> Add Button
                    </Button>
                  </div>
                  
                  {editButtons.length === 0 ? (
                    <div className="text-center py-6 rounded-xl border-2 border-dashed" style={{ borderColor: T.border, color: T.sub }}>
                      No interactive buttons defined for this step.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editButtons.map((btn, i) => (
                        <div key={i} className="flex gap-3 items-center rounded-xl p-3" style={{ background: T.nav, border: `1px solid ${T.border}` }}>
                          <div className="space-y-1 flex-1">
                            <Label className="text-[10px] uppercase font-bold tracking-widest px-1" style={{ color: T.sub }}>Label</Label>
                            <Input
                              placeholder="Button Text"
                              value={btn.label}
                              onChange={e => updateButton(i, "label", e.target.value)}
                              className="h-9"
                              style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
                            />
                          </div>
                          <div className="space-y-1 w-32">
                            <Label className="text-[10px] uppercase font-bold tracking-widest px-1" style={{ color: T.sub }}>Internal Key</Label>
                            <Input
                              placeholder="key"
                              value={btn.key}
                              onChange={e => updateButton(i, "key", e.target.value)}
                              className="h-9 font-mono text-xs"
                              style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
                            />
                          </div>
                          <div className="space-y-1 w-40">
                            <Label className="text-[10px] uppercase font-bold tracking-widest px-1" style={{ color: T.sub }}>Next Step</Label>
                            <Input
                              placeholder="target_key"
                              value={btn.next_step || ""}
                              onChange={e => updateButton(i, "next_step", e.target.value)}
                              className="h-9 font-mono text-xs"
                              style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1 pt-4">
                            <Switch
                              checked={btn.is_enabled !== false}
                              onCheckedChange={v => updateButton(i, "is_enabled", v)}
                              className="scale-75"
                            />
                          </div>
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive shrink-0 mt-4 hover:bg-destructive/10" onClick={() => removeButton(i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
          
          <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: T.border, background: T.nav }}>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, data: null })} style={{ borderColor: T.border, color: T.text }}>Cancel</Button>
            <Button
              className="bg-[#6366f1] hover:bg-[#6366f1]/90 min-w-[120px]"
              onClick={() => saveMutation.mutate({ ...editDialog.data, buttons: editButtons })}
              disabled={saveMutation.isPending || !editDialog.data?.step_key}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(o) => { if (!o) setPreviewDialog({ open: false, data: null }); }}>
        <DialogContent className="max-w-md border-none p-0 overflow-hidden shadow-2xl" style={{ background: T.bg }}>
           <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: T.border, background: T.nav }}>
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-widest" style={{ color: T.text }}>Chat Preview</span>
           </div>
           <div className="p-6 space-y-6">
              <div className="space-y-1">
                 <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: T.sub }}>Assistant Message:</p>
                 <div className="rounded-2xl rounded-tl-none p-4 max-w-[85%] border" style={{ background: "rgba(99, 102, 241, 0.1)", borderColor: "rgba(99, 102, 241, 0.2)", color: T.text }}>
                    {previewDialog.data?.message_text || "..."}
                 </div>
              </div>
              {previewDialog.data?.buttons && previewDialog.data.buttons.length > 0 && (
                 <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: T.sub }}>Interactive Options:</p>
                    <div className="flex flex-wrap gap-2">
                       {previewDialog.data.buttons.map((btn: any) => (
                          <Button key={btn.key} variant="outline" className="rounded-full h-9 px-4 text-xs font-semibold pointer-events-none" style={{ background: T.input, borderColor: T.border, color: "#a5b4fc" }}>
                             {btn.label}
                          </Button>
                       ))}
                    </div>
                 </div>
              )}
           </div>
           <div className="p-4 flex justify-end border-t" style={{ borderColor: T.border }}>
              <Button onClick={() => setPreviewDialog({ open: false, data: null })} size="sm" className="bg-[#6366f1]">Close Preview</Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog.open} onOpenChange={(o) => { if (!o) setDeleteDialog({ open: false, id: "" }); }}>
        <DialogContent style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: T.text }}>Delete Automation Step?</DialogTitle>
            <DialogDescription style={{ color: T.sub }}>This will permanently remove this logic step and its associated buttons. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: "" })} style={{ borderColor: T.border, color: T.text }}>Cancel</Button>
            <Button 
              className="bg-destructive text-white hover:bg-destructive/90" 
              onClick={() => deleteMutation.mutate(deleteDialog.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAutoResponses;
