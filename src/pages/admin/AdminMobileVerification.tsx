// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Smartphone, Clock, Search, RefreshCw, Send, CheckCircle2, XCircle, Loader2, ChevronRight, AlertCircle } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const A1 = "#6366f1";

const MIGRATION_SQL = `CREATE TABLE IF NOT EXISTS mobile_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  mobile_number text NOT NULL,
  otp text,
  otp_sent_at timestamptz,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);

CREATE TABLE IF NOT EXISTS mobile_verify_time_slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  start_time text NOT NULL,
  end_time text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);`;

const fmt = (d: string) => d ? new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

function genOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

const AdminMobileVerification = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [dbMissing, setDbMissing] = useState(false);
  const [sqlOpen, setSqlOpen] = useState(false);

  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-mobile-verifications", statusFilter],
    queryFn: async () => {
      const q = supabase
        .from("mobile_verifications")
        .select("*, profiles(full_name, user_code, user_type, mobile_number)")
        .order("updated_at", { ascending: false });
      if (statusFilter !== "all") q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("relation")) {
          setDbMissing(true); return [];
        }
        throw error;
      }
      setDbMissing(false);
      return data || [];
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (record: any) => {
      const otp = genOTP();
      const { error } = await supabase
        .from("mobile_verifications")
        .update({ otp, otp_sent_at: new Date().toISOString(), status: "otp_sent", updated_at: new Date().toISOString() })
        .eq("id", record.id);
      if (error) throw error;
      return otp;
    },
    onSuccess: (otp, record) => {
      toast.success(`OTP ${otp} sent to ${record.mobile_number}`);
      qc.invalidateQueries({ queryKey: ["admin-mobile-verifications"] });
      setSendingId(null);
    },
    onError: (e: any) => { toast.error(e.message); setSendingId(null); },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ record, enteredOtp }: { record: any; enteredOtp: string }) => {
      if (record.otp !== enteredOtp) throw new Error("OTP does not match");
      const { error } = await supabase
        .from("mobile_verifications")
        .update({ status: "verified", updated_at: new Date().toISOString() })
        .eq("id", record.id);
      if (error) throw error;
      await supabase.from("profiles").update({ mobile_number: record.mobile_number } as any).eq("id", record.profile_id);
    },
    onSuccess: () => {
      toast.success("Mobile number verified!");
      qc.invalidateQueries({ queryKey: ["admin-mobile-verifications"] });
      setVerifyingId(null);
    },
    onError: (e: any) => { toast.error(e.message); setVerifyingId(null); },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mobile_verifications")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Verification rejected"); qc.invalidateQueries({ queryKey: ["admin-mobile-verifications"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = records.filter((r: any) => {
    if (!search) return true;
    const name = (r.profiles?.full_name || []).join(" ").toLowerCase();
    const code = (r.profiles?.user_code || []).join("").toLowerCase();
    const mobile = (r.mobile_number || "").toLowerCase();
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase()) || mobile.includes(search.toLowerCase());
  });

  const statusStyle = (s: string) => {
    const map: any = {
      pending:   { bg:"rgba(251,191,36,.12)",  color:"#fbbf24" },
      otp_sent:  { bg:"rgba(99,102,241,.12)",  color:"#a5b4fc" },
      verified:  { bg:"rgba(74,222,128,.12)",  color:"#4ade80" },
      rejected:  { bg:"rgba(248,113,113,.12)", color:"#f87171" },
    };
    return map[s] || { bg:"rgba(148,163,184,.12)", color:"#94a3b8" };
  };

  return (
    <div style={{ padding:"20px 16px", maxWidth:980, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ background:`${A1}15`, borderRadius:12, padding:10 }}>
            <Smartphone size={22} color={A1} />
          </div>
          <div>
            <h1 style={{ fontWeight:800, fontSize:20, color:T.text, margin:0 }}>Mobile Number Verification</h1>
            <p style={{ color:T.sub, fontSize:12, marginTop:2 }}>Review & approve user mobile OTP verifications</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button
            onClick={() => navigate("/admin/mobile-verify-setup-time")}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:`${A1}15`, border:`1px solid ${A1}40`, borderRadius:10, color:A1, fontSize:13, fontWeight:700, cursor:"pointer" }}
          >
            <Clock size={14} /> Verify Setup Time <ChevronRight size={13} />
          </button>
          <button
            onClick={() => refetch()}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:T.card, border:`1px solid ${T.border}`, borderRadius:10, color:T.sub, fontSize:13, fontWeight:600, cursor:"pointer" }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* DB Missing Banner */}
      {dbMissing && (
        <div style={{ background:"rgba(217,119,6,.05)", border:"1.5px dashed rgba(217,119,6,.4)", borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <AlertCircle size={18} color="#d97706" style={{ marginTop:2, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:800, color:"#d97706", margin:0, fontSize:14 }}>Database tables not found</p>
              <p style={{ color:"#92400e", fontSize:12, margin:"4px 0 8px" }}>Run the following SQL in Supabase → SQL Editor, then click Refresh.</p>
              <button onClick={() => setSqlOpen(s=>!s)} style={{ fontSize:12, color:"#d97706", background:"none", border:"1px solid rgba(217,119,6,.4)", borderRadius:6, padding:"4px 10px", cursor:"pointer" }}>
                {sqlOpen ? "Hide SQL" : "Show SQL"}
              </button>
              {sqlOpen && (
                <pre style={{ marginTop:10, background:"rgba(0,0,0,.1)", borderRadius:8, padding:"12px 14px", fontSize:11, color:"#92400e", overflowX:"auto", whiteSpace:"pre-wrap" }}>
                  {MIGRATION_SQL}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
          {["all","pending","otp_sent","verified","rejected"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding:"7px 14px", border:"none", cursor:"pointer", background:statusFilter===s ? A1 : "transparent", color:statusFilter===s ? "#fff" : T.sub, fontWeight:statusFilter===s ? 700 : 500, fontSize:12, textTransform:"capitalize" }}>
              {s === "otp_sent" ? "OTP Sent" : s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 12px", flex:1, minWidth:180 }}>
          <Search size={13} color={T.sub} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, code or mobile…"
            style={{ background:"none", border:"none", outline:"none", color:T.text, fontSize:13, flex:1 }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                {["User","User Type","Mobile Number","Send OTP","OTP","Status","Updated","Actions"].map(h => (
                  <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:T.sub, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} style={{ padding:40, textAlign:"center" }}>
                  <Loader2 size={24} className="animate-spin" style={{ color:A1, margin:"0 auto" }} />
                </td></tr>
              )}
              {!isLoading && filtered.length === 0 && !dbMissing && (
                <tr><td colSpan={8} style={{ padding:40, textAlign:"center", color:T.sub, fontSize:13 }}>No records found</td></tr>
              )}
              {filtered.map((r: any) => {
                const name = (r.profiles?.full_name || []).join(" ") || "Unknown";
                const code = (r.profiles?.user_code || []).join("") || "—";
                const st = statusStyle(r.status);
                const isSending = sendingId === r.id;
                const isVerifying = verifyingId === r.id;
                return (
                  <tr key={r.id} style={{ borderBottom:`1px solid ${T.border}20` }}>
                    {/* User */}
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{name}</div>
                      <div style={{ fontSize:11, color:T.sub }}>{code}</div>
                    </td>
                    {/* UserType */}
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ fontSize:12, color:T.sub, textTransform:"capitalize" }}>{r.profiles?.user_type || "—"}</span>
                    </td>
                    {/* Mobile Number */}
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ fontSize:13, fontFamily:"monospace", color:T.text, fontWeight:600 }}>{r.mobile_number || "—"}</span>
                    </td>
                    {/* Send OTP */}
                    <td style={{ padding:"12px 14px" }}>
                      {r.status !== "verified" && (
                        <button
                          disabled={isSending}
                          onClick={() => { setSendingId(r.id); sendOtpMutation.mutate(r); }}
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", background:`${A1}15`, border:`1px solid ${A1}40`, borderRadius:7, color:A1, fontSize:12, fontWeight:700, cursor:"pointer", opacity:isSending?0.6:1 }}
                        >
                          {isSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          {r.status === "otp_sent" ? "Resend OTP" : "Send OTP"}
                        </button>
                      )}
                    </td>
                    {/* OTP */}
                    <td style={{ padding:"12px 14px" }}>
                      {r.status === "otp_sent" || r.status === "pending" ? (
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <input
                            placeholder="Enter OTP"
                            value={otpInputs[r.id] || ""}
                            maxLength={6}
                            onChange={e => setOtpInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                            style={{ width:80, background:T.input, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 8px", color:T.text, fontSize:13, fontFamily:"monospace", outline:"none" }}
                          />
                        </div>
                      ) : r.status === "verified" ? (
                        <span style={{ fontSize:12, color:"#4ade80" }}>✓ Verified</span>
                      ) : (
                        <span style={{ fontSize:12, color:T.sub }}>—</span>
                      )}
                    </td>
                    {/* Status */}
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ ...st, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700 }}>{r.status?.replace("_"," ") || "—"}</span>
                    </td>
                    {/* Updated */}
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ fontSize:11, color:T.sub, whiteSpace:"nowrap" }}>{fmt(r.updated_at)}</span>
                    </td>
                    {/* Actions */}
                    <td style={{ padding:"12px 14px" }}>
                      {r.status !== "verified" && r.status !== "rejected" && (
                        <div style={{ display:"flex", gap:6 }}>
                          <button
                            disabled={isVerifying || !otpInputs[r.id]}
                            onClick={() => { setVerifyingId(r.id); verifyOtpMutation.mutate({ record: r, enteredOtp: otpInputs[r.id] }); }}
                            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", background:"rgba(74,222,128,.12)", border:"1px solid rgba(74,222,128,.3)", borderRadius:7, color:"#4ade80", fontSize:12, fontWeight:700, cursor:"pointer", opacity:!otpInputs[r.id]?0.5:1 }}
                          >
                            {isVerifying ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Verify
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(r.id)}
                            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", background:"rgba(248,113,113,.12)", border:"1px solid rgba(248,113,113,.3)", borderRadius:7, color:"#f87171", fontSize:12, fontWeight:700, cursor:"pointer" }}
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      )}
                      {r.status === "verified" && <span style={{ fontSize:12, color:"#4ade80", fontWeight:700 }}>✓ Done</span>}
                      {r.status === "rejected" && <span style={{ fontSize:12, color:"#f87171", fontWeight:700 }}>✗ Rejected</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminMobileVerification;
