import { useState } from "react";
import { toast } from "sonner";
import { Users, Plus, Edit2, Trash2, X, TrendingUp, IndianRupee, Link2, Copy, CheckCircle2 } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const A1 = "#6366f1";
const AFF_KEY = "admin_affiliates_v1";

type Affiliate = {
  id:string; name:string; email:string; code:string; commissionRate:number;
  referrals:number; conversions:number; totalEarned:number; pendingPayout:number;
  status:"active"|"inactive"|"pending"; joinedAt:string; lastActivity:string;
};

function seed():Affiliate[] {
  return [
    {id:"a1",name:"Tech Blog India",email:"partner@techblog.in",code:"TECHBLOG",commissionRate:5,referrals:450,conversions:87,totalEarned:12500,pendingPayout:3200,status:"active",joinedAt:new Date(Date.now()-86400000*90).toISOString(),lastActivity:new Date(Date.now()-86400000*1).toISOString()},
    {id:"a2",name:"Startup Hub",email:"collab@startuphub.io",code:"STARTUP",commissionRate:7,referrals:220,conversions:45,totalEarned:8700,pendingPayout:1500,status:"active",joinedAt:new Date(Date.now()-86400000*60).toISOString(),lastActivity:new Date(Date.now()-86400000*3).toISOString()},
    {id:"a3",name:"Freelance Tips",email:"admin@freelancetips.com",code:"FLTIPS",commissionRate:5,referrals:890,conversions:120,totalEarned:22000,pendingPayout:0,status:"active",joinedAt:new Date(Date.now()-86400000*120).toISOString(),lastActivity:new Date(Date.now()-86400000*0).toISOString()},
    {id:"a4",name:"Job Portal Partner",email:"bd@jobportal.in",code:"JOBP",commissionRate:4,referrals:55,conversions:8,totalEarned:1200,pendingPayout:600,status:"pending",joinedAt:new Date(Date.now()-86400000*10).toISOString(),lastActivity:new Date(Date.now()-86400000*5).toISOString()},
  ];
}
function load():Affiliate[]{try{const d=localStorage.getItem(AFF_KEY);if(d)return JSON.parse(d);}catch{}const s=seed();localStorage.setItem(AFF_KEY,JSON.stringify(s));return s;}
function save(a:Affiliate[]){localStorage.setItem(AFF_KEY,JSON.stringify(a));}

const blank=():Omit<Affiliate,"id"|"referrals"|"conversions"|"totalEarned"|"pendingPayout"|"joinedAt"|"lastActivity">=>({name:"",email:"",code:"",commissionRate:5,status:"pending"});

const AdminAffiliateManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [affiliates,setAffiliates]=useState<Affiliate[]>(load);
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState<string|null>(null);
  const [form,setForm]=useState<ReturnType<typeof blank>>(blank());
  const [showPayout,setShowPayout]=useState<Affiliate|null>(null);
  const f=(k:any,v:any)=>setForm(p=>({...p,[k]:v}));

  const totalPending=affiliates.reduce((s,a)=>s+a.pendingPayout,0);
  const totalPaid=affiliates.reduce((s,a)=>s+a.totalEarned,0);

  const submit=()=>{
    if(!form.name||!form.email||!form.code)return toast.error("Fill all required fields");
    if(editId){
      const up=affiliates.map(a=>a.id===editId?{...a,...form}:a);setAffiliates(up);save(up);toast.success("Partner updated");
    } else {
      const na:Affiliate={...form,id:`a${Date.now()}`,referrals:0,conversions:0,totalEarned:0,pendingPayout:0,joinedAt:new Date().toISOString(),lastActivity:new Date().toISOString()};
      const up=[...affiliates,na];setAffiliates(up);save(up);toast.success("Partner added");
    }
    setShowForm(false);setEditId(null);
  };

  const openEdit=(a:Affiliate)=>{setForm({name:a.name,email:a.email,code:a.code,commissionRate:a.commissionRate,status:a.status});setEditId(a.id);setShowForm(true);};
  const del=(id:string)=>{const up=affiliates.filter(a=>a.id!==id);setAffiliates(up);save(up);toast.success("Partner removed");};

  const markPaid=(id:string)=>{
    const up=affiliates.map(a=>a.id===id?{...a,pendingPayout:0}:a);
    setAffiliates(up);save(up);setShowPayout(null);toast.success("Payout marked as paid");
  };

  const copy=(code:string)=>navigator.clipboard.writeText(`https://freelan.space/?ref=${code}`).then(()=>toast.success("Link copied!"));

  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});
  const statusStyle=(s:string)=>{ const m:Record<string,any>={active:{c:"#4ade80",bg:"rgba(74,222,128,.12)"},inactive:{c:"#f87171",bg:"rgba(248,113,113,.12)"},pending:{c:"#fbbf24",bg:"rgba(251,191,36,.12)"}}; return bs((m[s]?.c||"#94a3b8"),(m[s]?.bg||"rgba(148,163,184,.12)")); };

  return (
    <div style={{ padding:"24px 16px", maxWidth:1080, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Affiliate & Partner Management</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Manage referral partners and track commission payouts</p>
        </div>
        <button onClick={()=>{setForm(blank());setEditId(null);setShowForm(true);}} style={{ background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <Plus size={14}/> Add Partner
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:24 }}>
        {[
          {label:"Total Partners",value:affiliates.length,color:"#6366f1",icon:Users},
          {label:"Active Partners",value:affiliates.filter(a=>a.status==="active").length,color:"#4ade80",icon:CheckCircle2},
          {label:"Total Paid Out",value:`₹${totalPaid.toLocaleString("en-IN")}`,color:"#8b5cf6",icon:IndianRupee},
          {label:"Pending Payout",value:`₹${totalPending.toLocaleString("en-IN")}`,color:"#f59e0b",icon:TrendingUp},
        ].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 18px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:40,height:40,borderRadius:10,background:`${s.color}20`,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <s.icon size={18} color={s.color}/>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:18, color:T.text }}>{s.value}</div>
              <div style={{ fontSize:11, color:T.sub }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
        {affiliates.map(a=>(
          <div key={a.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:T.text }}>{a.name}</div>
                <div style={{ fontSize:12, color:T.sub }}>{a.email}</div>
              </div>
              <span style={statusStyle(a.status)}>{a.status}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:`${A1}10`, borderRadius:8, padding:"6px 12px", marginBottom:12 }}>
              <Link2 size={12} color={A1}/>
              <span style={{ fontFamily:"monospace", fontSize:13, color:A1, fontWeight:700 }}>?ref={a.code}</span>
              <button onClick={()=>copy(a.code)} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:T.sub }}><Copy size={12}/></button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12 }}>
              {[{l:"Commission",v:`${a.commissionRate}%`},{l:"Referrals",v:a.referrals},{l:"Converts",v:a.conversions},{l:"Earned",v:`₹${a.totalEarned.toLocaleString("en-IN")}`}].map(item=>(
                <div key={item.l} style={{ textAlign:"center", background:`${A1}08`, borderRadius:7, padding:"6px 4px" }}>
                  <div style={{ fontSize:10, color:T.sub, textTransform:"uppercase" }}>{item.l}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text, marginTop:1 }}>{item.v}</div>
                </div>
              ))}
            </div>
            {a.pendingPayout>0&&(
              <div style={{ background:"rgba(245,158,11,.1)", border:"1px solid rgba(245,158,11,.3)", borderRadius:8, padding:"8px 12px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:"#f59e0b", fontWeight:700 }}>Pending: ₹{a.pendingPayout.toLocaleString("en-IN")}</span>
                <button onClick={()=>setShowPayout(a)} style={{ background:"#f59e0b", border:"none", borderRadius:6, padding:"4px 10px", cursor:"pointer", color:"#000", fontWeight:700, fontSize:11 }}>Pay Now</button>
              </div>
            )}
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>openEdit(a)} style={{ flex:1, background:`${A1}15`, border:`1px solid ${A1}33`, borderRadius:7, padding:"6px", cursor:"pointer", color:A1, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}><Edit2 size={11}/> Edit</button>
              <button onClick={()=>del(a.id)} style={{ background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.3)", borderRadius:7, padding:"6px 10px", cursor:"pointer", color:"#f87171" }}><Trash2 size={12}/></button>
            </div>
          </div>
        ))}
      </div>

      {showForm&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:themeKey==="black"?"#0f0f23":"#fff", border:`1px solid ${T.border}`, borderRadius:16, padding:28, maxWidth:420, width:"100%" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ fontWeight:800, fontSize:17, color:T.text, margin:0 }}>{editId?"Edit Partner":"Add Partner"}</h2>
              <button onClick={()=>setShowForm(false)} style={{ background:"none", border:"none", cursor:"pointer", color:T.sub }}><X size={20}/></button>
            </div>
            {[{l:"Partner Name",k:"name",t:"text"},{l:"Email",k:"email",t:"email"},{l:"Referral Code",k:"code",t:"text"},{l:"Commission Rate (%)",k:"commissionRate",t:"number"}].map(fi=>(
              <div key={fi.k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>{fi.l}</label>
                <input type={fi.t} value={(form as any)[fi.k]} onChange={e=>f(fi.k,fi.t==="number"?Number(e.target.value):e.target.value)} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, boxSizing:"border-box" as any }}/>
              </div>
            ))}
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>Status</label>
              <select value={form.status} onChange={e=>f("status",e.target.value)} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13 }}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowForm(false)} style={{ flex:1, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px", cursor:"pointer", color:T.text, fontWeight:600 }}>Cancel</button>
              <button onClick={submit} style={{ flex:2, background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:8, padding:"9px", cursor:"pointer", color:"#fff", fontWeight:700 }}>{editId?"Save Changes":"Add Partner"}</button>
            </div>
          </div>
        </div>
      )}

      {showPayout&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:themeKey==="black"?"#0f0f23":"#fff", border:`1px solid ${T.border}`, borderRadius:16, padding:28, maxWidth:380, width:"100%" }}>
            <h2 style={{ fontWeight:800, fontSize:17, color:T.text, margin:"0 0 16px" }}>Confirm Payout</h2>
            <p style={{ fontSize:14, color:T.sub, marginBottom:20 }}>Mark ₹{showPayout.pendingPayout.toLocaleString("en-IN")} payout to <strong style={{ color:T.text }}>{showPayout.name}</strong> as paid?</p>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowPayout(null)} style={{ flex:1, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px", cursor:"pointer", color:T.text, fontWeight:600 }}>Cancel</button>
              <button onClick={()=>markPaid(showPayout.id)} style={{ flex:2, background:"linear-gradient(135deg,#4ade80,#22c55e)", border:"none", borderRadius:8, padding:"9px", cursor:"pointer", color:"#000", fontWeight:700 }}>Confirm Paid</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAffiliateManagement;
