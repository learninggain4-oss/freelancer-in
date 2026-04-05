import { useState } from "react";
import { Upload, AlertTriangle, CheckCircle2, RefreshCw, Shield, FileText } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface UploadEvent{id:string;filename:string;user:string;sizeMb:number;checksum:string;status:"valid"|"corrupted"|"recovering";uploadedAt:string;}
const seed=():UploadEvent[]=>[
  {id:"u1",filename:"portfolio_rahul.pdf",user:"user_182",sizeMb:2.4,checksum:"a3f8c2e1b9",status:"valid",uploadedAt:new Date(Date.now()-3600000).toISOString()},
  {id:"u2",filename:"kyc_priya.jpg",user:"user_510",sizeMb:1.8,checksum:"MISMATCH",status:"corrupted",uploadedAt:new Date(Date.now()-7200000).toISOString()},
  {id:"u3",filename:"project_specs.docx",user:"user_288",sizeMb:0.8,checksum:"d4a7f3c2e1",status:"valid",uploadedAt:new Date(Date.now()-1800000).toISOString()},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={valid:"#4ade80",corrupted:"#f87171",recovering:"#fbbf24"};

export default function AdminFileUploadValidation(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[uploads,setUploads]=useState(()=>load("admin_file_upload_v1",seed));
  const[recovering,setRecovering]=useState<string|null>(null);
  const[rules,setRules]=useState({maxSizeMB:50,checksumEnabled:true,retryEnabled:true});

  const recover=async(id:string)=>{
    setRecovering(id);
    const upd1=uploads.map(u=>u.id===id?{...u,status:"recovering" as const}:u);setUploads(upd1);
    await new Promise(r=>setTimeout(r,2000));
    const ok=Math.random()>.3;
    const upd2=uploads.map(u=>u.id===id?{...u,status:ok?"valid" as const:"corrupted" as const,checksum:ok?"recovered_checksum":"MISMATCH"}:u);
    localStorage.setItem("admin_file_upload_v1",JSON.stringify(upd2));setUploads(upd2);setRecovering(null);
    toast({title:ok?"File recovered successfully":"Recovery failed"});
  };

  const corrupted=uploads.filter(u=>u.status==="corrupted").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Upload size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>File Upload Validation System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>File integrity validation · Upload retry · Checksum verification · Progress tracking · Error detection · Recovery</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Total Uploads",v:uploads.length,c:T.badgeFg},{l:"Corrupted",v:corrupted,c:corrupted>0?"#f87171":"#4ade80"},{l:"Valid",v:uploads.filter(u=>u.status==="valid").length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 18px",marginBottom:12}}>
        <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 10px"}}>Validation Rules</p>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:12,color:T.sub}}>Max size (MB):</span>
          <input type="number" value={rules.maxSizeMB} onChange={e=>setRules(p=>({...p,maxSizeMB:+e.target.value}))} style={{width:70,background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"4px 8px",fontSize:12}}/>
          {([["checksumEnabled","Checksum Verify"],["retryEnabled","Auto Retry"]] as const).map(([k,l])=>(
            <button key={k} onClick={()=>setRules(p=>({...p,[k]:!p[k as keyof typeof p]}))} style={{padding:"4px 12px",borderRadius:6,background:rules[k]?`${A1}18`:"rgba(148,163,184,.1)",border:`1px solid ${rules[k]?A1:T.border}`,color:rules[k]?T.badgeFg:T.sub,fontSize:11,fontWeight:700,cursor:"pointer"}}>
              {l}: {rules[k]?"ON":"OFF"}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {uploads.map(u=>(
          <div key={u.id} style={{background:T.card,border:`1px solid ${u.status==="corrupted"?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:sColor[u.status],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{u.filename}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[u.status],textTransform:"capitalize"}}>{u.status}</span>
                <span style={{fontSize:10,color:T.sub}}>{u.sizeMb} MB</span>
              </div>
              <div style={{display:"flex",gap:12}}>
                <span style={{fontSize:12,color:T.sub}}>By {u.user}</span>
                <span style={{fontSize:12,color:T.sub}}>Checksum: <code style={{fontSize:10,color:u.checksum==="MISMATCH"?"#f87171":"#4ade80"}}>{u.checksum}</code></span>
                <span style={{fontSize:12,color:T.sub}}>{safeDist(u.uploadedAt)} ago</span>
              </div>
            </div>
            {u.status==="corrupted"&&<button onClick={()=>recover(u.id)} disabled={recovering===u.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              {recovering===u.id?"Recovering…":"Recover"}
            </button>}
          </div>
        ))}
      </div>
    </div>
  );
}
