import { useState } from "react";
import { Bell, AlertTriangle, CheckCircle2, RefreshCw, Activity, Pause } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface NotifChannel{id:string;name:string;type:"email"|"sms"|"push"|"in-app";sent24h:number;failed24h:number;duplicates24h:number;rateLimit:number;cooldownSecs:number;paused:boolean;spamDetected:boolean;}
const seed=():NotifChannel[]=>[
  {id:"nc1",name:"Email Notifications",type:"email",sent24h:8420,failed24h:42,duplicates24h:8,rateLimit:1000,cooldownSecs:60,paused:false,spamDetected:false},
  {id:"nc2",name:"SMS Notifications",type:"sms",sent24h:4280,failed24h:180,duplicates24h:24,rateLimit:500,cooldownSecs:120,paused:false,spamDetected:true},
  {id:"nc3",name:"Push Notifications",type:"push",sent24h:24800,failed24h:120,duplicates24h:0,rateLimit:5000,cooldownSecs:30,paused:false,spamDetected:false},
  {id:"nc4",name:"In-App Alerts",type:"in-app",sent24h:48200,failed24h:0,duplicates24h:0,rateLimit:10000,cooldownSecs:5,paused:false,spamDetected:false},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminNotificationControl(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[channels,setChannels]=useState(()=>load("admin_notif_ctrl_v1",seed));

  const togglePause=(id:string)=>{
    const upd=channels.map(c=>c.id===id?{...c,paused:!c.paused}:c);
    localStorage.setItem("admin_notif_ctrl_v1",JSON.stringify(upd));setChannels(upd);
    toast({title:"Channel status updated"});
  };
  const updateLimit=(id:string,field:string,val:number)=>{
    const upd=channels.map(c=>c.id===id?{...c,[field]:val}:c);
    localStorage.setItem("admin_notif_ctrl_v1",JSON.stringify(upd));setChannels(upd);
    toast({title:"Rate limit updated"});
  };

  const spamChannels=channels.filter(c=>c.spamDetected).length;
  const totalFailed=channels.reduce((s,c)=>s+c.failed24h,0);

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Bell size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Notification Control System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Rate limit · Duplicate detection · Queue monitoring · Retry logic · Delivery logs · Spam detection</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Channels",v:channels.length,c:T.badgeFg},{l:"Spam Detected",v:spamChannels,c:spamChannels>0?"#f87171":"#4ade80"},{l:"Failed (24h)",v:totalFailed,c:totalFailed>100?"#fbbf24":"#4ade80"},{l:"Total Sent",v:channels.reduce((s,c)=>s+c.sent24h,0).toLocaleString(),c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {channels.map(c=>(
          <div key={c.id} style={{background:T.card,border:`1px solid ${c.spamDetected?"rgba(248,113,113,.2)":T.border}`,borderRadius:14,padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:13,color:T.text}}>{c.name}</span>
              <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 6px",borderRadius:4}}>{c.type}</span>
              {c.spamDetected&&<span style={{fontSize:10,color:"#f87171",fontWeight:700}}>⚠ SPAM DETECTED</span>}
              {c.paused&&<span style={{fontSize:10,color:"#94a3b8"}}>Paused</span>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <p style={{fontSize:11,color:T.sub,margin:"0 0 2px"}}>Rate Limit/hr</p>
                <input type="number" defaultValue={c.rateLimit} onBlur={e=>updateLimit(c.id,"rateLimit",+e.target.value)} style={{width:"100%",background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"4px 8px",fontSize:12}}/>
              </div>
              <div>
                <p style={{fontSize:11,color:T.sub,margin:"0 0 2px"}}>Cooldown (sec)</p>
                <input type="number" defaultValue={c.cooldownSecs} onBlur={e=>updateLimit(c.id,"cooldownSecs",+e.target.value)} style={{width:"100%",background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"4px 8px",fontSize:12}}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <p style={{fontSize:11,color:T.sub,margin:"0 0 2px"}}>Stats (24h)</p>
                <span style={{fontSize:11,color:T.sub}}>Sent: <strong style={{color:T.text}}>{c.sent24h.toLocaleString()}</strong></span>
                <span style={{fontSize:11,color:T.sub}}>Failed: <strong style={{color:c.failed24h>0?"#f87171":"#4ade80"}}>{c.failed24h}</strong></span>
                {c.duplicates24h>0&&<span style={{fontSize:11,color:"#fbbf24"}}>Dupes: {c.duplicates24h}</span>}
              </div>
            </div>
            <button onClick={()=>togglePause(c.id)} style={{padding:"5px 14px",borderRadius:7,background:c.paused?"rgba(74,222,128,.08)":"rgba(148,163,184,.08)",border:`1px solid ${c.paused?"rgba(74,222,128,.2)":"rgba(148,163,184,.2)"}`,color:c.paused?"#4ade80":"#94a3b8",fontSize:12,fontWeight:600,cursor:"pointer"}}>
              {c.paused?"Resume Channel":"Pause Channel"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
