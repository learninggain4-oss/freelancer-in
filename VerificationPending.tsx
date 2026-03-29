import { useEffect, useState } from "react";
import { Clock, Mail, ArrowLeft, LogOut, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const VerificationPending = () => {
  const { profile, signOut } = useAuth();
  const [countdownHours, setCountdownHours] = useState<number>(6);
  const [remaining, setRemaining] = useState<number>(0);

  // Fetch countdown setting
  useEffect(() => {
    const fetchSetting = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "approval_countdown_hours")
        .maybeSingle();
      if (data) {
        const hours = Number(data.value);
        if (!isNaN(hours) && hours > 0) setCountdownHours(hours);
      }
    };
    fetchSetting();
  }, []);

  // Compute remaining time from profile creation
  useEffect(() => {
    if (!profile?.created_at) return;
    const deadline = new Date(profile.created_at).getTime() + countdownHours * 60 * 60 * 1000;
    const update = () => setRemaining(Math.max(0, deadline - Date.now()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [profile?.created_at, countdownHours]);

  const totalMs = countdownHours * 60 * 60 * 1000;
  const progress = totalMs > 0 ? (remaining / totalMs) * 100 : 0;
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-sm">
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
              <Clock className="h-8 w-8 text-warning" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-foreground">
              {profile?.approval_status === "rejected" ? "Registration Rejected" : "Verification Pending"}
            </h1>
            {profile?.approval_status === "rejected" ? (
              <p className="mb-1 text-sm text-muted-foreground">
                Your registration has been rejected.
                {profile.approval_notes && (
                  <span className="mt-2 block rounded bg-destructive/10 p-2 text-xs text-destructive">
                    Reason: {profile.approval_notes}
                  </span>
                )}
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted-foreground">
                  Your account is under review. Admin approval usually takes place before the countdown time.
                </p>

                {/* Countdown Timer */}
                {remaining > 0 ? (
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-center gap-1 text-2xl font-mono font-bold text-warning">
                      {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">Time remaining for approval</p>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-warning">
                    Countdown expired — approval may take a bit longer. Please be patient.
                  </p>
                )}

              </>
            )}

            {/* WhatsApp notification message */}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/10 p-3">
              <MessageCircle className="h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs text-muted-foreground">
                If your account is approved before the countdown time, you will receive a <strong>WhatsApp message</strong> confirming your approval.
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted p-3">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                You'll also receive an email notification once your account is approved.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex flex-col gap-2">
          <Button variant="outline" onClick={signOut} className="w-full gap-2">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
          <Link to="/">
            <Button variant="ghost" size="sm" className="w-full gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
