import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldAlert, Search, MessageSquare, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const A1 = "#6366f1";
const DISP_KEY = "admin_disputes_v1";

type Dispute = {
  id: string; projectId: string; projectTitle: string; freelancerName: string; employerName: string;
  amount: number; reason: string; status: "open" | "under_review" | "resolved_freelancer" | "resolved_employer" | "closed";
  createdAt: string; resolvedAt?: string; notes: string;
};

function seedDisputes(): Dispute[] {
  return [
    { id:"d1", projectId:"p1", projectTitle:"React Dashboard Development", freelancerName:"Rahul Kumar", employerName:"TechCorp India", amount:15000, reason:"Work not delivered as agreed", status:"open", createdAt:new Date(Date.now()-86400000*2).toISOString(), notes:"" },
    { id:"d2", projectId:"p2", projectTitle:"Logo Design Project", freelancerName:"Priya Sharma", employerName:"StartupX", amount:3500, reason:"Payment not released after completion", status:"under_review", createdAt:new Date(Date.now()-86400000*5).toISOString(), notes:"Admin reviewing work samples" },
    { id:"d3", projectId:"p3", projectTitle:"Content Writing - 50 Articles", freelancerName:"Amit Singh", employerName:"BlogNetwork", amount:8000, reason:"Quality of work below expectation", status:"resolved_employer", createdAt:new Date(Date.now()-86400000*10).toISOString(), resolvedAt:new Date(Date.now()-86400000*3).toISOString(), notes:"Partial refund of ₹4000 issued to employer" },
    { id:"d4", projectId:"p4", projectTitle:"Mobile App UI Design", freelancerName:"Sneha Patel", employerName:"AppVentures", amount:22000, reason:"Project cancelled mid-way by employer", status:"resolved_freelancer", createdAt:new Date(Date.now()-86400000*15).toISOString(), resolvedAt:new Date(Date.now()-86400000*7).toISOString(), notes:"Full payment released to freelancer" },
  ];
}

function load(): Dispute[] {
  try { const d = localStorage.getItem(DISP_KEY); if (d) return JSON.parse(d); } catch {}
  const s = seedDisputes(); localStorage.setItem(DISP_KEY, JSON.stringify(s)); return s;
}
function save(d: Dispute[]) { localStorage.setItem(DISP_KEY, JSON.stringify(d)); }

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open:                { label:"Open",              color:"#f87171", bg:"rgba(248,113,113,.12)" },
  under_review:        { label:"Under Review",      color:"#fbbf24", bg:"rgba(251,191,36,.12)" },
  resolved_freelancer: { label:"Resolved (Freelancer)", color:"#4ade80", bg:"rgba(74,222,128,.12)" },
  resolved_employer:   { label:"Resolved (Employer)",   color:"#60a5fa", bg:"rgba(96,165,250,.12)" },
  closed:              { label:"Closed",            color:"#94a3b8", bg:"rgba(148,163,184,.12)" },
};

const PAGE_SIZE = 8;

