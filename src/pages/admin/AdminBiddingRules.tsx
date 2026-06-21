import { useState } from "react";
import { toast } from "sonner";
import { Gavel, Save, Plus, Trash2, Edit2, X } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};
const A1 = "#6366f1";
const RULES_KEY = "admin_bidding_rules_v1";

type CategoryRule = { id: string; category: string; minBid: number; maxBid: number; bidStep: number; maxBidsPerDay: number; antilowballFactor: number };
type GlobalConfig = { maxBidsPerFreelancer: number; bidCooldownMinutes: number; autoRejectBelowPercent: number; requireBidBreakdown: boolean; allowCounterOffer: boolean; bidVisibility: "all" | "employer_only" | "count_only" };

function defaultRules(): CategoryRule[] {
  return [
    { id: "r1", category: "Web Development", minBid: 500, maxBid: 500000, bidStep: 100, maxBidsPerDay: 20, antilowballFactor: 30 },
    { id: "r2", category: "Mobile App Development", minBid: 1000, maxBid: 1000000, bidStep: 500, maxBidsPerDay: 15, antilowballFactor: 35 },
    { id: "r3", category: "UI/UX Design", minBid: 500, maxBid: 200000, bidStep: 100, maxBidsPerDay: 25, antilowballFactor: 25 },
    { id: "r4", category: "Content Writing", minBid: 100, maxBid: 50000, bidStep: 50, maxBidsPerDay: 30, antilowballFactor: 20 },
    { id: "r5", category: "Digital Marketing", minBid: 500, maxBid: 300000, bidStep: 100, maxBidsPerDay: 20, antilowballFactor: 25 },
    { id: "r6", category: "Data Entry", minBid: 100, maxBid: 30000, bidStep: 50, maxBidsPerDay: 30, antilowballFactor: 15 },
  ];
}
function defaultGlobal(): GlobalConfig {
  return { maxBidsPerFreelancer: 50, bidCooldownMinutes: 30, autoRejectBelowPercent: 20, requireBidBreakdown: true, allowCounterOffer: true, bidVisibility: "count_only" };
}
function loadRules(): CategoryRule[] { try { const d = localStorage.getItem(RULES_KEY + "_cat"); if (d) return JSON.parse(d); } catch { } const s = defaultRules(); localStorage.setItem(RULES_KEY + "_cat", JSON.stringify(s)); return s; }
function loadGlobal(): GlobalConfig { try { const d = localStorage.getItem(RULES_KEY + "_global"); if (d) return JSON.parse(d); } catch { } const s = defaultGlobal(); localStorage.setItem(RULES_KEY + "_global", JSON.stringify(s)); return s; }
function saveRules(r: CategoryRule[]) { localStorage.setItem(RULES_KEY + "_cat", JSON.stringify(r)); }
function saveGlobal(g: GlobalConfig) { localStorage.setItem(RULES_KEY + "_global", JSON.stringify(g)); }

