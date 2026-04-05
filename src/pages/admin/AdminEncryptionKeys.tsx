import { useState } from "react";
import { KeyRound, AlertTriangle, CheckCircle2, RefreshCw, Lock, Shield } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface EncKey{id:string;name:string;purpose:string;algorithm:string;createdAt:string;expiresAt:string;status:"active"|"expiring"|"expired"|"rotated";rotationDays:number;lastUsed:string;}
const seed=():EncKey[]=>[
  {id:"k1",name:"Database Encryption Key",purpose:"Data at rest",algorithm:"AES-256-GCM",createdAt:new Date(Date.now()-90*86400000).toISOString(),expiresAt:new Date(Date.now()+275*86400000).toISOString(),status:"active",rotationDays:365,lastUsed:new Date(Date.now()-60000).toISOString()},
  {id:"k2",name:"JWT Signing Key",purpose:"Session tokens",algorithm:"RS-256",createdAt:new Date(Date.now()-80*86400000).toISOString(),expiresAt:new Date(Date.now()+25*86400000).toISOString(),status:"expiring",rotationDays:90,lastUsed:new Date(Date.now()-30000).toISOString()},
  {id:"k3",name:"Payment Encryption Key",purpose:"Card data",algorithm:"AES-256-CBC",createdAt:new Date(Date.now()-180*86400000).toISOString(),expiresAt:new Date(Date.now()-5*86400000).toISOString(),status:"expired",rotationDays:180,lastUsed:new Date(Date.now()-432000000).toISOString()},
  {id:"k4",name:"Backup Encryption Key",purpose:"Backup files",algorithm:"AES-256-GCM",createdAt:new Date(Date.now()-30*86400000).toISOString(),expiresAt:new Date(Date.now()+335*86400000).toISOString(),status:"active",rotationDays:365,lastUsed:new Date(Date.now()-3600000).toISOString()},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={active:"#4ade80",expiring:"#fbbf24",expired:"#f87171",rotated:"#a5b4fc"};

export default function AdminEncryptionKeys(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[keys,setKeys]=useState(()=>load("admin_enc_keys_v1",seed));
  const[rotating,setRotating]=useState<string|null>(null);

  const rotate=async(k:EncKey)=>{
    setRotating(k.id);await new Promise(r=>setTimeout(r,2000));
    const newExpiry=new Date(Date.now()+k.rotationDays*86400000).toISOString();
    const upd=keys.map(x=>x.id===k.id?{...x,status:"active" as const,expiresAt:newExpiry,createdAt:new Date().toISOString()}:x);
    localStorage.setItem("admin_enc_keys_v1",JSON.stringify(upd));setKeys(upd);setRotating(null);
    toast({title:`${k.name} rotated successfully`});
  };

  const expiring=keys.filter(k=>k.status==="expiring"||k.status==="expired").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><KeyRound size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Encryption Key Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Secure storage · Key backup · Rotation schedule · Access control · Usage logs · Recovery · Expiry alerts</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Keys",v:keys.length,c:T.badgeFg},{l:"Active",v:keys.filter(k=>k.status==="active").length,c:"#4ade80"},{l:"Needs Attention",v:expiring,c:expiring>0?"#f87171":"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {keys.map(k=>{
          const daysLeft=differenceInDays(new Date(k.expiresAt),new Date());
          return(
            <div key={k.id} style={{background:T.card,border:`1px solid ${k.status!=="active"?`${sColor[k.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:13,color:T.text}}>{k.name}</span>
                  <span style={{fontSize:10,fontFamily:"monospace",color:T.sub}}>{k.algorithm}</span>
                  <span style={{fontSize:10,fontWeight:700,color:sColor[k.status],textTransform:"capitalize"}}>{k.status}</span>
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:T.sub}}>Purpose: {k.purpose}</span>
                  <span style={{fontSize:12,color:T.sub}}>Expires: <strong style={{color:daysLeft<30?"#fbbf24":daysLeft<0?"#f87171":"#4ade80"}}>{daysLeft>0?`${daysLeft}d`:"Expired"}</strong></span>
                  <span style={{fontSize:12,color:T.sub}}>Rotation: every {k.rotationDays}d</span>
                  <span style={{fontSize:12,color:T.sub}}>Last used: {safeDist(k.lastUsed)} ago</span>
                </div>
              </div>
              <button onClick={()=>rotate(k)} disabled={rotating===k.id} style={{padding:"6px 14px",borderRadius:8,background:k.status==="expired"?"rgba(248,113,113,.1)":`${A1}15`,border:`1px solid ${k.status==="expired"?"rgba(248,113,113,.25)":A1+"33"}`,color:k.status==="expired"?"#f87171":T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                {rotating===k.id?"Rotating…":"Rotate Key"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
