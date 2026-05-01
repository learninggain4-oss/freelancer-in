// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Users } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subDays, differenceInHours, differenceInMinutes } from "date-fns";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1="#6366f1";
const SLA_TARGETS={response:24,resolution:72};

const AdminSlaReports = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const TS={background:themeKey==="black"?"#1e1e3a":"#fff",border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:12};

  const { data: tickets=[], isLoading } = useQuery({
    queryKey:["admin-sla-tickets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("id,subject,status,priority,created_at,updated_at,resolved_at,user_id,profile:user_id(full_name,user_type)")
        .order("created_at",{ascending:false})
        .limit(300);
      return data||[];
    },
  });

  const calcResponseTime=(t:any):number|null=>{
    if(!t.updated_at||t.created_at===t.updated_at)return null;
    return differenceInHours(new Date(t.updated_at),new Date(t.created_at));
  };

  const calcResolutionTime=(t:any):number|null=>{
    if(!t.resolved_at)return null;
    return differenceInHours(new Date(t.resolved_at),new Date(t.created_at));
  };

  const ticketsWithSLA=tickets.map((t:any)=>({...t,responseHrs:calcResponseTime(t),resolutionHrs:calcResolutionTime(t),withinResponseSLA:(calcResponseTime(t)??999)<=SLA_TARGETS.response,withinResolutionSLA:(calcResolutionTime(t)??999)<=SLA_TARGETS.resolution||!t.resolved_at}));

  const total=tickets.length;
  const open=tickets.filter((t:any)=>t.status==="open"||t.status==="pending").length;
  const resolved=tickets.filter((t:any)=>t.status==="resolved"||t.status==="closed").length;
  const breachCount=ticketsWithSLA.filter(t=>t.responseHrs!==null&&!t.withinResponseSLA).length;
  const avgResponse=ticketsWithSLA.filter(t=>t.responseHrs!==null).reduce((s,t,_,a)=>a.length?s+t.responseHrs!/a.length:0,0);
  const avgResolution=ticketsWithSLA.filter(t=>t.resolutionHrs!==null).reduce((s,t,_,a)=>a.length?s+t.resolutionHrs!/a.length:0,0);
  const slaComplianceRate=total>0?Math.round(((total-breachCount)/total)*100):100;

  const dailyData=Array.from({length:7},(_,i)=>{
    const d=subDays(new Date(),6-i);
    const key=format(d,"yyyy-MM-dd");
    const dayTickets=tickets.filter((t:any)=>t.created_at?.startsWith(key));
    const dayResolved=tickets.filter((t:any)=>t.resolved_at?.startsWith(key));
    return {name:format(d,"EEE"),opened:dayTickets.length,resolved:dayResolved.length};
  });

  const priorityData=[
    {name:"High",value:tickets.filter((t:any)=>t.priority==="high").length,color:"#f87171"},
    {name:"Medium",value:tickets.filter((t:any)=>t.priority==="medium"||!t.priority).length,color:"#fbbf24"},
    {name:"Low",value:tickets.filter((t:any)=>t.priority==="low").length,color:"#4ade80"},
  ];

  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});
  const priorityStyle=(p:string)=>{const m:Record<string,any>={high:{c:"#f87171",bg:"rgba(248,113,113,.12)"},medium:{c:"#fbbf24",bg:"rgba(251,191,36,.12)"},low:{c:"#4ade80",bg:"rgba(74,222,128,.12)"}};return bs(m[p]?.c||"#94a3b8",m[p]?.bg||"rgba(148,163,184,.12)")};

  return (
    <div style={{ padding:"24px 16px", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>SLA & Response Time Reports</h1>
        <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Support ticket SLA compliance — Target: Response &lt;{SLA_TARGETS.response}h, Resolution &lt;{SLA_TARGETS.resolution}h</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:14, marginBottom:24 }}>
        {[
          {l:"Total Tickets",v:total,c:"#6366f1",icon:BarChart3},
          {l:"Open",v:open,c:"#fbbf24",icon:Clock},
          {l:"Resolved",v:resolved,c:"#4ade80",icon:CheckCircle2},
          {l:"SLA Breaches",v:breachCount,c:"#f87171",icon:AlertTriangle},
          {l:"Avg Response",v:`${avgResponse.toFixed(1)}h`,c:"#8b5cf6",icon:TrendingUp},
          {l:"SLA Compliance",v:`${slaComplianceRate}%`,c:slaComplianceRate>=90?"#4ade80":slaComplianceRate>=70?"#fbbf24":"#f87171",icon:CheckCircle2},
        ].map(s=>(
          <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:34,height:34,borderRadius:9,background:`${s.c}20`,display:"flex",alignItems:"center",justifyContent:"center" }}><s.icon size={15} color={s.c}/></div>
            <div><div style={{ fontWeight:800,fontSize:17,color:T.text }}>{s.v}</div><div style={{ fontSize:10,color:T.sub }}>{s.l}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:20 }}>
          <div style={{ fontWeight:700,fontSize:14,color:T.text,marginBottom:16 }}>Ticket Volume (Last 7 Days)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData} margin={{left:-20}}>
              <XAxis dataKey="name" tick={{fontSize:11,fill:T.sub}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:T.sub}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TS}/>
              <Bar dataKey="opened" fill={A1} radius={[4,4,0,0]} name="Opened"/>
              <Bar dataKey="resolved" fill="#4ade80" radius={[4,4,0,0]} name="Resolved"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:20 }}>
          <div style={{ fontWeight:700,fontSize:14,color:T.text,marginBottom:16 }}>Priority Breakdown</div>
          <div style={{ display:"flex",flexDirection:"column",gap:10,paddingTop:8 }}>
            {priorityData.map(p=>(
              <div key={p.name} style={{ display:"flex",alignItems:"center",gap:12 }}>
                <span style={{ fontSize:12,color:T.sub,width:50 }}>{p.name}</span>
                <div style={{ flex:1,height:20,background:`${T.border}40`,borderRadius:4,overflow:"hidden" }}>
                  <div style={{ height:"100%",width:total>0?`${(p.value/total)*100}%`:"0%",background:p.color,borderRadius:4,transition:"width .5s" }}/>
                </div>
                <span style={{ fontSize:12,fontWeight:700,color:p.color,width:30,textAlign:"right" }}>{p.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:20,padding:"12px 14px",background:`${A1}08`,borderRadius:8 }}>
            <div style={{ fontSize:12,color:T.sub }}>SLA Target</div>
            <div style={{ fontSize:13,color:T.text,fontWeight:700,marginTop:4 }}>Response: &lt;{SLA_TARGETS.response}h · Resolution: &lt;{SLA_TARGETS.resolution}h</div>
            <div style={{ fontSize:13,fontWeight:800,color:slaComplianceRate>=90?"#4ade80":"#f87171",marginTop:4 }}>Current Compliance: {slaComplianceRate}%</div>
          </div>
        </div>
      </div>

      <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden" }}>
        <div style={{ padding:"14px 18px",borderBottom:`1px solid ${T.border}`,fontWeight:700,fontSize:14,color:T.text }}>Recent Tickets with SLA Status</div>
        {isLoading&&<div style={{ padding:32,textAlign:"center",color:T.sub }}>Loading...</div>}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {["Subject","User","Priority","Status","Response Time","SLA","Opened"].map(h=><th key={h} style={{ padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:T.sub,textTransform:"uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {ticketsWithSLA.slice(0,15).map((t:any)=>(
                <tr key={t.id} style={{ borderBottom:`1px solid ${T.border}20` }}>
                  <td style={{ padding:"10px 14px",fontSize:13,color:T.text,fontWeight:600,maxWidth:200 }}>{t.subject||"Support Request"}</td>
                  <td style={{ padding:"10px 14px",fontSize:12,color:T.sub }}>{(t.profile?.full_name||[]).join(" ")||"User"}</td>
                  <td style={{ padding:"10px 14px" }}><span style={priorityStyle(t.priority||"medium")}>{t.priority||"medium"}</span></td>
                  <td style={{ padding:"10px 14px" }}><span style={bs(t.status==="resolved"?"#4ade80":"#fbbf24",t.status==="resolved"?"rgba(74,222,128,.12)":"rgba(251,191,36,.12)")}>{t.status}</span></td>
                  <td style={{ padding:"10px 14px",fontSize:12,color:t.responseHrs!==null&&t.responseHrs>SLA_TARGETS.response?"#f87171":T.sub }}>{t.responseHrs!==null?`${t.responseHrs.toFixed(1)}h`:"—"}</td>
                  <td style={{ padding:"10px 14px" }}><span style={bs(t.withinResponseSLA&&t.withinResolutionSLA?"#4ade80":"#f87171",(t.withinResponseSLA&&t.withinResolutionSLA)?"rgba(74,222,128,.12)":"rgba(248,113,113,.12)")}>{t.withinResponseSLA?"On Track":"Breached"}</span></td>
                  <td style={{ padding:"10px 14px",fontSize:12,color:T.sub }}>{safeFmt(t.created_at,"dd MMM")}</td>
                </tr>
              ))}
              {!isLoading&&tickets.length===0&&<tr><td colSpan={7} style={{ padding:32,textAlign:"center",color:T.sub }}>No tickets found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSlaReports;
