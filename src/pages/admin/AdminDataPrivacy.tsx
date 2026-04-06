import { useState } from "react";
import { Eye, EyeOff, Shield, Download, Trash2, Clock, FileText, AlertTriangle, CheckCircle2, ToggleLeft, ToggleRight, Lock, Database, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface MaskRule { id: string; field: string; table: string; maskType: "partial" | "full" | "none"; example: string; enabled: boolean; }
interface RetentionPolicy { id: string; dataType: string; retentionDays: number; autoDelete: boolean; lastReview: string; }
interface AccessLog { id: string; admin: string; table: string; field: string; action: string; timestamp: string; }
interface ExportRequest { id: string; admin: string; description: string; tables: string[]; status: "pending" | "approved" | "rejected"; requestedAt: string; resolvedAt?: string; }

const defaultMaskRules: MaskRule[] = [
  { id: "m1", field: "mobile_number",          table: "profiles",                 maskType: "partial", example: "+91 98••••1234",  enabled: true },
  { id: "m2", field: "email",                  table: "profiles",                 maskType: "partial", example: "use•••@gmail.com", enabled: true },
  { id: "m3", field: "bank_account_number",    table: "profiles",                 maskType: "partial", example: "••••••••3456",     enabled: true },
  { id: "m4", field: "aadhaar_number",         table: "aadhaar_verifications",    maskType: "partial", example: "••••-••••-3456",   enabled: true },
  { id: "m5", field: "upi_id",                 table: "profiles",                 maskType: "partial", example: "us•••@paytm",     enabled: true },
  { id: "m6", field: "emergency_contact_phone",table: "profiles",                 maskType: "full",    example: "••••••••••",      enabled: false },
  { id: "m7", field: "withdrawal_password",    table: "wallet_transactions",      maskType: "full",    example: "[REDACTED]",      enabled: true },
];

const defaultRetention: RetentionPolicy[] = [
  { id: "r1", dataType: "Audit Logs",         retentionDays: 365, autoDelete: false, lastReview: new Date(Date.now() - 864e5 * 30).toISOString() },
  { id: "r2", dataType: "Session Logs",       retentionDays: 90,  autoDelete: true,  lastReview: new Date(Date.now() - 864e5 * 14).toISOString() },
  { id: "r3", dataType: "Login History",      retentionDays: 180, autoDelete: false, lastReview: new Date(Date.now() - 864e5 * 7).toISOString() },
  { id: "r4", dataType: "Chat Messages",      retentionDays: 730, autoDelete: false, lastReview: new Date(Date.now() - 864e5 * 2).toISOString() },
  { id: "r5", dataType: "Deleted User Data",  retentionDays: 30,  autoDelete: true,  lastReview: new Date().toISOString() },
  { id: "r6", dataType: "Payment Logs",       retentionDays: 1825,autoDelete: false, lastReview: new Date(Date.now() - 864e5 * 60).toISOString() },
];

const defaultAccessLog: AccessLog[] = [
  { id: "l1", admin: "Admin A", table: "profiles",             field: "bank_account_number", action: "View",   timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: "l2", admin: "Admin B", table: "aadhaar_verifications",field: "aadhaar_number",      action: "Export", timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: "l3", admin: "Admin A", table: "profiles",             field: "mobile_number",       action: "View",   timestamp: new Date(Date.now() - 10800000).toISOString() },
];

const defaultExports: ExportRequest[] = [
  { id: "e1", admin: "Admin C", description: "Compliance audit - full user export", tables: ["profiles", "aadhaar_verifications"], status: "pending", requestedAt: new Date(Date.now() - 1800000).toISOString() },
  { id: "e2", admin: "Admin B", description: "Wallet reconciliation report", tables: ["wallet_transactions"], status: "approved", requestedAt: new Date(Date.now() - 86400000).toISOString(), resolvedAt: new Date(Date.now() - 82800000).toISOString() },
];

const MASKING_KEY = "admin_dp_masking_v1";
const RETENTION_KEY = "admin_dp_retention_v1";
const EXPORT_KEY = "admin_dp_exports_v1";

function load<T>(key: string, def: T[]): T[] {
  try { const d = localStorage.getItem(key); if (d) return JSON.parse(d); } catch { /* */ }
  localStorage.setItem(key, JSON.stringify(def)); return def;
}

export default function AdminDataPrivacy() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab] = useState<"masking" | "retention" | "access" | "exports">("masking");
  const [maskRules, setMaskRules] = useState<MaskRule[]>([]);
  const [retention, setRetention] = useState<RetentionPolicy[]>([]);
  const [accessLog] = useState<AccessLog[]>([]);
  const [exports, setExports] = useState<ExportRequest[]>([]);
  const [editRetId, setEditRetId] = useState<string | null>(null);
  const [editDays, setEditDays] = useState(365);

  const save = <T,>(key: string, data: T[], setter: (d: T[]) => void) => { localStorage.setItem(key, JSON.stringify(data)); setter(data); };

  const toggleMask = (id: string) => {
    const updated = maskRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    save(MASKING_KEY, updated, setMaskRules);
    const rule = maskRules.find(r => r.id === id)!;
    logAction("Data Masking Updated", `${rule.field} on ${rule.table}: ${rule.enabled ? "disabled" : "enabled"}`, "Security", "warning");
    toast({ title: `Masking ${rule.enabled ? "disabled" : "enabled"} for ${rule.field}` });
  };

  const updateRetention = (id: string, days: number) => {
    const updated = retention.map(r => r.id === id ? { ...r, retentionDays: days, lastReview: new Date().toISOString() } : r);
    save(RETENTION_KEY, updated, setRetention);
    logAction("Retention Policy Updated", `${retention.find(r=>r.id===id)?.dataType} → ${days} days`, "Security", "warning");
    toast({ title: "Retention policy updated" });
    setEditRetId(null);
  };

  const resolveExport = (id: string, status: "approved" | "rejected") => {
    const updated = exports.map(e => e.id === id ? { ...e, status, resolvedAt: new Date().toISOString() } : e);
    save(EXPORT_KEY, updated, setExports);
    logAction(`Export Request ${status}`, exports.find(e=>e.id===id)?.description || "", "Security", status === "approved" ? "success" : "warning");
    toast({ title: `Export request ${status}` });
  };

  const maskTypeColor = { partial: "#fbbf24", full: "#f87171", none: "#4ade80" };
  const inp = (s?: object) => ({ background: T.input, border: `1px solid ${T.border}`, color: T.text, borderRadius: 10, ...s });

  const tabs = [
    { key: "masking",   label: "Data Masking",       icon: EyeOff },
    { key: "retention", label: "Retention Policy",   icon: Clock },
    { key: "access",    label: "Access Logs",         icon: Eye },
    { key: "exports",   label: "Export Approvals",   icon: Download, badge: exports.filter(e => e.status === "pending").length },
  ] as const;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${A1}22,${A2}15)`, border: `1px solid rgba(99,102,241,.2)`, borderRadius: 18, padding: "26px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${A1}55`, flexShrink: 0 }}>
            <Shield size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Data Privacy & Compliance</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: "3px 0 0" }}>Field masking · Retention policies · Access logging · Export approval controls</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {[{ l: "Masked Fields", v: maskRules.filter(r=>r.enabled).length, c: "#fbbf24" }, { l: "Retention Policies", v: retention.length, c: "#4ade80" }, { l: "Access Logs", v: accessLog.length, c: T.badgeFg }, { l: "Pending Exports", v: exports.filter(e=>e.status==="pending").length, c: "#f87171" }].map(s => (
            <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: s.c }}>{s.v}</span>
              <span style={{ fontSize: 11, color: T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: `1px solid ${tab === t.key ? A1 : T.border}`, background: tab === t.key ? `${A1}18` : T.card, color: tab === t.key ? T.badgeFg : T.sub, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            <t.icon size={13} /> {t.label} {"badge" in t && (t as { badge: number }).badge != null && (t as { badge: number }).badge > 0 && <span style={{ background: "#f87171", color: "#fff", borderRadius: 8, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>{(t as { badge: number }).badge}</span>}
          </button>
        ))}
      </div>

      {/* Data Masking */}
      {tab === "masking" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 4, display: "flex", gap: 8 }}>
            <Lock size={13} color={A1} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: T.sub, margin: 0, lineHeight: 1.6 }}>Masking rules control how sensitive fields are displayed in the admin panel. Enabling masking shows a partial or fully obscured value to admins. Actual values remain in the database unchanged.</p>
          </div>
          {maskRules.map(rule => (
            <div key={rule.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 13, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, opacity: rule.enabled ? 1 : .65 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: T.text }}>{rule.field}</span>
                  <span style={{ fontSize: 10, color: T.sub, background: T.input, padding: "2px 7px", borderRadius: 5 }}>{rule.table}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: maskTypeColor[rule.maskType], background: `${maskTypeColor[rule.maskType]}15`, padding: "2px 7px", borderRadius: 5, textTransform: "uppercase" }}>{rule.maskType} mask</span>
                </div>
                <p style={{ fontSize: 12, color: T.sub, margin: 0, fontFamily: "monospace" }}>Display: {rule.example}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: rule.enabled ? "#4ade80" : T.sub }}>{rule.enabled ? "ON" : "OFF"}</span>
                <button onClick={() => toggleMask(rule.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {rule.enabled ? <ToggleRight size={26} color="#4ade80" /> : <ToggleLeft size={26} color="#94a3b8" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Retention Policy */}
      {tab === "retention" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {retention.map(pol => (
            <div key={pol.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 13, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{pol.dataType}</span>
                    {pol.autoDelete && <span style={{ fontSize: 10, fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,.1)", padding: "2px 7px", borderRadius: 5 }}>AUTO-DELETE</span>}
                  </div>
                  <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>Retained for <strong style={{ color: T.text }}>{pol.retentionDays} days</strong> · Last reviewed {safeFmt(pol.lastReview, "MMM d, yyyy")}</p>
                </div>
                {editRetId === pol.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Input type="number" value={editDays} onChange={e => setEditDays(Number(e.target.value))} style={{ ...inp(), width: 80, padding: "6px 10px", fontSize: 13, textAlign: "center" }} />
                    <span style={{ fontSize: 12, color: T.sub }}>days</span>
                    <button onClick={() => updateRetention(pol.id, editDays)} style={{ padding: "6px 12px", borderRadius: 8, background: `${A1}20`, border: `1px solid ${A1}33`, color: T.badgeFg, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditRetId(null)} style={{ padding: "6px 10px", borderRadius: 8, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, cursor: "pointer" }}>×</button>
                  </div>
                ) : (
                  <button onClick={() => { setEditRetId(pol.id); setEditDays(pol.retentionDays); }} style={{ padding: "6px 14px", borderRadius: 9, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Access Logs */}
      {tab === "access" && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Eye size={14} color={A1} />
            <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Sensitive Data Access Log</span>
            <span style={{ fontSize: 11, color: T.sub, marginLeft: "auto" }}>{accessLog.length} events recorded</span>
          </div>
          {accessLog.map((log, i) => (
            <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < accessLog.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: log.action === "Export" ? "#f87171" : "#fbbf24", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{log.admin}</span>
                <span style={{ fontSize: 12, color: T.sub }}> accessed </span>
                <span style={{ fontSize: 12, fontFamily: "monospace", color: T.badgeFg }}>{log.field}</span>
                <span style={{ fontSize: 12, color: T.sub }}> on {log.table}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: log.action === "Export" ? "#f87171" : "#fbbf24", background: log.action === "Export" ? "rgba(248,113,113,.1)" : "rgba(251,191,36,.1)", padding: "1px 7px", borderRadius: 5, marginLeft: 7 }}>{log.action}</span>
              </div>
              <span style={{ fontSize: 11, color: T.sub, flexShrink: 0 }}>{safeFmt(log.timestamp, "MMM d, HH:mm")}</span>
            </div>
          ))}
        </div>
      )}

      {/* Export Approvals */}
      {tab === "exports" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {exports.map(exp => (
            <div key={exp.id} style={{ background: T.card, border: `1px solid ${exp.status === "pending" ? "rgba(251,191,36,.25)" : T.border}`, borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{exp.description}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: exp.status === "pending" ? "#fbbf24" : exp.status === "approved" ? "#4ade80" : "#f87171", background: exp.status === "pending" ? "rgba(251,191,36,.1)" : exp.status === "approved" ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)", padding: "2px 8px", borderRadius: 5, textTransform: "capitalize" }}>{exp.status}</span>
                  </div>
                  <p style={{ fontSize: 12, color: T.sub, margin: "0 0 4px" }}>Requested by <strong style={{ color: T.text }}>{exp.admin}</strong> · {safeFmt(exp.requestedAt, "MMM d, HH:mm")}</p>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {exp.tables.map(t => <span key={t} style={{ fontSize: 10, color: T.badgeFg, background: T.badge, padding: "2px 8px", borderRadius: 5, fontFamily: "monospace" }}>{t}</span>)}
                  </div>
                </div>
              </div>
              {exp.status === "pending" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => resolveExport(exp.id, "approved")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 9, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.25)", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <CheckCircle2 size={13} /> Approve Export
                  </button>
                  <button onClick={() => resolveExport(exp.id, "rejected")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function XCircle({ size, color }: { size: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
}
