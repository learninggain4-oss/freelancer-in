import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search, Filter, ArrowRight, Users, Clock, Briefcase, Code, Palette,
  PenTool, BarChart3, Camera, Music, Globe, Megaphone, FileText, Wrench,
  GraduationCap, Heart, Headphones, ShoppingCart, Cpu, BookOpen,
  TrendingUp, ChevronDown, X, Star,
} from "lucide-react";

const CATEGORIES = [
  "All", "Development", "Design", "Marketing", "Content", "Mobile",
  "Video", "Analytics", "Backend", "Branding", "Web", "Support",
  "Data Entry", "Translation", "Finance", "Legal",
];

const BUDGET_FILTERS = [
  { label: "All Budgets", min: 0, max: Infinity },
  { label: "Under ₹5,000", min: 0, max: 5000 },
  { label: "₹5,000 – ₹15,000", min: 5000, max: 15000 },
  { label: "₹15,000 – ₹50,000", min: 15000, max: 50000 },
  { label: "₹50,000+", min: 50000, max: Infinity },
];

const SORT_OPTIONS = ["Newest First", "Budget: High to Low", "Budget: Low to High", "Most Bids"];

const CAT_COLORS: Record<string, string> = {
  Development: "#60a5fa", Design: "#a78bfa", Marketing: "#34d399",
  Content: "#fbbf24", Mobile: "#f97316", Video: "#ec4899",
  Analytics: "#38bdf8", Backend: "#4ade80", Branding: "#c084fc",
  Web: "#fb923c", Support: "#94a3b8", "Data Entry": "#64748b",
  Translation: "#2dd4bf", Finance: "#22d3ee", Legal: "#f472b6",
};

const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Development: Code, Design: Palette, Marketing: Megaphone,
  Content: PenTool, Mobile: Cpu, Video: Camera,
  Analytics: BarChart3, Backend: Wrench, Branding: TrendingUp,
  Web: Globe, Support: Headphones, "Data Entry": FileText,
  Translation: BookOpen, Finance: Star, Legal: GraduationCap,
};

