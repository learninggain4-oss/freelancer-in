import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Loader2, Upload, Trash2, CheckCircle, Image as ImageIcon, Type, Save, RotateCcw } from "lucide-react";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)", inputBdr: "rgba(255,255,255,.1)" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", inputBdr: "rgba(0,0,0,.12)" },
  wb:    { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", inputBdr: "rgba(0,0,0,.12)" },
};

const A1 = "#6366f1";
const A2 = "#8b5cf6";
const BUCKET = "company-logos";
const LOGO_PATH = "app-logo/logo.png";
const DEFAULT_APP_NAME = "Freelancer India";

const AdminBranding = () => {
  const { toast } = useToast();
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const [appName, setAppName] = useState("");
  const [savedAppName, setSavedAppName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["app_logo_url", "app_name"]);
    const logoRow = data?.find(r => r.key === "app_logo_url");
    const nameRow = data?.find(r => r.key === "app_name");
    setCurrentLogoUrl(logoRow?.value ?? null);
    const name = nameRow?.value ?? DEFAULT_APP_NAME;
    setAppName(name);
    setSavedAppName(name);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file (PNG, JPG, SVG, WebP).", variant: "destructive" });
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 2 MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUploadLogo = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(LOGO_PATH, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(LOGO_PATH);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: settingError } = await supabase
        .from("app_settings")
        .upsert({ key: "app_logo_url", value: publicUrl }, { onConflict: "key" });
      if (settingError) throw settingError;
      setCurrentLogoUrl(publicUrl);
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      toast({ title: "Logo updated!", description: "The app logo has been saved successfully." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setRemoving(true);
    try {
      await supabase.storage.from(BUCKET).remove([LOGO_PATH]);
      await supabase.from("app_settings").delete().eq("key", "app_logo_url");
      setCurrentLogoUrl(null);
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      toast({ title: "Logo removed", description: "The default icon will be shown." });
    } catch (err: any) {
      toast({ title: "Remove failed", description: err.message, variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  const handleSaveName = async () => {
    const trimmed = appName.trim();
    if (!trimmed) { toast({ title: "Name cannot be empty", variant: "destructive" }); return; }
    if (trimmed.length > 60) { toast({ title: "Name too long", description: "Maximum 60 characters.", variant: "destructive" }); return; }
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "app_name", value: trimmed }, { onConflict: "key" });
      if (error) throw error;
      setSavedAppName(trimmed);
      toast({ title: "App name updated!", description: `Now showing "${trimmed}" across the app.` });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  };

  const handleResetName = async () => {
    setAppName(DEFAULT_APP_NAME);
    setSavingName(true);
    try {
      await supabase.from("app_settings").upsert({ key: "app_name", value: DEFAULT_APP_NAME }, { onConflict: "key" });
      setSavedAppName(DEFAULT_APP_NAME);
      toast({ title: "App name reset", description: `Reverted to "${DEFAULT_APP_NAME}".` });
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  };

  const displayUrl = preview || currentLogoUrl;
  const nameChanged = appName.trim() !== savedAppName;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "28px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.4px" }}>App Branding</h1>
          <p style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Customise your app's name and logo across the entire platform.</p>
        </div>

        {/* ── APP NAME ── */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${A1}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Type size={15} color={A1} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>App Name</p>
              <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>Shown in navigation headers and the admin footer</p>
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: T.sub, fontSize: 13 }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading…
            </div>
          ) : (
            <>
              {/* Live preview */}
              <div style={{ padding: "10px 14px", borderRadius: 10, background: T.input, border: `1px solid ${T.inputBdr}`, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: T.sub, flexShrink: 0 }}>Preview:</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: "-0.3px" }}>
                  {appName.trim() || <span style={{ color: T.sub, fontWeight: 400 }}>Enter a name…</span>}
                </span>
              </div>

              <input
                value={appName}
                onChange={e => setAppName(e.target.value)}
                maxLength={60}
                placeholder="e.g. Freelancer India"
                style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1px solid ${nameChanged ? A1 + "66" : T.inputBdr}`, background: T.input, color: T.text, fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: T.sub }}>{appName.length}/60 characters</span>
                {nameChanged && <span style={{ fontSize: 11, color: A1, fontWeight: 600 }}>Unsaved changes</span>}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !nameChanged || !appName.trim()}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 12, border: "none", cursor: !savingName && nameChanged && appName.trim() ? "pointer" : "not-allowed", background: nameChanged && appName.trim() ? `linear-gradient(135deg,${A1},${A2})` : T.input, color: nameChanged && appName.trim() ? "white" : T.sub, fontSize: 14, fontWeight: 700, opacity: savingName || !nameChanged || !appName.trim() ? 0.6 : 1, boxShadow: nameChanged && appName.trim() ? `0 4px 16px ${A1}44` : "none" }}
                >
                  {savingName ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                  {savingName ? "Saving…" : "Save Name"}
                </button>
                <button
                  onClick={handleResetName}
                  disabled={savingName || savedAppName === DEFAULT_APP_NAME}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 12, border: `1px solid ${T.border}`, cursor: !savingName && savedAppName !== DEFAULT_APP_NAME ? "pointer" : "not-allowed", background: T.input, color: T.sub, fontSize: 13, fontWeight: 600, opacity: savedAppName === DEFAULT_APP_NAME ? 0.4 : 1 }}
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── LOGO ── */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${A1}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ImageIcon size={15} color={A1} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>App Logo</p>
              <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>Shown as the 34×34 px icon next to the app name</p>
            </div>
          </div>

          {/* Current logo preview */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, padding: "14px", borderRadius: 12, background: T.input, border: `1px solid ${T.inputBdr}` }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, border: `2px dashed ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", background: T.card, overflow: "hidden", flexShrink: 0 }}>
              {loading ? (
                <Loader2 size={18} color={T.sub} style={{ animation: "spin 1s linear infinite" }} />
              ) : displayUrl ? (
                <img src={displayUrl} alt="App Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 16 }}>🇮🇳</span>
                </div>
              )}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>
                {preview ? "Preview (unsaved)" : currentLogoUrl ? "Custom logo active" : "Default icon"}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Admin header", "Freelancer portal", "Employer portal"].map(loc => (
                  <span key={loc} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: `${A1}20`, color: A1, fontWeight: 700 }}>{loc}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            style={{ border: `2px dashed ${T.border}`, borderRadius: 14, padding: "22px 20px", textAlign: "center", cursor: "pointer", marginBottom: 14 }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const ev = { target: { files: [f] } } as any; handleFileChange(ev); } }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 3px" }}>Click to select or drag & drop</p>
            <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>PNG, JPG, SVG, WebP · max 2 MB · recommended 512×512 px</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

          {file && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: T.input, marginBottom: 14, fontSize: 12, color: T.text }}>
              <CheckCircle size={14} color="#4ade80" />
              <span style={{ flex: 1 }}>{file.name}</span>
              <span style={{ color: T.sub }}>{(file.size / 1024).toFixed(0)} KB</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleUploadLogo}
              disabled={!file || uploading}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 12, border: "none", cursor: file && !uploading ? "pointer" : "not-allowed", background: file && !uploading ? `linear-gradient(135deg,${A1},${A2})` : T.input, color: file && !uploading ? "white" : T.sub, fontSize: 14, fontWeight: 700, opacity: !file || uploading ? 0.6 : 1, boxShadow: file && !uploading ? `0 4px 16px ${A1}44` : "none" }}
            >
              {uploading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={16} />}
              {uploading ? "Uploading…" : "Save Logo"}
            </button>
            {currentLogoUrl && !preview && (
              <button
                onClick={handleRemoveLogo}
                disabled={removing}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 12, border: `1px solid rgba(239,68,68,.3)`, cursor: removing ? "not-allowed" : "pointer", background: "rgba(239,68,68,.08)", color: "#f87171", fontSize: 14, fontWeight: 700 }}
              >
                {removing ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={16} />}
                {removing ? "Removing…" : "Remove"}
              </button>
            )}
          </div>
        </div>

        {/* Tips */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Tips</p>
          {[
            "App name shows in the navigation header on all pages",
            "Use a square logo (512×512 px) with transparent background",
            "Both changes take effect immediately after saving",
            "The footer copyright also uses the app name automatically",
          ].map(tip => (
            <div key={tip} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, color: T.sub }}>
              <span style={{ color: A1, fontWeight: 700, flexShrink: 0 }}>•</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdminBranding;
