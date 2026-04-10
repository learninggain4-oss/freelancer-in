import { useState } from "react";
import { toast } from "sonner";
import { Tag, Plus, Edit2, Trash2, X, Save, Layers, Code2, ChevronDown, ChevronRight, Hash } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const A1 = "#6366f1";
const CAT_KEY = "admin_categories_v1";
const SKILL_KEY = "admin_skills_v1";

type Category = { id:string; name:string; icon:string; color:string; description:string; active:boolean; skillCount?:number };
type Skill = { id:string; name:string; categoryId:string; active:boolean };

const COLORS = ["#6366f1","#8b5cf6","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#f97316","#14b8a6","#84cc16"];

function seedCats():Category[] {
  return [
    {id:"c1",name:"Web Development",icon:"💻",color:"#6366f1",description:"Frontend, backend, full-stack development",active:true},
    {id:"c2",name:"Mobile App Development",icon:"📱",color:"#8b5cf6",description:"iOS, Android, React Native, Flutter",active:true},
    {id:"c3",name:"UI/UX Design",icon:"🎨",color:"#ec4899",description:"User interface and experience design",active:true},
    {id:"c4",name:"Graphic Design",icon:"✏️",color:"#f97316",description:"Logos, branding, illustrations",active:true},
    {id:"c5",name:"Content Writing",icon:"📝",color:"#10b981",description:"Articles, blogs, copywriting",active:true},
    {id:"c6",name:"Digital Marketing",icon:"📊",color:"#f59e0b",description:"SEO, social media, ads",active:true},
    {id:"c7",name:"Video Editing",icon:"🎬",color:"#ef4444",description:"Video production and editing",active:true},
    {id:"c8",name:"Data Entry",icon:"⌨️",color:"#3b82f6",description:"Data processing and entry tasks",active:true},
    {id:"c9",name:"Accounting & Finance",icon:"💰",color:"#14b8a6",description:"Bookkeeping, GST, tax filing",active:true},
    {id:"c10",name:"Photography",icon:"📷",color:"#84cc16",description:"Product, event, portrait photography",active:true},
  ];
}

function seedSkills():Skill[] {
  return [
    {id:"s1",name:"React.js",categoryId:"c1",active:true},{id:"s2",name:"Vue.js",categoryId:"c1",active:true},{id:"s3",name:"Node.js",categoryId:"c1",active:true},
    {id:"s4",name:"Python",categoryId:"c1",active:true},{id:"s5",name:"PHP",categoryId:"c1",active:true},{id:"s6",name:"WordPress",categoryId:"c1",active:true},
    {id:"s7",name:"React Native",categoryId:"c2",active:true},{id:"s8",name:"Flutter",categoryId:"c2",active:true},{id:"s9",name:"Swift",categoryId:"c2",active:true},
    {id:"s10",name:"Kotlin",categoryId:"c2",active:true},{id:"s11",name:"Figma",categoryId:"c3",active:true},{id:"s12",name:"Adobe XD",categoryId:"c3",active:true},
    {id:"s13",name:"Sketch",categoryId:"c3",active:true},{id:"s14",name:"Photoshop",categoryId:"c4",active:true},{id:"s15",name:"Illustrator",categoryId:"c4",active:true},
    {id:"s16",name:"Canva",categoryId:"c4",active:true},{id:"s17",name:"SEO Writing",categoryId:"c5",active:true},{id:"s18",name:"Copywriting",categoryId:"c5",active:true},
    {id:"s19",name:"Technical Writing",categoryId:"c5",active:true},{id:"s20",name:"Google Ads",categoryId:"c6",active:true},{id:"s21",name:"Facebook Ads",categoryId:"c6",active:true},
    {id:"s22",name:"Instagram Marketing",categoryId:"c6",active:true},{id:"s23",name:"Premiere Pro",categoryId:"c7",active:true},{id:"s24",name:"After Effects",categoryId:"c7",active:true},
    {id:"s25",name:"Excel",categoryId:"c8",active:true},{id:"s26",name:"Tally",categoryId:"c9",active:true},{id:"s27",name:"GST Filing",categoryId:"c9",active:true},
  ];
}

