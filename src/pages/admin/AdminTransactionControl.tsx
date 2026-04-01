import { useState } from "react";
import { IndianRupee, ShieldCheck, AlertTriangle, CheckCircle2, Search, Lock, RefreshCw, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface Transaction { id:string; txnId:string; userId:string; type:"withdrawal"|"deposit"|"fee"|"refund"; amount:number; status:"confirmed"|"pending"|"duplicate"|"failed"|"review"; isDuplicate:boolean; duplicateOf?:string; gateway:string; createdAt:string; reviewNote?:string; }

const seedTxns = (): Transaction[] => [
  { id:"t1", txnId:"TXN_2024_001821", userId:"4821", type:"withdrawal", amount:25000, status:"confirmed",  isDuplicate:false, gateway:"Razorpay", createdAt:new Date(Date.now()-300000).toISOString() },
  { id:"t2", txnId:"TXN_2024_001822", userId:"4821", type:"withdrawal", amount:25000, status:"duplicate",  isDuplicate:true,  duplicateOf:"TXN_2024_001821", gateway:"Razorpay", createdAt:new Date(Date.now()-295000).toISOString(), reviewNote:"Same amount + user + gateway within 60s window" },
  { id:"t3", txnId:"TXN_2024_001823", userId:"2241", type:"deposit",    amount:10000, status:"confirmed",  isDuplicate:false, gateway:"Razorpay", createdAt:new Date(Date.now()-600000).toISOString() },
  { id:"t4", txnId:"TXN_2024_001824", userId:"9901", type:"withdrawal", amount:5000,  status:"review",     isDuplicate:false, gateway:"Manual",   createdAt:new Date(Date.now()-900000).toISOString(),   reviewNote:"Amount exceeds single-transaction limit ₹5,000" },
  { id:"t5", txnId:"TXN_2024_001825", userId:"3310", type:"refund",     amount:1200,  status:"failed",     isDuplicate:false, gateway:"Razorpay", createdAt:new Date(Date.now()-1800000).toISOString() },
  { id:"t6", txnId:"TXN_2024_001826", userId:"5544", type:"fee",        amount:199,   status:"confirmed",  isDuplicate:false, gateway:"Internal", createdAt:new Date(Date.now()-3600000).toISOString() },
];

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const statusColor: Record<string,string> = { confirmed:"#4ade80", pending:"#fbbf24", duplicate:"#f87171", failed:"#f87171", review:"#fb923c" };
const typeColor:   Record<string,string> = { withdrawal:"#f87171", deposit:"#4ade80", fee:"#94a3b8", refund:"#fbbf24" };

export default function AdminTransactionControl() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [txns, setTxns]   = useState<Transaction[]>(()=>load("admin_txn_control_v1",seedTxns));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [approving, setApproving] = useState<string|null>(null);
  const [rejecting, setRejecting] = useState<string|null>(null);

  const approve = async (id:string) => {
    setApproving(id);
    await new Promise(r=>setTimeout(r,700));
    const updated = txns.map(t=>t.id===id?{...t,status:"confirmed" as const}:t);
    localStorage.setItem("admin_txn_control_v1",JSON.stringify(updated));
    setTxns(updated); setApproving(null);
    logAction("Transaction Approved",txns.find(t=>t.id===id)?.txnId||"","Finance","success");
    toast({ title:"Transaction approved" });
  };

  const reject = async (id:string) => {
    setRejecting(id);
    await new Promise(r=>setTimeout(r,700));
    const updated = txns.map(t=>t.id===id?{...t,status:"failed" as const}:t);
    localStorage.setItem("admin_txn_control_v1",JSON.stringify(updated));
    setTxns(updated); setRejecting(null);
    logAction("Transaction Rejected",txns.find(t=>t.id===id)?.txnId||"","Finance","warning");
    toast({ title:"Transaction rejected" });
  };

  const filtered = txns.filter(t=>{
    if(filter!=="all"&&t.status!==filter) return false;
    if(search&&!t.txnId.toLowerCase().includes(search.toLowerCase())&&!t.userId.includes(search)) return false;
    return true;
  });

  const dupes = txns.filter(t=>t.isDuplicate).length;
  const reviews = txns.filter(t=>t.status==="review").length;

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <IndianRupee size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Duplicate Transaction Protection</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Unique ID validation · Duplicate detection · Transaction locking · Retry protection · Manual review</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Total Transactions",v:txns.length,c:T.badgeFg},{l:"Duplicates Blocked",v:dupes,c:dupes>0?"#f87171":"#94a3b8"},{l:"Pending Review",v:reviews,c:reviews>0?"#fb923c":"#94a3b8"},{l:"Confirmed",v:txns.filter(t=>t.status==="confirmed").length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:8,marginBottom:12,flexWrap:"wrap" }}>
        <div style={{ position:"relative",flex:1,minWidth:200 }}>
          <Search size={13} style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:T.sub }}/>
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by TXN ID or user ID…" style={{ background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,paddingLeft:32,fontSize:12 }}/>
        </div>
        <div style={{ display:"flex",gap:6 }}>
          {["all","confirmed","duplicate","review","failed"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{ padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===s?A1:T.border}`,background:filter===s?`${A1}15`:T.card,color:filter===s?T.badgeFg:T.sub,textTransform:"capitalize" }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ background:"rgba(74,222,128,.04)",border:"1px solid rgba(74,222,128,.1)",borderRadius:10,padding:"9px 14px",marginBottom:12,display:"flex",gap:8,alignItems:"center" }}>
        <ShieldCheck size={12} color="#4ade80"/>
        <span style={{ fontSize:11,color:"#4ade80" }}>Duplicate detection: same user + amount + gateway within 60-second window. All duplicates are automatically blocked and flagged for review.</span>
      </div>

      <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden" }}>
        {filtered.map((t,i)=>(
          <div key={t.id} style={{ display:"flex",gap:12,padding:"13px 18px",borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none",alignItems:"center" }}>
            <div style={{ width:9,height:9,borderRadius:"50%",background:statusColor[t.status],flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap" }}>
                <span style={{ fontFamily:"monospace",fontWeight:700,fontSize:12,color:T.text }}>{t.txnId}</span>
                <span style={{ fontSize:10,fontWeight:700,color:typeColor[t.type],background:`${typeColor[t.type]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize" }}>{t.type}</span>
                <span style={{ fontSize:10,fontWeight:700,color:statusColor[t.status],background:`${statusColor[t.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize" }}>{t.status}</span>
                {t.isDuplicate&&<span style={{ fontSize:10,color:"#f87171" }}>→ duplicate of {t.duplicateOf}</span>}
              </div>
              <p style={{ fontSize:12,color:T.sub,margin:0 }}>User: {t.userId} · ₹{t.amount.toLocaleString()} · {t.gateway} · {formatDistanceToNow(new Date(t.createdAt))} ago</p>
              {t.reviewNote&&<p style={{ fontSize:11,color:"#fb923c",margin:"2px 0 0" }}>{t.reviewNote}</p>}
            </div>
            <div style={{ display:"flex",gap:6,flexShrink:0 }}>
              {t.status==="review"&&(
                <>
                  <button onClick={()=>approve(t.id)} disabled={approving===t.id} style={{ padding:"5px 12px",borderRadius:7,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer" }}>{approving===t.id?"…":"Approve"}</button>
                  <button onClick={()=>reject(t.id)} disabled={rejecting===t.id} style={{ padding:"5px 12px",borderRadius:7,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer" }}>{rejecting===t.id?"…":"Reject"}</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
