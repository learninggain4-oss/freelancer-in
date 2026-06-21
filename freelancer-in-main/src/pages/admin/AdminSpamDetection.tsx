import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { ShieldAlert, Filter, ToggleLeft, ToggleRight, Ban, CheckCircle2 } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type SpamRule = { id:string; name:string; description:string; enabled:boolean; count:number };

const seedRules: SpamRule[] = [
  { id:"s1", name:"Keyword Blocklist", description:"Block messages containing predefined spam keywords", enabled:true, count:842 },
  { id:"s2", name:"External Link Filter", description:"Flag/block messages with external URLs from new users", enabled:true, count:310 },
  { id:"s3", name:"Phone Number Sharing", description:"Detect and mask phone numbers in chat", enabled:true, count:194 },
  { id:"s4", name:"Email Sharing Detection", description:"Detect and warn when email shared in chat", enabled:true, count:88 },
  { id:"s5", name:"Repeat Message Flood", description:"Block same message sent >3 times in 1 min", enabled:true, count:56 },
  { id:"s6", name:"Low-Quality Bid Filter", description:"Flag bids with copy-pasted generic text", enabled:false, count:0 },
  { id:"s7", name:"Fake Review Detection", description:"Detect reviews with suspiciously similar phrasing", enabled:true, count:23 },
];

const flagged = [
  { type:"Message", user:"user_4821", content:"Contact me on WhatsApp: 9876XXXXX0", action:"Masked", time:"5 min ago" },
  { type:"Bid",     user:"user_3310", content:"I am expert in all works. Hire me now! Check fiverr.com/...", action:"Flagged", time:"18 min ago" },
  { type:"Review",  user:"user_9002", content:"Very good service very good service very good service", action:"Hidden", time:"1 hr ago" },
  { type:"Message", user:"user_1144", content:"Send me payment to UPI: spam@pay", action:"Blocked", time:"2 hr ago" },
];

export default function AdminSpamDetection() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [rules, setRules] = useState<SpamRule[]>(seedRules);
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState<string[]>(["casino","guaranteed earn","mlm","pyramid","click here","free money"]);

  const toggle = (id: string) => setRules(prev => prev.map(r => r.id===id ? {...r, enabled:!r.enabled} : r));
  const addKeyword = () => { if(keyword.trim()) { setKeywords(prev => [...prev, keyword.trim()]); setKeyword(""); } };
  const removeKeyword = (k: string) => setKeywords(prev => prev.filter(x => x!==k));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Spam Detection Settings</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Configure spam filters for chat, bids, and reviews across the platform.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Spam Blocked Today", value:"1,513", color:"#f87171" },
          { label:"Active Rules", value:`${rules.filter(r=>r.enabled).length}/${rules.length}`, color:"#4ade80" },
          { label:"False Positive Rate", value:"1.4%", color:"#fbbf24" },
          { label:"Blocked Last 30d", value:"18,402", color:"#60a5fa" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <p className="text-2xl font-bold" style={{ color:s.color }}>{s.value}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest mt-1" style={{ color:T.sub }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-bold" style={{ color:T.text }}>Detection Rules</h3>
          {rules.map(rule => (
            <div key={rule.id} className="rounded-2xl border p-4" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-sm" style={{ color:T.text }}>{rule.name}</p>
                  <p className="text-xs mt-0.5" style={{ color:T.sub }}>{rule.description}</p>
                  {rule.count>0 && <p className="text-xs mt-1" style={{ color:"#f87171" }}>{rule.count} blocked this month</p>}
                </div>
                <button onClick={() => toggle(rule.id)} className="shrink-0">
                  {rule.enabled
                    ? <ToggleRight className="h-7 w-7" style={{ color:A1 }} />
                    : <ToggleLeft className="h-7 w-7" style={{ color:T.sub }} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold mb-3" style={{ color:T.text }}>Keyword Blocklist</h3>
            <div className="flex gap-2 mb-3">
              <input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Add keyword..." onKeyDown={e=>e.key==="Enter"&&addKeyword()}
                className="flex-1 px-3 py-2 rounded-xl text-sm border" style={{ background:T.input, borderColor:T.border, color:T.text }} />
              <button onClick={addKeyword} className="px-3 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map(k => (
                <div key={k} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold" style={{ background:"rgba(248,113,113,.12)", color:"#f87171" }}>
                  {k}
                  <button onClick={() => removeKeyword(k)} className="ml-1 hover:opacity-70">×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold mb-3" style={{ color:T.text }}>Recently Flagged</h3>
            <div className="space-y-2">
              {flagged.map((f,i) => (
                <div key={i} className="p-3 rounded-xl border" style={{ borderColor:T.border }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background:`${A1}15`, color:A1 }}>{f.type}</span>
                    <span className="text-xs" style={{ color:T.sub }}>{f.time}</span>
                  </div>
                  <p className="text-xs truncate" style={{ color:T.text }}>"{f.content}"</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Ban className="h-3 w-3" style={{ color:"#f87171" }} />
                    <span className="text-[10px] font-bold" style={{ color:"#f87171" }}>{f.action}</span>
                    <span className="text-[10px]" style={{ color:T.sub }}>· {f.user}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
