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
  warm:  { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", input:"#fffdf7", nav:"#fef0d0", badge:"rgba(217,119,6,.1)", badgeFg:"#b45309" },
  forest: { bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", input:"#ffffff", nav:"#dcfce7", badge:"rgba(22,163,74,.1)", badgeFg:"#15803d" },
  ocean: { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", input:"#ffffff", nav:"#e0f2fe", badge:"rgba(14,165,233,.1)", badgeFg:"#0369a1" },
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

const EmployeeAttendance = () => {
  const { profile } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const isDark = theme === "black";
  const clrGreen = isDark ? "#4ade80" : "#16a34a";
  const clrAmber = isDark ? "#fbbf24" : "#b45309";

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const fetchTodayRecord = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("date", todayStr)
      .maybeSingle();
    setTodayRecord(data as AttendanceRecord | null);
  };

  const fetchMonthRecords = async () => {
    if (!profile) return;
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("profile_id", profile.id)
      .gte("date", start)
      .lte("date", end);
    setMonthRecords((data as AttendanceRecord[]) || []);
  };

  useEffect(() => { fetchTodayRecord(); }, [profile]);
  useEffect(() => { fetchMonthRecords(); }, [profile, currentMonth]);

  const uploadPhoto = async (blob: Blob, type: "check_in" | "check_out"): Promise<string | null> => {
    if (!profile) return null;
    const fileName = `${profile.id}/${todayStr}_${type}_${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("attendance-photos")
      .upload(fileName, blob, { contentType: "image/jpeg" });
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
    present: "!bg-[#4ade80]/20 !text-[#4ade80] border-2 border-[#4ade80]/50 font-bold",
    halfDay: "!bg-[#fbbf24]/20 !text-[#fbbf24] border-2 border-[#fbbf24]/50 font-bold",
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text }} className="space-y-6 p-4 pb-24">
      {/* Hero Header */}
      <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }} className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-xl">
              <ClipboardCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">Attendance</h1>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{format(today, "EEEE, dd MMMM yyyy")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Check-in/out Card */}
      <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="overflow-hidden border shadow-xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#6366f1] opacity-50" />
        <CardHeader className="pb-4">
          <CardTitle style={{ color: T.text }} className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <Timer className="h-5 w-5 text-[#6366f1]" />
            Terminal Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {!todayRecord ? (
            <Button
              onClick={() => setShowCheckInDialog(true)}
              disabled={loading}
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
              className="w-full gap-3 h-14 text-sm font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all border-0 text-white"
            >
              <LogIn className="h-6 w-6" />
              Check In Now
            </Button>
          ) : !todayRecord.check_out_at ? (
            <div className="space-y-4">
              <div style={{ background: "rgba(74,222,128,0.1)", borderColor: "rgba(74,222,128,0.2)" }} className="flex items-center gap-4 rounded-2xl p-4 border shadow-lg backdrop-blur-md">
                <div style={{ background: "rgba(74,222,128,0.2)" }} className="flex h-12 w-12 items-center justify-center rounded-xl">
                  <CheckCircle2 className="h-7 w-7 text-[#4ade80]" />
                </div>
                <div>
                  <p style={{ color: T.text }} className="text-[10px] font-black uppercase tracking-[0.2em]">Active Session</p>
                  <p style={{ color: clrGreen }} className="text-lg font-black">{format(new Date(todayRecord.check_in_at), "hh:mm a")}</p>
                </div>
              </div>
              <Button
                onClick={() => setShowCheckOutDialog(true)}
                disabled={loading}
                variant="outline"
                style={{ background: T.card, borderColor: T.border, color: T.text }}
                className="w-full gap-3 h-14 text-sm font-black uppercase tracking-[0.2em] rounded-2xl border-2 border-dashed hover:border-[#6366f1]/50 hover:bg-white/[0.02] transition-all"
              >
                <LogOut className="h-6 w-6" />
                Check Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div style={{ background: T.nav, borderColor: T.border }} className="flex items-center gap-3 rounded-2xl p-4 border shadow-lg">
                  <LogIn className="h-5 w-5 text-[#4ade80]" />
                  <div>
                    <p style={{ color: T.sub }} className="text-[9px] uppercase tracking-widest font-black opacity-70">Entry</p>
                    <p style={{ color: T.text }} className="text-sm font-black">{format(new Date(todayRecord.check_in_at), "hh:mm a")}</p>
                  </div>
                </div>
                <div style={{ background: T.nav, borderColor: T.border }} className="flex items-center gap-3 rounded-2xl p-4 border shadow-lg">
                  <LogOut className="h-5 w-5 text-[#6366f1]" />
                  <div>
                    <p style={{ color: T.sub }} className="text-[9px] uppercase tracking-widest font-black opacity-70">Exit</p>
                    <p style={{ color: T.text }} className="text-sm font-black">{format(new Date(todayRecord.check_out_at), "hh:mm a")}</p>
                  </div>
                </div>
              </div>
              <div style={{ background: "rgba(74,222,128,0.1)", borderColor: "rgba(74,222,128,0.2)" }} className="flex items-center justify-between rounded-2xl p-4 border backdrop-blur-md">
                <Badge style={{ background: "rgba(74,222,128,0.2)", color: clrGreen, borderColor: "rgba(74,222,128,0.3)" }} className="font-black text-[10px] uppercase tracking-widest px-3 py-1 border">
                  ✅ Mission Complete
                </Badge>
                {formatDuration(todayRecord.check_in_at, todayRecord.check_out_at) && (
                  <span style={{ color: T.sub }} className="text-[10px] font-black uppercase tracking-widest opacity-80">
                    Duration: {formatDuration(todayRecord.check_in_at, todayRecord.check_out_at)}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: CalendarDays, value: totalPresent, label: "Present", color: clrGreen, bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.2)" },
          { icon: Clock, value: totalHalfDay, label: "Half Day", color: clrAmber, bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)" },
          { icon: Flame, value: streak, label: "Streak", color: isDark ? "#f87171" : "#dc2626", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.2)" },
          { icon: TrendingUp, value: `${attendanceRate}%`, label: "Rate", color: "#6366f1", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
        ].map((stat) => (
          <Card key={stat.label} style={{ background: T.card, borderColor: stat.border, backdropFilter: "blur(12px)" }} className="border shadow-xl overflow-hidden">
            <CardContent className="flex items-center p-4 gap-4">
              <div style={{ background: stat.bg }} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner">
                <stat.icon style={{ color: stat.color }} className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p style={{ color: T.text }} className="text-xl font-black leading-none">{stat.value}</p>
                <p style={{ color: T.sub }} className="text-[9px] font-black uppercase tracking-[0.2em] mt-1">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar Card */}
      <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="overflow-hidden border shadow-xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#6366f1] opacity-50" />
        <CardHeader className="pb-4">
          <CardTitle style={{ color: T.text }} className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <CalendarDays className="h-5 w-5 text-[#6366f1]" />
            Monthly Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className={cn("p-0 pointer-events-auto w-full")}
            disabled={(date) => date > today}
          />
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest px-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#4ade80]/40 border-2 border-[#4ade80]" />
              <span style={{ color: T.sub }}>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#fbbf24]/40 border-2 border-[#fbbf24]" />
              <span style={{ color: T.sub }}>Half Day</span>
            </div>
          </div>

          {selectedDate && (
            <div style={{ background: T.nav, borderColor: T.border }} className="rounded-2xl p-5 border shadow-inner animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <ClipboardCheck className="h-12 w-12" />
              </div>
              <p style={{ color: T.text }} className="text-lg font-black uppercase tracking-tight">{format(selectedDate, "dd MMM yyyy")}</p>
              {selectedRecord ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <LogIn className="h-4 w-4 text-[#4ade80]" />
                    <span style={{ color: T.text }} className="text-sm font-bold opacity-90">In: {format(new Date(selectedRecord.check_in_at), "hh:mm a")}</span>
                  </div>
                  {selectedRecord.check_out_at && (
                    <div className="flex items-center gap-3">
                      <LogOut className="h-4 w-4 text-[#6366f1]" />
                      <span style={{ color: T.text }} className="text-sm font-bold opacity-90">Out: {format(new Date(selectedRecord.check_out_at), "hh:mm a")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-2">
                    <Badge style={{ 
                      background: selectedRecord.check_out_at ? "rgba(74,222,128,0.15)" : "rgba(251,191,36,0.15)",
                      color: selectedRecord.check_out_at ? clrGreen : clrAmber,
                      borderColor: selectedRecord.check_out_at ? "rgba(74,222,128,0.3)" : "rgba(251,191,36,0.3)"
                    }} className="text-[9px] font-black uppercase tracking-widest px-3 py-1 border">
                      {selectedRecord.check_out_at ? "✅ Present" : "⏳ Half Day"}
                    </Badge>
                    {selectedRecord.check_out_at && formatDuration(selectedRecord.check_in_at, selectedRecord.check_out_at) && (
                      <span style={{ color: T.sub }} className="text-[10px] font-bold uppercase tracking-widest">• {formatDuration(selectedRecord.check_in_at, selectedRecord.check_out_at)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ color: T.sub }} className="text-xs font-bold uppercase tracking-widest mt-3 opacity-50 italic">No operations recorded</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PhotoCaptureDialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog} onCaptured={handleCheckInPhoto} title="Identity Scan - Entry" description="Scan biometric/face data for check-in." />
      <PhotoCaptureDialog open={showCheckOutDialog} onOpenChange={setShowCheckOutDialog} onCaptured={handleCheckOutPhoto} title="Identity Scan - Exit" description="Scan biometric/face data for check-out." />
    </div>
  );
};

export default EmployeeAttendance;
