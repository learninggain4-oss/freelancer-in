import { useState } from "react";
import { Archive, Download, Upload, Plus, Trash2, CheckCircle2, Clock, Database, FileJson, Shield, RefreshCw, AlertTriangle, HardDrive, Calendar, Lock } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { safeFmt } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

const BACKUPS_KEY = "admin_backups_v2";
const SCHEDULE_KEY = "admin_backup_schedule";

interface Backup { id: string; name: string; type: "full" | "config" | "audit"; size: string; tables: string[]; timestamp: string; status: "complete" | "failed"; encrypted: boolean; }

function loadBackups(): Backup[] {
  try { const d = localStorage.getItem(BACKUPS_KEY); if (d) return JSON.parse(d); } catch { /* */ }
  return [
    { id: "b1", name: "Auto Backup – " + format(new Date(Date.now() - 86400000), "MMM d, yyyy"), type: "full", size: "—", tables: ["profiles", "withdrawals", "recovery_requests"], timestamp: new Date(Date.now() - 86400000).toISOString(), status: "complete", encrypted: true },
    { id: "b2", name: "Config Snapshot – " + format(new Date(Date.now() - 3600000 * 6), "MMM d, HH:mm"), type: "config", size: "—", tables: ["settings", "env_vars"], timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), status: "complete", encrypted: false },
  ];
}

const BACKUP_TABLES = ["profiles", "withdrawals", "recovery_requests", "aadhaar_verifications", "bank_verifications", "jobs", "attendance_records", "wallet_transactions", "ip_blocks", "announcements"];

