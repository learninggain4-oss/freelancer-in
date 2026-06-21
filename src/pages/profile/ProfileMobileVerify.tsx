import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarClock, CheckCircle2, Loader2, Phone, Send, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";

const getBasePath = (pathname: string) =>
  pathname.startsWith("/freelancer") ? "/freelancer" : pathname.startsWith("/employer") ? "/employer" : "/employee";

const RESEND_COOLDOWN_SEC = 120; // 2 minutes
const REVIEW_COUNTDOWN_SEC = 60; // 1 minute

const fmtTime = (t: string | null) => (t ? t.slice(0, 5) : "");
const fmtMmSs = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
const timeStrToMinutes = (t?: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const ProfileMobileVerify = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = getBasePath(pathname);
  const [otpInput, setOtpInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const { data: windowData } = useQuery({
    queryKey: ["mobile-verify-window-self", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("verify_window_start, verify_window_end, verify_window_changed_at")
        .eq("id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as { verify_window_start: string | null; verify_window_end: string | null; verify_window_changed_at: string | null } | null;
    },
  });

  // 24h security hold applies only when the user changed the window themselves
  // (admin updates set verify_window_changed_at to null → no hold).
  const HOLD_MS = 24 * 60 * 60 * 1000;
  const holdMsLeft = (() => {
    if (!windowData?.verify_window_changed_at) return 0;
    const changed = new Date(windowData.verify_window_changed_at).getTime();
    return Math.max(0, HOLD_MS - (now - changed));
  })();
  const holdActive = holdMsLeft > 0;
  const fmtHold = (ms: number) => {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  };

  const { data: verification, refetch } = useQuery({
    queryKey: ["my-mobile-verification", profile?.id],
    enabled: !!profile?.id,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mobile_verifications")
        .select("id, otp, otp_sent_at, submitted_at, send_count, status, mobile_number")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as {
        id: string;
        otp: string | null;
        otp_sent_at: string | null;
        submitted_at: string | null;
        send_count: number | null;
        status: string | null;
        mobile_number: string | null;
      } | null;
    },
  });

  const isWithinWindow = (() => {
    const s = timeStrToMinutes(windowData?.verify_window_start);
    const e = timeStrToMinutes(windowData?.verify_window_end);
    if (s == null || e == null) return false;
    const d = new Date();
    const cur = d.getHours() * 60 + d.getMinutes();
    return e > s ? cur >= s && cur <= e : cur >= s || cur <= e;
  })();

  const status = verification?.status ?? "not_submitted";
  const isVerified = status === "verified";
  const isAwaitingReview = status === "pending_review";
  const isIncorrect = status === "incorrect";
  const isOtpSent = status === "otp_sent" || isIncorrect || isAwaitingReview;

  // Resend cooldown (2 minutes after last send)
  const resendSecLeft = (() => {
    if (!verification?.otp_sent_at) return 0;
    const elapsed = Math.floor((now - new Date(verification.otp_sent_at).getTime()) / 1000);
    return Math.max(0, RESEND_COOLDOWN_SEC - elapsed);
  })();

  // Verification review countdown (1 min after submit) — visual only
  const reviewSecLeft = (() => {
    if (!verification?.submitted_at || !isAwaitingReview) return 0;
    const elapsed = Math.floor((now - new Date(verification.submitted_at).getTime()) / 1000);
    return Math.max(0, REVIEW_COUNTDOWN_SEC - elapsed);
  })();

  const canSendOtp =
    !!profile?.mobile_number &&
    !!windowData?.verify_window_start &&
    !!windowData?.verify_window_end &&
    isWithinWindow &&
    !holdActive &&
    !isVerified &&
    !isAwaitingReview &&
    resendSecLeft === 0;


  const sendOtp = async () => {
    if (!profile?.id || !profile?.mobile_number) {
      toast.error("Add your mobile number in Personal Info first.");
      return;
    }
    setSending(true);
    const nowIso = new Date().toISOString();
    if (verification?.id) {
      const { error } = await (supabase as any)
        .from("mobile_verifications")
        .update({
          otp: null,
          submitted_at: null,
          otp_sent_at: nowIso,
          status: "otp_sent",
          mobile_number: profile.mobile_number,
          send_count: (verification.send_count ?? 0) + 1,
          updated_at: nowIso,
        })
        .eq("id", verification.id);
      setSending(false);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await (supabase as any)
        .from("mobile_verifications")
        .insert({
          profile_id: profile.id,
          mobile_number: profile.mobile_number,
          otp_sent_at: nowIso,
          status: "otp_sent",
          send_count: 1,
        });
      setSending(false);
      if (error) { toast.error(error.message); return; }
    }
    setOtpInput("");
    toast.success("OTP requested. Please enter the OTP you receive.");
    refetch();
  };

  const submitOtp = async () => {
    if (!verification?.id) { toast.error("Click Send OTP first."); return; }
    if (otpInput.length < 4) { toast.error("Enter the OTP"); return; }
    setSubmitting(true);
    const { error } = await (supabase as any)
      .from("mobile_verifications")
      .update({
        otp: otpInput.trim(),
        submitted_at: new Date().toISOString(),
        status: "pending_review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", verification.id);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setOtpInput("");
    toast.success("OTP submitted. Awaiting admin verification.");
    refetch();
  };

  const windowConfigured = !!(windowData?.verify_window_start && windowData?.verify_window_end);

  const statusBadge = () => {
    if (isVerified) return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1"><CheckCircle2 className="h-3 w-3" />Verified</Badge>;
    if (isAwaitingReview) return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1"><Loader2 className="h-3 w-3 animate-spin" />Awaiting Review</Badge>;
    if (isIncorrect) return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Incorrect OTP — try again</Badge>;
    if (status === "otp_sent") return <Badge variant="outline" className="gap-1">OTP Sent</Badge>;
    return <Badge variant="outline">Not submitted</Badge>;
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${base}/profile/personal`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Mobile Verification</h1>
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Verify Enable Time</p>
              {windowConfigured ? (
                <p className="text-[11px] text-muted-foreground">
                  Daily window: {fmtTime(windowData!.verify_window_start)} – {fmtTime(windowData!.verify_window_end)}
                  {" • "}
                  <span className={isWithinWindow ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                    {isWithinWindow ? "Active now" : "Inactive"}
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">Not set up</p>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate(`${base}/profile/mobile-verify/schedule`)}>
            Setup Time
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start gap-3 rounded-md border p-3">
            <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Mobile Number</p>
              <p className="truncate text-sm font-medium">{profile?.mobile_number || "Not provided"}</p>
            </div>
            {statusBadge()}
          </div>

          {!isVerified && (
            <>
              <Button
                className="w-full"
                onClick={sendOtp}
                disabled={!canSendOtp || sending}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                {resendSecLeft > 0
                  ? `Resend in ${fmtMmSs(resendSecLeft)}`
                  : isOtpSent ? "Resend OTP" : "Send OTP"}
              </Button>

              {!canSendOtp && !isVerified && resendSecLeft === 0 && (
                <p className="text-[11px] text-muted-foreground -mt-2">
                  {!profile?.mobile_number
                    ? "Add a mobile number in Personal Info first."
                    : !windowConfigured
                    ? "Set up your Verify Enable Time first."
                    : holdActive
                    ? `24-hour security hold active. Send OTP will enable in ${fmtHold(holdMsLeft)}.`
                    : !isWithinWindow
                    ? "Send OTP is available only during your Verify Enable Time window."
                    : isAwaitingReview
                    ? "Waiting for admin verification…"
                    : ""}
                </p>
              )}


              {isOtpSent && (
                <div className="space-y-2 pt-3 border-t">
                  <Label className="text-xs">Enter OTP</Label>
                  <Input
                    value={otpInput}
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit OTP"
                    disabled={isAwaitingReview}
                  />
                  <Button className="w-full" onClick={submitOtp} disabled={submitting || isAwaitingReview || otpInput.length < 4}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Submit OTP
                  </Button>
                  {isAwaitingReview && (
                    <div className="rounded-md border bg-amber-500/5 border-amber-500/30 p-3 text-center">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Verification in progress…
                      </p>
                      <p className="text-2xl font-mono font-bold text-amber-600 mt-1">
                        {fmtMmSs(reviewSecLeft)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Admin is reviewing your OTP.
                      </p>
                    </div>
                  )}
                  {isIncorrect && (
                    <p className="text-[11px] text-destructive">
                      Admin marked the OTP as incorrect. Please re-enter the correct OTP.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {isVerified && (
            <div className="rounded-md border bg-emerald-500/5 border-emerald-500/30 p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Mobile number verified</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileMobileVerify;
