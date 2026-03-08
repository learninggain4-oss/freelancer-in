import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { ClipboardCheck, LogIn, LogOut, CalendarDays, Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    fetchTodayRecord();
  }, [profile]);

  useEffect(() => {
    fetchMonthRecords();
  }, [profile, currentMonth]);

  const handleCheckIn = async () => {
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase.from("attendance").insert({
      profile_id: profile.id,
      date: todayStr,
      check_in_at: new Date().toISOString(),
      status: "present",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Checked In ✅", description: "Your attendance has been recorded." });
      fetchTodayRecord();
      fetchMonthRecords();
    }
  };

  const handleCheckOut = async () => {
    if (!profile || !todayRecord) return;
    setLoading(true);
    const { error } = await supabase
      .from("attendance")
      .update({ check_out_at: new Date().toISOString() })
      .eq("id", todayRecord.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Checked Out 👋", description: "See you tomorrow!" });
      fetchTodayRecord();
      fetchMonthRecords();
    }
  };

  // Calendar day styling
  const presentDays = useMemo(
    () => monthRecords.filter((r) => r.check_out_at).map((r) => new Date(r.date)),
    [monthRecords]
  );
  const halfDays = useMemo(
    () => monthRecords.filter((r) => !r.check_out_at).map((r) => new Date(r.date)),
    [monthRecords]
  );

  const totalPresent = monthRecords.filter((r) => r.check_out_at).length;
  const totalHalfDay = monthRecords.filter((r) => !r.check_out_at).length;

  const streak = useMemo(() => {
    let count = 0;
    const sorted = [...monthRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    for (let i = 0; i < sorted.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedStr = format(expectedDate, "yyyy-MM-dd");
      if (sorted.find((r) => r.date === expectedStr)) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [monthRecords, todayStr]);

  const selectedRecord = selectedDate
    ? monthRecords.find((r) => isSameDay(new Date(r.date), selectedDate))
    : null;

  const modifiers = { present: presentDays, halfDay: halfDays };
  const modifiersClassNames = {
    present: "!bg-accent/20 !text-accent-foreground border border-accent",
    halfDay: "!bg-warning/20 !text-warning border border-warning",
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Attendance</h1>
      </div>

      {/* Check-in / Check-out Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today — {format(today, "dd MMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!todayRecord ? (
            <Button onClick={() => openFaceDialog("check_in")} disabled={loading} className="w-full gap-2">
              <Camera className="h-4 w-4" />
              <LogIn className="h-4 w-4" />
              Check In with Face Verification
            </Button>
          ) : !todayRecord.check_out_at ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Checked in at {format(new Date(todayRecord.check_in_at), "hh:mm a")}
                {todayRecord.check_in_photo_path && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Camera className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
              <Button onClick={() => openFaceDialog("check_out")} disabled={loading} variant="secondary" className="w-full gap-2">
                <Camera className="h-4 w-4" />
                <LogOut className="h-4 w-4" />
                Check Out with Face Verification
              </Button>
            </>
          ) : (
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-accent" />
                In: {format(new Date(todayRecord.check_in_at), "hh:mm a")}
                {todayRecord.check_in_photo_path && <Camera className="h-3 w-3 text-accent" />}
              </div>
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4 text-accent" />
                Out: {format(new Date(todayRecord.check_out_at), "hh:mm a")}
                {todayRecord.check_out_photo_path && <Camera className="h-3 w-3 text-accent" />}
              </div>
              <Badge variant="secondary" className="mt-2 bg-accent/10 text-accent">
                ✅ Attendance Complete (Face Verified)
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <CalendarDays className="h-5 w-5 text-accent mb-1" />
            <span className="text-lg font-bold text-foreground">{totalPresent}</span>
            <span className="text-xs text-muted-foreground">Present</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <Clock className="h-5 w-5 text-warning mb-1" />
            <span className="text-lg font-bold text-foreground">{totalHalfDay}</span>
            <span className="text-xs text-muted-foreground">Half Day</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <Flame className="h-5 w-5 text-destructive mb-1" />
            <span className="text-lg font-bold text-foreground">{streak}</span>
            <span className="text-xs text-muted-foreground">Streak</span>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly View</CardTitle>
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
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-accent/20 border border-accent" />
              Present
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-warning/20 border border-warning" />
              Half Day
            </div>
          </div>

          {selectedDate && (
            <div className="mt-3 p-3 rounded-md bg-muted/50 text-sm">
              <p className="font-medium text-foreground">{format(selectedDate, "dd MMM yyyy")}</p>
              {selectedRecord ? (
                <div className="text-muted-foreground mt-1 space-y-0.5">
                  <p>Check in: {format(new Date(selectedRecord.check_in_at), "hh:mm a")}</p>
                  {selectedRecord.check_out_at && (
                    <p>Check out: {format(new Date(selectedRecord.check_out_at), "hh:mm a")}</p>
                  )}
                  <Badge variant="outline" className="mt-1">
                    {selectedRecord.check_out_at ? "Present" : "Half Day"}
                  </Badge>
                </div>
              ) : (
                <p className="text-muted-foreground mt-1">No attendance recorded</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Face Verification Dialog */}
      <FaceVerificationDialog
        open={faceDialogOpen}
        onOpenChange={setFaceDialogOpen}
        onCaptured={handleFaceCaptured}
        title={faceAction === "check_in" ? "Check-In Verification" : "Check-Out Verification"}
      />
    </div>
  );
};

export default EmployeeAttendance;
