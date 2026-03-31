import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, Clock, AlertTriangle, Users,
  CheckCircle2, XCircle, CalendarDays, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Weekly Appointment Schedule
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Set available time slots for each day of the week. Users can only book enabled slots on open days.
          </p>
        </div>
      </div>

      {/* Migration Notice */}
      {migrationNeeded && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Database migration required
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  The weekly schedule feature requires new database columns and a settings table. Run the SQL below in your Supabase SQL Editor.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-amber-300"
                  onClick={() => setMigrationExpanded(v => !v)}
                >
                  {migrationExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  {migrationExpanded ? "Hide" : "Show"} Migration SQL
                </Button>
                {migrationExpanded && (
                  <pre className="mt-2 p-3 bg-amber-100 dark:bg-amber-900/40 rounded-md text-xs overflow-x-auto text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Open Days",
              value: DAYS.filter(d => !daySettingMap[d.value]?.is_closed).length,
              icon: CheckCircle2,
              color: "text-green-600",
            },
            {
              label: "Closed Days",
              value: DAYS.filter(d => daySettingMap[d.value]?.is_closed).length,
              icon: XCircle,
              color: "text-red-500",
            },
            {
              label: "Total Slots",
              value: slots.length,
              icon: Clock,
              color: "text-blue-600",
            },
            {
              label: "Active Slots",
              value: slots.filter(s => s.is_enabled).length,
              icon: Users,
              color: "text-purple-600",
            },
          ].map(stat => (
            <Card key={stat.label} className="p-3">
              <div className="flex items-center gap-2">
                <stat.icon className={cn("h-4 w-4 shrink-0", stat.color)} />
                <div>
                  <p className="text-lg font-bold leading-none">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Day Cards */}
      <div className="space-y-3">
        {DAYS.map(day => {
          const isClosed = daySettingMap[day.value]?.is_closed ?? false;
          const daySlots = slotsByDay[day.value] ?? [];
          const isCollapsed = collapsedDays.has(day.value);
          const enabledCount = daySlots.filter(s => s.is_enabled).length;

          return (
            <Card
              key={day.value}
              className={cn(
                "transition-all",
                isClosed && "opacity-75 border-dashed",
              )}
            >
              {/* Day Header */}
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                    onClick={() => toggleDayCollapse(day.value)}
                  >
                    <span className="text-lg">{day.emoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{day.label}</span>
                        {isClosed ? (
                          <Badge variant="destructive" className="text-xs h-5">Closed</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs h-5 border-green-300 text-green-700 dark:text-green-400">
                            Open
                          </Badge>
                        )}
                        {!isClosed && daySlots.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {enabledCount}/{daySlots.length} slot{daySlots.length !== 1 ? "s" : ""} active
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-auto shrink-0 text-muted-foreground">
                      {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </div>
                  </button>

                  {/* Closed toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {isClosed ? "Mark Open" : "Mark Closed"}
                    </span>
                    <Switch
                      checked={!isClosed}
                      onCheckedChange={v =>
                        toggleDayClosed.mutate({ dayOfWeek: day.value, isClosed: !v })
                      }
                      data-testid={`toggle-day-${day.value}`}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>
              </CardHeader>

              {/* Slots List */}
              {!isCollapsed && (
                <>
                  <Separator />
                  <CardContent className="pt-3 pb-4 px-4">
                    {isClosed ? (
                      <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">This day is marked as closed. Toggle to open and add slots.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {daySlots.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                            <Clock className="h-6 w-6" />
                            <p className="text-sm">No time slots yet</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {daySlots.map(slot => (
                              <div
                                key={slot.id}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                                  !slot.is_enabled && "opacity-50 bg-muted/30",
                                )}
                                data-testid={`slot-row-${slot.id}`}
                              >
                                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="font-medium w-40 shrink-0">
                                  {formatTime(slot.start_hour, slot.start_minute)}
                                  <span className="text-muted-foreground"> → </span>
                                  {formatTime(slot.end_hour, slot.end_minute)}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  <span>{slot.max_bookings ?? 1} max</span>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                  <Switch
                                    checked={slot.is_enabled}
                                    onCheckedChange={v =>
                                      toggleSlotMutation.mutate({ id: slot.id, enabled: v })
                                    }
                                    data-testid={`toggle-slot-${slot.id}`}
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => openEdit(slot)}
                                    data-testid={`edit-slot-${slot.id}`}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => setDeleteDialog({ open: true, id: slot.id })}
                                    data-testid={`delete-slot-${slot.id}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full gap-1.5 border-dashed"
                          onClick={() => openAdd(day.value)}
                          data-testid={`add-slot-day-${day.value}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Slot for {day.label}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── Add / Edit Slot Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={slotDialog.open}
        onOpenChange={o => { if (!o) setSlotDialog({ open: false, form: null }); }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {slotDialog.form?.id ? "Edit" : "Add"} Time Slot
            </DialogTitle>
            <DialogDescription>
              Configure the time slot. Overlapping or duplicate slots on the same day are not allowed.
            </DialogDescription>
          </DialogHeader>

          {slotDialog.form && (
            <div className="space-y-4">
              {/* Day of Week */}
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={String(slotDialog.form.day_of_week)}
                  onValueChange={v =>
                    setSlotDialog(prev => ({
                      ...prev,
                      form: { ...prev.form!, day_of_week: parseInt(v) },
                    }))
                  }
                >
                  <SelectTrigger data-testid="select-day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => (
                      <SelectItem key={d.value} value={String(d.value)}>
                        {d.emoji} {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label>Start Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={String(slotDialog.form.start_hour)}
                    onValueChange={v =>
                      setSlotDialog(prev => ({
                        ...prev,
                        form: { ...prev.form!, start_hour: parseInt(v) },
                      }))
                    }
                  >
                    <SelectTrigger data-testid="select-start-hour">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {HOURS.map(h => (
                        <SelectItem key={h.value} value={String(h.value)}>
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(slotDialog.form.start_minute)}
                    onValueChange={v =>
                      setSlotDialog(prev => ({
                        ...prev,
                        form: { ...prev.form!, start_minute: parseInt(v) },
                      }))
                    }
                  >
                    <SelectTrigger data-testid="select-start-minute">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTES.map(m => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          :{m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label>End Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={String(slotDialog.form.end_hour)}
                    onValueChange={v =>
                      setSlotDialog(prev => ({
                        ...prev,
                        form: { ...prev.form!, end_hour: parseInt(v) },
                      }))
                    }
                  >
                    <SelectTrigger data-testid="select-end-hour">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {HOURS.map(h => (
                        <SelectItem key={h.value} value={String(h.value)}>
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(slotDialog.form.end_minute)}
                    onValueChange={v =>
                      setSlotDialog(prev => ({
                        ...prev,
                        form: { ...prev.form!, end_minute: parseInt(v) },
                      }))
                    }
                  >
                    <SelectTrigger data-testid="select-end-minute">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTES.map(m => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          :{m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {slotDialog.form.end_hour * 60 + slotDialog.form.end_minute <=
                  slotDialog.form.start_hour * 60 + slotDialog.form.start_minute && (
                  <p className="text-xs text-destructive">End time must be after start time</p>
                )}
              </div>

              {/* Max Bookings */}
              <div className="space-y-2">
                <Label>Max Bookings per Slot</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={slotDialog.form.max_bookings}
                    onChange={e =>
                      setSlotDialog(prev => ({
                        ...prev,
                        form: { ...prev.form!, max_bookings: Math.max(1, parseInt(e.target.value) || 1) },
                      }))
                    }
                    className="w-28"
                    data-testid="input-max-bookings"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of users who can book this slot
                  </p>
                </div>
              </div>

              {/* Enabled */}
              <div className="flex items-center gap-3 pt-1">
                <Switch
                  checked={slotDialog.form.is_enabled}
                  onCheckedChange={v =>
                    setSlotDialog(prev => ({ ...prev, form: { ...prev.form!, is_enabled: v } }))
                  }
                  data-testid="switch-slot-enabled"
                />
                <div>
                  <Label>Enable this slot</Label>
                  <p className="text-xs text-muted-foreground">Users can only book enabled slots</p>
                </div>
              </div>

              {/* Overlap preview */}
              {slotDialog.form.end_hour * 60 + slotDialog.form.end_minute >
                slotDialog.form.start_hour * 60 + slotDialog.form.start_minute && (
                <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1">
                  <p className="font-medium text-muted-foreground">Slot preview</p>
                  <p>
                    <span className="font-semibold">
                      {DAYS.find(d => d.value === slotDialog.form!.day_of_week)?.label}
                    </span>
                    {" · "}
                    {formatTime(slotDialog.form.start_hour, slotDialog.form.start_minute)}
                    {" → "}
                    {formatTime(slotDialog.form.end_hour, slotDialog.form.end_minute)}
                    {" · "}
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {slotDialog.form.max_bookings} max
                    </span>
                  </p>
                  {hasOverlap(slots, slotDialog.form, slotDialog.form.id) && (
                    <p className="text-destructive font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Overlaps with an existing slot on this day
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSlotDialog({ open: false, form: null })}
              data-testid="btn-cancel-slot"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveSlotMutation.isPending}
              data-testid="btn-save-slot"
            >
              {saveSlotMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              {slotDialog.form?.id ? "Save Changes" : "Add Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={o => { if (!o) setDeleteDialog({ open: false, id: "" }); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time slot? This cannot be undone and will prevent users from booking this slot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="btn-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteSlotMutation.mutate(deleteDialog.id)}
              disabled={deleteSlotMutation.isPending}
              data-testid="btn-confirm-delete"
            >
              {deleteSlotMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTimeSlotManagement;
