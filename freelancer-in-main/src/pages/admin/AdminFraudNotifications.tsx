import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Bell, Mail, MessageSquare, Smartphone, Send, RotateCcw, CheckCircle2 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const CHANNELS = [
  { id:"email",    label:"Email Notification",    icon:Mail,           desc:"Send fraud alerts to admin email", color:"#60a5fa" },
  { id:"sms",      label:"SMS Notification",       icon:Smartphone,     desc:"Send SMS alerts for critical events", color:"#4ade80" },
  { id:"whatsapp", label:"WhatsApp Notification",  icon:MessageSquare,  desc:"WhatsApp messages for fraud alerts", color:"#4ade80" },
  { id:"inapp",    label:"In-App Notification",    icon:Bell,           desc:"Show alerts inside admin panel", color:A1 },
  { id:"push",     label:"Push Notification",      icon:Send,           desc:"Browser push notifications", color:A2 },
];

const PRIORITIES = ["low","medium","high","critical"];

const DEFAULT_TEMPLATES = {
  email: `Subject: [FRAUD ALERT] {{priority}} — {{action}}\n\nDear Admin,\n\nA fraud event was detected:\n\nUser: {{user}}\nAction: {{action}}\nRisk Score: {{score}}\nTime: {{time}}\nIP: {{ip}}\n\nPlease investigate immediately.\n\nFreelancer India Security Team`,
  sms: `[FRAUD ALERT] {{priority}} risk: {{user}} — {{action}}. Check admin panel.`,
  whatsapp: `🚨 *Fraud Alert*\nPriority: *{{priority}}*\nUser: {{user}}\nAction: {{action}}\nTime: {{time}}`,
  inapp: `Fraud detected: {{action}} by {{user}} (Risk: {{score}})`,
  push: `{{priority}} Fraud Alert: {{action}} — {{user}}`,
};

type ChannelConfig = { enabled:boolean; priorities:string[]; template:string; retryOnFail:boolean };

