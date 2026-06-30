// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { toast } from "sonner";
import { Clock, ArrowLeft, Save, CheckCircle2, XCircle, Loader2, Info, AlertTriangle } from "lucide-react";

const TH = {
  black:  { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white:  { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:     { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  warm:   { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", input:"#fffdf7" },
  forest: { bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", input:"#ffffff" },
  ocean:  { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", input:"#ffffff" },
};
const A1 = "#6366f1";

function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2,"0")}:${String(nm).padStart(2,"0")}`;
}

function diffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}

const DURATION_MINUTES = 10;

export default function AddMoneySetupTime() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { theme } = useDashboardTheme();
  const T = (TH as any)[theme] ?? TH.white;
  const qc = useQueryClient();

  const base = location.pathname.startsWith("/freelancer") ? "/freelancer"
    : location.pathname.startsWith("/employee") ? "/freelancer"
    : "/employer";

  const [startTime, setStartTime] = useState("09:00");
  const [status, setStatus] = useState("active");
  const [hasSlot, setHasSlot] = useState(false);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // end time is always start + 10 min
  const endTime = addMinutes(startTime, DURATION_MINUTES);

  const { isLoading } = useQuery({
    queryKey: ["add-money-time-slot-me", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("add_money_time_slots")
        .select("*")
        .eq("profile_id", profile.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        setHasSlot(true);
        setSlotId(data.id);
        setStartTime(data.start_time.slice(0, 5));
        setStatus(data.status);
        setUpdatedAt(data.updated_at ?? data.created_at ?? null);
      }
    },
  });

  // 24-hour activation check
  const now = new Date();
  const nowTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  // epoch (1970) means admin set this slot → no cooldown, no duration rules
  const isAdminSet = !!updatedAt && new Date(updatedAt).getFullYear() < 2000;

  const cooldownActive = (() => {
    if (!updatedAt || isAdminSet) return false;
    return (now.getTime() - new Date(updatedAt).getTime()) < 24 * 60 * 60 * 1000;
  })();

  const activatesAt = updatedAt ? new Date(new Date(updatedAt).getTime() + 24 * 60 * 60 * 1000) : null;

  const inWindow = hasSlot && status === "active" && !cooldownActive
    && nowTime >= startTime && nowTime <= endTime;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!startTime) throw new Error("Start time is required");
      const nowTs = new Date().toISOString();
      if (hasSlot && slotId) {
        const { error } = await supabase.from("add_money_time_slots").update({
          start_time: startTime,
          end_time: endTime,
          status,
          updated_at: nowTs,
        }).eq("id", slotId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("add_money_time_slots").upsert({
          profile_id: profile.id,
          start_time: startTime,
          end_time: endTime,
          status,
          updated_at: nowTs,
        }, { onConflict: "profile_id" }).select().single();
        if (error) throw error;
        if (data) { setSlotId(data.id); setHasSlot(true); }
      }
      setUpdatedAt(nowTs);
    },
    onSuccess: () => {
      toast.success(hasSlot ? "Time slot updated! Activates in 24 hours." : "Time slot saved! Activates in 24 hours.");
      qc.invalidateQueries({ queryKey: ["add-money-time-slot-me"] });
      setHasSlot(true);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text }} className="max-w-md mx-auto p-4 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(`${base}/wallet/add`)}
          style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: T.sub }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ background: `${A1}15`, borderRadius: 12, padding: 10 }}>
          <Clock size={20} color={A1} />
        </div>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 20, color: T.text, margin: 0 }}>Add Money Time Setup</h1>
          <p style={{ color: T.sub, fontSize: 12, marginTop: 2 }}>10-minute window · 24h activation delay</p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 size={28} className="animate-spin" style={{ color: A1 }} />
        </div>
      ) : (
        <>
          {/* Current Status */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Current Status</span>
              {!hasSlot && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99, color: "#dc2626", background: "#fee2e2" }}>
                  Not set up
                </span>
              )}
              {hasSlot && cooldownActive && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99, color: "#d97706", background: "#fef3c7" }}>
                  ⏳ Activating…
                </span>
              )}
              {hasSlot && !cooldownActive && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99, color: inWindow ? "#16a34a" : "#d97706", background: inWindow ? "#dcfce7" : "#fef3c7" }}>
                  {inWindow ? "✓ Within window" : "Outside window"}
                </span>
              )}
            </div>

            {hasSlot && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Start Time", value: startTime, color: A1 },
                  { label: "End Time",   value: endTime,   color: "#8b5cf6" },
                  { label: "Status",     value: status,    color: status === "active" ? "#16a34a" : "#dc2626" },
                ].map(s => (
                  <div key={s.label} style={{ background: T.bg, borderRadius: 10, padding: "10px 12px", textAlign: "center", border: `1px solid ${T.border}` }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {!hasSlot && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "rgba(99,102,241,.06)", borderRadius: 10, border: `1px solid rgba(99,102,241,.15)` }}>
                <Info size={16} color={A1} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: T.sub, margin: 0, lineHeight: 1.5 }}>
                  No time window set yet. Configure your 10-minute slot below.
                </p>
              </div>
            )}
          </div>

          {/* Admin override notice */}
          {hasSlot && isAdminSet && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 16px", background: "rgba(99,102,241,.06)", borderRadius: 14, border: "1px solid rgba(99,102,241,.25)" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>👮</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: A1, margin: 0 }}>Set by Admin</p>
                <p style={{ fontSize: 12, color: T.sub, margin: "4px 0 0", lineHeight: 1.5 }}>
                  Your time window was configured by an admin. It is <strong style={{ color: T.text }}>immediately active</strong> — no 24-hour cooldown applies. If you update it yourself, the usual rules will apply.
                </p>
              </div>
            </div>
          )}

          {/* 24-hour cooldown notice */}
          {hasSlot && !isAdminSet && cooldownActive && activatesAt && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 16px", background: "rgba(217,119,6,.06)", borderRadius: 14, border: "1px solid rgba(217,119,6,.25)" }}>
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#d97706", margin: 0 }}>Activating in 24 hours</p>
                <p style={{ fontSize: 12, color: T.sub, margin: "4px 0 0", lineHeight: 1.5 }}>
                  Your time slot will become active on <strong style={{ color: T.text }}>{formatDateTime(activatesAt.toISOString())}</strong>.
                  You cannot add money until then.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 4 }}>
              {hasSlot ? "Update Time Slot" : "Set Up Time Slot"}
            </p>
            <p style={{ fontSize: 12, color: T.sub, marginBottom: 18 }}>
              Select your start time — end time is automatically set to <strong>+10 minutes</strong>.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {/* Start Time — editable */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Start Time</label>
                <input type="time" value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  style={{ width: "100%", background: T.input, border: `1px solid ${A1}55`, borderRadius: 10, color: T.text, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} />
              </div>
              {/* End Time — auto-calculated, read-only */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  End Time <span style={{ color: A1, fontSize: 9, fontWeight: 900, marginLeft: 4, background: `${A1}15`, borderRadius: 4, padding: "1px 5px" }}>AUTO</span>
                </label>
                <div style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 10, color: T.sub, padding: "10px 12px", fontSize: 14, fontFamily: "monospace", opacity: 0.7, userSelect: "none" }}>
                  {endTime}
                </div>
                <p style={{ fontSize: 10, color: T.sub, margin: "4px 0 0" }}>Start + 10 minutes</p>
              </div>
            </div>

            {/* Duration badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(99,102,241,.06)", borderRadius: 10, border: "1px solid rgba(99,102,241,.15)", marginBottom: 14 }}>
              <Clock size={13} color={A1} />
              <span style={{ fontSize: 12, color: T.sub }}>Duration: </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: A1 }}>10 minutes fixed</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Status</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["active", "inactive"].map(s => (
                  <button key={s} onClick={() => setStatus(s)} type="button"
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
                      border: status === s ? `1.5px solid ${s === "active" ? "#16a34a" : "#dc2626"}` : `1px solid ${T.border}`,
                      background: status === s ? (s === "active" ? "rgba(22,163,74,.1)" : "rgba(220,38,38,.1)") : T.input,
                      color: status === s ? (s === "active" ? "#16a34a" : "#dc2626") : T.sub,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                    {s === "active" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 12, border: "none", cursor: "pointer",
                background: `linear-gradient(135deg, ${A1}, #8b5cf6)`,
                color: "#fff", fontWeight: 800, fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 6px 20px rgba(99,102,241,.3)", opacity: saveMutation.isPending ? 0.7 : 1,
              }}>
              {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saveMutation.isPending ? "Saving…" : hasSlot ? "Update Time Slot" : "Save Time Slot"}
            </button>
          </div>

          {/* Info box */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: T.sub, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Rules</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "⏱", text: "Your time window is exactly 10 minutes long. End time is auto-calculated." },
                { icon: "⏳", text: "After saving or changing your time slot, it activates only after 24 hours." },
                { icon: "🔒", text: "The Add Money Continue button is disabled outside this window or during the 24-hour cooldown." },
                { icon: "❌", text: "Set status to Inactive to temporarily disable all deposits." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, lineHeight: 1.4, flexShrink: 0 }}>{item.icon}</span>
                  <p style={{ fontSize: 12, color: T.sub, margin: 0, lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
