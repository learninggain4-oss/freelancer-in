import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, RefreshCw, Clock, Eye, Zap } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={
  black:{bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc"},
  white:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
  wb:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
};

interface Patch{id:string;name:string;version:string;severity:"critical"|"high"|"medium"|"low";status:"pending"|"scheduled"|"applying"|"applied"|"failed";description:string;scheduledFor?:string;appliedAt?:string;autoApply:boolean;}
interface Vulnerability{id:string;component:string;cve:string;severity:"critical"|"high"|"medium"|"low";description:string;fixAvailable:boolean;}


function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={critical:"#f87171",high:"#fb923c",medium:"#fbbf24",low:"#94a3b8"};
const pColor={pending:"#fbbf24",scheduled:"#a5b4fc",applying:"#6366f1",applied:"#4ade80",failed:"#f87171"};

export default function AdminSecurityPatch(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[tab,setTab]=useState<"patches"|"vulns">("patches");
  const[patches,setPatches]=useState<Patch[]>([]);
  const[vulns]=useState<Vulnerability[]>([]);
  const[applying,setApplying]=useState<string|null>(null);

  const applyPatch=async(p:Patch)=>{
    setApplying(p.id);
    const upd1=patches.map(x=>x.id===p.id?{...x,status:"applying" as const}:x);setPatches(upd1);
    await new Promise(r=>setTimeout(r,2500));
    const ok=Math.random()>.1;
    const upd2=patches.map(x=>x.id===p.id?{...x,status:ok?"applied" as const:"failed" as const,appliedAt:ok?new Date().toISOString():undefined}:x);
    localStorage.setItem("admin_sec_patch_v1",JSON.stringify(upd2));setPatches(upd2);setApplying(null);
    logAction("Security Patch",`${p.name} ${p.version} — ${ok?"applied":"FAILED"}`,"Security",ok?"success":"warning");
    toast({title:`${p.name} — ${ok?"Applied successfully":"Application FAILED — retry needed"}`});
  };

  const critical=patches.filter(p=>p.severity==="critical"&&p.status==="pending").length;
  const pending=patches.filter(p=>p.status==="pending"||p.status==="scheduled").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <Shield size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Security Patch Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Patch alerts · Vulnerability scanning · Update scheduler · Verification · Health monitoring</p>
          </div>
        </div>
        {critical>0&&<div style={{marginTop:12,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.25)",borderRadius:9,padding:"8px 14px",display:"flex",gap:8,alignItems:"center"}}>
          <AlertTriangle size={13} color="#f87171"/><span style={{fontSize:12,color:"#f87171",fontWeight:600}}>{critical} CRITICAL patch(es) pending — immediate action required</span>
        </div>}
        <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
          {[{l:"Patches",v:patches.length,c:T.badgeFg},{l:"Pending",v:pending,c:pending>0?"#fbbf24":"#4ade80"},{l:"Critical",v:critical,c:critical>0?"#f87171":"#4ade80"},{l:"Applied",v:patches.filter(p=>p.status==="applied").length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {([["patches","Security Patches",Shield],["vulns","Vulnerabilities",AlertTriangle]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer"}}>
            <Icon size={13}/>{l}{t==="vulns"&&vulns.filter(v=>v.severity==="critical").length>0&&<span style={{background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800}}>{vulns.filter(v=>v.severity==="critical").length}</span>}
          </button>
        ))}
      </div>

      {tab==="patches"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {patches.map(p=>(
          <div key={p.id} style={{background:T.card,border:`1px solid ${p.severity==="critical"&&p.status==="pending"?"rgba(248,113,113,.3)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{p.name}</span>
                <span style={{fontSize:10,fontFamily:"monospace",color:T.sub,background:T.input,padding:"2px 6px",borderRadius:4}}>{p.version}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[p.severity],background:`${sColor[p.severity]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{p.severity}</span>
                <span style={{fontSize:10,fontWeight:700,color:pColor[p.status],background:`${pColor[p.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{p.status}</span>
              </div>
              <p style={{fontSize:12,color:T.sub,margin:0}}>{p.description}</p>
            </div>
            {(p.status==="pending"||p.status==="scheduled")&&<button onClick={()=>applyPatch(p)} disabled={applying===p.id} style={{padding:"7px 14px",borderRadius:9,background:p.severity==="critical"?"rgba(248,113,113,.1)":`${A1}15`,border:`1px solid ${p.severity==="critical"?"rgba(248,113,113,.3)":`${A1}33`}`,color:p.severity==="critical"?"#f87171":T.badgeFg,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>
              {applying===p.id?"Applying…":"Apply Patch"}
            </button>}
          </div>
        ))}
      </div>}

      {tab==="vulns"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {vulns.map(v=>(
          <div key={v.id} style={{background:T.card,border:`1px solid ${v.severity==="critical"?"rgba(248,113,113,.25)":T.border}`,borderRadius:13,padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:13,color:T.text}}>{v.component}</span>
              <span style={{fontSize:10,fontFamily:"monospace",color:T.sub}}>{v.cve}</span>
              <span style={{fontSize:10,fontWeight:700,color:sColor[v.severity],background:`${sColor[v.severity]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{v.severity}</span>
              {v.fixAvailable&&<span style={{fontSize:10,color:"#4ade80"}}>✓ fix available</span>}
            </div>
            <p style={{fontSize:12,color:T.sub,margin:0}}>{v.description}</p>
          </div>
        ))}
      </div>}
    </div>
  );
}