const PROJECT_TITLES: [string, string, string][] = [
  ["React Dashboard for Logistics Startup", "Development", "₹35,000"],
  ["Logo Design for Wellness Brand", "Design", "₹6,500"],
  ["Google Ads Campaign Management", "Marketing", "₹18,000"],
  ["Blog Content — 20 Articles per Month", "Content", "₹12,000"],
  ["Flutter App for Food Delivery", "Mobile", "₹65,000"],
  ["Product Explainer Video (2 min)", "Video", "₹8,500"],
  ["Sales Dashboard in Power BI", "Analytics", "₹22,000"],
  ["Node.js REST API Development", "Backend", "₹40,000"],
  ["Full Brand Identity — Logo + Collateral", "Branding", "₹15,000"],
  ["WordPress E-commerce Setup + Theme", "Web", "₹9,000"],
  ["Customer Support Chat Agent", "Support", "₹7,000"],
  ["Excel Data Entry — 5000 Rows", "Data Entry", "₹3,500"],
  ["English to Hindi Translation — 10K Words", "Translation", "₹4,500"],
  ["Tax Filing & GST Compliance", "Finance", "₹5,500"],
  ["Contract Drafting for SaaS Company", "Legal", "₹8,000"],
  ["Vue.js Frontend for EdTech Platform", "Development", "₹28,000"],
  ["UI/UX Redesign — Mobile App", "Design", "₹20,000"],
  ["Instagram & Reels Content Strategy", "Marketing", "₹10,000"],
  ["Technical Blog Writing — AI/ML", "Content", "₹15,000"],
  ["Android App — Hospital Appointment", "Mobile", "₹55,000"],
  ["YouTube Channel Editing (Weekly)", "Video", "₹11,000"],
  ["MySQL Performance Optimization", "Backend", "₹16,000"],
  ["Shopify Store Setup + SEO", "Web", "₹13,000"],
  ["Email Support for D2C Brand", "Support", "₹6,000"],
  ["CRM Data Cleanup & Deduplication", "Data Entry", "₹4,000"],
  ["Kannada Subtitles for 5 Videos", "Translation", "₹3,000"],
  ["Startup Financial Model + Projections", "Finance", "₹12,000"],
  ["Terms of Service & Privacy Policy", "Legal", "₹5,000"],
  ["Django Backend for Inventory System", "Development", "₹38,000"],
  ["Pitch Deck Design (15 Slides)", "Design", "₹9,500"],
  ["LinkedIn Lead Generation Campaign", "Marketing", "₹14,000"],
  ["Product Descriptions — 200 Items", "Content", "₹8,000"],
  ["React Native App — Real Estate", "Mobile", "₹72,000"],
  ["Corporate Training Video Series", "Video", "₹25,000"],
  ["Tableau Dashboard for Retail Chain", "Analytics", "₹19,000"],
  ["Python Microservices Architecture", "Backend", "₹50,000"],
  ["Brand Refresh — Colors + Typography", "Branding", "₹11,000"],
  ["Wix Website for Coaching Business", "Web", "₹7,500"],
  ["Live Chat Support — E-commerce", "Support", "₹8,500"],
  ["PDF Form Data Entry — 1000 Forms", "Data Entry", "₹5,000"],
  ["Tamil to English — Legal Document", "Translation", "₹6,000"],
  ["Monthly Bookkeeping for Startup", "Finance", "₹7,000"],
  ["Employment Agreement Template", "Legal", "₹4,000"],
  ["Next.js Blog with CMS Integration", "Development", "₹24,000"],
  ["Social Media Kit — 30 Graphics", "Design", "₹7,000"],
  ["WhatsApp Marketing Campaign", "Marketing", "₹9,000"],
  ["Newsletter Copywriting — 4/month", "Content", "₹10,000"],
  ["iOS Swift App — Fitness Tracker", "Mobile", "₹80,000"],
  ["Testimonial Video Editing", "Video", "₹6,000"],
  ["Google Analytics 4 Setup", "Analytics", "₹8,000"],
  ["Laravel API for Multi-Vendor Store", "Backend", "₹45,000"],
  ["Packaging Design — 5 Products", "Branding", "₹13,000"],
  ["Portfolio Website — Freelance Designer", "Web", "₹8,000"],
  ["Technical Support Tier 1", "Support", "₹9,500"],
  ["Aadhar + PAN Data Verification Entry", "Data Entry", "₹3,000"],
  ["Malayalam Voice Over — 10 min", "Translation", "₹4,000"],
  ["Invoice & Billing Automation", "Finance", "₹9,000"],
  ["NDA & Confidentiality Agreement", "Legal", "₹3,500"],
  ["React Three.js Interactive Website", "Development", "₹42,000"],
  ["Infographic Design — Annual Report", "Design", "₹5,500"],
  ["SEO Audit + 3-Month Action Plan", "Marketing", "₹16,000"],
  ["Ebook Writing — 15,000 Words", "Content", "₹18,000"],
  ["Flutter + Firebase Social App", "Mobile", "₹60,000"],
  ["Documentary Short Film Editing", "Video", "₹20,000"],
  ["KPI Dashboard in Google Data Studio", "Analytics", "₹12,000"],
  ["Go Language REST API", "Backend", "₹35,000"],
  ["Product Label Design", "Branding", "₹4,500"],
  ["Squarespace Website for Restaurant", "Web", "₹6,000"],
  ["Help Desk Agent — SaaS Product", "Support", "₹11,000"],
  ["Spreadsheet Automation with Macros", "Data Entry", "₹6,500"],
  ["Telugu to English — 20 Documents", "Translation", "₹5,500"],
  ["Payroll Processing — 50 Employees", "Finance", "₹8,500"],
  ["Freelance Service Agreement", "Legal", "₹4,500"],
  ["TypeScript Refactor — Legacy Codebase", "Development", "₹30,000"],
  ["Motion Graphics — App Launch", "Design", "₹12,000"],
  ["Facebook Ads for Jewellery Brand", "Marketing", "₹11,000"],
  ["Case Study Writing — B2B SaaS", "Content", "₹7,000"],
  ["Android TV Streaming App", "Mobile", "₹90,000"],
  ["Wedding Highlight Reel Editing", "Video", "₹9,000"],
  ["Cohort Retention Analysis", "Analytics", "₹17,000"],
  ["FastAPI + PostgreSQL Backend", "Backend", "₹32,000"],
  ["Trade Show Banner & Standee Design", "Branding", "₹5,000"],
  ["Bubble.io No-Code App Development", "Web", "₹15,000"],
  ["After-Hours Customer Support", "Support", "₹7,500"],
  ["E-commerce Product Photo Tagging", "Data Entry", "₹2,500"],
  ["Bengali Subtitles — 10 Episodes", "Translation", "₹7,000"],
  ["CA Certificate & Audit Support", "Finance", "₹14,000"],
  ["Trademark Filing Assistance", "Legal", "₹6,500"],
  ["Shopify App Development (Private)", "Development", "₹55,000"],
  ["Icon Set — 100 Custom Icons", "Design", "₹8,000"],
  ["Influencer Outreach Campaign", "Marketing", "₹13,000"],
  ["Amazon Product Listing Copy", "Content", "₹5,000"],
  ["React Native — E-Wallet App", "Mobile", "₹75,000"],
  ["Brand Video — Startup Story", "Video", "₹30,000"],
  ["Customer Churn Prediction Model", "Analytics", "₹28,000"],
  ["Microservices — Kafka + Docker", "Backend", "₹60,000"],
  ["Company Profile Brochure Design", "Branding", "₹6,000"],
  ["Custom WordPress Theme Development", "Web", "₹18,000"],
];

