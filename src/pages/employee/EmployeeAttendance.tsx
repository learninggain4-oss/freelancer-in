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
    present: "!bg-accent/20 !text-accent-foreground border border-accent",
    halfDay: "!bg-warning/20 !text-warning border border-warning",
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary-foreground/5 blur-xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Attendance</h1>
              <p className="text-xs text-primary-foreground/70">{format(today, "EEEE, dd MMMM yyyy")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Check-in/out Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="h-4 w-4 text-primary" />
            Today's Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!todayRecord ? (
            <Button
              onClick={() => setShowCheckInDialog(true)}
              disabled={loading}
              className="w-full gap-2 h-12 text-base bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-md shadow-accent/20"
            >
              <LogIn className="h-5 w-5" />
              Check In Now
            </Button>
          ) : !todayRecord.check_out_at ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-accent/10 p-3 border border-accent/20">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Checked In</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(todayRecord.check_in_at), "hh:mm a")}</p>
                </div>
              </div>
              <Button
                onClick={() => setShowCheckOutDialog(true)}
                disabled={loading}
                variant="secondary"
                className="w-full gap-2 h-12 text-base border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
              >
                <LogOut className="h-5 w-5" />
                Check Out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-accent/10 p-3 border border-accent/20">
                  <LogIn className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">In</p>
                    <p className="text-sm font-semibold text-foreground">{format(new Date(todayRecord.check_in_at), "hh:mm a")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-primary/10 p-3 border border-primary/20">
                  <LogOut className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Out</p>
                    <p className="text-sm font-semibold text-foreground">{format(new Date(todayRecord.check_out_at), "hh:mm a")}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-accent/5 p-3 border border-accent/10">
                <Badge variant="secondary" className="bg-accent/15 text-accent border-0 font-semibold">
                  ✅ Complete
                </Badge>
                {formatDuration(todayRecord.check_in_at, todayRecord.check_out_at) && (
                  <span className="text-xs font-medium text-muted-foreground">
                    Duration: {formatDuration(todayRecord.check_in_at, todayRecord.check_out_at)}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { icon: CalendarDays, value: totalPresent, label: "Present", color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
          { icon: Clock, value: totalHalfDay, label: "Half Day", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
          { icon: Flame, value: streak, label: "Streak", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
          { icon: TrendingUp, value: `${attendanceRate}%`, label: "Rate", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
        ].map((stat) => (
          <Card key={stat.label} className={cn("border", stat.border, "overflow-hidden")}>
            <CardContent className="flex flex-col items-center p-3 gap-1">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <span className="text-lg font-bold text-foreground leading-none">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="pb-2 bg-gradient-to-r from-muted/50 to-transparent">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" />
            Monthly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className={cn("p-3 pointer-events-auto w-full")}
            disabled={(date) => date > today}
          />
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-accent/30 border-2 border-accent" />
              Present
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-warning/30 border-2 border-warning" />
              Half Day
            </div>
          </div>

          {selectedDate && (
            <div className="mt-3 rounded-xl bg-gradient-to-br from-muted/60 to-muted/30 p-4 text-sm border border-border/50 animate-fade-in">
              <p className="font-semibold text-foreground">{format(selectedDate, "dd MMM yyyy")}</p>
              {selectedRecord ? (
                <div className="text-muted-foreground mt-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <LogIn className="h-3.5 w-3.5 text-accent" />
                    <span>In: {format(new Date(selectedRecord.check_in_at), "hh:mm a")}</span>
                  </div>
                  {selectedRecord.check_out_at && (
                    <div className="flex items-center gap-2">
                      <LogOut className="h-3.5 w-3.5 text-primary" />
                      <span>Out: {format(new Date(selectedRecord.check_out_at), "hh:mm a")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      selectedRecord.check_out_at ? "border-accent/30 text-accent bg-accent/5" : "border-warning/30 text-warning bg-warning/5"
                    )}>
                      {selectedRecord.check_out_at ? "✅ Present" : "⏳ Half Day"}
                    </Badge>
                    {selectedRecord.check_out_at && formatDuration(selectedRecord.check_in_at, selectedRecord.check_out_at) && (
                      <span className="text-xs text-muted-foreground">• {formatDuration(selectedRecord.check_in_at, selectedRecord.check_out_at)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground mt-1">No attendance recorded</p>
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

export default EmployeeAttendance;
