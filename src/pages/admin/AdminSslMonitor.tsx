import { useState } from "react";
import { Lock, AlertTriangle, CheckCircle2, RefreshCw, Shield, Globe } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface Certificate{id:string;domain:string;issuer:string;expiresAt:string;autoRenew:boolean;httpsEnforced:boolean;status:"valid"|"expiring"|"expired";}
const seed=():Certificate[]=>[
  {id:"ssl1",domain:"freelancer.in",issuer:"Let's Encrypt",expiresAt:new Date(Date.now()+45*86400000).toISOString(),autoRenew:true,httpsEnforced:true,status:"valid"},
  {id:"ssl2",domain:"api.freelancer.in",issuer:"Let's Encrypt",expiresAt:new Date(Date.now()+12*86400000).toISOString(),autoRenew:false,httpsEnforced:true,status:"expiring"},
  {id:"ssl3",domain:"cdn.freelancer.in",issuer:"DigiCert",expiresAt:new Date(Date.now()+180*86400000).toISOString(),autoRenew:true,httpsEnforced:true,status:"valid"},
  {id:"ssl4",domain:"old.freelancer.in",issuer:"Comodo",expiresAt:new Date(Date.now()-5*86400000).toISOString(),autoRenew:false,httpsEnforced:false,status:"expired"},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={valid:"#4ade80",expiring:"#fbbf24",expired:"#f87171"};

export default function AdminSslMonitor(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[certs,setCerts]=useState(()=>load("admin_ssl_v1",seed));
  const[renewing,setRenewing]=useState<string|null>(null);

  const renew=async(c:Certificate)=>{
    setRenewing(c.id);await new Promise(r=>setTimeout(r,1500));
    const newExpiry=new Date(Date.now()+90*86400000).toISOString();
    const upd=certs.map(x=>x.id===c.id?{...x,expiresAt:newExpiry,status:"valid" as const}:x);
    localStorage.setItem("admin_ssl_v1",JSON.stringify(upd));setCerts(upd);setRenewing(null);
    toast({title:`${c.domain} certificate renewed — valid 90 days`});
  };
  const toggleAutoRenew=(id:string)=>{
    const upd=certs.map(c=>c.id===id?{...c,autoRenew:!c.autoRenew}:c);
    localStorage.setItem("admin_ssl_v1",JSON.stringify(upd));setCerts(upd);
    toast({title:"Auto-renew updated"});
  };

  const expiring=certs.filter(c=>c.status!=="valid").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Lock size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>SSL Certificate Monitoring</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Expiry monitoring · Auto renewal · Health dashboard · Certificate validation · HTTPS enforcement</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Certificates",v:certs.length,c:T.badgeFg},{l:"Valid",v:certs.filter(c=>c.status==="valid").length,c:"#4ade80"},{l:"Expiring/Expired",v:expiring,c:expiring>0?"#f87171":"#4ade80"},{l:"Auto-renew",v:certs.filter(c=>c.autoRenew).length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {certs.map(c=>{
          const daysLeft=differenceInDays(new Date(c.expiresAt),new Date());
          return(
            <div key={c.id} style={{background:T.card,border:`1px solid ${c.status!=="valid"?`${sColor[c.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:sColor[c.status],flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <Globe size={13} color={T.sub}/>
                  <span style={{fontWeight:700,fontSize:13,color:T.text}}>{c.domain}</span>
                  <span style={{fontSize:10,color:T.sub}}>{c.issuer}</span>
                  <span style={{fontSize:10,fontWeight:700,color:sColor[c.status],textTransform:"capitalize"}}>{c.status}</span>
                  {c.httpsEnforced&&<span style={{fontSize:10,color:"#4ade80"}}>HTTPS</span>}
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:T.sub}}>Expires: <strong style={{color:daysLeft<30?"#fbbf24":"#4ade80"}}>{daysLeft>0?`${daysLeft}d`:"Expired"}</strong></span>
                  <span style={{fontSize:12,color:T.sub}}>{safeFmt(c.expiresAt, "MMM d, yyyy")}</span>
                  <button onClick={()=>toggleAutoRenew(c.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:c.autoRenew?"#4ade80":T.sub,padding:0}}>Auto-renew: {c.autoRenew?"ON":"OFF"}</button>
                </div>
              </div>
              <button onClick={()=>renew(c)} disabled={renewing===c.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                {renewing===c.id?"Renewing…":"Renew"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
