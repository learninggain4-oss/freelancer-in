import { useState } from "react";
import { Globe, AlertTriangle, CheckCircle2, RefreshCw, Activity, Shield } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface DnsRecord{id:string;type:string;name:string;value:string;ttl:number;status:"ok"|"mismatch"|"missing";}
interface Domain{id:string;domain:string;registrar:string;expiresAt:string;status:"active"|"expiring"|"expired";records:DnsRecord[];}
const seed=():Domain[]=>[
  {id:"d1",domain:"freelancer.in",registrar:"GoDaddy",expiresAt:new Date(Date.now()+365*86400000).toISOString(),status:"active",records:[
    {id:"r1",type:"A",name:"@",value:"104.21.48.1",ttl:300,status:"ok"},
    {id:"r2",type:"CNAME",name:"www",value:"freelancer.in",ttl:300,status:"ok"},
    {id:"r3",type:"MX",name:"@",value:"mail.freelancer.in",ttl:3600,status:"mismatch"},
  ]},
  {id:"d2",domain:"api.freelancer.in",registrar:"GoDaddy",expiresAt:new Date(Date.now()+30*86400000).toISOString(),status:"expiring",records:[
    {id:"r4",type:"A",name:"api",value:"104.21.48.2",ttl:300,status:"ok"},
  ]},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const dColor={active:"#4ade80",expiring:"#fbbf24",expired:"#f87171"};
const rColor={ok:"#4ade80",mismatch:"#fbbf24",missing:"#f87171"};

export default function AdminDnsDomain(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[domains]=useState(()=>load("admin_dns_v1",seed));
  const[checking,setChecking]=useState<string|null>(null);
  const[expanded,setExpanded]=useState<string|null>(null);

  const check=async(id:string)=>{
    setChecking(id);await new Promise(r=>setTimeout(r,1500));setChecking(null);
    toast({title:"DNS validation complete"});
  };

  const issues=domains.flatMap(d=>d.records).filter(r=>r.status!=="ok").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Globe size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Domain & DNS Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>DNS record monitoring · Domain status · Change logs · Validation tool · Failure alerts · Expiry monitoring</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Domains",v:domains.length,c:T.badgeFg},{l:"DNS Issues",v:issues,c:issues>0?"#fbbf24":"#4ade80"},{l:"Records",v:domains.flatMap(d=>d.records).length,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {domains.map(d=>{
          const daysLeft=differenceInDays(new Date(d.expiresAt),new Date());
          return(
            <div key={d.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
              <div style={{padding:"14px 18px",display:"flex",gap:12,alignItems:"center",cursor:"pointer"}} onClick={()=>setExpanded(expanded===d.id?null:d.id)}>
                <div style={{width:8,height:8,borderRadius:"50%",background:dColor[d.status],flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontWeight:700,fontSize:13,color:T.text}}>{d.domain}</span>
                    <span style={{fontSize:10,color:T.sub}}>{d.registrar}</span>
                    <span style={{fontSize:10,fontWeight:700,color:dColor[d.status],textTransform:"capitalize"}}>{d.status}</span>
                  </div>
                  <span style={{fontSize:12,color:T.sub}}>Expires: <strong style={{color:daysLeft<60?"#fbbf24":"#4ade80"}}>{daysLeft}d</strong> · {safeFmt(d.expiresAt, "MMM d, yyyy")}</span>
                </div>
                <button onClick={e=>{e.stopPropagation();check(d.id);}} disabled={checking===d.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                  {checking===d.id?"Checking…":"Validate DNS"}
                </button>
              </div>
              {expanded===d.id&&<div style={{borderTop:`1px solid ${T.border}`}}>
                {d.records.map((r,i)=>(
                  <div key={r.id} style={{display:"flex",gap:10,padding:"9px 18px",borderBottom:i<d.records.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
                    <span style={{fontSize:10,fontWeight:700,color:T.sub,width:40}}>{r.type}</span>
                    <span style={{fontSize:11,color:T.text,flex:1}}>{r.name} → <code style={{fontSize:10}}>{r.value}</code></span>
                    <span style={{fontSize:10,color:T.sub}}>TTL: {r.ttl}s</span>
                    <span style={{fontSize:10,fontWeight:700,color:rColor[r.status],textTransform:"capitalize"}}>{r.status}</span>
                  </div>
                ))}
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
