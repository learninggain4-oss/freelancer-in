import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Lock, Shield, Key, Smartphone, Globe, AlertTriangle, CheckCircle2, Save, RefreshCw, Eye, EyeOff } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const IP_WHITELIST_INIT = ["192.168.1.1","192.168.1.2","10.0.0.1"];
const IP_BLACKLIST_INIT = ["103.22.11.4","45.77.21.3","182.74.3.2"];

export default function AdminFraudSecuritySettings() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const [tab, setTab] = useState<"auth"|"password"|"captcha"|"ip"|"device">("auth");
  const [saved, setSaved] = useState(false);

  // Auth settings
  const [twoFA, setTwoFA] = useState(true);
  const [loginAttemptLimit, setLoginAttemptLimit] = useState(5);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [lockoutDuration, setLockoutDuration] = useState(15);

  // Password settings
  const [minLength, setMinLength] = useState(8);
  const [requireUpper, setRequireUpper] = useState(true);
  const [requireLower, setRequireLower] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSymbol, setRequireSymbol] = useState(false);
  const [passwordExpiry, setPasswordExpiry] = useState(90);

  // Captcha
  const [captchaEnabled, setCaptchaEnabled] = useState(true);
  const [captchaTrigger, setCaptchaTrigger] = useState("always");

  // IP
  const [whitelist, setWhitelist] = useState(IP_WHITELIST_INIT);
  const [blacklist, setBlacklist] = useState(IP_BLACKLIST_INIT);
  const [newWhiteIP, setNewWhiteIP] = useState("");
  const [newBlackIP, setNewBlackIP] = useState("");

  // Device
  const [deviceVerification, setDeviceVerification] = useState(true);
  const [deviceTrustDays, setDeviceTrustDays] = useState(30);
  const [maxDevices, setMaxDevices] = useState(3);

  const handleSave = () => {
    setSaved(true);
    setTimeout(()=>setSaved(false), 3000);
  };

  const addWhiteIP = () => { if (newWhiteIP) { setWhitelist(l=>[...l,newWhiteIP]); setNewWhiteIP(""); } };
  const addBlackIP = () => { if (newBlackIP) { setBlacklist(l=>[...l,newBlackIP]); setNewBlackIP(""); } };

  const TABS = [
    { id:"auth",     label:"2FA & Login",    icon:Key },
    { id:"password", label:"Password Policy", icon:Lock },
    { id:"captcha",  label:"CAPTCHA",         icon:Shield },
    { id:"ip",       label:"IP Lists",        icon:Globe },
    { id:"device",   label:"Device",          icon:Smartphone },
  ];

  const Toggle = ({ val, set }: { val:boolean; set:(v:boolean)=>void }) => (
    <div onClick={()=>set(!val)} style={{ width:40, height:22, borderRadius:11, background:val?A1:T.input, cursor:"pointer", position:"relative", transition:"background .2s", border:`1px solid ${T.border}`, flexShrink:0 }}>
      <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:val?20:2, transition:"left .2s" }} />
    </div>
  );

  const Row = ({ label, desc, children }: { label:string; desc?:string; children:React.ReactNode }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", borderRadius:10, background:T.input, gap:16 }}>
      <div>
        <div style={{ fontSize:13, color:T.text, fontWeight:600 }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:T.sub, marginTop:2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );

  const NumInput = ({ val, set, min, max, unit }: { val:number; set:(v:number)=>void; min:number; max:number; unit?:string }) => (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <input type="number" value={val} min={min} max={max} onChange={e=>set(parseInt(e.target.value)||min)} style={{ width:70, padding:"6px 10px", borderRadius:8, border:`1px solid ${T.border}`, background:T.card, color:T.text, fontSize:13, textAlign:"center" }} />
      {unit && <span style={{ fontSize:12, color:T.sub }}>{unit}</span>}
    </div>
  );

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
              <Shield size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>System Security Settings</h1>
              <p style={{ fontSize:13, color:T.sub, margin:0 }}>Strengthen fraud prevention with 2FA, CAPTCHA, password policies, and IP controls</p>
            </div>
          </div>
          <button onClick={handleSave} style={{ padding:"9px 22px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            {saved?<CheckCircle2 size={15}/>:<Save size={15}/>} {saved?"Saved!":"Save Settings"}
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:20 }}>
          {/* Sidebar Tabs */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:12, backdropFilter:"blur(10px)", height:"fit-content" }}>
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={()=>setTab(t.id as typeof tab)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:9, border:"none", background:tab===t.id?`${A1}15`:"transparent", color:tab===t.id?A1:T.sub, fontSize:13, fontWeight:tab===t.id?700:400, cursor:"pointer", marginBottom:4, textAlign:"left" }}>
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>

            {tab==="auth" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 8px" }}>Two-Factor Authentication & Login</h3>
                <Row label="Two-Factor Authentication (2FA)" desc="Require 2FA for all admin logins"><Toggle val={twoFA} set={setTwoFA}/></Row>
                <Row label="Login Attempt Limit" desc="Lock account after N failed attempts"><NumInput val={loginAttemptLimit} set={setLoginAttemptLimit} min={1} max={20} unit="attempts"/></Row>
                <Row label="Session Timeout" desc="Auto-logout inactive admins"><NumInput val={sessionTimeout} set={setSessionTimeout} min={5} max={120} unit="minutes"/></Row>
                <Row label="Account Lockout Duration" desc="How long account stays locked after limit reached"><NumInput val={lockoutDuration} set={setLockoutDuration} min={1} max={60} unit="minutes"/></Row>
              </div>
            )}

            {tab==="password" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 8px" }}>Password Strength Policy</h3>
                <Row label="Minimum Password Length"><NumInput val={minLength} set={setMinLength} min={6} max={32} unit="characters"/></Row>
                <Row label="Require Uppercase Letters" desc="At least one uppercase letter required"><Toggle val={requireUpper} set={setRequireUpper}/></Row>
                <Row label="Require Lowercase Letters" desc="At least one lowercase letter required"><Toggle val={requireLower} set={setRequireLower}/></Row>
                <Row label="Require Numbers" desc="At least one number required"><Toggle val={requireNumber} set={setRequireNumber}/></Row>
                <Row label="Require Special Characters" desc="At least one symbol (@, #, !, etc.)"><Toggle val={requireSymbol} set={setRequireSymbol}/></Row>
                <Row label="Password Expiry" desc="Force password change after N days"><NumInput val={passwordExpiry} set={setPasswordExpiry} min={30} max={365} unit="days"/></Row>
                <div style={{ padding:"14px 16px", borderRadius:10, background:`${A1}10`, border:`1px solid ${A1}30` }}>
                  <div style={{ fontSize:12, color:T.sub, marginBottom:6 }}>Current Password Strength Requirements:</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {[`Min ${minLength} chars`, requireUpper&&"Uppercase", requireLower&&"Lowercase", requireNumber&&"Numbers", requireSymbol&&"Symbols", `Expires in ${passwordExpiry}d`].filter(Boolean).map(r=>(
                      <span key={String(r)} style={{ padding:"3px 10px", borderRadius:20, background:`${A1}15`, color:A1, fontSize:12 }}>{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab==="captcha" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 8px" }}>CAPTCHA Enforcement</h3>
                <Row label="Enable CAPTCHA" desc="Add CAPTCHA to protect against bots"><Toggle val={captchaEnabled} set={setCaptchaEnabled}/></Row>
                {captchaEnabled && (
                  <Row label="Trigger CAPTCHA">
                    <select value={captchaTrigger} onChange={e=>setCaptchaTrigger(e.target.value)} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.card, color:T.text, fontSize:13 }}>
                      <option value="always">Always</option>
                      <option value="suspicious">On Suspicious Activity</option>
                      <option value="failed_login">After Failed Login</option>
                      <option value="new_device">On New Device</option>
                    </select>
                  </Row>
                )}
                <div style={{ padding:"16px", borderRadius:10, background:captchaEnabled?"rgba(74,222,128,.08)":"rgba(248,113,113,.08)", border:`1px solid ${captchaEnabled?"rgba(74,222,128,.2)":"rgba(248,113,113,.2)"}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {captchaEnabled?<CheckCircle2 size={16} color="#4ade80"/>:<AlertTriangle size={16} color="#f87171"/>}
                    <span style={{ fontSize:13, color:captchaEnabled?"#4ade80":"#f87171", fontWeight:600 }}>CAPTCHA is {captchaEnabled?"active":"disabled"}</span>
                  </div>
                  <div style={{ fontSize:12, color:T.sub, marginTop:4 }}>{captchaEnabled?`Triggered: ${captchaTrigger}`:"Bots can attempt logins without CAPTCHA"}</div>
                </div>
              </div>
            )}

            {tab==="ip" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:0 }}>IP Whitelist & Blacklist</h3>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                  {/* Whitelist */}
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#4ade80", marginBottom:12 }}>✓ IP Whitelist ({whitelist.length})</div>
                    <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                      <input value={newWhiteIP} onChange={e=>setNewWhiteIP(e.target.value)} placeholder="Enter IP address" style={{ flex:1, padding:"7px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }} />
                      <button onClick={addWhiteIP} style={{ padding:"7px 14px", borderRadius:8, border:`1px solid #4ade80`, background:"rgba(74,222,128,.1)", color:"#4ade80", fontSize:13, cursor:"pointer" }}>Add</button>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {whitelist.map(ip=>(
                        <div key={ip} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderRadius:8, background:T.input, border:`1px solid rgba(74,222,128,.2)` }}>
                          <span style={{ fontFamily:"monospace", fontSize:13, color:T.text }}>{ip}</span>
                          <button onClick={()=>setWhitelist(l=>l.filter(x=>x!==ip))} style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:16 }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Blacklist */}
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#f87171", marginBottom:12 }}>✕ IP Blacklist ({blacklist.length})</div>
                    <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                      <input value={newBlackIP} onChange={e=>setNewBlackIP(e.target.value)} placeholder="Enter IP address" style={{ flex:1, padding:"7px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }} />
                      <button onClick={addBlackIP} style={{ padding:"7px 14px", borderRadius:8, border:`1px solid #f87171`, background:"rgba(248,113,113,.1)", color:"#f87171", fontSize:13, cursor:"pointer" }}>Add</button>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {blacklist.map(ip=>(
                        <div key={ip} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderRadius:8, background:T.input, border:`1px solid rgba(248,113,113,.2)` }}>
                          <span style={{ fontFamily:"monospace", fontSize:13, color:T.text }}>{ip}</span>
                          <button onClick={()=>setBlacklist(l=>l.filter(x=>x!==ip))} style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:16 }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab==="device" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 8px" }}>Device Verification</h3>
                <Row label="Require Device Verification" desc="Verify new devices before allowing login"><Toggle val={deviceVerification} set={setDeviceVerification}/></Row>
                <Row label="Device Trust Duration" desc="How long a device stays trusted"><NumInput val={deviceTrustDays} set={setDeviceTrustDays} min={1} max={365} unit="days"/></Row>
                <Row label="Max Devices Per User" desc="Limit number of trusted devices per account"><NumInput val={maxDevices} set={setMaxDevices} min={1} max={10} unit="devices"/></Row>
                <div style={{ padding:"14px 16px", borderRadius:10, background:T.input }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>Current Device Policy Summary</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {[["Verification Required", deviceVerification?"Yes":"No"], ["Trust Duration", `${deviceTrustDays} days`], ["Max Devices", `${maxDevices} per user`]].map(([k,v])=>(
                      <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                        <span style={{ color:T.sub }}>{k}</span>
                        <span style={{ color:T.text, fontWeight:600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
