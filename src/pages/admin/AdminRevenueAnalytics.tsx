// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IndianRupee, TrendingUp, Users, Briefcase, BarChart3, ArrowUpRight } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subDays, subMonths, startOfMonth } from "date-fns";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1="#6366f1";
const COLORS=["#6366f1","#8b5cf6","#f59e0b","#10b981","#ef4444","#3b82f6"];

const AdminRevenueAnalytics = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const TS = { background:themeKey==="black"?"#1e1e3a":"#fff", border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:12 };

  const { data: txns=[] } = useQuery({
    queryKey:["admin-revenue-txns"],
    queryFn: async () => {
      const { data } = await supabase.from("wallet_transactions").select("amount,transaction_type,created_at").order("created_at",{ascending:false}).limit(2000);
      return data||[];
    },
  });

  const { data: users=[] } = useQuery({
    queryKey:["admin-revenue-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id,full_name,user_type,wallet_balance,coin_balance,created_at").order("wallet_balance",{ascending:false}).limit(500);
      return data||[];
    },
  });

  const { data: projects=[] } = useQuery({
    queryKey:["admin-revenue-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id,status,budget,created_at,category").order("created_at",{ascending:false}).limit(500);
      return data||[];
    },
  });

  const totalRev = txns.filter((t:any)=>t.transaction_type==="commission").reduce((s:number,t:any)=>s+Math.abs(Number(t.amount||0)),0);
  const totalVol = txns.reduce((s:number,t:any)=>s+Math.abs(Number(t.amount||0)),0);
  const todayRev = txns.filter((t:any)=>t.transaction_type==="commission"&&t.created_at?.startsWith(format(new Date(),"yyyy-MM-dd"))).reduce((s:number,t:any)=>s+Math.abs(Number(t.amount||0)),0);
  const monthRev = txns.filter((t:any)=>t.transaction_type==="commission"&&t.created_at?.startsWith(format(new Date(),"yyyy-MM"))).reduce((s:number,t:any)=>s+Math.abs(Number(t.amount||0)),0);

  const monthlyData = Array.from({length:6},(_,i)=>{
    const m=subMonths(new Date(),5-i);
    const key=format(m,"yyyy-MM");
    const label=format(m,"MMM");
    const rev=txns.filter((t:any)=>t.transaction_type==="commission"&&t.created_at?.startsWith(key)).reduce((s:number,t:any)=>s+Math.abs(Number(t.amount||0)),0);
    const vol=txns.filter((t:any)=>t.created_at?.startsWith(key)).reduce((s:number,t:any)=>s+Math.abs(Number(t.amount||0)),0);
    const newUsers=users.filter((u:any)=>u.created_at?.startsWith(key)).length;
    const newProj=projects.filter((p:any)=>p.created_at?.startsWith(key)).length;
    return {name:label,revenue:Math.round(rev),volume:Math.round(vol),users:newUsers,projects:newProj};
  });

  const topFreelancers = users.filter((u:any)=>u.user_type==="employee").slice(0,5);
  const topEmployers = users.filter((u:any)=>u.user_type==="employer").slice(0,5);

  const catMap:Record<string,number>={};
  projects.filter((p:any)=>p.status==="completed").forEach((p:any)=>{if(p.category)catMap[p.category]=(catMap[p.category]||0)+1;});
  const catData=Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,value])=>({name:name.length>14?name.slice(0,12)+"..":name,value}));

  const fmt=(n:number)=>`₹${n.toLocaleString("en-IN")}`;

  return (
    <div style={{ padding:"24px 16px", maxWidth:1200, margin:"0 auto" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Platform Revenue Analytics</h1>
        <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Comprehensive revenue, user growth, and project trend insights</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:14, marginBottom:24 }}>
        {[
          {label:"Total Revenue",value:fmt(totalRev),color:"#4ade80",icon:IndianRupee,sub:"All time commission"},
          {label:"Total Volume",value:fmt(totalVol),color:"#6366f1",icon:TrendingUp,sub:"All transactions"},
          {label:"Today Revenue",value:fmt(todayRev),color:"#f59e0b",icon:ArrowUpRight,sub:"Today's commission"},
          {label:"This Month",value:fmt(monthRev),color:"#8b5cf6",icon:BarChart3,sub:"Monthly commission"},
          {label:"Total Users",value:users.length,color:"#60a5fa",icon:Users,sub:"All registered"},
          {label:"Total Projects",value:projects.length,color:"#10b981",icon:Briefcase,sub:"All projects"},
        ].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ width:34,height:34,borderRadius:9,background:`${s.color}20`,display:"flex",alignItems:"center",justifyContent:"center" }}><s.icon size={15} color={s.color}/></div>
              <ArrowUpRight size={13} color={s.color}/>
            </div>
            <div style={{ fontWeight:800, fontSize:17, color:T.text }}>{s.value}</div>
            <div style={{ fontSize:10, color:T.sub, marginTop:2 }}>{s.label}</div>
            <div style={{ fontSize:9, color:T.sub }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:18, marginBottom:18 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:16 }}>Revenue & Volume Trend (Last 6 Months)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={A1} stopOpacity={0.3}/><stop offset="95%" stopColor={A1} stopOpacity={0}/></linearGradient>
                <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4ade80" stopOpacity={0.2}/><stop offset="95%" stopColor="#4ade80" stopOpacity={0}/></linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{fontSize:11,fill:T.sub}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:T.sub}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v>=1000?Math.round(v/1000)+"K":v}`}/>
              <Tooltip contentStyle={TS} formatter={(v:any,n:string)=>[`₹${Number(v).toLocaleString("en-IN")}`,n==="revenue"?"Commission Revenue":"Total Volume"]}/>
              <Area type="monotone" dataKey="volume" stroke="#4ade80" fill="url(#vol)" strokeWidth={2}/>
              <Area type="monotone" dataKey="revenue" stroke={A1} fill="url(#rev)" strokeWidth={2.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:16 }}>User & Project Growth</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={monthlyData} margin={{left:-20}}>
              <XAxis dataKey="name" tick={{fontSize:11,fill:T.sub}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:T.sub}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TS}/>
              <Bar dataKey="users" fill="#6366f1" radius={[4,4,0,0]} name="New Users"/>
              <Bar dataKey="projects" fill="#f59e0b" radius={[4,4,0,0]} name="New Projects"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:16 }}>Completed Projects by Category</div>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:9}}>
                {catData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={TS}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        {[
          {title:"Top Freelancers by Wallet",data:topFreelancers,type:"freelancer"},
          {title:"Top Employers by Wallet",data:topEmployers,type:"employer"},
        ].map(panel=>(
          <div key={panel.title} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, fontWeight:700, fontSize:14, color:T.text }}>{panel.title}</div>
            <div>
              {panel.data.map((u:any,i:number)=>(
                <div key={u.id} style={{ padding:"10px 18px", borderBottom:`1px solid ${T.border}20`, display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:24,height:24,borderRadius:6,background:`${COLORS[i]}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:COLORS[i] }}>{i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{(u.full_name||[]).join(" ")||"User"}</div>
                    <div style={{ fontSize:10,color:T.sub }}>{(u.user_code||[]).join("")||"—"}</div>
                  </div>
                  <div style={{ fontSize:13,fontWeight:800,color:"#4ade80" }}>₹{Number(u.wallet_balance||0).toLocaleString("en-IN")}</div>
                </div>
              ))}
              {panel.data.length===0&&<div style={{ padding:24,textAlign:"center",color:T.sub,fontSize:13 }}>No data available</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRevenueAnalytics;
