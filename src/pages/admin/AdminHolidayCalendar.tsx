import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Plus, Trash2, X, IndianRupee } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { format, parseISO, isSameDay, getMonth } from "date-fns";

const TH = {
  black: { card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};
const A1 = "#6366f1";
const HOL_KEY = "admin_holidays_v1";

type Holiday = { id: string; name: string; date: string; type: "national" | "regional" | "platform"; region: string; skipPayouts: boolean; repeat: boolean };

function defaultHolidays(): Holiday[] {
  const y = new Date().getFullYear();
  return [
    { id: "h1", name: "Republic Day", date: `${y}-01-26`, type: "national", region: "All India", skipPayouts: true, repeat: true },
    { id: "h2", name: "Holi", date: `${y}-03-25`, type: "national", region: "All India", skipPayouts: false, repeat: false },
    { id: "h3", name: "Good Friday", date: `${y}-04-18`, type: "national", region: "All India", skipPayouts: false, repeat: false },
    { id: "h4", name: "Independence Day", date: `${y}-08-15`, type: "national", region: "All India", skipPayouts: true, repeat: true },
    { id: "h5", name: "Gandhi Jayanti", date: `${y}-10-02`, type: "national", region: "All India", skipPayouts: true, repeat: true },
    { id: "h6", name: "Diwali", date: `${y}-10-20`, type: "national", region: "All India", skipPayouts: true, repeat: false },
    { id: "h7", name: "Christmas", date: `${y}-12-25`, type: "national", region: "All India", skipPayouts: false, repeat: true },
    { id: "h8", name: "Onam", date: `${y}-08-26`, type: "regional", region: "Kerala", skipPayouts: false, repeat: false },
    { id: "h9", name: "Platform Maintenance", date: `${y}-12-31`, type: "platform", region: "All", skipPayouts: true, repeat: false },
  ];
}
function loadHolidays(): Holiday[] { try { const d = localStorage.getItem(HOL_KEY); if (d) return JSON.parse(d); } catch { } const s = defaultHolidays(); localStorage.setItem(HOL_KEY, JSON.stringify(s)); return s; }
function saveHolidays(h: Holiday[]) { localStorage.setItem(HOL_KEY, JSON.stringify(h)); }

const blank = (): Omit<Holiday, "id"> => ({ name: "", date: format(new Date(), "yyyy-MM-dd"), type: "national", region: "All India", skipPayouts: false, repeat: false });
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TYPE_COLORS: Record<string, string> = { national: "#6366f1", regional: "#f59e0b", platform: "#10b981" };

const AdminHolidayCalendar = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [holidays, setHolidays] = useState<Holiday[]>(loadHolidays);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Holiday, "id">>(blank());
  const [filter, setFilter] = useState("all");
  const f = (k: any, v: any) => setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.name.trim() || !form.date) return toast.error("Name and date required");
    const nh: Holiday = { ...form, id: `h${Date.now()}` };
    const up = [...holidays, nh].sort((a, b) => a.date.localeCompare(b.date));
    setHolidays(up); saveHolidays(up); setShowForm(false); setForm(blank()); toast.success("Holiday added");
  };

  const del = (id: string) => { const up = holidays.filter(h => h.id !== id); setHolidays(up); saveHolidays(up); };
  const togglePayout = (id: string) => { const up = holidays.map(h => h.id === id ? { ...h, skipPayouts: !h.skipPayouts } : h); setHolidays(up); saveHolidays(up); };

  const filtered = filter === "all" ? holidays : holidays.filter(h => h.type === filter);
  const payoutSkipCount = holidays.filter(h => h.skipPayouts).length;

  const monthGroups = MONTHS.reduce((acc, m, i) => {
    const mh = filtered.filter(h => { try { return getMonth(parseISO(h.date)) === i; } catch { return false; } });
    if (mh.length > 0) acc[m] = mh;
    return acc;
  }, {} as Record<string, Holiday[]>);

  const bs = (c: string, bg: string) => ({ background: bg, color: c, border: `1px solid ${c}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 as any });

  return (
    <div style={{ padding: "24px 16px", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Holiday Calendar</h1>
          <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Configure public holidays and payout skip dates for {new Date().getFullYear()}</p>
        </div>
        <button onClick={() => { setForm(blank()); setShowForm(true); }} style={{ background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add Holiday
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[{ l: "Total Holidays", v: holidays.length, c: "#6366f1" }, { l: "Payout Skip Days", v: payoutSkipCount, c: "#f87171" }, { l: "National Holidays", v: holidays.filter(h => h.type === "national").length, c: "#f59e0b" }].map(s => (
          <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 26, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 12, color: T.sub }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 18, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", width: "fit-content" }}>
        {[["all", "All"], ["national", "National"], ["regional", "Regional"], ["platform", "Platform"]].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} style={{ padding: "8px 16px", border: "none", cursor: "pointer", background: filter === key ? A1 : "transparent", color: filter === key ? "#fff" : T.sub, fontWeight: filter === key ? 700 : 500, fontSize: 13 }}>{label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {Object.entries(monthGroups).map(([month, items]) => (
          <div key={month} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontWeight: 800, fontSize: 14, color: T.text }}>{month} {new Date().getFullYear()}</div>
            {items.map(h => (
              <div key={h.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}20`, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ textAlign: "center", minWidth: 36 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: TYPE_COLORS[h.type] }}>{format(parseISO(h.date), "d")}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{h.name}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
                    <span style={bs(TYPE_COLORS[h.type], `${TYPE_COLORS[h.type]}15`)}>{h.type}</span>
                    {h.skipPayouts && <span style={bs("#f87171", "rgba(248,113,113,.12)")}>Skip Payouts</span>}
                    {h.repeat && <span style={bs("#94a3b8", "rgba(148,163,184,.12)")}>Yearly</span>}
                  </div>
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{h.region}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => togglePayout(h.id)} title="Toggle payout skip" style={{ background: h.skipPayouts ? "rgba(248,113,113,.1)" : T.input, border: `1px solid ${h.skipPayouts ? "rgba(248,113,113,.3)" : T.border}`, borderRadius: 5, padding: "3px 7px", cursor: "pointer", fontSize: 10, color: h.skipPayouts ? "#f87171" : T.sub }}>₹</button>
                  <button onClick={() => del(h.id)} style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 5, padding: "3px 7px", cursor: "pointer", color: "#f87171" }}><Trash2 size={10} /></button>
                </div>
              </div>
            ))}
          </div>
        ))}
        {Object.keys(monthGroups).length === 0 && (
          <div style={{ gridColumn: "1/-1", padding: 48, textAlign: "center", color: T.sub }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
            <div>No holidays found for the selected filter</div>
          </div>
        )}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: themeKey === "black" ? "#0f0f23" : "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, maxWidth: 420, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 17, color: T.text, margin: 0 }}>Add Holiday</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={20} /></button>
            </div>
            {[{ l: "Holiday Name", k: "name", t: "text" }, { l: "Date", k: "date", t: "date" }, { l: "Region", k: "region", t: "text" }].map(fi => (
              <div key={fi.k} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>{fi.l}</label>
                <input type={fi.t} value={(form as any)[fi.k]} onChange={e => f(fi.k, e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, boxSizing: "border-box" as any }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Type</label>
              <select value={form.type} onChange={e => f("type", e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13 }}>
                <option value="national">National Holiday</option>
                <option value="regional">Regional Holiday</option>
                <option value="platform">Platform Event</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              {[{ l: "Skip Payouts on this day", k: "skipPayouts" }, { l: "Repeat annually", k: "repeat" }].map(sw => (
                <label key={sw.k} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <div onClick={() => f(sw.k, !(form as any)[sw.k])} style={{ width: 36, height: 20, borderRadius: 10, background: (form as any)[sw.k] ? A1 : "rgba(148,163,184,.3)", position: "relative", cursor: "pointer" }}>
                    <div style={{ position: "absolute", top: 2, left: (form as any)[sw.k] ? 16 : 2, width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "left .2s" }} />
                  </div>
                  <span style={{ fontSize: 13, color: T.text }}>{sw.l}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px", cursor: "pointer", color: T.text, fontWeight: 600 }}>Cancel</button>
              <button onClick={submit} style={{ flex: 2, background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", color: "#fff", fontWeight: 700 }}>Add Holiday</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHolidayCalendar;
