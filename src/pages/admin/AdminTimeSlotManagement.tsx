import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, Clock, AlertTriangle, Users,
  CheckCircle2, XCircle, CalendarDays, ChevronDown, ChevronUp, Save, X, CalendarRange, Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface WeeklyTimeSlot {
  id: string;
  start_hour: number;
  start_minute: number;
  end_hour: number;
  end_minute: number;
  label: string;
  display_order: number;
  is_enabled: boolean;
  day_of_week: number;
  max_bookings: number;
  created_at: string;
  updated_at: string;
}

interface DaySetting {
  id: string;
  day_of_week: number;
  is_closed: boolean;
}

interface SlotForm {
  id?: string;
  day_of_week: number;
  start_hour: number;
  start_minute: number;
  end_hour: number;
  end_minute: number;
  max_bookings: number;
  is_enabled: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { value: 1, label: "Monday",    short: "Mon", emoji: "📅" },
  { value: 2, label: "Tuesday",   short: "Tue", emoji: "📅" },
  { value: 3, label: "Wednesday", short: "Wed", emoji: "📅" },
  { value: 4, label: "Thursday",  short: "Thu", emoji: "📅" },
  { value: 5, label: "Friday",    short: "Fri", emoji: "📅" },
  { value: 6, label: "Saturday",  short: "Sat", emoji: "🌤️" },
  { value: 0, label: "Sunday",    short: "Sun", emoji: "☀️" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i >= 12 ? "PM" : "AM";
  const h = i === 0 ? 12 : i > 12 ? i - 12 : i;
  return { value: i, label: `${h}:00 ${ampm}` };
});

const MINUTES = [0, 15, 30, 45].map(m => ({
  value: m,
  label: m.toString().padStart(2, "0"),
}));

