import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Shield, Zap, Heart, Globe, Award, TrendingUp, Target, Star } from "lucide-react";

const THEMES = [
  { id: "midnight", bg: "#070714", bgRgb: "7,7,20",    a1: "#6366f1", a2: "#8b5cf6", a1rgb: "99,102,241",  a2rgb: "139,92,246" },
  { id: "crimson",  bg: "#130a0a", bgRgb: "19,10,10",  a1: "#f43f5e", a2: "#fb923c", a1rgb: "244,63,94",   a2rgb: "251,146,60" },
  { id: "ocean",    bg: "#030d1a", bgRgb: "3,13,26",   a1: "#0ea5e9", a2: "#06b6d4", a1rgb: "14,165,233",  a2rgb: "6,182,212"  },
  { id: "forest",   bg: "#030f0a", bgRgb: "3,15,10",   a1: "#22c55e", a2: "#10b981", a1rgb: "34,197,94",   a2rgb: "16,185,129" },
  { id: "amber",    bg: "#120d02", bgRgb: "18,13,2",   a1: "#f59e0b", a2: "#f97316", a1rgb: "245,158,11",  a2rgb: "249,115,22" },
];

const VALUES = [
  { icon: Shield,    color: "#6366f1", title: "Trust First",         desc: "Every freelancer and employer is verified. We use Aadhaar-based KYC and bank verification to ensure a safe community." },
  { icon: Zap,       color: "#f59e0b", title: "Instant Payments",    desc: "UPI-powered payouts mean freelancers get paid within minutes — not days. Escrow protects both sides of every transaction." },
  { icon: Heart,     color: "#ec4899", title: "India-First Design",  desc: "Built for India — multiple Indian languages, INR payments, and features designed around how Indian freelancers actually work." },
  { icon: Globe,     color: "#0ea5e9", title: "Open to All",         desc: "From students in small towns to seasoned professionals in metros — anyone with a skill can earn on Freelancer India." },
  { icon: Award,     color: "#34d399", title: "Quality Over Quantity", desc: "We curate quality over volume. Skill tests, portfolio reviews, and a rating system keep standards high for everyone." },
  { icon: TrendingUp,color: "#a855f7", title: "Built to Grow",       desc: "We reinvest in the platform continuously — new categories, new tools, and new protections added every month." },
];

const STATS = [
  { value: "500+",  label: "Professionals" },
  { value: "₹0",   label: "Commission (First 3 months)" },
  { value: "4.9★",  label: "Average Rating" },
  { value: "100%",  label: "Made in India" },
];

const TEAM = [
  { name: "Platform Team", role: "Engineering & Product", emoji: "⚙️" },
  { name: "Trust & Safety", role: "Verification & Support", emoji: "🛡️" },
  { name: "Community Team", role: "Freelancer Success", emoji: "🤝" },
  { name: "Finance Team",   role: "Payments & Escrow",    emoji: "💳" },
];

export default function About() {
  useEffect(() => {
    const id = (localStorage.getItem("fi-theme") || "midnight") as string;
    const t = THEMES.find(x => x.id === id) ?? THEMES[0];
    const root = document.documentElement;
    root.style.setProperty("--t-bg", t.bg);
    root.style.setProperty("--t-bg-rgb", t.bgRgb);
    root.style.setProperty("--t-a1", t.a1);
    root.style.setProperty("--t-a2", t.a2);
    root.style.setProperty("--t-a1-rgb", t.a1rgb);
    root.style.setProperty("--t-a2-rgb", t.a2rgb);
    document.body.style.background = t.bg;
    document.title = "About Us | Freelancer India";
    return () => {
      document.title = "Freelancer India";
      document.body.style.background = "";
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--t-bg)", color: "#fff" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: "rgba(var(--t-bg-rgb),0.92)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <Link to="/" className="flex items-center gap-1.5 font-black text-white text-lg">
            <span className="text-xl">💼</span> Freelancer<span style={{ color: "var(--t-a1)" }}>.</span>
          </Link>
          <Link to="/register/employee">
            <button className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>
              Get Started
            </button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 md:py-24 space-y-24">

        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300" style={{ background: "rgba(var(--t-a1-rgb),0.12)", border: "1px solid rgba(var(--t-a1-rgb),0.25)" }}>
            <Users className="h-3.5 w-3.5" /> About Freelancer India
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight">
            India's Freelance{" "}
            <span style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Revolution
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            Freelancer India was built with one goal — to make freelancing fair, fast, and accessible for every skilled professional across India, regardless of where they are.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-3xl font-black mb-1" style={{ color: "var(--t-a1)" }}>{s.value}</div>
              <div className="text-xs text-white/40">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="rounded-3xl p-8 md:p-12 space-y-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 flex items-center justify-center rounded-2xl text-xl" style={{ background: "rgba(var(--t-a1-rgb),0.15)" }}>📖</div>
            <h2 className="text-2xl font-black text-white">Our Story</h2>
          </div>
          <p className="text-white/60 leading-relaxed">
            We started Freelancer India because we saw a gap — skilled developers, designers, writers, and creators across India had no reliable platform built specifically for them. International platforms charged high commissions, had poor UPI support, and were designed for a global audience that didn't reflect India's realities.
          </p>
          <p className="text-white/60 leading-relaxed">
            So we built one from scratch. A platform that speaks your language (literally — we support multiple Indian languages), pays you via UPI in minutes, and connects you with real Indian employers who need exactly what you offer.
          </p>
          <p className="text-white/60 leading-relaxed">
            Today, Freelancer India is growing fast — and we're just getting started. Every feature we build is guided by feedback from our freelancer and employer community.
          </p>
        </div>

        {/* Mission */}
        <div className="text-center space-y-4">
          <Target className="h-10 w-10 mx-auto" style={{ color: "var(--t-a1)" }} />
          <h2 className="text-3xl font-black text-white">Our Mission</h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            To empower every skilled Indian professional to earn independently — with zero barriers, instant payments, and a community they can trust.
          </p>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-3xl font-black text-white text-center mb-10">What We Stand For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(v => (
              <div key={v.title} className="rounded-2xl p-6 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${v.color}20` }}>
                  <v.icon className="h-5 w-5" style={{ color: v.color }} />
                </div>
                <h3 className="font-bold text-white">{v.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <h2 className="text-3xl font-black text-white text-center mb-10">The Team Behind the Platform</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM.map(m => (
              <div key={m.name} className="text-center rounded-2xl p-6 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-4xl">{m.emoji}</div>
                <div>
                  <div className="font-bold text-white text-sm">{m.name}</div>
                  <div className="text-xs text-white/40 mt-0.5">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center rounded-3xl p-10 space-y-5" style={{ background: "linear-gradient(135deg, rgba(var(--t-a1-rgb),0.12), rgba(var(--t-a2-rgb),0.12))", border: "1px solid rgba(var(--t-a1-rgb),0.2)" }}>
          <Star className="h-10 w-10 mx-auto" style={{ color: "var(--t-a1)" }} />
          <h2 className="text-2xl font-black text-white">Join the Community</h2>
          <p className="text-white/50 max-w-lg mx-auto">500+ professionals trust Freelancer India. Be part of the story.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register/employee">
              <button className="rounded-2xl px-6 py-3 font-semibold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>
                Start as Freelancer
              </button>
            </Link>
            <Link to="/register/employer">
              <button className="rounded-2xl px-6 py-3 font-semibold text-white/70 hover:text-white transition-all" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                Hire Talent
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