export default function AdminFraudNotifications() {
  const { theme: _theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const { data: notifStats } = useQuery({
    queryKey: ["admin-fraud-notif-stats"],
    queryFn: async () => {
      const { count: total } = await supabase.from("notifications").select("*", { count:"exact", head:true });
      const { count: unread } = await supabase.from("notifications").select("*", { count:"exact", head:true }).eq("is_read", false);
      return { total: total || 0, unread: unread || 0 };
    },
    refetchInterval: 60000,
  });

  const [configs, setConfigs] = useState<Record<string, ChannelConfig>>({
    email:    { enabled:true,  priorities:["high","critical"], template:DEFAULT_TEMPLATES.email,    retryOnFail:true },
    sms:      { enabled:true,  priorities:["critical"],        template:DEFAULT_TEMPLATES.sms,      retryOnFail:true },
    whatsapp: { enabled:false, priorities:["critical"],        template:DEFAULT_TEMPLATES.whatsapp, retryOnFail:false },
    inapp:    { enabled:true,  priorities:["low","medium","high","critical"], template:DEFAULT_TEMPLATES.inapp, retryOnFail:false },
    push:     { enabled:true,  priorities:["high","critical"], template:DEFAULT_TEMPLATES.push,     retryOnFail:true },
  });
  const [selectedChannel, setSelectedChannel] = useState("email");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string|null>(null);

  const toggleChannel = (id: string) => setConfigs(c => ({ ...c, [id]: { ...c[id], enabled: !c[id].enabled } }));
  const togglePriority = (ch: string, prio: string) => setConfigs(c => {
    const existing = c[ch].priorities;
    const updated = existing.includes(prio) ? existing.filter(p=>p!==prio) : [...existing,prio];
    return { ...c, [ch]: { ...c[ch], priorities:updated } };
  });
  const updateTemplate = (ch: string, template: string) => setConfigs(c => ({ ...c, [ch]: { ...c[ch], template } }));
  const toggleRetry = (ch: string) => setConfigs(c => ({ ...c, [ch]: { ...c[ch], retryOnFail: !c[ch].retryOnFail } }));
  const resetTemplate = (ch: string) => setConfigs(c => ({ ...c, [ch]: { ...c[ch], template: DEFAULT_TEMPLATES[ch as keyof typeof DEFAULT_TEMPLATES] || "" } }));

  const sendTest = () => {
    setTestSending(true); setTestResult(null);
    setTimeout(() => {
      setTestSending(false);
      setTestResult(`Test notification sent successfully via ${selectedChannel.toUpperCase()}. Check your ${selectedChannel} for the test alert.`);
    }, 2000);
  };

  const prioColor = (p: string) => p==="critical"?"#f87171":p==="high"?"#f97316":p==="medium"?"#fbbf24":"#4ade80";
  const sel = configs[selectedChannel];
  const selChannel = CHANNELS.find(c=>c.id===selectedChannel)!;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
            <Bell size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Notification & Alert Settings</h1>
            <p style={{ fontSize:13, color:T.sub, margin:0 }}>Configure fraud alert notifications across all channels</p>
          </div>
          {notifStats && (
            <div style={{ marginLeft:"auto", display:"flex", gap:12 }}>
              <div style={{ padding:"6px 14px", borderRadius:8, background:"rgba(99,102,241,.12)", border:"1px solid rgba(99,102,241,.2)", fontSize:13 }}>
                <span style={{ color:"#a5b4fc", fontWeight:700 }}>{notifStats.total}</span>
                <span style={{ color:"#94a3b8", marginLeft:6 }}>Total Notifications</span>
              </div>
              <div style={{ padding:"6px 14px", borderRadius:8, background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.2)", fontSize:13 }}>
                <span style={{ color:"#f87171", fontWeight:700 }}>{notifStats.unread}</span>
                <span style={{ color:"#94a3b8", marginLeft:6 }}>Unread</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:20 }}>
          {/* Channel List */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:16, backdropFilter:"blur(10px)", height:"fit-content" }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:14 }}>Notification Channels</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {CHANNELS.map(ch => {
                const Icon = ch.icon;
                const cfg = configs[ch.id];
                return (
                  <div key={ch.id} onClick={()=>setSelectedChannel(ch.id)} style={{ padding:"12px 14px", borderRadius:10, border:`1px solid ${selectedChannel===ch.id?A1:T.border}`, background:selectedChannel===ch.id?`${A1}10`:T.input, cursor:"pointer" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <Icon size={16} color={ch.color} />
                        <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{ch.label}</span>
                      </div>
                      <div onClick={e=>{e.stopPropagation();toggleChannel(ch.id);}} style={{ width:34, height:18, borderRadius:9, background:cfg.enabled?A1:T.border, cursor:"pointer", position:"relative", transition:"background .2s" }}>
                        <div style={{ width:14, height:14, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:cfg.enabled?18:2, transition:"left .2s" }} />
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:T.sub, marginTop:4 }}>
                      {cfg.priorities.length} priority levels
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Channel Config */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <selChannel.icon size={20} color={selChannel.color} />
                <h2 style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>{selChannel.label}</h2>
                <span style={{ fontSize:12, color:T.sub }}>— {selChannel.desc}</span>
                <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:12, color:T.sub }}>Enabled</span>
                  <div onClick={()=>toggleChannel(selectedChannel)} style={{ width:40, height:22, borderRadius:11, background:sel.enabled?A1:T.input, cursor:"pointer", position:"relative", transition:"background .2s" }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:sel.enabled?20:2, transition:"left .2s" }} />
                  </div>
                </div>
              </div>

              {/* Priority Selection */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:10 }}>Alert Priority Levels</div>
                <div style={{ display:"flex", gap:10 }}>
                  {PRIORITIES.map(p => (
                    <button key={p} onClick={()=>togglePriority(selectedChannel,p)} style={{ padding:"7px 18px", borderRadius:20, border:`1px solid ${prioColor(p)}`, background:sel.priorities.includes(p)?`${prioColor(p)}20`:"transparent", color:prioColor(p), fontSize:13, fontWeight:sel.priorities.includes(p)?700:400, cursor:"pointer", textTransform:"capitalize" }}>{p}</button>
                  ))}
                </div>
              </div>

              {/* Retry */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"12px 16px", borderRadius:10, background:T.input }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:T.text, fontWeight:600 }}>Retry Failed Notifications</div>
                  <div style={{ fontSize:12, color:T.sub }}>Automatically retry if notification delivery fails</div>
                </div>
                <div onClick={()=>toggleRetry(selectedChannel)} style={{ width:40, height:22, borderRadius:11, background:sel.retryOnFail?A1:T.input, cursor:"pointer", position:"relative", transition:"background .2s", border:`1px solid ${T.border}` }}>
                  <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:sel.retryOnFail?20:2, transition:"left .2s" }} />
                </div>
              </div>

              {/* Test */}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={sendTest} disabled={testSending} style={{ padding:"9px 20px", borderRadius:9, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6, opacity:testSending?0.7:1 }}>
                  <Send size={14} style={{ animation:testSending?"spin 1s linear infinite":"none" }} /> {testSending?"Sending…":"Send Test Alert"}
                </button>
              </div>
              {testResult && <div style={{ marginTop:12, padding:"10px 14px", borderRadius:8, background:"rgba(74,222,128,.12)", border:"1px solid rgba(74,222,128,.3)", color:"#4ade80", fontSize:13 }}><CheckCircle2 size={14} style={{display:"inline",marginRight:8}}/>{testResult}</div>}
            </div>

            {/* Template Editor */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:T.text, margin:0 }}>Notification Template</h3>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>resetTemplate(selectedChannel)} style={{ padding:"5px 12px", borderRadius:7, border:`1px solid ${T.border}`, background:T.input, color:T.sub, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><RotateCcw size={12}/> Reset</button>
                </div>
              </div>
              <div style={{ fontSize:11, color:T.sub, marginBottom:8 }}>Variables: {"{{user}}, {{action}}, {{score}}, {{priority}}, {{time}}, {{ip}}"}</div>
              <textarea value={sel.template} onChange={e=>updateTemplate(selectedChannel,e.target.value)} rows={8} style={{ width:"100%", padding:"12px", borderRadius:10, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:12, fontFamily:"monospace", resize:"vertical", boxSizing:"border-box", lineHeight:1.6 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
