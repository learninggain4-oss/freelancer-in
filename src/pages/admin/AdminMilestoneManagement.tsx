import { useState } from "react";
import { toast } from "sonner";
import { Milestone, Plus, CheckCircle2, Clock, AlertCircle, IndianRupee, Search, ChevronLeft, ChevronRight, X, Eye } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1="#6366f1";
const MS_KEY="admin_milestones_v1";

type MilestoneItem={id:string;projectTitle:string;freelancerName:string;employerName:string;title:string;amount:number;dueDate:string;status:"pending"|"submitted"|"approved"|"paid"|"disputed";submittedAt?:string;notes:string;};

function seed():MilestoneItem[]{return[
  {id:"m1",projectTitle:"E-commerce Website",freelancerName:"Rahul Kumar",employerName:"ShopCo",title:"UI Design Mockups",amount:5000,dueDate:new Date(Date.now()+86400000*5).toISOString(),status:"submitted",submittedAt:new Date(Date.now()-86400000*1).toISOString(),notes:"All screens completed as per wireframe"},
  {id:"m2",projectTitle:"Mobile App",freelancerName:"Priya Sharma",employerName:"TechStartup",title:"Backend API Development",amount:15000,dueDate:new Date(Date.now()+86400000*2).toISOString(),status:"pending",notes:""},
  {id:"m3",projectTitle:"Logo Design",freelancerName:"Amit Singh",employerName:"BrandCo",title:"Final Logo Files",amount:2000,dueDate:new Date(Date.now()-86400000*3).toISOString(),status:"approved",submittedAt:new Date(Date.now()-86400000*5).toISOString(),notes:"Client approved all variations"},
  {id:"m4",projectTitle:"SEO Campaign",freelancerName:"Sneha Patel",employerName:"MarketAgency",title:"Month 1 Report",amount:8000,dueDate:new Date(Date.now()-86400000*7).toISOString(),status:"paid",submittedAt:new Date(Date.now()-86400000*8).toISOString(),notes:"Payment released"},
  {id:"m5",projectTitle:"Content Writing",freelancerName:"Vikram Dev",employerName:"BlogNet",title:"50 Articles Batch 1",amount:4000,dueDate:new Date(Date.now()-86400000*2).toISOString(),status:"disputed",notes:"Quality not meeting expectations"},
];}
function load():MilestoneItem[]{try{const d=localStorage.getItem(MS_KEY);if(d)return JSON.parse(d);}catch{}const s=seed();localStorage.setItem(MS_KEY,JSON.stringify(s));return s;}
function save(m:MilestoneItem[]){localStorage.setItem(MS_KEY,JSON.stringify(m));}

const STATUS_META:Record<string,{label:string;color:string;bg:string}>={
  pending:{label:"Pending",color:"#94a3b8",bg:"rgba(148,163,184,.12)"},
  submitted:{label:"Submitted",color:"#fbbf24",bg:"rgba(251,191,36,.12)"},
  approved:{label:"Approved",color:"#60a5fa",bg:"rgba(96,165,250,.12)"},
  paid:{label:"Paid",color:"#4ade80",bg:"rgba(74,222,128,.12)"},
  disputed:{label:"Disputed",color:"#f87171",bg:"rgba(248,113,113,.12)"},
};
const PAGE_SIZE=8;

const AdminMilestoneManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [items, setItems] = useState<MilestoneItem[]>(load);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MilestoneItem|null>(null);
  const [actionNote, setActionNote] = useState("");

  const filtered=items.filter(i=>{
    const q=search.toLowerCase();
    const mq=!q||i.projectTitle.toLowerCase().includes(q)||i.freelancerName.toLowerCase().includes(q)||i.employerName.toLowerCase().includes(q);
    const mf=filter==="all"||i.status===filter;
    return mq&&mf;
  });

  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const paginated=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);

  const updateStatus=(id:string,status:MilestoneItem["status"])=>{
    const up=items.map(i=>i.id===id?{...i,status,notes:actionNote||i.notes}:i);
    setItems(up);save(up);setSelected(null);setActionNote("");
    toast.success(`Milestone marked as ${status}`);
  };

  const totals={submitted:items.filter(i=>i.status==="submitted").length,disputed:items.filter(i=>i.status==="disputed").length,pendingAmt:items.filter(i=>i.status==="approved").reduce((s,i)=>s+i.amount,0)};

  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});

  return (
    <div style={{ padding:"24px 16px", maxWidth:980, margin:"0 auto" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Milestone Management</h1>
        <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Track project milestones and approve payment releases</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[{label:"Awaiting Review",value:totals.submitted,color:"#fbbf24"},{label:"Disputed Milestones",value:totals.disputed,color:"#f87171"},{label:"Pending Payout (₹)",value:`₹${totals.pendingAmt.toLocaleString("en-IN")}`,color:"#4ade80"}].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 18px", textAlign:"center" }}>
            <div style={{ fontWeight:800, fontSize:24, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:T.sub, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",flex:1,minWidth:160 }}>
            <Search size={13} color={T.sub}/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search..." style={{ background:"none",border:"none",outline:"none",color:T.text,fontSize:13,flex:1 }}/>
          </div>
          <select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"6px 12px",fontSize:13 }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {["Project","Milestone","Freelancer","Amount","Due Date","Status","Action"].map(h=><th key={h} style={{ padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:T.sub,textTransform:"uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {paginated.length===0&&<tr><td colSpan={7} style={{ padding:32,textAlign:"center",color:T.sub }}>No milestones found</td></tr>}
              {paginated.map(item=>{
                const isOverdue=new Date(item.dueDate)<new Date()&&!["paid","approved"].includes(item.status);
                return (
                  <tr key={item.id} style={{ borderBottom:`1px solid ${T.border}20` }}>
                    <td style={{ padding:"10px 14px",fontSize:13,color:T.text,fontWeight:600 }}>{item.projectTitle}</td>
                    <td style={{ padding:"10px 14px",fontSize:12,color:T.sub }}>{item.title}</td>
                    <td style={{ padding:"10px 14px",fontSize:12,color:T.sub }}>{item.freelancerName}</td>
                    <td style={{ padding:"10px 14px",fontSize:13,color:"#4ade80",fontWeight:700 }}>₹{item.amount.toLocaleString("en-IN")}</td>
                    <td style={{ padding:"10px 14px",fontSize:12,color:isOverdue?"#f87171":T.sub }}>{safeFmt(item.dueDate,"dd MMM")}{isOverdue&&" ⚠️"}</td>
                    <td style={{ padding:"10px 14px" }}><span style={bs(STATUS_META[item.status].color,STATUS_META[item.status].bg)}>{STATUS_META[item.status].label}</span></td>
                    <td style={{ padding:"10px 14px" }}>
                      <button onClick={()=>{setSelected(item);setActionNote(item.notes);}} style={{ background:`${A1}15`,border:`1px solid ${A1}33`,borderRadius:6,padding:"4px 10px",cursor:"pointer",color:A1,fontSize:12,display:"flex",alignItems:"center",gap:3 }}>
                        <Eye size={12}/> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages>1&&(
          <div style={{ padding:"12px 18px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:12,color:T.sub }}>{filtered.length} milestones</span>
            <div style={{ display:"flex",gap:6 }}>
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",color:T.text,fontSize:12 }}><ChevronLeft size={13}/></button>
              <span style={{ padding:"5px 10px",fontSize:12,color:T.sub }}>{page}/{totalPages}</span>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",color:T.text,fontSize:12 }}><ChevronRight size={13}/></button>
            </div>
          </div>
        )}
      </div>

      {selected&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:themeKey==="black"?"#0f0f23":"#fff",border:`1px solid ${T.border}`,borderRadius:16,padding:28,maxWidth:480,width:"100%" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:20 }}>
              <h2 style={{ fontWeight:800,fontSize:17,color:T.text,margin:0 }}>Milestone Details</h2>
              <button onClick={()=>setSelected(null)} style={{ background:"none",border:"none",cursor:"pointer",color:T.sub }}><X size={20}/></button>
            </div>
            {[["Project",selected.projectTitle],["Milestone",selected.title],["Freelancer",selected.freelancerName],["Employer",selected.employerName],["Amount",`₹${selected.amount.toLocaleString("en-IN")}`],["Due Date",safeFmt(selected.dueDate,"dd MMM yyyy")],["Status",STATUS_META[selected.status].label],..selected.submittedAt?[["Submitted",safeFmt(selected.submittedAt,"dd MMM yyyy")]]:[]].map(([k,v])=>(
              <div key={k} style={{ display:"flex",gap:12,marginBottom:8 }}>
                <span style={{ fontSize:12,color:T.sub,width:100,flexShrink:0 }}>{k}</span>
                <span style={{ fontSize:13,color:T.text,fontWeight:600 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop:14 }}>
              <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:6 }}>Admin Notes</label>
              <textarea value={actionNote} onChange={e=>setActionNote(e.target.value)} rows={2} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,resize:"vertical",boxSizing:"border-box" as any }}/>
            </div>
            <div style={{ display:"flex",gap:8,marginTop:16,flexWrap:"wrap" }}>
              {selected.status==="submitted"&&<button onClick={()=>updateStatus(selected.id,"approved")} style={{ flex:1,background:"rgba(96,165,250,.12)",border:"1px solid rgba(96,165,250,.3)",borderRadius:8,padding:"8px",cursor:"pointer",color:"#60a5fa",fontWeight:700,fontSize:13 }}>Approve</button>}
              {selected.status==="approved"&&<button onClick={()=>updateStatus(selected.id,"paid")} style={{ flex:1,background:"rgba(74,222,128,.12)",border:"1px solid rgba(74,222,128,.3)",borderRadius:8,padding:"8px",cursor:"pointer",color:"#4ade80",fontWeight:700,fontSize:13 }}>Release Payment</button>}
              {!["paid","disputed"].includes(selected.status)&&<button onClick={()=>updateStatus(selected.id,"disputed")} style={{ flex:1,background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.3)",borderRadius:8,padding:"8px",cursor:"pointer",color:"#f87171",fontWeight:700,fontSize:13 }}>Mark Disputed</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMilestoneManagement;
