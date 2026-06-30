// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Smartphone, ArrowLeft, Clock, CheckCircle2, Send, Loader2, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH: any = {
  black:  { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", bg:"#070714" },
  white:  { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", bg:"#f0f4ff" },
  wb:     { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", bg:"#f0f4ff" },
  warm:   { card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", input:"#fffdf7", bg:"#fef6e4" },
  forest: { card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", input:"#ffffff", bg:"#f1faf4" },
  ocean:  { card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", input:"#ffffff", bg:"#f0f9ff" },
};

const A1 = "#6366f1";
const fmt = (d: string) => d ? new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

const ProfileMobileVerification = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = pathname.startsWith("/freelancer") ? "/freelancer" : pathname.startsWith("/employer") ? "/employer" : "/employee";
  const qc = useQueryClient();
  const { theme } = useDashboardTheme();
  const T = TH[theme] || TH.white;

  const [mobile, setMobile] = useState(profile?.mobile_number || "");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"enter"|"otp">("enter");
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [preferStart, setPreferStart] = useState("09:00");
  const [preferEnd, setPreferEnd] = useState("18:00");

  const { data: verif, isLoading: verifLoading } = useQuery({
    queryKey: ["my-mobile-verif", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("mobile_verifications")
        .select("*")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: timeSlot } = useQuery({
    queryKey: ["my-mobile-time-slot", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("mobile_verify_time_slots")
        .select("*")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      return data;
    },
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!mobile || mobile.length < 10) throw new Error("Enter a valid 10-digit mobile number");
      const { error } = await supabase.from("mobile_verifications").upsert({
        profile_id: profile!.id,
        mobile_number: mobile,
        status: "pending",
        updated_at: new Date().toISOString(),
      }, { onConflict: "profile_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verification request submitted! OTP will be sent by admin.");
      setStep("otp");
      qc.invalidateQueries({ queryKey: ["my-mobile-verif", profile?.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!otp || otp.length !== 6) throw new Error("Enter the 6-digit OTP");
      if (!verif?.otp) throw new Error("OTP not yet sent. Please wait for admin to send OTP.");
      if (verif.otp !== otp) throw new Error("Incorrect OTP. Please try again.");
      const { error } = await supabase.from("mobile_verifications").update({
        status: "verified", updated_at: new Date().toISOString(),
      }).eq("profile_id", profile!.id);
      if (error) throw error;
      await supabase.from("profiles").update({ mobile_number: mobile } as any).eq("id", profile!.id);
    },
    onSuccess: () => {
      toast.success("Mobile number verified successfully!");
      qc.invalidateQueries({ queryKey: ["my-mobile-verif", profile?.id] });
      refreshProfile();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const requestTimeMutation = useMutation({
    mutationFn: async () => {
      if (preferStart >= preferEnd) throw new Error("End time must be after start time");
      const { error } = await supabase.from("mobile_verify_time_slots").upsert({
        profile_id: profile!.id,
        start_time: preferStart,
        end_time: preferEnd,
        status: "active",
      }, { onConflict: "profile_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verification time preference saved!");
      qc.invalidateQueries({ queryKey: ["my-mobile-time-slot", profile?.id] });
      setTimeDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isVerified = verif?.status === "verified";
  const otpSent = verif?.status === "otp_sent";

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"20px 16px", maxWidth:520, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <Button variant="ghost" size="icon" onClick={() => navigate(`${base}/profile`)} style={{ border:`1px solid ${T.border}`, borderRadius:8 }}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 style={{ fontWeight:800, fontSize:20, color:T.text, margin:0 }}>Mobile Verification</h1>
          <p style={{ fontSize:12, color:T.sub, margin:0 }}>Verify your mobile number with OTP</p>
        </div>
      </div>

      {/* Status Card */}
      {isVerified && (
        <div style={{ background:"rgba(74,222,128,.08)", border:"1.5px solid rgba(74,222,128,.25)", borderRadius:14, padding:"16px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
          <CheckCircle2 size={22} color="#4ade80" />
          <div>
            <div style={{ fontWeight:800, fontSize:14, color:"#4ade80" }}>Mobile Verified</div>
            <div style={{ fontSize:12, color:T.sub }}>Your mobile number {verif?.mobile_number} is verified</div>
          </div>
        </div>
      )}

      {/* Verification Form */}
      {!isVerified && (
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ background:`${A1}15`, borderRadius:10, padding:8 }}>
              <Smartphone size={18} color={A1} />
            </div>
            <h2 style={{ fontWeight:700, fontSize:15, color:T.text, margin:0 }}>Verify Your Mobile Number</h2>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:6 }}>Mobile Number</label>
            <input
              type="tel"
              maxLength={10}
              value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g,""))}
              placeholder="Enter 10-digit mobile number"
              disabled={step === "otp" || otpSent}
              style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"10px 14px", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"monospace", opacity:(step==="otp"||otpSent)?0.7:1 }}
            />
          </div>

          {(step === "otp" || otpSent) && (
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:6 }}>
                Enter OTP {otpSent ? "(OTP sent by admin)" : ""}
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,""))}
                placeholder="6-digit OTP"
                style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"10px 14px", fontSize:18, fontWeight:700, fontFamily:"monospace", outline:"none", boxSizing:"border-box", letterSpacing:4, textAlign:"center" }}
              />
              {verif?.otp_sent_at && (
                <p style={{ fontSize:11, color:T.sub, marginTop:4 }}>OTP sent at: {fmt(verif.otp_sent_at)}</p>
              )}
            </div>
          )}

          {/* Notice */}
          {!otpSent && step === "enter" && (
            <div style={{ background:`${A1}08`, border:`1px solid ${A1}20`, borderRadius:8, padding:"10px 12px", marginBottom:14, display:"flex", gap:8 }}>
              <AlertCircle size={14} color={A1} style={{ flexShrink:0, marginTop:2 }} />
              <p style={{ fontSize:12, color:T.sub, margin:0 }}>After submission, the admin will send you an OTP. Enter it here to complete verification.</p>
            </div>
          )}

          <div style={{ display:"flex", gap:8 }}>
            {step === "enter" && !otpSent && (
              <button
                onClick={() => requestMutation.mutate()}
                disabled={requestMutation.isPending}
                style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", background:A1, border:"none", borderRadius:10, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer" }}
              >
                {requestMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Request OTP
              </button>
            )}
            {(step === "otp" || otpSent) && (
              <>
                <button
                  onClick={() => { setStep("enter"); setOtp(""); }}
                  style={{ padding:"11px 14px", background:T.input, border:`1px solid ${T.border}`, borderRadius:10, color:T.sub, fontWeight:600, fontSize:13, cursor:"pointer" }}
                >
                  Back
                </button>
                <button
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending || otp.length !== 6}
                  style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", background:"#22c55e", border:"none", borderRadius:10, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", opacity:otp.length!==6?0.6:1 }}
                >
                  {verifyMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Verify OTP
                </button>
              </>
            )}
          </div>

          {/* Show OTP button if verification requested */}
          {verif && verif.status === "pending" && step === "enter" && (
            <button onClick={() => setStep("otp")}
              style={{ width:"100%", marginTop:10, padding:"9px", background:"transparent", border:`1px dashed ${T.border}`, borderRadius:8, color:T.sub, fontSize:13, cursor:"pointer" }}>
              Already have OTP? Enter here
            </button>
          )}
        </div>
      )}

      {/* Verify Enable Time */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ background:"rgba(139,92,246,.15)", borderRadius:10, padding:8 }}>
              <Clock size={18} color="#8b5cf6" />
            </div>
            <div>
              <h2 style={{ fontWeight:700, fontSize:15, color:T.text, margin:0 }}>Verify Enable Time</h2>
              <p style={{ fontSize:12, color:T.sub, margin:0 }}>Time window for mobile verification</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (timeSlot) { setPreferStart(timeSlot.start_time); setPreferEnd(timeSlot.end_time); }
              setTimeDialogOpen(true);
            }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:`${A1}15`, border:`1px solid ${A1}40`, borderRadius:8, color:A1, fontSize:12, fontWeight:700, cursor:"pointer" }}
          >
            <Clock size={12} /> Set up Time
          </button>
        </div>

        {timeSlot ? (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
              {[
                { label:"Start Time", value:timeSlot.start_time, color:"#6366f1" },
                { label:"End Time",   value:timeSlot.end_time,   color:"#8b5cf6" },
                { label:"Status",     value:timeSlot.status,     color:timeSlot.status==="active"?"#4ade80":"#f87171" },
              ].map(item => (
                <div key={item.label} style={{ background:`${item.color}08`, border:`1px solid ${item.color}20`, borderRadius:10, padding:"10px 12px", textAlign:"center" }}>
                  <div style={{ fontWeight:800, fontSize:15, color:item.color, fontFamily:"monospace" }}>{item.value}</div>
                  <div style={{ fontSize:10, color:T.sub, marginTop:2, textTransform:"uppercase", fontWeight:700 }}>{item.label}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize:11, color:T.sub }}>This is the time window set for your mobile verification. Contact support to change it.</p>
          </div>
        ) : (
          <div style={{ padding:"20px", textAlign:"center", color:T.sub }}>
            <Shield size={32} style={{ margin:"0 auto 8px", opacity:0.3 }} />
            <p style={{ fontSize:13, margin:0 }}>No verification time slot assigned yet.</p>
            <p style={{ fontSize:11, margin:"4px 0 0" }}>Click "Set up Time" to request your preferred time window.</p>
          </div>
        )}
      </div>

      {/* Setup Time Dialog */}
      {timeDialogOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:theme==="black"?"#0f0f23":"#fff", border:`1px solid ${T.border}`, borderRadius:16, padding:28, maxWidth:380, width:"100%" }}>
            <h2 style={{ fontWeight:800, fontSize:17, color:T.text, marginBottom:6 }}>Setup Verify Enable Time</h2>
            <p style={{ fontSize:12, color:T.sub, marginBottom:20 }}>Select your preferred time window for mobile number verification.</p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
              <div>
                <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>Start Time</label>
                <input type="time" value={preferStart} onChange={e=>setPreferStart(e.target.value)}
                  style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>End Time</label>
                <input type="time" value={preferEnd} onChange={e=>setPreferEnd(e.target.value)}
                  style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
              </div>
            </div>

            <div style={{ background:`${A1}08`, border:`1px solid ${A1}20`, borderRadius:8, padding:"10px 12px", marginBottom:18 }}>
              <p style={{ fontSize:12, color:T.sub, margin:0 }}>
                <AlertCircle size={12} style={{ display:"inline", marginRight:4, verticalAlign:"middle" }} />
                Admin will review and confirm your time preference.
              </p>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setTimeDialogOpen(false)}
                style={{ flex:1, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px", cursor:"pointer", color:T.text, fontWeight:600 }}>
                Cancel
              </button>
              <button onClick={() => requestTimeMutation.mutate()} disabled={requestTimeMutation.isPending}
                style={{ flex:2, background:A1, border:"none", borderRadius:8, padding:"10px", cursor:"pointer", color:"#fff", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {requestTimeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                Save Time Preference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMobileVerification;
