import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Plus, Trash2, Search, GripVertical, Eye, EyeOff, X, Crown } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};
const A1 = "#6366f1";
const SHOWCASE_KEY = "admin_talent_showcase_v1";

const SECTIONS = [
  { id: "top_picks", label: "Top Picks", color: "#6366f1", icon: "🏆" },
  { id: "rising_stars", label: "Rising Stars", color: "#f59e0b", icon: "⭐" },
  { id: "verified_experts", label: "Verified Experts", color: "#10b981", icon: "✅" },
];

type Featured = { userId: string; section: string; order: number; visible: boolean; addedAt: string; profile?: any };

function loadFeatured(): Featured[] {
  try { const d = localStorage.getItem(SHOWCASE_KEY); if (d) return JSON.parse(d); } catch { }
  return [];
}
function saveFeatured(f: Featured[]) { localStorage.setItem(SHOWCASE_KEY, JSON.stringify(f)); }

const AdminTalentShowcase = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const qc = useQueryClient();
  const [featured, setFeatured] = useState<Featured[]>(loadFeatured);
  const [activeSection, setActiveSection] = useState("top_picks");
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [addSection, setAddSection] = useState("top_picks");

  const { data: freelancers = [], isLoading } = useQuery({
    queryKey: ["admin-showcase-freelancers", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id,full_name,user_code,profile_photo_url,rating,total_earnings,user_type")
        .eq("user_type", "employee")
        .or(`full_name.cs.{${search}},user_code.cs.{${search}}`)
        .limit(10);
      return data || [];
    },
    enabled: search.trim().length > 1,
  });

  const sectionItems = featured.filter(f => f.section === activeSection)
    .sort((a, b) => a.order - b.order);

  const addFreelancer = (profile: any) => {
    if (featured.some(f => f.userId === profile.user_id && f.section === addSection)) {
      return toast.error("Already in this section");
    }
    const maxOrder = Math.max(0, ...featured.filter(f => f.section === addSection).map(f => f.order));
    const nf: Featured = { userId: profile.user_id, section: addSection, order: maxOrder + 1, visible: true, addedAt: new Date().toISOString(), profile };
    const up = [...featured, nf];
    setFeatured(up); saveFeatured(up);
    toast.success("Added to showcase"); setShowAdd(false); setSearch("");
  };

  const remove = (userId: string, section: string) => {
    const up = featured.filter(f => !(f.userId === userId && f.section === section));
    setFeatured(up); saveFeatured(up); toast.success("Removed from showcase");
  };

  const toggleVisible = (userId: string, section: string) => {
    const up = featured.map(f => f.userId === userId && f.section === section ? { ...f, visible: !f.visible } : f);
    setFeatured(up); saveFeatured(up);
  };

  const moveOrder = (userId: string, section: string, dir: -1 | 1) => {
    const items = featured.filter(f => f.section === section).sort((a, b) => a.order - b.order);
    const idx = items.findIndex(f => f.userId === userId);
    if (idx + dir < 0 || idx + dir >= items.length) return;
    const newItems = [...items];
    [newItems[idx], newItems[idx + dir]] = [newItems[idx + dir], newItems[idx]];
    newItems.forEach((item, i) => { item.order = i + 1; });
    const rest = featured.filter(f => f.section !== section);
    const up = [...rest, ...newItems];
    setFeatured(up); saveFeatured(up);
  };

  const secMeta = SECTIONS.find(s => s.id === activeSection)!;
  const bs = (c: string, bg: string) => ({ background: bg, color: c, border: `1px solid ${c}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 as any });

  return (
    <div style={{ padding: "24px 16px", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Talent Showcase</h1>
          <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Feature top freelancers on the homepage in curated sections</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add Freelancer
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {SECTIONS.map(sec => {
          const count = featured.filter(f => f.section === sec.id).length;
          const visible = featured.filter(f => f.section === sec.id && f.visible).length;
          return (
            <div key={sec.id} onClick={() => setActiveSection(sec.id)} style={{ background: T.card, border: `2px solid ${activeSection === sec.id ? sec.color : T.border}`, borderRadius: 12, padding: "16px", cursor: "pointer", textAlign: "center", transition: "all .2s" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{sec.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: activeSection === sec.id ? sec.color : T.text }}>{sec.label}</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{visible}/{count} visible</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{secMeta.icon}</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{secMeta.label}</span>
          <span style={bs(secMeta.color, `${secMeta.color}15`)}>{sectionItems.length} freelancers</span>
        </div>
        {sectionItems.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: T.sub }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌟</div>
            <div style={{ fontSize: 14 }}>No freelancers in this section yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Click "Add Freelancer" to feature someone</div>
          </div>
        ) : (
          <div>
            {sectionItems.map((item, idx) => (
              <div key={item.userId} style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}20`, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button onClick={() => moveOrder(item.userId, item.section, -1)} disabled={idx === 0} style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "transparent" : T.sub, fontSize: 10, padding: 0 }}>▲</button>
                  <span style={{ fontSize: 12, color: T.sub, textAlign: "center", fontWeight: 700 }}>{item.order}</span>
                  <button onClick={() => moveOrder(item.userId, item.section, 1)} disabled={idx === sectionItems.length - 1} style={{ background: "none", border: "none", cursor: idx === sectionItems.length - 1 ? "default" : "pointer", color: idx === sectionItems.length - 1 ? "transparent" : T.sub, fontSize: 10, padding: 0 }}>▼</button>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${secMeta.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: secMeta.color, flexShrink: 0 }}>
                  {item.profile?.profile_photo_url
                    ? <img src={item.profile.profile_photo_url} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} alt="" />
                    : ((item.profile?.full_name || [])[0] || "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{(item.profile?.full_name || []).join(" ") || "Freelancer"}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{(item.profile?.user_code || []).join("") || "—"}</div>
                </div>
                {item.profile?.rating && <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>★ {Number(item.profile.rating).toFixed(1)}</div>}
                <div style={{ fontSize: 11, color: T.sub }}>Added {safeFmt(item.addedAt, "dd MMM")}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => toggleVisible(item.userId, item.section)} title={item.visible ? "Hide" : "Show"} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: item.visible ? "#4ade80" : T.sub }}>
                    {item.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button onClick={() => remove(item.userId, item.section)} style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "#f87171" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: themeKey === "black" ? "#0f0f23" : "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, maxWidth: 460, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 17, color: T.text, margin: 0 }}>Add to Showcase</h2>
              <button onClick={() => { setShowAdd(false); setSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 6 }}>Section</label>
              <select value={addSection} onChange={e => setAddSection(e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13 }}>
                {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 6 }}>Search Freelancer</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px" }}>
                <Search size={13} color={T.sub} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Type name or code..." style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 13, flex: 1 }} />
              </div>
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {isLoading && <div style={{ padding: 16, textAlign: "center", color: T.sub }}>Searching...</div>}
              {freelancers.length === 0 && search.length > 1 && !isLoading && <div style={{ padding: 16, textAlign: "center", color: T.sub }}>No freelancers found</div>}
              {freelancers.map((f: any) => (
                <div key={f.user_id} onClick={() => addFreelancer(f)} style={{ padding: "11px 12px", borderRadius: 8, marginBottom: 6, cursor: "pointer", background: T.input, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${A1}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: A1 }}>
                    {((f.full_name || [])[0] || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{(f.full_name || []).join(" ")}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{(f.user_code || []).join("")}</div>
                  </div>
                  {f.rating && <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>★ {Number(f.rating).toFixed(1)}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTalentShowcase;
