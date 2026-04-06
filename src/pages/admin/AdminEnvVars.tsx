import { useState } from "react";
import { KeyRound, Plus, Edit2, Trash2, Eye, EyeOff, Copy, Download, Upload, ToggleLeft, ToggleRight, Search, History, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";
import { safeFmt } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

const ENV_KEY = "admin_env_vars_v2";

interface EnvVar {
  id: string; name: string; value: string; description: string;
  environment: "all" | "production" | "staging" | "testing";
  isEnabled: boolean; isSensitive: boolean;
  createdAt: string; updatedAt: string;
  history: { timestamp: string; prev: string }[];
}

const PROTECTED = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "DATABASE_URL", "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

function seedVars(): EnvVar[] {
  return [
    { id: "v1", name: "VITE_SUPABASE_URL", value: "https://maysttckdfnnzvfeujaj.supabase.co", description: "Supabase project URL", environment: "all", isEnabled: true, isSensitive: false, createdAt: new Date(Date.now() - 864e5 * 30).toISOString(), updatedAt: new Date().toISOString(), history: [] },
    { id: "v2", name: "VITE_SUPABASE_ANON_KEY", value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.•••••••••••••••••", description: "Supabase public anon key", environment: "all", isEnabled: true, isSensitive: true, createdAt: new Date(Date.now() - 864e5 * 30).toISOString(), updatedAt: new Date().toISOString(), history: [] },
    { id: "v3", name: "ONESIGNAL_APP_ID", value: "•••••••••••••••••", description: "OneSignal push notifications App ID", environment: "production", isEnabled: true, isSensitive: true, createdAt: new Date(Date.now() - 864e5 * 14).toISOString(), updatedAt: new Date().toISOString(), history: [] },
    { id: "v4", name: "PLATFORM_COMMISSION_RATE", value: "10", description: "Platform commission percentage", environment: "all", isEnabled: true, isSensitive: false, createdAt: new Date(Date.now() - 864e5 * 7).toISOString(), updatedAt: new Date().toISOString(), history: [] },
    { id: "v5", name: "MAX_WITHDRAWAL_AMOUNT", value: "50000", description: "Maximum withdrawal per transaction (INR)", environment: "all", isEnabled: true, isSensitive: false, createdAt: new Date(Date.now() - 864e5 * 5).toISOString(), updatedAt: new Date().toISOString(), history: [] },
    { id: "v6", name: "MAINTENANCE_MODE", value: "false", description: "Global maintenance mode flag", environment: "all", isEnabled: true, isSensitive: false, createdAt: new Date(Date.now() - 864e5 * 2).toISOString(), updatedAt: new Date().toISOString(), history: [] },
  ];
}

function loadVars(): EnvVar[] {
  try { const d = localStorage.getItem(ENV_KEY); if (d) return JSON.parse(d); } catch { /* */ }
  return [];
}
function saveVars(vars: EnvVar[]) { localStorage.setItem(ENV_KEY, JSON.stringify(vars)); }

const BLANK: { name: string; value: string; description: string; environment: "all" | "production" | "staging" | "testing"; isEnabled: boolean; isSensitive: boolean } = { name: "", value: "", description: "", environment: "all", isEnabled: true, isSensitive: false };
const envBadge: Record<string, { color: string; bg: string }> = { all: { color: "#a5b4fc", bg: "rgba(99,102,241,.12)" }, production: { color: "#f87171", bg: "rgba(248,113,113,.12)" }, staging: { color: "#fbbf24", bg: "rgba(251,191,36,.12)" }, testing: { color: "#4ade80", bg: "rgba(74,222,128,.12)" } };

export default function AdminEnvVars() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [vars, setVars] = useState<EnvVar[]>([]);
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("all");
  const [editing, setEditing] = useState<EnvVar | null>(null);
  const [form, setForm] = useState<typeof BLANK>(BLANK);
  const [showForm, setShowForm] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<EnvVar | null>(null);

  const persist = (v: EnvVar[]) => { saveVars(v); setVars(v); };

  const filtered = vars.filter(v => {
    const m = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.description.toLowerCase().includes(search.toLowerCase());
    const e = envFilter === "all" || v.environment === envFilter || v.environment === "all";
    return m && e;
  });

  const toggle = (id: string) => {
    const v = vars.find(x => x.id === id)!;
    const updated = vars.map(x => x.id === id ? { ...x, isEnabled: !x.isEnabled, updatedAt: new Date().toISOString() } : x);
    persist(updated);
    logAction("Env Var Toggled", `${v.name} ${v.isEnabled ? "disabled" : "enabled"}`, "System", "success");
    toast({ title: `${v.name} ${v.isEnabled ? "disabled" : "enabled"}` });
  };

  const saveForm = () => {
    if (!form.name.trim()) { toast({ title: "Variable name required", variant: "destructive" }); return; }
    if (!editing && vars.find(v => v.name === form.name.trim())) { toast({ title: "Variable name already exists", variant: "destructive" }); return; }
    if (editing) {
      const prev = editing.value;
      const updated = vars.map(v => v.id === editing.id ? { ...editing, ...form, updatedAt: new Date().toISOString(), history: [{ timestamp: new Date().toISOString(), prev }, ...editing.history].slice(0, 10) } : v);
      persist(updated);
      logAction("Env Var Updated", `Updated ${form.name}`, "System", "warning");
    } else {
      const nv: EnvVar = { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), history: [] };
      persist([...vars, nv]);
      logAction("Env Var Added", `Added ${form.name}`, "System", "success");
    }
    toast({ title: editing ? "Variable updated" : "Variable added" });
    setShowForm(false); setEditing(null); setForm(BLANK);
  };

  const exportVars = () => {
    const safe = vars.filter(v => !v.isSensitive).map(v => ({ name: v.name, value: v.value, environment: v.environment }));
    const blob = new Blob([JSON.stringify(safe, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "env-vars-export.json"; a.click();
    URL.revokeObjectURL(url);
    logAction("Env Vars Exported", `Exported ${safe.length} non-sensitive variables`, "System", "success");
    toast({ title: `${safe.length} non-sensitive variables exported` });
  };

  const inp = (s?: object) => ({ background: T.input, border: `1px solid ${T.border}`, color: T.text, borderRadius: 10, ...s });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${A1}22,${A2}15)`, border: `1px solid rgba(99,102,241,.2)`, borderRadius: 18, padding: "26px 28px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 0, top: 0, width: 160, height: 160, background: `radial-gradient(circle at top right,${A2}12,transparent 70%)` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${A1}55`, flexShrink: 0 }}>
            <KeyRound size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Environment Variables</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: "3px 0 0" }}>Manage configuration keys, API tokens, and platform settings securely</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={exportVars} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Download size={13} /> Export
            </button>
            <button onClick={() => { setEditing(null); setForm(BLANK); setShowForm(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Add Variable
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {[{ l: "Total", v: vars.length, c: T.badgeFg }, { l: "Enabled", v: vars.filter(x => x.isEnabled).length, c: "#4ade80" }, { l: "Sensitive", v: vars.filter(x => x.isSensitive).length, c: "#fbbf24" }, { l: "Protected", v: vars.filter(x => PROTECTED.includes(x.name)).length, c: "#f87171" }].map(s => (
            <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: s.c }}>{s.v}</span>
              <span style={{ fontSize: 11, color: T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.sub }} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search variables…" style={{ ...inp(), paddingLeft: 32 }} />
        </div>
        {["all", "production", "staging", "testing"].map(e => (
          <button key={e} onClick={() => setEnvFilter(e)}
            style={{ padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${envFilter === e ? A1 : T.border}`, background: envFilter === e ? `${A1}22` : T.card, color: envFilter === e ? T.badgeFg : T.sub, textTransform: "capitalize" }}>
            {e}
          </button>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px", marginBottom: 16 }}>
          <h3 style={{ color: T.text, fontWeight: 700, fontSize: 15, margin: "0 0 16px" }}>{editing ? "Edit Variable" : "New Environment Variable"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 5 }}>VARIABLE NAME *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))} placeholder="MY_API_KEY" style={inp()} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 5 }}>ENVIRONMENT</label>
              <select value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value as EnvVar["environment"] }))} style={{ ...inp(), width: "100%", padding: "9px 12px", fontSize: 13 }}>
                <option value="all">All Environments</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="testing">Testing</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 5 }}>VALUE</label>
              <Input type={form.isSensitive ? "password" : "text"} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="Enter value…" style={inp()} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 5 }}>DESCRIPTION</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this variable do?" style={inp()} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="sensitive" checked={form.isSensitive} onChange={e => setForm(f => ({ ...f, isSensitive: e.target.checked }))} />
              <label htmlFor="sensitive" style={{ fontSize: 13, color: T.sub, cursor: "pointer" }}>Sensitive / mask value</label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="enabled" checked={form.isEnabled} onChange={e => setForm(f => ({ ...f, isEnabled: e.target.checked }))} />
              <label htmlFor="enabled" style={{ fontSize: 13, color: T.sub, cursor: "pointer" }}>Enable this variable</label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={saveForm} style={{ padding: "9px 20px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {editing ? "Save Changes" : "Add Variable"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(BLANK); }} style={{ padding: "9px 16px", borderRadius: 10, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Variables list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: T.sub }}><KeyRound size={32} style={{ opacity: .2, marginBottom: 10 }} /><p>No variables found</p></div>}
        {filtered.map(v => {
          const isProtected = PROTECTED.includes(v.name);
          const env = envBadge[v.environment];
          const displayVal = v.isSensitive && !revealed[v.id] ? "••••••••••••••••" : v.value;
          return (
            <div key={v.id} style={{ background: T.card, border: `1px solid ${v.isEnabled ? T.border : "rgba(148,163,184,.1)"}`, borderRadius: 14, padding: "14px 18px", opacity: v.isEnabled ? 1 : .6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    {isProtected && <Shield size={12} color="#f87171" />}
                    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: T.text }}>{v.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: env.color, background: env.bg, padding: "2px 7px", borderRadius: 5, textTransform: "capitalize" }}>{v.environment}</span>
                    {v.isSensitive && <span style={{ fontSize: 10, color: "#fbbf24", background: "rgba(251,191,36,.1)", padding: "2px 7px", borderRadius: 5 }}>SENSITIVE</span>}
                    {isProtected && <span style={{ fontSize: 10, color: "#f87171", background: "rgba(248,113,113,.08)", padding: "2px 7px", borderRadius: 5 }}>PROTECTED</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace", fontSize: 12, color: T.sub }}>
                    <span>{displayVal}</span>
                    {v.isSensitive && <button onClick={() => setRevealed(r => ({ ...r, [v.id]: !r[v.id] }))} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub, padding: 0 }}>{revealed[v.id] ? <EyeOff size={11} /> : <Eye size={11} />}</button>}
                    <button onClick={() => { navigator.clipboard.writeText(v.value); toast({ title: "Copied" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub, padding: 0 }}><Copy size={11} /></button>
                  </div>
                  {v.description && <p style={{ fontSize: 11, color: T.sub, margin: "4px 0 0", opacity: .8 }}>{v.description}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 7, background: v.isEnabled ? "rgba(74,222,128,.08)" : "rgba(148,163,184,.08)" }}>
                    {v.isEnabled ? <CheckCircle2 size={11} color="#4ade80" /> : <AlertTriangle size={11} color="#94a3b8" />}
                    <span style={{ fontSize: 11, fontWeight: 600, color: v.isEnabled ? "#4ade80" : "#94a3b8" }}>{v.isEnabled ? "Active" : "Disabled"}</span>
                  </div>
                  <button onClick={() => toggle(v.id)} disabled={isProtected} style={{ background: "none", border: "none", cursor: isProtected ? "not-allowed" : "pointer", color: T.sub, opacity: isProtected ? .4 : 1 }}>
                    {v.isEnabled ? <ToggleRight size={22} color="#4ade80" /> : <ToggleLeft size={22} color="#94a3b8" />}
                  </button>
                  <button onClick={() => { setEditing(v); setForm({ name: v.name, value: v.value, description: v.description, environment: v.environment, isEnabled: v.isEnabled, isSensitive: v.isSensitive }); setShowForm(true); }} disabled={isProtected} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 11, fontWeight: 600, cursor: isProtected ? "not-allowed" : "pointer", opacity: isProtected ? .4 : 1 }}>
                    <Edit2 size={11} /> Edit
                  </button>
                  {!isProtected && <button onClick={() => setConfirmDelete(v)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 7, background: "rgba(248,113,113,.06)", border: "1px solid rgba(248,113,113,.15)", color: "#f87171", fontSize: 11, cursor: "pointer" }}>
                    <Trash2 size={11} />
                  </button>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                <span style={{ fontSize: 10, color: T.sub }}>Added {safeFmt(v.createdAt, "MMM d, yyyy")}</span>
                {v.updatedAt !== v.createdAt && <span style={{ fontSize: 10, color: T.sub }}>Updated {safeFmt(v.updatedAt, "MMM d, HH:mm")}</span>}
                {v.history.length > 0 && <span style={{ fontSize: 10, color: T.badgeFg }}>{v.history.length} revision{v.history.length !== 1 ? "s" : ""}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmActionDialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) { const updated = vars.filter(v => v.id !== confirmDelete.id); persist(updated); logAction("Env Var Deleted", `Deleted ${confirmDelete.name}`, "System", "warning"); toast({ title: "Variable deleted" }); setConfirmDelete(null); } }}
        title="Delete Variable" description={`Permanently remove "${confirmDelete?.name}"? This cannot be undone.`} confirmLabel="Delete" variant="danger" mode="type" typeToConfirm="DELETE" />
    </div>
  );
}
