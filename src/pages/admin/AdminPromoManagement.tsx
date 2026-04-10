import { useState } from "react";
import { toast } from "sonner";
import { Tag, Plus, Edit2, Trash2, Copy, X, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";
import { format, addDays } from "date-fns";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const A1 = "#6366f1";
const PROMO_KEY = "admin_promos_v1";

type PromoCode = {
  id:string; code:string; description:string; type:"percent"|"flat"; value:number;
  minOrder:number; maxUses:number; usedCount:number; validFrom:string; validTo:string;
  category:string; active:boolean; createdAt:string;
};

function seed():PromoCode[] {
  return [
    {id:"p1",code:"WELCOME20",description:"New user welcome discount",type:"percent",value:20,minOrder:500,maxUses:1000,usedCount:342,validFrom:new Date(Date.now()-86400000*30).toISOString(),validTo:new Date(Date.now()+86400000*60).toISOString(),category:"all",active:true,createdAt:new Date(Date.now()-86400000*30).toISOString()},
    {id:"p2",code:"FREELAN100",description:"Flat ₹100 off on first project",type:"flat",value:100,minOrder:1000,maxUses:500,usedCount:178,validFrom:new Date(Date.now()-86400000*15).toISOString(),validTo:new Date(Date.now()+86400000*30).toISOString(),category:"all",active:true,createdAt:new Date(Date.now()-86400000*15).toISOString()},
    {id:"p3",code:"WEBDEV10",description:"10% off web development projects",type:"percent",value:10,minOrder:2000,maxUses:200,usedCount:200,validFrom:new Date(Date.now()-86400000*60).toISOString(),validTo:new Date(Date.now()-86400000*1).toISOString(),category:"Web Development",active:false,createdAt:new Date(Date.now()-86400000*60).toISOString()},
  ];
}
function load():PromoCode[] {
  try{const d=localStorage.getItem(PROMO_KEY);if(d)return JSON.parse(d);}catch{}
  const s=seed();localStorage.setItem(PROMO_KEY,JSON.stringify(s));return s;
}
function save(p:PromoCode[]){localStorage.setItem(PROMO_KEY,JSON.stringify(p));}

const blank=():Omit<PromoCode,"id"|"usedCount"|"createdAt">=>({code:"",description:"",type:"percent",value:10,minOrder:0,maxUses:100,validFrom:new Date().toISOString().slice(0,10),validTo:addDays(new Date(),30).toISOString().slice(0,10),category:"all",active:true});

const AdminPromoManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [promos, setPromos] = useState<PromoCode[]>(load);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState<ReturnType<typeof blank>>(blank());
  const f=(k:any,v:any)=>setForm(p=>({...p,[k]:v}));

  const openAdd=()=>{setForm(blank());setEditId(null);setShowForm(true);};
  const openEdit=(p:PromoCode)=>{
    setForm({code:p.code,description:p.description,type:p.type,value:p.value,minOrder:p.minOrder,maxUses:p.maxUses,validFrom:p.validFrom.slice(0,10),validTo:p.validTo.slice(0,10),category:p.category,active:p.active});
    setEditId(p.id);setShowForm(true);
  };
  const submit=()=>{
    if(!form.code.trim())return toast.error("Code required");
    if(editId){
      const up=promos.map(p=>p.id===editId?{...p,...form}:p);setPromos(up);save(up);toast.success("Promo updated");
    } else {
      const np:PromoCode={...form,id:`p${Date.now()}`,usedCount:0,createdAt:new Date().toISOString()};
      const up=[...promos,np];setPromos(up);save(up);toast.success("Promo code created");
    }
    setShowForm(false);setEditId(null);
  };
  const del=(id:string)=>{const up=promos.filter(p=>p.id!==id);setPromos(up);save(up);toast.success("Deleted");};
  const toggle=(id:string)=>{const up=promos.map(p=>p.id===id?{...p,active:!p.active}:p);setPromos(up);save(up);};
  const copy=(code:string)=>{navigator.clipboard.writeText(code).then(()=>toast.success("Code copied!"));};

  const isExpired=(p:PromoCode)=>new Date(p.validTo)<new Date();
  const isFull=(p:PromoCode)=>p.usedCount>=p.maxUses;
  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});

  return (
    <div style={{ padding:"24px 16px", maxWidth:980, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Promo Code Management</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Create discount codes and coupon campaigns</p>
        </div>
        <button onClick={openAdd} style={{ background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <Plus size={14}/> New Promo Code
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[
          {label:"Active Codes",value:promos.filter(p=>p.active&&!isExpired(p)&&!isFull(p)).length,color:"#4ade80"},
          {label:"Total Uses",value:promos.reduce((s,p)=>s+p.usedCount,0),color:"#6366f1"},
          {label:"Expired/Full",value:promos.filter(p=>isExpired(p)||isFull(p)).length,color:"#f87171"},
        ].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 18px", textAlign:"center" }}>
            <div style={{ fontWeight:800, fontSize:28, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:T.sub, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
        {promos.map(p=>{
          const expired=isExpired(p); const full=isFull(p);
          const status=!p.active?"Inactive":expired?"Expired":full?"Limit Reached":"Active";
          const statusColor=status==="Active"?"#4ade80":status==="Inactive"?"#94a3b8":"#f87171";
          return (
            <div key={p.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontFamily:"monospace", fontWeight:900, fontSize:16, color:T.text, letterSpacing:1 }}>{p.code}</span>
                    <button onClick={()=>copy(p.code)} style={{ background:"none", border:"none", cursor:"pointer", color:T.sub, padding:2 }}><Copy size={12}/></button>
                  </div>
                  <p style={{ fontSize:12, color:T.sub, margin:"4px 0 0" }}>{p.description}</p>
                </div>
                <span style={bs(statusColor,`${statusColor}15`)}>{status}</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                {[
                  {label:"Discount",value:p.type==="percent"?`${p.value}%`:`₹${p.value}`},
                  {label:"Min Order",value:`₹${p.minOrder}`},
                  {label:"Uses",value:`${p.usedCount}/${p.maxUses}`},
                  {label:"Category",value:p.category==="all"?"All":p.category},
                ].map(item=>(
                  <div key={item.label} style={{ background:`${A1}08`, borderRadius:8, padding:"6px 10px" }}>
                    <div style={{ fontSize:10, color:T.sub, textTransform:"uppercase" }}>{item.label}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text, marginTop:1 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:11, color:T.sub, marginBottom:12 }}>
                <Calendar size={10} style={{ display:"inline", marginRight:4 }}/>
                {safeFmt(p.validFrom,"dd MMM")} → {safeFmt(p.validTo,"dd MMM yyyy")}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>openEdit(p)} style={{ flex:1, background:`${A1}15`, border:`1px solid ${A1}33`, borderRadius:7, padding:"6px", cursor:"pointer", color:A1, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}><Edit2 size={11}/> Edit</button>
                <button onClick={()=>toggle(p.id)} style={{ flex:1, background:p.active?"rgba(248,113,113,.1)":"rgba(74,222,128,.1)", border:`1px solid ${p.active?"rgba(248,113,113,.3)":"rgba(74,222,128,.3)"}`, borderRadius:7, padding:"6px", cursor:"pointer", color:p.active?"#f87171":"#4ade80", fontSize:12 }}>{p.active?"Disable":"Enable"}</button>
                <button onClick={()=>del(p.id)} style={{ background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.3)", borderRadius:7, padding:"6px 10px", cursor:"pointer", color:"#f87171" }}><Trash2 size={12}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:themeKey==="black"?"#0f0f23":"#fff", border:`1px solid ${T.border}`, borderRadius:16, padding:28, maxWidth:480, width:"100%", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ fontWeight:800, fontSize:17, color:T.text, margin:0 }}>{editId?"Edit Promo":"New Promo Code"}</h2>
              <button onClick={()=>setShowForm(false)} style={{ background:"none", border:"none", cursor:"pointer", color:T.sub }}><X size={20}/></button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {[{l:"Code",k:"code",t:"text"},{l:"Description",k:"description",t:"text"},{l:"Min Order (₹)",k:"minOrder",t:"number"},{l:"Max Uses",k:"maxUses",t:"number"},{l:"Valid From",k:"validFrom",t:"date"},{l:"Valid To",k:"validTo",t:"date"}].map(fi=>(
                <div key={fi.k} style={{ gridColumn:fi.k==="description"?"span 2":"auto" }}>
                  <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>{fi.l}</label>
                  <input type={fi.t} value={(form as any)[fi.k]} onChange={e=>f(fi.k,fi.t==="number"?Number(e.target.value):e.target.value)} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, boxSizing:"border-box" as any }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>Discount Type</label>
                <select value={form.type} onChange={e=>f("type",e.target.value)} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13 }}>
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>Value</label>
                <input type="number" value={form.value} onChange={e=>f("value",Number(e.target.value))} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, boxSizing:"border-box" as any }}/>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, marginTop:20 }}>
              <button onClick={()=>setShowForm(false)} style={{ flex:1, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px", cursor:"pointer", color:T.text, fontWeight:600 }}>Cancel</button>
              <button onClick={submit} style={{ flex:2, background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:8, padding:"9px", cursor:"pointer", color:"#fff", fontWeight:700 }}>{editId?"Save Changes":"Create Code"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromoManagement;