const MIGRATION_SQL = `-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)

ALTER TABLE public.upgrade_chat_time_slots
  ADD COLUMN IF NOT EXISTS day_of_week INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_bookings INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.upgrade_chat_day_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL UNIQUE,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.upgrade_chat_day_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage day settings"
  ON public.upgrade_chat_day_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read day settings"
  ON public.upgrade_chat_day_settings FOR SELECT TO authenticated USING (true);

INSERT INTO public.upgrade_chat_day_settings (day_of_week, is_closed) VALUES
  (0,false),(1,false),(2,false),(3,false),(4,false),(5,false),(6,false)
ON CONFLICT (day_of_week) DO NOTHING;`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(h: number, m: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function toMinutes(h: number, m: number) {
  return h * 60 + m;
}

function hasOverlap(
  slots: WeeklyTimeSlot[],
  form: SlotForm,
  excludeId?: string,
): boolean {
  const newStart = toMinutes(form.start_hour, form.start_minute);
  const newEnd = toMinutes(form.end_hour, form.end_minute);
  return slots
    .filter(s => s.day_of_week === form.day_of_week && s.id !== excludeId)
    .some(s => {
      const sStart = toMinutes(s.start_hour, s.start_minute);
      const sEnd = toMinutes(s.end_hour, s.end_minute);
      return !(newEnd <= sStart || newStart >= sEnd);
    });
}

function isDuplicate(
  slots: WeeklyTimeSlot[],
  form: SlotForm,
  excludeId?: string,
): boolean {
  return slots
    .filter(s => s.day_of_week === form.day_of_week && s.id !== excludeId)
    .some(
      s =>
        s.start_hour === form.start_hour &&
        s.start_minute === form.start_minute &&
        s.end_hour === form.end_hour &&
        s.end_minute === form.end_minute,
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

const AdminTimeSlotManagement = () => {
  const queryClient = useQueryClient();
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [slotDialog, setSlotDialog] = useState<{ open: boolean; form: SlotForm | null }>({
    open: false,
    form: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({
    open: false,
    id: "",
  });
  const [migrationExpanded, setMigrationExpanded] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());

  // ── Queries ──────────────────────────────────────────────────────────────

  const {
    data: slots = [],
    isLoading: loadingSlots,
    error: slotsError,
  } = useQuery<WeeklyTimeSlot[]>({
    queryKey: ["weekly-time-slots"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("upgrade_chat_time_slots")
        .select("*")
        .order("day_of_week", { ascending: true })
        .order("start_hour", { ascending: true })
        .order("start_minute", { ascending: true });
      if (error) throw error;
      return (data || []) as WeeklyTimeSlot[];
    },
  });

  const {
    data: daySettings = [],
    isLoading: loadingDays,
    error: daySettingsError,
  } = useQuery<DaySetting[]>({
    queryKey: ["weekly-day-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("upgrade_chat_day_settings")
        .select("*")
        .order("day_of_week", { ascending: true });
      if (error) throw error;
      return (data || []) as DaySetting[];
    },
  });

  const migrationNeeded =
    (slotsError as any)?.message?.includes("column") ||
    (daySettingsError as any)?.message?.includes("does not exist") ||
    (daySettingsError as any)?.message?.includes("relation");

  // ── Derived data ─────────────────────────────────────────────────────────

  const slotsByDay = useMemo(() => {
    const map: Record<number, WeeklyTimeSlot[]> = {};
    DAYS.forEach(d => (map[d.value] = []));
    slots.forEach(s => {
      const dow = s.day_of_week ?? 1;
      if (!map[dow]) map[dow] = [];
      map[dow].push(s);
    });
    return map;
  }, [slots]);

  const daySettingMap = useMemo(() => {
    const map: Record<number, DaySetting> = {};
    daySettings.forEach(d => (map[d.day_of_week] = d));
    return map;
  }, [daySettings]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const saveSlotMutation = useMutation({
    mutationFn: async (form: SlotForm) => {
      const label = `🕐 ${formatTime(form.start_hour, form.start_minute)} - ${formatTime(form.end_hour, form.end_minute)}`;
      const payload = {
        day_of_week: form.day_of_week,
        start_hour: form.start_hour,
        start_minute: form.start_minute,
        end_hour: form.end_hour,
        end_minute: form.end_minute,
        max_bookings: form.max_bookings,
        is_enabled: form.is_enabled,
        label,
        display_order:
          (slotsByDay[form.day_of_week]?.length ?? 0) + 1,
      };
      if (form.id) {
        const { error } = await (supabase as any)
          .from("upgrade_chat_time_slots")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("upgrade_chat_time_slots")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Time slot saved");
      setSlotDialog({ open: false, form: null });
      queryClient.invalidateQueries({ queryKey: ["weekly-time-slots"] });
      queryClient.invalidateQueries({ queryKey: ["admin-time-slots"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("upgrade_chat_time_slots")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Time slot deleted");
      setDeleteDialog({ open: false, id: "" });
      queryClient.invalidateQueries({ queryKey: ["weekly-time-slots"] });
      queryClient.invalidateQueries({ queryKey: ["admin-time-slots"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleSlotMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("upgrade_chat_time_slots")
        .update({ is_enabled: enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-time-slots"] });
      queryClient.invalidateQueries({ queryKey: ["admin-time-slots"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleDayClosed = useMutation({
    mutationFn: async ({ dayOfWeek, isClosed }: { dayOfWeek: number; isClosed: boolean }) => {
      const existing = daySettingMap[dayOfWeek];
      if (existing) {
        const { error } = await (supabase as any)
          .from("upgrade_chat_day_settings")
          .update({ is_closed: isClosed })
          .eq("day_of_week", dayOfWeek);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("upgrade_chat_day_settings")
          .insert({ day_of_week: dayOfWeek, is_closed: isClosed });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-day-settings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Dialog helpers ────────────────────────────────────────────────────────

  const openAdd = (dayOfWeek: number) => {
    setSlotDialog({
      open: true,
      form: {
        day_of_week: dayOfWeek,
        start_hour: 9,
        start_minute: 0,
        end_hour: 10,
        end_minute: 0,
        max_bookings: 1,
        is_enabled: true,
      },
    });
  };

  const openEdit = (slot: WeeklyTimeSlot) => {
    setSlotDialog({
      open: true,
      form: {
        id: slot.id,
        day_of_week: slot.day_of_week ?? 1,
        start_hour: slot.start_hour,
        start_minute: slot.start_minute,
        end_hour: slot.end_hour,
        end_minute: slot.end_minute,
        max_bookings: slot.max_bookings ?? 1,
        is_enabled: slot.is_enabled,
      },
    });
  };

  const handleSave = () => {
    const form = slotDialog.form;
    if (!form) return;

    const startMin = toMinutes(form.start_hour, form.start_minute);
    const endMin = toMinutes(form.end_hour, form.end_minute);

    if (endMin <= startMin) {
      toast.error("End time must be after start time");
      return;
    }
    if (isDuplicate(slots, form, form.id)) {
      toast.error("A slot with this exact time already exists for this day");
      return;
    }
    if (hasOverlap(slots, form, form.id)) {
      toast.error("This slot overlaps with an existing slot on the same day");
      return;
    }

    saveSlotMutation.mutate(form);
  };

  const toggleDayCollapse = (day: number) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const loading = loadingSlots || loadingDays;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Migration Notice */}
      {migrationNeeded && (
        <Card style={{ background: "rgba(251, 191, 36, 0.05)", border: "1px solid rgba(251, 191, 36, 0.2)" }}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-bold text-amber-400">Database migration required</p>
                <p className="text-xs" style={{ color: T.sub }}>
                  The weekly schedule feature requires new database columns and a settings table. Run the SQL below in your Supabase SQL Editor.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => setMigrationExpanded(v => !v)}
                >
                  {migrationExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  {migrationExpanded ? "Hide" : "Show"} Migration SQL
                </Button>
                {migrationExpanded && (
                  <pre className="mt-2 p-3 rounded-lg text-[10px] overflow-x-auto border border-amber-500/20 font-mono text-amber-200/70" style={{ background: "rgba(0,0,0,0.3)" }}>
                    {MIGRATION_SQL}
                  </pre>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary bar */}
      {!migrationNeeded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Open Days", value: DAYS.filter(d => !daySettingMap[d.value]?.is_closed).length, icon: CheckCircle2, color: "#4ade80" },
            { label: "Closed Days", value: DAYS.filter(d => daySettingMap[d.value]?.is_closed).length, icon: XCircle, color: "#f87171" },
            { label: "Total Slots", value: slots.length, icon: Clock, color: "#60a5fa" },
            { label: "Active Slots", value: slots.filter(s => s.is_enabled).length, icon: Users, color: "#a78bfa" },
          ].map(stat => (
            <Card key={stat.label} style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }} className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: `${stat.color}15` }}>
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none" style={{ color: T.text }}>{stat.value}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest mt-1" style={{ color: T.sub }}>{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Day Cards */}
      <div className="grid gap-4">
        {DAYS.map(day => {
          const isClosed = daySettingMap[day.value]?.is_closed ?? false;
          const daySlots = slotsByDay[day.value] ?? [];
          const isCollapsed = collapsedDays.has(day.value);
          const enabledCount = daySlots.filter(s => s.is_enabled).length;

          return (
            <Card
              key={day.value}
              style={{ 
                background: T.card, 
                border: `1px solid ${T.border}`,
                backdropFilter: "blur(12px)"
              }}
              className={cn(
                "transition-all overflow-hidden",
                isClosed && "opacity-60 border-dashed",
              )}
            >
              {/* Day Header */}
              <div className="p-4 flex items-center justify-between gap-4">
                <button
                  className="flex items-center gap-4 flex-1 text-left min-w-0"
                  onClick={() => toggleDayCollapse(day.value)}
                >
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-xl bg-white/5 border" style={{ borderColor: T.border }}>
                    {day.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base" style={{ color: T.text }}>{day.label}</span>
                      {isClosed ? (
                        <Badge variant="destructive" className="text-[10px] h-5 uppercase px-1.5">Closed</Badge>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="text-[10px] h-5 uppercase px-1.5"
                          style={{ background: "rgba(74, 222, 128, 0.1)", color: "#4ade80", borderColor: "rgba(74, 222, 128, 0.3)" }}
                        >
                          Open
                        </Badge>
                      )}
                      {!isClosed && daySlots.length > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>
                          {enabledCount}/{daySlots.length} Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto shrink-0" style={{ color: T.sub }}>
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </div>
                </button>

                <div className="flex items-center gap-3 shrink-0 border-l pl-4" style={{ borderColor: T.border }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block" style={{ color: T.sub }}>
                    {isClosed ? "Open Day" : "Close Day"}
                  </span>
                  <Switch
                    checked={!isClosed}
                    onCheckedChange={v => toggleDayClosed.mutate({ dayOfWeek: day.value, isClosed: !v })}
                    className="scale-75"
                  />
                </div>
              </div>

              {/* Slots List */}
              {!isCollapsed && (
                <>
                  <Separator style={{ background: T.border }} />
                  <CardContent className="p-4 space-y-4">
                    {isClosed ? (
                      <div className="flex items-center justify-center py-8 gap-3" style={{ color: T.sub }}>
                        <XCircle className="h-5 w-5 opacity-50" />
                        <span className="text-sm font-medium">This day is marked as closed.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {daySlots.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-2 border-2 border-dashed rounded-2xl" style={{ borderColor: T.border, color: T.sub }}>
                            <Clock className="h-8 w-8 opacity-20" />
                            <p className="text-sm font-medium">No time slots yet</p>
                            <Button size="sm" variant="ghost" className="text-[#6366f1] hover:bg-[#6366f1]/10 h-8" onClick={() => openAdd(day.value)}>
                               <Plus className="h-4 w-4 mr-2" /> Add first slot
                            </Button>
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {daySlots.map(slot => (
                              <div
                                key={slot.id}
                                className={cn(
                                  "flex items-center gap-4 rounded-xl border p-3 transition-all",
                                  !slot.is_enabled ? "opacity-50" : "hover:bg-white/5",
                                )}
                                style={{ background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", borderColor: T.border }}
                              >
                                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[#6366f1]/10 text-[#a5b4fc]">
                                   <Clock className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className="font-mono text-sm font-bold truncate" style={{ color: T.text }}>
                                      {formatTime(slot.start_hour, slot.start_minute)}
                                      <span style={{ color: T.sub }}> — </span>
                                      {formatTime(slot.end_hour, slot.end_minute)}
                                   </p>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <Users className="h-3 w-3" style={{ color: T.sub }} />
                                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>{slot.max_bookings ?? 1} Max Bookings</span>
                                   </div>
                                </div>
                                <div className="flex items-center gap-1.5 border-l pl-3" style={{ borderColor: T.border }}>
                                  <Switch
                                    checked={slot.is_enabled}
                                    onCheckedChange={v => toggleSlotMutation.mutate({ id: slot.id, enabled: v })}
                                    className="scale-75"
                                  />
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 hover:bg-white/5" 
                                    onClick={() => openEdit(slot)}
                                    style={{ color: T.sub }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(24px)" }}>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle style={{ color: T.text }}>Delete Time Slot?</AlertDialogTitle>
                                        <AlertDialogDescription style={{ color: T.sub }}>This will permanently remove this available time window.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel style={{ borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteSlotMutation.mutate(slot.id)} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                            <Button 
                              variant="ghost" 
                              className="w-full h-10 border border-dashed rounded-xl mt-2 font-bold uppercase tracking-widest text-[10px]"
                              style={{ borderColor: T.border, color: T.sub }}
                              onClick={() => openAdd(day.value)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-2" /> Add Another Window
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={slotDialog.open} onOpenChange={o => !o && setSlotDialog({ open: false, form: null })}>
        <DialogContent style={{ background: T.bg }} className="border-none shadow-2xl p-0 overflow-hidden max-w-lg">
          <div className="p-6 border-b" style={{ borderColor: T.border, background: T.nav }}>
            <DialogTitle className="text-xl font-bold flex items-center gap-2" style={{ color: T.text }}>
               <Timer className="h-5 w-5 text-[#6366f1]" />
               {slotDialog.form?.id ? "Edit Time Slot" : `Add Slot for ${DAYS.find(d => d.value === slotDialog.form?.day_of_week)?.label}`}
            </DialogTitle>
            <DialogDescription style={{ color: T.sub }}>Configure the availability window and booking limits.</DialogDescription>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Start Hour</Label>
                <Select
                  value={String(slotDialog.form?.start_hour)}
                  onValueChange={v => setSlotDialog(p => ({ ...p, form: { ...p.form!, start_hour: parseInt(v) } }))}
                >
                  <SelectTrigger style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}><SelectValue /></SelectTrigger>
                  <SelectContent>{HOURS.map(h => <SelectItem key={h.value} value={String(h.value)}>{h.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Start Minute</Label>
                <Select
                  value={String(slotDialog.form?.start_minute)}
                  onValueChange={v => setSlotDialog(p => ({ ...p, form: { ...p.form!, start_minute: parseInt(v) } }))}
                >
                  <SelectTrigger style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}><SelectValue /></SelectTrigger>
                  <SelectContent>{MINUTES.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>End Hour</Label>
                <Select
                  value={String(slotDialog.form?.end_hour)}
                  onValueChange={v => setSlotDialog(p => ({ ...p, form: { ...p.form!, end_hour: parseInt(v) } }))}
                >
                  <SelectTrigger style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}><SelectValue /></SelectTrigger>
                  <SelectContent>{HOURS.map(h => <SelectItem key={h.value} value={String(h.value)}>{h.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>End Minute</Label>
                <Select
                  value={String(slotDialog.form?.end_minute)}
                  onValueChange={v => setSlotDialog(p => ({ ...p, form: { ...p.form!, end_minute: parseInt(v) } }))}
                >
                  <SelectTrigger style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}><SelectValue /></SelectTrigger>
                  <SelectContent>{MINUTES.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 items-end">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Max Bookings</Label>
                <Input
                  type="number"
                  min="1"
                  value={slotDialog.form?.max_bookings}
                  onChange={e => setSlotDialog(p => ({ ...p, form: { ...p.form!, max_bookings: parseInt(e.target.value) || 1 } }))}
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <div className="flex items-center gap-3 h-10">
                <Switch
                  checked={slotDialog.form?.is_enabled}
                  onCheckedChange={v => setSlotDialog(p => ({ ...p, form: { ...p.form!, is_enabled: v } }))}
                />
                <Label style={{ color: T.text }}>Enabled</Label>
              </div>
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: T.border, background: T.nav }}>
            <Button variant="outline" onClick={() => setSlotDialog({ open: false, form: null })} style={{ borderColor: T.border, color: T.text }}>Cancel</Button>
            <Button 
              className="bg-[#6366f1] hover:bg-[#6366f1]/90 min-w-[120px]" 
              onClick={handleSave}
              disabled={saveSlotMutation.isPending}
            >
              {saveSlotMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Slot
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTimeSlotManagement;