type Project = {
  id: number;
  title: string;
  category: string;
  budget: string;
  budgetNum: number;
  bids: number;
  posted: string;
  duration: string;
  skills: string[];
  description: string;
};

function parseBudget(b: string): number {
  return parseInt(b.replace(/[^0-9]/g, ""), 10);
}

const SKILL_MAP: Record<string, string[]> = {
  Development: ["React","TypeScript","Node.js"], Design: ["Figma","Adobe XD","Illustrator"],
  Marketing: ["Google Ads","Meta Ads","Analytics"], Content: ["Copywriting","SEO","Research"],
  Mobile: ["Flutter","React Native","Swift"], Video: ["Premiere Pro","After Effects","DaVinci"],
  Analytics: ["Python","Power BI","SQL"], Backend: ["Node.js","Django","PostgreSQL"],
  Branding: ["Illustrator","Branding","Strategy"], Web: ["HTML/CSS","WordPress","JavaScript"],
  Support: ["Communication","Zendesk","CRM"], "Data Entry": ["Excel","Google Sheets","Accuracy"],
  Translation: ["Linguistics","Proofreading","Fluency"], Finance: ["Tally","Excel","GST"],
  Legal: ["Contract Law","Drafting","Research"],
};

const POSTED_TIMES = ["2m ago","5m ago","12m ago","18m ago","25m ago","32m ago","45m ago","1h ago","1.5h ago","2h ago","3h ago","4h ago","5h ago","6h ago","8h ago"];
const DURATIONS = ["1 week","2 weeks","1 month","2 months","3 months","Ongoing","Fixed price","Negotiable"];
const DESCRIPTIONS: Record<string, string> = {
  Development: "We need an experienced developer to build a scalable, production-ready solution. Clean code and proper documentation required.",
  Design: "Looking for a creative designer with a strong portfolio. Modern, minimal aesthetic preferred with attention to brand consistency.",
  Marketing: "Drive measurable results through targeted campaigns. Must have proven track record with Indian audiences.",
  Content: "High-quality, well-researched content that ranks on Google and converts readers into customers.",
  Mobile: "Cross-platform or native mobile app with clean UI, fast performance, and seamless UX.",
  Video: "Professional video editing with motion graphics, color grading, and optimized for social media.",
  Analytics: "Transform raw data into actionable insights with clean visualizations and clear recommendations.",
  Backend: "Robust, secure, and scalable backend architecture with proper API documentation.",
  Branding: "Cohesive brand identity that tells our story and resonates with our target audience.",
  Web: "Modern, responsive website with fast load times, SEO-ready, and easy to manage.",
  Support: "Professional customer support with quick response times and high satisfaction scores.",
  "Data Entry": "Accurate and efficient data entry with attention to detail and proper formatting.",
  Translation: "Accurate, culturally-appropriate translation preserving tone and intent of the original.",
  Finance: "Accurate financial management with proper documentation and regulatory compliance.",
  Legal: "Precise legal drafting with clear language and full regulatory compliance.",
};

const ALL_PROJECTS: Project[] = PROJECT_TITLES.map(([title, cat, budget], i) => ({
  id: i + 1,
  title,
  category: cat,
  budget,
  budgetNum: parseBudget(budget),
  bids: Math.floor(Math.random() * 18) + 1,
  posted: POSTED_TIMES[i % POSTED_TIMES.length],
  duration: DURATIONS[i % DURATIONS.length],
  skills: SKILL_MAP[cat] || ["Communication"],
  description: DESCRIPTIONS[cat] || "",
}));

