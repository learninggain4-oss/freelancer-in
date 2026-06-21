import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Brain, CheckCircle2, Clock, Star, Plus, BarChart3 } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const assessments = [
  { id:"SA001", skill:"React.js",      questions:30, duration:"45 min", passScore:70, taken:4820, passRate:68, status:"Active" },
  { id:"SA002", skill:"Node.js",       questions:25, duration:"40 min", passScore:70, taken:3210, passRate:72, status:"Active" },
  { id:"SA003", skill:"UI/UX Design",  questions:20, duration:"60 min", passScore:75, taken:2140, passRate:58, status:"Active" },
  { id:"SA004", skill:"AI/ML Basics",  questions:35, duration:"60 min", passScore:80, taken:1890, passRate:44, status:"Active" },
  { id:"SA005", skill:"Content Writing",questions:15,duration:"30 min", passScore:65, taken:2800, passRate:81, status:"Active" },
  { id:"SA006", skill:"Flutter Dev",   questions:28, duration:"45 min", passScore:70, taken:1540, passRate:61, status:"Draft" },
];

const recentAttempts = [
  { user:"Priya M.",  skill:"React.js", score:84, passed:true,  date:"Today" },
  { user:"Arjun D.",  skill:"AI/ML",    score:62, passed:false, date:"Today" },
  { user:"Sneha R.",  skill:"UI/UX",    score:78, passed:true,  date:"Yesterday" },
  { user:"Vikram S.", skill:"Node.js",  score:91, passed:true,  date:"Yesterday" },
];

export default function AdminSkillAssessment() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [tab, setTab] = useState<"tests"|"results"|"stats">("tests");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Skill Assessment Manager</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Create and manage skill tests to verify freelancer expertise and award verified badges.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> New Assessment
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Assessments", value:"6", color:"#60a5fa", icon:Brain },
          { label:"Tests Taken MTD", value:"16,400", color:"#a78bfa", icon:CheckCircle2 },
          { label:"Avg Pass Rate", value:"64%", color:"#4ade80", icon:Star },
          { label:"Badges Awarded", value:"10,496", color:"#fbbf24", icon:BarChart3 },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div>
                <p className="text-lg font-bold" style={{ color:T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor:T.border }}>
        {(["tests","results","stats"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color:tab===t?A1:T.sub, borderBottom:tab===t?`2px solid ${A1}`:"2px solid transparent" }}>
            {t==="tests"?"All Tests":t==="results"?"Recent Results":"Statistics"}
          </button>
        ))}
      </div>

      {tab==="tests" && (
        <div className="space-y-3">
          {assessments.map(a => (
            <div key={a.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-sm" style={{ color:T.text }}>{a.skill}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:a.status==="Active"?"rgba(74,222,128,.12)":"rgba(251,191,36,.12)", color:a.status==="Active"?"#4ade80":"#fbbf24" }}>{a.status}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap text-xs" style={{ color:T.sub }}>
                    <span>{a.questions} questions</span>
                    <span><Clock className="h-3 w-3 inline mr-1" />{a.duration}</span>
                    <span>Pass: {a.passScore}%</span>
                    <span>{a.taken.toLocaleString()} taken</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold" style={{ color:a.passRate>=70?"#4ade80":a.passRate>=55?"#fbbf24":"#f87171" }}>{a.passRate}%</p>
                  <p className="text-[10px]" style={{ color:T.sub }}>pass rate</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>Edit Questions</button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>View Attempts</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="results" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor:T.border }}>
                {["User","Skill","Score","Result","Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentAttempts.map((r,i) => (
                <tr key={i} className="border-b" style={{ borderColor:T.border }}>
                  <td className="px-4 py-3 font-bold" style={{ color:T.text }}>{r.user}</td>
                  <td className="px-4 py-3" style={{ color:T.sub }}>{r.skill}</td>
                  <td className="px-4 py-3 font-bold font-mono" style={{ color:r.passed?"#4ade80":"#f87171" }}>{r.score}%</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:r.passed?"rgba(74,222,128,.12)":"rgba(248,113,113,.12)", color:r.passed?"#4ade80":"#f87171" }}>
                      {r.passed?"Passed":"Failed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color:T.sub }}>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==="stats" && (
        <div className="space-y-4">
          {assessments.map(a => (
            <div key={a.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color:T.text }}>{a.skill}</span>
                <span className="text-sm font-bold" style={{ color:a.passRate>=70?"#4ade80":a.passRate>=55?"#fbbf24":"#f87171" }}>{a.passRate}%</span>
              </div>
              <div className="h-3 rounded-full" style={{ background:`${A1}12` }}>
                <div className="h-3 rounded-full" style={{ width:`${a.passRate}%`, background:a.passRate>=70?"#4ade80":a.passRate>=55?"#fbbf24":"#f87171" }} />
              </div>
              <p className="text-xs mt-1" style={{ color:T.sub }}>{a.taken.toLocaleString()} attempts</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
