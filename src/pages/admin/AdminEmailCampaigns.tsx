import { useState } from "react";
import { toast } from "sonner";
import { Mail, Plus, Edit2, Trash2, X, Send, Clock, Users, CheckCircle2, Calendar } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";
import { format, addDays } from "date-fns";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1="#6366f1";
const CAMP_KEY="admin_campaigns_v1";
const TMPL_KEY="admin_email_templates_v1";

type Campaign={id:string;name:string;templateId:string;target:"all"|"freelancer"|"employer";status:"draft"|"scheduled"|"sent";scheduledAt:string;sentAt?:string;recipientCount:number;openRate:number;createdAt:string};
type Template={id:string;name:string;subject:string;body:string;createdAt:string};

function seedCampaigns():Campaign[]{return[
  {id:"c1",name:"Welcome New Freelancers",templateId:"t1",target:"freelancer",status:"sent",scheduledAt:new Date(Date.now()-86400000*10).toISOString(),sentAt:new Date(Date.now()-86400000*10).toISOString(),recipientCount:342,openRate:68,createdAt:new Date(Date.now()-86400000*12).toISOString()},
  {id:"c2",name:"Feature Announcement",templateId:"t2",target:"all",status:"scheduled",scheduledAt:new Date(Date.now()+86400000*2).toISOString(),recipientCount:1250,openRate:0,createdAt:new Date(Date.now()-86400000*1).toISOString()},
  {id:"c3",name:"Employer Onboarding",templateId:"t3",target:"employer",status:"draft",scheduledAt:"",recipientCount:0,openRate:0,createdAt:new Date(Date.now()-86400000*3).toISOString()},
];}
function seedTemplates():Template[]{return[
  {id:"t1",name:"Welcome Email",subject:"Welcome to FreeLan.space! 🎉",body:"Hi {{name}},\n\nWelcome to FreeLan.space — India's premier freelancer platform!\n\nStart exploring jobs and build your freelance career today.\n\nBest,\nTeam FreeLan",createdAt:new Date().toISOString()},
  {id:"t2",name:"Feature Announcement",subject:"New Features Just Landed on FreeLan.space 🚀",body:"Hi {{name}},\n\nWe've just launched exciting new features:\n• Real-time notifications\n• Improved job matching\n• Faster payments\n\nLogin to check them out!\n\nTeam FreeLan",createdAt:new Date().toISOString()},
  {id:"t3",name:"Employer Onboarding",subject:"Ready to Hire Top Freelancers? Get Started! 💼",body:"Hi {{name}},\n\nThank you for joining as an employer on FreeLan.space!\n\nPost your first job today and connect with thousands of skilled freelancers.\n\nTeam FreeLan",createdAt:new Date().toISOString()},
];}

function loadCampaigns():Campaign[]{try{const d=localStorage.getItem(CAMP_KEY);if(d)return JSON.parse(d);}catch{}const s=seedCampaigns();localStorage.setItem(CAMP_KEY,JSON.stringify(s));return s;}
function loadTemplates():Template[]{try{const d=localStorage.getItem(TMPL_KEY);if(d)return JSON.parse(d);}catch{}const s=seedTemplates();localStorage.setItem(TMPL_KEY,JSON.stringify(s));return s;}
function saveCampaigns(c:Campaign[]){localStorage.setItem(CAMP_KEY,JSON.stringify(c));}
function saveTemplates(t:Template[]){localStorage.setItem(TMPL_KEY,JSON.stringify(t));}

const blankCampaign=():Omit<Campaign,"id"|"sentAt"|"recipientCount"|"openRate"|"createdAt">=>({name:"",templateId:"",target:"all",status:"draft",scheduledAt:""});
const blankTemplate=():Omit<Template,"id"|"createdAt">=>({name:"",subject:"",body:""});

