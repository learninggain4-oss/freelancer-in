import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Monitor, Globe, AlertTriangle, Shield, Ban, CheckCircle2, Eye, Clock, Wifi, Lock } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type IPRecord = { id:string; ip:string; user:string; country:string; isp:string; vpn:boolean; proxy:boolean; failedLogins:number; status:string; lastSeen:string; locations:string[] };
type DeviceRecord = { id:string; fingerprint:string; user:string; device:string; os:string; browser:string; status:string; lastSeen:string; logins:number };

const IP_RECORDS: IPRecord[] = [];

const DEVICE_RECORDS: DeviceRecord[] = [];

const statusColor = (s: string) => s==="blocked"||s==="blacklisted"?"#f87171":s==="suspicious"?"#f97316":s==="whitelisted"?"#4ade80":"#94a3b8";

export default function AdminIPDeviceMonitor() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const [tab, setTab] = useState<"ip"|"device">("ip");
  const [ipRecords, setIpRecords] = useState(IP_RECORDS);
  const [devices, setDevices] = useState(DEVICE_RECORDS);
  const [selectedIP, setSelectedIP] = useState<IPRecord|null>(null);
  const [actionMsg, setActionMsg] = useState("");

  const ipAction = (id: string, action: string) => {
    const statusMap: Record<string,string> = { Block:"blocked", Unblock:"clean", Whitelist:"whitelisted", Blacklist:"blacklisted" };
    const newStatus = statusMap[action];
    if (newStatus) setIpRecords(r => r.map(x => x.id===id ? {...x, status:newStatus} : x));
    setActionMsg(`${action} applied`);
    setTimeout(()=>setActionMsg(""),3000);
    setSelectedIP(null);
  };

  const deviceAction = (id: string, action: string) => {
    const statusMap: Record<string,string> = { Block:"blocked", Allow:"clean" };
    const newStatus = statusMap[action];
    if (newStatus) setDevices(d => d.map(x => x.id===id ? {...x, status:newStatus} : x));
    setActionMsg(`Device ${action}ed`);
    setTimeout(()=>setActionMsg(""),3000);
  };

  const stats = [
    { label:"Blocked IPs", value:ipRecords.filter(r=>r.status==="blocked").length, color:"#f87171", icon:Ban },
    { label:"VPN Detected", value:ipRecords.filter(r=>r.vpn).length, color:"#f97316", icon:Wifi },
    { label:"Proxy Detected", value:ipRecords.filter(r=>r.proxy).length, color:"#fbbf24", icon:Globe },
    { label:"Whitelisted IPs", value:ipRecords.filter(r=>r.status==="whitelisted").length, color:"#4ade80", icon:CheckCircle2 },
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
            <Monitor size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>IP & Device Monitoring</h1>
            <p style={{ fontSize:13, color:T.sub, margin:0 }}>Track suspicious IPs, device fingerprints, VPNs, and proxies</p>
          </div>
          {actionMsg && <div style={{ marginLeft:"auto", padding:"8px 16px", borderRadius:8, background:"rgba(74,222,128,.15)", border:"1px solid rgba(74,222,128,.3)", color:"#4ade80", fontSize:13 }}>{actionMsg}</div>}
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, backdropFilter:"blur(10px)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:12, color:T.sub }}>{s.label}</span>
                  <Icon size={18} color={s.color} />
                </div>
                <div style={{ fontSize:28, fontWeight:700, color:s.color }}>{s.value}</div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:16, background:T.card, borderRadius:12, padding:4, border:`1px solid ${T.border}`, width:"fit-content" }}>
          {(["ip","device"] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 20px", borderRadius:9, border:"none", background:tab===t?`linear-gradient(135deg,${A1},${A2})`:"transparent", color:tab===t?"#fff":T.sub, fontSize:13, fontWeight:tab===t?700:400, cursor:"pointer" }}>{t==="ip"?"IP Tracking":"Device Tracking"}</button>
          ))}
        </div>

        {tab==="ip" && (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(10px)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:T.input }}>
                  {["IP Address","User","Country","ISP","VPN","Proxy","Failed Logins","Status","Last Seen","Actions"].map(h=>(
                    <th key={h} style={{ padding:"11px 12px", textAlign:"left", fontSize:12, color:T.sub, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ipRecords.length === 0
                  ? <tr><td colSpan={10} style={{ textAlign:"center", padding:"48px 20px", color:T.sub, fontSize:14 }}>No IP records found</td></tr>
                  : ipRecords.map(r => (
                    <tr key={r.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:"12px", fontFamily:"monospace", fontSize:13, color:A1, fontWeight:600 }}>{r.ip}</td>
                      <td style={{ padding:"12px", fontSize:13, color:T.text }}>{r.user}</td>
                      <td style={{ padding:"12px", fontSize:13, color:T.sub }}>{r.country}</td>
                      <td style={{ padding:"12px", fontSize:12, color:T.sub }}>{r.isp}</td>
                      <td style={{ padding:"12px" }}><span style={{ fontSize:12, color:r.vpn?"#f97316":"#4ade80", fontWeight:600 }}>{r.vpn?"YES":"NO"}</span></td>
                      <td style={{ padding:"12px" }}><span style={{ fontSize:12, color:r.proxy?"#f87171":"#4ade80", fontWeight:600 }}>{r.proxy?"YES":"NO"}</span></td>
                      <td style={{ padding:"12px" }}><span style={{ fontSize:13, color:r.failedLogins>5?"#f87171":T.text, fontWeight:r.failedLogins>5?700:400 }}>{r.failedLogins}</span></td>
                      <td style={{ padding:"12px" }}><span style={{ padding:"3px 10px", borderRadius:20, background:`${statusColor(r.status)}15`, color:statusColor(r.status), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.status}</span></td>
                      <td style={{ padding:"12px", fontSize:12, color:T.sub }}>{r.lastSeen}</td>
                      <td style={{ padding:"12px" }}>
                        <div style={{ display:"flex", gap:4 }}>
                          <button onClick={()=>setSelectedIP(r)} style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${T.border}`, background:T.input, color:T.sub, cursor:"pointer", fontSize:11 }}><Eye size={12}/></button>
                          <button onClick={()=>ipAction(r.id, r.status==="blocked"?"Unblock":"Block")} style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${r.status==="blocked"?"#4ade80":"#f87171"}`, background:r.status==="blocked"?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)", color:r.status==="blocked"?"#4ade80":"#f87171", cursor:"pointer", fontSize:11 }}>
                            {r.status==="blocked"?"Unblock":"Block"}
                          </button>
                          <button onClick={()=>ipAction(r.id,"Whitelist")} style={{ padding:"4px 8px", borderRadius:6, border:`1px solid #4ade80`, background:"rgba(74,222,128,.1)", color:"#4ade80", cursor:"pointer", fontSize:11 }}>✓</button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {tab==="device" && (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(10px)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:T.input }}>
                  {["Fingerprint","User","Device","OS","Browser","Status","Logins","Last Seen","Actions"].map(h=>(
                    <th key={h} style={{ padding:"11px 12px", textAlign:"left", fontSize:12, color:T.sub, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devices.length === 0
                  ? <tr><td colSpan={9} style={{ textAlign:"center", padding:"48px 20px", color:T.sub, fontSize:14 }}>No device records found</td></tr>
                  : devices.map(d => (
                    <tr key={d.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:"12px", fontFamily:"monospace", fontSize:12, color:A2 }}>{d.fingerprint}</td>
                      <td style={{ padding:"12px", fontSize:13, color:T.text }}>{d.user}</td>
                      <td style={{ padding:"12px", fontSize:13, color:T.sub }}>{d.device}</td>
                      <td style={{ padding:"12px", fontSize:12, color:T.sub }}>{d.os}</td>
                      <td style={{ padding:"12px", fontSize:12, color:T.sub }}>{d.browser}</td>
                      <td style={{ padding:"12px" }}><span style={{ padding:"3px 10px", borderRadius:20, background:`${statusColor(d.status)}15`, color:statusColor(d.status), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{d.status}</span></td>
                      <td style={{ padding:"12px", fontSize:13, color:T.text }}>{d.logins}</td>
                      <td style={{ padding:"12px", fontSize:12, color:T.sub }}>{d.lastSeen}</td>
                      <td style={{ padding:"12px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={()=>deviceAction(d.id,"Block")} style={{ padding:"5px 10px", borderRadius:6, border:`1px solid #f87171`, background:"rgba(248,113,113,.1)", color:"#f87171", cursor:"pointer", fontSize:12 }}>Block</button>
                          <button onClick={()=>deviceAction(d.id,"Allow")} style={{ padding:"5px 10px", borderRadius:6, border:`1px solid #4ade80`, background:"rgba(74,222,128,.1)", color:"#4ade80", cursor:"pointer", fontSize:12 }}>Allow</button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* IP Detail Modal */}
        {selectedIP && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:460 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>IP: {selectedIP.ip}</h2>
                <button onClick={()=>setSelectedIP(null)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:20 }}>×</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                {[["User",selectedIP.user],["Country",selectedIP.country],["ISP",selectedIP.isp],["VPN",selectedIP.vpn?"Yes":"No"],["Proxy",selectedIP.proxy?"Yes":"No"],["Failed Logins",String(selectedIP.failedLogins)],["Status",selectedIP.status],["Last Seen",selectedIP.lastSeen]].map(([k,v])=>(
                  <div key={k} style={{ background:T.input, borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontSize:11, color:T.sub }}>{k}</div>
                    <div style={{ fontSize:13, color:T.text, fontWeight:600, marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:T.sub, marginBottom:8 }}>Login Locations</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {selectedIP.locations.map(l=><span key={l} style={{ padding:"3px 10px", borderRadius:20, background:`${A1}15`, color:A1, fontSize:12 }}>{l}</span>)}
                </div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                {["Block","Unblock","Whitelist","Blacklist"].map(act=>(
                  <button key={act} onClick={()=>ipAction(selectedIP.id,act)} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, cursor:"pointer" }}>{act}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
