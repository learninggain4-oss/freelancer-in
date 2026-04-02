import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Clock, FileText, Users, Wallet, Star, MessageCircle, Shield, Search, Zap, Award } from "lucide-react";

const THEMES = [
  { id: "midnight", bg: "#070714", bgRgb: "7,7,20",    a1: "#6366f1", a2: "#8b5cf6", a1rgb: "99,102,241",  a2rgb: "139,92,246" },
  { id: "crimson",  bg: "#130a0a", bgRgb: "19,10,10",  a1: "#f43f5e", a2: "#fb923c", a1rgb: "244,63,94",   a2rgb: "251,146,60" },
  { id: "ocean",    bg: "#030d1a", bgRgb: "3,13,26",   a1: "#0ea5e9", a2: "#06b6d4", a1rgb: "14,165,233",  a2rgb: "6,182,212"  },
  { id: "forest",   bg: "#030f0a", bgRgb: "3,15,10",   a1: "#22c55e", a2: "#10b981", a1rgb: "34,197,94",   a2rgb: "16,185,129" },
  { id: "amber",    bg: "#120d02", bgRgb: "18,13,2",   a1: "#f59e0b", a2: "#f97316", a1rgb: "245,158,11",  a2rgb: "249,115,22" },
];

const FREELANCER_STEPS = [
  { icon: Users,         n: "01", title: "Create Your Profile",       desc: "Sign up free. Add your skills, portfolio, work experience, and profile photo. A complete profile gets 4× more views.", tip: "Add at least 3 portfolio samples", color: "#6366f1" },
  { icon: Award,         n: "02", title: "Get Verified (Optional)",    desc: "Complete a skill test and ID verification to earn your Verified badge. Verified freelancers earn 3× more projects.", tip: "Takes about 30 minutes", color: "#3b82f6" },
  { icon: Search,        n: "03", title: "Browse & Bid on Projects",   desc: "Browse 1,000+ live projects. Filter by category, budget, and deadline. Place a bid with your proposal and price.", tip: "Personalise each proposal", color: "#f59e0b" },
  { icon: MessageCircle, n: "04", title: "Win & Discuss",              desc: "Client reviews proposals and picks you. Chat directly in the platform. Clarify scope, share files, agree on milestones.", tip: "Respond within 1 hour for best results", color: "#ec4899" },
  { icon: Zap,           n: "05", title: "Complete Milestones",        desc: "Work through agreed milestones. Submit deliverables. Client reviews and approves each stage before releasing payment.", tip: "Always deliver before the deadline", color: "#34d399" },
  { icon: Wallet,        n: "06", title: "Get Paid & Earn Reviews",    desc: "Payment is released from escrow to your wallet. Withdraw via UPI or bank. Rate your client and get a review.", tip: "A 5★ review brings more clients", color: "#a855f7" },
  { icon: Star,          n: "07", title: "Build Your Reputation",      desc: "With each project, your profile score grows. Earn badges, climb the leaderboard, and unlock better clients and higher rates.", tip: "Aim for Top Rated within 12 months", color: "#fbbf24" },
];

const CLIENT_STEPS = [
  { icon: FileText,  n: "01", title: "Post a Project",          desc: "Describe what you need, set your budget and deadline. Use our Project Brief Generator to auto-fill the details in under 3 minutes.", tip: "Be specific — better briefs get better proposals", color: "#6366f1" },
  { icon: Users,     n: "02", title: "Review Proposals",        desc: "Receive bids from verified freelancers within hours. Browse their profiles, portfolios, past reviews, and proposed price.", tip: "Shortlist top 3-5 candidates", color: "#3b82f6" },
  { icon: MessageCircle, n: "03", title: "Interview & Select",  desc: "Chat with shortlisted freelancers. Ask questions, request samples. Select the best fit and agree on project details.", tip: "Good communication = better results", color: "#f59e0b" },
  { icon: Shield,    n: "04", title: "Fund Escrow",             desc: "Deposit payment into our secure escrow. Your money is protected — the freelancer cannot access it until you approve the work.", tip: "Escrow protects both parties", color: "#ec4899" },
  { icon: Zap,       n: "05", title: "Receive Deliverables",    desc: "Freelancer submits work via the platform. Review it carefully. Request revisions if needed — most plans include 2 free revision rounds.", tip: "Use the revision feature freely", color: "#34d399" },
  { icon: CheckCircle, n: "06", title: "Approve & Release",    desc: "Satisfied with the work? Approve it and payment is instantly released. Leave a review to help other clients find great talent.", tip: "Honest reviews help the community", color: "#a855f7" },
];

