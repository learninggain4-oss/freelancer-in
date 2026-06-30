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
  useEffect(() => {
    document.title = "Freelance Service Categories — 2,700+ Skills | Freelan Space";
    return () => { document.title = "Freelan Space"; };
  }, []);
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
              <button aria-label="Go back" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white", cursor: "pointer", transition: "background 0.2s" }}>
                <ArrowLeft style={{ width: 16, height: 16 }} />
              </button>
            </Link>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                <span className="gradient-text-cat">All Categories</span>
              </p>
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
            <h1 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 900, margin: "0 0 10px" }}>
              Find Your <span className="gradient-text-cat">Perfect Service</span>
            </h1>
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

          {/* SEO Content Section */}
          <div style={{ marginTop: 56, padding: "40px 32px", background: "rgba(255,255,255,0.02)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, margin: "0 0 16px", color: "white" }}>Complete Guide to Freelance Services in India</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, marginBottom: 16 }}>India's freelance marketplace has grown into one of the most diverse and vibrant in the world. With over 15 million active freelancers across 2,700+ service categories, Indian professionals are delivering world-class work for clients locally and globally. Whether you need a mobile app built, a brand identity designed, a data report analysed, or an entire digital marketing campaign run — you will find a verified, skilled professional for it on Freelancer India.</p>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, marginBottom: 32 }}>Browsing categories is the fastest way to discover what's possible. Each category on Freelancer India represents a cluster of related services offered by verified freelancers across India. Click any category to see active professionals, their portfolios, skill badges, client reviews, and current availability.</p>

            <h2 style={{ fontSize: "clamp(20px,3.5vw,28px)", fontWeight: 900, margin: "0 0 20px", color: "white" }}>Most In-Demand Freelance Categories in India</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { title: "Web Development", body: "Web developers are the most sought-after freelancers in India. Services range from simple WordPress websites (₹5,000–₹25,000) to full-stack React and Node.js applications (₹50,000–₹5,00,000+). Front-end, back-end, and full-stack specialists are all in demand." },
                { title: "Graphic Design & Branding", body: "From logo design and brand identity to UI/UX for digital products, graphic designers on Freelancer India serve startups, SMEs, and established brands. Rates typically range from ₹2,000 for simple logos to ₹1,50,000+ for comprehensive brand guidelines." },
                { title: "Content Writing & Copywriting", body: "Content writers create blogs, website copy, product descriptions, social media posts, email newsletters, and more. Indian content writers are highly competitive globally, with rates from ₹1 per word for bulk content to ₹15+ per word for specialised technical or legal writing." },
                { title: "Digital Marketing & SEO", body: "Businesses across India need help with Google Ads, Facebook campaigns, SEO audits, link building, and social media management. Digital marketers on Freelancer India typically charge ₹10,000–₹60,000 per month for ongoing campaigns, or project-based fees for one-time audits." },
                { title: "Mobile App Development", body: "Flutter, Android (Kotlin/Java), and iOS (Swift) developers are in high demand. Mobile app projects range from ₹30,000 for simple utility apps to ₹5,00,000+ for complex, feature-rich applications with backend integration and payment gateways." },
                { title: "Video Editing & Animation", body: "Video content is the fastest-growing demand on Indian platforms. YouTube editors, Reels creators, explainer video animators, and product demo specialists are all available. Rates range from ₹500 per short edit to ₹50,000+ for full animated explainer videos." },
              ].map(item => (
                <div key={item.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px 20px" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.65, margin: 0 }}>{item.body}</p>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: "clamp(20px,3.5vw,28px)", fontWeight: 900, margin: "0 0 20px", color: "white" }}>How to Choose the Right Freelancer for Your Project</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { step: "01", title: "Define Your Requirements", body: "Before browsing categories, write down exactly what you need — deliverables, timeline, budget, and any specific tools or platforms required. A clear brief helps you find the right category and evaluate freelancer proposals more effectively." },
                { step: "02", title: "Check Verified Skill Badges", body: "Freelancer India's verified skill badges indicate that a freelancer has passed a structured assessment in their field. Prioritise freelancers with relevant badges — they have demonstrated their ability to deliver, not just claimed it." },
                { step: "03", title: "Review Portfolio & Client Feedback", body: "Every freelancer profile includes a portfolio of past work and verified client reviews. Read through at least 5–10 reviews and look for consistent themes about quality, communication, and deadline adherence." },
                { step: "04", title: "Compare Proposals, Not Just Price", body: "The cheapest bid is rarely the best. Look for proposals that show the freelancer understands your project, proposes a clear approach, and demonstrates relevant experience. A slightly higher bid from a qualified professional almost always delivers better value." },
              ].map(item => (
                <div key={item.step} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px 20px" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "rgba(255,255,255,0.06)", lineHeight: 1 }}>{item.step}</div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", margin: "6px 0 6px" }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.65, margin: 0 }}>{item.body}</p>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: "clamp(20px,3.5vw,28px)", fontWeight: 900, margin: "0 0 20px", color: "white" }}>Frequently Asked Questions</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                { q: "How much does it cost to hire a freelancer in India?", a: "Costs vary by category, complexity, and freelancer experience. Simple projects like a logo design or a 500-word blog post can cost ₹1,000–₹5,000. Mid-size projects like a 5-page website or a social media content calendar cost ₹10,000–₹50,000. Complex projects like a full mobile app or an e-commerce platform can cost ₹1,00,000–₹10,00,000 or more. Freelancer India's budgeting tool helps you get realistic cost estimates before posting your project." },
                { q: "Are freelancers on Freelancer India verified?", a: "Yes. Every freelancer on Freelancer India goes through an admin verification process before their profile goes live. Many freelancers also complete Aadhaar-based KYC and bank account verification for additional trust. Verified skill badges provide another layer of assurance that a freelancer has the specific skills your project requires." },
                { q: "What if I am not satisfied with the work delivered?", a: "Freelancer India's escrow system protects you. Payment is only released when you approve the completed work. If you are not satisfied, you can request revisions as per the project scope. For unresolved disputes, our support team steps in to mediate and find a fair resolution for both parties." },
                { q: "Can I hire a freelancer for a long-term contract?", a: "Absolutely. Many employers on Freelancer India hire freelancers on a monthly retainer basis for ongoing work such as content creation, social media management, software maintenance, or bookkeeping. Freelancer India's platform supports recurring payment schedules and long-term project timelines." },
                { q: "How quickly can I find a freelancer after posting a project?", a: "Most projects on Freelancer India receive their first proposal within 2–4 hours. High-priority projects with a clear brief, fair budget, and good description typically receive 10–30 proposals within 24 hours. You can also use the direct hire feature to reach out to specific freelancers whose profiles match your needs." },
              ].map(item => (
                <div key={item.q} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 20px" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 6 }}>{item.q}</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.65, margin: 0 }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="cat-cta" style={{ marginTop: 56, padding: "40px 32px", textAlign: "center" }}>
            <div style={{ marginBottom: 6, display: "inline-flex", alignItems: "center", gap: 6, color: "#a5b4fc", fontSize: 12, fontWeight: 600, background: "rgba(99,102,241,0.1)", borderRadius: 999, padding: "4px 14px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <Sparkles style={{ width: 12, height: 12 }} /> Get Started Today
            </div>
            <h3 style={{ fontSize: "clamp(20px,4vw,30px)", fontWeight: 800, margin: "10px 0 8px" }}>Can't find what you're looking for?</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "0 0 28px" }}>Join our platform and connect with employers or hire top talent across India</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              <Link to="/register/freelancer">
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
