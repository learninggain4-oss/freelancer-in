import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Shield, FileText, CheckCircle2, AlertTriangle, Download, RefreshCw } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const checks = [
  { area:"Privacy Policy", status:"Compliant", lastReview:"Mar 2026", law:"IT Act 2000 / PDPB 2023" },
  { area:"User Data Consent", status:"Compliant", lastReview:"Feb 2026", law:"PDPB 2023" },
  { area:"Data Retention Policy", status:"Compliant", lastReview:"Jan 2026", law:"IT Act / RBI Guidelines" },
  { area:"Right to Erasure", status:"Partial", lastReview:"Mar 2026", law:"PDPB 2023" },
  { area:"Data Portability", status:"Partial", lastReview:"Nov 2025", law:"PDPB 2023" },
  { area:"Cookie Policy", status:"Compliant", lastReview:"Mar 2026", law:"IT Act 2000" },
  { area:"Third-party Data Sharing", status:"Compliant", lastReview:"Feb 2026", law:"PDPB 2023" },
  { area:"Breach Notification (72hr)", status:"Compliant", lastReview:"Dec 2025", law:"CERT-In 2022" },
  { area:"GSTIN Data Storage", status:"Compliant", lastReview:"Jan 2026", law:"GST Act 2017" },
  { area:"PAN Data Handling", status:"Compliant", lastReview:"Mar 2026", law:"Income Tax Act" },
];

const requests = [
  { id:"DR001", user:"user_4821", type:"Data Export", submitted:"2 days ago", status:"Pending" },
  { id:"DR002", user:"user_2210", type:"Account Deletion", submitted:"5 days ago", status:"Completed" },
  { id:"DR003", user:"user_9900", type:"Data Correction", submitted:"1 day ago", status:"In Review" },
];

export default function AdminGdprCompliance() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [tab, setTab] = useState<"checks"|"requests"|"audit">("checks");

  const compliant = checks.filter(c=>c.status==="Compliant").length;
  const partial = checks.filter(c=>c.status==="Partial").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>GDPR / IT Act Compliance</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Monitor compliance with India's IT Act, PDPB 2023, CERT-In, GST, and other data protection regulations.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Fully Compliant", value:`${compliant}/${checks.length}`, color:"#4ade80", icon:CheckCircle2 },
          { label:"Partial Compliance", value:`${partial}`, color:"#fbbf24", icon:AlertTriangle },
          { label:"Pending Requests", value:"1", color:"#60a5fa", icon:FileText },
          { label:"Overall Score", value:`${Math.round(compliant/checks.length*100)}%`, color:"#a78bfa", icon:Shield },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div>
                <p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor:T.border }}>
        {(["checks","requests","audit"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color:tab===t?A1:T.sub, borderBottom:tab===t?`2px solid ${A1}`:"2px solid transparent" }}>
            {t==="checks"?"Compliance Checks":t==="requests"?"User Requests":"Audit Log"}
          </button>
        ))}
      </div>

      {tab==="checks" && (
        <div className="space-y-3">
          {checks.map((c,i) => (
            <div key={i} className="rounded-2xl border p-4" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-sm" style={{ color:T.text }}>{c.area}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:c.status==="Compliant"?"rgba(74,222,128,.12)":"rgba(251,191,36,.12)", color:c.status==="Compliant"?"#4ade80":"#fbbf24" }}>{c.status}</span>
                  </div>
                  <p className="text-xs" style={{ color:T.sub }}>Law: {c.law} · Last review: {c.lastReview}</p>
                </div>
                <button className="px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0" style={{ borderColor:T.border, color:T.sub }}>
                  <RefreshCw className="h-3 w-3 inline mr-1" />Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="requests" && (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs" style={{ color:T.sub }}>{r.id}</span>
                    <span className="font-bold text-sm" style={{ color:T.text }}>{r.type}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:r.status==="Completed"?"rgba(74,222,128,.12)":r.status==="Pending"?"rgba(251,191,36,.12)":"rgba(96,165,250,.12)", color:r.status==="Completed"?"#4ade80":r.status==="Pending"?"#fbbf24":"#60a5fa" }}>{r.status}</span>
                  </div>
                  <p className="text-xs" style={{ color:T.sub }}>{r.user} · Submitted {r.submitted}</p>
                </div>
                <div className="flex gap-2">
                  {r.status!=="Completed" && <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(74,222,128,.12)", color:"#4ade80" }}>Process</button>}
                  <button className="p-1.5 rounded-xl border" style={{ borderColor:T.border, color:A1 }}><Download className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="audit" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
          <div className="divide-y" style={{ borderColor:T.border }}>
            {[
              { time:"Today 9:14 AM", event:"Privacy Policy updated (v3.2)", actor:"Admin: super@freelan.space" },
              { time:"Yesterday", event:"User DR002 data deletion completed", actor:"System" },
              { time:"Mar 28", event:"Quarterly compliance review completed", actor:"Admin: super@freelan.space" },
              { time:"Mar 20", event:"New CERT-In breach notification protocol activated", actor:"Admin" },
              { time:"Mar 15", event:"Cookie consent UI updated for PDPB compliance", actor:"Admin" },
            ].map((l,i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color:T.text }}>{l.event}</span>
                  <span className="text-xs shrink-0 ml-4" style={{ color:T.sub }}>{l.time}</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color:T.sub }}>{l.actor}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
