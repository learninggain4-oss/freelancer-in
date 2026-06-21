import { useState } from "react";
import { toast } from "sonner";
import { Flag, Search, Eye, CheckCircle2, XCircle, AlertTriangle, MessageSquare, User, Briefcase, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const A1 = "#6366f1";
const MOD_KEY = "admin_moderation_v1";
const THRESH_KEY = "admin_mod_thresholds_v1";

type Report = {
  id:string; type:"message"|"profile"|"job"|"review"; contentId:string; reportedBy:string;
  targetName:string; reason:string; description:string; status:"pending"|"reviewed"|"actioned"|"dismissed";
  severity:"low"|"medium"|"high"; createdAt:string; actionTaken?:string;
};

type Thresholds = { autoFlagCount:number; autoDisableCount:number; badWords:string[] };

function defaultThresholds():Thresholds { return {autoFlagCount:3,autoDisableCount:10,badWords:["spam","fake","fraud","scam"]}; }
function loadThresh():Thresholds { try{const d=localStorage.getItem(THRESH_KEY);if(d)return JSON.parse(d);}catch{}const s=defaultThresholds();localStorage.setItem(THRESH_KEY,JSON.stringify(s));return s; }
function saveThresh(t:Thresholds){localStorage.setItem(THRESH_KEY,JSON.stringify(t));}

function seed():Report[] {
  return [
    {id:"m1",type:"message",contentId:"msg1",reportedBy:"Rahul Kumar",targetName:"Fake Employer",reason:"Spam",description:"Sending promotional messages repeatedly",status:"pending",severity:"medium",createdAt:new Date(Date.now()-86400000*1).toISOString()},
    {id:"m2",type:"profile",contentId:"usr2",reportedBy:"Priya Sharma",targetName:"Suspicious Profile",reason:"Fake Identity",description:"Profile photo and details appear stolen",status:"pending",severity:"high",createdAt:new Date(Date.now()-86400000*2).toISOString()},
    {id:"m3",type:"job",contentId:"job3",reportedBy:"Amit Singh",targetName:"Misleading Job Post",reason:"Fraudulent Job",description:"Job description doesn't match actual work",status:"reviewed",severity:"high",createdAt:new Date(Date.now()-86400000*3).toISOString()},
    {id:"m4",type:"review",contentId:"rev4",reportedBy:"Sneha Patel",targetName:"Fake Review",reason:"Inaccurate Review",description:"Review is from a fake account",status:"actioned",severity:"low",createdAt:new Date(Date.now()-86400000*5).toISOString(),actionTaken:"Review removed"},
    {id:"m5",type:"message",contentId:"msg5",reportedBy:"Vikram Dev",targetName:"Abusive User",reason:"Harassment",description:"Sending abusive messages after project rejection",status:"dismissed",severity:"low",createdAt:new Date(Date.now()-86400000*7).toISOString(),actionTaken:"Warning issued"},
  ];
}
function load():Report[]{try{const d=localStorage.getItem(MOD_KEY);if(d)return JSON.parse(d);}catch{}const s=seed();localStorage.setItem(MOD_KEY,JSON.stringify(s));return s;}
function save(r:Report[]){localStorage.setItem(MOD_KEY,JSON.stringify(r));}

const PAGE_SIZE=8;
const SEVERITY_META:Record<string,{color:string;bg:string}>={
  low:{color:"#60a5fa",bg:"rgba(96,165,250,.12)"},
  medium:{color:"#fbbf24",bg:"rgba(251,191,36,.12)"},
  high:{color:"#f87171",bg:"rgba(248,113,113,.12)"},
};
const STATUS_META:Record<string,{color:string;bg:string;label:string}>={
  pending:{color:"#fbbf24",bg:"rgba(251,191,36,.12)",label:"Pending"},
  reviewed:{color:"#60a5fa",bg:"rgba(96,165,250,.12)",label:"Reviewed"},
  actioned:{color:"#f87171",bg:"rgba(248,113,113,.12)",label:"Actioned"},
  dismissed:{color:"#94a3b8",bg:"rgba(148,163,184,.12)",label:"Dismissed"},
};
const TYPE_ICON:Record<string,any>={message:MessageSquare,profile:User,job:Briefcase,review:Flag};

const AdminContentModeration = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [reports,setReports]=useState<Report[]>(load);
  const [thresh,setThresh]=useState<Thresholds>(loadThresh);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [page,setPage]=useState(1);
  const [selected,setSelected]=useState<Report|null>(null);
  const [actionNote,setActionNote]=useState("");
  const [showSettings,setShowSettings]=useState(false);

  const filtered=reports.filter(r=>{
    const q=search.toLowerCase();
    const mq=!q||r.targetName.toLowerCase().includes(q)||r.reason.toLowerCase().includes(q)||r.reportedBy.toLowerCase().includes(q);
    const mf=filter==="all"||r.status===filter||r.severity===filter||r.type===filter;
    return mq&&mf;
  }).sort((a,b)=>{const so={high:0,medium:1,low:2};return (so[a.severity]??3)-(so[b.severity]??3);});

  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const paginated=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);

  const action=(id:string,status:Report["status"])=>{
    const up=reports.map(r=>r.id===id?{...r,status,actionTaken:actionNote||r.actionTaken}:r);
    setReports(up);save(up);setSelected(null);setActionNote("");toast.success("Report updated");
  };

  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});

  const counts={pending:reports.filter(r=>r.status==="pending").length,high:reports.filter(r=>r.severity==="high"&&r.status==="pending").length,actioned:reports.filter(r=>r.status==="actioned").length};

  return (
    <div style={{ padding:"24px 16px", maxWidth:980, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Content Moderation</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Review reported content and manage auto-flag settings</p>
        </div>
        <button onClick={()=>setShowSettings(true)} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 16px", cursor:"pointer", color:T.text, fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <Settings2 size={14}/> Settings
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[
          {label:"Pending Review",value:counts.pending,color:"#fbbf24"},
          {label:"High Severity",value:counts.high,color:"#f87171"},
          {label:"Actions Taken",value:counts.actioned,color:"#4ade80"},
        ].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 18px", textAlign:"center" }}>
            <div style={{ fontWeight:800, fontSize:28, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:T.sub, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 12px", flex:1, minWidth:160 }}>
            <Search size={13} color={T.sub}/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search reports..." style={{ background:"none", border:"none", outline:"none", color:T.text, fontSize:13, flex:1 }}/>
          </div>
          <select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"6px 12px", fontSize:13 }}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="high">High Severity</option>
            <option value="message">Messages</option>
            <option value="profile">Profiles</option>
            <option value="job">Jobs</option>
            <option value="review">Reviews</option>
          </select>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {["Type","Target","Reported By","Reason","Severity","Status","Action"].map(h=><th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:T.sub, textTransform:"uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {paginated.length===0&&<tr><td colSpan={7} style={{ padding:32, textAlign:"center", color:T.sub }}>No reports</td></tr>}
              {paginated.map(r=>{
                const Icon=TYPE_ICON[r.type]||Flag;
                return (
                  <tr key={r.id} style={{ borderBottom:`1px solid ${T.border}20` }}>
                    <td style={{ padding:"10px 14px" }}><div style={{ display:"flex", alignItems:"center", gap:6 }}><Icon size={13} color={T.sub}/><span style={{ fontSize:12, color:T.sub, textTransform:"capitalize" }}>{r.type}</span></div></td>
                    <td style={{ padding:"10px 14px", fontSize:13, color:T.text, fontWeight:600 }}>{r.targetName}</td>
                    <td style={{ padding:"10px 14px", fontSize:12, color:T.sub }}>{r.reportedBy}</td>
                    <td style={{ padding:"10px 14px", fontSize:12, color:T.sub }}>{r.reason}</td>
                    <td style={{ padding:"10px 14px" }}><span style={bs(SEVERITY_META[r.severity].color,SEVERITY_META[r.severity].bg)}>{r.severity}</span></td>
                    <td style={{ padding:"10px 14px" }}><span style={bs(STATUS_META[r.status].color,STATUS_META[r.status].bg)}>{STATUS_META[r.status].label}</span></td>
                    <td style={{ padding:"10px 14px" }}>
                      <button onClick={()=>{setSelected(r);setActionNote(r.actionTaken||"");}} style={{ background:`${A1}15`, border:`1px solid ${A1}33`, borderRadius:6, padding:"4px 10px", cursor:"pointer", color:A1, fontSize:12, display:"flex", alignItems:"center", gap:3 }}>
                        <Eye size={12}/> Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages>1&&(
          <div style={{ padding:"12px 18px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:T.sub }}>{filtered.length} reports</span>
            <div style={{ display:"flex", gap:6 }}>
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:6, padding:"5px 10px", cursor:"pointer", color:T.text, fontSize:12 }}><ChevronLeft size={13}/></button>
              <span style={{ padding:"5px 10px", fontSize:12, color:T.sub }}>{page}/{totalPages}</span>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:6, padding:"5px 10px", cursor:"pointer", color:T.text, fontSize:12 }}><ChevronRight size={13}/></button>
            </div>
          </div>
        )}
      </div>

      {selected&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:themeKey==="black"?"#0f0f23":"#fff", border:`1px solid ${T.border}`, borderRadius:16, padding:28, maxWidth:480, width:"100%" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ fontWeight:800, fontSize:17, color:T.text, margin:0 }}>Review Report</h2>
              <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", cursor:"pointer", color:T.sub }}><XCircle size={20}/></button>
            </div>
            {[["Type",selected.type],["Target",selected.targetName],["Reported By",selected.reportedBy],["Reason",selected.reason],["Description",selected.description],["Severity",selected.severity],["Date",safeFmt(selected.createdAt,"dd MMM yyyy")]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", gap:12, marginBottom:8 }}>
                <span style={{ fontSize:12, color:T.sub, width:100, flexShrink:0 }}>{k}</span>
                <span style={{ fontSize:13, color:T.text, fontWeight:600, textTransform:"capitalize" }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop:14 }}>
              <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:6 }}>Action Note</label>
              <textarea value={actionNote} onChange={e=>setActionNote(e.target.value)} rows={2} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, resize:"vertical", boxSizing:"border-box" as any }}/>
            </div>
            <div style={{ display:"flex", gap:8, marginTop:16, flexWrap:"wrap" }}>
              <button onClick={()=>action(selected.id,"reviewed")} style={{ flex:1, background:"rgba(96,165,250,.12)", border:"1px solid rgba(96,165,250,.3)", borderRadius:8, padding:"8px", cursor:"pointer", color:"#60a5fa", fontWeight:700, fontSize:13 }}>Mark Reviewed</button>
              <button onClick={()=>action(selected.id,"actioned")} style={{ flex:1, background:"rgba(248,113,113,.12)", border:"1px solid rgba(248,113,113,.3)", borderRadius:8, padding:"8px", cursor:"pointer", color:"#f87171", fontWeight:700, fontSize:13 }}>Take Action</button>
              <button onClick={()=>action(selected.id,"dismissed")} style={{ flex:1, background:"rgba(148,163,184,.12)", border:"1px solid rgba(148,163,184,.3)", borderRadius:8, padding:"8px", cursor:"pointer", color:"#94a3b8", fontWeight:700, fontSize:13 }}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {showSettings&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:themeKey==="black"?"#0f0f23":"#fff", border:`1px solid ${T.border}`, borderRadius:16, padding:28, maxWidth:420, width:"100%" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ fontWeight:800, fontSize:17, color:T.text, margin:0 }}>Moderation Settings</h2>
              <button onClick={()=>setShowSettings(false)} style={{ background:"none", border:"none", cursor:"pointer", color:T.sub }}>✕</button>
            </div>
            {[{l:"Auto-flag after N reports",k:"autoFlagCount"},{l:"Auto-disable after N reports",k:"autoDisableCount"}].map(fi=>(
              <div key={fi.k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>{fi.l}</label>
                <input type="number" value={(thresh as any)[fi.k]} onChange={e=>setThresh(p=>({...p,[fi.k]:Number(e.target.value)}))} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, boxSizing:"border-box" as any }}/>
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>Auto-flag Keywords (comma separated)</label>
              <input value={thresh.badWords.join(",")} onChange={e=>setThresh(p=>({...p,badWords:e.target.value.split(",").map(w=>w.trim()).filter(Boolean)}))} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, boxSizing:"border-box" as any }}/>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowSettings(false)} style={{ flex:1, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px", cursor:"pointer", color:T.text, fontWeight:600 }}>Cancel</button>
              <button onClick={()=>{saveThresh(thresh);setShowSettings(false);toast.success("Settings saved");}} style={{ flex:2, background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:8, padding:"9px", cursor:"pointer", color:"#fff", fontWeight:700 }}>Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContentModeration;
