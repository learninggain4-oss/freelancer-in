import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Tag, TrendingUp, Search } from "lucide-react";

const THEMES = [
  { id: "midnight", bg: "#070714", bgRgb: "7,7,20",    a1: "#6366f1", a2: "#8b5cf6", a1rgb: "99,102,241",  a2rgb: "139,92,246" },
  { id: "crimson",  bg: "#130a0a", bgRgb: "19,10,10",  a1: "#f43f5e", a2: "#fb923c", a1rgb: "244,63,94",   a2rgb: "251,146,60" },
  { id: "ocean",    bg: "#030d1a", bgRgb: "3,13,26",   a1: "#0ea5e9", a2: "#06b6d4", a1rgb: "14,165,233",  a2rgb: "6,182,212"  },
  { id: "forest",   bg: "#030f0a", bgRgb: "3,15,10",   a1: "#22c55e", a2: "#10b981", a1rgb: "34,197,94",   a2rgb: "16,185,129" },
  { id: "amber",    bg: "#120d02", bgRgb: "18,13,2",   a1: "#f59e0b", a2: "#f97316", a1rgb: "245,158,11",  a2rgb: "249,115,22" },
];

const CATEGORIES = ["All", "Tips & Tricks", "Platform Updates", "Earning Guides", "Success Stories", "Tax & Finance"];

const POSTS = [
  {
    emoji: "💰", tag: "Earning Guides", date: "Apr 2026", readTime: "5 min",
    title: "How to Earn ₹50,000/Month as a Freelancer in India",
    desc: "A step-by-step guide to pricing your skills, building a client pipeline, and consistently reaching ₹50K+ per month on Freelancer India.",
    color: "#34d399",
  },
  {
    emoji: "🛡️", tag: "Platform Updates", date: "Mar 2026", readTime: "3 min",
    title: "Introducing Aadhaar-Based Verification for Faster Trust",
    desc: "We've launched Aadhaar-linked KYC so employers can hire with full confidence and freelancers can unlock higher-value projects faster.",
    color: "#6366f1",
  },
  {
    emoji: "📝", tag: "Tips & Tricks", date: "Mar 2026", readTime: "7 min",
    title: "Write Proposals That Win: A Freelancer's Playbook",
    desc: "Most proposals are ignored because they are generic. Here's a battle-tested framework for writing proposals that employers actually read.",
    color: "#f59e0b",
  },
  {
    emoji: "🌟", tag: "Success Stories", date: "Feb 2026", readTime: "4 min",
    title: "From ₹8,000/month to ₹80,000/month — Arjun's Story",
    desc: "A React developer from Kochi shares how he scaled his freelancing income 10× in 8 months using Freelancer India's project matching tools.",
    color: "#ec4899",
  },
  {
    emoji: "🧾", tag: "Tax & Finance", date: "Feb 2026", readTime: "6 min",
    title: "Freelancer Tax Guide 2026: What You Need to Know",
    desc: "GST, TDS, ITR-4 — we break down the Indian tax system for freelancers in simple language so you can file without stress.",
    color: "#a855f7",
  },
  {
    emoji: "⚡", tag: "Platform Updates", date: "Jan 2026", readTime: "2 min",
    title: "Instant UPI Payouts Are Now Live",
    desc: "No more 2-3 day bank transfer waits. Earnings from approved milestones now hit your UPI ID within minutes — any time of day.",
    color: "#0ea5e9",
  },
  {
    emoji: "🎯", tag: "Tips & Tricks", date: "Jan 2026", readTime: "5 min",
    title: "How to Build a Portfolio That Gets You Hired in 30 Days",
    desc: "New to freelancing? We show you exactly what to put in your portfolio even if you have zero paid projects yet.",
    color: "#fbbf24",
  },
  {
    emoji: "🤝", tag: "Success Stories", date: "Dec 2025", readTime: "4 min",
    title: "How a Hyderabad Startup Found 3 Great Designers in One Week",
    desc: "Learn how an early-stage startup used Freelancer India's verified talent pool to hire vetted designers faster than any other platform.",
    color: "#34d399",
  },
  {
    emoji: "📱", tag: "Platform Updates", date: "Dec 2025", readTime: "2 min",
    title: "The Freelancer India App is Here — Install It Now",
    desc: "Track projects, receive instant payment alerts, and chat with employers — all from a fast, installable PWA that works on any device.",
    color: "#6366f1",
  },
];

