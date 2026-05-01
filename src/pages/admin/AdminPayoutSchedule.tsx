// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Clock, IndianRupee, CheckCircle2, Users, Settings2, Save, RefreshCw } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";
import { format } from "date-fns";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1="#6366f1";
const SCHED_KEY="admin_payout_schedule_v1";

type PayoutConfig={frequency:"daily"|"weekly"|"biweekly"|"monthly";dayOfWeek:number;dayOfMonth:number;minAmount:number;autoApproveBelow:number;requireManualAbove:number;enabled:boolean;lastRun:string;nextRun:string};

function defaultConfig():PayoutConfig{return{frequency:"weekly",dayOfWeek:1,dayOfMonth:1,minAmount:100,autoApproveBelow:5000,requireManualAbove:10000,enabled:true,lastRun:new Date(Date.now()-86400000*7).toISOString(),nextRun:new Date(Date.now()+86400000).toISOString()};}
function loadConfig():PayoutConfig{try{const d=localStorage.getItem(SCHED_KEY);if(d)return JSON.parse(d);}catch{}const s=defaultConfig();localStorage.setItem(SCHED_KEY,JSON.stringify(s));return s;}
function saveConfig(c:PayoutConfig){localStorage.setItem(SCHED_KEY,JSON.stringify(c));}

const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const AdminPayoutSchedule = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [config, setConfig] = useState<PayoutConfig>(loadConfig);
  const set=(k:keyof PayoutConfig,v:any)=>setConfig(p=>({...p,[k]:v}));

  const { data: pendingPayouts=[], isLoading } = useQuery({
    queryKey:["admin-payout-pending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("withdrawals")
        .select("id,amount,created_at,status,profile:profile_id(full_name,user_code,user_type)")
        .eq("status","pending")
        .order("created_at",{ascending:false})
        .limit(50);
      return data||[];
    },
  });

  const { data: recentPayouts=[] } = useQuery({
    queryKey:["admin-payout-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("withdrawals")
        .select("id,amount,created_at,status,profile:profile_id(full_name,user_code)")
        .in("status",["approved","processed","completed"])
        .order("created_at",{ascending:false})
        .limit(10);
      return data||[];
    },
  });

  const handleSave=()=>{saveConfig(config);toast.success("Payout schedule saved");};
  const runNow=()=>toast.info("Manual payout batch triggered (requires server function)");

  const totalPending=pendingPayouts.reduce((s:number,p:any)=>s+Number(p.amount||0),0);
  const autoApprove=pendingPayouts.filter((p:any)=>Number(p.amount||0)<=config.autoApproveBelow).length;
  const manualReview=pendingPayouts.filter((p:any)=>Number(p.amount||0)>config.requireManualAbove).length;

  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});

  return (
    <div style={{ padding:"24px 16px", maxWidth:980, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Payout Schedule Management</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Configure automatic payout batches and approval workflows</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={runNow} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 14px", cursor:"pointer", color:T.text, fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            <RefreshCw size={13}/> Run Now
          </button>
          <button onClick={handleSave} style={{ background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:10, padding:"8px 18px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            <Save size={13}/> Save Schedule
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:14, marginBottom:24 }}>
        {[{l:"Pending Payouts",v:pendingPayouts.length,c:"#fbbf24"},{l:"Total Pending (₹)",v:`₹${totalPending.toLocaleString("en-IN")}`,c:"#f87171"},{l:"Auto-Approve",v:autoApprove,c:"#4ade80"},{l:"Manual Review",v:manualReview,c:"#6366f1"}].map(s=>(
          <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px",textAlign:"center" }}>
            <div style={{ fontWeight:800,fontSize:22,color:s.c }}>{s.v}</div>
            <div style={{ fontSize:11,color:T.sub,marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
            <Settings2 size={14} color={A1}/> Payout Configuration
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:6 }}>Payout Frequency</label>
            <select value={config.frequency} onChange={e=>set("frequency",e.target.value as any)} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13 }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {config.frequency==="weekly"&&<div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:6 }}>Day of Week</label>
            <select value={config.dayOfWeek} onChange={e=>set("dayOfWeek",Number(e.target.value))} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13 }}>
              {DAYS.map((d,i)=><option key={i} value={i}>{d}</option>)}
            </select>
          </div>}
          {config.frequency==="monthly"&&<div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:6 }}>Day of Month</label>
            <select value={config.dayOfMonth} onChange={e=>set("dayOfMonth",Number(e.target.value))} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13 }}>
              {Array.from({length:28},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
          </div>}
          {[{l:"Min Payout Amount (₹)",k:"minAmount"},{l:"Auto-Approve Below (₹)",k:"autoApproveBelow"},{l:"Require Manual Review Above (₹)",k:"requireManualAbove"}].map(fi=>(
            <div key={fi.k} style={{ marginBottom:14 }}>
              <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:6 }}>{fi.l}</label>
              <input type="number" value={(config as any)[fi.k]} onChange={e=>set(fi.k as any,Number(e.target.value))} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,boxSizing:"border-box" as any }}/>
            </div>
          ))}
          <label style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer" }}>
            <div onClick={()=>set("enabled",!config.enabled)} style={{ width:40,height:22,borderRadius:11,background:config.enabled?A1:"rgba(148,163,184,.3)",position:"relative",cursor:"pointer" }}>
              <div style={{ position:"absolute",top:3,left:config.enabled?19:3,width:16,height:16,borderRadius:8,background:"#fff",transition:"left .2s" }}/>
            </div>
            <span style={{ fontSize:13,color:T.text,fontWeight:600 }}>Auto Payout {config.enabled?"Enabled":"Disabled"}</span>
          </label>
          <div style={{ marginTop:14,padding:"10px 14px",background:`${A1}08`,borderRadius:8 }}>
            <div style={{ fontSize:11,color:T.sub }}>Last Run: {safeFmt(config.lastRun,"dd MMM yyyy")}</div>
            <div style={{ fontSize:11,color:A1,fontWeight:700,marginTop:2 }}>Next Run: {safeFmt(config.nextRun,"dd MMM yyyy")}</div>
          </div>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, fontWeight:700, fontSize:14, color:T.text }}>Pending Withdrawals</div>
          <div style={{ maxHeight:400, overflowY:"auto" }}>
            {isLoading&&<div style={{ padding:24,textAlign:"center",color:T.sub }}>Loading...</div>}
            {pendingPayouts.map((p:any)=>{
              const amt=Number(p.amount||0);
              const isAuto=amt<=config.autoApproveBelow;
              const isManual=amt>config.requireManualAbove;
              return (
                <div key={p.id} style={{ padding:"11px 18px",borderBottom:`1px solid ${T.border}20`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10 }}>
                  <div>
                    <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{(p.profile?.full_name||[]).join(" ")||"User"}</div>
                    <div style={{ fontSize:11,color:T.sub }}>{safeFmt(p.created_at,"dd MMM")}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13,fontWeight:800,color:"#4ade80" }}>₹{amt.toLocaleString("en-IN")}</div>
                    <span style={bs(isManual?"#f87171":isAuto?"#4ade80":"#fbbf24",isManual?"rgba(248,113,113,.12)":isAuto?"rgba(74,222,128,.12)":"rgba(251,191,36,.12)")}>{isManual?"Manual":isAuto?"Auto-OK":"Review"}</span>
                  </div>
                </div>
              );
            })}
            {!isLoading&&pendingPayouts.length===0&&<div style={{ padding:32,textAlign:"center",color:T.sub }}>No pending payouts</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPayoutSchedule;