const AdminBiddingRules = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [rules, setRules] = useState<CategoryRule[]>(loadRules);
  const [global, setGlobal] = useState<GlobalConfig>(loadGlobal);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CategoryRule | null>(null);

  const openEdit = (r: CategoryRule) => { setEditId(r.id); setEditForm({ ...r }); };
  const saveEdit = () => {
    if (!editForm) return;
    const up = rules.map(r => r.id === editId ? editForm : r);
    setRules(up); saveRules(up); setEditId(null); setEditForm(null); toast.success("Rule updated");
  };
  const addRule = () => {
    const nr: CategoryRule = { id: `r${Date.now()}`, category: "New Category", minBid: 500, maxBid: 100000, bidStep: 100, maxBidsPerDay: 20, antilowballFactor: 25 };
    const up = [...rules, nr]; setRules(up); saveRules(up);
  };
  const delRule = (id: string) => { const up = rules.filter(r => r.id !== id); setRules(up); saveRules(up); };

  const saveGlobalConfig = () => { saveGlobal(global); toast.success("Global bidding config saved"); };
  const g = (k: keyof GlobalConfig, v: any) => setGlobal(p => ({ ...p, [k]: v }));

  const Toggle = ({ val, onToggle, label }: { val: boolean; onToggle: () => void; label: string }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <div onClick={onToggle} style={{ width: 38, height: 21, borderRadius: 11, background: val ? A1 : "rgba(148,163,184,.3)", position: "relative", cursor: "pointer" }}>
        <div style={{ position: "absolute", top: 2.5, left: val ? 18 : 2.5, width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "left .2s" }} />
      </div>
      <span style={{ fontSize: 13, color: T.text }}>{label}</span>
    </label>
  );

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1050, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Job Bidding Rules</h1>
          <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Configure bid limits, anti-lowball rules, and category-wise settings</p>
        </div>
        <button onClick={addRule} style={{ background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add Category Rule
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 28 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>Global Bidding Settings</div>
          {[{ l: "Max Bids Per Freelancer (lifetime)", k: "maxBidsPerFreelancer", type: "number" }, { l: "Bid Cooldown (minutes between bids)", k: "bidCooldownMinutes", type: "number" }, { l: "Auto-reject bids below (% of budget)", k: "autoRejectBelowPercent", type: "number" }].map(fi => (
            <div key={fi.k} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>{fi.l}</label>
              <input type={fi.type} value={(global as any)[fi.k]} onChange={e => g(fi.k as any, Number(e.target.value))} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, boxSizing: "border-box" as any }} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Bid Visibility</label>
            <select value={global.bidVisibility} onChange={e => g("bidVisibility", e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13 }}>
              <option value="all">Show all bids publicly</option>
              <option value="employer_only">Employer only sees bids</option>
              <option value="count_only">Show count only (hidden amounts)</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            <Toggle val={global.requireBidBreakdown} onToggle={() => g("requireBidBreakdown", !global.requireBidBreakdown)} label="Require bid breakdown (labor/expenses)" />
            <Toggle val={global.allowCounterOffer} onToggle={() => g("allowCounterOffer", !global.allowCounterOffer)} label="Allow counter-offers from employer" />
          </div>
          <button onClick={saveGlobalConfig} style={{ width: "100%", background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Save size={13} /> Save Global Settings
          </button>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>Anti-Lowball Rule</div>
          <div style={{ background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#fbbf24", marginBottom: 6 }}>How it works:</div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
              If a freelancer bids below <strong style={{ color: T.text }}>[Anti-lowball %]</strong> of the employer's budget, their bid is automatically flagged or rejected.
              <br /><br />
              Example: Budget ₹10,000 + Anti-lowball 30% → bids below ₹3,000 auto-rejected.
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 10 }}>Current config: {global.autoRejectBelowPercent}% of budget</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[10, 20, 25, 30, 40, 50].map(pct => (
              <div key={pct} onClick={() => g("autoRejectBelowPercent", pct)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: global.autoRejectBelowPercent === pct ? `${A1}15` : T.input, border: `1px solid ${global.autoRejectBelowPercent === pct ? A1 : T.border}`, transition: "all .2s" }}>
                <div style={{ width: 16, height: 16, borderRadius: 8, border: `2px solid ${global.autoRejectBelowPercent === pct ? A1 : T.border}`, background: global.autoRejectBelowPercent === pct ? A1 : "transparent" }} />
                <span style={{ fontSize: 13, color: T.text }}>{pct}% of budget</span>
                <span style={{ fontSize: 11, color: T.sub, marginLeft: "auto" }}>Budget ₹10K → reject below ₹{(10000 * pct / 100).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14, color: T.text }}>Category-wise Bid Rules</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["Category", "Min Bid (₹)", "Max Bid (₹)", "Bid Step (₹)", "Max/Day", "Anti-lowball %", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}20` }}>
                  {editId === r.id && editForm ? (
                    <>
                      <td colSpan={6} style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <input value={editForm.category} onChange={e => setEditForm(p => p ? { ...p, category: e.target.value } : p)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "6px 10px", fontSize: 12, width: 160 }} />
                          {[["minBid", "Min"], ["maxBid", "Max"], ["bidStep", "Step"], ["maxBidsPerDay", "Max/Day"], ["antilowballFactor", "AL%"]].map(([key, label]) => (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ fontSize: 11, color: T.sub }}>{label}:</span>
                              <input type="number" value={(editForm as any)[key]} onChange={e => setEditForm(p => p ? { ...p, [key]: Number(e.target.value) } : p)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "6px 10px", fontSize: 12, width: 80 }} />
                            </div>
                          ))}
                          <button onClick={saveEdit} style={{ background: `${A1}20`, border: `1px solid ${A1}44`, borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: A1, fontWeight: 700, fontSize: 12 }}>Save</button>
                          <button onClick={() => setEditId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={13} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: T.text }}>{r.category}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: T.sub }}>₹{r.minBid.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: T.sub }}>₹{r.maxBid.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: T.sub }}>₹{r.bidStep}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: T.sub }}>{r.maxBidsPerDay}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>{r.antilowballFactor}%</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => openEdit(r)} style={{ background: `${A1}15`, border: `1px solid ${A1}33`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: A1 }}><Edit2 size={11} /></button>
                          <button onClick={() => delRule(r.id)} style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#f87171" }}><Trash2 size={11} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBiddingRules;