export default function AdminBackups() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [backups, setBackups] = useState<Backup[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Backup | null>(null);
  const [schedule, setSchedule] = useState(() => localStorage.getItem(SCHEDULE_KEY) || "daily");
  const [selectedTables, setSelectedTables] = useState<string[]>(BACKUP_TABLES.slice(0, 5));

  const persist = (b: Backup[]) => { setBackups(b); localStorage.setItem(BACKUPS_KEY, JSON.stringify(b)); };

  const runBackup = async (type: Backup["type"]) => {
    setRunning(true);
    const tablesToBackup = type === "config" ? ["settings", "env_vars"] : type === "full" ? selectedTables : selectedTables.slice(0, 3);
    const backup: Record<string, unknown[]> = {};
    let totalRows = 0;

    for (const table of tablesToBackup) {
      setProgress(`Backing up ${table}…`);
      try {
        const { data } = await supabase.from(table as "profiles").select("*").limit(500);
        backup[table] = data || [];
        totalRows += (data || []).length;
      } catch { backup[table] = []; }
      await new Promise(r => setTimeout(r, 300));
    }

    backup._meta = [{ created_at: new Date().toISOString(), type, tables: tablesToBackup, total_rows: totalRows }];
    const json = JSON.stringify(backup, null, 2);
    const sizeKb = (new Blob([json]).size / 1024).toFixed(1) + " KB";
    const filename = `backup-${type}-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`;

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);

    const entry: Backup = { id: crypto.randomUUID(), name: `${type === "full" ? "Full" : type === "config" ? "Config" : "Audit"} Backup – ${format(new Date(), "MMM d, HH:mm")}`, type, size: sizeKb, tables: tablesToBackup, timestamp: new Date().toISOString(), status: "complete", encrypted: false };
    persist([entry, ...backups].slice(0, 20));
    logAction("Backup Created", `${type} backup — ${sizeKb} — ${tablesToBackup.length} tables`, "System", "success");
    toast({ title: "Backup downloaded", description: `${sizeKb} · ${tablesToBackup.length} tables · ${totalRows} rows` });
    setProgress(null); setRunning(false);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const meta = data._meta?.[0];
        toast({ title: "Backup file validated", description: `Type: ${meta?.type || "unknown"} · Tables: ${Object.keys(data).filter(k => k !== "_meta").length} · Created: ${meta?.created_at ? format(new Date(meta.created_at), "MMM d, yyyy HH:mm") : "unknown"}. Actual restore requires server-side execution.` });
        logAction("Backup Restore Attempted", `File: ${file.name}`, "System", "warning");
      } catch { toast({ title: "Invalid backup file", variant: "destructive" }); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const typeColor = { full: "#a5b4fc", config: "#4ade80", audit: "#fbbf24" };
  const typeBg = { full: "rgba(99,102,241,.1)", config: "rgba(74,222,128,.1)", audit: "rgba(251,191,36,.1)" };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${A1}22,${A2}15)`, border: `1px solid rgba(99,102,241,.2)`, borderRadius: 18, padding: "26px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${A1}55`, flexShrink: 0 }}>
            <Archive size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Backup & Restore</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: "3px 0 0" }}>Export data snapshots, manage backup history, and restore from file</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Upload size={13} /> Restore File
              <input type="file" accept=".json" onChange={handleRestore} style={{ display: "none" }} />
            </label>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {[{ l: "Total Backups", v: backups.length, c: T.badgeFg }, { l: "Successful", v: backups.filter(b => b.status === "complete").length, c: "#4ade80" }, { l: "Failed", v: backups.filter(b => b.status === "failed").length, c: "#f87171" }].map(s => (
            <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: s.c }}>{s.v}</span>
              <span style={{ fontSize: 11, color: T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Manual backup */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Database size={15} color={A1} />
            <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Create Backup</h2>
          </div>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: T.sub, fontWeight: 600, marginBottom: 8 }}>SELECT TABLES TO INCLUDE:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {BACKUP_TABLES.map(t => (
                <button key={t} onClick={() => setSelectedTables(sel => sel.includes(t) ? sel.filter(x => x !== t) : [...sel, t])}
                  style={{ padding: "4px 9px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${selectedTables.includes(t) ? A1 : T.border}`, background: selectedTables.includes(t) ? `${A1}20` : T.input, color: selectedTables.includes(t) ? T.badgeFg : T.sub }}>
                  {t}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: T.sub, margin: "8px 0 0" }}>{selectedTables.length} tables selected</p>
          </div>
          {progress && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 9, background: `${A1}12`, border: `1px solid ${A1}25`, marginBottom: 12 }}>
              <RefreshCw size={12} color={A1} className="animate-spin" />
              <span style={{ fontSize: 12, color: T.badgeFg }}>{progress}</span>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[{ type: "full" as const, label: "Full Database Backup", desc: "All selected tables as JSON export", icon: Database, color: "#a5b4fc" },
              { type: "config" as const, label: "Config Snapshot", desc: "Settings & env variables only", icon: FileJson, color: "#4ade80" },
              { type: "audit" as const, label: "Audit Log Export", desc: "Activity logs & security events", icon: Shield, color: "#fbbf24" }].map(btn => {
              const Icon = btn.icon;
              return (
                <button key={btn.type} onClick={() => runBackup(btn.type)} disabled={running}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 11, background: `${btn.color}0a`, border: `1px solid ${btn.color}22`, cursor: running ? "not-allowed" : "pointer", opacity: running ? .7 : 1, textAlign: "left" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${btn.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {running ? <RefreshCw size={14} color={btn.color} className="animate-spin" /> : <Icon size={14} color={btn.color} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: 0 }}>{btn.label}</p>
                    <p style={{ fontSize: 10, color: T.sub, margin: 0 }}>{btn.desc}</p>
                  </div>
                  <Download size={13} color={T.sub} style={{ marginLeft: "auto" }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Calendar size={15} color="#4ade80" />
            <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Backup Schedule</h2>
          </div>
          <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.6, marginBottom: 14 }}>Configure the automatic backup frequency. Scheduled backups are stored on the server (requires backend integration for full automation).</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[{ val: "disabled", label: "Disabled", desc: "No automatic backups" },
              { val: "daily", label: "Daily", desc: "Every day at 2:00 AM" },
              { val: "weekly", label: "Weekly", desc: "Every Sunday at 2:00 AM" },
              { val: "monthly", label: "Monthly", desc: "1st of every month at 2:00 AM" }].map(opt => (
              <button key={opt.val} onClick={() => { setSchedule(opt.val); localStorage.setItem(SCHEDULE_KEY, opt.val); toast({ title: `Backup schedule: ${opt.label}` }); logAction("Backup Schedule Updated", `Changed to: ${opt.label}`, "System", "success"); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, background: schedule === opt.val ? `${A1}15` : T.input, border: `1px solid ${schedule === opt.val ? A1 + "44" : T.border}`, cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${schedule === opt.val ? A1 : T.border}`, background: schedule === opt.val ? A1 : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {schedule === opt.val && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: schedule === opt.val ? T.badgeFg : T.text, margin: 0 }}>{opt.label}</p>
                  <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 9, background: "rgba(251,191,36,.05)", border: "1px solid rgba(251,191,36,.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={12} color="#fbbf24" />
              <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600 }}>Full scheduling requires server-side cron job</span>
            </div>
            <p style={{ fontSize: 11, color: T.sub, margin: "4px 0 0" }}>This configuration is saved locally. For automatic execution, set up a Supabase scheduled function or Replit cron.</p>
          </div>
        </div>
      </div>

      {/* Backup history */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <HardDrive size={15} color={A1} />
          <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Backup History</h2>
          <span style={{ marginLeft: "auto", fontSize: 12, color: T.sub }}>{backups.length} backup{backups.length !== 1 ? "s" : ""}</span>
        </div>
        {backups.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: T.sub }}>
            <Archive size={36} style={{ opacity: .2, marginBottom: 10 }} />
            <p>No backups yet — create one above</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {backups.map((b, i) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: i < backups.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: typeBg[b.type], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Archive size={16} color={typeColor[b.type]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{b.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: typeColor[b.type], background: typeBg[b.type], padding: "2px 7px", borderRadius: 5, textTransform: "uppercase" }}>{b.type}</span>
                    {b.encrypted && <Lock size={11} color="#fbbf24" />}
                    {b.status === "complete" ? <CheckCircle2 size={11} color="#4ade80" /> : <AlertTriangle size={11} color="#f87171" />}
                  </div>
                  <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{b.tables.join(", ")} • {b.size}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>{safeFmt(b.timestamp, "MMM d, yyyy")}</p>
                  <p style={{ fontSize: 10, color: T.sub, margin: "2px 0 0", opacity: .7 }}>{safeFmt(b.timestamp, "HH:mm")}</p>
                </div>
                <button onClick={() => setConfirmDelete(b)} style={{ display: "flex", alignItems: "center", padding: "6px 8px", borderRadius: 8, background: "rgba(248,113,113,.06)", border: "1px solid rgba(248,113,113,.15)", color: "#f87171", cursor: "pointer", flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmActionDialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) { persist(backups.filter(b => b.id !== confirmDelete.id)); toast({ title: "Backup removed from history" }); setConfirmDelete(null); } }}
        title="Remove Backup" description={`Remove "${confirmDelete?.name}" from backup history? This only removes the record — the downloaded file is unaffected.`} confirmLabel="Remove" variant="danger" />
    </div>
  );
}
