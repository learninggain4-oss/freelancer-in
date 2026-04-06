import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Monitor, Globe, Shield, Ban, CheckCircle2, Eye, Wifi, Loader2 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type IPRecord = { id:string; ip:string; user:string; country:string; isp:string; vpn:boolean; proxy:boolean; failedLogins:number; status:string; lastSeen:string; locations:string[] };

const statusColor = (s: string) => s==="blocked"||s==="blacklisted"?"#f87171":s==="suspicious"?"#f97316":s==="whitelisted"?"#4ade80":"#94a3b8";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminIPDeviceMonitor() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [tab, setTab] = useState<"ip"|"device">("ip");
  const [selectedIP, setSelectedIP] = useState<IPRecord|null>(null);
  const [actionMsg, setActionMsg] = useState("");

  const { data: blockedIps = [], isLoading: loadingIPs } = useQuery({
    queryKey: ["admin-blocked-ips-monitor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_ips")
        .select("*, blocker:blocked_by(full_name)")
        .order("blocked_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const { data: visitors = [], isLoading: loadingVisitors } = useQuery({
    queryKey: ["admin-site-visitors-monitor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_visitors")
        .select("id, ip_address, profile_id, visited_at, user_agent, page_path")
        .order("visited_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const ipRecords: IPRecord[] = blockedIps.map((b: { id: string; ip_address: string; blocked_at: string; reason: string | null }) => ({
    id: b.id,
    ip: b.ip_address,
    user: "Blocked",
    country: "India",
    isp: "Unknown",
    vpn: false,
    proxy: false,
    failedLogins: 0,
    status: "blocked",
    lastSeen: b.blocked_at ? timeAgo(b.blocked_at) : "—",
    locations: ["India"],
  }));

  const uniqueIPs = [...new Map(visitors.map((v: { ip_address: string | null }) => [v.ip_address, v])).values()].filter(v => v.ip_address);
  const visitorsAsIPs: IPRecord[] = uniqueIPs.slice(0, 50).map((v: { id: string; ip_address: string | null; visited_at: string; user_agent: string | null }) => {
    const isBlocked = blockedIps.some((b: { ip_address: string }) => b.ip_address === v.ip_address);
    return {
      id: v.id,
      ip: v.ip_address || "—",
      user: "Visitor",
      country: "India",
      isp: "Unknown",
      vpn: false,
      proxy: false,
      failedLogins: 0,
      status: isBlocked ? "blocked" : "clean",
      lastSeen: timeAgo(v.created_at),
      locations: ["India"],
    };
  });

  const allIPs = [...ipRecords, ...visitorsAsIPs.filter(v => !ipRecords.some(b => b.ip === v.ip))];

  const deviceRecords = visitors.filter((v: { user_agent: string | null }) => v.user_agent).slice(0, 50).map((v: { id: string; ip_address: string | null; user_agent: string | null; created_at: string }) => {
    const ua = v.user_agent || "";
    const isAndroid = ua.includes("Android");
    const isIOS = ua.includes("iPhone") || ua.includes("iPad");
    const isChrome = ua.includes("Chrome");
    const isFirefox = ua.includes("Firefox");
    return {
      id: v.id,
      fingerprint: v.id.slice(0, 16).toUpperCase(),
      user: v.ip_address || "Unknown",
      device: isAndroid ? "Android" : isIOS ? "iOS" : "Desktop",
      os: isAndroid ? "Android" : isIOS ? "iOS" : "Windows",
      browser: isChrome ? "Chrome" : isFirefox ? "Firefox" : "Other",
      status: "clean",
      lastSeen: timeAgo(v.created_at),
      logins: 1,
    };
  });

  const ipAction = (_id: string, action: string) => {
    setActionMsg(`${action} noted — use IP Blocking page to manage blocked IPs.`);
    setTimeout(()=>setActionMsg(""),3000);
    setSelectedIP(null);
  };

  const stats = [
    { label:"Blocked IPs", value: blockedIps.length, color:"#f87171", icon:Ban },
    { label:"Unique Visitors (IPs)", value: uniqueIPs.length, color:"#f97316", icon:Wifi },
    { label:"Device Fingerprints", value: deviceRecords.length, color:"#fbbf24", icon:Globe },
    { label:"Clean IPs", value: allIPs.filter(r=>r.status==="clean").length, color:"#4ade80", icon:CheckCircle2 },
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
            <p style={{ fontSize:13, color:T.sub, margin:0 }}>Track blocked IPs, device fingerprints, and visitor activity</p>
          </div>
          {actionMsg && <div style={{ marginLeft:"auto", padding:"8px 16px", borderRadius:8, background:"rgba(74,222,128,.15)", border:"1px solid rgba(74,222,128,.3)", color:"#4ade80", fontSize:13 }}>{actionMsg}</div>}
        </div>

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

        <div style={{ display:"flex", gap:4, marginBottom:16, background:T.card, borderRadius:12, padding:4, border:`1px solid ${T.border}`, width:"fit-content" }}>
          {(["ip","device"] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 20px", borderRadius:9, border:"none", background:tab===t?`linear-gradient(135deg,${A1},${A2})`:"transparent", color:tab===t?"#fff":T.sub, fontSize:13, fontWeight:tab===t?700:400, cursor:"pointer" }}>{t==="ip"?"IP Tracking":"Device Tracking"}</button>
          ))}
        </div>

        {tab==="ip" && (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(10px)" }}>
            {loadingIPs ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:48, gap:12 }}>
                <Loader2 size={20} color={A1} />
                <span style={{ color:T.sub, fontSize:14 }}>Loading IP records…</span>
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:T.input }}>
                    {["IP Address","Type","VPN","Proxy","Status","Last Seen","Actions"].map(h=>(
                      <th key={h} style={{ padding:"11px 12px", textAlign:"left", fontSize:12, color:T.sub, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allIPs.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign:"center", padding:"48px 20px", color:T.sub, fontSize:14 }}>No IP records found</td></tr>
                    : allIPs.map(r => (
                      <tr key={r.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:"12px", fontFamily:"monospace", fontSize:13, color:A1, fontWeight:600 }}>{r.ip}</td>
                        <td style={{ padding:"12px", fontSize:12, color:T.sub }}>{r.user}</td>
                        <td style={{ padding:"12px" }}><span style={{ fontSize:12, color:r.vpn?"#f97316":"#4ade80", fontWeight:600 }}>{r.vpn?"YES":"NO"}</span></td>
                        <td style={{ padding:"12px" }}><span style={{ fontSize:12, color:r.proxy?"#f87171":"#4ade80", fontWeight:600 }}>{r.proxy?"YES":"NO"}</span></td>
                        <td style={{ padding:"12px" }}><span style={{ padding:"3px 10px", borderRadius:20, background:`${statusColor(r.status)}15`, color:statusColor(r.status), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.status}</span></td>
                        <td style={{ padding:"12px", fontSize:12, color:T.sub }}>{r.lastSeen}</td>
                        <td style={{ padding:"12px" }}>
                          <div style={{ display:"flex", gap:4 }}>
                            <button onClick={()=>setSelectedIP(r)} style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${T.border}`, background:T.input, color:T.sub, cursor:"pointer", fontSize:11 }}><Eye size={12}/></button>
                            <button onClick={()=>ipAction(r.id, r.status==="blocked"?"Unblock":"Block")} style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${r.status==="blocked"?"#4ade80":"#f87171"}`, background:r.status==="blocked"?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)", color:r.status==="blocked"?"#4ade80":"#f87171", cursor:"pointer", fontSize:11 }}>
                              {r.status==="blocked"?"Unblock":"Block"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab==="device" && (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(10px)" }}>
            {loadingVisitors ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:48, gap:12 }}>
                <Loader2 size={20} color={A1} />
                <span style={{ color:T.sub, fontSize:14 }}>Loading device records…</span>
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:T.input }}>
                    {["Fingerprint","IP","Device","OS","Browser","Status","Last Seen"].map(h=>(
                      <th key={h} style={{ padding:"11px 12px", textAlign:"left", fontSize:12, color:T.sub, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deviceRecords.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign:"center", padding:"48px 20px", color:T.sub, fontSize:14 }}>No device records found</td></tr>
                    : deviceRecords.map((d: { id: string; fingerprint: string; user: string; device: string; os: string; browser: string; status: string; lastSeen: string; logins: number }) => (
                      <tr key={d.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:"12px", fontFamily:"monospace", fontSize:12, color:A2 }}>{d.fingerprint}</td>
                        <td style={{ padding:"12px", fontSize:13, color:T.text }}>{d.user}</td>
                        <td style={{ padding:"12px", fontSize:13, color:T.sub }}>{d.device}</td>
                        <td style={{ padding:"12px", fontSize:12, color:T.sub }}>{d.os}</td>
                        <td style={{ padding:"12px", fontSize:12, color:T.sub }}>{d.browser}</td>
                        <td style={{ padding:"12px" }}><span style={{ padding:"3px 10px", borderRadius:20, background:`${statusColor(d.status)}15`, color:statusColor(d.status), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{d.status}</span></td>
                        <td style={{ padding:"12px", fontSize:12, color:T.sub }}>{d.lastSeen}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            )}
          </div>
        )}

        {selectedIP && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:460 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>IP: {selectedIP.ip}</h2>
                <button onClick={()=>setSelectedIP(null)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:20 }}>×</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                {[["Type",selectedIP.user],["Country",selectedIP.country],["VPN",selectedIP.vpn?"Yes":"No"],["Proxy",selectedIP.proxy?"Yes":"No"],["Status",selectedIP.status],["Last Seen",selectedIP.lastSeen]].map(([k,v])=>(
                  <div key={k} style={{ background:T.input, borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontSize:11, color:T.sub }}>{k}</div>
                    <div style={{ fontSize:13, color:T.text, fontWeight:600, marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                {["Block","Unblock","Whitelist"].map(act=>(
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
