import { useState } from "react";
import { toast } from "sonner";
import { Settings2, Save, RotateCcw, IndianRupee, Percent, Wallet, ArrowUpRight, ArrowLeftRight, Coins } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const A1 = "#6366f1";
const FEE_KEY = "admin_fee_config_v1";

type FeeConfig = {
  withdrawalFeeType: "flat" | "percent";
  withdrawalFeeValue: number;
  withdrawalMinFee: number;
  withdrawalMaxFee: number;
  transferFeeType: "flat" | "percent";
  transferFeeValue: number;
  transferMinFee: number;
  transferMaxFee: number;
  platformCommissionDefault: number;
  coinConversionRate: number;
  minWithdrawalAmount: number;
  maxWithdrawalAmount: number;
  minTransferAmount: number;
  maxTransferAmount: number;
  upiWithdrawalFee: number;
  bankWithdrawalFee: number;
  instantWithdrawalFee: number;
  weeklyWithdrawalFree: number;
};

function defaultConfig(): FeeConfig {
  return {
    withdrawalFeeType:"flat", withdrawalFeeValue:10, withdrawalMinFee:10, withdrawalMaxFee:500,
    transferFeeType:"flat", transferFeeValue:0, transferMinFee:0, transferMaxFee:0,
    platformCommissionDefault:10, coinConversionRate:1,
    minWithdrawalAmount:100, maxWithdrawalAmount:50000,
    minTransferAmount:10, maxTransferAmount:10000,
    upiWithdrawalFee:0, bankWithdrawalFee:10, instantWithdrawalFee:25, weeklyWithdrawalFree:1,
  };
}

function load(): FeeConfig {
  try { const d=localStorage.getItem(FEE_KEY); if(d) return JSON.parse(d); } catch {}
  const s=defaultConfig(); localStorage.setItem(FEE_KEY, JSON.stringify(s)); return s;
}
function save(c: FeeConfig) { localStorage.setItem(FEE_KEY, JSON.stringify(c)); }

