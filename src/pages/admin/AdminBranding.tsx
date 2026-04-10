import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Loader2, Upload, Trash2, CheckCircle, Image as ImageIcon, Type, Save, RotateCcw, Search, FileText, Globe } from "lucide-react";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)", inputBdr: "rgba(255,255,255,.1)" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", inputBdr: "rgba(0,0,0,.12)" },
  wb:    { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", inputBdr: "rgba(0,0,0,.12)" },
};

const A1 = "#6366f1";
const A2 = "#8b5cf6";
const BUCKET    = "company-logos";
const LOGO_PATH = "app-logo/logo.png";
const DEFAULT_APP_NAME   = "Freelancer India";
const DEFAULT_SEO_TITLE  = "Freelancer India — Hire Top Indian Freelancers | UPI Payments";
const DEFAULT_SEO_DESC   = "India's trusted freelancing platform. Hire verified freelancers for web development, design, content, marketing & more. Pay via UPI, get GST invoices, escrow-protected.";

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={style}>{children}</div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, T }: { icon: React.ElementType; title: string; subtitle: string; T: typeof TH["black"] }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${A1}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={15} color={A1} />
    </div>
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>{title}</p>
      <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{subtitle}</p>
    </div>
  </div>
);

const AdminBranding = () => {
  const { toast } = useToast();
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [loading, setLoading]                 = useState(true);

  // App Name
  const [appName, setAppName]                 = useState("");
  const [savedAppName, setSavedAppName]       = useState("");
  const [savingName, setSavingName]           = useState(false);

  // Logo
  const [currentLogoUrl, setCurrentLogoUrl]   = useState<string | null>(null);
  const [preview, setPreview]                 = useState<string | null>(null);
  const [file, setFile]                       = useState<File | null>(null);
  const [uploading, setUploading]             = useState(false);
  const [removing, setRemoving]               = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // SEO
  const [seoTitle, setSeoTitle]               = useState("");
  const [savedSeoTitle, setSavedSeoTitle]     = useState("");
  const [seoDesc, setSeoDesc]                 = useState("");
  const [savedSeoDesc, setSavedSeoDesc]       = useState("");
  const [savingSeo, setSavingSeo]             = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["app_logo_url", "app_name", "seo_title", "seo_description"]);

    const get = (k: string) => data?.find(r => r.key === k)?.value ?? null;

    setCurrentLogoUrl(get("app_logo_url"));

    const name = get("app_name") ?? DEFAULT_APP_NAME;
    setAppName(name); setSavedAppName(name);

    const title = get("seo_title") ?? DEFAULT_SEO_TITLE;
    setSeoTitle(title); setSavedSeoTitle(title);

    const desc = get("seo_description") ?? DEFAULT_SEO_DESC;
    setSeoDesc(desc); setSavedSeoDesc(desc);

    setLoading(false);
  };

  // ── Logo handlers ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2 MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUploadLogo = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(LOGO_PATH, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(LOGO_PATH);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: settingError } = await supabase.from("app_settings").upsert({ key: "app_logo_url", value: publicUrl }, { onConflict: "key" });
      if (settingError) throw settingError;
      setCurrentLogoUrl(publicUrl);
      setFile(null); setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      toast({ title: "Logo updated!", description: "The app logo has been saved." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const handleRemoveLogo = async () => {
    setRemoving(true);
    try {
      await supabase.storage.from(BUCKET).remove([LOGO_PATH]);
      await supabase.from("app_settings").delete().eq("key", "app_logo_url");
      setCurrentLogoUrl(null); setFile(null); setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      toast({ title: "Logo removed", description: "Default icon will be shown." });
    } catch (err: any) {
      toast({ title: "Remove failed", description: err.message, variant: "destructive" });
    } finally { setRemoving(false); }
  };

  // ── App Name handlers ──
  const handleSaveName = async () => {
    const trimmed = appName.trim();
    if (!trimmed) { toast({ title: "Name cannot be empty", variant: "destructive" }); return; }
    if (trimmed.length > 60) { toast({ title: "Name too long", description: "Max 60 characters.", variant: "destructive" }); return; }
    setSavingName(true);
    try {
      const { error } = await supabase.from("app_settings").upsert({ key: "app_name", value: trimmed }, { onConflict: "key" });
      if (error) throw error;
      setSavedAppName(trimmed);
      toast({ title: "App name updated!", description: `Now showing "${trimmed}" across the app.` });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSavingName(false); }
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
    } finally { setSavingName(false); }
  };

  // ── SEO handlers ──
  const handleSaveSeo = async () => {
    const title = seoTitle.trim();
    const desc  = seoDesc.trim();
    if (!title) { toast({ title: "Title cannot be empty", variant: "destructive" }); return; }
    if (!desc)  { toast({ title: "Description cannot be empty", variant: "destructive" }); return; }
    setSavingSeo(true);
    try {
      await supabase.from("app_settings").upsert({ key: "seo_title", value: title }, { onConflict: "key" });
      await supabase.from("app_settings").upsert({ key: "seo_description", value: desc }, { onConflict: "key" });
      setSavedSeoTitle(title);
      setSavedSeoDesc(desc);
      // Apply immediately to document
      document.title = title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", desc);
      toast({ title: "SEO settings saved!", description: "Title and description updated." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSavingSeo(false); }
  };

  const handleResetSeo = async () => {
    setSeoTitle(DEFAULT_SEO_TITLE);
    setSeoDesc(DEFAULT_SEO_DESC);
    setSavingSeo(true);
    try {
      await supabase.from("app_settings").upsert({ key: "seo_title", value: DEFAULT_SEO_TITLE }, { onConflict: "key" });
      await supabase.from("app_settings").upsert({ key: "seo_description", value: DEFAULT_SEO_DESC }, { onConflict: "key" });
      setSavedSeoTitle(DEFAULT_SEO_TITLE);
      setSavedSeoDesc(DEFAULT_SEO_DESC);
      toast({ title: "SEO reset", description: "Reverted to default values." });
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    } finally { setSavingSeo(false); }
  };

  const displayUrl  = preview || currentLogoUrl;
  const nameChanged = appName.trim() !== savedAppName;
  const seoChanged  = seoTitle.trim() !== savedSeoTitle || seoDesc.trim() !== savedSeoDesc;

  const cardStyle = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: 20 };
  const btnPrimary = (active: boolean) => ({
    flex: 1, display: "flex", alignItems: "center" as const, justifyContent: "center" as const, gap: 8,
    padding: "11px 0", borderRadius: 12, border: "none",
    cursor: active ? "pointer" : "not-allowed",
    background: active ? `linear-gradient(135deg,${A1},${A2})` : T.input,
    color: active ? "white" : T.sub,
    fontSize: 14, fontWeight: 700, opacity: active ? 1 : 0.6,
    boxShadow: active ? `0 4px 16px ${A1}44` : "none",
  });
  const btnSecondary = (active: boolean) => ({
    display: "flex", alignItems: "center" as const, gap: 8,
    padding: "11px 16px", borderRadius: 12, border: `1px solid ${T.border}`,
    cursor: active ? "pointer" : "not-allowed",
    background: T.input, color: T.sub,
    fontSize: 13, fontWeight: 600, opacity: active ? 1 : 0.4,
  });

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "28px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.4px" }}>App Branding</h1>
          <p style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Customise app name, logo, and Google search appearance.</p>
        </div>

        {/* ── APP NAME ── */}
        <Card style={cardStyle}>
          <SectionHeader icon={Type} title="App Name" subtitle="Shown in navigation headers and footer" T={T} />
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: T.sub, fontSize: 13 }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading…
            </div>
          ) : (
            <>
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
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: T.sub }}>{appName.length}/60</span>
                {nameChanged && <span style={{ fontSize: 11, color: A1, fontWeight: 600 }}>Unsaved changes</span>}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleSaveName} disabled={savingName || !nameChanged || !appName.trim()} style={btnPrimary(!savingName && nameChanged && !!appName.trim())}>
                  {savingName ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                  {savingName ? "Saving…" : "Save Name"}
                </button>
                <button onClick={handleResetName} disabled={savingName || savedAppName === DEFAULT_APP_NAME} style={btnSecondary(!savingName && savedAppName !== DEFAULT_APP_NAME)}>
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            </>
          )}
        </Card>

        {/* ── LOGO ── */}
        <Card style={cardStyle}>
          <SectionHeader icon={ImageIcon} title="App Logo" subtitle="34×34 px icon shown next to the app name" T={T} />
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
          <div
            onClick={() => inputRef.current?.click()}
            style={{ border: `2px dashed ${T.border}`, borderRadius: 14, padding: "22px 20px", textAlign: "center", cursor: "pointer", marginBottom: 14 }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileChange({ target: { files: [f] } } as any); }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 3px" }}>Click to select or drag & drop</p>
            <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>PNG, JPG, SVG, WebP · max 2 MB · 512×512 recommended</p>
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
            <button onClick={handleUploadLogo} disabled={!file || uploading} style={btnPrimary(!!file && !uploading)}>
              {uploading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={16} />}
              {uploading ? "Uploading…" : "Save Logo"}
            </button>
            {currentLogoUrl && !preview && (
              <button onClick={handleRemoveLogo} disabled={removing} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 12, border: "1px solid rgba(239,68,68,.3)", cursor: removing ? "not-allowed" : "pointer", background: "rgba(239,68,68,.08)", color: "#f87171", fontSize: 14, fontWeight: 700 }}>
                {removing ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={16} />}
                {removing ? "Removing…" : "Remove"}
              </button>
            )}
          </div>
        </Card>

        {/* ── SEO SETTINGS ── */}
        <Card style={cardStyle}>
          <SectionHeader icon={Search} title="SEO & Search Appearance" subtitle="Controls what Google shows when users search for your site" T={T} />

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: T.sub, fontSize: 13 }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading…
            </div>
          ) : (
            <>
              {/* Google preview card */}
              <div style={{ marginBottom: 20, padding: "16px", borderRadius: 12, background: themeKey === "black" ? "#1e1e1e" : "#ffffff", border: `1px solid ${T.border}`, fontFamily: "Arial, sans-serif" }}>
                <p style={{ fontSize: 11, color: T.sub, margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Google Preview</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Globe size={14} color={T.sub} />
                  <span style={{ fontSize: 12, color: T.sub }}>freelancer-india.lovable.app</span>
                </div>
                <p style={{ fontSize: 17, color: "#1a73e8", margin: "0 0 4px", fontWeight: 400, lineHeight: 1.3, wordBreak: "break-word" as const }}>
                  {seoTitle.trim() || <span style={{ color: T.sub }}>Enter a page title…</span>}
                </p>
                <p style={{ fontSize: 13, color: themeKey === "black" ? "#9aa0a6" : "#4d5156", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {seoDesc.trim() || <span style={{ color: T.sub }}>Enter a description…</span>}
                </p>
              </div>

              {/* Page Title */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <FileText size={12} color={T.sub} />
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Page Title</label>
                  <span style={{ fontSize: 10, color: seoTitle.length > 60 ? "#f87171" : T.sub, marginLeft: "auto" }}>{seoTitle.length}/70 chars</span>
                </div>
                <input
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  maxLength={70}
                  placeholder={DEFAULT_SEO_TITLE}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1px solid ${seoChanged ? A1 + "66" : T.inputBdr}`, background: T.input, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
                <p style={{ fontSize: 11, color: T.sub, margin: "4px 0 0" }}>Ideal length: 50–60 characters</p>
              </div>

              {/* Meta Description */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <FileText size={12} color={T.sub} />
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Meta Description</label>
                  <span style={{ fontSize: 10, color: seoDesc.length > 160 ? "#f87171" : T.sub, marginLeft: "auto" }}>{seoDesc.length}/160 chars</span>
                </div>
                <textarea
                  value={seoDesc}
                  onChange={e => setSeoDesc(e.target.value)}
                  maxLength={160}
                  rows={3}
                  placeholder={DEFAULT_SEO_DESC}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1px solid ${seoChanged ? A1 + "66" : T.inputBdr}`, background: T.input, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
                />
                <p style={{ fontSize: 11, color: T.sub, margin: "4px 0 0" }}>Ideal length: 120–160 characters</p>
              </div>

              {seoChanged && (
                <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 10, background: `${A1}12`, border: `1px solid ${A1}33`, fontSize: 12, color: A1, fontWeight: 600 }}>
                  Unsaved changes — click "Save SEO" to apply
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleSaveSeo} disabled={savingSeo || !seoChanged} style={btnPrimary(!savingSeo && seoChanged)}>
                  {savingSeo ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                  {savingSeo ? "Saving…" : "Save SEO"}
                </button>
                <button onClick={handleResetSeo} disabled={savingSeo || (savedSeoTitle === DEFAULT_SEO_TITLE && savedSeoDesc === DEFAULT_SEO_DESC)} style={btnSecondary(!savingSeo && (savedSeoTitle !== DEFAULT_SEO_TITLE || savedSeoDesc !== DEFAULT_SEO_DESC))}>
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            </>
          )}
        </Card>

        {/* Tips */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Tips</p>
          {[
            "App name updates immediately in all navigation headers",
            "SEO title & description affect Google search results (may take 1–2 weeks to re-index)",
            "Keep page title under 60 characters to avoid truncation in search",
            "Keep description under 160 characters — Google cuts longer ones",
            "Use a square logo (512×512 px) with transparent background for best results",
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