function loadCats():Category[] { try{const d=localStorage.getItem(CAT_KEY);if(d)return JSON.parse(d);}catch{}const s=seedCats();localStorage.setItem(CAT_KEY,JSON.stringify(s));return s; }
function loadSkills():Skill[] { try{const d=localStorage.getItem(SKILL_KEY);if(d)return JSON.parse(d);}catch{}const s=seedSkills();localStorage.setItem(SKILL_KEY,JSON.stringify(s));return s; }
function saveCats(c:Category[]){localStorage.setItem(CAT_KEY,JSON.stringify(c));}
function saveSkills(s:Skill[]){localStorage.setItem(SKILL_KEY,JSON.stringify(s));}

const blankCat=():Omit<Category,"id">=>({name:"",icon:"🏷️",color:"#6366f1",description:"",active:true});

const AdminSkillCategoryManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [cats, setCats] = useState<Category[]>(loadCats);
  const [skills, setSkills] = useState<Skill[]>(loadSkills);
  const [expanded, setExpanded] = useState<string|null>("c1");
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCatId, setEditCatId] = useState<string|null>(null);
  const [catForm, setCatForm] = useState<Omit<Category,"id">>(blankCat());
  const [newSkillCatId, setNewSkillCatId] = useState<string|null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [editSkillId, setEditSkillId] = useState<string|null>(null);
  const [editSkillName, setEditSkillName] = useState("");
  const cf = (k:any,v:any)=>setCatForm(p=>({...p,[k]:v}));

  const openAddCat = () => { setCatForm(blankCat()); setEditCatId(null); setShowCatForm(true); };
  const openEditCat = (c:Category) => { setCatForm({name:c.name,icon:c.icon,color:c.color,description:c.description,active:c.active}); setEditCatId(c.id); setShowCatForm(true); };

  const submitCat = () => {
    if(!catForm.name.trim()) return toast.error("Category name required");
    if(editCatId) {
      const up=cats.map(c=>c.id===editCatId?{...c,...catForm}:c); setCats(up); saveCats(up); toast.success("Category updated");
    } else {
      const nc:Category={...catForm,id:`c${Date.now()}`}; const up=[...cats,nc]; setCats(up); saveCats(up); toast.success("Category created");
    }
    setShowCatForm(false); setEditCatId(null);
  };

  const delCat = (id:string) => {
    if(skills.some(s=>s.categoryId===id)) return toast.error("Delete skills in this category first");
    const up=cats.filter(c=>c.id!==id); setCats(up); saveCats(up); toast.success("Category deleted");
  };

  const toggleCat = (id:string) => { const up=cats.map(c=>c.id===id?{...c,active:!c.active}:c); setCats(up); saveCats(up); };

  const addSkill = (catId:string) => {
    if(!newSkillName.trim()) return toast.error("Skill name required");
    const ns:Skill={id:`s${Date.now()}`,name:newSkillName.trim(),categoryId:catId,active:true};
    const up=[...skills,ns]; setSkills(up); saveSkills(up); setNewSkillName(""); setNewSkillCatId(null); toast.success("Skill added");
  };

  const delSkill = (id:string) => { const up=skills.filter(s=>s.id!==id); setSkills(up); saveSkills(up); };
  const toggleSkill = (id:string) => { const up=skills.map(s=>s.id===id?{...s,active:!s.active}:s); setSkills(up); saveSkills(up); };

  const saveSkillEdit = (id:string) => {
    const up=skills.map(s=>s.id===id?{...s,name:editSkillName}:s); setSkills(up); saveSkills(up); setEditSkillId(null); toast.success("Skill updated");
  };

  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});

  return (
    <div style={{ padding:"24px 16px", maxWidth:900, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Skill & Category Management</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Manage job categories and skill tags for the platform</p>
        </div>
        <button onClick={openAddCat} style={{ background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <Plus size={14}/> New Category
        </button>
      </div>

      <div style={{ display:"flex", gap:14, marginBottom:18, flexWrap:"wrap" }}>
        {[
          {label:"Total Categories",value:cats.length,color:"#6366f1"},
          {label:"Active Categories",value:cats.filter(c=>c.active).length,color:"#4ade80"},
          {label:"Total Skills",value:skills.length,color:"#f59e0b"},
          {label:"Active Skills",value:skills.filter(s=>s.active).length,color:"#60a5fa"},
        ].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 18px", flex:1, minWidth:130, textAlign:"center" }}>
            <div style={{ fontWeight:800, fontSize:22, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:T.sub }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {cats.map(cat => {
          const catSkills = skills.filter(s=>s.categoryId===cat.id);
          const isOpen = expanded===cat.id;
          return (
            <div key={cat.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }} onClick={()=>setExpanded(isOpen?null:cat.id)}>
                <div style={{ width:36,height:36,borderRadius:10,background:`${cat.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>
                  {cat.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontWeight:800, fontSize:14, color:T.text }}>{cat.name}</span>
                    <span style={bs(cat.active?"#4ade80":"#f87171",cat.active?"rgba(74,222,128,.12)":"rgba(248,113,113,.12)")}>{cat.active?"Active":"Inactive"}</span>
                    <span style={bs(cat.color,`${cat.color}15`)}>{catSkills.length} skills</span>
                  </div>
                  <div style={{ fontSize:12, color:T.sub, marginTop:2 }}>{cat.description}</div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={e=>{e.stopPropagation();openEditCat(cat);}} style={{ background:`${A1}15`,border:`1px solid ${A1}33`,borderRadius:6,padding:"4px 9px",cursor:"pointer",color:A1,fontSize:11,display:"flex",alignItems:"center",gap:3 }}><Edit2 size={11}/></button>
                  <button onClick={e=>{e.stopPropagation();toggleCat(cat.id);}} style={{ background:cat.active?"rgba(248,113,113,.1)":"rgba(74,222,128,.1)",border:`1px solid ${cat.active?"rgba(248,113,113,.3)":"rgba(74,222,128,.3)"}`,borderRadius:6,padding:"4px 9px",cursor:"pointer",color:cat.active?"#f87171":"#4ade80",fontSize:11 }}>{cat.active?"Off":"On"}</button>
                  <button onClick={e=>{e.stopPropagation();delCat(cat.id);}} style={{ background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:6,padding:"4px 9px",cursor:"pointer",color:"#f87171" }}><Trash2 size={11}/></button>
                  {isOpen?<ChevronDown size={16} color={T.sub}/>:<ChevronRight size={16} color={T.sub}/>}
                </div>
              </div>

              {isOpen && (
                <div style={{ padding:"0 18px 18px", borderTop:`1px solid ${T.border}20` }}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, paddingTop:14 }}>
                    {catSkills.map(sk=>(
                      <div key={sk.id} style={{ display:"flex", alignItems:"center", gap:6, background:sk.active?`${cat.color}15`:"rgba(148,163,184,.1)", border:`1px solid ${sk.active?cat.color+"33":"rgba(148,163,184,.2)"}`, borderRadius:8, padding:"5px 10px" }}>
                        {editSkillId===sk.id
                          ? <>
                              <input value={editSkillName} onChange={e=>setEditSkillName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveSkillEdit(sk.id)} style={{ background:"none",border:"none",outline:"none",color:T.text,fontSize:12,width:100 }} autoFocus/>
                              <button onClick={()=>saveSkillEdit(sk.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#4ade80" }}><Save size={11}/></button>
                              <button onClick={()=>setEditSkillId(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"#f87171" }}><X size={11}/></button>
                            </>
                          : <>
                              <Hash size={10} color={sk.active?cat.color:T.sub}/>
                              <span style={{ fontSize:12,fontWeight:600,color:sk.active?T.text:T.sub }}>{sk.name}</span>
                              <button onClick={()=>{setEditSkillId(sk.id);setEditSkillName(sk.name);}} style={{ background:"none",border:"none",cursor:"pointer",color:T.sub,padding:0 }}><Edit2 size={10}/></button>
                              <button onClick={()=>toggleSkill(sk.id)} style={{ background:"none",border:"none",cursor:"pointer",color:sk.active?"#f87171":"#4ade80",padding:0,fontSize:9 }}>{sk.active?"✕":"✓"}</button>
                              <button onClick={()=>delSkill(sk.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0 }}><Trash2 size={10}/></button>
                            </>
                        }
                      </div>
                    ))}
                    {newSkillCatId===cat.id
                      ? <div style={{ display:"flex",alignItems:"center",gap:6,background:`${A1}10`,border:`1px solid ${A1}33`,borderRadius:8,padding:"5px 10px" }}>
                          <input value={newSkillName} onChange={e=>setNewSkillName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSkill(cat.id)} placeholder="Skill name..." style={{ background:"none",border:"none",outline:"none",color:T.text,fontSize:12,width:120 }} autoFocus/>
                          <button onClick={()=>addSkill(cat.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#4ade80" }}><Save size={11}/></button>
                          <button onClick={()=>{setNewSkillCatId(null);setNewSkillName("");}} style={{ background:"none",border:"none",cursor:"pointer",color:"#f87171" }}><X size={11}/></button>
                        </div>
                      : <button onClick={()=>setNewSkillCatId(cat.id)} style={{ display:"flex",alignItems:"center",gap:5,background:`${A1}10`,border:`1px dashed ${A1}44`,borderRadius:8,padding:"5px 12px",cursor:"pointer",color:A1,fontSize:12,fontWeight:600 }}>
                          <Plus size={11}/> Add Skill
                        </button>
                    }
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showCatForm && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:themeKey==="black"?"#0f0f23":"#fff",border:`1px solid ${T.border}`,borderRadius:16,padding:28,maxWidth:440,width:"100%" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:20 }}>
              <h2 style={{ fontWeight:800,fontSize:17,color:T.text,margin:0 }}>{editCatId?"Edit Category":"New Category"}</h2>
              <button onClick={()=>setShowCatForm(false)} style={{ background:"none",border:"none",cursor:"pointer",color:T.sub }}><X size={20}/></button>
            </div>
            {[{l:"Category Name",k:"name",t:"text"},{l:"Icon (emoji)",k:"icon",t:"text"},{l:"Description",k:"description",t:"text"}].map(fi=>(
              <div key={fi.k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:5 }}>{fi.l}</label>
                <input type={fi.t} value={(catForm as any)[fi.k]} onChange={e=>cf(fi.k,e.target.value)} style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,boxSizing:"border-box" as any }}/>
              </div>
            ))}
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:6 }}>Color</label>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {COLORS.map(c=><button key={c} onClick={()=>cf("color",c)} style={{ width:28,height:28,borderRadius:6,background:c,border:`3px solid ${catForm.color===c?"#fff":"transparent"}`,cursor:"pointer",outline:catForm.color===c?`2px solid ${c}`:"none" }}/>)}
              </div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setShowCatForm(false)} style={{ flex:1,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px",cursor:"pointer",color:T.text,fontWeight:600 }}>Cancel</button>
              <button onClick={submitCat} style={{ flex:2,background:`linear-gradient(135deg,${A1},#8b5cf6)`,border:"none",borderRadius:8,padding:"9px",cursor:"pointer",color:"#fff",fontWeight:700 }}>{editCatId?"Save Changes":"Create Category"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSkillCategoryManagement;
