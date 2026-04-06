import { useState } from "react";
import { FileText, AlertTriangle, CheckCircle2, RefreshCw, Archive, Clock, Trash2 } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={
  black:{bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc"},
  white:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
  wb:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
};

interface LogStore{id:string;name:string;type:string;sizeMB:number;maxMB:number;retentionDays:number;compressionEnabled:boolean;autoCleanup:boolean;archivedMB:number;status:"ok"|"warning"|"full";lastRotated:string;}


function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={ok:"#4ade80",warning:"#fbbf24",full:"#f87171"};

export default function AdminLogManagement(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[stores,setStores]=useState<LogStore[]>([]);
  const[rotating,setRotating]=useState<string|null>(null);
  const[compressing,setCompressing]=useState<string|null>(null);
  const[archiving,setArchiving]=useState<string|null>(null);

  const rotate=async(ls:LogStore)=>{
    setRotating(ls.id);
    await new Promise(r=>setTimeout(r,1500));
    const freed=Math.round(ls.sizeMB*0.7);
    const upd=stores.map(x=>x.id===ls.id?{...x,sizeMB:x.sizeMB-freed,status:"ok" as const,lastRotated:new Date().toISOString()}:x);
    localStorage.setItem("admin_log_mgmt_v1",JSON.stringify(upd));setStores(upd);setRotating(null);
    logAction("Log Rotation",`${ls.name} — freed ${freed} MB`,"System","success");
    toast({title:`${ls.name} rotated — freed ${freed} MB`});
  };

  const compress=async(ls:LogStore)=>{
    setCompressing(ls.id);
    await new Promise(r=>setTimeout(r,2000));
    const upd=stores.map(x=>x.id===ls.id?{...x,compressionEnabled:true,sizeMB:Math.round(x.sizeMB*.55)}:x);
    localStorage.setItem("admin_log_mgmt_v1",JSON.stringify(upd));setStores(upd);setCompressing(null);
    toast({title:`${ls.name} compressed — size reduced ~45%`});
  };

  const archive=async(ls:LogStore)=>{
    setArchiving(ls.id);
    await new Promise(r=>setTimeout(r,1800));
    const moved=Math.round(ls.sizeMB*0.8);
    const upd=stores.map(x=>x.id===ls.id?{...x,sizeMB:x.sizeMB-moved,archivedMB:x.archivedMB+moved}:x);
    localStorage.setItem("admin_log_mgmt_v1",JSON.stringify(upd));setStores(upd);setArchiving(null);
    toast({title:`${moved} MB archived from ${ls.name}`});
  };

  const totalMB=stores.reduce((s,l)=>s+l.sizeMB,0);
  const warnings=stores.filter(l=>l.status!=="ok").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <FileText size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Log Storage Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Log rotation · Compression · Retention policy · Size monitoring · Cleanup · Archive system</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Log Stores",v:stores.length,c:T.badgeFg},{l:"Warnings",v:warnings,c:warnings>0?"#fbbf24":"#4ade80"},{l:"Total Size",v:`${(totalMB/1024).toFixed(1)} GB`,c:totalMB>6000?"#f87171":T.badgeFg},{l:"Archived",v:`${(stores.reduce((s,l)=>s+l.archivedMB,0)/1024).toFixed(1)} GB`,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {stores.map(ls=>{
          const fillPct=Math.round((ls.sizeMB/ls.maxMB)*100);
          return(
            <div key={ls.id} style={{background:T.card,border:`1px solid ${ls.status!=="ok"?`${sColor[ls.status]}33`:T.border}`,borderRadius:14,padding:"16px 18px"}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:13,color:T.text}}>{ls.name}</span>
                    <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{ls.type}</span>
                    <span style={{fontSize:10,fontWeight:700,color:sColor[ls.status],background:`${sColor[ls.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{ls.status}</span>
                    {ls.compressionEnabled&&<span style={{fontSize:10,color:"#4ade80"}}>✓ compressed</span>}
                    {ls.autoCleanup&&<span style={{fontSize:10,color:"#4ade80"}}>✓ auto-cleanup</span>}
                  </div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:8}}>
                    <span style={{fontSize:12,color:T.sub}}>Size: <strong style={{color:sColor[ls.status]}}>{ls.sizeMB} MB</strong> / {ls.maxMB} MB ({fillPct}%)</span>
                    <span style={{fontSize:12,color:T.sub}}>Retention: {ls.retentionDays}d</span>
                    <span style={{fontSize:12,color:T.sub}}>Archived: {ls.archivedMB} MB</span>
                  </div>
                  <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,.07)",overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:5,background:sColor[ls.status],width:`${fillPct}%`,transition:"width .5s ease"}}/>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>rotate(ls)} disabled={rotating===ls.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  <RefreshCw size={10} className={rotating===ls.id?"animate-spin":""}/>{rotating===ls.id?"Rotating…":"Rotate"}
                </button>
                {!ls.compressionEnabled&&<button onClick={()=>compress(ls)} disabled={compressing===ls.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(74,222,128,.07)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {compressing===ls.id?"Compressing…":"Compress"}
                </button>}
                <button onClick={()=>archive(ls)} disabled={archiving===ls.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(251,191,36,.07)",border:"1px solid rgba(251,191,36,.2)",color:"#fbbf24",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  <Archive size={10}/>{archiving===ls.id?"Archiving…":"Archive Old"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
