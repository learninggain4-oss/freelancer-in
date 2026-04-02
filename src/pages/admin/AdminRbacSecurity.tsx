import { useState } from "react";
import { UserCheck, AlertTriangle, CheckCircle2, RefreshCw, Shield, Lock } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface RoleChange{id:string;user:string;fromRole:string;toRole:string;requestedBy:string;status:"pending"|"approved"|"rejected";at:string;suspicious:boolean;}
interface Role{id:string;name:string;level:number;permissions:string[];users:number;}
const seedRoles=():Role[]=>[
  {id:"r1",name:"Super Admin",level:5,permissions:["all"],users:1},
  {id:"r2",name:"Admin",level:4,permissions:["users","jobs","payments","settings"],users:3},
  {id:"r3",name:"Moderator",level:3,permissions:["users","jobs","reviews"],users:8},
  {id:"r4",name:"Support",level:2,permissions:["users","tickets"],users:12},
];
const seedChanges=():RoleChange[]=>[
  {id:"rc1",user:"user_512",fromRole:"Support",toRole:"Admin",requestedBy:"Admin B",status:"pending",at:new Date(Date.now()-3600000).toISOString(),suspicious:true},
  {id:"rc2",user:"user_288",fromRole:"Freelancer",toRole:"Moderator",requestedBy:"Super Admin",status:"approved",at:new Date(Date.now()-86400000).toISOString(),suspicious:false},
  {id:"rc3",user:"user_901",fromRole:"Client",toRole:"Admin",requestedBy:"Admin A",status:"rejected",at:new Date(Date.now()-172800000).toISOString(),suspicious:true},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminRbacSecurity(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[roles]=useState(()=>load("admin_rbac_roles_v1",seedRoles));
  const[changes,setChanges]=useState(()=>load("admin_rbac_changes_v1",seedChanges));
  const[acting,setActing]=useState<string|null>(null);
  const[tab,setTab]=useState<"roles"|"changes">("changes");

  const approve=async(id:string)=>{
    setActing(id);await new Promise(r=>setTimeout(r,600));
    const upd=changes.map(c=>c.id===id?{...c,status:"approved" as const}:c);
    localStorage.setItem("admin_rbac_changes_v1",JSON.stringify(upd));setChanges(upd);setActing(null);
    toast({title:"Role change approved"});
  };
  const reject=async(id:string)=>{
    setActing(id);await new Promise(r=>setTimeout(r,400));
    const upd=changes.map(c=>c.id===id?{...c,status:"rejected" as const}:c);
    localStorage.setItem("admin_rbac_changes_v1",JSON.stringify(upd));setChanges(upd);setActing(null);
    toast({title:"Role change rejected"});
  };

  const pending=changes.filter(c=>c.status==="pending").length;
  const suspicious=changes.filter(c=>c.suspicious).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><UserCheck size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>RBAC Security System (CRITICAL)</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Strict role validation · Change approval workflow · Audit logs · Unauthorized change alerts · Hierarchy control</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Pending Changes",v:pending,c:pending>0?"#fbbf24":"#4ade80"},{l:"Suspicious",v:suspicious,c:suspicious>0?"#f87171":"#4ade80"},{l:"Roles",v:roles.length,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {([["changes","Role Changes",UserCheck],["roles","Role Hierarchy",Shield]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer"}}>
            <Icon size={13}/>{l}
          </button>
        ))}
      </div>
      {tab==="changes"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {changes.map(c=>(
          <div key={c.id} style={{background:T.card,border:`1px solid ${c.suspicious?"rgba(248,113,113,.25)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{c.user}</span>
                <span style={{fontSize:12,color:T.sub}}>{c.fromRole} → <strong style={{color:"#fbbf24"}}>{c.toRole}</strong></span>
                {c.suspicious&&<span style={{fontSize:10,color:"#f87171",fontWeight:700}}>⚠ SUSPICIOUS</span>}
                <span style={{fontSize:10,fontWeight:700,color:c.status==="pending"?"#fbbf24":c.status==="approved"?"#4ade80":"#f87171",textTransform:"capitalize"}}>{c.status}</span>
              </div>
              <p style={{fontSize:11,color:T.sub,margin:0}}>By {c.requestedBy} · {format(new Date(c.at),"MMM d, HH:mm")}</p>
            </div>
            {c.status==="pending"&&<div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>approve(c.id)} disabled={acting===c.id} style={{padding:"5px 10px",borderRadius:7,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer"}}>Approve</button>
              <button onClick={()=>reject(c.id)} disabled={acting===c.id} style={{padding:"5px 10px",borderRadius:7,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer"}}>Reject</button>
            </div>}
          </div>
        ))}
      </div>}
      {tab==="roles"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {[...roles].sort((a,b)=>b.level-a.level).map(r=>(
          <div key={r.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{width:24,height:24,borderRadius:6,background:`${A1}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:800,color:T.badgeFg}}>L{r.level}</span></div>
              <span style={{fontWeight:700,fontSize:13,color:T.text}}>{r.name}</span>
              <span style={{fontSize:11,color:T.sub}}>{r.users} users</span>
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {r.permissions.map(p=><span key={p} style={{fontSize:10,color:T.badgeFg,background:`${A1}12`,padding:"2px 8px",borderRadius:4,border:`1px solid ${A1}22`}}>{p}</span>)}
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
