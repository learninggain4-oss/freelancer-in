import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import {
  RotateCcw, AlertTriangle, CheckCircle, Loader2,
  Type, Image as ImageIcon, Search, FileText, Layers,
  ShieldAlert, RefreshCw, Trash2,
} from "lucide-react";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)", inputBdr: "rgba(255,255,255,.1)", danger: "rgba(239,68,68,.08)", dangerBdr: "rgba(239,68,68,.25)" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", inputBdr: "rgba(0,0,0,.12)", danger: "rgba(239,68,68,.06)", dangerBdr: "rgba(239,68,68,.2)" },
  wb:    { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", inputBdr: "rgba(0,0,0,.12)", danger: "rgba(239,68,68,.06)", dangerBdr: "rgba(239,68,68,.2)" },
};

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const DEFAULTS = {
  app_name:        "Freelancer India",
  seo_title:       "Freelancer India — Hire Top Indian Freelancers | UPI Payments",
  seo_description: "India's trusted freelancing platform. Hire verified freelancers for web development, design, content, marketing & more. Pay via UPI, get GST invoices, escrow-protected. Zero commission for 3 months. 40,000+ freelancers across 28 states.",
};

type ResetStatus = "idle" | "loading" | "done" | "error";

interface ResetItem {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  currentValue: string | null;
  defaultValue: string | null;
  deleteOnly?: boolean;
  danger?: boolean;
}