const AdminEmailCampaigns = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [campaigns, setCampaigns] = useState<Campaign[]>(loadCampaigns);
  const [templates, setTemplates] = useState<Template[]>(loadTemplates);
  const [tab, setTab] = useState<"campaigns"|"templates">("campaigns");
  const [showCampForm, setShowCampForm] = useState(false);
  const [showTmplForm, setShowTmplForm] = useState(false);
  const [editCampId, setEditCampId] = useState<string|null>(null);
  const [editTmplId, setEditTmplId] = useState<string|null>(null);
  const [campForm, setCampForm] = useState<ReturnType<typeof blankCampaign>>(blankCampaign());
  const [tmplForm, setTmplForm] = useState<ReturnType<typeof blankTemplate>>(blankTemplate());

  const submitCampaign=()=>{
    if(!campForm.name.trim())return toast.error("Campaign name required");
    if(editCampId){const up=campaigns.map(c=>c.id===editCampId?{...c,...campForm}:c);setCampaigns(up);saveCampaigns(up);toast.success("Campaign updated");}
    else{const nc:Campaign={...campForm,id:`c${Date.now()}`,recipientCount:0,openRate:0,createdAt:new Date().toISOString()};const up=[...campaigns,nc];setCampaigns(up);saveCampaigns(up);toast.success("Campaign created");}
    setShowCampForm(false);setEditCampId(null);
  };

  const submitTemplate=()=>{
    if(!tmplForm.name.trim()||!tmplForm.subject.trim())return toast.error("Fill name and subject");
    if(editTmplId){const up=templates.map(t=>t.id===editTmplId?{...t,...tmplForm}:t);setTemplates(up);saveTemplates(up);toast.success("Template updated");}
    else{const nt:Template={...tmplForm,id:`t${Date.now()}`,createdAt:new Date().toISOString()};const up=[...templates,nt];setTemplates(up);saveTemplates(up);toast.success("Template created");}
    setShowTmplForm(false);setEditTmplId(null);
  };

  const sendNow=(id:string)=>{const up=campaigns.map(c=>c.id===id?{...c,status:"sent" as any,sentAt:new Date().toISOString(),recipientCount:Math.floor(Math.random()*1000)+100,openRate:Math.floor(Math.random()*40)+30}:c);setCampaigns(up);saveCampaigns(up);toast.success("Campaign sent!");};
  const delCampaign=(id:string)=>{const up=campaigns.filter(c=>c.id!==id);setCampaigns(up);saveCampaigns(up);};
  const delTemplate=(id:string)=>{const up=templates.filter(t=>t.id!==id);setTemplates(up);saveTemplates(up);};

  const STATUS_META:Record<string,{label:string;color:string;bg:string}>={draft:{label:"Draft",color:"#94a3b8",bg:"rgba(148,163,184,.12)"},scheduled:{label:"Scheduled",color:"#fbbf24",bg:"rgba(251,191,36,.12)"},sent:{label:"Sent",color:"#4ade80",bg:"rgba(74,222,128,.12)"}};
  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});

  return (
    <div style={{ padding:"24px 16px", maxWidth:980, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Email Campaigns</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Create and manage bulk email campaigns and templates</p>
        </div>
        <button onClick={()=>{if(tab==="campaigns"){setCampForm(blankCampaign());setEditCampId(null);setShowCampForm(true);}else{setTmplForm(blankTemplate());setEditTmplId(null);setShowTmplForm(true);}}} style={{ background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <Plus size={14}/> New {tab==="campaigns"?"Campaign":"Template"}
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {[{l:"Total Campaigns",v:campaigns.length,c:"#6366f1"},{l:"Sent",v:campaigns.filter(c=>c.status==="sent").length,c:"#4ade80"},{l:"Scheduled",v:campaigns.filter(c=>c.status==="scheduled").length,c:"#fbbf24"},{l:"Templates",v:templates.length,c:"#8b5cf6"}].map(s=>(
          <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px",textAlign:"center" }}>
            <div style={{ fontWeight:800,fontSize:22,color:s.c }}>{s.v}</div>
            <div style={{ fontSize:11,color:T.sub,marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex",gap:0,marginBottom:18,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden",width:"fit-content" }}>
        {(["campaigns","templates"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"9px 20px",border:"none",cursor:"pointer",background:tab===t?A1:"transparent",color:tab===t?"#fff":T.sub,fontWeight:tab===t?700:500,fontSize:13,textTransform:"capitalize" }}>{t}</button>
        ))}
      </div>

      {tab==="campaigns"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {campaigns.map(c=>{
            const tmpl=templates.find(t=>t.id===c.templateId);
            return (
              <div key={c.id} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px 20px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:8 }}>
                  <div>
                    <div style={{ fontWeight:800,fontSize:15,color:T.text,marginBottom:4 }}>{c.name}</div>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                      <span style={bs(STATUS_META[c.status].color,STATUS_META[c.status].bg)}>{STATUS_META[c.status].label}</span>
                      <span style={bs("#6366f1","rgba(99,102,241,.12)")}>{c.target==="all"?"Everyone":c.target==="freelancer"?"Freelancers":"Employers"}</span>
                      {tmpl&&<span style={{ fontSize:11,color:T.sub }}>Template: {tmpl.name}</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:6 }}>
                    {c.status==="draft"&&<button onClick={()=>sendNow(c.id)} style={{ background:"rgba(74,222,128,.12)",border:"1px solid rgba(74,222,128,.3)",borderRadius:7,padding:"6px 12px",cursor:"pointer",color:"#4ade80",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:4 }}><Send size={11}/> Send Now</button>}
                    <button onClick={()=>delCampaign(c.id)} style={{ background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#f87171" }}><Trash2 size={12}/></button>
                  </div>
                </div>
                <div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>
                  {c.scheduledAt&&<div style={{ fontSize:12,color:T.sub }}><Calendar size={11} style={{ display:"inline",marginRight:4 }}/>{safeFmt(c.scheduledAt,"dd MMM yyyy HH:mm")}</div>}
                  {c.status==="sent"&&<><div style={{ fontSize:12,color:T.sub }}><Users size={11} style={{ display:"inline",marginRight:4 }}/>{c.recipientCount} recipients</div><div style={{ fontSize:12,color:"#4ade80",fontWeight:700 }}>📬 {c.openRate}% open rate</div></>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab==="templates"&&(
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16 }}>
          {templates.map(t=>(
            <div key={t.id} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:18 }}>
              <div style={{ fontWeight:800,fontSize:14,color:T.text,marginBottom:4 }}>{t.name}</div>
              <div style={{ fontSize:12,color:A1,fontWeight:600,marginBottom:8 }}>{t.subject}</div>
              <div style={{ fontSize:11,color:T.sub,lineHeight:1.6,marginBottom:14,whiteSpace:"pre-line",maxHeight:80,overflow:"hidden" }}>{t.body}</div>
              <div style={{ display:"flex",gap:6 }}>
                <button onClick={()=>{setTmplForm({name:t.name,subject:t.subject,body:t.body});setEditTmplId(t.id);setShowTmplForm(true);}} style={{ flex:1,background:`${A1}15`,border:`1px solid ${A1}33`,borderRadius:7,padding:"6px",cursor:"pointer",color:A1,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:3 }}><Edit2 size={11}/> Edit</button>
                <button onClick={()=>delTemplate(t.id)} style={{ background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#f87171" }}><Trash2 size={12}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCampForm&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:themeKey==="black"?"#0f0f23":"#fff",border:`1px solid ${T.border}`,borderRadius:16,padding:28,maxWidth:440,width:"100%" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:20 }}>
              <h2 style={{ fontWeight:800,fontSize:17,color:T.text,margin:0 }}>New Campaign</h2>
              <button onClick={()=>setShowCampForm(false)} style={{ background:"none",border:"none",cursor:"pointer",color:T.sub }}><X size={20}/></button>
            </div>
            {[{l:"Campaign Name",k:"name",t:"text"},{l:"Scheduled At",k:"scheduledAt",t:"datetime-local"}].map(fi=>(
              <div key={fi.k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:5 }}>{fi.l}</label>
                <input type={fi.t} value={(campForm as any)[fi.k]} onChange={e=>setCampForm(p=>({...p,[fi.k]:e.target.value}))} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,boxSizing:"border-box" as any }}/>
              </div>
            ))}
            {[{l:"Target Audience",k:"target",opts:[{v:"all",t:"Everyone"},{v:"freelancer",t:"Freelancers Only"},{v:"employer",t:"Employers Only"}]},{l:"Template",k:"templateId",opts:[{v:"",t:"-- Select Template --"},...templates.map(t=>({v:t.id,t:t.name}))]}].map(se=>(
              <div key={se.k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:5 }}>{se.l}</label>
                <select value={(campForm as any)[se.k]} onChange={e=>setCampForm(p=>({...p,[se.k]:e.target.value}))} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13 }}>
                  {se.opts.map(o=><option key={o.v} value={o.v}>{o.t}</option>)}
                </select>
              </div>
            ))}
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setShowCampForm(false)} style={{ flex:1,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px",cursor:"pointer",color:T.text,fontWeight:600 }}>Cancel</button>
              <button onClick={submitCampaign} style={{ flex:2,background:`linear-gradient(135deg,${A1},#8b5cf6)`,border:"none",borderRadius:8,padding:"9px",cursor:"pointer",color:"#fff",fontWeight:700 }}>Create Campaign</button>
            </div>
          </div>
        </div>
      )}

      {showTmplForm&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:themeKey==="black"?"#0f0f23":"#fff",border:`1px solid ${T.border}`,borderRadius:16,padding:28,maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:20 }}>
              <h2 style={{ fontWeight:800,fontSize:17,color:T.text,margin:0 }}>{editTmplId?"Edit Template":"New Template"}</h2>
              <button onClick={()=>setShowTmplForm(false)} style={{ background:"none",border:"none",cursor:"pointer",color:T.sub }}><X size={20}/></button>
            </div>
            {[{l:"Template Name",k:"name"},{l:"Email Subject",k:"subject"}].map(fi=>(
              <div key={fi.k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:5 }}>{fi.l}</label>
                <input value={(tmplForm as any)[fi.k]} onChange={e=>setTmplForm(p=>({...p,[fi.k]:e.target.value}))} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,boxSizing:"border-box" as any }}/>
              </div>
            ))}
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:5 }}>Email Body <span style={{ fontSize:10 }}>(use {"{{name}}"} for personalization)</span></label>
              <textarea value={tmplForm.body} onChange={e=>setTmplForm(p=>({...p,body:e.target.value}))} rows={8} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,resize:"vertical",boxSizing:"border-box" as any }}/>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setShowTmplForm(false)} style={{ flex:1,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px",cursor:"pointer",color:T.text,fontWeight:600 }}>Cancel</button>
              <button onClick={submitTemplate} style={{ flex:2,background:`linear-gradient(135deg,${A1},#8b5cf6)`,border:"none",borderRadius:8,padding:"9px",cursor:"pointer",color:"#fff",fontWeight:700 }}>{editTmplId?"Save":"Create Template"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailCampaigns;