const AdminDisputeCenter = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [disputes, setDisputes] = useState<Dispute[]>(load);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [notes, setNotes] = useState("");

  const filtered = disputes.filter(d => {
    const q = search.toLowerCase();
    const matchQ = !q || d.projectTitle.toLowerCase().includes(q) || d.freelancerName.toLowerCase().includes(q) || d.employerName.toLowerCase().includes(q);
    const matchF = filter === "all" || d.status === filter;
    return matchQ && matchF;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const resolve = (id: string, status: Dispute["status"]) => {
    const updated = disputes.map(d => d.id === id ? { ...d, status, resolvedAt: new Date().toISOString(), notes: notes || d.notes } : d);
    setDisputes(updated); save(updated); setSelected(null); setNotes("");
    toast.success("Dispute status updated");
  };

  const sm = (status: string) => STATUS_META[status] || STATUS_META.closed;
  const bs = (c: string, bg: string) => ({ background: bg, color: c, border:`1px solid ${c}33`, borderRadius:6, padding:"2px 9px", fontSize:11, fontWeight:700 });

  const counts = { open: disputes.filter(d=>d.status==="open").length, under_review: disputes.filter(d=>d.status==="under_review").length, resolved: disputes.filter(d=>d.status.startsWith("resolved")).length };

  return (
    <div style={{ padding:"24px 16px", maxWidth:980, margin:"0 auto" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Dispute Resolution Center</h1>
        <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Mediate disputes between freelancers and employers</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"Open Disputes",   value:counts.open,        color:"#f87171" },
          { label:"Under Review",    value:counts.under_review, color:"#fbbf24" },
          { label:"Resolved",        value:counts.resolved,     color:"#4ade80" },
        ].map(s => (
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 18px", textAlign:"center" }}>
            <div style={{ fontWeight:800, fontSize:28, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:T.sub, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 12px", flex:1, minWidth:180 }}>
            <Search size={13} color={T.sub} />
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search disputes..." style={{ background:"none", border:"none", outline:"none", color:T.text, fontSize:13, flex:1 }} />
          </div>
          <select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"6px 12px", fontSize:13 }}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved_freelancer">Resolved (Freelancer)</option>
            <option value="resolved_employer">Resolved (Employer)</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {["Project","Freelancer","Employer","Amount","Status","Date","Action"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:T.sub, textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {paginated.length === 0 && <tr><td colSpan={7} style={{ padding:32, textAlign:"center", color:T.sub }}>No disputes found</td></tr>}
              {paginated.map(d => (
                <tr key={d.id} style={{ borderBottom:`1px solid ${T.border}20` }}>
                  <td style={{ padding:"11px 14px", fontSize:13, color:T.text, fontWeight:600, maxWidth:160 }}>{d.projectTitle}</td>
                  <td style={{ padding:"11px 14px", fontSize:12, color:T.sub }}>{d.freelancerName}</td>
                  <td style={{ padding:"11px 14px", fontSize:12, color:T.sub }}>{d.employerName}</td>
                  <td style={{ padding:"11px 14px", fontSize:13, color:T.text, fontWeight:600 }}>₹{d.amount.toLocaleString("en-IN")}</td>
                  <td style={{ padding:"11px 14px" }}><span style={bs(sm(d.status).color, sm(d.status).bg)}>{sm(d.status).label}</span></td>
                  <td style={{ padding:"11px 14px", fontSize:12, color:T.sub }}>{safeFmt(d.createdAt,"dd MMM")}</td>
                  <td style={{ padding:"11px 14px" }}>
                    <button onClick={()=>{setSelected(d);setNotes(d.notes);}} style={{ background:`${A1}15`, border:`1px solid ${A1}33`, borderRadius:6, padding:"4px 10px", cursor:"pointer", color:A1, fontSize:12, display:"flex", alignItems:"center", gap:3 }}>
                      <Eye size={12}/> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ padding:"12px 18px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:T.sub }}>{filtered.length} disputes</span>
            <div style={{ display:"flex", gap:6 }}>
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:6, padding:"5px 10px", cursor:"pointer", color:T.text, fontSize:12 }}><ChevronLeft size={13}/></button>
              <span style={{ padding:"5px 10px", fontSize:12, color:T.sub }}>{page}/{totalPages}</span>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:6, padding:"5px 10px", cursor:"pointer", color:T.text, fontSize:12 }}><ChevronRight size={13}/></button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background: themeKey==="black" ? "#0f0f23" : "#fff", border:`1px solid ${T.border}`, borderRadius:16, padding:28, maxWidth:520, width:"100%", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontWeight:800, fontSize:17, color:T.text, margin:0 }}>Dispute Details</h2>
              <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", cursor:"pointer", color:T.sub }}><XCircle size={20}/></button>
            </div>
            {[
              ["Project", selected.projectTitle],
              ["Freelancer", selected.freelancerName],
              ["Employer", selected.employerName],
              ["Amount", `₹${selected.amount.toLocaleString("en-IN")}`],
              ["Reason", selected.reason],
              ["Status", sm(selected.status).label],
              ["Opened", safeFmt(selected.createdAt, "dd MMM yyyy")],
              ...(selected.resolvedAt ? [["Resolved", safeFmt(selected.resolvedAt, "dd MMM yyyy")]] : []),
            ].map(([k, v]) => (
              <div key={k} style={{ display:"flex", gap:12, marginBottom:10 }}>
                <span style={{ fontSize:12, color:T.sub, width:90, flexShrink:0 }}>{k}</span>
                <span style={{ fontSize:13, color:T.text, fontWeight:600 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop:16 }}>
              <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:6 }}>Admin Notes</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Add resolution notes..." style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, resize:"vertical", boxSizing:"border-box" }} />
            </div>
            {!selected.status.startsWith("resolved") && selected.status !== "closed" && (
              <div style={{ display:"flex", gap:8, marginTop:16, flexWrap:"wrap" }}>
                <button onClick={()=>resolve(selected.id,"under_review")} style={{ flex:1, background:"rgba(251,191,36,.12)", border:"1px solid rgba(251,191,36,.3)", borderRadius:8, padding:"8px 14px", cursor:"pointer", color:"#fbbf24", fontWeight:700, fontSize:13 }}>Mark Under Review</button>
                <button onClick={()=>resolve(selected.id,"resolved_freelancer")} style={{ flex:1, background:"rgba(74,222,128,.12)", border:"1px solid rgba(74,222,128,.3)", borderRadius:8, padding:"8px 14px", cursor:"pointer", color:"#4ade80", fontWeight:700, fontSize:13 }}>Favour Freelancer</button>
                <button onClick={()=>resolve(selected.id,"resolved_employer")} style={{ flex:1, background:"rgba(96,165,250,.12)", border:"1px solid rgba(96,165,250,.3)", borderRadius:8, padding:"8px 14px", cursor:"pointer", color:"#60a5fa", fontWeight:700, fontSize:13 }}>Favour Employer</button>
                <button onClick={()=>resolve(selected.id,"closed")} style={{ flex:1, background:"rgba(148,163,184,.12)", border:"1px solid rgba(148,163,184,.3)", borderRadius:8, padding:"8px 14px", cursor:"pointer", color:"#94a3b8", fontWeight:700, fontSize:13 }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputeCenter;
