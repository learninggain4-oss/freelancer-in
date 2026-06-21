import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, Plus, Edit2, Trash2, X, Eye, EyeOff, Calendar, Clock } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";
import { format, isPast, isFuture } from "date-fns";

const TH = {
  black: { card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};
const A1 = "#6366f1";
const BANNER_KEY = "admin_banners_v1";

type Banner = { id: string; type: "banner" | "popup" | "toast"; title: string; message: string; ctaText: string; ctaUrl: string; target: "all" | "freelancer" | "employer"; priority: number; bgColor: string; textColor: string; startAt: string; endAt: string; active: boolean; createdAt: string };

function seedBanners(): Banner[] {
  return [
    { id: "b1", type: "banner", title: "🎉 New Feature: Skill Badges", message: "Complete your profile and earn skill badges to stand out from the crowd!", ctaText: "Update Profile", ctaUrl: "/profile", target: "freelancer", priority: 1, bgColor: "#6366f1", textColor: "#ffffff", startAt: new Date().toISOString(), endAt: new Date(Date.now() + 86400000 * 7).toISOString(), active: true, createdAt: new Date().toISOString() },
    { id: "b2", type: "popup", title: "Post Your First Job Free! 🚀", message: "Limited time offer: Post your first job absolutely free. Find top Indian freelancers today.", ctaText: "Post Job Now", ctaUrl: "/post-job", target: "employer", priority: 1, bgColor: "#10b981", textColor: "#ffffff", startAt: new Date().toISOString(), endAt: new Date(Date.now() + 86400000 * 3).toISOString(), active: true, createdAt: new Date().toISOString() },
    { id: "b3", type: "toast", title: "Payout day!", message: "Withdrawals are being processed today. Check your bank account.", ctaText: "View Wallet", ctaUrl: "/wallet", target: "freelancer", priority: 2, bgColor: "#f59e0b", textColor: "#000000", startAt: new Date(Date.now() + 86400000 * 2).toISOString(), endAt: new Date(Date.now() + 86400000 * 2 + 3600000 * 12).toISOString(), active: false, createdAt: new Date().toISOString() },
  ];
}
function loadBanners(): Banner[] { try { const d = localStorage.getItem(BANNER_KEY); if (d) return JSON.parse(d); } catch { } const s = seedBanners(); localStorage.setItem(BANNER_KEY, JSON.stringify(s)); return s; }
function saveBanners(b: Banner[]) { localStorage.setItem(BANNER_KEY, JSON.stringify(b)); }

const blankBanner = (): Omit<Banner, "id" | "createdAt"> => ({ type: "banner", title: "", message: "", ctaText: "", ctaUrl: "", target: "all", priority: 1, bgColor: "#6366f1", textColor: "#ffffff", startAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"), endAt: format(new Date(Date.now() + 86400000 * 7), "yyyy-MM-dd'T'HH:mm"), active: true });

const COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#000000", "#1e293b"];

const AdminBannerManager = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [banners, setBanners] = useState<Banner[]>(loadBanners);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ReturnType<typeof blankBanner>>(blankBanner());
  const f = (k: any, v: any) => setForm(p => ({ ...p, [k]: v }));

  const getStatus = (b: Banner) => {
    if (!b.active) return { label: "Inactive", color: "#94a3b8", bg: "rgba(148,163,184,.12)" };
    if (isFuture(new Date(b.startAt))) return { label: "Scheduled", color: "#fbbf24", bg: "rgba(251,191,36,.12)" };
    if (isPast(new Date(b.endAt))) return { label: "Expired", color: "#f87171", bg: "rgba(248,113,113,.12)" };
    return { label: "Live", color: "#4ade80", bg: "rgba(74,222,128,.12)" };
  };

  const submit = () => {
    if (!form.title.trim() || !form.message.trim()) return toast.error("Title and message required");
    if (editId) {
      const up = banners.map(b => b.id === editId ? { ...b, ...form } : b); setBanners(up); saveBanners(up); toast.success("Banner updated");
    } else {
      const nb: Banner = { ...form, id: `b${Date.now()}`, createdAt: new Date().toISOString() };
      const up = [...banners, nb]; setBanners(up); saveBanners(up); toast.success("Banner created");
    }
    setShowForm(false); setEditId(null);
  };
  const openEdit = (b: Banner) => { setForm({ type: b.type, title: b.title, message: b.message, ctaText: b.ctaText, ctaUrl: b.ctaUrl, target: b.target, priority: b.priority, bgColor: b.bgColor, textColor: b.textColor, startAt: b.startAt.slice(0, 16), endAt: b.endAt.slice(0, 16), active: b.active }); setEditId(b.id); setShowForm(true); };
  const toggle = (id: string) => { const up = banners.map(b => b.id === id ? { ...b, active: !b.active } : b); setBanners(up); saveBanners(up); };
  const del = (id: string) => { const up = banners.filter(b => b.id !== id); setBanners(up); saveBanners(up); };

  const TYPE_META: Record<string, { icon: string; label: string }> = { banner: { icon: "📢", label: "Banner" }, popup: { icon: "🪟", label: "Popup" }, toast: { icon: "🔔", label: "Toast" } };
  const bs = (c: string, bg: string) => ({ background: bg, color: c, border: `1px solid ${c}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 as any });

  const liveCount = banners.filter(b => getStatus(b).label === "Live").length;
  const scheduledCount = banners.filter(b => getStatus(b).label === "Scheduled").length;

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Banners & Popups</h1>
          <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Schedule homepage banners, popups, and toast notifications</p>
        </div>
        <button onClick={() => { setForm(blankBanner()); setEditId(null); setShowForm(true); }} style={{ background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> New Banner
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[{ l: "Total", v: banners.length, c: "#6366f1" }, { l: "Live Now", v: liveCount, c: "#4ade80" }, { l: "Scheduled", v: scheduledCount, c: "#fbbf24" }, { l: "Inactive", v: banners.filter(b => !b.active).length, c: "#94a3b8" }].map(s => (
          <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: T.sub }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {banners.sort((a, b) => a.priority - b.priority).map(banner => {
          const status = getStatus(banner);
          const tm = TYPE_META[banner.type];
          return (
            <div key={banner.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "5px 16px", background: banner.bgColor, color: banner.textColor, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{tm.icon} {tm.label} Preview:</span>
                <span style={{ fontWeight: 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{banner.title} — {banner.message.slice(0, 60)}{banner.message.length > 60 ? "..." : ""}</span>
                {banner.ctaText && <span style={{ background: banner.textColor + "22", border: `1px solid ${banner.textColor}44`, borderRadius: 4, padding: "1px 8px", fontSize: 11 }}>{banner.ctaText} →</span>}
              </div>
              <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
                    <span style={bs(status.color, status.bg)}>{status.label}</span>
                    <span style={bs("#6366f1", "rgba(99,102,241,.12)")}>{tm.icon} {tm.label}</span>
                    <span style={bs("#94a3b8", "rgba(148,163,184,.12)")}>{banner.target === "all" ? "Everyone" : banner.target === "freelancer" ? "Freelancers" : "Employers"}</span>
                    <span style={{ fontSize: 11, color: T.sub }}>Priority {banner.priority}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub }}>
                    <Calendar size={10} style={{ display: "inline", marginRight: 4 }} />
                    {safeFmt(banner.startAt, "dd MMM HH:mm")} → {safeFmt(banner.endAt, "dd MMM HH:mm")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => toggle(banner.id)} style={{ background: banner.active ? "rgba(248,113,113,.1)" : "rgba(74,222,128,.1)", border: `1px solid ${banner.active ? "rgba(248,113,113,.3)" : "rgba(74,222,128,.3)"}`, borderRadius: 7, padding: "6px 12px", cursor: "pointer", color: banner.active ? "#f87171" : "#4ade80", fontSize: 12, fontWeight: 700 }}>{banner.active ? "Deactivate" : "Activate"}</button>
                  <button onClick={() => openEdit(banner)} style={{ background: `${A1}15`, border: `1px solid ${A1}33`, borderRadius: 7, padding: "6px 10px", cursor: "pointer", color: A1 }}><Edit2 size={13} /></button>
                  <button onClick={() => del(banner.id)} style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 7, padding: "6px 10px", cursor: "pointer", color: "#f87171" }}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: themeKey === "black" ? "#0f0f23" : "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 17, color: T.text, margin: 0 }}>{editId ? "Edit" : "New"} Banner</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[{ l: "Type", k: "type", opts: ["banner", "popup", "toast"] }, { l: "Target", k: "target", opts: ["all", "freelancer", "employer"] }].map(se => (
                <div key={se.k}>
                  <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>{se.l}</label>
                  <select value={(form as any)[se.k]} onChange={e => f(se.k, e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "7px 10px", fontSize: 13 }}>
                    {se.opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Title</label>
                <input value={form.title} onChange={e => f("title", e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "7px 10px", fontSize: 13, boxSizing: "border-box" as any }} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Message</label>
                <textarea value={form.message} onChange={e => f("message", e.target.value)} rows={3} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "7px 10px", fontSize: 13, resize: "vertical", boxSizing: "border-box" as any }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>CTA Button Text</label>
                <input value={form.ctaText} onChange={e => f("ctaText", e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "7px 10px", fontSize: 13, boxSizing: "border-box" as any }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>CTA URL</label>
                <input value={form.ctaUrl} onChange={e => f("ctaUrl", e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "7px 10px", fontSize: 13, boxSizing: "border-box" as any }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Start Date/Time</label>
                <input type="datetime-local" value={form.startAt} onChange={e => f("startAt", e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "7px 10px", fontSize: 13, boxSizing: "border-box" as any }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>End Date/Time</label>
                <input type="datetime-local" value={form.endAt} onChange={e => f("endAt", e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "7px 10px", fontSize: 13, boxSizing: "border-box" as any }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Priority (1=highest)</label>
                <input type="number" min={1} max={10} value={form.priority} onChange={e => f("priority", Number(e.target.value))} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "7px 10px", fontSize: 13, boxSizing: "border-box" as any }} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 6 }}>Background Color</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {COLORS.map(c => <button key={c} onClick={() => f("bgColor", c)} style={{ width: 28, height: 28, borderRadius: 6, background: c, border: `3px solid ${form.bgColor === c ? "#fff" : "transparent"}`, cursor: "pointer", outline: form.bgColor === c ? `2px solid ${c}` : "none" }} />)}
              </div>
            </div>
            <div style={{ marginTop: 14, padding: "8px 12px", background: form.bgColor, borderRadius: 8, color: form.textColor, fontSize: 12, fontWeight: 600 }}>
              Preview: {form.title || "Banner Title"} — {form.message.slice(0, 50) || "Message..."}{form.ctaText && ` [${form.ctaText}]`}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px", cursor: "pointer", color: T.text, fontWeight: 600 }}>Cancel</button>
              <button onClick={submit} style={{ flex: 2, background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", color: "#fff", fontWeight: 700 }}>{editId ? "Save" : "Create Banner"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBannerManager;