export default function Blog() {
  const [activeTab, setActiveTab] = useState("All");
  const [query, setQuery] = useState("");

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
    document.title = "Freelance Blog — Tips, Guides & News India | Freelan Space";
    return () => {
      document.title = "Freelan Space";
      document.body.style.background = "";
    };
  }, []);

  const filtered = POSTS.filter(p =>
    (activeTab === "All" || p.tag === activeTab) &&
    (query === "" || p.title.toLowerCase().includes(query.toLowerCase()) || p.desc.toLowerCase().includes(query.toLowerCase()))
  );

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
          <Link to="/register/freelancer">
            <button className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>
              Get Started
            </button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-24 space-y-12">

        {/* Hero */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300" style={{ background: "rgba(var(--t-a1-rgb),0.12)", border: "1px solid rgba(var(--t-a1-rgb),0.25)" }}>
            <BookOpen className="h-3.5 w-3.5" /> Blog & Resources
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white">
            Learn &amp;{" "}
            <span style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Grow
            </span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">Freelancing tips, earning guides, platform updates, and success stories from the Freelancer India community.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-2xl pl-11 pr-4 py-3 text-sm text-white outline-none placeholder-white/30"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
              style={activeTab === cat
                ? { background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", color: "#fff" }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No articles found for your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(post => (
              <div key={post.title} className="group rounded-2xl overflow-hidden transition-all hover:translate-y-[-2px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-center text-5xl py-10" style={{ background: `linear-gradient(135deg, ${post.color}12, ${post.color}06)`, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {post.emoji}
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: `${post.color}20`, color: post.color }}>
                      <Tag className="inline h-3 w-3 mr-1" />{post.tag}
                    </span>
                    <span className="text-xs text-white/30 flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                    <span className="text-xs text-white/30 ml-auto">{post.date}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm leading-snug group-hover:text-indigo-300 transition-colors">{post.title}</h3>
                  <p className="text-xs text-white/45 leading-relaxed">{post.desc}</p>
                  <div className="pt-2">
                    <span className="text-xs font-semibold cursor-pointer hover:underline" style={{ color: "var(--t-a1)" }}>Read More →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEO Content Section */}
        <div className="space-y-10 rounded-3xl p-8 md:p-12 mt-10" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="text-2xl font-black text-white mb-4">Complete Guide to Freelancing in India</h2>
            <p className="text-white/55 leading-relaxed mb-4">Freelancing in India has evolved dramatically over the last decade. What once was a side hustle for a few tech professionals is now a full-time career for millions. From graphic designers in Pune to data analysts in Hyderabad, Indian freelancers are building thriving businesses on their own terms — choosing their clients, setting their rates, and working on their schedule. This guide covers everything you need to know to start, grow, and sustain a successful freelance career in India.</p>
            <p className="text-white/55 leading-relaxed">Whether you are a beginner wondering how to get your first client, or an experienced professional looking to scale your income, the articles and resources on Freelancer India's blog are written by practitioners who understand the Indian market from the inside.</p>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white mb-6">Top Freelancing Topics We Cover</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { emoji: "💼", title: "Getting Your First Freelance Client", body: "The hardest part of freelancing is landing your first paying client. We cover proven strategies — from optimising your profile on Freelancer India to writing proposals that win, cold outreach templates that work, and how to leverage your existing network to find your first project without spending a rupee on advertising." },
                { emoji: "📊", title: "Freelance Pricing in India", body: "How much should you charge as a freelancer in India? This is one of the most common questions we receive. Our pricing guides break down hourly vs. project-based pricing, how to research market rates for your skill, when to raise your rates, and how to handle clients who negotiate aggressively." },
                { emoji: "📝", title: "Writing Winning Proposals", body: "A great proposal can win a project even against cheaper competition. We break down what clients look for in a proposal, how to structure your bid, what to include in your portfolio, and how to tailor each proposal to the specific project — saving you time while dramatically improving your win rate." },
                { emoji: "💰", title: "Managing Freelance Finances", body: "Income from freelancing is irregular. We publish guides on budgeting for variable income, setting aside money for taxes (including GST registration and filing), creating a financial cushion for slow months, and using Freelancer India's built-in invoicing and wallet tools to stay on top of your cash flow." },
                { emoji: "🚀", title: "Scaling from Freelancer to Agency", body: "Many successful freelancers eventually want to grow beyond a solo practice. We cover the journey from individual freelancer to small agency — how to hire your first sub-contractor, manage a team of freelancers, handle larger enterprise projects, and build a brand that attracts premium clients." },
                { emoji: "🛡️", title: "Client Relationships and Contracts", body: "Client disputes are a reality of freelancing. Our guides help you set up proper contracts, define scope clearly, manage revisions professionally, and use Freelancer India's escrow and milestone systems to protect yourself and your clients through every project stage." },
              ].map(item => (
                <div key={item.title} className="rounded-2xl p-5 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{item.emoji}</span>
                    <h3 className="font-bold text-white text-sm">{item.title}</h3>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white mb-4">Frequently Asked Questions for New Freelancers</h2>
            <div className="space-y-4">
              {[
                { q: "How much can I earn as a freelancer in India?", a: "Earnings vary widely by skill, experience, and niche. Entry-level freelancers typically earn ₹10,000–₹30,000 per month. Experienced professionals in high-demand fields like web development, UI/UX design, or digital marketing can earn ₹80,000–₹3,00,000 per month or more. Building a strong profile with verified skill badges on Freelancer India significantly increases your earning potential." },
                { q: "Do I need to register a business to freelance in India?", a: "No, you can start freelancing as an individual without registering a business. However, if your annual turnover exceeds ₹20 lakhs (₹10 lakhs in some states), GST registration is mandatory. For income tax purposes, freelance income is reported as 'Profits and Gains from Business or Profession' under ITR-3 or ITR-4. Freelancer India generates GST-compliant invoices automatically for all transactions." },
                { q: "What are the best skills to freelance with in India?", a: "High-demand freelance skills in India include: web and mobile app development (React, Flutter, PHP, WordPress), UI/UX design, content writing and copywriting, SEO and digital marketing, video editing and animation, data entry and virtual assistance, accounting and bookkeeping, and online tutoring and coaching. Technology-related skills generally command the highest rates, but non-technical skills with strong portfolios can be equally lucrative." },
                { q: "How do I build a portfolio with no prior clients?", a: "Start by doing 2–3 projects for free or at a discounted rate for local businesses, NGOs, or non-profits. Create personal projects that demonstrate your skills — a website for a fictional brand, a redesigned app for a popular service, a sample content marketing campaign. Document your process and results thoroughly. Upload these to your Freelancer India portfolio with detailed case studies." },
                { q: "How does Freelancer India help me find work?", a: "Freelancer India's smart-match algorithm analyses your skills, experience, and past performance to recommend projects you are likely to win. You can also browse all live projects by category, budget, and keywords. Set up job alerts to be notified instantly when new projects matching your skills are posted. Your verified skill badges and portfolio make your profile stand out to employers." },
              ].map(item => (
                <div key={item.q} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 className="font-bold text-white text-sm mb-2">{item.q}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="rounded-3xl p-8 md:p-12 text-center space-y-5" style={{ background: "linear-gradient(135deg, rgba(var(--t-a1-rgb),0.1), rgba(var(--t-a2-rgb),0.1))", border: "1px solid rgba(var(--t-a1-rgb),0.2)" }}>
          <div className="text-3xl">📬</div>
          <h2 className="text-2xl font-black text-white">Stay in the Loop</h2>
          <p className="text-white/50 max-w-md mx-auto">Get the latest freelancing tips and platform updates delivered to your inbox every week.</p>
          <div className="flex gap-3 max-w-sm mx-auto">
            <input
              placeholder="your@email.com"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white outline-none placeholder-white/30"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            />
            <button className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>
              Subscribe
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