const THEMES_MAP: Record<string, { bg: string; bgRgb: string; a1: string; a2: string; a1rgb: string; a2rgb: string }> = {
  midnight: { bg: "#070714", bgRgb: "7,7,20",    a1: "#6366f1", a2: "#8b5cf6", a1rgb: "99,102,241",  a2rgb: "139,92,246" },
  crimson:  { bg: "#0f0407", bgRgb: "15,4,7",    a1: "#f43f5e", a2: "#fb7185", a1rgb: "244,63,94",   a2rgb: "251,113,133" },
  ocean:    { bg: "#020b12", bgRgb: "2,11,18",   a1: "#0ea5e9", a2: "#06b6d4", a1rgb: "14,165,233",  a2rgb: "6,182,212"  },
  forest:   { bg: "#030f06", bgRgb: "3,15,6",    a1: "#22c55e", a2: "#16a34a", a1rgb: "34,197,94",   a2rgb: "22,163,74"  },
  amber:    { bg: "#0c0800", bgRgb: "12,8,0",    a1: "#f59e0b", a2: "#f97316", a1rgb: "245,158,11",  a2rgb: "249,115,22" },
};

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [budgetFilter, setBudgetFilter] = useState(0);
  const [sortBy, setSortBy] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 24;

  useEffect(() => {
    const id = (localStorage.getItem("fi-theme") || "midnight") as string;
    const t = THEMES_MAP[id] ?? THEMES_MAP["midnight"];
    const root = document.documentElement;
    root.style.setProperty("--t-bg", t.bg);
    root.style.setProperty("--t-bg-rgb", t.bgRgb);
    root.style.setProperty("--t-a1", t.a1);
    root.style.setProperty("--t-a2", t.a2);
    root.style.setProperty("--t-a1-rgb", t.a1rgb);
    root.style.setProperty("--t-a2-rgb", t.a2rgb);
    document.body.style.background = t.bg;
    document.title = "Browse Freelance Projects India | 1,000+ Live Jobs | Freelancer India";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Browse 1,000+ live freelance projects in India. Filter by category, budget, and deadline. Bid on web development, design, content, marketing projects and more. Get paid via UPI.");
    return () => {
      document.title = "Freelancer India — Hire Top Indian Freelancers | UPI Payments | ₹0 Commission (3 Months)";
      document.body.style.background = "";
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...ALL_PROJECTS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.skills.some(s => s.toLowerCase().includes(q)));
    }
    if (category !== "All") list = list.filter(p => p.category === category);
    const bf = BUDGET_FILTERS[budgetFilter];
    list = list.filter(p => p.budgetNum >= bf.min && p.budgetNum <= bf.max);
    if (sortBy === 1) list.sort((a, b) => b.budgetNum - a.budgetNum);
    else if (sortBy === 2) list.sort((a, b) => a.budgetNum - b.budgetNum);
    else if (sortBy === 3) list.sort((a, b) => b.bids - a.bids);
    return list;
  }, [search, category, budgetFilter, sortBy]);

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore = paginated.length < filtered.length;

  return (
    <div className="min-h-screen" style={{ background: "var(--t-bg)", color: "#fff" }}>
      <style>{`
        @keyframes proj-card-in {
          from { opacity: 0; transform: translateY(22px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes orb-sway {
          0%, 100% { transform: translate(0,0); }
          33% { transform: translate(40px,-28px); }
          66% { transform: translate(-22px,35px); }
        }
        @keyframes proj-stat-in {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes live-ping {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%       { transform: scale(1.8); opacity: 0; }
        }
        @keyframes budget-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .proj-budget-text {
          background: linear-gradient(90deg, currentColor 0%, #fff 40%, currentColor 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: budget-shimmer 2.5s linear infinite;
        }
        .proj-card-hover-glow {
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
        }
      `}</style>

      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", width: 640, height: 640, top: "-8%", left: "-8%", borderRadius: "50%", background: "radial-gradient(circle, rgba(var(--t-a1-rgb),0.055) 0%, transparent 70%)", animation: "orb-sway 16s ease-in-out infinite", filter: "blur(48px)", willChange: "transform" }} />
        <div style={{ position: "absolute", width: 520, height: 520, top: "45%", right: "-8%", borderRadius: "50%", background: "radial-gradient(circle, rgba(var(--t-a2-rgb),0.045) 0%, transparent 70%)", animation: "orb-sway 20s ease-in-out 4s infinite", filter: "blur(48px)", willChange: "transform" }} />
        <div style={{ position: "absolute", width: 420, height: 420, bottom: "8%", left: "32%", borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.035) 0%, transparent 70%)", animation: "orb-sway 13s ease-in-out 8s infinite", filter: "blur(48px)", willChange: "transform" }} />
      </div>
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: "rgba(var(--t-bg-rgb),0.9)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 mr-2 shrink-0">
            <img src="/logo.png" alt="Freelancer India" className="h-8 w-8 object-contain" />
            <span className="text-sm font-bold text-white hidden sm:block">Freelancer<span className="text-indigo-400">.</span></span>
          </Link>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search projects, skills, categories..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shrink-0 transition-all"
            style={{ background: showFilters ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)", border: showFilters ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)", color: showFilters ? "#a78bfa" : "rgba(255,255,255,0.7)" }}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <Link to="/register/employee" className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 16px rgba(99,102,241,0.35)" }}>
            Post Profile
          </Link>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-4 flex flex-col sm:flex-row gap-3">
            {/* Budget */}
            <div className="relative">
              <select
                value={budgetFilter}
                onChange={e => { setBudgetFilter(+e.target.value); setPage(1); }}
                className="appearance-none rounded-xl pl-4 pr-8 py-2 text-sm text-white outline-none cursor-pointer"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {BUDGET_FILTERS.map((b, i) => <option key={i} value={i}>{b.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
            </div>
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => { setSortBy(+e.target.value); setPage(1); }}
                className="appearance-none rounded-xl pl-4 pr-8 py-2 text-sm text-white outline-none cursor-pointer"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {SORT_OPTIONS.map((s, i) => <option key={i} value={i}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
            </div>
            {/* Active filters badge */}
            {(search || category !== "All" || budgetFilter !== 0 || sortBy !== 0) && (
              <button onClick={() => { setSearch(""); setCategory("All"); setBudgetFilter(0); setSortBy(0); setPage(1); }} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <X className="h-3.5 w-3.5" /> Clear All
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8" style={{ position: "relative", zIndex: 1 }}>

        {/* Live Stats Bar */}
        <div className="mb-8 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="grid grid-cols-3 divide-x" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {[
              { label: "Live Projects", value: String(filtered.length + 843), icon: "🚀", color: "var(--t-a1)" },
              { label: "Budget Pool",   value: "₹4.8Cr",                   icon: "💰", color: "#4ade80"      },
              { label: "Added Today",   value: "38",                        icon: "⚡", color: "#f59e0b"      },
            ].map((s, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-center justify-center gap-2 py-4 px-2"
                style={{ animation: `proj-stat-in 0.5s ease ${i * 120}ms both` }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <div className="text-center sm:text-left">
                  <p className="text-base sm:text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-white/40">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none" style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => {
            const color = CAT_COLORS[cat] || "rgba(255,255,255,0.5)";
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className="shrink-0 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap"
                style={{
                  background: active ? `${color}22` : "rgba(255,255,255,0.04)",
                  border: active ? `1px solid ${color}55` : "1px solid rgba(255,255,255,0.07)",
                  color: active ? color : "rgba(255,255,255,0.45)",
                  transform: active ? "scale(1.07)" : "scale(1)",
                  boxShadow: active ? `0 0 16px ${color}50, inset 0 0 12px ${color}10` : "none",
                  transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-white/50">
            <span className="font-bold text-white">{filtered.length}</span> projects found
            {category !== "All" && <> in <span className="font-semibold" style={{ color: CAT_COLORS[category] }}>{category}</span></>}
          </p>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/40">Live · Updated now</span>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {paginated.map((p, i) => {
            const color = CAT_COLORS[p.category] || "#a78bfa";
            const Icon = CAT_ICONS[p.category] || Briefcase;
            return (
              <div
                key={p.id}
                className="proj-card-hover-glow group rounded-2xl p-5 flex flex-col"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  animation: `proj-card-in 0.45s cubic-bezier(0.34,1.56,0.64,1) ${Math.min(i % 24, 11) * 50}ms both`,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = `${color}40`;
                  el.style.boxShadow = `0 0 28px -6px ${color}55, inset 0 0 30px -12px ${color}12`;
                  el.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "rgba(255,255,255,0.08)";
                  el.style.boxShadow = "none";
                  el.style.transform = "translateY(0)";
                }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300" style={{ background: `${color}22`, boxShadow: `0 0 12px ${color}30` }}>
                    <Icon className="h-4 w-4 group-hover:drop-shadow-lg transition-all duration-300" style={{ color }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#4ade80" }} />
                      <div className="h-1.5 w-1.5 rounded-full absolute inset-0" style={{ background: "#4ade80", animation: "live-ping 2s ease-in-out infinite" }} />
                    </div>
                    <span className="text-[10px] text-white/30">{p.posted}</span>
                  </div>
                </div>
                {/* Category tag */}
                <span className="mb-2 inline-flex w-fit rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                  {p.category}
                </span>
                {/* Title */}
                <h3 className="text-sm font-bold text-white mb-2 leading-snug flex-1 group-hover:opacity-90 transition-all duration-200" style={{ textShadow: "0 0 0 transparent" }}>
                  {p.title}
                </h3>
                {/* Description */}
                <p className="text-xs text-white/40 leading-relaxed mb-3 line-clamp-2">{p.description}</p>
                {/* Skills */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {p.skills.map(s => (
                    <span key={s} className="rounded-md px-1.5 py-0.5 text-[10px] text-white/45" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {s}
                    </span>
                  ))}
                </div>
                {/* Meta */}
                <div className="flex items-center gap-3 mb-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-1 text-[10px] text-white/35">
                    <Clock className="h-3 w-3" /> {p.duration}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-white/35">
                    <Users className="h-3 w-3" /> {p.bids} bids
                  </div>
                </div>
                {/* Budget + CTA */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-black" style={{ color }}>{p.budget}</span>
                  <Link to="/register/employee">
                    <button
                      className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-all hover:scale-105"
                      style={{ background: `linear-gradient(135deg, ${color}cc, ${color}88)`, boxShadow: `0 4px 12px ${color}30` }}
                    >
                      Place a Bid <ArrowRight className="h-3 w-3" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-white/50 text-lg font-semibold mb-2">No projects found</p>
            <p className="text-white/30 text-sm">Try adjusting your search or filters.</p>
            <button onClick={() => { setSearch(""); setCategory("All"); setBudgetFilter(0); }} className="mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              Clear Filters
            </button>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={() => setPage(p => p + 1)}
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              Load More Projects <ChevronDown className="h-4 w-4" />
            </button>
            <p className="mt-3 text-xs text-white/30">Showing {paginated.length} of {filtered.length} projects</p>
          </div>
        )}

        {/* CTA Banner */}
        <div className="mt-16 rounded-3xl p-8 md:p-12 text-center overflow-hidden relative" style={{ background: "linear-gradient(135deg, rgba(var(--t-a1-rgb),0.13), rgba(var(--t-a2-rgb),0.13))", border: "1px solid rgba(var(--t-a1-rgb),0.2)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(var(--t-a1-rgb),0.14) 0%, transparent 70%)" }} />
          {/* Animated corner glow */}
          <div className="absolute top-0 left-0 w-48 h-48 pointer-events-none" style={{ background: "radial-gradient(circle at 0% 0%, rgba(var(--t-a1-rgb),0.15), transparent 70%)", animation: "orb-sway 8s ease-in-out infinite" }} />
          <div className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none" style={{ background: "radial-gradient(circle at 100% 100%, rgba(var(--t-a2-rgb),0.12), transparent 70%)", animation: "orb-sway 10s ease-in-out 3s infinite" }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold" style={{ background: "rgba(var(--t-a1-rgb),0.15)", border: "1px solid rgba(var(--t-a1-rgb),0.3)", color: "var(--t-a1)" }}>
              <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: "var(--t-a1)", boxShadow: "0 0 6px var(--t-a1)", animation: "live-ping 2s ease-in-out infinite" }} />
              {filtered.length + 843} Projects Live Right Now
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Ready to bid on projects?</h2>
            <p className="text-white/55 mb-6 max-w-md mx-auto text-sm">Create your freelancer profile in minutes and start winning projects today.</p>
            <Link to="/register/employee">
              <button
                className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:brightness-110"
                style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", boxShadow: "0 0 36px rgba(var(--t-a1-rgb),0.5), 0 4px 20px rgba(var(--t-a1-rgb),0.3)" }}
              >
                <Briefcase className="h-4 w-4" /> Create Freelancer Profile <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
