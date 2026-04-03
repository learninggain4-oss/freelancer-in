import { useState } from "react";
import { Bell, CheckCircle2, AlertTriangle, RefreshCw, Mail, MessageSquare, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={
  black:{bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc"},
  white:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
  wb:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
};

interface Channel{id:string;name:string;type:"email"|"sms"|"push";provider:string;sent24h:number;failed24h:number;queued:number;status:"healthy"|"degraded"|"down";lastDelivery:string;retryEnabled:boolean;backupProvider?:string;}

const seedChannels=():Channel[]=>[
  {id:"ch1",name:"Transactional Email",type:"email",provider:"Resend",sent24h:4820,failed24h:12,queued:3,status:"healthy",lastDelivery:new Date(Date.now()-60000).toISOString(),retryEnabled:true,backupProvider:"SMTP Direct"},
  {id:"ch2",name:"Push Notifications",type:"push",provider:"OneSignal",sent24h:18400,failed24h:340,queued:84,status:"degraded",lastDelivery:new Date(Date.now()-120000).toISOString(),retryEnabled:true,backupProvider:"Firebase FCM"},
  {id:"ch3",name:"OTP SMS",type:"sms",provider:"MSG91",sent24h:920,failed24h:8,queued:0,status:"healthy",lastDelivery:new Date(Date.now()-300000).toISOString(),retryEnabled:true},
  {id:"ch4",name:"Withdrawal Alerts",type:"email",provider:"Resend",sent24h:340,failed24h:0,queued:0,status:"healthy",lastDelivery:new Date(Date.now()-900000).toISOString(),retryEnabled:true},
];

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={healthy:"#4ade80",degraded:"#fbbf24",down:"#f87171"};
const typeIcon={email:Mail,sms:MessageSquare,push:Bell};

export default function AdminNotificationDelivery(){
  const{theme,themeKey}=useDashboardTheme();const T=TH[themeKey];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[channels,setChannels]=useState<Channel[]>(()=>load("admin_notif_delivery_v1",seedChannels));
  const[retrying,setRetrying]=useState<string|null>(null);

  const retryFailed=async(c:Channel)=>{
    setRetrying(c.id);
    await new Promise(r=>setTimeout(r,1500));
    const upd=channels.map(x=>x.id===c.id?{...x,failed24h:0,queued:0,status:"healthy" as const}:x);
    localStorage.setItem("admin_notif_delivery_v1",JSON.stringify(upd));setChannels(upd);setRetrying(null);
    logAction("Notification Retry",`${c.failed24h} failed ${c.type} via ${c.provider}`,"System","success");
    toast({title:`${c.failed24h} failed ${c.name} notifications requeued`});
  };

  const totalFailed=channels.reduce((s,c)=>s+c.failed24h,0);
  const totalSent=channels.reduce((s,c)=>s+c.sent24h,0);
  const deliveryRate=Math.round(((totalSent-totalFailed)/totalSent)*100);

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <Bell size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Notification Delivery Reliability</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Email · SMS · Push · Retry mechanism · Backup provider · Queue monitoring · Delivery rate</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Sent (24h)",v:totalSent.toLocaleString(),c:"#4ade80"},{l:"Failed (24h)",v:totalFailed,c:totalFailed>0?"#f87171":"#4ade80"},{l:"Delivery Rate",v:`${deliveryRate}%`,c:deliveryRate>98?"#4ade80":deliveryRate>95?"#fbbf24":"#f87171"},{l:"Queued",v:channels.reduce((s,c)=>s+c.queued,0),c:"#fbbf24"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {channels.map(c=>{
          const Icon=typeIcon[c.type];
          return(
            <div key={c.id} style={{background:T.card,border:`1px solid ${c.status!=="healthy"?`${sColor[c.status]}33`:T.border}`,borderRadius:13,padding:"16px 18px"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{width:38,height:38,borderRadius:10,background:`${A1}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Icon size={16} color={A1}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:13,color:T.text}}>{c.name}</span>
                    <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5}}>{c.provider}</span>
                    <span style={{fontSize:10,fontWeight:700,color:sColor[c.status],background:`${sColor[c.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{c.status}</span>
                  </div>
                  <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:c.backupProvider?4:0}}>
                    <span style={{fontSize:12,color:T.sub}}>Sent: <strong style={{color:"#4ade80"}}>{c.sent24h.toLocaleString()}</strong></span>
                    <span style={{fontSize:12,color:T.sub}}>Failed: <strong style={{color:c.failed24h>0?"#f87171":"#4ade80"}}>{c.failed24h}</strong></span>
                    <span style={{fontSize:12,color:T.sub}}>Queued: <strong style={{color:c.queued>0?"#fbbf24":T.text}}>{c.queued}</strong></span>
                    <span style={{fontSize:12,color:T.sub}}>Last: {safeDist(c.lastDelivery)} ago</span>
                  </div>
                  {c.backupProvider&&<p style={{fontSize:11,color:"#4ade80",margin:0}}>✓ Backup: {c.backupProvider}</p>}
                </div>
                {c.failed24h>0&&<button onClick={()=>retryFailed(c)} disabled={retrying===c.id} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:9,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                  <RefreshCw size={11} className={retrying===c.id?"animate-spin":""}/>{retrying===c.id?"Retrying…":"Retry Failed"}
                </button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
