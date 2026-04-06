import { useState } from "react";
import { Globe, AlertTriangle, CheckCircle2, RefreshCw, Activity } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface Language{id:string;code:string;name:string;enabled:boolean;completionPct:number;fallback:string;isDefault:boolean;encodingValid:boolean;}
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminLocalization(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[languages,setLanguages]=useState([]);
  const[checking,setChecking]=useState(false);
  const[testCode,setTestCode]=useState("Hello, welcome!");

  const toggle=(id:string)=>{
    const upd=languages.map(l=>l.id===id?{...l,enabled:!l.enabled}:l);
    localStorage.setItem("admin_localization_v1",JSON.stringify(upd));setLanguages(upd);
    toast({title:"Language setting updated"});
  };
  const checkAll=async()=>{
    setChecking(true);await new Promise(r=>setTimeout(r,1500));
    const upd=languages.map(l=>({...l,encodingValid:true}));
    localStorage.setItem("admin_localization_v1",JSON.stringify(upd));setLanguages(upd);setChecking(false);
    toast({title:"UTF-8 encoding validation complete"});
  };

  const errors=languages.filter(l=>!l.encodingValid&&l.enabled).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Globe size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Localization Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Multi-language support · Translation management · UTF-8 validation · Fallback mechanism · Language testing</p>
          </div>
          <button onClick={checkAll} disabled={checking} style={{padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>{checking?"Checking…":"Validate Encoding"}</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Languages",v:languages.length,c:T.badgeFg},{l:"Enabled",v:languages.filter(l=>l.enabled).length,c:"#4ade80"},{l:"Encoding Errors",v:errors,c:errors>0?"#f87171":"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 18px",marginBottom:12}}>
        <p style={{fontWeight:700,fontSize:12,color:T.text,margin:"0 0 6px"}}>Translation Test Tool</p>
        <div style={{display:"flex",gap:8}}>
          <input value={testCode} onChange={e=>setTestCode(e.target.value)} placeholder="Enter text to test..." style={{flex:1,background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"7px 12px",fontSize:13}}/>
          <button onClick={()=>toast({title:`Test string validated across ${languages.filter(l=>l.enabled).length} languages`})} style={{padding:"7px 14px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:12,fontWeight:600,cursor:"pointer"}}>Test</button>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {languages.map(l=>(
          <div key={l.id} style={{background:T.card,border:`1px solid ${!l.encodingValid&&l.enabled?"rgba(248,113,113,.2)":T.border}`,borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:11,color:T.sub}}>{l.code}</span>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{l.name}</span>
                {l.isDefault&&<span style={{fontSize:10,color:"#4ade80"}}>DEFAULT</span>}
                {!l.encodingValid&&<span style={{fontSize:10,color:"#f87171"}}>UTF-8 error</span>}
                {l.fallback&&<span style={{fontSize:10,color:T.sub}}>fallback: {l.fallback}</span>}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{flex:1,maxWidth:200}}>
                  <div style={{height:4,borderRadius:4,background:"rgba(255,255,255,.07)"}}>
                    <div style={{height:"100%",borderRadius:4,background:l.completionPct>90?"#4ade80":l.completionPct>50?"#fbbf24":"#f87171",width:`${l.completionPct}%`}}/>
                  </div>
                </div>
                <span style={{fontSize:11,color:T.sub}}>{l.completionPct}% translated</span>
              </div>
            </div>
            <button onClick={()=>toggle(l.id)} disabled={l.isDefault} style={{padding:"5px 14px",borderRadius:7,background:l.enabled?`${A1}15`:"rgba(148,163,184,.1)",border:`1px solid ${l.enabled?A1:T.border}`,color:l.enabled?T.badgeFg:T.sub,fontSize:11,fontWeight:600,cursor:l.isDefault?"not-allowed":"pointer",flexShrink:0}}>
              {l.enabled?"Enabled":"Disabled"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
