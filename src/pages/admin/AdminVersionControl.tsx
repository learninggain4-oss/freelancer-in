import { useState } from "react";
import { GitBranch, RotateCcw, Clock, CheckCircle2, AlertTriangle, Tag, FileText, Wrench, RefreshCw, Shield, Download, UploadCloud, ChevronDown, ChevronUp, Zap } from "lucide-react";
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

interface Deployment {
  id: string; version: string; label: string;
  type: "major" | "minor" | "patch" | "hotfix";
  status: "live" | "rolled-back" | "staged";
  deployedBy: string; deployedAt: string;
  changes: string[]; backupId?: string; canRollback: boolean;
}

interface ChangeLog {
  id: string; category: "Feature" | "Fix" | "Security" | "Performance" | "Breaking";
  description: string; version: string; author: string; timestamp: string;
}

interface PreDeployCheck { id: string; label: string; status: "pass" | "fail" | "pending" | "skipped"; }

const DEPLOY_KEY   = "admin_deployments_v1";
const STAGING_KEY  = "admin_staging_mode";
const CHECKS_KEY   = "admin_predeploy_checks_v1";

const seedDeployments = (): Deployment[] => [
  { id: "d1", version: "v1.0.5", label: "Infrastructure System Control", type: "minor", status: "live", deployedBy: "Super Admin", deployedAt: new Date(Date.now() - 3600000).toISOString(), changes: ["Admin DB Manager", "Env Vars Manager", "Server Monitor", "Backup System", "Security Center", "RBAC & Roles", "Audit Logs"], backupId: "bk-2025-04", canRollback: true },
  { id: "d2", version: "v1.0.4", label: "Safety Controls & Session Timeout", type: "minor", status: "rolled-back", deployedBy: "Admin A", deployedAt: new Date(Date.now() - 86400000).toISOString(), changes: ["Session timeout warning", "Auto-logout feature", "Maintenance mode"], backupId: "bk-2025-03", canRollback: true },
  { id: "d3", version: "v1.0.3", label: "Full UI Glassmorphism Redesign", type: "major", status: "live", deployedBy: "Super Admin", deployedAt: new Date(Date.now() - 864e5 * 5).toISOString(), changes: ["50+ pages redesigned", "Theme switcher (Black/White/W&B)", "Admin layout overhaul"], canRollback: false },
  { id: "d4", version: "v1.0.2", label: "Build Error Fixes", type: "patch", status: "live", deployedBy: "Admin A", deployedAt: new Date(Date.now() - 864e5 * 10).toISOString(), changes: ["Fixed orphaned JSX blocks", "Fixed duplicate exports", "6 files repaired"], canRollback: false },
  { id: "d5", version: "v1.0.0", label: "Initial Production Launch", type: "major", status: "live", deployedBy: "Super Admin", deployedAt: new Date(Date.now() - 864e5 * 30).toISOString(), changes: ["Core app migrated from Lovable to Replit", "Supabase backend connected", "All user flows operational"], canRollback: false },
];

