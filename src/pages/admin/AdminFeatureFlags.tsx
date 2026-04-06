import { useState } from "react";
import { toast } from "sonner";
import { FlaskConical, Plus, Trash2, Edit2, X, Save, Users, BarChart3 } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};
const A1 = "#6366f1";
const FF_KEY = "admin_feature_flags_v1";

type FeatureFlag = { id: string; key: string; name: string; description: string; enabled: boolean; rolloutPercent: number; target: "all" | "freelancer" | "employer" | "admin"; createdAt: string; updatedAt: string };

function defaultFlags(): FeatureFlag[] {
  return [
    { id: "ff1", key: "new_dashboard_ui", name: "New Dashboard UI", description: "Revamped dashboard with charts and analytics", enabled: true, rolloutPercent: 100, target: "all", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "ff2", key: "ai_job_matching", name: "AI Job Matching", description: "ML-based job recommendations for freelancers", enabled: false, rolloutPercent: 0, target: "freelancer", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "ff3", key: "instant_payout", name: "Instant Payout", description: "Same-day withdrawal processing via UPI", enabled: true, rolloutPercent: 20, target: "freelancer", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "ff4", key: "employer_analytics_v2", name: "Employer Analytics v2", description: "Advanced hiring analytics with conversion funnels", enabled: false, rolloutPercent: 5, target: "employer", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "ff5", key: "video_portfolio", name: "Video Portfolio", description: "Allow freelancers to upload portfolio videos", enabled: true, rolloutPercent: 50, target: "freelancer", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "ff6", key: "gig_marketplace", name: "Gig Marketplace", description: "Fixed-price gig listings (like Fiverr model)", enabled: false, rolloutPercent: 0, target: "all", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
}
function loadFlags(): FeatureFlag[] { try { const d = localStorage.getItem(FF_KEY); if (d) return JSON.parse(d); } catch { } const s = defaultFlags(); localStorage.setItem(FF_KEY, JSON.stringify(s)); return s; }
function saveFlags(f: FeatureFlag[]) { localStorage.setItem(FF_KEY, JSON.stringify(f)); }

const blank = (): Omit<FeatureFlag, "id" | "createdAt" | "updatedAt"> => ({ key: "", name: "", description: "", enabled: false, rolloutPercent: 0, target: "all" });

const AdminFeatureFlags = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [flags, setFlags] = useState<FeatureFlag[]>(loadFlags);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ReturnType<typeof blank>>(blank());
  const f = (k: any, v: any) => setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.key.trim() || !form.name.trim()) return toast.error("Key and name required");
    if (!/^[a-z0-9_]+$/.test(form.key)) return toast.error("Key must be lowercase letters, numbers, underscores only");
    const now = new Date().toISOString();
    if (editId) {
      const up = flags.map(fl => fl.id === editId ? { ...fl, ...form, updatedAt: now } : fl);
      setFlags(up); saveFlags(up); toast.success("Feature flag updated");
    } else {
      if (flags.some(fl => fl.key === form.key)) return toast.error("Key already exists");
      const nf: FeatureFlag = { ...form, id: `ff${Date.now()}`, createdAt: now, updatedAt: now };
      const up = [...flags, nf]; setFlags(up); saveFlags(up); toast.success("Feature flag created");
    }
    setShowForm(false); setEditId(null);
  };

  const openEdit = (fl: FeatureFlag) => { setForm({ key: fl.key, name: fl.name, description: fl.description, enabled: fl.enabled, rolloutPercent: fl.rolloutPercent, target: fl.target }); setEditId(fl.id); setShowForm(true); };
  const del = (id: string) => { const up = flags.filter(fl => fl.id !== id); setFlags(up); saveFlags(up); };
  const toggleEnabled = (id: string) => {
    const up = flags.map(fl => fl.id === id ? { ...fl, enabled: !fl.enabled, updatedAt: new Date().toISOString() } : fl);
    setFlags(up); saveFlags(up); toast.success("Flag toggled");
  };
  const updateRollout = (id: string, pct: number) => {
    const up = flags.map(fl => fl.id === id ? { ...fl, rolloutPercent: pct, updatedAt: new Date().toISOString() } : fl);
    setFlags(up); saveFlags(up);
  };

  const TARGET_COLORS: Record<string, string> = { all: "#6366f1", freelancer: "#10b981", employer: "#f59e0b", admin: "#8b5cf6" };
  const bs = (c: string, bg: string) => ({ background: bg, color: c, border: `1px solid ${c}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 as any });

  const enabledCount = flags.filter(fl => fl.enabled).length;
  const fullRollout = flags.filter(fl => fl.enabled && fl.rolloutPercent === 100).length;
  const testing = flags.filter(fl => fl.enabled && fl.rolloutPercent > 0 && fl.rolloutPercent < 100).length;

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Feature Flags & A/B Testing</h1>
          <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Enable features for specific user segments or percentage rollouts</p>
        </div>
        <button onClick={() => { setForm(blank()); setEditId(null); setShowForm(true); }} style={{ background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> New Flag
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[{ l: "Total Flags", v: flags.length, c: "#6366f1" }, { l: "Enabled", v: enabledCount, c: "#4ade80" }, { l: "Full Rollout", v: fullRollout, c: "#8b5cf6" }, { l: "In Testing", v: testing, c: "#fbbf24" }].map(s => (
          <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: T.sub }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {flags.map(fl => (
          <div key={fl.id} style={{ background: T.card, border: `1px solid ${fl.enabled ? A1 + "33" : T.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{fl.name}</span>
                  <code style={{ fontSize: 11, background: `${A1}12`, color: A1, padding: "2px 7px", borderRadius: 4 }}>{fl.key}</code>
                  <span style={bs(TARGET_COLORS[fl.target], `${TARGET_COLORS[fl.target]}15`)}>{fl.target}</span>
                  {fl.enabled && fl.rolloutPercent > 0 && fl.rolloutPercent < 100 && <span style={bs("#fbbf24", "rgba(251,191,36,.12)")}>🧪 A/B Testing</span>}
                  {fl.enabled && fl.rolloutPercent === 100 && <span style={bs("#4ade80", "rgba(74,222,128,.12)")}>✓ Full Rollout</span>}
                </div>
                <div style={{ fontSize: 12, color: T.sub }}>{fl.description}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <div onClick={() => toggleEnabled(fl.id)} style={{ width: 42, height: 23, borderRadius: 12, background: fl.enabled ? A1 : "rgba(148,163,184,.3)", position: "relative", cursor: "pointer", transition: "background .2s" }}>
                    <div style={{ position: "absolute", top: 3, left: fl.enabled ? 20 : 3, width: 17, height: 17, borderRadius: 8.5, background: "#fff", transition: "left .2s" }} />
                  </div>
                  <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{fl.enabled ? "ON" : "OFF"}</span>
                </label>
                <button onClick={() => openEdit(fl)} style={{ background: `${A1}15`, border: `1px solid ${A1}33`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: A1 }}><Edit2 size={12} /></button>
                <button onClick={() => del(fl.id)} style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "#f87171" }}><Trash2 size={12} /></button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: T.sub, flexShrink: 0 }}>Rollout:</span>
              <input type="range" min={0} max={100} step={5} value={fl.rolloutPercent} onChange={e => updateRollout(fl.id, Number(e.target.value))} disabled={!fl.enabled} style={{ flex: 1, accentColor: A1, cursor: fl.enabled ? "pointer" : "not-allowed" }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: fl.rolloutPercent === 100 ? "#4ade80" : fl.rolloutPercent > 0 ? "#fbbf24" : T.sub, minWidth: 40 }}>{fl.rolloutPercent}%</span>
              <span style={{ fontSize: 11, color: T.sub }}>Updated: {safeFmt(fl.updatedAt, "dd MMM")}</span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: themeKey === "black" ? "#0f0f23" : "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, maxWidth: 460, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 17, color: T.text, margin: 0 }}>{editId ? "Edit" : "New"} Feature Flag</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={20} /></button>
            </div>
            {[{ l: "Flag Key (lowercase, underscores)", k: "key" }, { l: "Name", k: "name" }, { l: "Description", k: "description" }].map(fi => (
              <div key={fi.k} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>{fi.l}</label>
                <input value={(form as any)[fi.k]} onChange={e => f(fi.k, e.target.value)} readOnly={fi.k === "key" && !!editId} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, boxSizing: "border-box" as any, opacity: fi.k === "key" && editId ? 0.6 : 1 }} />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Target Users</label>
                <select value={form.target} onChange={e => f("target", e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13 }}>
                  <option value="all">All Users</option>
                  <option value="freelancer">Freelancers Only</option>
                  <option value="employer">Employers Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Rollout: {form.rolloutPercent}%</label>
                <input type="range" min={0} max={100} step={5} value={form.rolloutPercent} onChange={e => f("rolloutPercent", Number(e.target.value))} style={{ width: "100%", accentColor: A1, marginTop: 8 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px", cursor: "pointer", color: T.text, fontWeight: 600 }}>Cancel</button>
              <button onClick={submit} style={{ flex: 2, background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", color: "#fff", fontWeight: 700 }}>{editId ? "Save" : "Create Flag"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeatureFlags;
