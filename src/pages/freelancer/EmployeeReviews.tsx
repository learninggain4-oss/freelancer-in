import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ThumbsUp, MessageSquare, Award, TrendingUp, Search } from "lucide-react";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", muted: "rgba(255,255,255,.03)" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", muted: "#f1f5f9" },
  wb:    { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", muted: "#f1f5f9" },
  warm:  { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", muted:"#fef3c7", input:"#fffdf7" },
  forest: { bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", muted:"#dcfce7", input:"#ffffff" },
  ocean: { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", muted:"#e0f2fe", input:"#ffffff" },
};


const StarRow = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} style={{ width: size, height: size }} fill={i <= rating ? "#fbbf24" : "none"} stroke={i <= rating ? "#fbbf24" : "#6b7280"} />
    ))}
  </div>
);

export default function EmployeeReviews() {
  const { profile } = useAuth();
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const isDark = theme === "black";
  const clrAmber  = isDark ? "#fbbf24" : "#b45309";
  const clrGreen  = isDark ? "#4ade80" : "#16a34a";
  const clrPurple = isDark ? "#a78bfa" : "#7c3aed";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(0);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["freelancer-reviews", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("*, reviewer:profiles!reviews_reviewer_id_fkey(full_name), project:projects!reviews_project_id_fkey(title)")
        .eq("reviewee_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.id,
  });

  const filtered = useMemo(() => reviews.filter((r: any) => {
    const reviewerName = Array.isArray(r.reviewer?.full_name) ? r.reviewer.full_name[0] : (r.reviewer?.full_name ?? "");
    const projectTitle = r.project?.title ?? "";
    const matchSearch = reviewerName.toLowerCase().includes(search.toLowerCase()) || projectTitle.toLowerCase().includes(search.toLowerCase());
    const matchRating = filter === 0 || r.rating === filter;
    return matchSearch && matchRating;
  }), [reviews, search, filter]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const ratingDist = useMemo(() => [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter((r: any) => r.rating === stars).length;
    const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { stars, count, pct };
  }), [reviews]);
  const card: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 };

  return (
    <div className="min-h-screen pb-24" style={{ background: T.bg, color: T.text }}>
      {/* Gradient Hero */}
      <div className="px-4 sm:px-6 pt-6 mb-5">
        <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #0ea5e9 100%)" }} className="relative overflow-hidden rounded-3xl p-6 shadow-2xl">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,.08)" }} />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,.04)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl" style={{ background: "rgba(255,255,255,.2)", backdropFilter: "blur(12px)" }}>
                <Star className="h-7 w-7" style={{ color: "white", fill: "rgba(255,255,255,.5)" }} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: "white" }}>Reviews Received</h1>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.75)" }}>What employers say about you</p>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {[
                { label: "Avg Rating",    value: avgRating },
                { label: "Total Reviews", value: reviews.length },
                { label: "5-Star",        value: reviews.filter((r: any) => r.rating === 5).length },
                { label: "Recommended",   value: reviews.length > 0 ? `${Math.round((reviews.filter((r: any) => r.rating >= 4).length / reviews.length) * 100)}%` : "—" },
              ].map(s => (
                <div key={s.label} className="shrink-0 rounded-2xl px-4 py-2.5 min-w-[72px]" style={{ background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)" }}>
                  <p className="text-xl font-black" style={{ color: "white" }}>{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,.7)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Summary */}
      <div className="px-4 sm:px-6 mb-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(251,191,36,.15)" }}>
            <TrendingUp className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />
          </div>
          <h3 className="text-sm font-black" style={{ color: T.text }}>Rating Breakdown</h3>
        </div>
        <div className="rounded-2xl p-5" style={card}>
          <div className="flex gap-6 items-center">
            <div className="text-center shrink-0">
              <p className="text-5xl font-black" style={{ color: clrAmber }}>{avgRating}</p>
              <StarRow rating={Math.round(Number(avgRating))} size={16} />
              <p className="text-[10px] mt-1" style={{ color: T.sub }}>{reviews.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingDist.map(d => (
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
                { label: "5-Star Reviews", value: String(reviews.filter((r: any) => r.rating === 5).length), icon: Award,     color: clrAmber },
                { label: "Recommended",    value: reviews.length > 0 ? `${Math.round((reviews.filter((r: any) => r.rating >= 4).length / reviews.length) * 100)}%` : "—", icon: ThumbsUp, color: clrGreen },
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
      <div className="px-4 sm:px-6 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,.15)" }}>
            <MessageSquare className="h-3.5 w-3.5" style={{ color: "#6366f1" }} />
          </div>
          <h3 className="text-sm font-black" style={{ color: T.text }}>
            {filtered.length} Review{filtered.length !== 1 ? "s" : ""}
          </h3>
        </div>
      </div>
      <div className="px-4 sm:px-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={card}>
            <Star className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: T.sub }} />
            <p className="text-sm font-semibold" style={{ color: T.text }}>
              {reviews.length === 0 ? "No reviews yet" : "No reviews found"}
            </p>
            <p className="text-[11px] mt-1" style={{ color: T.sub }}>
              {reviews.length === 0 ? "Complete projects to receive your first review" : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          filtered.map((r: any, i: number) => {
            const reviewerName = Array.isArray(r.reviewer?.full_name) ? r.reviewer.full_name[0] : (r.reviewer?.full_name ?? "Employer");
            const projectTitle = r.project?.title ?? "Project";
            const initials = reviewerName.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "E";
            const dateStr = new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
            return (
              <div key={r.id} className="rounded-2xl p-4 transition-all duration-200" style={{ ...card, animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold" style={{ color: T.text }}>{reviewerName}</p>
                        <p className="text-[10px]" style={{ color: T.sub }}>Employer</p>
                      </div>
                      <div className="text-right shrink-0">
                        <StarRow rating={r.rating} size={12} />
                        <p className="text-[10px] mt-0.5" style={{ color: T.sub }}>{dateStr}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-2 rounded-lg px-2 py-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold" style={{ background: "rgba(99,102,241,.12)", color: clrPurple }}>
                  <MessageSquare className="h-2.5 w-2.5" /> {projectTitle}
                </div>
                {r.comment && <p className="text-xs leading-relaxed" style={{ color: T.sub }}>"{r.comment}"</p>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