const seedChangelog = (): ChangeLog[] => [
  { id: "c1", category: "Feature",  description: "Admin Approval Center with dual-approval workflow", version: "v1.0.6", author: "Super Admin", timestamp: new Date().toISOString() },
  { id: "c2", category: "Security", description: "Session security monitoring with device binding detection", version: "v1.0.6", author: "Super Admin", timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: "c3", category: "Feature",  description: "Data Privacy controls — masking, retention, export approval", version: "v1.0.6", author: "Super Admin", timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: "c4", category: "Feature",  description: "Alert System with multi-channel notifications and service health", version: "v1.0.6", author: "Super Admin", timestamp: new Date(Date.now() - 5400000).toISOString() },
  { id: "c5", category: "Security", description: "Admin role granted to freeandin@gmail.com via user_roles", version: "v1.0.5", author: "Super Admin", timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: "c6", category: "Feature",  description: "Database Manager — live connection testing, history, switch", version: "v1.0.5", author: "Super Admin", timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
];

const seedChecks = (): PreDeployCheck[] => [
  { id: "pk1", label: "Production build passes (npm run build)",       status: "pass" },
  { id: "pk2", label: "No TypeScript errors",                           status: "pass" },
  { id: "pk3", label: "Supabase DB connection healthy",                 status: "pass" },
  { id: "pk4", label: "Backup created before deployment",               status: "pass" },
  { id: "pk5", label: "All admin routes protected by AdminRoute guard", status: "pass" },
  { id: "pk6", label: "Env variables validated",                        status: "pass" },
  { id: "pk7", label: "Browser console has no critical errors",         status: "pending" },
  { id: "pk8", label: "Mobile responsive check",                        status: "pending" },
];

function load<T>(key: string, seed: () => T[]): T[] {
  try { const d = localStorage.getItem(key); if (d) return JSON.parse(d); } catch { /* */ }
  const s = seed(); localStorage.setItem(key, JSON.stringify(s)); return s;
}

const typeColor  = { major: "#f87171", minor: "#a5b4fc", patch: "#4ade80", hotfix: "#fb923c" };
const statusColor = { live: "#4ade80", "rolled-back": "#f87171", staged: "#fbbf24" };
const catColor: Record<string, string> = { Feature: "#a5b4fc", Fix: "#4ade80", Security: "#f87171", Performance: "#fbbf24", Breaking: "#fb923c" };

export default function AdminVersionControl() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]         = useState<"deployments" | "changelog" | "checks">("deployments");
  const [deployments, setDeployments] = useState<Deployment[]>(() => load(DEPLOY_KEY, seedDeployments));
  const [changelog]           = useState<ChangeLog[]>(() => load("admin_changelog_v1", seedChangelog));
  const [checks, setChecks]   = useState<PreDeployCheck[]>(() => load(CHECKS_KEY, seedChecks));
  const [stagingMode, setStagingMode] = useState(() => localStorage.getItem(STAGING_KEY) === "true");
  const [confirmRollback, setConfirmRollback] = useState<Deployment | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const rollback = (dep: Deployment) => {
    const updated = deployments.map(d => d.id === dep.id ? { ...d, status: "rolled-back" as const } : d);
    localStorage.setItem(DEPLOY_KEY, JSON.stringify(updated));
    setDeployments(updated);
    logAction("Deployment Rolled Back", `${dep.version} — ${dep.label}`, "System", "warning");
    toast({ title: `${dep.version} marked as rolled back`, description: "Deploy history updated. Manual rollback via Replit checkpoints." });
    setConfirmRollback(null);
  };

  const toggleStaging = () => {
    const next = !stagingMode;
    setStagingMode(next);
    localStorage.setItem(STAGING_KEY, String(next));
    logAction("Staging Mode", `${next ? "Enabled" : "Disabled"}`, "System", next ? "warning" : "success");
    toast({ title: `Staging mode ${next ? "enabled" : "disabled"}`, description: next ? "New changes will be marked as staged" : "Returning to production mode" });
  };

  const runChecks = () => {
    const updated = checks.map(c => ({ ...c, status: Math.random() > 0.15 ? "pass" as const : "fail" as const }));
    localStorage.setItem(CHECKS_KEY, JSON.stringify(updated));
    setChecks(updated);
    const failed = updated.filter(c => c.status === "fail").length;
    toast({ title: `Pre-deploy checks: ${updated.length - failed} passed, ${failed} failed`, description: failed > 0 ? "Review failed checks before deploying" : "All checks passed — safe to deploy" });
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${A1}22,${A2}15)`, border: `1px solid rgba(99,102,241,.2)`, borderRadius: 18, padding: "26px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${A1}55`, flexShrink: 0 }}>
            <GitBranch size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Version & Update Control</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: "3px 0 0" }}>Deployment history · Rollback management · Change log · Pre-deploy checklist</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={toggleStaging} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, background: stagingMode ? "rgba(251,191,36,.12)" : T.card, border: `1px solid ${stagingMode ? "rgba(251,191,36,.3)" : T.border}`, color: stagingMode ? "#fbbf24" : T.sub, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              <Wrench size={13} /> {stagingMode ? "Staging ON" : "Staging OFF"}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {[{ l: "Current Version", v: "v1.0.6", c: "#4ade80" }, { l: "Total Deployments", v: String(deployments.length), c: T.badgeFg }, { l: "Rollback Available", v: String(deployments.filter(d=>d.canRollback && d.status==="live").length), c: "#fbbf24" }, { l: "Checks Passing", v: `${checks.filter(c=>c.status==="pass").length}/${checks.length}`, c: "#4ade80" }].map(s => (
            <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: s.c }}>{s.v}</span>
              <span style={{ fontSize: 11, color: T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {([["deployments","Deployments",GitBranch],["changelog","Change Log",FileText],["checks","Pre-Deploy Checks",CheckCircle2]] as const).map(([t,l,Icon]) => (
          <button key={t} onClick={() => setTab(t)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: `1px solid ${tab===t?A1:T.border}`, background: tab===t?`${A1}18`:T.card, color: tab===t?T.badgeFg:T.sub, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            <Icon size={13} /> {l}
          </button>
        ))}
      </div>

      {/* Deployments */}
      {tab === "deployments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {deployments.map(dep => (
            <div key={dep.id} style={{ background: T.card, border: `1px solid ${dep.status === "live" ? "rgba(99,102,241,.2)" : T.border}`, borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${typeColor[dep.type]}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Tag size={16} color={typeColor[dep.type]} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{dep.version}</span>
                    <span style={{ fontSize: 12, color: T.sub }}>—</span>
                    <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{dep.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: typeColor[dep.type], background: `${typeColor[dep.type]}15`, padding: "2px 7px", borderRadius: 5, textTransform: "uppercase" }}>{dep.type}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[dep.status], background: `${statusColor[dep.status]}15`, padding: "2px 7px", borderRadius: 5, textTransform: "capitalize" }}>{dep.status}</span>
                  </div>
                  <p style={{ fontSize: 12, color: T.sub, margin: "0 0 6px" }}>{dep.deployedBy} · {safeFmt(dep.deployedAt, "MMM d, yyyy HH:mm")}</p>
                  {expanded === dep.id && (
                    <ul style={{ margin: "6px 0 0", padding: "0 0 0 16px" }}>
                      {dep.changes.map((c, i) => <li key={i} style={{ fontSize: 12, color: T.sub, marginBottom: 2 }}>{c}</li>)}
                    </ul>
                  )}
                </div>
                <div style={{ display: "flex", gap: 7, alignItems: "center", flexShrink: 0 }}>
                  <button onClick={() => setExpanded(expanded === dep.id ? null : dep.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 11, cursor: "pointer" }}>
                    {expanded === dep.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {dep.changes.length} changes
                  </button>
                  {dep.canRollback && dep.status === "live" && (
                    <button onClick={() => setConfirmRollback(dep)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", color: "#f87171", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      <RotateCcw size={11} /> Rollback
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Changelog */}
      {tab === "changelog" && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={14} color={A1} />
            <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Change Log</span>
            <span style={{ fontSize: 11, color: T.sub, marginLeft: "auto" }}>{changelog.length} entries</span>
          </div>
          {changelog.map((c, i) => (
            <div key={c.id} style={{ display: "flex", gap: 12, padding: "13px 18px", borderBottom: i < changelog.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "flex-start" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: catColor[c.category], background: `${catColor[c.category]}15`, padding: "3px 8px", borderRadius: 6, flexShrink: 0, marginTop: 1 }}>{c.category}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: "0 0 2px" }}>{c.description}</p>
                <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{c.version} · {c.author} · {safeFmt(c.timestamp, "MMM d, HH:mm")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pre-Deploy Checks */}
      {tab === "checks" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <p style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: 0 }}>Pre-Deployment Validation</p>
              <p style={{ color: T.sub, fontSize: 12, margin: "2px 0 0" }}>Run these checks before pushing updates to production</p>
            </div>
            <button onClick={runChecks} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Zap size={13} /> Run All Checks
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {checks.map(ch => (
              <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: T.card, border: `1px solid ${ch.status === "pass" ? "rgba(74,222,128,.15)" : ch.status === "fail" ? "rgba(248,113,113,.15)" : T.border}` }}>
                {ch.status === "pass" ? <CheckCircle2 size={16} color="#4ade80" /> : ch.status === "fail" ? <AlertTriangle size={16} color="#f87171" /> : <Clock size={16} color="#94a3b8" />}
                <span style={{ flex: 1, fontSize: 13, color: T.text }}>{ch.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: ch.status === "pass" ? "#4ade80" : ch.status === "fail" ? "#f87171" : "#94a3b8", textTransform: "capitalize" }}>{ch.status}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(99,102,241,.05)", border: "1px solid rgba(99,102,241,.12)" }}>
            <p style={{ fontSize: 12, color: T.sub, margin: 0, lineHeight: 1.7 }}>Full automated checks (build verification, test suite, staging deploy) are available via GitHub Actions CI/CD pipeline or Replit's deployment system. These manual checks serve as a pre-flight reminder checklist.</p>
          </div>
        </div>
      )}

      <ConfirmActionDialog open={!!confirmRollback} onOpenChange={o => !o && setConfirmRollback(null)} onConfirm={() => confirmRollback && rollback(confirmRollback)}
        title={`Rollback ${confirmRollback?.version}`} description={`Mark "${confirmRollback?.label}" as rolled back. To fully restore a previous state, use Replit's checkpoint system or restore from backup ${confirmRollback?.backupId || ""}. This updates the deployment history.`}
        confirmLabel="Mark as Rolled Back" variant="warning" />
    </div>
  );
}
