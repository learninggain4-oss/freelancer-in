import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SlidersHorizontal, Save, Plus, Trash2, IndianRupee, Users, TrendingDown, Edit2, X } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};
const A1 = "#6366f1";
const TIER_KEY = "admin_commission_tiers_v1";

type Tier = { id: string; label: string; minEarnings: number; maxEarnings: number | null; rate: number; color: string };

function defaultTiers(): Tier[] {
  return [
    { id: "t1", label: "Starter", minEarnings: 0, maxEarnings: 10000, rate: 15, color: "#94a3b8" },
    { id: "t2", label: "Growing", minEarnings: 10000, maxEarnings: 100000, rate: 12, color: "#6366f1" },
    { id: "t3", label: "Established", minEarnings: 100000, maxEarnings: 500000, rate: 10, color: "#f59e0b" },
    { id: "t4", label: "Pro", minEarnings: 500000, maxEarnings: 1000000, rate: 7, color: "#10b981" },
    { id: "t5", label: "Elite", minEarnings: 1000000, maxEarnings: null, rate: 5, color: "#8b5cf6" },
  ];
}
function loadTiers(): Tier[] {
  try { const d = localStorage.getItem(TIER_KEY); if (d) return JSON.parse(d); } catch { }
  const s = defaultTiers(); localStorage.setItem(TIER_KEY, JSON.stringify(s)); return s;
}
function saveTiers(t: Tier[]) { localStorage.setItem(TIER_KEY, JSON.stringify(t)); }

const AdminCommissionTiers = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [tiers, setTiers] = useState<Tier[]>(loadTiers);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Tier | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["admin-commission-tier-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id,total_earnings,user_type").eq("user_type", "employee").limit(500);
      const users = data || [];
      return tiers.map(tier => ({
        ...tier,
        userCount: users.filter((u: any) => {
          const e = Number(u.total_earnings || 0);
          return e >= tier.minEarnings && (tier.maxEarnings === null || e < tier.maxEarnings);
        }).length,
      }));
    },
  });

  const openEdit = (t: Tier) => { setEditId(t.id); setEditForm({ ...t }); };
  const saveEdit = () => {
    if (!editForm) return;
    const up = tiers.map(t => t.id === editId ? editForm : t);
    setTiers(up); saveTiers(up); setEditId(null); setEditForm(null);
    toast.success("Tier updated");
  };

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const nt: Tier = { id: `t${Date.now()}`, label: "New Tier", minEarnings: last.maxEarnings || 0, maxEarnings: null, rate: 5, color: "#6366f1" };
    const up = [...tiers.slice(0, -1).map(t => ({ ...t, maxEarnings: t.maxEarnings })), nt];
    setTiers(up); saveTiers(up);
  };

  const delTier = (id: string) => {
    if (tiers.length <= 1) return toast.error("Need at least one tier");
    const up = tiers.filter(t => t.id !== id);
    setTiers(up); saveTiers(up);
  };

  const getFreelancerTier = (earnings: number) => tiers.find(t => earnings >= t.minEarnings && (t.maxEarnings === null || earnings < t.maxEarnings)) || tiers[0];

  const exampleFreelancers = [
    { name: "Rahul (New)", earnings: 5000 }, { name: "Priya (Growing)", earnings: 50000 },
    { name: "Amit (Pro)", earnings: 350000 }, { name: "Sneha (Elite)", earnings: 1500000 },
  ];

  return (
    <div style={{ padding: "24px 16px", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Commission Tier System</h1>
          <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Sliding scale commission — higher earnings = lower platform fees</p>
        </div>
        <button onClick={addTier} style={{ background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add Tier
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {tiers.map((tier, idx) => {
          const statTier = stats?.find(s => s.id === tier.id);
          const isEditing = editId === tier.id;
          return (
            <div key={tier.id} style={{ background: T.card, border: `2px solid ${tier.color}33`, borderRadius: 14, padding: "16px 20px" }}>
              {isEditing && editForm ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, alignItems: "end" }}>
                  {[{ l: "Tier Name", k: "label", type: "text" }, { l: "Min Earnings (₹)", k: "minEarnings", type: "number" }, { l: "Max Earnings (₹)", k: "maxEarnings", type: "number" }, { l: "Commission Rate (%)", k: "rate", type: "number" }].map(fi => (
                    <div key={fi.k}>
                      <label style={{ fontSize: 11, color: T.sub, display: "block", marginBottom: 4 }}>{fi.l}</label>
                      <input type={fi.type} value={(editForm as any)[fi.k] ?? ""} placeholder={fi.k === "maxEarnings" ? "Leave blank = unlimited" : ""} onChange={e => setEditForm(p => p ? { ...p, [fi.k]: fi.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value } : p)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, padding: "7px 10px", fontSize: 12, boxSizing: "border-box" as any }} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={saveEdit} style={{ flex: 1, background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 7, padding: "8px", cursor: "pointer", color: "#fff", fontWeight: 700 }}>Save</button>
                    <button onClick={() => setEditId(null)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", color: T.sub }}><X size={13} /></button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${tier.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: tier.color, flexShrink: 0 }}>{idx + 1}</div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: tier.color }}>{tier.label}</div>
                    <div style={{ fontSize: 12, color: T.sub }}>
                      ₹{tier.minEarnings.toLocaleString("en-IN")} — {tier.maxEarnings ? `₹${tier.maxEarnings.toLocaleString("en-IN")}` : "Unlimited"}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 900, fontSize: 28, color: tier.color }}>{tier.rate}%</div>
                    <div style={{ fontSize: 11, color: T.sub }}>commission</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 20, color: T.text }}>{statTier?.userCount || 0}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>freelancers</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(tier)} style={{ background: `${A1}15`, border: `1px solid ${A1}33`, borderRadius: 7, padding: "6px 10px", cursor: "pointer", color: A1 }}><Edit2 size={13} /></button>
                    <button onClick={() => delTier(tier.id)} style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 7, padding: "6px 10px", cursor: "pointer", color: "#f87171" }}><Trash2 size={13} /></button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>Commission Rate Chart</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tiers.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: T.sub, width: 90, flexShrink: 0 }}>{t.label}</span>
                <div style={{ flex: 1, height: 22, background: `${T.border}40`, borderRadius: 4, overflow: "hidden", position: "relative" }}>
                  <div style={{ height: "100%", width: `${(t.rate / 20) * 100}%`, background: t.color, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: t.color, width: 34 }}>{t.rate}%</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>Example Calculations</div>
          {exampleFreelancers.map(ex => {
            const tier = getFreelancerTier(ex.earnings);
            const commission = ex.earnings * (tier.rate / 100);
            const net = ex.earnings - commission;
            return (
              <div key={ex.name} style={{ background: T.input, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>{ex.name}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                  <span style={{ color: T.sub }}>Earnings: <strong style={{ color: T.text }}>₹{ex.earnings.toLocaleString("en-IN")}</strong></span>
                  <span style={{ color: tier.color }}>Tier: <strong>{tier.label} ({tier.rate}%)</strong></span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, marginTop: 4 }}>
                  <span style={{ color: "#f87171" }}>Commission: ₹{commission.toLocaleString("en-IN")}</span>
                  <span style={{ color: "#4ade80" }}>Net: ₹{net.toLocaleString("en-IN")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminCommissionTiers;
