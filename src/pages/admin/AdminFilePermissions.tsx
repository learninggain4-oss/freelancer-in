import { useState } from "react";
import { Lock, AlertTriangle, CheckCircle2, Eye, EyeOff, Shield, FileText } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface FileRule{id:string;bucket:string;visibility:"public"|"private"|"role-based";roles:string[];allowedOps:string[];signedUrlExpiry:number;changeApprovalRequired:boolean;lastModified:string;}
interface AccessLog{id:string;file:string;user:string;action:string;ip:string;at:string;allowed:boolean;}
const seedRules=():FileRule[]=>[
  {id:"fr1",bucket:"user-avatars",visibility:"public",roles:[],allowedOps:["read","write"],signedUrlExpiry:3600,changeApprovalRequired:false,lastModified:new Date(Date.now()-86400000).toISOString()},
  {id:"fr2",bucket:"kyc-documents",visibility:"private",roles:["admin","moderator"],allowedOps:["read"],signedUrlExpiry:300,changeApprovalRequired:true,lastModified:new Date(Date.now()-172800000).toISOString()},
  {id:"fr3",bucket:"invoice-pdfs",visibility:"role-based",roles:["admin","client","freelancer"],allowedOps:["read"],signedUrlExpiry:3600,changeApprovalRequired:false,lastModified:new Date(Date.now()-604800000).toISOString()},
];
const seedLogs=():AccessLog[]=>[
  {id:"al1",file:"kyc_rahul_2024.pdf",user:"Admin A",action:"read",ip:"192.168.1.5",at:new Date(Date.now()-1800000).toISOString(),allowed:true},
  {id:"al2",file:"kyc_priya_2024.pdf",user:"unknown_user",action:"read",ip:"45.79.12.200",at:new Date(Date.now()-3600000).toISOString(),allowed:false},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminFilePermissions(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[rules,setRules]=useState(()=>load("admin_file_perm_v1",seedRules));
  const[logs]=useState(()=>load("admin_file_access_logs_v1",seedLogs));
  const[tab,setTab]=useState<"rules"|"logs">("rules");

  const toggleVisibility=(id:string)=>{
    const upd=rules.map(r=>r.id===id?{...r,visibility:r.visibility==="public"?"private" as const:"public" as const,lastModified:new Date().toISOString()}:r);
    localStorage.setItem("admin_file_perm_v1",JSON.stringify(upd));setRules(upd);
    toast({title:"File visibility updated"});
  };
  const toggleApproval=(id:string)=>{
    const upd=rules.map(r=>r.id===id?{...r,changeApprovalRequired:!r.changeApprovalRequired}:r);
    localStorage.setItem("admin_file_perm_v1",JSON.stringify(upd));setRules(upd);
    toast({title:"Approval requirement updated"});
  };

  const denied=logs.filter(l=>!l.allowed).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Lock size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>File Access Control System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Permission management · Public/private toggle · Role validation · Access logs · Audit trail</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Buckets",v:rules.length,c:T.badgeFg},{l:"Private",v:rules.filter(r=>r.visibility==="private").length,c:"#4ade80"},{l:"Access Denied",v:denied,c:denied>0?"#f87171":"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {([["rules","Permission Rules",Lock],["logs","Access Logs",FileText]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer"}}>
            <Icon size={13}/>{l}
          </button>
        ))}
      </div>
      {tab==="rules"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {rules.map(r=>(
          <div key={r.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
              <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text}}>{r.bucket}</span>
              <span style={{fontSize:10,fontWeight:700,color:r.visibility==="public"?"#fbbf24":"#4ade80",textTransform:"capitalize"}}>{r.visibility}</span>
              {r.roles.length>0&&<span style={{fontSize:10,color:T.sub}}>Roles: {r.roles.join(", ")}</span>}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={()=>toggleVisibility(r.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:7,background:r.visibility==="public"?"rgba(74,222,128,.08)":"rgba(251,191,36,.08)",border:`1px solid ${r.visibility==="public"?"rgba(74,222,128,.2)":"rgba(251,191,36,.2)"}`,color:r.visibility==="public"?"#4ade80":"#fbbf24",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {r.visibility==="public"?<Eye size={10}/>:<EyeOff size={10}/>}Toggle {r.visibility==="public"?"Private":"Public"}
              </button>
              <button onClick={()=>toggleApproval(r.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:7,background:`${A1}12`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                <Shield size={10}/>Approval: {r.changeApprovalRequired?"Required":"Off"}
              </button>
              <span style={{fontSize:11,color:T.sub,alignSelf:"center"}}>Signed URL: {r.signedUrlExpiry}s</span>
            </div>
          </div>
        ))}
      </div>}
      {tab==="logs"&&<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden"}}>
        {logs.map((l,i)=>(
          <div key={l.id} style={{display:"flex",gap:12,padding:"12px 18px",borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
            {l.allowed?<CheckCircle2 size={13} color="#4ade80"/>:<AlertTriangle size={13} color="#f87171"/>}
            <div style={{flex:1}}>
              <p style={{fontWeight:600,fontSize:12,color:T.text,margin:"0 0 1px"}}>{l.user} — {l.action} — {l.file}</p>
              <p style={{fontSize:11,color:T.sub,margin:0}}>IP: {l.ip} · {format(new Date(l.at),"MMM d, HH:mm")}</p>
            </div>
            <span style={{fontSize:10,fontWeight:700,color:l.allowed?"#4ade80":"#f87171"}}>{l.allowed?"ALLOWED":"DENIED"}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}
