import { useState } from "react";
import { ClipboardCheck, AlertTriangle, CheckCircle2, RefreshCw, Shield, FileText } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface Policy{id:string;name:string;regulation:string;version:string;status:"compliant"|"needs-review"|"non-compliant";lastReviewed:string;nextReview:string;consentRequired:boolean;}
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const COMPLIANCE_KEY="admin_compliance_v1";
function seedPolicies2():Policy[]{return[
  {id:"cp1",name:"GDPR Data Retention",regulation:"GDPR",version:"2.1",status:"compliant",lastReviewed:new Date(Date.now()-864e5*30).toISOString(),nextReview:new Date(Date.now()+864e5*60).toISOString(),consentRequired:true},
  {id:"cp2",name:"IT Act 2000 Compliance",regulation:"India IT Act",version:"1.3",status:"compliant",lastReviewed:new Date(Date.now()-864e5*14).toISOString(),nextReview:new Date(Date.now()+864e5*76).toISOString(),consentRequired:false},
  {id:"cp3",name:"PCI-DSS Payment Standards",regulation:"PCI-DSS",version:"4.0",status:"needs-review",lastReviewed:new Date(Date.now()-864e5*90).toISOString(),nextReview:new Date(Date.now()+864e5*5).toISOString(),consentRequired:false},
  {id:"cp4",name:"Data Localization Policy",regulation:"India DPDP Act",version:"1.0",status:"non-compliant",lastReviewed:new Date(Date.now()-864e5*45).toISOString(),nextReview:new Date(Date.now()-864e5*5).toISOString(),consentRequired:true},
];}
const sColor={compliant:"#4ade80","needs-review":"#fbbf24","non-compliant":"#f87171"};

export default function AdminComplianceManager(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[policies,setPolicies]=useState<Policy[]>(()=>load(COMPLIANCE_KEY,seedPolicies2));
  const[reviewing,setReviewing]=useState<string|null>(null);

  const markReviewed=async(id:string)=>{
    setReviewing(id);await new Promise(r=>setTimeout(r,800));
    const upd=policies.map(p=>p.id===id?{...p,status:"compliant" as const,lastReviewed:new Date().toISOString(),nextReview:new Date(Date.now()+90*86400000).toISOString(),version:`v${(parseFloat(p.version.slice(1))+0.1).toFixed(1)}`}:p);
    localStorage.setItem("admin_compliance_v1",JSON.stringify(upd));setPolicies(upd);setReviewing(null);
    toast({title:"Policy marked as reviewed"});
  };

  const nonCompliant=policies.filter(p=>p.status==="non-compliant").length;
  const needsReview=policies.filter(p=>p.status==="needs-review").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><ClipboardCheck size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Compliance Management System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Policy configuration · Regulation alerts · Data privacy settings · Consent management · Audit logs · Version control</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Policies",v:policies.length,c:T.badgeFg},{l:"Non-Compliant",v:nonCompliant,c:nonCompliant>0?"#f87171":"#4ade80"},{l:"Needs Review",v:needsReview,c:needsReview>0?"#fbbf24":"#4ade80"},{l:"Compliant",v:policies.filter(p=>p.status==="compliant").length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {policies.map(p=>(
          <div key={p.id} style={{background:T.card,border:`1px solid ${p.status!=="compliant"?`${sColor[p.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:sColor[p.status],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{p.name}</span>
                <span style={{fontSize:10,color:T.sub}}>{p.regulation}</span>
                <span style={{fontSize:10,color:T.sub}}>{p.version}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[p.status],textTransform:"capitalize"}}>{p.status.replace(/-/g," ")}</span>
                {p.consentRequired&&<span style={{fontSize:10,color:"#a5b4fc"}}>consent required</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Reviewed: {safeFmt(p.lastReviewed, "MMM d, yyyy")}</span>
                <span style={{fontSize:12,color:new Date(p.nextReview)<new Date()?"#f87171":T.sub}}>Next review: {safeFmt(p.nextReview, "MMM d, yyyy")}</span>
              </div>
            </div>
            {p.status!=="compliant"&&<button onClick={()=>markReviewed(p.id)} disabled={reviewing===p.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              {reviewing===p.id?"…":"Mark Reviewed"}
            </button>}
          </div>
        ))}
      </div>
    </div>
  );
}
