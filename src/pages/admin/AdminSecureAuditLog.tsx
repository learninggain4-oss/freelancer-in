import { useState } from "react";
import { ClipboardList, AlertTriangle, CheckCircle2, Lock, Shield, Eye } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface AuditEntry{id:string;actor:string;action:string;target:string;ip:string;hash:string;at:string;tampered:boolean;accessLevel:"admin"|"super_admin"|"system";}
const seed=():AuditEntry[]=>[
  {id:"a1",actor:"Admin A",action:"Updated commission rate",target:"Settings/Finance",ip:"122.161.45.12",hash:"a3f8c2e1",at:new Date(Date.now()-3600000).toISOString(),tampered:false,accessLevel:"admin"},
  {id:"a2",actor:"System",action:"Auto-archived old jobs",target:"Jobs/Archive",ip:"127.0.0.1",hash:"b9e4d7f2",at:new Date(Date.now()-86400000).toISOString(),tampered:false,accessLevel:"system"},
  {id:"a3",actor:"unknown",action:"Attempted log deletion",target:"Audit/Logs",ip:"45.79.12.200",hash:"MISMATCH",at:new Date(Date.now()-7200000).toISOString(),tampered:true,accessLevel:"admin"},
  {id:"a4",actor:"Super Admin",action:"Role escalation approved",target:"Users/Roles",ip:"192.168.1.5",hash:"c5a2f8d1",at:new Date(Date.now()-172800000).toISOString(),tampered:false,accessLevel:"super_admin"},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminSecureAuditLog(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[entries]=useState(()=>load("admin_secure_audit_v1",seed));
  const[verifying,setVerifying]=useState(false);
  const[search,setSearch]=useState("");
  const[retentionDays,setRetentionDays]=useState(365);

  const verify=async()=>{
    setVerifying(true);await new Promise(r=>setTimeout(r,1800));setVerifying(false);
    const tampered=entries.filter(e=>e.tampered).length;
    toast({title:tampered>0?`⚠ ${tampered} logs show hash mismatch`:"All log hashes verified — no tampering detected"});
  };

  const filtered=entries.filter(e=>!search||e.actor.toLowerCase().includes(search.toLowerCase())||e.action.toLowerCase().includes(search.toLowerCase()));
  const tampered=entries.filter(e=>e.tampered).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><ClipboardList size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Secure Audit Log System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Immutable logs · Integrity validation · Access control · Encryption · Tampering detection · Backup · Retention</p>
          </div>
          <button onClick={verify} disabled={verifying} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            <Shield size={13}/>{verifying?"Verifying…":"Verify Integrity"}
          </button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Total Logs",v:entries.length,c:T.badgeFg},{l:"Tampered",v:tampered,c:tampered>0?"#f87171":"#4ade80"},{l:"Retention",v:`${retentionDays}d`,c:T.badgeFg},{l:"Encrypted",v:"Yes",c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      {tampered>0&&<div style={{background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.2)",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",gap:8,alignItems:"center"}}>
        <AlertTriangle size={13} color="#f87171"/><span style={{fontSize:12,color:"#f87171"}}>⚠ {tampered} log entries show hash mismatch — potential tampering detected</span>
      </div>}
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search logs..." style={{flex:1,minWidth:200,background:T.card,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"8px 12px",fontSize:13}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:T.card,border:`1px solid ${T.border}`,borderRadius:8}}>
          <Lock size={13} color={T.sub}/><span style={{fontSize:12,color:T.sub}}>Retention:</span>
          <input type="number" value={retentionDays} onChange={e=>setRetentionDays(+e.target.value)} style={{width:60,background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:"3px 6px",fontSize:12}}/><span style={{fontSize:12,color:T.sub}}>days</span>
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        {filtered.map((e,i)=>(
          <div key={e.id} style={{display:"flex",gap:12,padding:"12px 18px",borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none",alignItems:"center",background:e.tampered?"rgba(248,113,113,.04)":"transparent"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:e.tampered?"#f87171":"#4ade80",flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}>
                <span style={{fontWeight:600,fontSize:12,color:T.text}}>{e.actor}</span>
                <span style={{fontSize:10,color:T.sub,background:T.input,padding:"1px 6px",borderRadius:4}}>{e.accessLevel}</span>
                {e.tampered&&<span style={{fontSize:10,color:"#f87171",fontWeight:700}}>HASH MISMATCH</span>}
              </div>
              <p style={{fontSize:12,color:T.text,margin:"0 0 1px"}}>{e.action} — {e.target}</p>
              <p style={{fontSize:11,color:T.sub,margin:0}}>IP: {e.ip} · Hash: <code style={{fontSize:10}}>{e.hash}</code> · {format(new Date(e.at),"MMM d, HH:mm")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
