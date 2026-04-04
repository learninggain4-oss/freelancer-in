import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send, Clock, CheckCircle, XCircle, Trophy, Search, Filter,
  ChevronDown, IndianRupee, Calendar, FileText, Copy, Plus, Trash2,
  Briefcase, TrendingUp, Target, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)", muted: "rgba(255,255,255,.03)" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", muted: "#f1f5f9" },
  wb:    { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", muted: "#f1f5f9" },
  warm:  { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", muted:"#fef3c7", input:"#fffdf7" },
  forest: { bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", muted:"#dcfce7", input:"#ffffff" },
  ocean: { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", muted:"#e0f2fe", input:"#ffffff" },
};

const getStatusConfig = (isDark: boolean): Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> => ({
  pending:      { label: "Pending",     color: isDark ? "#fbbf24" : "#b45309", bg: "rgba(251,191,36,.15)",  icon: Clock },
  shortlisted:  { label: "Shortlisted", color: isDark ? "#60a5fa" : "#2563eb", bg: "rgba(96,165,250,.15)",  icon: TrendingUp },
  approved:     { label: "Won",         color: isDark ? "#4ade80" : "#16a34a", bg: "rgba(74,222,128,.15)",  icon: Trophy },
  rejected:     { label: "Rejected",    color: isDark ? "#f87171" : "#dc2626", bg: "rgba(248,113,113,.15)", icon: XCircle },
  job_confirmed:{ label: "Confirmed",   color: isDark ? "#a78bfa" : "#7c3aed", bg: "rgba(167,139,250,.15)", icon: CheckCircle },
  completed:    { label: "Completed",   color: isDark ? "#4ade80" : "#16a34a", bg: "rgba(74,222,128,.15)",  icon: CheckCircle },
});

const DEFAULT_TEMPLATES = [
  { id: "1", name: "React Developer Pitch", text: "Hi, I'm a React developer with 4+ years of experience building scalable web applications. I've reviewed your requirements and I'm confident I can deliver a high-quality solution within your timeline. I work with clean, maintainable code and provide regular progress updates.\n\nLet's discuss the project further!" },
  { id: "2", name: "Quick Intro",           text: "Hello! I'm interested in your project and believe my skills are a great match. I have relevant experience and can start immediately. Please check my profile for portfolio samples." },
  { id: "3", name: "Design Specialist",     text: "Hi there! I'm a UI/UX designer specializing in modern, user-centric interfaces. I use Figma for prototyping and deliver pixel-perfect designs. I'd love to bring your vision to life!" },
];

const MOCK_BIDS = [
  { id: "b1", title: "React Dashboard for Logistics Startup",  category: "Development", budget: "₹35,000", status: "approved",     bidAmount: "₹32,000", postedDate: "2 days ago", deadline: "3 weeks" },
  { id: "b2", title: "Logo Design for Wellness Brand",          category: "Design",       budget: "₹6,500",  status: "pending",      bidAmount: "₹6,000",  postedDate: "4 days ago", deadline: "1 week"  },
  { id: "b3", title: "Google Ads Campaign Management",          category: "Marketing",    budget: "₹18,000", status: "shortlisted",  bidAmount: "₹16,500", postedDate: "5 days ago", deadline: "1 month" },
  { id: "b4", title: "Node.js REST API Development",            category: "Backend",      budget: "₹40,000", status: "rejected",     bidAmount: "₹38,000", postedDate: "1 week ago", deadline: "4 weeks" },
  { id: "b5", title: "Flutter App for Food Delivery",           category: "Mobile",       budget: "₹65,000", status: "job_confirmed",bidAmount: "₹62,000", postedDate: "1 week ago", deadline: "6 weeks" },
  { id: "b6", title: "WordPress E-commerce Setup + Theme",      category: "Web",          budget: "₹9,000",  status: "completed",    bidAmount: "₹8,500",  postedDate: "2 weeks ago",deadline: "2 weeks" },
  { id: "b7", title: "Technical Blog Writing — AI/ML",          category: "Content",      budget: "₹15,000", status: "pending",      bidAmount: "₹14,000", postedDate: "3 days ago", deadline: "2 weeks" },
  { id: "b8", title: "Tableau Dashboard for Retail Chain",      category: "Analytics",    budget: "₹19,000", status: "pending",      bidAmount: "₹18,000", postedDate: "1 day ago",  deadline: "3 weeks" },
];

export default function EmployeeBids() {
  const { profile } = useAuth();
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const isDark = theme === "black";
  const STATUS_CONFIG = getStatusConfig(isDark);
  const clrGreen = isDark ? "#4ade80" : "#16a34a";
  const clrAmber = isDark ? "#fbbf24" : "#b45309";
  const clrPurple = isDark ? "#a78bfa" : "#7c3aed";
  const clrIndigo = isDark ? "#818cf8" : "#4f46e5";

  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [showTemplates, setShowT] = useState(false);
  const [newTplName, setNewTplName]   = useState("");
  const [newTplText, setNewTplText]   = useState("");
  const [addingTpl, setAddingTpl]     = useState(false);

  const { data: bidsData = [], isLoading } = useQuery({
    queryKey: ["freelancer-bids", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("id, status, created_at, project_id, projects(title, budget, category, deadline)")
        .eq("employee_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.id,
  });

  const bids = bidsData.length > 0
    ? bidsData.map((b: any) => ({
        id: b.id, title: b.projects?.title ?? "Project",
        category: b.projects?.category ?? "General",
        budget: b.projects?.budget ?? "—",
        status: b.status, bidAmount: "—",
        postedDate: new Date(b.created_at).toLocaleDateString("en-IN"),
        deadline: b.projects?.deadline ?? "—",
      }))
    : MOCK_BIDS;

  const filtered = bids.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:       bids.length,
    won:         bids.filter(b => b.status === "approved" || b.status === "job_confirmed" || b.status === "completed").length,
    pending:     bids.filter(b => b.status === "pending").length,
    successRate: bids.length > 0 ? Math.round((bids.filter(b => b.status === "approved" || b.status === "job_confirmed" || b.status === "completed").length / bids.length) * 100) : 0,
  };

  const handleAddTemplate = () => {
    if (!newTplName.trim() || !newTplText.trim()) { toast.error("Please enter both name and text"); return; }
    setTemplates(t => [...t, { id: Date.now().toString(), name: newTplName, text: newTplText }]);
    setNewTplName(""); setNewTplText(""); setAddingTpl(false);
    toast.success("Template saved!");
  };

  const card: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 };

  return (
    <div className="min-h-screen pb-24" style={{ background: T.bg, color: T.text }}>
      {/* Gradient Hero */}
      <div className="px-4 sm:px-6 pt-6 mb-5">
        <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #0ea5e9 100%)" }} className="relative overflow-hidden rounded-3xl p-6 shadow-2xl">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,.08)" }} />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,.04)" }} />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl" style={{ background: "rgba(255,255,255,.2)", backdropFilter: "blur(12px)" }}>
                  <Send className="h-7 w-7" style={{ color: "white" }} />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight" style={{ color: "white" }}>My Bids</h1>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.75)" }}>Track your proposals</p>
                </div>
              </div>
              <button
                onClick={() => setShowT(v => !v)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold transition-all shrink-0"
                style={{ background: showTemplates ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", color: "white" }}
              >
                <FileText className="h-3.5 w-3.5" /> Templates
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {[
                { label: "Total Bids",  value: stats.total },
                { label: "Won",         value: stats.won },
                { label: "Pending",     value: stats.pending },
                { label: "Success %",   value: `${stats.successRate}%` },
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

      {/* Proposal Templates Panel */}
      {showTemplates && (
        <div className="px-4 sm:px-6 mb-5">
          <div className="rounded-2xl p-4" style={card}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: T.text }}>Proposal Templates</h3>
              <button onClick={() => setAddingTpl(v => !v)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "rgba(99,102,241,.15)", color: clrPurple, border: "1px solid rgba(99,102,241,.3)" }}>
                <Plus className="h-3 w-3" /> Add Template
              </button>
            </div>
            {addingTpl && (
              <div className="mb-4 rounded-xl p-3 space-y-2" style={{ background: T.muted, border: `1px solid ${T.border}` }}>
                <input value={newTplName} onChange={e => setNewTplName(e.target.value)} placeholder="Template Name" className="w-full rounded-lg px-3 py-2 text-xs outline-none" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
                <textarea value={newTplText} onChange={e => setNewTplText(e.target.value)} placeholder="Proposal text..." rows={4} className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
                <div className="flex gap-2">
                  <button onClick={handleAddTemplate} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>Save</button>
                  <button onClick={() => setAddingTpl(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: T.sub }}>Cancel</button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {templates.map(t => (
                <div key={t.id} className="rounded-xl p-3 group" style={{ background: T.muted, border: `1px solid ${T.border}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold mb-1" style={{ color: T.text }}>{t.name}</p>
                      <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: T.sub }}>{t.text}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { navigator.clipboard.writeText(t.text); toast.success("Copied!"); }} className="h-6 w-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(99,102,241,.15)" }}>
                        <Copy className="h-3 w-3 text-indigo-400" />
                      </button>
                      <button onClick={() => setTemplates(ts => ts.filter(x => x.id !== t.id))} className="h-6 w-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(248,113,113,.15)" }}>
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="px-4 sm:px-6 mb-5 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: T.sub }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bids..." className="w-full rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }} />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="appearance-none rounded-xl pl-3 pr-8 py-2.5 text-xs outline-none cursor-pointer" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="approved">Won</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: T.sub }} />
        </div>
      </div>

      {/* Bids List */}
      <div className="px-4 sm:px-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={card}>
            <AlertCircle className="h-10 w-10 mx-auto mb-3" style={{ color: T.sub }} />
            <p className="font-semibold text-sm" style={{ color: T.text }}>No bids found</p>
            <p className="text-xs mt-1" style={{ color: T.sub }}>Try adjusting your search or filters</p>
          </div>
        ) : filtered.map((bid, i) => {
          const cfg = STATUS_CONFIG[bid.status] ?? STATUS_CONFIG["pending"];
          const Icon = cfg.icon;
          return (
            <div key={bid.id} className="rounded-2xl p-4 transition-all duration-200 hover:scale-[1.005]" style={{ ...card, animationDelay: `${i * 40}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-semibold rounded-md px-2 py-0.5" style={{ background: "rgba(99,102,241,.15)", color: clrPurple }}>{bid.category}</span>
                    <span className="flex items-center gap-1 text-[10px] rounded-md px-2 py-0.5 font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon className="h-2.5 w-2.5" /> {cfg.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold mb-2 leading-snug" style={{ color: T.text }}>{bid.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: T.sub }}>
                      <IndianRupee className="h-3 w-3" /> Budget: {bid.budget}
                    </span>
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: T.sub }}>
                      <Send className="h-3 w-3" /> My Bid: <span className="font-semibold" style={{ color: T.text }}>{bid.bidAmount}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: T.sub }}>
                      <Calendar className="h-3 w-3" /> {bid.postedDate}
                    </span>
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: T.sub }}>
                      <Clock className="h-3 w-3" /> {bid.deadline}
                    </span>
                  </div>
                </div>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                  <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