const TIPS = [
  { icon: "💡", title: "Complete your profile 100%", desc: "Freelancers with complete profiles get 4× more project invitations." },
  { icon: "⚡", title: "Respond fast", desc: "Freelancers who respond within 1 hour win 60% more projects." },
  { icon: "📋", title: "Write specific proposals", desc: "Generic bids are ignored. Address the client's exact problem." },
  { icon: "🎯", title: "Start with smaller projects", desc: "Build your first 5 reviews with smaller projects, then target bigger ones." },
  { icon: "🛡️", title: "Get verified", desc: "Verified freelancers earn 3× more than unverified ones." },
  { icon: "💬", title: "Communicate proactively", desc: "Update clients before they ask. This earns you 5★ communication ratings." },
];

export default function HowItWorks() {
  const [tab, setTab] = useState<"freelancer" | "client">("freelancer");

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
    document.title = "How It Works | Freelancer India | Start Freelancing in Minutes";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Learn how Freelancer India works. Create your profile, browse projects, bid, get hired, and get paid via UPI — all in one platform. Step-by-step guide for freelancers and clients.");
    return () => {
      document.title = "Freelancer India — Hire Top Indian Freelancers | UPI Payments | ₹0 Commission (3 Months)";
      document.body.style.background = "";
    };
  }, []);

  const steps = tab === "freelancer" ? FREELANCER_STEPS : CLIENT_STEPS;

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
          <Link to="/register/employee"><button className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>Get Started</button></Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(var(--t-a1-rgb),0.1) 0%, transparent 70%)" }} />
        <div className="mx-auto max-w-3xl relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: "rgba(var(--t-a1-rgb),0.12)", border: "1px solid rgba(var(--t-a1-rgb),0.25)", color: "var(--t-a1)" }}>
            <Zap className="h-3.5 w-3.5" /> Platform Guide
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-tight">
            How It <span style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Works</span>
          </h1>
          <p className="text-white/55 text-lg mb-8">A step-by-step guide for freelancers and clients on the Freelancer India platform.</p>
          {/* Tab selector */}
          <div className="inline-flex rounded-2xl p-1 gap-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {(["freelancer", "client"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="rounded-xl px-7 py-2.5 text-sm font-semibold transition-all capitalize" style={{ background: tab === t ? "rgba(var(--t-a1-rgb),0.2)" : "transparent", color: tab === t ? "var(--t-a1)" : "rgba(255,255,255,0.5)", border: tab === t ? "1px solid rgba(var(--t-a1-rgb),0.35)" : "1px solid transparent" }}>
                I'm a {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-8 bottom-8 w-px hidden sm:block" style={{ background: "linear-gradient(to bottom, rgba(var(--t-a1-rgb),0.4), rgba(var(--t-a2-rgb),0.2))" }} />
            <div className="space-y-5">
              {steps.map((step, i) => (
                <div key={step.n} className="relative flex gap-5 sm:gap-8 items-start">
                  {/* Icon circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg" style={{ background: `${step.color}20`, border: `1px solid ${step.color}40`, boxShadow: `0 0 20px ${step.color}20` }}>
                      <step.icon className="h-5 w-5" style={{ color: step.color }} />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black text-white" style={{ background: step.color }}>{i + 1}</span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                      <h3 className="text-base font-black text-white">{step.title}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: `${step.color}15`, color: step.color, border: `1px solid ${step.color}25` }}>
                        💡 {step.tip}
                      </span>
                    </div>
                    <p className="text-sm text-white/55 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pro Tips */}
      {tab === "freelancer" && (
        <section className="px-4 sm:px-6 py-16" style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-black text-white text-center mb-8">Pro Tips to Win More Projects</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TIPS.map(tip => (
                <div key={tip.title} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{tip.icon}</span>
                    <h3 className="text-sm font-bold text-white">{tip.title}</h3>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick stats */}
      <section className="px-4 sm:px-6 py-14 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ["< 2hrs", "First proposals received"],
              ["₹0", "Cost to post a project"],
              ["48hrs", "Average project start"],
              ["4.8★", "Average client satisfaction"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-2xl font-black mb-1" style={{ color: "var(--t-a1)" }}>{v}</div>
                <div className="text-xs text-white/40">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl p-8" style={{ background: "linear-gradient(135deg, rgba(var(--t-a1-rgb),0.12), rgba(var(--t-a2-rgb),0.12))", border: "1px solid rgba(var(--t-a1-rgb),0.25)" }}>
            <h2 className="text-2xl font-black text-white mb-2">Ready to {tab === "freelancer" ? "Start Earning?" : "Hire Top Talent?"}</h2>
            <p className="text-white/50 text-sm mb-6">{tab === "freelancer" ? "Create your free profile in 5 minutes." : "Post your project for free in 3 minutes."}</p>
            <Link to={tab === "freelancer" ? "/register/employee" : "/register/employer"}>
              <button className="rounded-2xl px-8 py-3.5 text-sm font-semibold text-white hover:scale-105 transition-all" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", boxShadow: "0 0 24px rgba(var(--t-a1-rgb),0.3)" }}>
                {tab === "freelancer" ? "Join as Freelancer →" : "Post a Project Free →"}
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
