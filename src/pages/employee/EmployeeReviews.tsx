import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Star, ThumbsUp, MessageSquare, Award, TrendingUp, Search } from "lucide-react";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", muted: "rgba(255,255,255,.03)" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", muted: "#f1f5f9" },
  wb:    { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", muted: "#f1f5f9" },
  warm:  { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", muted:"#fef3c7", input:"#fffdf7" },
};

const MOCK_REVIEWS = [
  { id: "r1", client: "Arjun K.",      company: "TechCorp Pvt Ltd",       rating: 5, date: "Mar 28, 2026", project: "React Dashboard Development",    comment: "Exceptional work! Delivered ahead of schedule with clean, well-documented code. Would definitely hire again. Very professional and responsive throughout.", avatar: "AK" },
  { id: "r2", client: "Priya M.",      company: "Wellness Brand",          rating: 5, date: "Mar 20, 2026", project: "Logo Design & Brand Identity",    comment: "Creative, modern designs that perfectly captured our brand. Made revisions quickly. Highly recommended!", avatar: "PM" },
  { id: "r3", client: "Rahul S.",      company: "FoodieApp",               rating: 4, date: "Mar 10, 2026", project: "Flutter Food Delivery App",       comment: "Great technical skills and good communication. Minor delay in one milestone but overall a great experience.", avatar: "RS" },
  { id: "r4", client: "Meera R.",      company: "EduTech Solutions",       rating: 5, date: "Feb 28, 2026", project: "Content Writing — AI/ML Blog",    comment: "Outstanding writing quality! Articles were well-researched, SEO-optimized and delivered on time. Will work with again.", avatar: "MR" },
  { id: "r5", client: "Suresh N.",     company: "RetailChain India",       rating: 4, date: "Feb 15, 2026", project: "Tableau Analytics Dashboard",     comment: "Solid Tableau skills and good understanding of business requirements. Dashboard is exactly what we needed.", avatar: "SN" },
  { id: "r6", client: "Kavitha L.",    company: "StartupX",                rating: 5, date: "Jan 30, 2026", project: "WordPress E-commerce Setup",      comment: "Fast, professional, and went above and beyond. The store looks amazing and is performing well.", avatar: "KL" },
];

const RATING_DIST = [
  { stars: 5, count: 4, pct: 67 },
  { stars: 4, count: 2, pct: 33 },
  { stars: 3, count: 0, pct: 0  },
  { stars: 2, count: 0, pct: 0  },
  { stars: 1, count: 0, pct: 0  },
];

const StarRow = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} style={{ width: size, height: size }} fill={i <= rating ? "#fbbf24" : "none"} stroke={i <= rating ? "#fbbf24" : "#6b7280"} />
    ))}
  </div>
);

export default function EmployeeReviews() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const isDark = theme === "black";
  const clrAmber  = isDark ? "#fbbf24" : "#b45309";
  const clrGreen  = isDark ? "#4ade80" : "#16a34a";
  const clrPurple = isDark ? "#a78bfa" : "#7c3aed";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(0);

  const filtered = MOCK_REVIEWS.filter(r => {
    const matchSearch = r.client.toLowerCase().includes(search.toLowerCase()) || r.project.toLowerCase().includes(search.toLowerCase());
    const matchRating = filter === 0 || r.rating === filter;
    return matchSearch && matchRating;
  });

  const avgRating = (MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);
  const card: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 };

  return (
    <div className="min-h-screen pb-10" style={{ background: T.bg, color: T.text }}>
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <h1 className="text-xl font-black" style={{ color: T.text }}>Reviews Received</h1>
        <p className="text-xs mt-0.5" style={{ color: T.sub }}>What clients say about your work</p>
      </div>

      {/* Rating Summary */}
      <div className="px-4 sm:px-6 mb-5">
        <div className="rounded-2xl p-5" style={card}>
          <div className="flex gap-6 items-center">
            <div className="text-center shrink-0">
              <p className="text-5xl font-black" style={{ color: clrAmber }}>{avgRating}</p>
              <StarRow rating={Math.round(Number(avgRating))} size={16} />
              <p className="text-[10px] mt-1" style={{ color: T.sub }}>{MOCK_REVIEWS.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {RATING_DIST.map(d => (
                <div key={d.stars} className="flex items-center gap-2">
                  <span className="text-[10px] w-5 text-right font-semibold" style={{ color: T.sub }}>{d.stars}</span>
                  <Star className="h-3 w-3 shrink-0" fill="#fbbf24" stroke="#fbbf24" />
                  <div className="flex-1 rounded-full overflow-hidden h-1.5" style={{ background: T.muted }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${d.pct}%`, background: "linear-gradient(90deg,#fbbf24,#f59e0b)" }} />
                  </div>
                  <span className="text-[10px] w-4" style={{ color: T.sub }}>{d.count}</span>
                </div>
              ))}
            </div>
            <div className="hidden sm:flex flex-col gap-3">
              {[
                { label: "5-Star Reviews", value: "4", icon: Award,     color: clrAmber },
                { label: "Recommended",    value: "100%", icon: ThumbsUp, color: clrGreen },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
                    <Icon className="h-4 w-4" style={{ color: s.color }} />
                    <div>
                      <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[9px]" style={{ color: T.sub }}>{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-4 sm:px-6 mb-5 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: T.sub }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews..." className="w-full rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }} />
        </div>
        <div className="flex gap-1.5 shrink-0">
          {[0,5,4,3].map(r => (
            <button key={r} onClick={() => setFilter(r)} className="rounded-xl px-3 py-2 text-[10px] font-semibold transition-all" style={{ background: filter === r ? "rgba(251,191,36,.2)" : T.card, border: `1px solid ${filter === r ? "rgba(251,191,36,.4)" : T.border}`, color: filter === r ? clrAmber : T.sub }}>
              {r === 0 ? "All" : `${r}★`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="px-4 sm:px-6 space-y-3">
        {filtered.map((r, i) => (
          <div key={r.id} className="rounded-2xl p-4 transition-all duration-200" style={{ ...card, animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {r.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold" style={{ color: T.text }}>{r.client}</p>
                    <p className="text-[10px]" style={{ color: T.sub }}>{r.company}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StarRow rating={r.rating} size={12} />
                    <p className="text-[10px] mt-0.5" style={{ color: T.sub }}>{r.date}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-2 rounded-lg px-2 py-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold" style={{ background: "rgba(99,102,241,.12)", color: clrPurple }}>
              <MessageSquare className="h-2.5 w-2.5" /> {r.project}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: T.sub }}>"{r.comment}"</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-2xl" style={card}>
            <Star className="h-10 w-10 mx-auto mb-3" style={{ color: T.sub }} />
            <p className="text-sm font-semibold" style={{ color: T.text }}>No reviews found</p>
          </div>
        )}
      </div>
    </div>
  );
}
