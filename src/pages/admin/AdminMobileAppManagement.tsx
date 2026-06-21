import { useState } from "react";
import { toast } from "sonner";
import { Smartphone, Save, AlertTriangle, CheckCircle2, RefreshCw, Tablet, Monitor } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1="#6366f1";
const MOB_KEY="admin_mobile_app_v1";

type Platform={name:string;icon:any;currentVersion:string;minVersion:string;latestVersion:string;forceUpdate:boolean;maintenanceMode:boolean;maintenanceMsg:string;changeLog:string;storeUrl:string};
type AppConfig={android:Platform;ios:Platform;web:Platform;globalMaintenance:boolean;globalMsg:string};

function defaultConfig():AppConfig{return{
  android:{name:"Android",icon:"📱",currentVersion:"2.1.0",minVersion:"1.8.0",latestVersion:"2.1.0",forceUpdate:false,maintenanceMode:false,maintenanceMsg:"App is under maintenance. Please check back in 30 minutes.",changeLog:"• Bug fixes\n• Performance improvements\n• New badge system",storeUrl:"https://play.google.com/store/apps/details?id=space.freelan"},
  ios:{name:"iOS",icon:"🍎",currentVersion:"2.1.0",minVersion:"1.9.0",latestVersion:"2.1.0",forceUpdate:false,maintenanceMode:false,maintenanceMsg:"App is under maintenance. Please check back in 30 minutes.",changeLog:"• Bug fixes\n• Performance improvements\n• New badge system",storeUrl:"https://apps.apple.com/in/app/freelan/id000000000"},
  web:{name:"Web",icon:"🌐",currentVersion:"2.4.1",minVersion:"2.0.0",latestVersion:"2.4.1",forceUpdate:false,maintenanceMode:false,maintenanceMsg:"Site is under maintenance. We'll be back soon!",changeLog:"• 10 new admin pages\n• Improved KYC flow\n• GST invoice support",storeUrl:"https://freelan.space"},
  globalMaintenance:false,globalMsg:"FreeLan.space is under scheduled maintenance. We'll be back in 2 hours.",
};}
function loadConfig():AppConfig{try{const d=localStorage.getItem(MOB_KEY);if(d)return JSON.parse(d);}catch{}const s=defaultConfig();localStorage.setItem(MOB_KEY,JSON.stringify(s));return s;}
function saveConfigFn(c:AppConfig){localStorage.setItem(MOB_KEY,JSON.stringify(c));}

const AdminMobileAppManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [config, setConfig] = useState<AppConfig>(loadConfig);
  const [saved, setSaved] = useState(false);

  const setPlatform=(key:"android"|"ios"|"web",k:keyof Platform,v:any)=>setConfig(p=>({...p,[key]:{...p[key],[k]:v}}));

  const handleSave=()=>{saveConfigFn(config);setSaved(true);toast.success("App configuration saved");setTimeout(()=>setSaved(false),2000);};

  const Toggle=({val,onToggle,label}:{val:boolean;onToggle:()=>void;label:string})=>(
    <label style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer" }}>
      <div onClick={onToggle} style={{ width:38,height:21,borderRadius:11,background:val?"#ef4444":"rgba(148,163,184,.3)",position:"relative",cursor:"pointer",transition:"background .2s" }}>
        <div style={{ position:"absolute",top:2.5,left:val?18:2.5,width:16,height:16,borderRadius:8,background:"#fff",transition:"left .2s" }}/>
      </div>
      <span style={{ fontSize:13,color:T.text,fontWeight:600 }}>{label}</span>
    </label>
  );

  const Field=({label,value,onChange,type="text",rows}:{label:string;value:string;onChange:(v:string)=>void;type?:string;rows?:number})=>(
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:5 }}>{label}</label>
      {rows
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,resize:"vertical",boxSizing:"border-box" as any }}/>
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,boxSizing:"border-box" as any }}/>
      }
    </div>
  );

  return (
    <div style={{ padding:"24px 16px", maxWidth:1000, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Mobile App Version Management</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Control app versions, force updates, and maintenance mode</p>
        </div>
        <button onClick={handleSave} style={{ background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <Save size={13}/> {saved?"Saved!":"Save All"}
        </button>
      </div>

      <div style={{ background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", borderRadius:12, padding:"16px 20px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:14, color:"#f87171", marginBottom:4 }}>🚨 Global Platform Maintenance</div>
          <div style={{ fontSize:12, color:T.sub }}>Enable to show maintenance banner on all platforms</div>
        </div>
        <Toggle val={config.globalMaintenance} onToggle={()=>setConfig(p=>({...p,globalMaintenance:!p.globalMaintenance}))} label={config.globalMaintenance?"Maintenance ON":"Maintenance OFF"}/>
      </div>

      {config.globalMaintenance&&(
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:6 }}>Global Maintenance Message</label>
          <input value={config.globalMsg} onChange={e=>setConfig(p=>({...p,globalMsg:e.target.value}))} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,boxSizing:"border-box" as any }}/>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:18 }}>
        {(["android","ios","web"] as const).map(key=>{
          const p=config[key];
          return (
            <div key={key} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <span style={{ fontSize:24 }}>{p.icon}</span>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:T.text }}>{p.name}</div>
                  <div style={{ fontSize:11, color:T.sub }}>Current: v{p.currentVersion}</div>
                </div>
                {p.maintenanceMode&&<span style={{ marginLeft:"auto",background:"rgba(239,68,68,.12)",color:"#f87171",border:"1px solid rgba(239,68,68,.3)",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700 }}>MAINTENANCE</span>}
                {p.forceUpdate&&<span style={{ marginLeft:p.maintenanceMode?"0":"auto",background:"rgba(251,191,36,.12)",color:"#fbbf24",border:"1px solid rgba(251,191,36,.3)",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700 }}>FORCE UPDATE</span>}
              </div>
              <Field label="Current Version" value={p.currentVersion} onChange={v=>setPlatform(key,"currentVersion",v)}/>
              <Field label="Minimum Supported Version" value={p.minVersion} onChange={v=>setPlatform(key,"minVersion",v)}/>
              <Field label="Latest Version" value={p.latestVersion} onChange={v=>setPlatform(key,"latestVersion",v)}/>
              <Field label={key==="web"?"URL":"Store URL"} value={p.storeUrl} onChange={v=>setPlatform(key,"storeUrl",v)}/>
              <Field label="What's New" value={p.changeLog} onChange={v=>setPlatform(key,"changeLog",v)} rows={3}/>
              <Field label="Maintenance Message" value={p.maintenanceMsg} onChange={v=>setPlatform(key,"maintenanceMsg",v)} rows={2}/>
              <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:8 }}>
                <Toggle val={p.forceUpdate} onToggle={()=>setPlatform(key,"forceUpdate",!p.forceUpdate)} label="Force Update Required"/>
                <Toggle val={p.maintenanceMode} onToggle={()=>setPlatform(key,"maintenanceMode",!p.maintenanceMode)} label="Maintenance Mode"/>
              </div>
              {p.minVersion>p.currentVersion&&<div style={{ marginTop:10,padding:"8px 10px",background:"rgba(251,191,36,.1)",border:"1px solid rgba(251,191,36,.3)",borderRadius:7,fontSize:11,color:"#fbbf24" }}>⚠️ Min version is higher than current version</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminMobileAppManagement;