const ConfirmDialog = ({
  message, onConfirm, onCancel, T,
}: { message: string; onConfirm: () => void; onCancel: () => void; T: typeof TH["black"] }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: T.card === "rgba(255,255,255,.05)" ? "#111122" : "#fff", border: `1px solid rgba(239,68,68,.3)`, borderRadius: 20, padding: 28, maxWidth: 380, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,.5)" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,.12)", border: "2px solid rgba(239,68,68,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <AlertTriangle size={24} color="#f87171" />
      </div>
      <p style={{ fontSize: 16, fontWeight: 800, color: T.text, textAlign: "center", margin: "0 0 8px" }}>Confirm Reset</p>
      <p style={{ fontSize: 13, color: T.sub, textAlign: "center", lineHeight: 1.5, margin: "0 0 24px" }}>{message}</p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${T.border}`, background: T.input, color: T.sub, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={onConfirm} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1px solid rgba(239,68,68,.4)", background: "rgba(239,68,68,.12)", color: "#f87171", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Yes, Reset
        </button>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: ResetStatus }) => {
  if (status === "loading") return <Loader2 size={14} color="#a5b4fc" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />;
  if (status === "done")    return <CheckCircle size={14} color="#4ade80" style={{ flexShrink: 0 }} />;
  if (status === "error")   return <AlertTriangle size={14} color="#f87171" style={{ flexShrink: 0 }} />;
  return null;
};

const AdminReset = () => {
  const { toast } = useToast();
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [settings, setSettings] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, ResetStatus>>({});
  const [confirm, setConfirm] = useState<{ key: string; message: string } | null>(null);
  const [resetAllConfirm, setResetAllConfirm] = useState(false);
  const [resetAllStatus, setResetAllStatus] = useState<ResetStatus>("idle");

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("key, value");
    const map: Record<string, string | null> = {};
    data?.forEach(r => { map[r.key] = r.value; });
    setSettings(map);
    setLoading(false);
  };

  const setStatus = (key: string, s: ResetStatus) =>
    setStatuses(prev => ({ ...prev, [key]: s }));

  const resetSetting = async (key: string, defaultValue: string | null, deleteOnly = false) => {
    setStatus(key, "loading");
    try {
      if (deleteOnly || defaultValue === null) {
        await supabase.from("app_settings").delete().eq("key", key);
        if (key === "app_logo_url") {
          await supabase.storage.from("company-logos").remove(["app-logo/logo.png"]);
        }
        setSettings(prev => ({ ...prev, [key]: null }));
      } else {
        await supabase.from("app_settings").upsert({ key, value: defaultValue }, { onConflict: "key" });
        setSettings(prev => ({ ...prev, [key]: defaultValue }));
      }
      setStatus(key, "done");
      toast({ title: "Reset successful", description: `"${key.replace(/_/g, " ")}" has been reset to default.` });
      setTimeout(() => setStatus(key, "idle"), 3000);
    } catch (err: any) {
      setStatus(key, "error");
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
      setTimeout(() => setStatus(key, "idle"), 3000);
    }
  };

  const handleResetAll = async () => {
    setResetAllStatus("loading");
    try {
      await supabase.from("app_settings").upsert({ key: "app_name",        value: DEFAULTS.app_name        }, { onConflict: "key" });
      await supabase.from("app_settings").upsert({ key: "seo_title",       value: DEFAULTS.seo_title       }, { onConflict: "key" });
      await supabase.from("app_settings").upsert({ key: "seo_description", value: DEFAULTS.seo_description }, { onConflict: "key" });
      await supabase.from("app_settings").delete().eq("key", "app_logo_url");
      await supabase.storage.from("company-logos").remove(["app-logo/logo.png"]);
      await loadSettings();
      setResetAllStatus("done");
      toast({ title: "Full reset complete!", description: "All app settings have been restored to defaults." });
      setTimeout(() => setResetAllStatus("idle"), 4000);
    } catch (err: any) {
      setResetAllStatus("error");
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
      setTimeout(() => setResetAllStatus("idle"), 3000);
    }
  };

  const resetItems: ResetItem[] = [
    {
      key:          "app_name",
      label:        "App Name",
      description:  "Resets app name shown in all navigation headers and footer",
      icon:         Type,
      currentValue: settings["app_name"] ?? DEFAULTS.app_name,
      defaultValue: DEFAULTS.app_name,
    },
    {
      key:          "app_logo_url",
      label:        "App Logo",
      description:  "Removes custom logo and restores the default gradient icon",
      icon:         ImageIcon,
      currentValue: settings["app_logo_url"] ? "Custom logo set" : null,
      defaultValue: null,
      deleteOnly:   true,
    },
    {
      key:          "seo_title",
      label:        "SEO Page Title",
      description:  "Resets the Google search page title to the default",
      icon:         Search,
      currentValue: settings["seo_title"] ?? DEFAULTS.seo_title,
      defaultValue: DEFAULTS.seo_title,
    },
    {
      key:          "seo_description",
      label:        "SEO Description",
      description:  "Resets the Google search meta description to the default",
      icon:         FileText,
      currentValue: settings["seo_description"] ?? DEFAULTS.seo_description,
      defaultValue: DEFAULTS.seo_description,
    },
  ];

  const cardStyle = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22, marginBottom: 16 };
  const isCustom = (item: ResetItem) => {
    if (item.deleteOnly) return !!settings[item.key];
    return settings[item.key] && settings[item.key] !== item.defaultValue;
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "28px 20px" }}>
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const item = resetItems.find(i => i.key === confirm.key);
            if (item) resetSetting(item.key, item.defaultValue ?? null, item.deleteOnly);
            setConfirm(null);
          }}
          T={T}
        />
      )}
      {resetAllConfirm && (
        <ConfirmDialog
          message="This will reset ALL app settings (name, logo, SEO title, SEO description) to their default values. This cannot be undone."
          onCancel={() => setResetAllConfirm(false)}
          onConfirm={() => { handleResetAll(); setResetAllConfirm(false); }}
          T={T}
        />
      )}

      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RotateCcw size={18} color="#f87171" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.4px" }}>Reset Center</h1>
          </div>
          <p style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Reset any customisation back to the factory default values.</p>
        </div>

        {/* Warning banner */}
        <div style={{ display: "flex", gap: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.25)", marginBottom: 24 }}>
          <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", margin: "0 0 2px" }}>Warning</p>
            <p style={{ fontSize: 12, color: T.sub, margin: 0, lineHeight: 1.5 }}>
              Reset actions take effect immediately and cannot be undone. Each item shows its current custom value below.
            </p>
          </div>
        </div>

        {/* ── APP SETTINGS section ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Layers size={14} color={T.sub} />
            <p style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>App Settings</p>
          </div>

          {loading ? (
            <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 10, color: T.sub, fontSize: 13 }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading current settings…
            </div>
          ) : (
            resetItems.map(item => {
              const Icon = item.icon;
              const custom = isCustom(item);
              const st = statuses[item.key] ?? "idle";
              return (
                <div key={item.key} style={{ ...cardStyle, borderColor: custom ? `${A1}44` : T.border }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    {/* Icon */}
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: custom ? `${A1}20` : T.input, border: `1px solid ${custom ? A1 + "44" : T.inputBdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} color={custom ? A1 : T.sub} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>{item.label}</p>
                        {custom ? (
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: `${A1}20`, color: A1, fontWeight: 700 }}>Custom</span>
                        ) : (
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "rgba(74,222,128,.1)", color: "#4ade80", fontWeight: 700 }}>Default</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: T.sub, margin: "0 0 8px", lineHeight: 1.4 }}>{item.description}</p>

                      {/* Current value */}
                      {item.currentValue && (
                        <div style={{ padding: "8px 10px", borderRadius: 8, background: T.input, border: `1px solid ${T.inputBdr}`, marginBottom: 10 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: T.sub, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>Current value</p>
                          <p style={{ fontSize: 12, color: T.text, margin: 0, wordBreak: "break-word", lineHeight: 1.4 }}>
                            {item.currentValue.length > 120 ? item.currentValue.slice(0, 120) + "…" : item.currentValue}
                          </p>
                        </div>
                      )}

                      {/* Default value preview (if different) */}
                      {custom && item.defaultValue && !item.deleteOnly && (
                        <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(74,222,128,.06)", border: "1px solid rgba(74,222,128,.15)", marginBottom: 10 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>Will reset to</p>
                          <p style={{ fontSize: 12, color: T.text, margin: 0, wordBreak: "break-word", lineHeight: 1.4 }}>
                            {item.defaultValue.length > 120 ? item.defaultValue.slice(0, 120) + "…" : item.defaultValue}
                          </p>
                        </div>
                      )}

                      {/* Reset button */}
                      <button
                        disabled={!custom || st === "loading"}
                        onClick={() => custom && setConfirm({
                          key: item.key,
                          message: item.deleteOnly
                            ? `Remove the custom ${item.label} and restore the default icon?`
                            : `Reset "${item.label}" to its default value?`,
                        })}
                        style={{
                          display: "flex", alignItems: "center", gap: 7,
                          padding: "8px 14px", borderRadius: 10,
                          border: `1px solid ${custom ? "rgba(239,68,68,.3)" : T.border}`,
                          background: custom ? "rgba(239,68,68,.08)" : T.input,
                          color: custom ? "#f87171" : T.sub,
                          fontSize: 12, fontWeight: 700,
                          cursor: custom && st !== "loading" ? "pointer" : "not-allowed",
                          opacity: custom ? 1 : 0.4,
                        }}
                      >
                        {st === "loading" ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RotateCcw size={13} />}
                        {st === "loading" ? "Resetting…" : st === "done" ? "Reset!" : "Reset to Default"}
                        <StatusBadge status={st} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── RESET ALL ── */}
        <div style={{ background: T.danger ?? "rgba(239,68,68,.08)", border: `1px solid ${T.dangerBdr ?? "rgba(239,68,68,.25)"}`, borderRadius: 16, padding: 22, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <ShieldAlert size={18} color="#f87171" />
            <p style={{ fontSize: 14, fontWeight: 800, color: "#f87171", margin: 0 }}>Reset Everything</p>
          </div>
          <p style={{ fontSize: 13, color: T.sub, margin: "0 0 16px", lineHeight: 1.5 }}>
            Resets <strong style={{ color: T.text }}>all</strong> app settings — name, logo, SEO title, SEO description — back to factory defaults in one action.
          </p>
          <button
            disabled={resetAllStatus === "loading"}
            onClick={() => setResetAllConfirm(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 20px", borderRadius: 12,
              border: "1px solid rgba(239,68,68,.4)",
              background: "rgba(239,68,68,.12)",
              color: "#f87171", fontSize: 14, fontWeight: 800,
              cursor: resetAllStatus === "loading" ? "not-allowed" : "pointer",
            }}
          >
            {resetAllStatus === "loading" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={16} />}
            {resetAllStatus === "loading" ? "Resetting all…" : "Reset All App Settings"}
            {resetAllStatus === "done"    && <CheckCircle size={15} color="#4ade80" />}
          </button>
        </div>

        {/* Info box */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px", marginTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>Notes</p>
          {[
            "Items showing 'Default' badge are already at their default value — no reset needed",
            "Items showing 'Custom' badge have been changed from their factory defaults",
            "Logo reset removes the uploaded image from storage and reverts to the gradient icon",
            "SEO changes reflect in Google search within 1–2 weeks after re-crawling",
            "App name resets take effect immediately across all portals",
          ].map(note => (
            <div key={note} style={{ display: "flex", gap: 8, marginBottom: 7, fontSize: 12, color: T.sub }}>
              <span style={{ color: A1, fontWeight: 700, flexShrink: 0 }}>•</span>
              <span>{note}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdminReset;
