import { useState, useEffect } from "react";
import { Database, Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2, Copy, ToggleRight, TestTube2, History, Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const DB_KEY = "admin_db_connections_v2";
const HISTORY_KEY = "admin_db_history";

export interface DbConnection {
  id: string; name: string; provider: "supabase" | "postgresql" | "mysql";
  projectUrl: string; anonKey: string; dbName: string; username: string;
  environment: "production" | "staging" | "testing";
  isActive: boolean; isPrimary: boolean;
  lastTested?: string; testStatus?: "ok" | "fail" | "pending";
  createdAt: string; updatedAt: string; notes?: string;
}

function load(): DbConnection[] {
  try {
    const d = localStorage.getItem(DB_KEY);
    if (d) return JSON.parse(d);
  } catch { /* */ }
  const def: DbConnection = {
    id: "default", name: "Primary Supabase", provider: "supabase",
    projectUrl: import.meta.env.VITE_SUPABASE_URL,
    anonKey: "••••••••••••••••••••••••", dbName: "postgres", username: "postgres",
    environment: "production", isActive: true, isPrimary: true,
    testStatus: "ok", lastTested: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(), notes: "Main production Supabase instance",
  };
  localStorage.setItem(DB_KEY, JSON.stringify([def]));
  return [def];
}

function save(conns: DbConnection[]) { localStorage.setItem(DB_KEY, JSON.stringify(conns)); }

function addHistory(action: string, details: string) {
  try {
    const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    h.unshift({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), action, details });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 30)));
  } catch { /* */ }
}

const BLANK = {
  name: "", provider: "supabase" as DbConnection["provider"],
  projectUrl: "", anonKey: "", dbName: "postgres",
  username: "postgres", environment: "production" as DbConnection["environment"],
  isActive: false, isPrimary: false, notes: "",
};

const envColor = { production: "#f87171", staging: "#fbbf24", testing: "#4ade80" };
const providerIcon = { supabase: "⚡", postgresql: "🐘", mysql: "🐬" };

