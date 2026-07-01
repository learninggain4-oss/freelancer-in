import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Trash2, ImageIcon, Eye, EyeOff, ArrowUp, ArrowDown, Upload, Loader2, X } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { supabase } from "@/integrations/supabase/client";

const A1 = "#6366f1";
const BUCKET = "slideshow-banners";
const SETTINGS_KEY = "dashboard_slideshow_slides";

type Target = "all" | "freelancer" | "employer";

interface Slide {
  id: string;
  image_url: string;
  link_url: string;
  target: Target;
  sort_order: number;
  active: boolean;
}

const TH = {
  black: {
    card: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.08)",
    text: "#e2e8f0",
    sub: "#94a3b8",
    input: "rgba(255,255,255,.07)",
    bg: "#0f0f23",
  },
  white: {
    card: "#ffffff",
    border: "rgba(0,0,0,.08)",
    text: "#1e293b",
    sub: "#64748b",
    input: "#f8fafc",
    bg: "#f8fafc",
  },
  wb: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", bg: "#f8fafc" },
};

async function loadSlides(): Promise<Slide[]> {
  try {
    const { data } = await supabase.from("app_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
    if (data?.value) return JSON.parse(data.value);
  } catch {}
  return [];
}

async function saveSlides(slides: Slide[]) {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: SETTINGS_KEY, value: JSON.stringify(slides) }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

const AdminSlideshowManager = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newTarget, setNewTarget] = useState<Target>("all");
  const [newLink, setNewLink] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSlides().then((s) => {
      setSlides(s);
      setLoading(false);
    });
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const persist = async (updated: Slide[]) => {
    try {
      await saveSlides(updated);
      setSlides(updated);
    } catch (e: any) {
      toast.error("Save failed: " + e.message);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Only image files allowed");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max file size is 5MB");

    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleActualUpload = async () => {
    if (!selectedFile) return toast.error("Please select an image first");

    setUploading(true);
    try {
      const ext = selectedFile.name.split(".").pop();
      const filename = `slide_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, selectedFile, { upsert: false });
      if (upErr) {
        if (upErr.message?.includes("Bucket not found") || upErr.message?.includes("bucket")) {
          toast.error(
            "Storage bucket not set up. Please create a public bucket named 'slideshow-banners' in Supabase Storage.",
          );
        } else {
          toast.error("Upload failed: " + upErr.message);
        }
        return;
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      const image_url = urlData.publicUrl;

      const newSlide: Slide = {
        id: `s_${Date.now()}`,
        image_url,
        link_url: newLink.trim(),
        target: newTarget,
        sort_order: slides.length + 1,
        active: true,
      };

      const updated = [...slides, newSlide];
      await persist(updated);
      setNewLink("");
      handleCancelPreview();
      toast.success("Slide added!");
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPreview = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const toggle = async (id: string) => {
    const updated = slides.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    await persist(updated);
  };

  const remove = async (id: string, image_url: string) => {
    try {
      const filename = image_url.split("/").pop();
      if (filename) await supabase.storage.from(BUCKET).remove([filename]);
    } catch {}
    const updated = slides.filter((s) => s.id !== id).map((s, i) => ({ ...s, sort_order: i + 1 }));
    await persist(updated);
    toast.success("Slide removed");
  };

  const move = async (id: string, dir: "up" | "down") => {
    const idx = slides.findIndex((s) => s.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === slides.length - 1) return;
    const arr = [...slides];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    const updated = arr.map((s, i) => ({ ...s, sort_order: i + 1 }));
    await persist(updated);
  };

  const updateTarget = async (id: string, target: Target) => {
    const updated = slides.map((s) => (s.id === id ? { ...s, target } : s));
    await persist(updated);
  };

  const TARGET_LABELS: Record<Target, string> = { all: "Everyone", freelancer: "Freelancers", employer: "Employers" };

  return (
    <div style={{ padding: "24px 16px", maxWidth: "100%", margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Dashboard Slideshow</h1>
        <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>
          Manage image banners shown above the FlexPay Wallet card
        </p>
      </div>

      <div
        style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, marginBottom: 24 }}
      >
        <h2 style={{ fontWeight: 700, fontSize: 15, color: T.text, margin: "0 0 16px" }}>Add New Slide</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Show To</label>
            <select
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value as Target)}
              style={{
                width: "100%",
                background: T.input,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                color: T.text,
                padding: "8px 10px",
                fontSize: 13,
              }}
            >
              <option value="all">Everyone</option>
              <option value="freelancer">Freelancers Only</option>
              <option value="employer">Employers Only</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Link URL (optional)</label>
            <input
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://... or /freelancer/projects"
              style={{
                width: "100%",
                background: T.input,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                color: T.text,
                padding: "8px 10px",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />

        {previewUrl && (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 10,
              overflow: "hidden",
              border: `1px solid ${T.border}`,
              background: T.input,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Image Preview:</span>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                maxHeight: 250,
                background: "rgba(0,0,0,0.03)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <img
                src={previewUrl}
                alt="Selected preview"
                style={{ maxWidth: "100%", maxHeight: 250, objectFit: "contain" }}
              />
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!previewUrl ? (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                background: `linear-gradient(135deg,${A1},#8b5cf6)`,
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                cursor: "pointer",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Upload size={15} />
              Choose Image
            </button>
          ) : (
            <>
              <button
                onClick={handleActualUpload}
                disabled={uploading}
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 20px",
                  cursor: uploading ? "not-allowed" : "pointer",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? (
                  <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Upload size={15} />
                )}
                {uploading ? "Uploading..." : "Confirm & Upload Slide"}
              </button>
              <button
                onClick={handleCancelPreview}
                disabled={uploading}
                style={{
                  background: "none",
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: "10px 20px",
                  cursor: uploading ? "not-allowed" : "pointer",
                  color: T.text,
                  fontWeight: 700,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <X size={15} />
                Cancel
              </button>
            </>
          )}
        </div>
        <p style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>
          Recommended: 1920×1000px, JPG/PNG, max 5MB. Aspect ratio 16:5 works best.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: T.sub }}>Loading...</div>
      ) : slides.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: T.sub,
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
          }}
        >
          <ImageIcon size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontWeight: 600 }}>No slides yet</div>
          <div style={{ fontSize: 13 }}>Upload an image to get started</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...slides]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((slide, idx) => (
              <div
                key={slide.id}
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  display: "flex",
                  gap: 0,
                }}
              >
                <div
                  style={{
                    width: 140,
                    flexShrink: 0,
                    background: T.input,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={slide.image_url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "contain", minHeight: 80 }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: slide.active ? "#4ade80" : "#94a3b8",
                        background: slide.active ? "rgba(74,222,128,.12)" : "rgba(148,163,184,.12)",
                        borderRadius: 6,
                        padding: "2px 9px",
                        border: `1px solid ${slide.active ? "rgba(74,222,128,.3)" : "rgba(148,163,184,.3)"}`,
                      }}
                    >
                      {slide.active ? "Live" : "Hidden"}
                    </span>
                    <select
                      value={slide.target}
                      onChange={(e) => updateTarget(slide.id, e.target.value as Target)}
                      style={{
                        background: T.input,
                        border: `1px solid ${T.border}`,
                        borderRadius: 6,
                        color: T.text,
                        padding: "3px 8px",
                        fontSize: 12,
                      }}
                    >
                      <option value="all">Everyone</option>
                      <option value="freelancer">Freelancers</option>
                      <option value="employer">Employers</option>
                    </select>
                    <span style={{ fontSize: 11, color: T.sub }}>#{idx + 1}</span>
                  </div>
                  {slide.link_url && (
                    <div
                      style={{
                        fontSize: 11,
                        color: T.sub,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      🔗 {slide.link_url}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    padding: "12px",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => move(slide.id, "up")}
                    disabled={idx === 0}
                    title="Move Up"
                    style={{
                      background: "none",
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      padding: "5px",
                      cursor: "pointer",
                      color: T.sub,
                      display: "flex",
                      opacity: idx === 0 ? 0.3 : 1,
                    }}
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => move(slide.id, "down")}
                    disabled={idx === slides.length - 1}
                    title="Move Down"
                    style={{
                      background: "none",
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      padding: "5px",
                      cursor: "pointer",
                      color: T.sub,
                      display: "flex",
                      opacity: idx === slides.length - 1 ? 0.3 : 1,
                    }}
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => toggle(slide.id)}
                    title={slide.active ? "Hide" : "Show"}
                    style={{
                      background: "none",
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      padding: "5px",
                      cursor: "pointer",
                      color: slide.active ? "#fbbf24" : "#4ade80",
                      display: "flex",
                    }}
                  >
                    {slide.active ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    onClick={() => remove(slide.id, slide.image_url)}
                    title="Delete"
                    style={{
                      background: "rgba(248,113,113,.1)",
                      border: "1px solid rgba(248,113,113,.3)",
                      borderRadius: 6,
                      padding: "5px",
                      cursor: "pointer",
                      color: "#f87171",
                      display: "flex",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AdminSlideshowManager;
