import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, MessageCircle, BookOpen, Star, MapPin, Calendar, Globe, Heart, Zap } from "lucide-react";

const THEMES = [
  { id: "midnight", bg: "#070714", bgRgb: "7,7,20",    a1: "#6366f1", a2: "#8b5cf6", a1rgb: "99,102,241",  a2rgb: "139,92,246" },
  { id: "crimson",  bg: "#130a0a", bgRgb: "19,10,10",  a1: "#f43f5e", a2: "#fb923c", a1rgb: "244,63,94",   a2rgb: "251,146,60" },
  { id: "ocean",    bg: "#030d1a", bgRgb: "3,13,26",   a1: "#0ea5e9", a2: "#06b6d4", a1rgb: "14,165,233",  a2rgb: "6,182,212"  },
  { id: "forest",   bg: "#030f0a", bgRgb: "3,15,10",   a1: "#22c55e", a2: "#10b981", a1rgb: "34,197,94",   a2rgb: "16,185,129" },
  { id: "amber",    bg: "#120d02", bgRgb: "18,13,2",   a1: "#f59e0b", a2: "#f97316", a1rgb: "245,158,11",  a2rgb: "249,115,22" },
];

const SKILL_GROUPS = [
  { name: "Flutter & Mobile Dev",  members: 3420, color: "#6366f1", icon: "📱", lang: "Hindi/English" },
  { name: "React & Next.js India", members: 2890, color: "#3b82f6", icon: "⚛️", lang: "English"       },
  { name: "UI/UX Kerala",          members: 1640, color: "#ec4899", icon: "🎨", lang: "Malayalam"     },
  { name: "Content Writers Hub",   members: 2210, color: "#f59e0b", icon: "✍️", lang: "Multi-lingual" },
  { name: "Digital Marketing IN",  members: 3050, color: "#34d399", icon: "📣", lang: "Hindi/English" },
  { name: "Data Science Club",     members: 1870, color: "#a855f7", icon: "📊", lang: "English"       },
  { name: "Freelance Finance",     members: 1230, color: "#fbbf24", icon: "💰", lang: "Hindi/English" },
  { name: "Women in Freelancing",  members: 2100, color: "#f43f5e", icon: "👩‍💻", lang: "Multi-lingual" },
  { name: "Malayalam Tech",        members: 940,  color: "#0ea5e9", icon: "🌴", lang: "Malayalam"     },
  { name: "Video & Animation",     members: 1560, color: "#fb923c", icon: "🎬", lang: "English/Hindi" },
  { name: "Python & AI India",     members: 2670, color: "#22c55e", icon: "🤖", lang: "English"       },
  { name: "Tamil Nadu Freelancers",members: 1380, color: "#06b6d4", icon: "🎯", lang: "Tamil/English" },
];

const WEBINARS = [
  { title: "How to Price Your Freelance Services in 2026",   date: "Apr 10, 2026", time: "7:00 PM IST", lang: "English",   speaker: "Rahul M., Top Rated Dev",     attendees: 340 },
  { title: "GST Filing for Freelancers — Step by Step",      date: "Apr 13, 2026", time: "6:30 PM IST", lang: "Hindi",     speaker: "Priya CA, Tax Expert",        attendees: 520 },
  { title: "Building a Portfolio That Wins Clients",          date: "Apr 16, 2026", time: "8:00 PM IST", lang: "English",   speaker: "Sneha R., UI/UX Designer",    attendees: 280 },
  { title: "Malayalam Freelancers: ആദ്യ Project എങ്ങനെ?",   date: "Apr 19, 2026", time: "7:30 PM IST", lang: "Malayalam", speaker: "Arun P., Kerala Dev",         attendees: 190 },
  { title: "Client Communication Masterclass",               date: "Apr 22, 2026", time: "7:00 PM IST", lang: "English",   speaker: "Meera N., Top Communicator",  attendees: 410 },
];

const MEETUPS = [
  { city: "Kochi",     state: "Kerala",         date: "Apr 20",  members: 120, color: "#6366f1" },
  { city: "Bangalore", state: "Karnataka",      date: "Apr 27",  members: 240, color: "#3b82f6" },
  { city: "Mumbai",    state: "Maharashtra",    date: "May 4",   members: 310, color: "#ec4899" },
  { city: "Delhi",     state: "NCR",            date: "May 11",  members: 280, color: "#f59e0b" },
  { city: "Chennai",   state: "Tamil Nadu",     date: "May 18",  members: 160, color: "#34d399" },
  { city: "Hyderabad", state: "Telangana",      date: "May 25",  members: 200, color: "#a855f7" },
];

const COMMUNITY_VALUES = [
  { icon: Heart,   title: "Supportive",   desc: "A safe space to ask questions, share wins, and get help without judgment." },
  { icon: Globe,   title: "Inclusive",    desc: "12+ languages. Every skill level. Every state in India. All are welcome." },
  { icon: Zap,     title: "Actionable",   desc: "Real advice from real freelancers — no fluff, no generic tips." },
  { icon: Star,    title: "Growth-first", desc: "We celebrate every milestone — first project, first ₹1L, first Top Rated." },
];

