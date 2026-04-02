import { useState, useEffect } from "react";
import { Key, AlertTriangle, CheckCircle2, RefreshCw, Clock, Shield, Activity } from "lucide-react";
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

interface TokenType{id:string;name:string;type:string;totalActive:number;expiringSoon:number;expired:number;avgTtlHours:number;autoRefresh:boolean;status:"healthy"|"warning"|"critical";lastRotated:string;}

const seedTokens=():TokenType[]=>[
  {id:"t1",name:"User Auth Tokens",type:"JWT",totalActive:12400,expiringSoon:84,expired:12,avgTtlHours:24,autoRefresh:true,status:"healthy",lastRotated:new Date(Date.now()-86400000).toISOString()},
  {id:"t2",name:"API Keys",type:"api_key",totalActive:340,expiringSoon:28,expired:5,avgTtlHours:8760,autoRefresh:false,status:"warning",lastRotated:new Date(Date.now()-2592000000).toISOString()},
  {id:"t3",name:"Payment Tokens",type:"razorpay",totalActive:120,expiringSoon:0,expired:0,avgTtlHours:0.25,autoRefresh:true,status:"healthy",lastRotated:new Date(Date.now()-900000).toISOString()},
  {id:"t4",name:"Webhook Secrets",type:"secret",totalActive:8,expiringSoon:2,expired:1,avgTtlHours:8760,autoRefresh:false,status:"warning",lastRotated:new Date(Date.now()-7776000000).toISOString()},
];

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={healthy:"#4ade80",warning:"#fbbf24",critical:"#f87171"};

export default function AdminTokenManagement(){
  const{theme}=useDashboardTheme();const T=TH[theme];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[tokens,setTokens]=useState<TokenType[]>(()=>load("admin_token_mgmt_v1",seedTokens));
  const[rotating,setRotating]=useState<string|null>(null);
  const[revoking,setRevoking]=useState<string|null>(null);

  const rotate=async(t:TokenType)=>{
    setRotating(t.id);
    await new Promise(r=>setTimeout(r,1500));
    const upd=tokens.map(x=>x.id===t.id?{...x,expiringSoon:0,expired:0,status:"healthy" as const,lastRotated:new Date().toISOString()}:x);
    localStorage.setItem("admin_token_mgmt_v1",JSON.stringify(upd));setTokens(upd);setRotating(null);
    logAction("Token Rotation",`${t.name} — rotated`,"Security","warning");
    toast({title:`${t.name} rotated — ${t.expired} expired tokens revoked`});
  };

  const revokeExpired=async(t:TokenType)=>{
    setRevoking(t.id);
    await new Promise(r=>setTimeout(r,800));
    const upd=tokens.map(x=>x.id===t.id?{...x,expired:0,totalActive:x.totalActive-x.expired}:x);
    localStorage.setItem("admin_token_mgmt_v1",JSON.stringify(upd));setTokens(upd);setRevoking(null);
    toast({title:`${t.expired} expired ${t.name} revoked`});
  };

  const warnings=tokens.filter(t=>t.status!=="healthy").length;
  const totalExpiringSoon=tokens.reduce((s,t)=>s+t.expiringSoon,0);

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <Key size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Token Expiry Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Token expiry monitoring · Refresh mechanism · Failure alerts · Usage logs · Lifecycle management</p>
          </div>
        </div>
        {totalExpiringSoon>0&&<div style={{marginTop:12,background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.2)",borderRadius:9,padding:"8px 14px",display:"flex",gap:8,alignItems:"center"}}>
          <AlertTriangle size={13} color="#fbbf24"/><span style={{fontSize:12,color:"#fbbf24"}}>{totalExpiringSoon} tokens expiring soon — review and rotate</span>
        </div>}
        <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
          {[{l:"Token Types",v:tokens.length,c:T.badgeFg},{l:"Active",v:tokens.reduce((s,t)=>s+t.totalActive,0).toLocaleString(),c:"#4ade80"},{l:"Expiring Soon",v:totalExpiringSoon,c:totalExpiringSoon>0?"#fbbf24":"#4ade80"},{l:"Warnings",v:warnings,c:warnings>0?"#f87171":"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {tokens.map(t=>(
          <div key={t.id} style={{background:T.card,border:`1px solid ${t.status!=="healthy"?`${sColor[t.status]}33`:T.border}`,borderRadius:13,padding:"16px 18px"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:8}}>
              <div style={{width:38,height:38,borderRadius:10,background:`${A1}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Key size={16} color={A1}/>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:13,color:T.text}}>{t.name}</span>
                  <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5,fontFamily:"monospace"}}>{t.type}</span>
                  <span style={{fontSize:10,fontWeight:700,color:sColor[t.status],background:`${sColor[t.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{t.status}</span>
                  {t.autoRefresh&&<span style={{fontSize:10,color:"#4ade80"}}>✓ auto-refresh</span>}
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:T.sub}}>Active: <strong style={{color:T.text}}>{t.totalActive.toLocaleString()}</strong></span>
                  {t.expiringSoon>0&&<span style={{fontSize:12,color:"#fbbf24"}}>{t.expiringSoon} expiring soon</span>}
                  {t.expired>0&&<span style={{fontSize:12,color:"#f87171"}}>{t.expired} expired</span>}
                  <span style={{fontSize:12,color:T.sub}}>Rotated: {safeDist(t.lastRotated)} ago</span>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>rotate(t)} disabled={rotating===t.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                <RefreshCw size={10} className={rotating===t.id?"animate-spin":""}/>{rotating===t.id?"Rotating…":"Rotate"}
              </button>
              {t.expired>0&&<button onClick={()=>revokeExpired(t)} disabled={revoking===t.id} style={{padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {revoking===t.id?"Revoking…":`Revoke ${t.expired} Expired`}
              </button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
