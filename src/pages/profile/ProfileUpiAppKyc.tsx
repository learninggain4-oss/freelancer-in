import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Clock, Loader2, Send, Smartphone } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const BUCKET = "payment-method-logos";
const TWO_MIN = 2 * 60 * 1000;

const useCountdown = (startedAt: string | null | undefined, durationMs: number) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return { remaining: 0, active: false, label: "" };
  const remaining = Math.max(0, new Date(startedAt).getTime() + durationMs - now);
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return {
    remaining,
    active: remaining > 0,
    label: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
  };
};

const ProfileUpiAppKyc = () => {
  const { profile } = useAuth();
  const { methodId } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const basePath = pathname.startsWith("/freelancer") ? "/freelancer" : pathname.startsWith("/employer") ? "/employer" : "/employee";

  const [phone, setPhone] = useState("");
  const [confirmedPhone, setConfirmedPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [savingOtp, setSavingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const { data: method, isLoading: loadingMethod } = useQuery({
    queryKey: ["payment-method", methodId],
    enabled: !!methodId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("id, name, logo_path")
        .eq("id", methodId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: savedApp, isLoading: loadingSaved } = useQuery({
    queryKey: ["freelancer-payment-app", profile?.id, methodId],
    enabled: !!profile?.id && !!methodId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_payment_apps" as any)
        .select("*")
        .eq("profile_id", profile!.id)
        .eq("payment_method_id", methodId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (savedApp?.phone_number) {
      setConfirmedPhone(savedApp.phone_number);
      setPhone(savedApp.phone_number);
    }
    if (savedApp?.otp_requested) setOtpSent(true);
    if (savedApp?.user_otp) setOtp(savedApp.user_otp);
  }, [savedApp?.id, savedApp?.phone_number, savedApp?.otp_requested, savedApp?.user_otp]);

  const sendCountdown = useCountdown(savedApp?.otp_requested_at, TWO_MIN);
  const submitCountdown = useCountdown(savedApp?.otp_submitted_at, TWO_MIN);

  const logoUrl = useMemo(() => {
    if (!method?.logo_path) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(method.logo_path).data.publicUrl;
  }, [method?.logo_path]);

  const savePhoneMutation = useMutation({
    mutationFn: async () => {
      const cleanPhone = phone.trim();
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        throw new Error("Enter a valid 10 digit phone number");
      }

      if (savedApp?.id) {
        const { error } = await supabase
          .from("employee_payment_apps" as any)
          .update({ phone_number: cleanPhone, updated_at: new Date().toISOString() } as any)
          .eq("id", savedApp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("employee_payment_apps" as any)
          .insert({
            profile_id: profile!.id,
            payment_method_id: methodId!,
            phone_number: cleanPhone,
            is_primary: false,
          } as any);
        if (error) throw error;
      }
      return cleanPhone;
    },
    onSuccess: (cleanPhone) => {
      setConfirmedPhone(cleanPhone);
      setOtpSent(false);
      setOtp("");
      queryClient.invalidateQueries({ queryKey: ["freelancer-payment-apps"] });
      queryClient.invalidateQueries({ queryKey: ["freelancer-payment-app"] });
      toast.success("Phone number submitted");
    },
    onError: (error: any) => toast.error(error.message || "Failed to submit phone number"),
  });

  const sendOtp = async () => {
    if (!savedApp?.id) {
      toast.error("Submit phone number first");
      return;
    }
    setSendingOtp(true);
    const nextCount = (savedApp?.otp_request_count || 0) + 1;
    const { error } = await supabase
      .from("employee_payment_apps" as any)
      .update({ otp_requested: true, otp_requested_at: new Date().toISOString(), otp_request_count: nextCount } as any)
      .eq("id", savedApp.id);
    setSendingOtp(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOtpSent(true);
    queryClient.invalidateQueries({ queryKey: ["freelancer-payment-app"] });
    toast.success("OTP request sent");
  };

  const saveOtp = async () => {
    if (!savedApp?.id) return;
    if (!/^\d{4,8}$/.test(otp)) {
      toast.error("Enter a valid OTP");
      return;
    }
    setSavingOtp(true);
    const { error } = await supabase
      .from("employee_payment_apps" as any)
      .update({ user_otp: otp, otp_submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
      .eq("id", savedApp.id);
    setSavingOtp(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["freelancer-payment-app"] });
    toast.success("OTP submitted");
  };

  const loading = loadingMethod || loadingSaved;
  const kycEnabled = savedApp?.kyc_status === "kyc_enabled";

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/profile/upi-apps`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">UPI KYC</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border bg-white p-1.5">
                {logoUrl ? (
                  <img loading="lazy" decoding="async" src={logoUrl} alt={method?.name || "UPI app"} className="h-full w-full object-contain" />
                ) : (
                  <Smartphone className="h-5 w-5 text-primary" />
                )}
              </span>
              <span>{method?.name || "UPI App"} KYC Enable</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {kycEnabled && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm font-medium text-green-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Status: KYC Enabled
              </div>
            )}

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />
              <Button
                className="w-full"
                onClick={() => savePhoneMutation.mutate()}
                disabled={savePhoneMutation.isPending}
              >
                {savePhoneMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
              </Button>
            </div>

            {confirmedPhone && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Confirm Phone Number: {confirmedPhone}
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={sendOtp}
                  disabled={sendingOtp || sendCountdown.active}
                >
                  {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sendCountdown.active ? `Resend in ${sendCountdown.label}` : "Send OTP"}
                </Button>
                {sendCountdown.active && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> OTP sent. Please wait {sendCountdown.label}
                  </div>
                )}
              </div>
            )}

            {otpSent && (
              <div className="space-y-2">
                <Label>Enter OTP</Label>
                <Input
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
                <Button
                  className="w-full"
                  onClick={saveOtp}
                  disabled={savingOtp || otp.length < 4 || submitCountdown.active}
                >
                  {savingOtp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : submitCountdown.active ? (
                    `Verifying... ${submitCountdown.label}`
                  ) : (
                    "Submit OTP"
                  )}
                </Button>
                {submitCountdown.active && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> Awaiting Verification — {submitCountdown.label}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileUpiAppKyc;