export default function Community() {
  const [searchGroup, setSearchGroup] = useState("");

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
    document.title = "Community | Freelancer India | 25,000+ Indian Freelancers";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Join India's most active freelancing community. 120+ skill groups, weekly webinars, local meetups in Kerala, Bangalore, Mumbai, Delhi. Network with 25,000+ Indian freelancers.");
    return () => {
      document.title = "Freelancer India — Hire Top Indian Freelancers | UPI Payments | ₹0 Commission (3 Months)";
      document.body.style.background = "";
    };
  }, []);

  const filtered = SKILL_GROUPS.filter(g =>
    g.name.toLowerCase().includes(searchGroup.toLowerCase())
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
          <Link to="/register/employee"><button className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>Join Community</button></Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(var(--t-a1-rgb),0.1) 0%, transparent 70%)" }} />
        <div className="mx-auto max-w-3xl relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: "rgba(var(--t-a1-rgb),0.12)", border: "1px solid rgba(var(--t-a1-rgb),0.25)", color: "var(--t-a1)" }}>
            <Users className="h-3.5 w-3.5" /> 25,000+ Members
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-tight">
            You're Never <span style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Alone</span>
          </h1>
          <p className="text-white/55 text-lg mb-10">Join India's most active freelancing community — skill groups, live webinars, local meetups, and genuine support.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[["25,000+","Members"],["120+","Skill Groups"],["48/mo","Webinars"],["500+","Daily Posts"]].map(([v, l]) => (
              <div key={l} className="rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-xl font-black mb-0.5" style={{ color: "var(--t-a1)" }}>{v}</div>
                <div className="text-xs text-white/40">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Values */}
      <section className="px-4 sm:px-6 py-14" style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-black text-white text-center mb-8">Our Community Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMMUNITY_VALUES.map(v => (
              <div key={v.title} className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "rgba(var(--t-a1-rgb),0.15)" }}>
                  <v.icon className="h-5 w-5" style={{ color: "var(--t-a1)" }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{v.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Groups */}
      <section className="px-4 sm:px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-2"><BookOpen className="h-6 w-6" style={{ color: "var(--t-a1)" }} /> Skill Groups</h2>
            <input
              placeholder="Search groups..."
              value={searchGroup}
              onChange={e => setSearchGroup(e.target.value)}
              className="rounded-xl px-4 py-2 text-sm text-white outline-none w-48"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
            />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(g => (
              <div key={g.name} className="group flex items-center gap-4 rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ background: `${g.color}18` }}>{g.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{g.name}</h3>
                  <p className="text-xs text-white/40">{g.members.toLocaleString("en-IN")} members · {g.lang}</p>
                </div>
                <Link to="/register/employee">
                  <button className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold text-white" style={{ background: g.color }}>Join</button>
                </Link>
              </div>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-center text-white/30 py-8">No groups found for "{searchGroup}"</p>}
        </div>
      </section>

      {/* Webinars */}
      <section className="px-4 sm:px-6 py-16" style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-8"><Calendar className="h-6 w-6" style={{ color: "var(--t-a1)" }} /> Upcoming Webinars</h2>
          <div className="space-y-4">
            {WEBINARS.map((w, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-white">{w.title}</h3>
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: "rgba(var(--t-a1-rgb),0.15)", color: "var(--t-a1)", border: "1px solid rgba(var(--t-a1-rgb),0.25)" }}>{w.lang}</span>
                  </div>
                  <p className="text-xs text-white/40">{w.speaker} · {w.date} · {w.time}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 flex items-center gap-1"><Users className="h-3 w-3" /> {w.attendees} registered</span>
                  <Link to="/register/employee">
                    <button className="rounded-xl px-4 py-1.5 text-xs font-bold text-white whitespace-nowrap" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>Register Free</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Meetups */}
      <section className="px-4 sm:px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-8"><MapPin className="h-6 w-6" style={{ color: "var(--t-a1)" }} /> Local Meetups</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MEETUPS.map(m => (
              <div key={m.city} className="rounded-2xl p-5" style={{ background: `${m.color}0a`, border: `1px solid ${m.color}25` }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-black text-white">{m.city}</h3>
                    <p className="text-xs text-white/40">{m.state}</p>
                  </div>
                  <span className="text-xs font-bold rounded-full px-3 py-1" style={{ background: `${m.color}18`, color: m.color }}>{m.date}</span>
                </div>
                <p className="text-xs text-white/45 mb-3">{m.members} freelancers attending</p>
                <Link to="/register/employee">
                  <button className="w-full rounded-xl py-1.5 text-xs font-bold text-white" style={{ background: m.color }}>RSVP Free</button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/30 mt-6">More cities coming soon — Pune, Ahmedabad, Jaipur, Lucknow</p>
        </div>
      </section>

      {/* Community rules */}
      <section className="px-4 sm:px-6 py-14" style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-black text-white mb-6">Community Guidelines</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-left">
            {[
              ["✅", "Be respectful and kind to all members"],
              ["✅", "Share knowledge freely — no gatekeeping"],
              ["✅", "Give constructive feedback, not harsh criticism"],
              ["✅", "Credit others' work and ideas properly"],
              ["🚫", "No spam or self-promotion outside designated channels"],
              ["🚫", "No hate speech, discrimination, or harassment"],
            ].map(([icon, rule]) => (
              <div key={rule} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-base">{icon}</span>
                <p className="text-xs text-white/60">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl p-8" style={{ background: "linear-gradient(135deg, rgba(var(--t-a1-rgb),0.12), rgba(var(--t-a2-rgb),0.12))", border: "1px solid rgba(var(--t-a1-rgb),0.25)" }}>
            <div className="text-4xl mb-3">🤝</div>
            <h2 className="text-2xl font-black text-white mb-2">Join 25,000+ Freelancers</h2>
            <p className="text-white/50 text-sm mb-6">Free membership. Access all groups, webinars, and meetups.</p>
            <Link to="/register/employee">
              <button className="rounded-2xl px-8 py-3.5 text-sm font-semibold text-white hover:scale-105 transition-all" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", boxShadow: "0 0 24px rgba(var(--t-a1-rgb),0.3)" }}>
                Join the Community →
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
