import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Code, Palette, PenTool, BarChart3, Camera, Music, Globe,
  Megaphone, FileText, Wrench, GraduationCap, Heart, Headphones,
  ShoppingCart, Cpu, BookOpen, Smartphone, TrendingUp, Layers, Search,
  Printer, Database, Shield, Monitor, Mic, MapPin, Scissors, Truck,
  Landmark, Stethoscope, Scale, Leaf, Gamepad2, Plane, Baby, Dog,
  Gem, Bike, Utensils, Lightbulb, Briefcase, Users, X, Sparkles,
} from "lucide-react";

const categories = [
  { icon: Code,          label: "Web Development",         count: "450+", gradient: "from-indigo-500/20 to-violet-600/20",   color: "text-indigo-400" },
  { icon: Palette,       label: "Graphic Design",           count: "380+", gradient: "from-pink-500/20 to-rose-600/20",       color: "text-pink-400" },
  { icon: PenTool,       label: "Content Writing",          count: "320+", gradient: "from-amber-500/20 to-orange-600/20",    color: "text-amber-400" },
  { icon: BarChart3,     label: "Digital Marketing",        count: "290+", gradient: "from-emerald-500/20 to-teal-600/20",    color: "text-emerald-400" },
  { icon: Smartphone,    label: "App Development",          count: "260+", gradient: "from-cyan-500/20 to-blue-600/20",       color: "text-cyan-400" },
  { icon: Layers,        label: "UI/UX Design",             count: "230+", gradient: "from-violet-500/20 to-purple-600/20",   color: "text-violet-400" },
  { icon: Camera,        label: "Video & Animation",        count: "210+", gradient: "from-red-500/20 to-rose-600/20",        color: "text-red-400" },
  { icon: Megaphone,     label: "Social Media",             count: "200+", gradient: "from-fuchsia-500/20 to-pink-600/20",    color: "text-fuchsia-400" },
  { icon: Search,        label: "SEO Services",             count: "190+", gradient: "from-sky-500/20 to-blue-600/20",        color: "text-sky-400" },
  { icon: Globe,         label: "Translation",              count: "180+", gradient: "from-lime-500/20 to-green-600/20",      color: "text-lime-400" },
  { icon: ShoppingCart,  label: "E-commerce",               count: "170+", gradient: "from-orange-500/20 to-amber-600/20",    color: "text-orange-400" },
  { icon: FileText,      label: "Data Entry",               count: "160+", gradient: "from-slate-500/20 to-gray-600/20",      color: "text-slate-400" },
  { icon: Music,         label: "Music & Audio",            count: "150+", gradient: "from-purple-500/20 to-fuchsia-600/20",  color: "text-purple-400" },
  { icon: Headphones,    label: "Customer Support",         count: "140+", gradient: "from-teal-500/20 to-emerald-600/20",    color: "text-teal-400" },
  { icon: Wrench,        label: "IT & Networking",          count: "130+", gradient: "from-zinc-500/20 to-slate-600/20",      color: "text-zinc-400" },
  { icon: GraduationCap, label: "Online Tutoring",          count: "120+", gradient: "from-yellow-500/20 to-amber-600/20",    color: "text-yellow-400" },
  { icon: Heart,         label: "Lifestyle & Wellness",     count: "110+", gradient: "from-rose-500/20 to-pink-600/20",       color: "text-rose-400" },
  { icon: BookOpen,      label: "Academic Writing",         count: "100+", gradient: "from-blue-500/20 to-indigo-600/20",     color: "text-blue-400" },
  { icon: Cpu,           label: "AI & Machine Learning",    count: "90+",  gradient: "from-violet-500/20 to-indigo-600/20",   color: "text-violet-400" },
  { icon: TrendingUp,    label: "Business Consulting",      count: "85+",  gradient: "from-green-500/20 to-emerald-600/20",   color: "text-green-400" },
  { icon: Printer,       label: "Print Design",             count: "80+",  gradient: "from-amber-500/20 to-yellow-600/20",    color: "text-amber-400" },
  { icon: Database,      label: "Database Management",      count: "75+",  gradient: "from-cyan-500/20 to-sky-600/20",        color: "text-cyan-400" },
  { icon: Shield,        label: "Cybersecurity",            count: "70+",  gradient: "from-red-500/20 to-orange-600/20",      color: "text-red-400" },
  { icon: Monitor,       label: "Desktop Apps",             count: "65+",  gradient: "from-indigo-500/20 to-blue-600/20",     color: "text-indigo-400" },
  { icon: Mic,           label: "Voiceover & Narration",    count: "60+",  gradient: "from-fuchsia-500/20 to-violet-600/20",  color: "text-fuchsia-400" },
  { icon: MapPin,        label: "Local Services",           count: "55+",  gradient: "from-lime-500/20 to-teal-600/20",       color: "text-lime-400" },
  { icon: Scissors,      label: "Fashion & Tailoring",      count: "50+",  gradient: "from-pink-500/20 to-fuchsia-600/20",    color: "text-pink-400" },
  { icon: Truck,         label: "Logistics & Delivery",     count: "48+",  gradient: "from-slate-500/20 to-zinc-600/20",      color: "text-slate-400" },
  { icon: Landmark,      label: "Finance & Accounting",     count: "95+",  gradient: "from-emerald-500/20 to-green-600/20",   color: "text-emerald-400" },
  { icon: Stethoscope,   label: "Healthcare Writing",       count: "45+",  gradient: "from-teal-500/20 to-cyan-600/20",       color: "text-teal-400" },
  { icon: Scale,         label: "Legal Services",           count: "40+",  gradient: "from-amber-500/20 to-orange-600/20",    color: "text-amber-400" },
  { icon: Leaf,          label: "Environmental Services",   count: "35+",  gradient: "from-green-500/20 to-lime-600/20",      color: "text-green-400" },
  { icon: Gamepad2,      label: "Game Development",         count: "55+",  gradient: "from-violet-500/20 to-purple-600/20",   color: "text-violet-400" },
  { icon: Plane,         label: "Travel & Hospitality",     count: "42+",  gradient: "from-sky-500/20 to-cyan-600/20",        color: "text-sky-400" },
  { icon: Baby,          label: "Childcare Services",       count: "30+",  gradient: "from-rose-500/20 to-red-600/20",        color: "text-rose-400" },
  { icon: Dog,           label: "Pet Services",             count: "25+",  gradient: "from-orange-500/20 to-amber-600/20",    color: "text-orange-400" },
  { icon: Gem,           label: "Jewelry & Crafts",         count: "28+",  gradient: "from-fuchsia-500/20 to-pink-600/20",    color: "text-fuchsia-400" },
  { icon: Bike,          label: "Sports & Fitness",         count: "38+",  gradient: "from-blue-500/20 to-sky-600/20",        color: "text-blue-400" },
  { icon: Utensils,      label: "Food & Recipe Writing",    count: "33+",  gradient: "from-amber-500/20 to-yellow-600/20",    color: "text-amber-400" },
  { icon: Lightbulb,     label: "Innovation Consulting",    count: "22+",  gradient: "from-yellow-500/20 to-lime-600/20",     color: "text-yellow-400" },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .cat-page { background: #0f0f1a; min-height: 100vh; font-family: 'Inter', sans-serif; color: white; }
  .cat-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 16px;
    cursor: pointer;
    transition: transform 0.35s cubic-bezier(.17,.67,.34,1.2), box-shadow 0.35s ease, border-color 0.3s ease, background 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .cat-card::after {
    content:''; position:absolute; top:0; left:-120%; width:60%; height:100%;
    background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%);
  }
  .cat-card:hover::after { animation: cat-scan 0.5s ease forwards; }
  @keyframes cat-scan { from { left:-120%; } to { left:140%; } }
  .cat-card:hover {
    transform: perspective(800px) rotateX(-5deg) rotateY(2deg) translateY(-6px) scale(1.02);
    box-shadow: 0 20px 40px -8px rgba(0,0,0,0.5), 0 0 25px rgba(99,102,241,0.2);
    border-color: rgba(99,102,241,0.3);
    background: rgba(255,255,255,0.07);
  }
  .cat-header {
    position: sticky; top: 0; z-index: 50;
    background: rgba(15,15,26,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .cat-search {
    background: rgba(255,255,255,0.06) !important;
    border: 1px solid rgba(255,255,255,0.12) !important;
    color: white !important;
    border-radius: 12px !important;
    padding: 12px 16px 12px 44px !important;
    font-size: 14px;
    width: 100%;
    outline: none;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .cat-search::placeholder { color: rgba(255,255,255,0.35); }
  .cat-search:focus { border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
  .gradient-text-cat {
    background: linear-gradient(135deg, #a78bfa, #60a5fa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  @keyframes fade-up { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  .cat-card-anim { animation: fade-up 0.45s ease both; }
  .cat-cta {
    background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.12) 50%, rgba(52,211,153,0.08) 100%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
  }
  .cat-btn-primary {
    background: linear-gradient(135deg,#6366f1,#8b5cf6);
    color: white; border: none; border-radius: 12px;
    padding: 12px 24px; font-size: 14px; font-weight: 600;
    display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
    box-shadow: 0 0 24px rgba(99,102,241,0.4);
    transition: opacity 0.2s, transform 0.2s;
  }
  .cat-btn-primary:hover { opacity: 0.9; transform: translateY(-2px); }
  .cat-btn-outline {
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.8); border-radius: 12px;
    padding: 12px 24px; font-size: 14px; font-weight: 600;
    display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
    transition: background 0.2s, transform 0.2s;
  }
  .cat-btn-outline:hover { background: rgba(255,255,255,0.12); transform: translateY(-2px); }
  .count-badge {
    font-size: 11px; color: rgba(255,255,255,0.4);
    background: rgba(255,255,255,0.06); border-radius: 6px;
    padding: 2px 7px; display: inline-block; margin-top: 2px;
  }
`;

const MouseTiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 10;
    const y = -((e.clientY - top) / height - 0.5) * 10;
    setTilt({ x, y });
  };
  return (
    <div ref={ref} className={className}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
      style={{ transform: hovered ? `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` : "perspective(900px) rotateX(0deg) rotateY(0deg)", transition: hovered ? "transform 0.1s linear" : "transform 0.5s cubic-bezier(.17,.67,.34,1.2)" }}>
      {children}
    </div>
  );
};

const Categories = () => {
  const [search, setSearch] = useState("");
  const filtered = categories.filter((cat) =>
    cat.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="cat-page">
        {/* Ambient background orbs */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", filter: "blur(50px)" }} />
          <div style={{ position: "absolute", bottom: "15%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)", filter: "blur(45px)" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)", filter: "blur(40px)", transform: "translate(-50%,-50%)" }} />
        </div>

        {/* Header */}
        <header className="cat-header" style={{ position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, padding: "14px 24px" }}>
            <Link to="/">
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white", cursor: "pointer", transition: "background 0.2s" }}>
                <ArrowLeft style={{ width: 16, height: 16 }} />
              </button>
            </Link>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                <span className="gradient-text-cat">All Categories</span>
              </h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>{categories.length} categories · 2,700+ services</p>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 999, padding: "4px 12px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.05em" }}>Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px", position: "relative", zIndex: 1 }}>

          {/* Hero heading */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 14, fontSize: 12, fontWeight: 600, color: "#a5b4fc" }}>
              <Sparkles style={{ width: 13, height: 13 }} /> Browse All Services
            </div>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 900, margin: "0 0 10px" }}>
              Find Your <span className="gradient-text-cat">Perfect Service</span>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", margin: 0 }}>
              {categories.length} categories · Connect with skilled freelancers across India
            </p>
          </div>

          {/* Search */}
          <div style={{ position: "relative", maxWidth: 520, margin: "0 auto 36px" }}>
            <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.4)" }} />
            <input
              className="cat-search"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex" }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            )}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div style={{ padding: "80px 0", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
              No categories match "{search}"
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
              {filtered.map((cat, i) => (
                <MouseTiltCard key={cat.label}>
                  <div className={`cat-card cat-card-anim bg-gradient-to-br ${cat.gradient}`} style={{ animationDelay: `${Math.min(i, 20) * 40}ms` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <cat.icon className={`${cat.color}`} style={{ width: 18, height: 18 }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.label}</p>
                        <span className="count-badge">{cat.count} services</span>
                      </div>
                    </div>
                  </div>
                </MouseTiltCard>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="cat-cta" style={{ marginTop: 56, padding: "40px 32px", textAlign: "center" }}>
            <div style={{ marginBottom: 6, display: "inline-flex", alignItems: "center", gap: 6, color: "#a5b4fc", fontSize: 12, fontWeight: 600, background: "rgba(99,102,241,0.1)", borderRadius: 999, padding: "4px 14px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <Sparkles style={{ width: 12, height: 12 }} /> Get Started Today
            </div>
            <h3 style={{ fontSize: "clamp(20px,4vw,30px)", fontWeight: 800, margin: "10px 0 8px" }}>Can't find what you're looking for?</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "0 0 28px" }}>Join our platform and connect with employers or hire top talent across India</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              <Link to="/register/employee">
                <button className="cat-btn-primary">
                  <Briefcase style={{ width: 15, height: 15 }} /> Join as Freelancer
                </button>
              </Link>
              <Link to="/register/employer">
                <button className="cat-btn-outline">
                  <Users style={{ width: 15, height: 15 }} /> Post a Custom Job
                </button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Categories;
