import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Briefcase, CheckCircle2, Clock, XCircle, IndianRupee, Users } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const A1 = "#6366f1";
const COLORS = ["#6366f1","#8b5cf6","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#f97316"];

const AdminProjectAnalytics = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const { data: projects=[], isLoading } = useQuery({
    queryKey:["admin-project-analytics"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id,title,status,budget,category,created_at,employer_id,employee_id")
        .order("created_at",{ascending:false})
        .limit(500);
      return data||[];
    },
  });

  const total = projects.length;
  const completed = projects.filter((p:any)=>p.status==="completed").length;
  const active = projects.filter((p:any)=>["active","in_progress"].includes(p.status)).length;
  const cancelled = projects.filter((p:any)=>p.status==="cancelled").length;
  const totalBudget = projects.filter((p:any)=>p.status==="completed").reduce((s:number,p:any)=>s+Number(p.budget||0),0);
  const avgBudget = completed>0?totalBudget/completed:0;
  const completionRate = total>0?Math.round((completed/total)*100):0;

  const statusData = [
    {name:"Completed",value:completed},
    {name:"Active",value:active},
    {name:"Open",value:projects.filter((p:any)=>p.status==="open"||p.status==="published").length},
    {name:"Cancelled",value:cancelled},
  ].filter(d=>d.value>0);

  const categoryMap: Record<string,number> = {};
  projects.forEach((p:any)=>{ if(p.category){ categoryMap[p.category]=(categoryMap[p.category]||0)+1; } });
  const categoryData = Object.entries(categoryMap).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value])=>({name:name.length>16?name.slice(0,14)+"..":name,value}));

  const monthMap: Record<string,number> = {};
  projects.forEach((p:any)=>{
    if(p.created_at){ const m=p.created_at.slice(0,7); monthMap[m]=(monthMap[m]||0)+1; }
  });
  const monthData = Object.entries(monthMap).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6).map(([m,v])=>({name:m.slice(5),value:v}));

  const recentProjects = projects.slice(0,10);

  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});
  const statusStyle=(s:string)=>{ const m:Record<string,any>={completed:{c:"#4ade80",bg:"rgba(74,222,128,.12)"},active:{c:"#6366f1",bg:"rgba(99,102,241,.12)"},in_progress:{c:"#6366f1",bg:"rgba(99,102,241,.12)"},open:{c:"#60a5fa",bg:"rgba(96,165,250,.12)"},published:{c:"#60a5fa",bg:"rgba(96,165,250,.12)"},cancelled:{c:"#f87171",bg:"rgba(248,113,113,.12)"}}; return bs((m[s]||{c:"#94a3b8",bg:"rgba(148,163,184,.12)"}).c,(m[s]||{c:"#94a3b8",bg:"rgba(148,163,184,.12)"}).bg); };

  return (
    <div style={{ padding:"24px 16px", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Project & Contract Analytics</h1>
        <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Comprehensive analytics on all platform projects</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
        {[
          {label:"Total Projects",value:total,color:"#6366f1",icon:Briefcase},
          {label:"Completed",value:completed,color:"#4ade80",icon:CheckCircle2},
          {label:"Active",value:active,color:"#60a5fa",icon:Clock},
          {label:"Completion Rate",value:`${completionRate}%`,color:"#f59e0b",icon:TrendingUp},
          {label:"Avg Budget",value:`₹${avgBudget.toLocaleString("en-IN",{maximumFractionDigits:0})}`,color:"#8b5cf6",icon:IndianRupee},
          {label:"Total Value",value:`₹${(totalBudget/1000).toFixed(0)}K`,color:"#10b981",icon:BarChart3},
        ].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36,height:36,borderRadius:9,background:`${s.color}20`,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <s.icon size={16} color={s.color}/>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:17, color:T.text }}>{s.value}</div>
              <div style={{ fontSize:10, color:T.sub }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:18 }}>
          <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:14 }}>Projects by Category</div>
          {isLoading ? <div style={{ textAlign:"center", color:T.sub, padding:32 }}>Loading...</div> :
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} margin={{left:-20}}>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.sub}} />
              <YAxis tick={{fontSize:10,fill:T.sub}} />
              <Tooltip contentStyle={{ background:themeKey==="black"?"#1e1e3a":"#fff", border:`1px solid ${T.border}`, borderRadius:8, color:T.text }}/>
              <Bar dataKey="value" fill={A1} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>}
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:18 }}>
          <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:14 }}>Status Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:10}}>
                {statusData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{ background:themeKey==="black"?"#1e1e3a":"#fff", border:`1px solid ${T.border}`, borderRadius:8, color:T.text }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, fontWeight:700, fontSize:14, color:T.text }}>Recent Projects</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {["Title","Category","Budget","Status","Date"].map(h=><th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:T.sub, textTransform:"uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {isLoading&&<tr><td colSpan={5} style={{ padding:32, textAlign:"center", color:T.sub }}>Loading...</td></tr>}
              {recentProjects.map((p:any)=>(
                <tr key={p.id} style={{ borderBottom:`1px solid ${T.border}20` }}>
                  <td style={{ padding:"10px 14px", fontSize:13, color:T.text, fontWeight:600, maxWidth:200 }}>{p.title||"Untitled"}</td>
                  <td style={{ padding:"10px 14px", fontSize:12, color:T.sub }}>{p.category||"—"}</td>
                  <td style={{ padding:"10px 14px", fontSize:13, color:"#4ade80", fontWeight:700 }}>{p.budget?`₹${Number(p.budget).toLocaleString("en-IN")}`:"—"}</td>
                  <td style={{ padding:"10px 14px" }}><span style={statusStyle(p.status)}>{p.status}</span></td>
                  <td style={{ padding:"10px 14px", fontSize:12, color:T.sub }}>{safeFmt(p.created_at,"dd MMM yyyy")}</td>
                </tr>
              ))}
              {!isLoading&&projects.length===0&&<tr><td colSpan={5} style={{ padding:32, textAlign:"center", color:T.sub }}>No projects found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProjectAnalytics;
