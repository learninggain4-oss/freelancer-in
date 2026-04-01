import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { formatDuration } from "@/utils/attendance-helpers";
import {
  ClipboardCheck, LogIn, LogOut, CalendarDays, Flame, Clock,
  TrendingUp, CheckCircle2, Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PhotoCaptureDialog from "@/components/attendance/PhotoCaptureDialog";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

interface AttendanceRecord {
  id: string;
  profile_id: string;
  date: string;
  check_in_at: string;
  check_out_at: string | null;
  status: string;
  check_in_photo_path: string | null;
  check_out_photo_path: string | null;
}

const ClientAttendance = () => {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { profile } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const fetchTodayRecord = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("attendance").select("*").eq("profile_id", profile.id).eq("date", todayStr).maybeSingle();
    setTodayRecord(data as AttendanceRecord | null);
  };

  const fetchMonthRecords = async () => {
    if (!profile) return;
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const { data } = await supabase
      .from("attendance").select("*").eq("profile_id", profile.id).gte("date", start).lte("date", end);
    setMonthRecords((data as AttendanceRecord[]) || []);
  };

  useEffect(() => { fetchTodayRecord(); }, [profile]);
  useEffect(() => { fetchMonthRecords(); }, [profile, currentMonth]);

  const uploadPhoto = async (blob: Blob, type: "check_in" | "check_out"): Promise<string | null> => {
    if (!profile) return null;
    const fileName = `${profile.id}/${todayStr}_${type}_${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("attendance-photos").upload(fileName, blob, { contentType: "image/jpeg" });
    if (error) { console.error("Upload error:", error); return null; }
    return fileName;
  };

  const handleCheckInPhoto = async (blob: Blob) => {
    if (!profile) return;
    setLoading(true);
    const photoPath = await uploadPhoto(blob, "check_in");
    const { error } = await supabase.from("attendance").insert({
      profile_id: profile.id, date: todayStr,
      check_in_at: new Date().toISOString(), check_in_photo_path: photoPath, status: "present",
    });
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Checked In ✅", description: "Your attendance has been recorded." }); fetchTodayRecord(); fetchMonthRecords(); }
  };

  const handleCheckOutPhoto = async (blob: Blob) => {
    if (!profile || !todayRecord) return;
    setLoading(true);
    const photoPath = await uploadPhoto(blob, "check_out");
    const { error } = await supabase.from("attendance")
      .update({ check_out_at: new Date().toISOString(), check_out_photo_path: photoPath })
      .eq("id", todayRecord.id);
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Checked Out 👋", description: "See you tomorrow!" }); fetchTodayRecord(); fetchMonthRecords(); }
  };

  const presentDays = useMemo(() => monthRecords.filter((r) => r.check_out_at).map((r) => new Date(r.date)), [monthRecords]);
  const halfDays = useMemo(() => monthRecords.filter((r) => !r.check_out_at).map((r) => new Date(r.date)), [monthRecords]);
  const totalPresent = monthRecords.filter((r) => r.check_out_at).length;
  const totalHalfDay = monthRecords.filter((r) => !r.check_out_at).length;

  const streak = useMemo(() => {
    let count = 0;
    const sorted = [...monthRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (let i = 0; i < sorted.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      if (sorted.find((r) => r.date === format(expectedDate, "yyyy-MM-dd"))) count++;
      else break;
    }
    return count;
  }, [monthRecords, todayStr]);

  const attendanceRate = monthRecords.length > 0 ? Math.round((totalPresent / (totalPresent + totalHalfDay)) * 100) : 0;
  const selectedRecord = selectedDate ? monthRecords.find((r) => isSameDay(new Date(r.date), selectedDate)) : null;
  const modifiers = { present: presentDays, halfDay: halfDays };
  const modifiersClassNames = {
    present: "!bg-accent/20 !text-accent-foreground border border-accent",
    halfDay: "!bg-warning/20 !text-warning border border-warning",
  };

  return (
    <div className="space-y-6 pb-24 min-h-screen p-4" style={{ backgroundColor: T.bg, color: T.text }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 shadow-2xl">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl border border-white/10">
            <ClipboardCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">Attendance</h1>
            <p className="text-xs font-bold text-white/70 tracking-widest">{format(today, "EEEE, dd MMMM yyyy")}</p>
          </div>
        </div>
      </div>

      {/* Today's Card */}
      <Card className="overflow-hidden border-0 shadow-2xl" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-black uppercase tracking-widest" style={{ color: T.text }}>
            <Timer className="h-5 w-5 text-indigo-400" /> Today's Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!todayRecord ? (
            <Button onClick={() => setShowCheckInDialog(true)} disabled={loading}
              className="w-full gap-3 h-14 text-base font-black uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-indigo-600/20 rounded-2xl active:scale-[0.98] transition-all">
              <LogIn className="h-6 w-6" /> Check In Now
            </Button>
          ) : !todayRecord.check_out_at ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl p-4 shadow-sm border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Checked In</p>
                  <p className="text-xl font-black" style={{ color: T.text }}>{format(new Date(todayRecord.check_in_at), "hh:mm a")}</p>
                </div>
              </div>
              <Button onClick={() => setShowCheckOutDialog(true)} disabled={loading} variant="secondary"
                className="w-full gap-3 h-14 text-base font-black uppercase tracking-widest rounded-2xl border-2 border-dashed border-indigo-500/30 hover:bg-indigo-500/5 hover:border-indigo-500/50 transition-all active:scale-[0.98]" style={{ color: T.text, background: 'transparent' }}>
                <LogOut className="h-6 w-6" /> Check Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-2xl p-4 shadow-sm" style={{ background: T.input, border: `1px solid ${T.border}` }}>
                  <LogIn className="h-5 w-5 text-indigo-400" />
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Check-In</p>
                    <p className="text-base font-black" style={{ color: T.text }}>{format(new Date(todayRecord.check_in_at), "hh:mm a")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl p-4 shadow-sm" style={{ background: T.input, border: `1px solid ${T.border}` }}>
                  <LogOut className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Check-Out</p>
                    <p className="text-base font-black" style={{ color: T.text }}>{format(new Date(todayRecord.check_out_at), "hh:mm a")}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl p-4 shadow-sm" style={{ background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.1)' }}>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 font-black uppercase tracking-widest text-[10px] rounded-lg shadow-sm">✅ Complete</Badge>
                {formatDuration(todayRecord.check_in_at, todayRecord.check_out_at) && (
                  <span className="text-xs font-black tracking-tight" style={{ color: T.sub }}>Duration: {formatDuration(todayRecord.check_in_at, todayRecord.check_out_at)}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: CalendarDays, value: totalPresent, label: "Present", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { icon: Clock, value: totalHalfDay, label: "Half Day", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { icon: Flame, value: streak, label: "Streak", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
          { icon: TrendingUp, value: `${attendanceRate}%`, label: "Rate", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
        ].map((stat) => (
          <Card key={stat.label} className={cn("border shadow-xl rounded-3xl overflow-hidden", stat.border)} style={{ background: T.card, backdropFilter: "blur(12px)" }}>
            <CardContent className="flex flex-col items-center p-5 gap-2">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div className="text-center">
                <span className="text-2xl font-black block tracking-tighter" style={{ color: T.text }}>{stat.value}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{stat.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar */}
      <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
        <CardHeader className="pb-2 bg-white/5 border-b border-white/5">
          <CardTitle className="flex items-center gap-2 text-base font-black uppercase tracking-widest" style={{ color: T.text }}>
            <CalendarDays className="h-5 w-5 text-indigo-400" /> Monthly Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-2xl p-1 shadow-inner" style={{ background: T.input, border: `1px solid ${T.border}` }}>
            <Calendar 
              mode="single" 
              selected={selectedDate} 
              onSelect={setSelectedDate} 
              month={currentMonth}
              onMonthChange={setCurrentMonth} 
              modifiers={modifiers} 
              modifiersClassNames={modifiersClassNames}
              className={cn("p-4 pointer-events-auto w-full font-bold")} 
              disabled={(date) => date > today} 
            />
          </div>
          
          <div className="flex items-center gap-6 mt-6 justify-center">
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-4 rounded-lg bg-emerald-500/30 border-2 border-emerald-500 shadow-sm" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Present</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-4 rounded-lg bg-amber-500/30 border-2 border-amber-500 shadow-sm" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Half Day</span>
            </div>
          </div>

          {selectedDate && (
            <div className="mt-6 rounded-3xl p-5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-black tracking-tight" style={{ color: T.text }}>{format(selectedDate, "dd MMM yyyy")}</p>
                <div className="h-px flex-1 mx-4 bg-white/10" />
              </div>
              {selectedRecord ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/5">
                      <LogIn className="h-4 w-4 text-emerald-400" />
                      <div>
                        <p className="text-[8px] uppercase font-black tracking-widest opacity-30">In</p>
                        <p className="text-xs font-bold" style={{ color: T.text }}>{format(new Date(selectedRecord.check_in_at), "hh:mm a")}</p>
                      </div>
                    </div>
                    {selectedRecord.check_out_at && (
                      <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/5">
                        <LogOut className="h-4 w-4 text-indigo-400" />
                        <div>
                          <p className="text-[8px] uppercase font-black tracking-widest opacity-30">Out</p>
                          <p className="text-xs font-bold" style={{ color: T.text }}>{format(new Date(selectedRecord.check_out_at), "hh:mm a")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border", selectedRecord.check_out_at ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-amber-500/30 text-amber-400 bg-amber-500/10")}>
                      {selectedRecord.check_out_at ? "✅ Present" : "⏳ Half Day"}
                    </Badge>
                    {selectedRecord.check_out_at && formatDuration(selectedRecord.check_in_at, selectedRecord.check_out_at) && (
                      <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">• {formatDuration(selectedRecord.check_in_at, selectedRecord.check_out_at)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-20">No record for this day</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PhotoCaptureDialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog} onCaptured={handleCheckInPhoto} title="Check In Photo" description="Take a photo to verify your check-in." />
      <PhotoCaptureDialog open={showCheckOutDialog} onOpenChange={setShowCheckOutDialog} onCaptured={handleCheckOutPhoto} title="Check Out Photo" description="Take a photo to verify your check-out." />
    </div>
  );
};

export default ClientAttendance;
