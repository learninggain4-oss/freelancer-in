import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Loader2, Upload, Trash2, CheckCircle, Image as ImageIcon } from "lucide-react";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};

const A1 = "#6366f1";
const A2 = "#8b5cf6";
const BUCKET = "company-logos";
const LOGO_PATH = "app-logo/logo.png";
const SETTING_KEY = "app_logo_url";

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

  useEffect(() => {
    loadCurrentLogo();
  }, []);

  const loadCurrentLogo = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SETTING_KEY)
      .maybeSingle();
    setCurrentLogoUrl(data?.value ?? null);
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

  const handleUpload = async () => {
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
        .upsert({ key: SETTING_KEY, value: publicUrl }, { onConflict: "key" });

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

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await supabase.storage.from(BUCKET).remove([LOGO_PATH]);
      await supabase.from("app_settings").delete().eq("key", SETTING_KEY);
      setCurrentLogoUrl(null);
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      toast({ title: "Logo removed", description: "The default logo will be shown." });
    } catch (err: any) {
      toast({ title: "Remove failed", description: err.message, variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  const displayUrl = preview || currentLogoUrl;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "28px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.4px" }}>App Branding</h1>
          <p style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Upload a custom logo to display across the entire app.</p>
        </div>

        {/* Logo preview card */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Current Logo</p>

          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            {/* Logo preview box */}
            <div style={{ width: 80, height: 80, borderRadius: 18, border: `2px dashed ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", background: T.input, overflow: "hidden", flexShrink: 0 }}>
              {loading ? (
                <Loader2 size={22} color={T.sub} style={{ animation: "spin 1s linear infinite" }} />
              ) : displayUrl ? (
                <img src={displayUrl} alt="App Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 20 }}>🇮🇳</span>
                </div>
              )}
            </div>

            {/* Shown-in previews */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
                {displayUrl ? (preview ? "Preview (unsaved)" : "Active logo") : "Default logo (gradient icon)"}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Admin header", "Freelancer sidebar", "Employer sidebar"].map(loc => (
                  <span key={loc} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: `${A1}20`, color: A1, fontWeight: 700 }}>{loc}</span>
                ))}
              </div>
            </div>
          </div>

          {preview && (
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: `${A1}18`, border: `1px solid ${A1}33`, fontSize: 12, color: A1, fontWeight: 600 }}>
              Unsaved — click "Save Logo" to apply this image
            </div>
          )}
        </div>

        {/* Upload card */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Upload New Logo</p>

          <div
            onClick={() => inputRef.current?.click()}
            style={{ border: `2px dashed ${T.border}`, borderRadius: 14, padding: "28px 20px", textAlign: "center", cursor: "pointer", marginBottom: 16 }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const fakeEv = { target: { files: [f] } } as any; handleFileChange(fakeEv); } }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${A1}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <ImageIcon size={22} color={A1} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>Click to select or drag & drop</p>
            <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>PNG, JPG, SVG, WebP — max 2 MB</p>
            <p style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Recommended: 512×512 px, transparent background</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {file && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: T.input, marginBottom: 14, fontSize: 12, color: T.text }}>
              <CheckCircle size={14} color="#4ade80" />
              <span style={{ flex: 1 }}>{file.name}</span>
              <span style={{ color: T.sub }}>{(file.size / 1024).toFixed(0)} KB</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 12, border: "none", cursor: file && !uploading ? "pointer" : "not-allowed", background: file && !uploading ? `linear-gradient(135deg,${A1},${A2})` : T.input, color: file && !uploading ? "white" : T.sub, fontSize: 14, fontWeight: 700, opacity: !file || uploading ? 0.6 : 1, boxShadow: file && !uploading ? `0 4px 16px ${A1}44` : "none" }}
            >
              {uploading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={16} />}
              {uploading ? "Uploading…" : "Save Logo"}
            </button>

            {currentLogoUrl && !preview && (
              <button
                onClick={handleRemove}
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
            "Use a square image (512×512 px) for best results",
            "PNG with transparent background looks best on all themes",
            "The logo appears as a 34×34 px icon in the navigation bar",
            "Changes are visible immediately after saving",
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
