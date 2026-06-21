import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Crown, Plus, Edit2, Trash2, X, Check, Users, IndianRupee, TrendingUp, Star } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1="#6366f1";
const PLAN_KEY="admin_subscription_plans_v1";

type Plan={id:string;name:string;target:"freelancer"|"employer"|"both";price:number;duration:number;durationUnit:"days"|"months";features:string[];color:string;popular:boolean;active:boolean};

function seedPlans():Plan[]{return[
  {id:"p1",name:"Freelancer Pro",target:"freelancer",price:499,duration:1,durationUnit:"months",features:["Priority in search results","Unlimited job applications","Profile badge","Direct messaging","10% lower platform fees","Advanced analytics"],color:"#6366f1",popular:true,active:true},
  {id:"p2",name:"Freelancer Elite",target:"freelancer",price:999,duration:1,durationUnit:"months",features:["Everything in Pro","Featured profile placement","Dedicated support","0% platform fees","Custom portfolio link","Early access to jobs"],color:"#8b5cf6",popular:false,active:true},
  {id:"p3",name:"Employer Starter",target:"employer",price:1499,duration:1,durationUnit:"months",features:["Post up to 10 jobs/month","Access to freelancer profiles","Basic search filters","Email support"],color:"#f59e0b",popular:false,active:true},
  {id:"p4",name:"Employer Gold",target:"employer",price:3999,duration:1,durationUnit:"months",features:["Unlimited job posts","Advanced freelancer search","Priority listing","Dedicated account manager","Bulk messaging","Analytics dashboard"],color:"#10b981",popular:true,active:true},
];}

function loadPlans():Plan[]{try{const d=localStorage.getItem(PLAN_KEY);if(d)return JSON.parse(d);}catch{}const s=seedPlans();localStorage.setItem(PLAN_KEY,JSON.stringify(s));return s;}
function savePlans(p:Plan[]){localStorage.setItem(PLAN_KEY,JSON.stringify(p));}

const COLORS=["#6366f1","#8b5cf6","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#f97316"];
const blank=():Omit<Plan,"id">=>({name:"",target:"freelancer",price:0,duration:1,durationUnit:"months",features:[""],color:"#6366f1",popular:false,active:true});

const AdminSubscriptionManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [plans, setPlans] = useState<Plan[]>(loadPlans);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState<Omit<Plan,"id">>(blank());
  const [featInput, setFeatInput] = useState("");
  const f=(k:any,v:any)=>setForm(p=>({...p,[k]:v}));

  const { data: subsStats } = useQuery({
    queryKey:["admin-subs-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("subscription_type,subscription_expires_at").not("subscription_type","is",null).limit(500);
      return { total:(data||[]).length, active:(data||[]).filter((u:any)=>u.subscription_expires_at&&new Date(u.subscription_expires_at)>new Date()).length };
    },
  });

  const openEdit=(p:Plan)=>{setForm({name:p.name,target:p.target,price:p.price,duration:p.duration,durationUnit:p.durationUnit,features:[...p.features],color:p.color,popular:p.popular,active:p.active});setEditId(p.id);setShowForm(true);};
  const openAdd=()=>{setForm(blank());setEditId(null);setShowForm(true);};

  const addFeature=()=>{if(!featInput.trim())return;f("features",[...form.features,featInput.trim()]);setFeatInput("");};
  const removeFeature=(i:number)=>f("features",form.features.filter((_:any,idx:number)=>idx!==i));

  const submit=()=>{
    if(!form.name.trim())return toast.error("Plan name required");
    if(editId){const up=plans.map(p=>p.id===editId?{...p,...form}:p);setPlans(up);savePlans(up);toast.success("Plan updated");}
    else{const np:Plan={...form,id:`p${Date.now()}`};const up=[...plans,np];setPlans(up);savePlans(up);toast.success("Plan created");}
    setShowForm(false);setEditId(null);
  };
  const del=(id:string)=>{const up=plans.filter(p=>p.id!==id);setPlans(up);savePlans(up);toast.success("Plan deleted");};
  const toggle=(id:string)=>{const up=plans.map(p=>p.id===id?{...p,active:!p.active}:p);setPlans(up);savePlans(up);};

  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});

  return (
    <div style={{ padding:"24px 16px", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Subscription & Plan Management</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Create and manage premium plans for freelancers and employers</p>
        </div>
        <button onClick={openAdd} style={{ background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <Plus size={14}/> New Plan
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
        {[
          {label:"Total Plans",value:plans.length,color:"#6366f1",icon:Crown},
          {label:"Active Plans",value:plans.filter(p=>p.active).length,color:"#4ade80",icon:Check},
          {label:"Total Subscribers",value:subsStats?.total||0,color:"#f59e0b",icon:Users},
          {label:"Active Subscriptions",value:subsStats?.active||0,color:"#8b5cf6",icon:Star},
        ].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36,height:36,borderRadius:9,background:`${s.color}20`,display:"flex",alignItems:"center",justifyContent:"center" }}><s.icon size={16} color={s.color}/></div>
            <div><div style={{ fontWeight:800,fontSize:18,color:T.text }}>{s.value}</div><div style={{ fontSize:10,color:T.sub }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
        {plans.map(p=>(
          <div key={p.id} style={{ background:T.card, border:`2px solid ${p.active?p.color+"33":T.border}`, borderRadius:16, padding:22, position:"relative" }}>
            {p.popular&&<div style={{ position:"absolute",top:-1,right:16,background:`linear-gradient(135deg,${p.color},${p.color}aa)`,color:"#fff",fontSize:10,fontWeight:800,padding:"2px 10px",borderRadius:"0 0 8px 8px" }}>POPULAR</div>}
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:900,fontSize:17,color:T.text }}>{p.name}</div>
                <span style={bs(p.color,`${p.color}15`)}>{p.target==="both"?"All Users":p.target==="freelancer"?"Freelancer":"Employer"}</span>
              </div>
              <span style={bs(p.active?"#4ade80":"#94a3b8",p.active?"rgba(74,222,128,.12)":"rgba(148,163,184,.12)")}>{p.active?"Active":"Off"}</span>
            </div>
            <div style={{ fontWeight:900,fontSize:28,color:p.color,marginBottom:12 }}>
              ₹{p.price.toLocaleString("en-IN")}<span style={{ fontSize:13,fontWeight:400,color:T.sub }}>/{p.duration}{p.durationUnit==="months"?"mo":"d"}</span>
            </div>
            <div style={{ marginBottom:14 }}>
              {p.features.map((feat,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
                  <Check size={11} color={p.color}/><span style={{ fontSize:12,color:T.sub }}>{feat}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:6 }}>
              <button onClick={()=>openEdit(p)} style={{ flex:1,background:`${A1}15`,border:`1px solid ${A1}33`,borderRadius:7,padding:"7px",cursor:"pointer",color:A1,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:3 }}><Edit2 size={11}/> Edit</button>
              <button onClick={()=>toggle(p.id)} style={{ flex:1,background:p.active?"rgba(248,113,113,.1)":"rgba(74,222,128,.1)",border:`1px solid ${p.active?"rgba(248,113,113,.3)":"rgba(74,222,128,.3)"}`,borderRadius:7,padding:"7px",cursor:"pointer",color:p.active?"#f87171":"#4ade80",fontSize:12 }}>{p.active?"Disable":"Enable"}</button>
              <button onClick={()=>del(p.id)} style={{ background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:7,padding:"7px 11px",cursor:"pointer",color:"#f87171" }}><Trash2 size={12}/></button>
            </div>
          </div>
        ))}
      </div>

      {showForm&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:themeKey==="black"?"#0f0f23":"#fff",border:`1px solid ${T.border}`,borderRadius:16,padding:28,maxWidth:520,width:"100%",maxHeight:"90vh",overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:20 }}>
              <h2 style={{ fontWeight:800,fontSize:17,color:T.text,margin:0 }}>{editId?"Edit Plan":"New Plan"}</h2>
              <button onClick={()=>setShowForm(false)} style={{ background:"none",border:"none",cursor:"pointer",color:T.sub }}><X size={20}/></button>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
              <div style={{ gridColumn:"span 2" }}>
                <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:5 }}>Plan Name</label>
                <input value={form.name} onChange={e=>f("name",e.target.value)} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,boxSizing:"border-box" as any }}/>
              </div>
              <div>
                <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:5 }}>Target</label>
                <select value={form.target} onChange={e=>f("target",e.target.value)} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13 }}>
                  <option value="freelancer">Freelancer</option>
                  <option value="employer">Employer</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:5 }}>Price (₹)</label>
                <input type="number" value={form.price} onChange={e=>f("price",Number(e.target.value))} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,boxSizing:"border-box" as any }}/>
              </div>
              <div>
                <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:5 }}>Duration</label>
                <input type="number" value={form.duration} onChange={e=>f("duration",Number(e.target.value))} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,boxSizing:"border-box" as any }}/>
              </div>
              <div>
                <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:5 }}>Duration Unit</label>
                <select value={form.durationUnit} onChange={e=>f("durationUnit",e.target.value)} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13 }}>
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop:14 }}>
              <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:6 }}>Color</label>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {COLORS.map(c=><button key={c} onClick={()=>f("color",c)} style={{ width:28,height:28,borderRadius:6,background:c,border:`3px solid ${form.color===c?"#fff":"transparent"}`,cursor:"pointer",outline:form.color===c?`2px solid ${c}`:"none" }}/>)}
              </div>
            </div>
            <div style={{ marginTop:14 }}>
              <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:6 }}>Features</label>
              <div style={{ display:"flex",gap:6,marginBottom:8 }}>
                <input value={featInput} onChange={e=>setFeatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFeature()} placeholder="Add a feature..." style={{ flex:1,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 12px",fontSize:13 }}/>
                <button onClick={addFeature} style={{ background:`${A1}20`,border:`1px solid ${A1}44`,borderRadius:8,padding:"7px 12px",cursor:"pointer",color:A1,fontWeight:700 }}>Add</button>
              </div>
              {form.features.filter((x:string)=>x).map((feat:string,i:number)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:`${A1}08`,borderRadius:7,padding:"6px 10px",marginBottom:5 }}>
                  <span style={{ fontSize:12,color:T.text }}>✓ {feat}</span>
                  <button onClick={()=>removeFeature(i)} style={{ background:"none",border:"none",cursor:"pointer",color:"#f87171" }}><X size={12}/></button>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:14,marginTop:16,marginBottom:18 }}>
              {[{l:"Mark as Popular",k:"popular"},{l:"Active",k:"active"}].map(sw=>(
                <label key={sw.k} style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}>
                  <div onClick={()=>f(sw.k,!(form as any)[sw.k])} style={{ width:36,height:20,borderRadius:10,background:(form as any)[sw.k]?A1:"rgba(148,163,184,.3)",position:"relative",cursor:"pointer" }}>
                    <div style={{ position:"absolute",top:2,left:(form as any)[sw.k]?16:2,width:16,height:16,borderRadius:8,background:"#fff",transition:"left .2s" }}/>
                  </div>
                  <span style={{ fontSize:13,color:T.text }}>{sw.l}</span>
                </label>
              ))}
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setShowForm(false)} style={{ flex:1,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px",cursor:"pointer",color:T.text,fontWeight:600 }}>Cancel</button>
              <button onClick={submit} style={{ flex:2,background:`linear-gradient(135deg,${A1},#8b5cf6)`,border:"none",borderRadius:8,padding:"9px",cursor:"pointer",color:"#fff",fontWeight:700 }}>{editId?"Save Changes":"Create Plan"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionManagement;
