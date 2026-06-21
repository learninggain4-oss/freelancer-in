import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Briefcase, MapPin, Clock, Users, Zap, Heart, Globe, ArrowRight, Mail } from "lucide-react";

const THEMES = [
  { id: "midnight", bg: "#070714", bgRgb: "7,7,20",    a1: "#6366f1", a2: "#8b5cf6", a1rgb: "99,102,241",  a2rgb: "139,92,246" },
  { id: "crimson",  bg: "#130a0a", bgRgb: "19,10,10",  a1: "#f43f5e", a2: "#fb923c", a1rgb: "244,63,94",   a2rgb: "251,146,60" },
  { id: "ocean",    bg: "#030d1a", bgRgb: "3,13,26",   a1: "#0ea5e9", a2: "#06b6d4", a1rgb: "14,165,233",  a2rgb: "6,182,212"  },
  { id: "forest",   bg: "#030f0a", bgRgb: "3,15,10",   a1: "#22c55e", a2: "#10b981", a1rgb: "34,197,94",   a2rgb: "16,185,129" },
  { id: "amber",    bg: "#120d02", bgRgb: "18,13,2",   a1: "#f59e0b", a2: "#f97316", a1rgb: "245,158,11",  a2rgb: "249,115,22" },
];

const PERKS = [
  { icon: Globe,   color: "#6366f1", title: "Remote First",        desc: "Work from anywhere in India. We are a fully remote team." },
  { icon: Zap,     color: "#f59e0b", title: "Fast Growth",         desc: "We move fast. Your ideas ship in days, not months." },
  { icon: Heart,   color: "#ec4899", title: "Mission-Driven",      desc: "Help millions of Indians earn independently. Real impact, every day." },
  { icon: Users,   color: "#34d399", title: "Small Team, Big Impact", desc: "Work closely with founders. No bureaucracy, no silos." },
];

const OPENINGS = [
  {
    title: "Full-Stack Engineer (Node.js + React)",
    team: "Engineering", type: "Full-time", location: "Remote — India",
    desc: "Build and scale the core Freelancer India platform. You'll own features end-to-end, from API design to frontend polish.",
    tags: ["Node.js", "React", "PostgreSQL", "TypeScript"],
    color: "#6366f1",
  },
  {
    title: "Product Designer (UI/UX)",
    team: "Design", type: "Full-time", location: "Remote — India",
    desc: "Design intuitive flows for freelancers and employers. You care deeply about clarity, accessibility, and Indian user behaviour.",
    tags: ["Figma", "User Research", "Design Systems"],
    color: "#ec4899",
  },
  {
    title: "Community Manager",
    team: "Growth", type: "Full-time", location: "Remote — India",
    desc: "Build and nurture our freelancer community — onboarding, events, webinars, and helping members succeed.",
    tags: ["Community Building", "Content", "Social Media"],
    color: "#34d399",
  },
  {
    title: "Trust & Safety Analyst",
    team: "Operations", type: "Full-time", location: "Remote — India",
    desc: "Review verifications, investigate disputes, and keep the platform safe for everyone. Detail-oriented and fair-minded.",
    tags: ["KYC", "Policy", "Dispute Resolution"],
    color: "#f59e0b",
  },
  {
    title: "Growth & Partnerships",
    team: "Business", type: "Full-time", location: "Remote — India",
    desc: "Identify and onboard employer accounts. Build partnerships with agencies, startups, and SMEs across India.",
    tags: ["Sales", "Partnerships", "B2B"],
    color: "#a855f7",
  },
  {
    title: "Customer Support Specialist",
    team: "Support", type: "Full-time", location: "Remote — India",
    desc: "Be the first line of support for freelancers and employers — resolving payment, project, and account issues with empathy.",
    tags: ["Customer Support", "Hindi/English", "Empathy"],
    color: "#0ea5e9",
  },
];

export default function Careers() {
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
    document.title = "Careers | Freelancer India";
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
          <a href="mailto:careers@freelancer.in">
            <button className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>
              Apply Now
            </button>
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 md:py-24 space-y-20">

        {/* Hero */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300" style={{ background: "rgba(var(--t-a1-rgb),0.12)", border: "1px solid rgba(var(--t-a1-rgb),0.25)" }}>
            <Briefcase className="h-3.5 w-3.5" /> Join Our Team
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight">
            Build the Future of{" "}
            <span style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Indian Freelancing
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            We're a small, passionate team building the platform that will define how India works independently. Every role here is impactful, fast-moving, and remote-first.
          </p>
        </div>

        {/* Perks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PERKS.map(p => (
            <div key={p.title} className="rounded-2xl p-6 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${p.color}20` }}>
                <p.icon className="h-5 w-5" style={{ color: p.color }} />
              </div>
              <div className="font-bold text-white text-sm">{p.title}</div>
              <div className="text-xs text-white/45 leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>

        {/* Open Roles */}
        <div>
          <h2 className="text-3xl font-black text-white mb-10">Open Roles</h2>
          <div className="space-y-4">
            {OPENINGS.map(job => (
              <div key={job.title} className="group rounded-2xl p-6 transition-all hover:translate-x-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={{ background: `${job.color}20`, color: job.color }}>{job.team}</span>
                      <span className="flex items-center gap-1 text-xs text-white/40"><Clock className="h-3 w-3" />{job.type}</span>
                      <span className="flex items-center gap-1 text-xs text-white/40"><MapPin className="h-3 w-3" />{job.location}</span>
                    </div>
                    <h3 className="font-bold text-white text-lg">{job.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{job.desc}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {job.tags.map(tag => (
                        <span key={tag} className="text-xs rounded-full px-2.5 py-0.5 text-white/50" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <a href={`mailto:careers@freelancer.in?subject=Application: ${job.title}`} className="shrink-0">
                    <button className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>
                      Apply <ArrowRight className="h-4 w-4" />
                    </button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Don't see your role */}
        <div className="rounded-3xl p-8 md:p-12 text-center space-y-5" style={{ background: "linear-gradient(135deg, rgba(var(--t-a1-rgb),0.1), rgba(var(--t-a2-rgb),0.1))", border: "1px solid rgba(var(--t-a1-rgb),0.2)" }}>
          <div className="text-3xl">🚀</div>
          <h2 className="text-2xl font-black text-white">Don't See Your Role?</h2>
          <p className="text-white/50 max-w-md mx-auto">We're always looking for exceptional people. Send us your profile and tell us how you'd contribute.</p>
          <a href="mailto:careers@freelancer.in?subject=General Application">
            <button className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>
              <Mail className="h-4 w-4" /> Send an Open Application
            </button>
          </a>
        </div>

      </div>
    </div>
  );
}