export default function AdminDatabaseManager() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [connections, setConnections] = useState<DbConnection[]>(() => load());
  const [editing, setEditing] = useState<DbConnection | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [modalOpen, setModalOpen] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [confirmSwitch, setConfirmSwitch] = useState<DbConnection | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DbConnection | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ id: string; timestamp: string; action: string; details: string }[]>(() => {
    try { const d = localStorage.getItem(HISTORY_KEY); if (d) return JSON.parse(d); } catch {}
    return [{id:"h1",timestamp:new Date(Date.now()-86400000).toISOString(),action:"connect",details:"Connected to Supabase primary"},{id:"h2",timestamp:new Date(Date.now()-3600000).toISOString(),action:"query",details:"Health check passed"}];
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => { setConnections(load()); }, []);

  useEffect(() => {
    if (showHistory) {
      setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"));
    }
  }, [showHistory]);

  const persist = (conns: DbConnection[]) => { save(conns); setConnections(conns); };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...BLANK });
    setModalOpen(true);
  };

  const openEdit = (conn: DbConnection) => {
    setEditing(conn);
    setForm({
      name: conn.name, provider: conn.provider, projectUrl: conn.projectUrl,
      anonKey: conn.anonKey, dbName: conn.dbName, username: conn.username,
      environment: conn.environment, isActive: conn.isActive, isPrimary: conn.isPrimary,
      notes: conn.notes || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); setForm({ ...BLANK }); };

  const saveForm = () => {
    if (!form.name.trim()) { toast({ title: "Connection name is required", variant: "destructive" }); return; }
    if (!form.projectUrl.trim()) { toast({ title: "Project URL is required", variant: "destructive" }); return; }

    if (editing) {
      const updated = connections.map(c =>
        c.id === editing.id ? { ...editing, ...form, updatedAt: new Date().toISOString() } : c
      );
      persist(updated);
      addHistory("Connection Updated", `Modified: ${form.name}`);
      logAction("DB Connection Updated", `Updated ${form.name}`, "System", "success");
      toast({ title: "Connection updated successfully" });
    } else {
      const newConn: DbConnection = {
        ...form,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist([...connections, newConn]);
      addHistory("Connection Added", `New connection: ${form.name}`);
      logAction("DB Connection Added", `Added ${form.name}`, "System", "success");
      toast({ title: "Connection added successfully", description: `${form.name} has been added to the list.` });
    }
    closeModal();
  };

  const testConnection = async (conn: DbConnection) => {
    setTesting(conn.id);
    persist(connections.map(c => c.id === conn.id ? { ...c, testStatus: "pending" } : c));
    try {
      const resp = await fetch(`${conn.projectUrl}/rest/v1/`, {
        headers: { apikey: conn.anonKey !== "••••••••••••••••••••••••" ? conn.anonKey : "", Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      const ok = resp.status < 500;
      persist(connections.map(c => c.id === conn.id ? { ...c, testStatus: ok ? "ok" : "fail", lastTested: new Date().toISOString() } : c));
      addHistory("Connection Tested", `${conn.name}: ${ok ? "PASS" : "FAIL"} (${resp.status})`);
      logAction("DB Connection Tested", `${conn.name} — ${ok ? "Success" : "Failed"}`, "System", ok ? "success" : "warning");
      toast({ title: ok ? "Connection successful" : "Connection failed", description: `${conn.name} responded with HTTP ${resp.status}` });
    } catch (err) {
      persist(connections.map(c => c.id === conn.id ? { ...c, testStatus: "fail", lastTested: new Date().toISOString() } : c));
      addHistory("Connection Test Failed", `${conn.name}: ${String(err)}`);
      toast({ title: "Connection failed", description: "Could not reach the database endpoint", variant: "destructive" });
    } finally { setTesting(null); }
  };

  const switchActive = (target: DbConnection) => {
    const updated = connections.map(c => ({ ...c, isActive: c.id === target.id }));
    persist(updated);
    addHistory("Database Switched", `Active DB changed to: ${target.name}`);
    logAction("Database Switched", `Active database changed to ${target.name}`, "System", "warning");
    toast({ title: "Database switched", description: `Now using ${target.name}` });
    setConfirmSwitch(null);
  };

  const deleteConn = (conn: DbConnection) => {
    if (conn.isActive) { toast({ title: "Cannot delete active connection", variant: "destructive" }); return; }
    persist(connections.filter(c => c.id !== conn.id));
    addHistory("Connection Deleted", `Removed: ${conn.name}`);
    logAction("DB Connection Deleted", `Deleted ${conn.name}`, "System", "warning");
    toast({ title: "Connection removed" });
    setConfirmDelete(null);
  };

  const inputStyle: React.CSSProperties = {
    background: T.input, border: `1px solid ${T.border}`, color: T.text, borderRadius: 10,
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, width: "100%", padding: "9px 12px", fontSize: 13, outline: "none",
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${A1}22,${A2}15)`, border: `1px solid rgba(99,102,241,.2)`, borderRadius: 18, padding: "26px 28px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 0, top: 0, width: 180, height: 180, background: `radial-gradient(circle at top right,${A2}12,transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${A1}55`, flexShrink: 0 }}>
            <Database size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Database Manager</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: "3px 0 0" }}>Manage Supabase / PostgreSQL connections, test health, and switch active databases</p>
          </div>
          <div style={{ display: "flex", gap: 8, position: "relative", zIndex: 1 }}>
            <button
              onClick={() => setShowHistory(h => !h)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <History size={13} /> History
            </button>
            <button
              onClick={openAdd}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 12px ${A1}44` }}
            >
              <Plus size={14} /> Add Connection
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {[
            { label: "Total Connections", val: connections.length, color: T.badgeFg },
            { label: "Active", val: connections.filter(c => c.isActive).length, color: "#4ade80" },
            { label: "Healthy", val: connections.filter(c => c.testStatus === "ok").length, color: "#4ade80" },
            { label: "Failed", val: connections.filter(c => c.testStatus === "fail").length, color: "#f87171" },
          ].map(s => (
            <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: 11, color: T.sub }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <History size={14} color={A1} />
            <h3 style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: 0 }}>Connection History</h3>
            <span style={{ fontSize: 11, color: T.sub, marginLeft: "auto" }}>{history.length} events</span>
          </div>
          {history.length === 0
            ? <p style={{ color: T.sub, fontSize: 12, textAlign: "center", padding: "16px 0" }}>No history yet</p>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {history.slice(0, 8).map(h => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9, background: T.input, border: `1px solid ${T.border}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: A1, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{h.action}: </span>
                      <span style={{ fontSize: 12, color: T.sub }}>{h.details}</span>
                    </div>
                    <span style={{ fontSize: 10, color: T.sub, flexShrink: 0 }}>{safeFmt(h.timestamp, "MMM d, HH:mm")}</span>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Connections list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {connections.map(conn => {
          const statusColor = conn.testStatus === "ok" ? "#4ade80" : conn.testStatus === "fail" ? "#f87171" : "#fbbf24";
          const statusBg = conn.testStatus === "ok" ? "rgba(74,222,128,.1)" : conn.testStatus === "fail" ? "rgba(248,113,113,.1)" : "rgba(251,191,36,.1)";
          const maskedKey = conn.anonKey.length > 8 ? conn.anonKey.slice(0, 12) + "••••••••" + conn.anonKey.slice(-4) : conn.anonKey;
          return (
            <div key={conn.id} style={{ background: T.card, border: `1px solid ${conn.isActive ? "rgba(99,102,241,.3)" : T.border}`, borderRadius: 16, padding: "18px 20px", position: "relative" }}>
              {conn.isActive && (
                <div style={{ position: "absolute", top: 12, right: 12, background: `${A1}22`, border: `1px solid ${A1}44`, borderRadius: 8, padding: "3px 9px", fontSize: 10, fontWeight: 800, color: T.badgeFg }}>ACTIVE</div>
              )}
              {conn.isPrimary && <Star size={12} color="#fbbf24" style={{ position: "absolute", top: 14, right: conn.isActive ? 80 : 12 }} />}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${A1}15`, border: `1px solid ${A1}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {providerIcon[conn.provider]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15, color: T.text, margin: 0 }}>{conn.name}</h3>
                    <span style={{ fontSize: 10, fontWeight: 700, color: envColor[conn.environment], background: `${envColor[conn.environment]}15`, padding: "2px 8px", borderRadius: 6, textTransform: "uppercase" }}>{conn.environment}</span>
                  </div>
                  <p style={{ fontSize: 12, color: T.sub, margin: "0 0 8px", fontFamily: "monospace" }}>{conn.projectUrl}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: statusBg }}>
                      {conn.testStatus === "pending"
                        ? <Loader2 size={11} color={statusColor} className="animate-spin" />
                        : conn.testStatus === "ok"
                        ? <CheckCircle2 size={11} color={statusColor} />
                        : <XCircle size={11} color={statusColor} />}
                      <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>
                        {conn.testStatus === "ok" ? "Healthy" : conn.testStatus === "fail" ? "Failed" : "Unknown"}
                      </span>
                    </div>
                    {conn.lastTested && <span style={{ fontSize: 10, color: T.sub }}>Tested {safeFmt(conn.lastTested, "MMM d, HH:mm")}</span>}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: T.input }}>
                      <span style={{ fontSize: 11, color: T.sub, fontFamily: "monospace" }}>{showKeys[conn.id] ? conn.anonKey : maskedKey}</span>
                      <button onClick={() => setShowKeys(k => ({ ...k, [conn.id]: !k[conn.id] }))} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub, fontSize: 10, padding: 0 }}>
                        {showKeys[conn.id] ? "hide" : "show"}
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(conn.anonKey); toast({ title: "Key copied" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub, padding: 0 }}>
                        <Copy size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                <button onClick={() => testConnection(conn)} disabled={testing === conn.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {testing === conn.id ? <Loader2 size={12} className="animate-spin" /> : <TestTube2 size={12} />} Test Connection
                </button>
                {!conn.isActive && (
                  <button onClick={() => setConfirmSwitch(conn)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, background: `${A1}18`, border: `1px solid ${A1}33`, color: T.badgeFg, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <ToggleRight size={12} /> Set Active
                  </button>
                )}
                <button onClick={() => openEdit(conn)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <Edit2 size={12} /> Edit
                </button>
                {!conn.isActive && (
                  <button onClick={() => setConfirmDelete(conn)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", color: "#f87171", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <Trash2 size={12} /> Delete
                  </button>
                )}
                <span style={{ fontSize: 11, color: T.sub, marginLeft: "auto", alignSelf: "center" }}>DB: {conn.dbName} • {conn.provider}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={open => { if (!open) closeModal(); }}>
        <DialogContent style={{ background: themeKey === "black" ? "#0f0f23" : "#fff", border: `1px solid ${A1}44`, borderRadius: 18, maxWidth: 520, padding: "28px 28px 24px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: T.text, fontSize: 17, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Database size={16} color="#fff" />
              </div>
              {editing ? "Edit Connection" : "New Database Connection"}
            </DialogTitle>
          </DialogHeader>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {/* Name + Provider */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: T.sub, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Connection Name *</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Primary DB"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.sub, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Provider</label>
                <select
                  value={form.provider}
                  onChange={e => setForm(f => ({ ...f, provider: e.target.value as DbConnection["provider"] }))}
                  style={selectStyle}
                >
                  <option value="supabase">⚡ Supabase</option>
                  <option value="postgresql">🐘 PostgreSQL</option>
                  <option value="mysql">🐬 MySQL</option>
                </select>
              </div>
            </div>

            {/* Project URL */}
            <div>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Project URL *</label>
              <Input
                value={form.projectUrl}
                onChange={e => setForm(f => ({ ...f, projectUrl: e.target.value }))}
                placeholder="https://your-project.supabase.co"
                style={inputStyle}
              />
            </div>

            {/* API Key */}
            <div>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>API Key / Anon Key</label>
              <Input
                type="password"
                value={form.anonKey}
                onChange={e => setForm(f => ({ ...f, anonKey: e.target.value }))}
                placeholder="eyJhbGci..."
                style={inputStyle}
              />
            </div>

            {/* DB Name + Environment */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: T.sub, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Database Name</label>
                <Input
                  value={form.dbName}
                  onChange={e => setForm(f => ({ ...f, dbName: e.target.value }))}
                  placeholder="postgres"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.sub, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Environment</label>
                <select
                  value={form.environment}
                  onChange={e => setForm(f => ({ ...f, environment: e.target.value as DbConnection["environment"] }))}
                  style={selectStyle}
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="testing">Testing</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes (optional)</label>
              <Input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional description"
                style={inputStyle}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                onClick={saveForm}
                style={{ flex: 1, padding: "11px 20px", borderRadius: 11, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: `0 4px 14px ${A1}44` }}
              >
                {editing ? "Save Changes" : "Add Connection"}
              </button>
              <button
                onClick={closeModal}
                style={{ padding: "11px 18px", borderRadius: 11, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={!!confirmSwitch}
        onOpenChange={o => !o && setConfirmSwitch(null)}
        onConfirm={() => confirmSwitch && switchActive(confirmSwitch)}
        title={`Switch to ${confirmSwitch?.name}`}
        description={`This will change the active database connection. All new operations will use ${confirmSwitch?.name}. The current active connection will be deactivated.`}
        confirmLabel="Switch Database" variant="warning"
      />
      <ConfirmActionDialog
        open={!!confirmDelete}
        onOpenChange={o => !o && setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteConn(confirmDelete)}
        title="Delete Connection"
        description={`Remove "${confirmDelete?.name}" from the connection list? This cannot be undone.`}
        confirmLabel="Delete" variant="danger" mode="type" typeToConfirm="DELETE"
      />
    </div>
  );
}