const AdminFeeConfiguration = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [config, setConfig] = useState<FeeConfig>(load);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof FeeConfig, v: any) => setConfig(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    save(config); setSaved(true); toast.success("Fee configuration saved");
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => { setConfig(defaultConfig()); toast.info("Reset to defaults"); };

  const Section = ({ icon: Icon, title, color, children }: any) => (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden", marginBottom:18 }}>
      <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:`${color}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon size={15} color={color}/>
        </div>
        <span style={{ fontWeight:700, fontSize:14, color:T.text }}>{title}</span>
      </div>
      <div style={{ padding:"18px 20px", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value, onChange, type="number", options, suffix }: any) => (
    <div>
      <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:6 }}>{label}{suffix&&<span style={{ marginLeft:4, fontSize:10, color:A1 }}>({suffix})</span>}</label>
      {options
        ? <select value={value} onChange={e=>onChange(e.target.value)} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13 }}>
            {options.map((o:any)=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        : <div style={{ display:"flex", alignItems:"center", gap:8, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"0 12px" }}>
            <span style={{ fontSize:13, color:T.sub }}>₹</span>
            <input type={type} value={value} onChange={e=>onChange(type==="number"?Number(e.target.value):e.target.value)} style={{ background:"none", border:"none", outline:"none", color:T.text, fontSize:13, padding:"8px 0", flex:1, width:"100%" }}/>
          </div>
      }
    </div>
  );

  return (
    <div style={{ padding:"24px 16px", maxWidth:900, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Platform Fee Configuration</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Configure withdrawal fees, transfer fees, and platform commission rates</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={reset} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 14px", cursor:"pointer", color:T.text, fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            <RotateCcw size={13}/> Reset
          </button>
          <button onClick={handleSave} style={{ background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:10, padding:"8px 18px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            <Save size={13}/> {saved?"Saved!":"Save Changes"}
          </button>
        </div>
      </div>

      <Section icon={ArrowUpRight} title="Withdrawal Fees" color="#f87171">
        <Field label="Fee Type" value={config.withdrawalFeeType} onChange={(v:any)=>set("withdrawalFeeType",v)} options={[{value:"flat",label:"Flat Amount"},{value:"percent",label:"Percentage"}]} />
        <Field label="Fee Value" value={config.withdrawalFeeValue} onChange={(v:any)=>set("withdrawalFeeValue",v)} suffix={config.withdrawalFeeType==="percent"?"%":"₹"} />
        <Field label="Min Fee" value={config.withdrawalMinFee} onChange={(v:any)=>set("withdrawalMinFee",v)} />
        <Field label="Max Fee" value={config.withdrawalMaxFee} onChange={(v:any)=>set("withdrawalMaxFee",v)} />
        <Field label="UPI Withdrawal Fee" value={config.upiWithdrawalFee} onChange={(v:any)=>set("upiWithdrawalFee",v)} />
        <Field label="Bank Withdrawal Fee" value={config.bankWithdrawalFee} onChange={(v:any)=>set("bankWithdrawalFee",v)} />
        <Field label="Instant Withdrawal Fee" value={config.instantWithdrawalFee} onChange={(v:any)=>set("instantWithdrawalFee",v)} />
        <Field label="Free Withdrawals per Week" value={config.weeklyWithdrawalFree} onChange={(v:any)=>set("weeklyWithdrawalFree",v)} />
      </Section>

      <Section icon={ArrowLeftRight} title="Transfer Fees (Wallet to Wallet)" color="#60a5fa">
        <Field label="Fee Type" value={config.transferFeeType} onChange={(v:any)=>set("transferFeeType",v)} options={[{value:"flat",label:"Flat Amount"},{value:"percent",label:"Percentage"}]} />
        <Field label="Fee Value" value={config.transferFeeValue} onChange={(v:any)=>set("transferFeeValue",v)} suffix={config.transferFeeType==="percent"?"%":"₹"} />
        <Field label="Min Fee" value={config.transferMinFee} onChange={(v:any)=>set("transferMinFee",v)} />
        <Field label="Max Fee" value={config.transferMaxFee} onChange={(v:any)=>set("transferMaxFee",v)} />
      </Section>

      <Section icon={IndianRupee} title="Transaction Limits" color="#4ade80">
        <Field label="Min Withdrawal" value={config.minWithdrawalAmount} onChange={(v:any)=>set("minWithdrawalAmount",v)} />
        <Field label="Max Withdrawal" value={config.maxWithdrawalAmount} onChange={(v:any)=>set("maxWithdrawalAmount",v)} />
        <Field label="Min Transfer" value={config.minTransferAmount} onChange={(v:any)=>set("minTransferAmount",v)} />
        <Field label="Max Transfer" value={config.maxTransferAmount} onChange={(v:any)=>set("maxTransferAmount",v)} />
      </Section>

      <Section icon={Percent} title="Commission & Coins" color="#f59e0b">
        <Field label="Default Commission %" value={config.platformCommissionDefault} onChange={(v:any)=>set("platformCommissionDefault",v)} suffix="%" />
        <Field label="Coin → ₹ Rate (1 coin = ₹?)" value={config.coinConversionRate} onChange={(v:any)=>set("coinConversionRate",v)} />
      </Section>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:18 }}>
        <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:14 }}>Current Fee Preview</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
          {[
            {label:"₹1,000 Withdrawal",fee:`₹${config.withdrawalFeeType==="flat"?Math.min(Math.max(config.withdrawalFeeValue,config.withdrawalMinFee),config.withdrawalMaxFee):(1000*config.withdrawalFeeValue/100).toFixed(2)}`},
            {label:"₹5,000 Withdrawal",fee:`₹${config.withdrawalFeeType==="flat"?Math.min(Math.max(config.withdrawalFeeValue,config.withdrawalMinFee),config.withdrawalMaxFee):(5000*config.withdrawalFeeValue/100).toFixed(2)}`},
            {label:"₹1,000 Transfer",fee:`₹${config.transferFeeType==="flat"?config.transferFeeValue:(1000*config.transferFeeValue/100).toFixed(2)}`},
            {label:"₹10,000 Commission",fee:`₹${(10000*config.platformCommissionDefault/100).toFixed(2)}`},
          ].map(item=>(
            <div key={item.label} style={{ background:`${A1}08`, borderRadius:10, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, color:T.sub }}>{item.label}</span>
              <span style={{ fontSize:14, fontWeight:800, color:"#f59e0b" }}>{item.fee}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminFeeConfiguration;
