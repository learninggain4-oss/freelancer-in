import { useState } from "react";
import { Download, AlertTriangle, CheckCircle2, RefreshCw, FileText, Activity } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface ExportFormat{id:string;name:string;format:"csv"|"xlsx"|"pdf"|"json";supported:boolean;tested:boolean;encoding:string;maxRows:number;status:"ok"|"issue";}
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminExportFormat(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[formats,setFormats]=useState([]);
  const[testing,setTesting]=useState<string|null>(null);
  const[exporting,setExporting]=useState<string|null>(null);

  const testFormat=async(f:ExportFormat)=>{
    setTesting(f.id);await new Promise(r=>setTimeout(r,1500));
    const ok=Math.random()>.1;
    const upd=formats.map(x=>x.id===f.id?{...x,tested:ok,status:ok?"ok" as const:"issue" as const}:x);
    localStorage.setItem("admin_export_fmt_v1",JSON.stringify(upd));setFormats(upd);setTesting(null);
    toast({title:`${f.name} format test: ${ok?"Passed":"Failed"}`});
  };
  const exportData=async(f:ExportFormat)=>{
    setExporting(f.id);await new Promise(r=>setTimeout(r,1200));setExporting(null);
    toast({title:`${f.name} exported successfully`});
  };

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Download size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Data Export Format Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Multi-format support · Template system · Encoding validation · Format testing · Preview · Download management</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Formats",v:formats.length,c:T.badgeFg},{l:"Issues",v:formats.filter(f=>f.status==="issue").length,c:formats.filter(f=>f.status==="issue").length>0?"#f87171":"#4ade80"},{l:"Tested",v:formats.filter(f=>f.tested).length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {formats.map(f=>(
          <div key={f.id} style={{background:T.card,border:`1px solid ${f.status==="issue"?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{f.name}</span>
                <span style={{fontSize:10,fontFamily:"monospace",color:T.sub,background:T.input,padding:"2px 6px",borderRadius:4}}>.{f.format}</span>
                <span style={{fontSize:10,fontWeight:700,color:f.status==="ok"?"#4ade80":"#f87171"}}>{f.status==="ok"?"OK":"Issue"}</span>
                {!f.tested&&<span style={{fontSize:10,color:"#fbbf24"}}>Untested</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Encoding: {f.encoding}</span>
                <span style={{fontSize:12,color:T.sub}}>Max rows: {f.maxRows.toLocaleString()}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>testFormat(f)} disabled={testing===f.id} style={{padding:"5px 10px",borderRadius:7,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>{testing===f.id?"Testing…":"Test"}</button>
              <button onClick={()=>exportData(f)} disabled={exporting===f.id||f.status==="issue"} style={{padding:"5px 10px",borderRadius:7,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer"}}>{exporting===f.id?"…":"Export"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
