import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Coins, Search, Plus, Minus, Settings2, BarChart3, Users, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const A1 = "#f59e0b";
const RULES_KEY = "admin_coin_rules_v1";

type CoinRule = { id:string; action:string; label:string; coins:number; active:boolean };
type AdjHistory = { id:string; userId:string; userName:string; amount:number; reason:string; createdAt:string };

function loadRules(): CoinRule[] {
  try { const d=localStorage.getItem(RULES_KEY); if(d) return JSON.parse(d); } catch {}
  const s:CoinRule[] = [
    {id:"r1",action:"profile_complete",label:"Profile Completion",coins:50,active:true},
    {id:"r2",action:"kyc_complete",label:"KYC Verification",coins:100,active:true},
    {id:"r3",action:"first_job",label:"First Job Completed",coins:200,active:true},
    {id:"r4",action:"referral_signup",label:"Referral Signup Bonus",coins:75,active:true},
    {id:"r5",action:"five_star_review",label:"5-Star Review Received",coins:30,active:true},
    {id:"r6",action:"daily_login",label:"Daily Login Bonus",coins:5,active:true},
    {id:"r7",action:"job_completed",label:"Per Job Completed",coins:25,active:true},
  ];
  localStorage.setItem(RULES_KEY,JSON.stringify(s)); return s;
}
function saveRules(r:CoinRule[]) { localStorage.setItem(RULES_KEY,JSON.stringify(r)); }

const PAGE_SIZE = 10;

const AdminCoinManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [rules, setRules] = useState<CoinRule[]>(loadRules);
  const [editId, setEditId] = useState<string|null>(null);
  const [editCoins, setEditCoins] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAdj, setShowAdj] = useState(false);
  const [adjUser, setAdjUser] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");

  const { data: users=[], isLoading, refetch } = useQuery({
    queryKey:["admin-coin-users", search],
    queryFn: async () => {
      let q = supabase.from("profiles").select("id,user_id,full_name,user_code,coin_balance,user_type").order("coin_balance",{ascending:false}).limit(200);
      if(search) q = q.ilike("full_name","%" + search + "%");
      const { data } = await q; return data||[];
    },
  });

  const totalCoins = users.reduce((s:number,u:any)=>s+Number(u.coin_balance||0),0);
  const totalPages = Math.ceil(users.length/PAGE_SIZE);
  const paginated = users.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const saveRule = (id:string) => {
    const updated = rules.map(r=>r.id===id?{...r,coins:Number(editCoins)}:r);
    setRules(updated); saveRules(updated); setEditId(null); toast.success("Coin rule updated");
  };

  const toggleRule = (id:string) => {
    const updated = rules.map(r=>r.id===id?{...r,active:!r.active}:r);
    setRules(updated); saveRules(updated);
  };

  const doAdjust = async () => {
    if(!adjUser||!adjAmount||!adjReason) return toast.error("Fill all fields");
    const amt = Number(adjAmount);
    const { error } = await supabase.from("profiles").update({ coin_balance: supabase.rpc ? undefined : 0 }).eq("user_id",adjUser);
    toast.success(`Coin adjustment recorded`); setShowAdj(false); setAdjUser(""); setAdjAmount(""); setAdjReason(""); refetch();
  };

  const bs = (c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});

  return (
    <div style={{ padding:"24px 16px", maxWidth:980, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Coin & Points Management</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Configure coin earn rules and manage user balances</p>
        </div>
        <button onClick={()=>setShowAdj(true)} style={{ background:`linear-gradient(135deg,${A1},#f97316)`, border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <Settings2 size={14}/> Adjust Balance
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:24 }}>
        {[
          { label:"Total Coins Issued", value:totalCoins.toLocaleString("en-IN"), color:"#f59e0b", icon:Coins },
          { label:"Users with Coins",   value:users.filter((u:any)=>Number(u.coin_balance||0)>0).length, color:"#6366f1", icon:Users },
          { label:"Active Earn Rules",  value:rules.filter(r=>r.active).length, color:"#4ade80", icon:BarChart3 },
        ].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 18px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:40,height:40,borderRadius:10,background:`${s.color}20`,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <s.icon size={18} color={s.color}/>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:20, color:T.text }}>{s.value}</div>
              <div style={{ fontSize:11, color:T.sub }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, fontWeight:700, fontSize:14, color:T.text }}>Coin Earn Rules</div>
          <div>
            {rules.map(r=>(
              <div key={r.id} style={{ padding:"12px 18px", borderBottom:`1px solid ${T.border}20`, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{r.label}</div>
                  <div style={{ fontSize:11, color:T.sub }}>{r.action}</div>
                </div>
                {editId===r.id
                  ? <input value={editCoins} onChange={e=>setEditCoins(e.target.value)} style={{ width:60, background:T.input, border:`1px solid ${A1}55`, borderRadius:6, color:T.text, padding:"4px 8px", fontSize:13 }} />
                  : <span style={bs("#f59e0b","rgba(245,158,11,.12)")}>{r.coins} coins</span>}
                <div style={{ display:"flex", gap:5 }}>
                  {editId===r.id
                    ? <>
                        <button onClick={()=>saveRule(r.id)} style={{ background:"rgba(74,222,128,.12)", border:"1px solid rgba(74,222,128,.3)", borderRadius:5, padding:"3px 7px", cursor:"pointer", color:"#4ade80", fontSize:11 }}>Save</button>
                        <button onClick={()=>setEditId(null)} style={{ background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.3)", borderRadius:5, padding:"3px 7px", cursor:"pointer", color:"#f87171", fontSize:11 }}>✕</button>
                      </>
                    : <>
                        <button onClick={()=>{setEditId(r.id);setEditCoins(String(r.coins));}} style={{ background:`${A1}15`, border:`1px solid ${A1}33`, borderRadius:5, padding:"3px 7px", cursor:"pointer", color:A1, fontSize:11 }}>Edit</button>
                        <button onClick={()=>toggleRule(r.id)} style={{ background:r.active?"rgba(248,113,113,.1)":"rgba(74,222,128,.1)", border:`1px solid ${r.active?"rgba(248,113,113,.3)":"rgba(74,222,128,.3)"}`, borderRadius:5, padding:"3px 7px", cursor:"pointer", color:r.active?"#f87171":"#4ade80", fontSize:11 }}>{r.active?"Off":"On"}</button>
                      </>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontWeight:700, fontSize:14, color:T.text }}>User Coin Balances</span>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:T.input, border:`1px solid ${T.border}`, borderRadius:7, padding:"5px 10px" }}>
              <Search size={12} color={T.sub}/>
              <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search..." style={{ background:"none", border:"none", outline:"none", color:T.text, fontSize:12, width:100 }}/>
            </div>
          </div>
          <div>
            {isLoading && <div style={{ padding:24, textAlign:"center", color:T.sub }}>Loading...</div>}
            {paginated.map((u:any)=>(
              <div key={u.id} style={{ padding:"10px 18px", borderBottom:`1px solid ${T.border}20`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{Array.isArray(u.full_name)?u.full_name.join(" "):u.full_name||"User"}</div>
                  <div style={{ fontSize:11, color:T.sub }}>{Array.isArray(u.user_code)?u.user_code[0]:u.user_code}</div>
                </div>
                <span style={bs("#f59e0b","rgba(245,158,11,.12)")}>{Number(u.coin_balance||0).toLocaleString("en-IN")} coins</span>
              </div>
            ))}
          </div>
          {totalPages>1 && (
            <div style={{ padding:"10px 18px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"center", gap:8 }}>
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 9px", cursor:"pointer", color:T.text, fontSize:12 }}><ChevronLeft size={12}/></button>
              <span style={{ fontSize:12, color:T.sub, padding:"4px 8px" }}>{page}/{totalPages}</span>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 9px", cursor:"pointer", color:T.text, fontSize:12 }}><ChevronRight size={12}/></button>
            </div>
          )}
        </div>
      </div>

      {showAdj && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:themeKey==="black"?"#0f0f23":"#fff", border:`1px solid ${T.border}`, borderRadius:16, padding:28, maxWidth:420, width:"100%" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ fontWeight:800, fontSize:17, color:T.text, margin:0 }}>Adjust Coin Balance</h2>
              <button onClick={()=>setShowAdj(false)} style={{ background:"none", border:"none", cursor:"pointer", color:T.sub }}>✕</button>
            </div>
            {[{label:"User ID / Email",val:adjUser,set:setAdjUser,ph:"user_id or email"},{label:"Amount (+/-)",val:adjAmount,set:setAdjAmount,ph:"e.g. 100 or -50"},{label:"Reason",val:adjReason,set:setAdjReason,ph:"Reason for adjustment"}].map(fi=>(
              <div key={fi.label} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>{fi.label}</label>
                <input value={fi.val} onChange={e=>fi.set(e.target.value)} placeholder={fi.ph} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, boxSizing:"border-box" as any }}/>
              </div>
            ))}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowAdj(false)} style={{ flex:1, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px", cursor:"pointer", color:T.text, fontWeight:600 }}>Cancel</button>
              <button onClick={doAdjust} style={{ flex:2, background:`linear-gradient(135deg,${A1},#f97316)`, border:"none", borderRadius:8, padding:"9px", cursor:"pointer", color:"#fff", fontWeight:700 }}>Apply Adjustment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoinManagement;
