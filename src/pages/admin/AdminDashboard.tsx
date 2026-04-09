import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Clock, Wallet, Fingerprint, Landmark,
  LifeBuoy, Briefcase, Edit, UserCheck, Building2,
  IndianRupee, UserPlus, MessageSquare, TrendingUp,
  ArrowUpRight, Shield, Activity, Server,
  Cpu, HardDrive, Wifi, Info, CheckCircle2,
  CreditCard, RefreshCw, Key,
  ClipboardList, Monitor, BarChart3, Zap, XCircle,
  Check, X, Trophy, Star, Globe, TrendingDown,
  AlertTriangle, Ban, Calendar, Mail, Package,
  MessageCircle, RotateCcw, Tag, ArrowLeftRight,
} from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const TH = {
  black: {
    heroGrad:   "linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.2),rgba(99,102,241,.1))",
    heroBdr:    "rgba(99,102,241,.25)",
    orbA:       "rgba(99,102,241,.2)",
    orbB:       "rgba(139,92,246,.15)",
    statBox:    "rgba(255,255,255,.08)",
    statBdr:    "rgba(255,255,255,.1)",
    statTxt:    "white",
    statSub:    "rgba(255,255,255,.5)",
    cardBg:     "rgba(255,255,255,.05)",
    cardBdr:    "rgba(255,255,255,.09)",
    cardText:   "rgba(255,255,255,.9)",
    cardSub:    "rgba(255,255,255,.4)",
    secTitle:   "rgba(255,255,255,.9)",
    secIcon:    "rgba(255,255,255,.08)",
    arrowFg:    "rgba(255,255,255,.2)",
    badgeBg:    "rgba(255,255,255,.06)",
    badgeFg:    "rgba(255,255,255,.35)",
    chartTip:   { background: "rgba(13,13,36,.95)", border: "1px solid rgba(255,255,255,.1)", color: "white" },
    chartAxis:  "rgba(255,255,255,.3)",
    alertBg:    "rgba(255,255,255,.04)",
    alertBdr:   "rgba(255,255,255,.07)",
    sysRowBg:   "rgba(255,255,255,.04)",
    timelineLine: "rgba(255,255,255,.1)",
    rowHover:   "rgba(255,255,255,.04)",
  },
  white: {
    heroGrad:   "linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1),rgba(99,102,241,.06))",
    heroBdr:    "rgba(99,102,241,.18)",
    orbA:       "rgba(99,102,241,.1)",
    orbB:       "rgba(139,92,246,.08)",
    statBox:    "rgba(255,255,255,.9)",
    statBdr:    "rgba(0,0,0,.08)",
    statTxt:    "#0d0d24",
    statSub:    "#6b7280",
    cardBg:     "#ffffff",
    cardBdr:    "rgba(0,0,0,.08)",
    cardText:   "#0d0d24",
    cardSub:    "#6b7280",
    secTitle:   "#1e293b",
    secIcon:    "rgba(99,102,241,.1)",
    arrowFg:    "#9ca3af",
    badgeBg:    "#f1f5f9",
    badgeFg:    "#6b7280",
    chartTip:   { background: "#ffffff", border: "1px solid rgba(0,0,0,.1)", color: "#0d0d24" },
    chartAxis:  "#9ca3af",
    alertBg:    "#f8faff",
    alertBdr:   "rgba(0,0,0,.06)",
    sysRowBg:   "#f8faff",
    timelineLine: "rgba(0,0,0,.08)",
    rowHover:   "rgba(0,0,0,.03)",
  },
  wb: {
    heroGrad:   "linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1),rgba(99,102,241,.06))",
    heroBdr:    "rgba(99,102,241,.18)",
    orbA:       "rgba(99,102,241,.1)",
    orbB:       "rgba(139,92,246,.08)",
    statBox:    "rgba(255,255,255,.9)",
    statBdr:    "rgba(0,0,0,.08)",
    statTxt:    "#0d0d24",
    statSub:    "#6b7280",
    cardBg:     "#ffffff",
    cardBdr:    "rgba(0,0,0,.08)",
    cardText:   "#0d0d24",
    cardSub:    "#6b7280",
    secTitle:   "#1e293b",
    secIcon:    "rgba(99,102,241,.1)",
    arrowFg:    "#9ca3af",
    badgeBg:    "#f1f5f9",
    badgeFg:    "#6b7280",
    chartTip:   { background: "#ffffff", border: "1px solid rgba(0,0,0,.1)", color: "#0d0d24" },
    chartAxis:  "#9ca3af",
    alertBg:    "#f8faff",
    alertBdr:   "rgba(0,0,0,.06)",
    sysRowBg:   "#f8faff",
    timelineLine: "rgba(0,0,0,.08)",
    rowHover:   "rgba(0,0,0,.03)",
  },
};

interface TimelineEvent {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
  detail: string;
  time: string;
}
interface RevenuePoint  { month: string; revenue: number; commission: number; }
interface GrowthPoint   { week: string; freelancers: number; employers: number; }
interface RegionPoint   { name: string; value: number; color: string; }
interface TopPerformer  { id: string; name: string; earnings: number; type: string; }
interface PendingUser   { id: string; full_name: string[]; email: string; user_type: string; created_at: string; }

const REGION_COLORS = ["#6366f1","#8b5cf6","#4ade80","#fbbf24","#f87171","#c4b5fd","#34d399","#60a5fa"];

const relTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const monthLabel = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { month: "short" });
const weekLabel = (iso: string) => {
  const d = new Date(iso);
  const s = new Date(d.getFullYear(), 0, 1);
  return `W${Math.ceil(((d.getTime() - s.getTime()) / 86400000 + s.getDay() + 1) / 7)}`;
};
const getName = (fn: string[] | null | undefined) =>
  fn?.join(" ").trim() || "Unknown User";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { theme, themeKey } = useAdminTheme();
  const tok = TH[themeKey];

  const [stats, setStats] = useState({
    totalUsers: 0, pendingApprovals: 0, approvedUsers: 0,
    pendingWithdrawals: 0, pendingAadhaar: 0, pendingBank: 0,
    pendingRecovery: 0, totalJobs: 0, pendingProfileEdits: 0,
    totalEmployees: 0, totalClients: 0, employeeEarnings: 0,
    clientEarnings: 0, unreadSupportChats: 0, activeUsers: 0,
  });
  const [loaded, setLoaded]               = useState(false);
  const [sysRefreshing, setSysRefreshing] = useState(false);
  const [revenueData, setRevenueData]     = useState<RevenuePoint[]>([]);
  const [growthData, setGrowthData]       = useState<GrowthPoint[]>([]);
  const [timeline, setTimeline]           = useState<TimelineEvent[]>([]);
  const [sysMetrics, setSysMetrics]       = useState<{
    cpu: { pct: number; cores: number; model: string };
    memory: { pct: number; total: number; used: number; free: number };
    disk: { pct: number; total: number; used: number };
    uptime: number;
    load: { "1m": string; "5m": string; "15m": string };
    hostname: string;
  } | null>(null);

  // ── New sections state ──────────────────────────────────────
  const [pendingUsers, setPendingUsers]   = useState<PendingUser[]>([]);
  const [approvingId, setApprovingId]     = useState<string | null>(null);
  const [rejectingId, setRejectingId]     = useState<string | null>(null);
  const [msgResetting, setMsgResetting]     = useState(false);
  const [payResetting, setPayResetting]     = useState(false);
  const [feedResetting, setFeedResetting]   = useState(false);
  const [revResetting, setRevResetting]     = useState(false);
  const [revClearing, setRevClearing]       = useState(false);
  const [growthClearing, setGrowthClearing] = useState(false);
  const [regionData, setRegionData]       = useState<RegionPoint[]>([]);
  const [withdrawalSummary, setWithdrawalSummary] = useState({
    pending: 0, approved: 0, rejected: 0, completed: 0,
    pendingAmt: 0, approvedAmt: 0, completedAmt: 0,
  });
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [jobStats, setJobStats]           = useState({
    total: 0, open: 0, inProgress: 0, completed: 0, cancelled: 0, totalAmt: 0,
  });
  const [verificationStats, setVerificationStats] = useState({
    aadhaarVerified: 0, aadhaarPending: 0, aadhaarRejected: 0, aadhaarUnderProcess: 0,
    bankVerified: 0, bankPending: 0, bankRejected: 0, bankUnderProcess: 0,
  });
  const [referralStats, setReferralStats] = useState({
    total: 0, uniqueReferrers: 0, signupBonuses: 0, jobBonuses: 0, conversionRate: 0,
  });
  const [commissionStats, setCommissionStats] = useState({ today: 0, thisWeek: 0, thisMonth: 0 });
  const [growthKPIs, setGrowthKPIs] = useState({
    momUserPct: 0, momRevPct: 0, momJobPct: 0, jobCompletionRate: 0, avgWithdrawal: 0,
  });
  const [jobGrowthSpark, setJobGrowthSpark] = useState<Array<{ v: number }>>([]);
  const [sysAlerts, setSysAlerts] = useState<Array<{
    msg: string; count: number; color: string; bg: string; border: string; path: string;
  }>>([]);
  const [topEmployers, setTopEmployers]   = useState<Array<{ id: string; name: string; jobs: number }>>([]);
  const [jobPeriods, setJobPeriods]       = useState({ today: 0, thisWeek: 0 });

  // ── Phase 2 sections ─────────────────────────────────────────
  const [revenueMode, setRevenueMode]     = useState<"day" | "week" | "month">("month");
  const [revDayData, setRevDayData]       = useState<RevenuePoint[]>([]);
  const [revWeekData, setRevWeekData]     = useState<RevenuePoint[]>([]);
  const [categoryStats, setCategoryStats] = useState<Array<{ name: string; count: number; color: string }>>([]);
  const [retentionStats, setRetentionStats] = useState({ active7d: 0, inactive7to30d: 0, inactive30d: 0, neverSeen: 0 });
  const [latestUsers, setLatestUsers]     = useState<Array<{ id: string; full_name: string[]; user_type: string; created_at: string; registration_region: string | null }>>([]);
  const [disabledUsers, setDisabledUsers] = useState<Array<{ id: string; full_name: string[]; disabled_reason: string | null }>>([]);
  const [messageStats, setMessageStats]   = useState({ total: 0, unread: 0, rooms: 0, today: 0 });
  const [duplicateIPs, setDuplicateIPs]   = useState<Array<{ ip: string; count: number }>>([]);
  const [recoveryData, setRecoveryData]   = useState({ open: 0, resolved: 0, total: 0, totalAmt: 0 });
  const [activityFeed, setActivityFeed]   = useState<Array<{ label: string; detail: string; time: string; color: string; icon: React.ElementType }>>([]);
  const [paymentStats, setPaymentStats]   = useState({ creditAmt: 0, debitAmt: 0, creditCount: 0, debitCount: 0 });
  const [pendingPayouts, setPendingPayouts] = useState<Array<{ id: string; employee_id: string; name: string; amount: number; method: string; requested_at: string }>>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const sixMonthsAgo   = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
      const fourWeeksAgoMs = Date.now() - 28 * 24 * 60 * 60 * 1000;
      const todayMidnight  = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

      // ── 13 optimised queries (was 30) ─────────────────────────────────────
      const [
        allProfilesQ, allWithdrawalsQ, aadhaarAllQ, bankAllQ,
        allRecoveryQ, allProjectsQ, txFullQ, allReferralsQ,
        supportMsgsQ, categoriesQ, msgTotalQ, msgUnreadQ, msgTodayQ,
      ] = await Promise.all([
        // 1. All profiles (replaces 9 separate profile queries)
        supabase.from("profiles").select("id, full_name, email, approval_status, user_type, edit_request_status, registration_region, last_seen_at, is_disabled, disabled_reason, registration_ip, referred_by, created_at").order("created_at", { ascending: false }),
        // 2. All withdrawals (replaces 3 withdrawal queries)
        supabase.from("withdrawals").select("id, employee_id, amount, status, requested_at, method").order("requested_at", { ascending: false }),
        // 3. Aadhaar statuses (replaces count-only + full query)
        supabase.from("aadhaar_verifications").select("status"),
        // 4. Bank statuses (replaces count-only + full query)
        supabase.from("bank_verifications").select("status"),
        // 5. Recovery requests (replaces 2 recovery queries)
        supabase.from("recovery_requests").select("id, status, held_amount, created_at, resolved_at"),
        // 6. All projects (replaces 4 project queries)
        supabase.from("projects").select("id, name, status, amount, client_id, created_at, category_id").order("created_at", { ascending: false }),
        // 7. Transactions 6 months, both types (replaces 3 transaction queries)
        supabase.from("transactions").select("id, profile_id, amount, created_at, type").gte("created_at", sixMonthsAgo),
        // 8. Referrals
        supabase.from("referrals").select("referrer_id, signup_bonus_paid, job_bonus_paid"),
        // 9. Unread support messages
        supabase.from("messages").select("id, is_read, chat_room_id, chat_rooms!inner(type)").eq("is_read", false).eq("chat_rooms.type", "support"),
        // 10. Service categories
        supabase.from("service_categories").select("id, name"),
        // 11-13. Message analytics via count-only queries (no row data transfer)
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", todayMidnight),
      ]);

      // ── Derive all data from the 13 combined queries ───────────────────────
      const allProfiles    = allProfilesQ.data || [];
      const allWd          = allWithdrawalsQ.data || [];
      const pj             = allProjectsQ.data || [];
      const allTx          = txFullQ.data || [];
      const txCred         = allTx.filter(t => t.type === "credit");
      const aAll           = aadhaarAllQ.data || [];
      const bAll           = bankAllQ.data || [];
      const allRec         = allRecoveryQ.data || [];
      const refs           = allReferralsQ.data || [];
      const cats           = categoriesQ.data || [];
      const employeeIds      = new Set(allProfiles.filter(p => p.user_type === "employee").map(p => p.id));
      const clientIds        = new Set(allProfiles.filter(p => p.user_type === "client").map(p => p.id));
      const employeeEarnings = allTx.filter(t => t.type === "credit" && employeeIds.has(t.profile_id)).reduce((s, t) => s + Number(t.amount), 0);
      const clientEarnings   = allTx.filter(t => t.type === "credit" && clientIds.has(t.profile_id)).reduce((s, t) => s + Number(t.amount), 0);
      const recentProfilesData = allProfiles.slice(0, 5);
      const profileGrowthData  = allProfiles.filter(p => new Date(p.created_at).getTime() >= fourWeeksAgoMs);
      const pendingApprData    = allProfiles.filter(p => p.approval_status === "pending");
      const recentWdData       = allWd.slice(0, 3);
      const pendingWdArr       = allWd.filter(w => w.status === "pending");

      setStats({
        totalUsers:          allProfiles.length,
        pendingApprovals:    pendingApprData.length,
        approvedUsers:       allProfiles.filter(p => p.approval_status === "approved").length,
        pendingWithdrawals:  pendingWdArr.length,
        pendingAadhaar:      aAll.filter(a => a.status === "pending").length,
        pendingBank:         bAll.filter(b => b.status === "pending").length,
        pendingRecovery:     allRec.filter(r => r.status === "pending").length,
        totalJobs:           pj.length,
        pendingProfileEdits: allProfiles.filter(p => p.edit_request_status === "requested").length,
        totalEmployees:      allProfiles.filter(p => p.user_type === "employee").length,
        totalClients:        allProfiles.filter(p => p.user_type === "client").length,
        employeeEarnings, clientEarnings,
        unreadSupportChats:  supportMsgsQ.data?.length || 0,
        activeUsers:         allProfiles.filter(p => p.approval_status === "approved").length,
      });

      /* Revenue chart */
      const revMap: Record<string, number> = {};
      for (const tx of txCred) {
        const m = monthLabel(tx.created_at);
        revMap[m] = (revMap[m] || 0) + Number(tx.amount);
      }
      setRevenueData(Object.entries(revMap).map(([month, revenue]) => ({
        month, revenue, commission: Math.round(revenue * 0.1),
      })));

      /* User growth chart */
      const growthMap: Record<string, { freelancers: number; employers: number }> = {};
      for (const p of profileGrowthData) {
        const w = weekLabel(p.created_at);
        if (!growthMap[w]) growthMap[w] = { freelancers: 0, employers: 0 };
        if (p.user_type === "employee") growthMap[w].freelancers++;
        if (p.user_type === "client")   growthMap[w].employers++;
      }
      setGrowthData(Object.entries(growthMap).map(([week, d]) => ({ week, ...d })));

      /* Activity timeline */
      const events: TimelineEvent[] = [];
      for (const p of recentProfilesData.slice(0, 4)) {
        events.push({
          icon: UserPlus, color: "#4ade80", bg: "rgba(34,197,94,.15)",
          label: `New ${p.user_type === "employee" ? "freelancer" : "employer"} registered`,
          detail: `${getName(p.full_name)} · ${p.registration_region || "—"}`,
          time: relTime(p.created_at),
        });
      }
      for (const w of recentWdData.slice(0, 3)) {
        events.push({
          icon: CreditCard, color: "#f87171", bg: "rgba(239,68,68,.15)",
          label: "Withdrawal request",
          detail: `₹${Number(w.amount).toLocaleString("en-IN")} · ${w.status}`,
          time: relTime(w.requested_at || ""),
        });
      }
      events.sort((a, b) => {
        const toMs = (t: string) => {
          const mt = t.match(/(\d+)\s*(min|hr|d)/);
          if (!mt) return 0;
          const n = Number(mt[1]);
          if (mt[2] === "min") return n * 60000;
          if (mt[2] === "hr")  return n * 3600000;
          return n * 86400000;
        };
        return toMs(a.time) - toMs(b.time);
      });
      setTimeline(events.slice(0, 6));

      /* ── Section 1: Quick Approval Panel ── */
      setPendingUsers(pendingApprData.slice(0, 8) as PendingUser[]);

      /* ── Section 2: Region Breakdown ── */
      const regMap: Record<string, number> = {};
      for (const p of allProfiles) {
        const r = (p as any).registration_region || "Unknown";
        regMap[r] = (regMap[r] || 0) + 1;
      }
      setRegionData(
        Object.entries(regMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, value], i) => ({ name, value, color: REGION_COLORS[i % REGION_COLORS.length] }))
      );

      /* ── Section 3: Withdrawal Summary ── */
      const wd = allWd;
      setWithdrawalSummary({
        pending:      wd.filter(w => w.status === "pending").length,
        approved:     wd.filter(w => w.status === "approved").length,
        rejected:     wd.filter(w => w.status === "rejected").length,
        completed:    wd.filter(w => w.status === "completed").length,
        pendingAmt:   wd.filter(w => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0),
        approvedAmt:  wd.filter(w => w.status === "approved").reduce((s, w) => s + Number(w.amount), 0),
        completedAmt: wd.filter(w => w.status === "completed").reduce((s, w) => s + Number(w.amount), 0),
      });

      /* ── Section 4: Top Performers ── */
      const earningsMap: Record<string, number> = {};
      for (const tx of txCred) {
        earningsMap[tx.profile_id] = (earningsMap[tx.profile_id] || 0) + Number(tx.amount);
      }
      const topIds = Object.entries(earningsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

      if (topIds.length > 0) {
        setTopPerformers(
          topIds
            .map(id => {
              const p = allProfiles.find(x => x.id === id);
              return p ? { id, name: getName(p.full_name), earnings: earningsMap[id], type: p.user_type } : null;
            })
            .filter(Boolean) as TopPerformer[]
        );
      }

      /* ── Section 5: Job Analytics ── */
      const nowMs       = Date.now();
      const todayStart  = new Date().setHours(0, 0, 0, 0);
      const weekStart   = nowMs - 7 * 24 * 60 * 60 * 1000;
      const monthStart  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      setJobStats({
        total:      pj.length,
        open:       pj.filter(p => p.status === "open").length,
        inProgress: pj.filter(p => p.status === "in_progress" || p.status === "job_confirmed").length,
        completed:  pj.filter(p => p.status === "completed").length,
        cancelled:  pj.filter(p => p.status === "cancelled").length,
        totalAmt:   pj.reduce((s, p) => s + Number(p.amount), 0),
      });
      setJobPeriods({
        today:    pj.filter(p => p.created_at && new Date(p.created_at).getTime() >= todayStart).length,
        thisWeek: pj.filter(p => p.created_at && new Date(p.created_at).getTime() >= weekStart).length,
      });

      /* ── Section 6: Verification Stats ── */
      setVerificationStats({
        aadhaarVerified:     aAll.filter(a => a.status === "verified").length,
        aadhaarPending:      aAll.filter(a => a.status === "pending").length,
        aadhaarRejected:     aAll.filter(a => a.status === "rejected").length,
        aadhaarUnderProcess: aAll.filter(a => a.status === "under_process").length,
        bankVerified:        bAll.filter(b => b.status === "verified").length,
        bankPending:         bAll.filter(b => b.status === "pending").length,
        bankRejected:        bAll.filter(b => b.status === "rejected").length,
        bankUnderProcess:    bAll.filter(b => b.status === "under_process").length,
      });

      /* ── Section 7: Referral Stats ── */
      const uniqueReferrers = new Set(refs.map(r => r.referrer_id)).size;
      const signupBonuses   = refs.filter(r => r.signup_bonus_paid).length;
      setReferralStats({
        total: refs.length,
        uniqueReferrers,
        signupBonuses,
        jobBonuses:     refs.filter(r => r.job_bonus_paid).length,
        conversionRate: refs.length > 0 ? Math.round(signupBonuses / refs.length * 100) : 0,
      });

      /* ── Section 8: Commission Tracker ── */
      setCommissionStats({
        today:     Math.round(txCred.filter(t => new Date(t.created_at).getTime() >= todayStart).reduce((s, t) => s + Number(t.amount), 0) * 0.1),
        thisWeek:  Math.round(txCred.filter(t => new Date(t.created_at).getTime() >= weekStart).reduce((s, t) => s + Number(t.amount), 0) * 0.1),
        thisMonth: Math.round(txCred.filter(t => new Date(t.created_at).getTime() >= monthStart).reduce((s, t) => s + Number(t.amount), 0) * 0.1),
      });

      /* ── Section 9: Platform Growth KPIs ── */
      const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime();
      const lastMonthEnd   = new Date(new Date().getFullYear(), new Date().getMonth(), 0, 23, 59, 59).getTime();
      const prevMonthRev   = txCred.filter(t => { const ts = new Date(t.created_at).getTime(); return ts >= lastMonthStart && ts <= lastMonthEnd; }).reduce((s, t) => s + Number(t.amount), 0);
      const thisMonthRev   = txCred.filter(t => new Date(t.created_at).getTime() >= monthStart).reduce((s, t) => s + Number(t.amount), 0);
      const momRevPct      = prevMonthRev > 0 ? Math.round((thisMonthRev - prevMonthRev) / prevMonthRev * 100) : 0;
      const pg = profileGrowthData;
      const prevMonthUsers = pg.filter(p => { const t = new Date(p.created_at).getTime(); return t >= lastMonthStart && t <= lastMonthEnd; }).length;
      const thisMonthUsers = pg.filter(p => new Date(p.created_at).getTime() >= monthStart).length;
      const momUserPct     = prevMonthUsers > 0 ? Math.round((thisMonthUsers - prevMonthUsers) / prevMonthUsers * 100) : 0;
      const activeJobs     = pj.filter(p => p.status !== "open" && p.status !== "draft" && p.status !== "cancelled");
      const jobCompletionRate = activeJobs.length > 0 ? Math.round(pj.filter(p => p.status === "completed").length / activeJobs.length * 100) : 0;
      const avgWithdrawal  = wd.length > 0 ? Math.round(wd.reduce((s, w) => s + Number(w.amount), 0) / wd.length) : 0;
      const lastMonthJobs  = pj.filter(p => { const t = new Date(p.created_at).getTime(); return t >= lastMonthStart && t <= lastMonthEnd; }).length;
      const thisMonthJobs  = pj.filter(p => new Date(p.created_at).getTime() >= monthStart).length;
      const momJobPct      = lastMonthJobs > 0 ? Math.round((thisMonthJobs - lastMonthJobs) / lastMonthJobs * 100) : 0;
      setGrowthKPIs({ momUserPct, momRevPct, momJobPct, jobCompletionRate, avgWithdrawal });

      /* ── Job growth sparkline (weekly counts, last 7 weeks) ── */
      const jobWeekMap: Record<string, number> = {};
      for (const p of pj) {
        const w = weekLabel(p.created_at);
        jobWeekMap[w] = (jobWeekMap[w] || 0) + 1;
      }
      const sortedJobWeeks = Object.entries(jobWeekMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
      setJobGrowthSpark(sortedJobWeeks.length >= 2 ? sortedJobWeeks.map(([, v]) => ({ v })) : []);

      /* ── Section 10: Alerts ── */
      const oneDayAgo  = nowMs - 24 * 60 * 60 * 1000;
      const pendingAadhaarCount = aAll.filter(a => a.status === "pending").length;
      const pendingBankCount    = bAll.filter(b => b.status === "pending").length;
      const pendingApprCount    = allProfiles.filter(p => p.approval_status === "pending").length;
      const over24hWd = wd.filter((w: { status: string; requested_at: string | null }) => w.status === "pending" && w.requested_at && new Date(w.requested_at).getTime() < oneDayAgo).length;
      const newAlerts: typeof sysAlerts = [];
      if (over24hWd > 0)          newAlerts.push({ msg: `${over24hWd} withdrawal${over24hWd > 1 ? "s" : ""} pending over 24 hours`, count: over24hWd, color: "#f87171", bg: "rgba(239,68,68,.08)", border: "rgba(239,68,68,.2)", path: "/admin/withdrawals" });
      if (pendingAadhaarCount > 0) newAlerts.push({ msg: `${pendingAadhaarCount} Aadhaar KYC awaiting review`, count: pendingAadhaarCount, color: "#fbbf24", bg: "rgba(245,158,11,.08)", border: "rgba(245,158,11,.2)", path: "/admin/verifications" });
      if (pendingBankCount > 0)    newAlerts.push({ msg: `${pendingBankCount} bank verification pending`, count: pendingBankCount, color: "#fbbf24", bg: "rgba(245,158,11,.08)", border: "rgba(245,158,11,.2)", path: "/admin/bank-verifications" });
      if (pendingApprCount > 5)    newAlerts.push({ msg: `${pendingApprCount} users awaiting account approval`, count: pendingApprCount, color: "#a5b4fc", bg: "rgba(99,102,241,.08)", border: "rgba(99,102,241,.2)", path: "/admin/users" });
      setSysAlerts(newAlerts);

      /* ── Phase 2 Section A: Revenue day/week breakdown ── */
      const creditTx = txCred;
      const dayMap: Record<string, number> = {};
      const weekMap2: Record<string, number> = {};
      for (const t of creditTx) {
        const d = new Date(t.created_at);
        const dayKey = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        dayMap[dayKey] = (dayMap[dayKey] || 0) + Number(t.amount);
        const weekKey = weekLabel(t.created_at);
        weekMap2[weekKey] = (weekMap2[weekKey] || 0) + Number(t.amount);
      }
      setRevDayData(Object.entries(dayMap).slice(-30).map(([month, revenue]) => ({ month, revenue, commission: Math.round(revenue * 0.1) })));
      setRevWeekData(Object.entries(weekMap2).slice(-12).map(([month, revenue]) => ({ month, revenue, commission: Math.round(revenue * 0.1) })));

      /* ── Phase 2 Section B: Category Analytics ── */
      const projCats = pj;
      const catCountMap: Record<string, number> = {};
      for (const p of projCats) { if (p.category_id) catCountMap[p.category_id] = (catCountMap[p.category_id] || 0) + 1; }
      setCategoryStats(
        Object.entries(catCountMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([id, count], i) => ({
            name: cats.find(c => c.id === id)?.name || id.slice(0, 8),
            count,
            color: REGION_COLORS[i % REGION_COLORS.length],
          }))
      );

      /* ── Phase 2 Section C: User Retention ── */
      const retProfiles = allProfiles;
      const sevenDaysAgo  = nowMs - 7 * 24 * 60 * 60 * 1000;
      const thirtyDaysAgo = nowMs - 30 * 24 * 60 * 60 * 1000;
      setRetentionStats({
        active7d:       retProfiles.filter(p => p.last_seen_at && new Date(p.last_seen_at).getTime() >= sevenDaysAgo).length,
        inactive7to30d: retProfiles.filter(p => p.last_seen_at && new Date(p.last_seen_at).getTime() < sevenDaysAgo && new Date(p.last_seen_at).getTime() >= thirtyDaysAgo).length,
        inactive30d:    retProfiles.filter(p => p.last_seen_at && new Date(p.last_seen_at).getTime() < thirtyDaysAgo).length,
        neverSeen:      retProfiles.filter(p => !p.last_seen_at).length,
      });

      /* ── Phase 2 Section D: New Registrations Feed ── */
      setLatestUsers(allProfiles.slice(0, 10) as typeof latestUsers);

      /* ── Phase 2 Section E: Disabled/Banned Users ── */
      setDisabledUsers(allProfiles.filter((p: { is_disabled?: boolean }) => p.is_disabled).slice(0, 10) as typeof disabledUsers);

      /* ── Phase 2 Section F: Message Analytics ── */
      setMessageStats({
        total:  msgTotalQ.count  || 0,
        unread: msgUnreadQ.count || 0,
        rooms:  0,
        today:  msgTodayQ.count  || 0,
      });

      /* ── Phase 2 Section G: Fraud Detection (Duplicate IPs) ── */
      const ipList = allProfiles.filter(p => p.registration_ip).map(p => p.registration_ip as string);
      const ipCount: Record<string, number> = {};
      for (const ip of ipList) { ipCount[ip] = (ipCount[ip] || 0) + 1; }
      setDuplicateIPs(
        Object.entries(ipCount)
          .filter(([, c]) => c > 1)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([ip, count]) => ({ ip, count }))
      );

      /* ── Phase 2 Section H: Recovery Requests ── */
      setRecoveryData({
        open:     allRec.filter(r => r.status === "pending").length,
        resolved: allRec.filter(r => r.status === "resolved" || r.status === "approved").length,
        total:    allRec.length,
        totalAmt: allRec.reduce((s, r) => s + Number(r.held_amount), 0),
      });

      /* ── Phase 2 Section I: Activity Feed (combined) ── */
      const feed: typeof activityFeed = [];
      for (const p of allProfiles.slice(0, 5)) {
        feed.push({ icon: UserPlus, color: "#4ade80", label: `New ${p.user_type === "employee" ? "Freelancer" : "Employer"} joined`, detail: `${getName(p.full_name)} · ${p.registration_region || "—"}`, time: relTime(p.created_at) });
      }
      for (const w of recentWdData.slice(0, 3)) {
        feed.push({ icon: Wallet, color: "#f87171", label: "Withdrawal requested", detail: `₹${Number(w.amount).toLocaleString("en-IN")} · ${w.status}`, time: relTime(w.requested_at || "") });
      }
      for (const proj of pj.slice(0, 4)) {
        feed.push({ icon: Briefcase, color: "#a5b4fc", label: "New job posted", detail: `${proj.name} · ${proj.status}`, time: relTime(proj.created_at) });
      }
      feed.sort((a, b) => {
        const toMs = (t: string) => { const m = t.match(/(\d+)\s*(min|hr|d)/); if (!m) return 0; const n = Number(m[1]); return m[2] === "min" ? n * 60000 : m[2] === "hr" ? n * 3600000 : n * 86400000; };
        return toMs(a.time) - toMs(b.time);
      });
      setActivityFeed(feed.slice(0, 15));

      /* ── Phase 2 Section J: Payment Analytics ── */
      setPaymentStats({
        creditAmt:   allTx.filter(t => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0),
        debitAmt:    allTx.filter(t => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0),
        creditCount: allTx.filter(t => t.type === "credit").length,
        debitCount:  allTx.filter(t => t.type === "debit").length,
      });

      /* ── Phase 2 Section K: Pending Payouts Queue ── */
      const pendingWd = pendingWdArr.slice(0, 15);
      if (pendingWd.length > 0) {
        setPendingPayouts(pendingWd.map(w => ({
          id: w.id, employee_id: w.employee_id,
          name: getName(allProfiles.find(p => p.id === w.employee_id)?.full_name),
          amount: Number(w.amount), method: w.method, requested_at: w.requested_at,
        })));
      }

      /* ── Section 11: Top Employers ── */
      const empJobsMap: Record<string, number> = {};
      for (const p of pj) { if (p.client_id) empJobsMap[p.client_id] = (empJobsMap[p.client_id] || 0) + 1; }
      const topEmpIds = Object.entries(empJobsMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
      setTopEmployers(topEmpIds.map(id => {
        const p = allProfiles.find(x => x.id === id);
        return p ? { id, name: getName(p.full_name), jobs: empJobsMap[id] } : null;
      }).filter(Boolean) as { id: string; name: string; jobs: number }[]);

      setLoaded(true);
    };
    fetchAll();
  }, []);

  /* ── Server metrics fetch ── */
  const fetchMetrics = useCallback(async () => {
    setSysRefreshing(true);
    try {
      const res = await fetch("/functions/v1/server-metrics");
      if (res.ok) setSysMetrics(await res.json());
    } catch { /* silently ignore */ }
    setSysRefreshing(false);
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  /* ── Approve / Reject handlers ── */
  const handleApprove = useCallback(async (id: string) => {
    setApprovingId(id);
    await supabase.from("profiles").update({ approval_status: "approved" }).eq("id", id);
    setPendingUsers(prev => prev.filter(u => u.id !== id));
    setStats(prev => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1, approvedUsers: prev.approvedUsers + 1, activeUsers: prev.activeUsers + 1 }));
    setApprovingId(null);
  }, []);

  const resetRevenueData = useCallback(async () => {
    setRevResetting(true);
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data: txns } = await supabase
        .from("transactions")
        .select("amount, created_at, type")
        .gte("created_at", sixMonthsAgo.toISOString())
        .eq("type", "credit");
      const all = txns || [];
      const weekLabel = (iso: string) => {
        const d = new Date(iso);
        const wk = Math.ceil(d.getDate() / 7);
        return `W${wk} ${d.toLocaleDateString("en-IN", { month: "short" })}`;
      };
      const revMap: Record<string, number> = {};
      const dayMap: Record<string, number> = {};
      const weekMap: Record<string, number> = {};
      for (const t of all) {
        const mKey = new Date(t.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        revMap[mKey] = (revMap[mKey] || 0) + Number(t.amount);
        const dKey = new Date(t.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        dayMap[dKey] = (dayMap[dKey] || 0) + Number(t.amount);
        const wKey = weekLabel(t.created_at);
        weekMap[wKey] = (weekMap[wKey] || 0) + Number(t.amount);
      }
      setRevenueData(Object.entries(revMap).map(([month, revenue]) => ({ month, revenue, commission: Math.round(revenue * 0.1) })));
      setRevDayData(Object.entries(dayMap).slice(-30).map(([month, revenue]) => ({ month, revenue, commission: Math.round(revenue * 0.1) })));
      setRevWeekData(Object.entries(weekMap).slice(-12).map(([month, revenue]) => ({ month, revenue, commission: Math.round(revenue * 0.1) })));
    } catch { /* silently ignore */ }
    setRevResetting(false);
  }, []);

  const clearRevenueData = useCallback(async () => {
    const ok = window.confirm("Revenue Analytics data delete ചെയ്യണോ?\n\nഈ action undo ചെയ്യാൻ കഴിയില്ല — transactions table-ൽ നിന്ന് permanently remove ആകും.");
    if (!ok) return;
    setRevClearing(true);
    try {
      await supabase.from("transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      setRevenueData([]);
      setRevDayData([]);
      setRevWeekData([]);
    } catch { /* silently ignore */ }
    setRevClearing(false);
  }, []);

  const resetActivityFeed = useCallback(async () => {
    setFeedResetting(true);
    try {
      const [profilesQ, withdrawalsQ, projectsQ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, user_type, registration_region, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("withdrawals").select("amount, status, requested_at").order("requested_at", { ascending: false }).limit(3),
        supabase.from("projects").select("name, status, created_at").order("created_at", { ascending: false }).limit(4),
      ]);
      const relTime = (iso: string) => {
        const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
        if (s < 60) return `${s}s ago`;
        const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
      };
      const getName = (fn: string[] | null | undefined) => fn?.join(" ").trim() || "Unknown";
      const feed: typeof activityFeed = [];
      for (const p of profilesQ.data || []) {
        feed.push({ icon: UserPlus, color: "#4ade80", label: `New ${p.user_type === "employee" ? "Freelancer" : "Employer"} joined`, detail: `${getName(p.full_name)} · ${p.registration_region || "—"}`, time: relTime(p.created_at) });
      }
      for (const w of withdrawalsQ.data || []) {
        feed.push({ icon: Wallet, color: "#f87171", label: "Withdrawal requested", detail: `₹${Number(w.amount).toLocaleString("en-IN")} · ${w.status}`, time: relTime(w.requested_at || "") });
      }
      for (const proj of projectsQ.data || []) {
        feed.push({ icon: Briefcase, color: "#a5b4fc", label: "New job posted", detail: `${proj.name} · ${proj.status}`, time: relTime(proj.created_at) });
      }
      const toMs = (t: string) => { const m = t.match(/(\d+)\s*(s|m|h|d)/); if (!m) return 0; const n = Number(m[1]); return m[2] === "s" ? n * 1000 : m[2] === "m" ? n * 60000 : m[2] === "h" ? n * 3600000 : n * 86400000; };
      feed.sort((a, b) => toMs(a.time) - toMs(b.time));
      setActivityFeed(feed.slice(0, 15));
    } catch { /* silently ignore */ }
    setFeedResetting(false);
  }, [activityFeed]);

  const resetPaymentStats = useCallback(async () => {
    setPayResetting(true);
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data: txns } = await supabase
        .from("transactions")
        .select("amount, type")
        .gte("created_at", sixMonthsAgo.toISOString());
      const all = txns || [];
      setPaymentStats({
        creditAmt:   all.filter(t => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0),
        debitAmt:    all.filter(t => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0),
        creditCount: all.filter(t => t.type === "credit").length,
        debitCount:  all.filter(t => t.type === "debit").length,
      });
    } catch { /* silently ignore */ }
    setPayResetting(false);
  }, []);

  const resetUnreadMessages = useCallback(async () => {
    setMsgResetting(true);
    try {
      await supabase.from("messages").update({ is_read: true }).eq("is_read", false);
      setMessageStats(prev => ({ ...prev, unread: 0 }));
    } catch { /* silently ignore */ }
    setMsgResetting(false);
  }, []);

  const handleReject = useCallback(async (id: string) => {
    setRejectingId(id);
    await supabase.from("profiles").update({ approval_status: "rejected" }).eq("id", id);
    setPendingUsers(prev => prev.filter(u => u.id !== id));
    setStats(prev => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1 }));
    setRejectingId(null);
  }, []);

  const fmt      = (val: number) => `₹${val.toLocaleString("en-IN")}`;
  const totalRev = stats.employeeEarnings + stats.clientEarnings;

  const card: React.CSSProperties = {
    background: tok.cardBg, border: `1px solid ${tok.cardBdr}`, borderRadius: 16,
    backdropFilter: "blur(12px)",
    boxShadow: theme !== "black" ? "0 2px 8px rgba(0,0,0,.06)" : "none",
  };

  const sectionHeader = (icon: React.ReactNode, title: string, badge?: string, badgeColor?: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: tok.secIcon, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.secTitle, flex: 1, margin: 0 }}>{title}</h2>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, color: badgeColor || "#a5b4fc", background: `${badgeColor || "#a5b4fc"}18`, borderRadius: 20, padding: "2px 10px" }}>{badge}</span>}
    </div>
  );

  const pendingTotal = stats.pendingApprovals + stats.pendingAadhaar + stats.pendingWithdrawals;
  const fmtTrend = (pct: number) => pct === 0 ? "—" : `${pct > 0 ? "+" : ""}${pct}%`;
  const pendingBreakdownSpark = [
    stats.pendingApprovals, stats.pendingAadhaar, stats.pendingBank,
    stats.pendingWithdrawals, stats.pendingRecovery, stats.pendingProfileEdits, pendingTotal,
  ].map(v => ({ v: Math.max(0, v) }));
  const valexCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString("en-IN"),
      trend: fmtTrend(growthKPIs.momUserPct), up: growthKPIs.momUserPct >= 0,
      path: "/admin/users", icon: Users,
      grad: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      shadow: "rgba(102,126,234,.35)",
      spark: growthData.length >= 2 ? growthData.map(d => ({ v: d.freelancers + d.employers })) : null,
    },
    {
      label: "Total Jobs Posted",
      value: stats.totalJobs.toLocaleString("en-IN"),
      trend: fmtTrend(growthKPIs.momJobPct), up: growthKPIs.momJobPct >= 0,
      path: "/admin/jobs", icon: Briefcase,
      grad: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      shadow: "rgba(245,87,108,.35)",
      spark: jobGrowthSpark.length >= 2 ? jobGrowthSpark : null,
    },
    {
      label: "Total Revenue",
      value: totalRev > 0 ? fmt(totalRev) : "₹0",
      trend: fmtTrend(growthKPIs.momRevPct), up: growthKPIs.momRevPct >= 0,
      path: "/admin/wallet-management", icon: IndianRupee,
      grad: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      shadow: "rgba(79,172,254,.35)",
      spark: revenueData.length >= 2 ? revenueData.map(d => ({ v: d.revenue })) : null,
    },
    {
      label: "Pending Actions",
      value: pendingTotal.toLocaleString("en-IN"),
      trend: pendingTotal > 10 ? "High" : "Low", up: false, path: "/admin/users", icon: Clock,
      grad: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
      shadow: "rgba(247,151,30,.35)",
      spark: pendingBreakdownSpark,
    },
  ];

  const emptyBox = (icon: React.ElementType, msg: string) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, padding: "32px 0" }}>
      {React.createElement(icon, { size: 28, color: tok.cardSub })}
      <p style={{ fontSize: 12, color: tok.cardSub, margin: 0 }}>{msg}</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Valex Welcome Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, padding: "20px 24px", background: tok.cardBg, borderRadius: 16, border: `1px solid ${tok.cardBdr}`, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: tok.cardText, margin: "0 0 4px", letterSpacing: "-0.5px" }}>Hi, welcome back!</h1>
          <p style={{ fontSize: 12.5, color: tok.cardSub, margin: 0 }}>Freelancer India · Super Admin Control Center</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", gap: 2, marginBottom: 3, justifyContent: "center" }}>
              {[...Array(5)].map((_, i) => <span key={i} style={{ color: "#fbbf24", fontSize: 12 }}>★</span>)}
            </div>
            <p style={{ fontSize: 10, color: tok.cardSub, margin: 0, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.8px" }}>Platform Users</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: tok.cardText, margin: "2px 0 0" }}>{stats.totalUsers.toLocaleString("en-IN")}</p>
          </div>
          <div style={{ width: 1, height: 42, background: tok.cardBdr }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 10, color: tok.cardSub, margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.8px" }}>Active Jobs</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#22c55e", margin: 0 }}>{stats.totalJobs.toLocaleString("en-IN")}</p>
          </div>
          <div style={{ width: 1, height: 42, background: tok.cardBdr }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 10, color: tok.cardSub, margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.8px" }}>Pending Actions</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#ef4444", margin: 0 }}>{pendingTotal.toLocaleString("en-IN")}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.22)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>Systems Live</span>
            </div>
            <button onClick={() => navigate("/admin/server-monitor")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 20, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.22)", color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              <Zap size={11} /> Emergency
            </button>
          </div>
        </div>
      </div>

      {/* ── Valex 4 Gradient Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, opacity: loaded ? 1 : 0, transition: "opacity .5s ease" }}>
        {valexCards.map(c => (
          <div key={c.label} onClick={() => navigate(c.path)}
            style={{ background: c.grad, borderRadius: 18, cursor: "pointer", overflow: "hidden", position: "relative", boxShadow: `0 10px 40px ${c.shadow}` }}>
            <div style={{ padding: "22px 22px 10px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.8)", margin: 0, textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>{c.label}</p>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <c.icon size={18} color="white" />
                </div>
              </div>
              <p style={{ fontSize: 30, fontWeight: 900, color: "white", margin: "4px 0 6px", letterSpacing: "-1px", lineHeight: 1 }}>{c.value}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {c.trend !== "—" && <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.9)" }}>{c.up ? "▲" : "▼"} {c.trend}</span>}
                {c.trend === "—" && <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.6)" }}>—</span>}
                <span style={{ fontSize: 10.5, color: "rgba(255,255,255,.6)" }}>{c.trend === "—" ? "no prior data" : "vs last month"}</span>
              </div>
            </div>
            <div style={{ height: 64 }}>
              {c.spark ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={c.spark} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`sg${c.label.replace(/\s/g,"")}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,.35)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,.02)" />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="rgba(255,255,255,.7)" strokeWidth={2} fill={`url(#sg${c.label.replace(/\s/g,"")})`} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>No chart data yet</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Secondary Metrics Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, opacity: loaded ? 1 : 0, transition: "opacity .6s ease" }}>
        {[
          { label: "Active Users",    value: stats.activeUsers,        icon: Activity,     color: "#4ade80", bg: "rgba(34,197,94,.1)",   path: "/admin/sessions",       urgent: false },
          { label: "Freelancers",     value: stats.totalEmployees,     icon: UserCheck,    color: "#6366f1", bg: "rgba(99,102,241,.1)",  path: "/admin/freelancers",    urgent: false },
          { label: "Employers",       value: stats.totalClients,       icon: Building2,    color: "#8b5cf6", bg: "rgba(139,92,246,.1)",  path: "/admin/employers",      urgent: false },
          { label: "Pending KYC",     value: stats.pendingAadhaar,     icon: Fingerprint,  color: "#f59e0b", bg: "rgba(245,158,11,.1)",  path: "/admin/verifications",  urgent: stats.pendingAadhaar > 0 },
          { label: "Support Chats",   value: stats.unreadSupportChats, icon: MessageSquare,color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/help-support",   urgent: stats.unreadSupportChats > 0 },
          { label: "Profile Edits",   value: stats.pendingProfileEdits,icon: Edit,         color: "#60a5fa", bg: "rgba(96,165,250,.1)",  path: "/admin/profile-edits",  urgent: false },
        ].map(c => (
          <div key={c.label} onClick={() => navigate(c.path)}
            style={{ ...card, padding: "18px", cursor: "pointer", border: c.urgent ? "1px solid rgba(239,68,68,.3)" : `1px solid ${tok.cardBdr}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <c.icon size={15} color={c.color} />
              </div>
              {c.urgent && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }} />}
            </div>
            <p style={{ fontSize: 26, fontWeight: 900, color: tok.cardText, margin: "0 0 3px", letterSpacing: "-0.5px" }}>{c.value.toLocaleString("en-IN")}</p>
            <p style={{ fontSize: 11, color: tok.cardSub, margin: 0 }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — QUICK APPROVAL PANEL
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(
          <UserCheck size={14} color="#4ade80" />,
          "Quick Approval Panel",
          `${stats.pendingApprovals} pending`,
          stats.pendingApprovals > 0 ? "#f87171" : "#4ade80"
        )}
        {pendingUsers.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 16px", borderRadius: 12, background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.15)" }}>
            <CheckCircle2 size={20} color="#4ade80" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: 0 }}>All caught up!</p>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "2px 0 0" }}>No pending user approvals at this time.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingUsers.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: tok.sysRowBg, border: "1px solid rgba(245,158,11,.2)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: u.user_type === "employee" ? "rgba(99,102,241,.15)" : "rgba(139,92,246,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {u.user_type === "employee" ? <UserCheck size={16} color="#a5b4fc" /> : <Building2 size={16} color="#c4b5fd" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: tok.cardText, margin: 0 }}>{getName(u.full_name)}</p>
                  <p style={{ fontSize: 11, color: tok.cardSub, margin: "1px 0 0" }}>
                    {u.email} · <span style={{ color: u.user_type === "employee" ? "#a5b4fc" : "#c4b5fd", fontWeight: 600 }}>{u.user_type === "employee" ? "Freelancer" : "Employer"}</span>
                  </p>
                </div>
                <span style={{ fontSize: 10, color: tok.cardSub, flexShrink: 0 }}>{relTime(u.created_at)}</span>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    disabled={approvingId === u.id || rejectingId === u.id}
                    onClick={() => handleApprove(u.id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, background: approvingId === u.id ? "rgba(34,197,94,.05)" : "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.3)", color: "#4ade80", fontSize: 11.5, fontWeight: 700, cursor: approvingId === u.id ? "wait" : "pointer" }}>
                    <Check size={12} /> {approvingId === u.id ? "…" : "Approve"}
                  </button>
                  <button
                    disabled={approvingId === u.id || rejectingId === u.id}
                    onClick={() => handleReject(u.id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, background: rejectingId === u.id ? "rgba(239,68,68,.05)" : "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171", fontSize: 11.5, fontWeight: 700, cursor: rejectingId === u.id ? "wait" : "pointer" }}>
                    <X size={12} /> {rejectingId === u.id ? "…" : "Reject"}
                  </button>
                </div>
              </div>
            ))}
            {stats.pendingApprovals > pendingUsers.length && (
              <button onClick={() => navigate("/admin/users")}
                style={{ width: "100%", padding: "9px", borderRadius: 10, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                View all {stats.pendingApprovals} pending approvals →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Revenue Chart + User Growth ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<TrendingUp size={14} color="#4ade80" />, "Revenue Analytics")}
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {(["day", "week", "month"] as const).map(m => (
              <button key={m} onClick={() => setRevenueMode(m)}
                style={{ padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${revenueMode === m ? "#4ade80" : tok.alertBdr}`, background: revenueMode === m ? "rgba(74,222,128,.12)" : "transparent", color: revenueMode === m ? "#4ade80" : tok.cardSub }}>
                {m === "day" ? "Daily" : m === "week" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>
          {(revenueMode === "month" ? revenueData : revenueMode === "week" ? revWeekData : revDayData).length === 0
            ? emptyBox(BarChart3, "No transaction data yet")
            : (
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueMode === "month" ? revenueData : revenueMode === "week" ? revWeekData : revDayData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={A1} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={A1} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: tok.chartAxis }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: tok.chartAxis }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ ...tok.chartTip, borderRadius: 12, fontSize: 11 }}
                    formatter={(v: number, n: string) => [`₹${v.toLocaleString("en-IN")}`, n === "revenue" ? "Revenue" : "Commission"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#4ade80" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                  <Area type="monotone" dataKey="commission" stroke={A1} strokeWidth={2} fill="url(#commGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ display: "flex", gap: 14, marginTop: 10, marginBottom: 10 }}>
            {[
              { label: "Total Revenue",    value: fmt(totalRev),                   color: "#4ade80" },
              { label: "Commission (10%)", value: fmt(Math.round(totalRev * 0.1)), color: "#a5b4fc" },
            ].map(m => (
              <div key={m.label}>
                <p style={{ fontSize: 13, fontWeight: 900, color: m.color, margin: 0 }}>{m.value}</p>
                <p style={{ fontSize: 10, color: tok.cardSub, margin: "1px 0 0" }}>{m.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={resetRevenueData}
              disabled={revResetting || revClearing}
              style={{ flex: 1, padding: "8px", borderRadius: 9, background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.25)", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: (revResetting || revClearing) ? "not-allowed" : "pointer", opacity: (revResetting || revClearing) ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              {revResetting
                ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Refreshing…</>
                : <>↺ Refresh Data</>
              }
            </button>
            <button
              onClick={clearRevenueData}
              disabled={revClearing || revResetting}
              style={{ flex: 1, padding: "8px", borderRadius: 9, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: (revClearing || revResetting) ? "not-allowed" : "pointer", opacity: (revClearing || revResetting) ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              {revClearing
                ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Clearing…</>
                : <>✕ Clear Data</>
              }
            </button>
          </div>
        </div>
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Users size={14} color={A1} />, "User Growth", "4 weeks")}
          {growthData.length === 0 ? emptyBox(Users, "No registrations in last 4 weeks") : (
            <div style={{ height: 170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: tok.chartAxis }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: tok.chartAxis }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ ...tok.chartTip, borderRadius: 12, fontSize: 11 }} />
                  <Bar dataKey="freelancers" fill={A1} radius={[4, 4, 0, 0]} name="Freelancers" />
                  <Bar dataKey="employers" fill="#4ade80" radius={[4, 4, 0, 0]} name="Employers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ c: A1, l: "Freelancers" }, { c: "#4ade80", l: "Employers" }].map(x => (
                <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
                  <span style={{ fontSize: 10, color: tok.cardSub }}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              const ok = window.confirm("User Growth chart data clear ചെയ്യണോ?\n\nChart view empty ആകും (user accounts delete ആകില്ല).");
              if (!ok) return;
              setGrowthClearing(true);
              setTimeout(() => { setGrowthData([]); setGrowthClearing(false); }, 400);
            }}
            disabled={growthClearing || growthData.length === 0}
            style={{ width: "100%", padding: "8px", borderRadius: 9, background: growthData.length > 0 ? "rgba(239,68,68,.08)" : tok.alertBg, border: `1px solid ${growthData.length > 0 ? "rgba(239,68,68,.25)" : tok.alertBdr}`, color: growthData.length > 0 ? "#f87171" : tok.cardSub, fontSize: 12, fontWeight: 700, cursor: (growthClearing || growthData.length === 0) ? "not-allowed" : "pointer", opacity: growthClearing ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {growthClearing
              ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Clearing…</>
              : <>✕ Clear Chart Data</>
            }
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — USER TYPE + REGION BREAKDOWN
          ══════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* User Type Pie */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Users size={14} color={A2} />, "User Type Breakdown")}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ width: 140, height: 140, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Freelancers", value: stats.totalEmployees, color: A1 },
                      { name: "Employers",   value: stats.totalClients,   color: "#4ade80" },
                    ]}
                    cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={0}>
                    <Cell fill={A1} />
                    <Cell fill="#4ade80" />
                  </Pie>
                  <Tooltip contentStyle={{ ...tok.chartTip, borderRadius: 10, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Freelancers", value: stats.totalEmployees, color: A1,        pct: stats.totalUsers > 0 ? Math.round(stats.totalEmployees / stats.totalUsers * 100) : 0 },
                { label: "Employers",   value: stats.totalClients,   color: "#4ade80", pct: stats.totalUsers > 0 ? Math.round(stats.totalClients / stats.totalUsers * 100) : 0 },
              ].map(r => (
                <div key={r.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
                      <span style={{ fontSize: 12, color: tok.cardText, fontWeight: 600 }}>{r.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: r.color }}>{r.value.toLocaleString()} ({r.pct}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: tok.alertBg, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${r.pct}%`, background: r.color, borderRadius: 3, transition: "width .5s ease" }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 4, padding: "8px 10px", borderRadius: 8, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
                <p style={{ fontSize: 11, color: tok.cardSub, margin: 0 }}>
                  Approved: <strong style={{ color: "#4ade80" }}>{stats.approvedUsers}</strong> &nbsp;·&nbsp;
                  Pending: <strong style={{ color: "#fbbf24" }}>{stats.pendingApprovals}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Region Breakdown */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Globe size={14} color="#4ade80" />, "Registration Region", `${regionData.length} regions`)}
          {regionData.length === 0 ? emptyBox(Globe, "No region data available") : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {regionData.slice(0, 6).map((r, i) => {
                const maxVal = regionData[0]?.value || 1;
                return (
                  <div key={r.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: tok.cardSub, width: 16, textAlign: "right" }}>#{i + 1}</span>
                        <span style={{ fontSize: 12, color: tok.cardText, fontWeight: 600 }}>{r.name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.value} users</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: tok.alertBg, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.round(r.value / maxVal * 100)}%`, background: r.color, borderRadius: 3, transition: "width .5s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — WITHDRAWAL SUMMARY
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Wallet size={14} color="#fbbf24" />, "Withdrawal Summary", "All time")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Pending",   count: withdrawalSummary.pending,   amount: withdrawalSummary.pendingAmt,   color: "#fbbf24", bg: "rgba(245,158,11,.1)",  border: "rgba(245,158,11,.2)",  icon: Clock },
            { label: "Approved",  count: withdrawalSummary.approved,  amount: withdrawalSummary.approvedAmt,  color: "#4ade80", bg: "rgba(34,197,94,.1)",   border: "rgba(34,197,94,.2)",   icon: CheckCircle2 },
            { label: "Completed", count: withdrawalSummary.completed, amount: withdrawalSummary.completedAmt, color: "#a5b4fc", bg: "rgba(99,102,241,.1)",  border: "rgba(99,102,241,.2)",  icon: TrendingUp },
            { label: "Rejected",  count: withdrawalSummary.rejected,  amount: 0,                             color: "#f87171", bg: "rgba(239,68,68,.1)",   border: "rgba(239,68,68,.2)",   icon: XCircle },
          ].map(w => (
            <div key={w.label} style={{ padding: "14px", borderRadius: 12, background: w.bg, border: `1px solid ${w.border}`, cursor: "pointer" }}
              onClick={() => navigate("/admin/withdrawals")}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <w.icon size={14} color={w.color} />
                <span style={{ fontSize: 11, fontWeight: 600, color: w.color }}>{w.label}</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 900, color: w.color, margin: 0 }}>{w.count}</p>
              {w.amount > 0 && (
                <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "3px 0 0" }}>{fmt(w.amount)}</p>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
          <IndianRupee size={13} color="#4ade80" />
          <span style={{ fontSize: 12, color: tok.cardText }}>
            Total disbursed: <strong style={{ color: "#4ade80" }}>{fmt(withdrawalSummary.completedAmt + withdrawalSummary.approvedAmt)}</strong>
            &nbsp;·&nbsp; Pending release: <strong style={{ color: "#fbbf24" }}>{fmt(withdrawalSummary.pendingAmt)}</strong>
          </span>
          <button onClick={() => navigate("/admin/withdrawals")} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 600 }}>
            Manage <ArrowUpRight size={11} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 4 — TOP PERFORMERS
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Trophy size={14} color="#fbbf24" />, "Top Performers", "By earnings")}
        {topPerformers.length === 0 ? emptyBox(Trophy, "No transaction data yet") : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topPerformers.map((p, i) => {
              const maxEarning = topPerformers[0]?.earnings || 1;
              const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, background: i === 0 ? "rgba(251,191,36,.07)" : tok.sysRowBg, border: `1px solid ${i === 0 ? "rgba(251,191,36,.2)" : tok.alertBdr}` }}>
                  <span style={{ fontSize: 18, flexShrink: 0, width: 24 }}>{medals[i] || `${i + 1}`}</span>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: p.type === "employee" ? "rgba(99,102,241,.15)" : "rgba(139,92,246,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {p.type === "employee" ? <UserCheck size={15} color="#a5b4fc" /> : <Building2 size={15} color="#c4b5fd" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: tok.cardText, margin: 0 }}>{p.name}</p>
                    <div style={{ height: 4, borderRadius: 2, background: tok.alertBg, overflow: "hidden", marginTop: 5 }}>
                      <div style={{ height: "100%", width: `${Math.round(p.earnings / maxEarning * 100)}%`, background: i === 0 ? "#fbbf24" : A1, borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? "#fbbf24" : "#4ade80", margin: 0 }}>{fmt(p.earnings)}</p>
                    <p style={{ fontSize: 10, color: tok.cardSub, margin: 0 }}>{p.type === "employee" ? "Freelancer" : "Employer"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 5 — JOB ANALYTICS
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Briefcase size={14} color={A1} />, "Job Analytics", `${jobStats.total} total jobs`)}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Open",        value: jobStats.open,       color: "#4ade80", bg: "rgba(34,197,94,.1)",   border: "rgba(34,197,94,.2)" },
            { label: "In Progress", value: jobStats.inProgress, color: "#a5b4fc", bg: "rgba(99,102,241,.1)",  border: "rgba(99,102,241,.2)" },
            { label: "Completed",   value: jobStats.completed,  color: "#34d399", bg: "rgba(52,211,153,.1)",  border: "rgba(52,211,153,.2)" },
            { label: "Cancelled",   value: jobStats.cancelled,  color: "#f87171", bg: "rgba(239,68,68,.08)",  border: "rgba(239,68,68,.15)" },
            { label: "Total Value", value: fmt(jobStats.totalAmt), color: "#fbbf24", bg: "rgba(245,158,11,.1)", border: "rgba(245,158,11,.2)" },
          ].map(j => (
            <div key={j.label} style={{ padding: "14px", borderRadius: 12, background: j.bg, border: `1px solid ${j.border}`, cursor: "pointer" }}
              onClick={() => navigate("/admin/jobs")}>
              <p style={{ fontSize: 22, fontWeight: 900, color: j.color, margin: 0 }}>
                {typeof j.value === "number" ? j.value.toLocaleString() : j.value}
              </p>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "3px 0 0", fontWeight: 600 }}>{j.label}</p>
            </div>
          ))}
        </div>

        {/* Completion rate bar */}
        {jobStats.total > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: tok.cardText, fontWeight: 600 }}>Job Completion Rate</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#34d399" }}>
                {Math.round(jobStats.completed / jobStats.total * 100)}%
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: tok.alertBg, overflow: "hidden", display: "flex" }}>
              <div style={{ height: "100%", width: `${Math.round(jobStats.open / jobStats.total * 100)}%`,       background: "#4ade80", transition: "width .5s ease" }} />
              <div style={{ height: "100%", width: `${Math.round(jobStats.inProgress / jobStats.total * 100)}%`, background: A1,        transition: "width .5s ease" }} />
              <div style={{ height: "100%", width: `${Math.round(jobStats.completed / jobStats.total * 100)}%`,  background: "#34d399", transition: "width .5s ease" }} />
              <div style={{ height: "100%", width: `${Math.round(jobStats.cancelled / jobStats.total * 100)}%`,  background: "#f87171", transition: "width .5s ease" }} />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              {[{c:"#4ade80",l:"Open"},{c:A1,l:"In Progress"},{c:"#34d399",l:"Completed"},{c:"#f87171",l:"Cancelled"}].map(x => (
                <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: x.c }} />
                  <span style={{ fontSize: 10, color: tok.cardSub }}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          {[
            { label: "Posted Today",     val: jobPeriods.today,   color: "#4ade80", bg: "rgba(34,197,94,.08)",  border: "rgba(34,197,94,.18)" },
            { label: "Posted This Week", val: jobPeriods.thisWeek, color: "#a5b4fc", bg: "rgba(99,102,241,.08)", border: "rgba(99,102,241,.18)" },
          ].map(j => (
            <div key={j.label} style={{ padding: "10px 14px", borderRadius: 10, background: j.bg, border: `1px solid ${j.border}` }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: j.color, margin: 0 }}>{j.val}</p>
              <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "2px 0 0" }}>{j.label}</p>
            </div>
          ))}
        </div>
        <button onClick={() => navigate("/admin/jobs")} style={{ width: "100%", marginTop: 10, padding: "9px", borderRadius: 10, background: `${A1}12`, border: `1px solid ${A1}25`, color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          View All Jobs →
        </button>
      </div>

      {/* ── System Monitoring ── */}
      <div style={{ ...card, padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: tok.secIcon, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Server size={14} color="#4ade80" />
          </div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.secTitle, flex: 1, margin: 0 }}>System Monitoring</h2>
          {sysMetrics && (
            <span style={{ fontSize: 10, color: "#4ade80", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.2)", borderRadius: 20, padding: "2px 10px", fontWeight: 700 }}>
              Live · {sysMetrics.hostname}
            </span>
          )}
          <button onClick={fetchMetrics} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: tok.cardSub, fontSize: 11, cursor: "pointer" }}>
            <RefreshCw size={11} style={{ animation: sysRefreshing ? "spin 1s linear infinite" : "none" }} /> Refresh
          </button>
          <button onClick={() => navigate("/admin/server-monitor")} style={{ display: "flex", alignItems: "center", gap: 4, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 600 }}>
            Full View <ArrowUpRight size={11} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
          {(() => {
            const metricColor = (pct: number) => pct >= 85 ? "#f87171" : pct >= 65 ? "#fbbf24" : "#4ade80";
            const fmtBytes = (b: number) => b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${(b / 1e6).toFixed(0)} MB`;
            const items = sysMetrics ? [
              { label: "CPU",    icon: Cpu,      pct: sysMetrics.cpu.pct,    sub: `${sysMetrics.cpu.cores} cores · load ${sysMetrics.load["1m"]}` },
              { label: "Memory", icon: Monitor,  pct: sysMetrics.memory.pct, sub: `${fmtBytes(sysMetrics.memory.used)} / ${fmtBytes(sysMetrics.memory.total)}` },
              { label: "Disk",   icon: HardDrive,pct: sysMetrics.disk.pct,   sub: `${fmtBytes(sysMetrics.disk.used)} / ${fmtBytes(sysMetrics.disk.total)}` },
            ] : [
              { label: "CPU",    icon: Cpu,       pct: -1, sub: "Fetching…" },
              { label: "Memory", icon: Monitor,   pct: -1, sub: "Fetching…" },
              { label: "Disk",   icon: HardDrive, pct: -1, sub: "Fetching…" },
            ];
            return items.map(r => {
              const col = r.pct >= 0 ? metricColor(r.pct) : tok.cardSub;
              return (
                <div key={r.label} style={{ padding: "16px 14px", borderRadius: 12, background: tok.sysRowBg, border: `1px solid ${r.pct >= 85 ? "rgba(239,68,68,.3)" : tok.alertBdr}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <r.icon size={15} color={col} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: tok.cardText }}>{r.label}</span>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: col }}>
                      {r.pct >= 0 ? `${r.pct}%` : "—"}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: tok.alertBg, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ height: "100%", width: r.pct >= 0 ? `${r.pct}%` : "0%", background: col, borderRadius: 3, transition: "width .6s ease" }} />
                  </div>
                  <span style={{ fontSize: 10, color: tok.cardSub }}>{r.sub}</span>
                </div>
              );
            });
          })()}
        </div>
        {sysMetrics && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[
              { label: "Uptime",   value: (() => { const h = Math.floor(sysMetrics.uptime / 3600); return h > 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${Math.floor((sysMetrics.uptime % 3600) / 60)}m`; })(), color: "#4ade80" },
              { label: "Load 1m",  value: sysMetrics.load["1m"],  color: "#a5b4fc" },
              { label: "Load 5m",  value: sysMetrics.load["5m"],  color: "#c4b5fd" },
              { label: "Load 15m", value: sysMetrics.load["15m"], color: "#818cf8" },
            ].map(s => (
              <div key={s.label} style={{ padding: "10px 12px", borderRadius: 10, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
                <p style={{ fontSize: 14, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: 10, color: tok.cardSub, margin: "2px 0 0" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pending Actions ── */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Clock size={14} color="#fbbf24" />, "Pending Actions", "Requires Attention")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {[
            { label: "User Approvals", value: stats.pendingApprovals,   icon: Users,        color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/users" },
            { label: "Withdrawals",    value: stats.pendingWithdrawals,  icon: Wallet,       color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/withdrawals" },
            { label: "Aadhaar Verify", value: stats.pendingAadhaar,      icon: Fingerprint,  color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/verifications" },
            { label: "Bank Verify",    value: stats.pendingBank,         icon: Landmark,     color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/bank-verifications" },
            { label: "Recovery",       value: stats.pendingRecovery,     icon: LifeBuoy,     color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/recovery-requests" },
            { label: "Profile Edits",  value: stats.pendingProfileEdits, icon: Edit,         color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/profile-edits" },
            { label: "Support Unread", value: stats.unreadSupportChats,  icon: MessageSquare,color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/help-support" },
          ].map(c => (
            <div key={c.label}
              style={{ ...card, padding: "14px", cursor: "pointer", border: c.value > 0 ? "1px solid rgba(239,68,68,.2)" : `1px solid ${tok.cardBdr}`, transition: "all .2s" }}
              onClick={() => navigate(c.path)}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <c.icon size={14} style={{ color: c.color }} />
              </div>
              <p style={{ fontWeight: 900, color: c.value > 0 ? c.color : tok.cardText, fontSize: 22, letterSpacing: "-0.5px", margin: 0 }}>{c.value}</p>
              <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "2px 0 0" }}>{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity Timeline + Financial Overview ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Activity size={14} color="#fbbf24" />, "Activity Timeline", "Live")}
          {timeline.length === 0 ? emptyBox(Activity, "No recent activity") : (
            <div style={{ position: "relative", paddingLeft: 28 }}>
              <div style={{ position: "absolute", left: 10, top: 0, bottom: 0, width: 1, background: tok.timelineLine }} />
              {timeline.map((ev, i) => (
                <div key={i} style={{ position: "relative", paddingBottom: i < timeline.length - 1 ? 16 : 0 }}>
                  <div style={{ position: "absolute", left: -24, top: 1, width: 26, height: 26, borderRadius: 8, background: ev.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ev.icon size={12} style={{ color: ev.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, margin: 0 }}>{ev.label}</p>
                    <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "1px 0 0" }}>{ev.detail}</p>
                    <p style={{ fontSize: 10, color: tok.cardSub, opacity: .6, margin: "1px 0 0" }}>{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<IndianRupee size={14} color="#4ade80" />, "Financial Overview")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Total Revenue",       value: fmt(totalRev),                            color: "#4ade80", icon: TrendingUp,   path: "/admin/wallet-management" },
              { label: "Freelancer Earnings", value: fmt(stats.employeeEarnings),              color: "#a5b4fc", icon: UserCheck,    path: "/admin/wallet-management" },
              { label: "Employer Earnings",   value: fmt(stats.clientEarnings),                color: "#c4b5fd", icon: Building2,    path: "/admin/wallet-management" },
              { label: "Platform Commission", value: fmt(Math.round(totalRev * 0.1)),          color: "#fbbf24", icon: IndianRupee,  path: "/admin/wallet-management" },
              { label: "Pending Withdrawals", value: `${stats.pendingWithdrawals} req`,         color: stats.pendingWithdrawals > 0 ? "#f87171" : "#4ade80", icon: Clock, path: "/admin/withdrawals" },
              { label: "Approved Users",      value: `${stats.approvedUsers} / ${stats.totalUsers}`, color: "#4ade80", icon: UserCheck, path: "/admin/users" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 11, cursor: "pointer", transition: "background .15s" }}
                onClick={() => navigate(s.path)}
                onMouseEnter={e => (e.currentTarget.style.background = tok.rowHover)}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <s.icon size={13} color={s.color} />
                </div>
                <span style={{ flex: 1, fontSize: 12.5, color: tok.cardText, fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ VERIFICATION STATUS OVERVIEW + REFERRAL STATS ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Verification Overview */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Fingerprint size={14} color="#fbbf24" />, "Verification Status Overview")}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Aadhaar */}
            <div style={{ padding: "12px", borderRadius: 12, background: tok.sysRowBg, border: `1px solid ${tok.alertBdr}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <Fingerprint size={13} color="#fbbf24" />
                <span style={{ fontSize: 12, fontWeight: 700, color: tok.cardText }}>Aadhaar KYC</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#4ade80" }}>
                  {verificationStats.aadhaarVerified} verified
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                {[
                  { label: "Verified",     val: verificationStats.aadhaarVerified,     color: "#4ade80" },
                  { label: "Pending",      val: verificationStats.aadhaarPending,      color: "#fbbf24" },
                  { label: "Rejected",     val: verificationStats.aadhaarRejected,     color: "#f87171" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center", padding: "6px", borderRadius: 8, background: `${s.color}10` }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: s.color, margin: 0 }}>{s.val}</p>
                    <p style={{ fontSize: 9.5, color: tok.cardSub, margin: "1px 0 0" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Bank */}
            <div style={{ padding: "12px", borderRadius: 12, background: tok.sysRowBg, border: `1px solid ${tok.alertBdr}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <Landmark size={13} color="#a5b4fc" />
                <span style={{ fontSize: 12, fontWeight: 700, color: tok.cardText }}>Bank Verification</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#4ade80" }}>
                  {verificationStats.bankVerified} verified
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                {[
                  { label: "Verified",     val: verificationStats.bankVerified,     color: "#4ade80" },
                  { label: "Pending",      val: verificationStats.bankPending,      color: "#fbbf24" },
                  { label: "Rejected",     val: verificationStats.bankRejected,     color: "#f87171" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center", padding: "6px", borderRadius: 8, background: `${s.color}10` }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: s.color, margin: 0 }}>{s.val}</p>
                    <p style={{ fontSize: 9.5, color: tok.cardSub, margin: "1px 0 0" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Referral Program Stats */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<UserPlus size={14} color="#4ade80" />, "Referral Program", `${referralStats.total} total`)}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Total Referrals",   val: referralStats.total,          color: "#4ade80",  icon: UserPlus },
              { label: "Unique Referrers",  val: referralStats.uniqueReferrers, color: "#a5b4fc", icon: Users },
              { label: "Signup Bonuses",    val: referralStats.signupBonuses,  color: "#fbbf24",  icon: IndianRupee },
              { label: "Job Bonuses Paid",  val: referralStats.jobBonuses,     color: "#c4b5fd",  icon: Briefcase },
            ].map(s => (
              <div key={s.label} style={{ padding: "12px", borderRadius: 10, background: `${s.color}0f`, border: `1px solid ${s.color}25` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                  <s.icon size={12} color={s.color} />
                  <span style={{ fontSize: 10, color: tok.cardSub }}>{s.label}</span>
                </div>
                <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: 0 }}>{s.val}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 10, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: tok.cardText, fontWeight: 600 }}>Conversion Rate</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#4ade80" }}>{referralStats.conversionRate}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: tok.sysRowBg, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${referralStats.conversionRate}%`, background: "#4ade80", borderRadius: 3 }} />
            </div>
            <p style={{ fontSize: 10, color: tok.cardSub, margin: "4px 0 0" }}>Referred users who completed signup bonus</p>
          </div>
        </div>
      </div>

      {/* ══ COMMISSION TRACKER + PLATFORM GROWTH KPIs ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Commission Tracker */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<IndianRupee size={14} color="#fbbf24" />, "Commission Tracker", "10% of revenue")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Today",      val: commissionStats.today,     color: "#4ade80", bg: "rgba(34,197,94,.08)",   border: "rgba(34,197,94,.2)" },
              { label: "This Week",  val: commissionStats.thisWeek,  color: "#a5b4fc", bg: "rgba(99,102,241,.08)",  border: "rgba(99,102,241,.2)" },
              { label: "This Month", val: commissionStats.thisMonth, color: "#fbbf24", bg: "rgba(245,158,11,.08)",  border: "rgba(245,158,11,.2)" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: s.bg, border: `1px solid ${s.border}` }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10.5, color: tok.cardSub, margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: "2px 0 0" }}>
                    {fmt(s.val)}
                  </p>
                </div>
                <IndianRupee size={22} color={s.color} style={{ opacity: 0.4 }} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: tok.cardSub, marginTop: 10, margin: "10px 0 0" }}>
            Commission = 10% of all credit transactions
          </p>
        </div>

        {/* Platform Growth KPIs */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<TrendingUp size={14} color="#4ade80" />, "Platform Growth KPIs")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                label: "User Growth (MoM)",
                val: `${growthKPIs.momUserPct > 0 ? "+" : ""}${growthKPIs.momUserPct}%`,
                color: growthKPIs.momUserPct >= 0 ? "#4ade80" : "#f87171",
                icon: growthKPIs.momUserPct >= 0 ? TrendingUp : TrendingDown,
                sub: "vs last month",
              },
              {
                label: "Revenue Growth (MoM)",
                val: `${growthKPIs.momRevPct > 0 ? "+" : ""}${growthKPIs.momRevPct}%`,
                color: growthKPIs.momRevPct >= 0 ? "#4ade80" : "#f87171",
                icon: growthKPIs.momRevPct >= 0 ? TrendingUp : TrendingDown,
                sub: "this month vs last",
              },
              {
                label: "Job Completion Rate",
                val: `${growthKPIs.jobCompletionRate}%`,
                color: growthKPIs.jobCompletionRate >= 70 ? "#4ade80" : growthKPIs.jobCompletionRate >= 40 ? "#fbbf24" : "#f87171",
                icon: CheckCircle2,
                sub: "completed / total active",
              },
              {
                label: "Avg Withdrawal Amount",
                val: fmt(growthKPIs.avgWithdrawal),
                color: "#a5b4fc",
                icon: Wallet,
                sub: "per withdrawal request",
              },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 11, background: tok.sysRowBg, border: `1px solid ${tok.alertBdr}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <s.icon size={14} color={s.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: tok.cardSub, margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: 10, color: tok.cardSub, opacity: 0.6, margin: 0 }}>{s.sub}</p>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ TOP EMPLOYERS ══ */}
      {topEmployers.length > 0 && (
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Building2 size={14} color="#c4b5fd" />, "Most Active Employers", "By jobs posted")}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topEmployers.map((e, i) => {
              const maxJobs = topEmployers[0]?.jobs || 1;
              const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: i === 0 ? "rgba(196,181,253,.07)" : tok.sysRowBg, border: `1px solid ${i === 0 ? "rgba(196,181,253,.2)" : tok.alertBdr}` }}>
                  <span style={{ fontSize: 18, width: 24 }}>{medals[i]}</span>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(139,92,246,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Building2 size={14} color="#c4b5fd" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: tok.cardText, margin: 0 }}>{e.name}</p>
                    <div style={{ height: 4, borderRadius: 2, background: tok.alertBg, marginTop: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.round(e.jobs / maxJobs * 100)}%`, background: "#c4b5fd", borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "#c4b5fd", margin: 0 }}>{e.jobs}</p>
                    <p style={{ fontSize: 10, color: tok.cardSub, margin: 0 }}>jobs posted</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ ALERT CENTER ══ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Shield size={14} color="#f87171" />, "Alert Center", sysAlerts.length > 0 ? `${sysAlerts.length} active` : "All clear", sysAlerts.length > 0 ? "#f87171" : "#4ade80")}
        {sysAlerts.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px", borderRadius: 12, background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.15)" }}>
            <CheckCircle2 size={20} color="#4ade80" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: 0 }}>No active alerts</p>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "2px 0 0" }}>Everything is running smoothly.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sysAlerts.map((a, i) => (
              <div key={i}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: a.bg, border: `1px solid ${a.border}`, cursor: "pointer" }}
                onClick={() => navigate(a.path)}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${a.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: a.color }}>{a.count}</span>
                </div>
                <p style={{ fontSize: 12.5, color: tok.cardText, flex: 1, margin: 0 }}>{a.msg}</p>
                <ArrowUpRight size={14} color={a.color} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ CATEGORY ANALYTICS + REGION JOB STATS ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Category Analytics */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Tag size={14} color="#fbbf24" />, "Job Category Analytics", "Top categories")}
          {categoryStats.length === 0 ? emptyBox(Tag, "No category data") : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {categoryStats.map((c, i) => {
                const maxC = categoryStats[0]?.count || 1;
                return (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: tok.cardSub, width: 16, textAlign: "right", flexShrink: 0 }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: tok.cardText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: c.color, flexShrink: 0, marginLeft: 8 }}>{c.count}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: tok.alertBg, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round(c.count / maxC * 100)}%`, background: c.color, borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Retention Tracker */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<RotateCcw size={14} color="#a5b4fc" />, "User Retention Tracker")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Active (last 7 days)",     val: retentionStats.active7d,       color: "#4ade80", bg: "rgba(34,197,94,.08)",   border: "rgba(34,197,94,.18)" },
              { label: "Semi-active (7–30 days)",  val: retentionStats.inactive7to30d, color: "#fbbf24", bg: "rgba(245,158,11,.08)",  border: "rgba(245,158,11,.18)" },
              { label: "Inactive (30+ days)",      val: retentionStats.inactive30d,    color: "#f87171", bg: "rgba(239,68,68,.08)",   border: "rgba(239,68,68,.18)" },
              { label: "Never logged in",          val: retentionStats.neverSeen,      color: "#94a3b8", bg: "rgba(100,116,139,.08)", border: "rgba(100,116,139,.18)" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 11, background: s.bg, border: `1px solid ${s.border}` }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: 0, width: 42, flexShrink: 0 }}>{s.val}</p>
                <p style={{ fontSize: 11.5, color: tok.cardText, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ NEW REGISTRATIONS FEED + BANNED ACCOUNTS ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* New Registrations Feed */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Calendar size={14} color="#4ade80" />, "New Registrations Feed", "Latest 10")}
          {latestUsers.length === 0 ? emptyBox(Calendar, "No users yet") : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {latestUsers.map(u => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 11, background: tok.sysRowBg, border: `1px solid ${tok.alertBdr}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: u.user_type === "employee" ? "rgba(99,102,241,.15)" : "rgba(139,92,246,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {u.user_type === "employee" ? <Users size={13} color="#a5b4fc" /> : <Building2 size={13} color="#c4b5fd" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getName(u.full_name)}</p>
                    <p style={{ fontSize: 10, color: tok.cardSub, margin: 0 }}>{u.registration_region || "—"} · <span style={{ color: u.user_type === "employee" ? "#a5b4fc" : "#c4b5fd" }}>{u.user_type === "employee" ? "Freelancer" : "Employer"}</span></p>
                  </div>
                  <span style={{ fontSize: 10, color: tok.cardSub, flexShrink: 0 }}>{relTime(u.created_at)}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate("/admin/users")} style={{ width: "100%", marginTop: 10, padding: "8px", borderRadius: 9, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            View All Users →
          </button>
        </div>

        {/* Banned/Suspended Accounts */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Ban size={14} color="#f87171" />, "Banned / Disabled Accounts", disabledUsers.length > 0 ? `${disabledUsers.length} found` : "None", disabledUsers.length > 0 ? "#f87171" : "#4ade80")}
          {disabledUsers.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px", borderRadius: 12, background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.15)" }}>
              <CheckCircle2 size={18} color="#4ade80" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: 0 }}>No disabled accounts</p>
                <p style={{ fontSize: 11, color: tok.cardSub, margin: "2px 0 0" }}>All accounts are active.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {disabledUsers.map(u => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 11, background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.15)" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(239,68,68,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Ban size={13} color="#f87171" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, margin: 0 }}>{getName(u.full_name)}</p>
                    <p style={{ fontSize: 10, color: "#f87171", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.disabled_reason || "No reason given"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate("/admin/users")} style={{ width: "100%", marginTop: 10, padding: "8px", borderRadius: 9, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Manage Users →
          </button>
        </div>
      </div>

      {/* ══ MESSAGE ANALYTICS + FRAUD DETECTION ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Message Analytics */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<MessageCircle size={14} color="#a5b4fc" />, "Message Analytics")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Total Messages",   val: messageStats.total,  color: "#a5b4fc", icon: MessageCircle },
              { label: "Unread Messages",  val: messageStats.unread, color: "#fbbf24", icon: Mail },
              { label: "Active Chat Rooms", val: messageStats.rooms, color: "#4ade80", icon: MessageSquare },
              { label: "Sent Today",       val: messageStats.today,  color: "#c4b5fd", icon: Zap },
            ].map(s => (
              <div key={s.label} style={{ padding: "12px", borderRadius: 11, background: `${s.color}0f`, border: `1px solid ${s.color}22` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                  <s.icon size={12} color={s.color} />
                  <span style={{ fontSize: 10, color: tok.cardSub }}>{s.label}</span>
                </div>
                <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: 0 }}>{s.val}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={resetUnreadMessages}
              disabled={msgResetting || messageStats.unread === 0}
              style={{ flex: 1, padding: "8px", borderRadius: 9, background: messageStats.unread > 0 ? "rgba(251,191,36,.1)" : tok.alertBg, border: `1px solid ${messageStats.unread > 0 ? "rgba(251,191,36,.3)" : tok.alertBdr}`, color: messageStats.unread > 0 ? "#fbbf24" : tok.cardSub, fontSize: 12, fontWeight: 700, cursor: messageStats.unread > 0 ? "pointer" : "not-allowed", opacity: msgResetting ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              {msgResetting
                ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Resetting…</>
                : <>↺ Reset Unread ({messageStats.unread})</>
              }
            </button>
            <button onClick={() => navigate("/admin/help-support")} style={{ flex: 1, padding: "8px", borderRadius: 9, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              View All Messages →
            </button>
          </div>
        </div>

        {/* Fraud Detection Panel */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<AlertTriangle size={14} color="#f87171" />, "Fraud Detection", duplicateIPs.length > 0 ? `${duplicateIPs.length} alerts` : "Clean", duplicateIPs.length > 0 ? "#f87171" : "#4ade80")}
          {duplicateIPs.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px", borderRadius: 12, background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.15)" }}>
              <Shield size={18} color="#4ade80" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: 0 }}>No duplicate IPs detected</p>
                <p style={{ fontSize: 11, color: tok.cardSub, margin: "2px 0 0" }}>All registration IPs are unique.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 8px" }}>Multiple accounts from same IP address:</p>
              {duplicateIPs.map(d => (
                <div key={d.ip} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 11, background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.15)" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(239,68,68,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Globe size={13} color="#f87171" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, margin: 0 }}>{d.ip}</p>
                    <p style={{ fontSize: 10, color: tok.cardSub, margin: 0 }}>Registration IP</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "#f87171", margin: 0 }}>{d.count}</p>
                    <p style={{ fontSize: 10, color: tok.cardSub, margin: 0 }}>accounts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate("/admin/users")} style={{ width: "100%", marginTop: 10, padding: "8px", borderRadius: 9, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Review Users →
          </button>
        </div>
      </div>

      {/* ══ RECOVERY REQUESTS TRACKER ══ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<RotateCcw size={14} color="#fbbf24" />, "Recovery Requests Tracker", `${recoveryData.total} total`)}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Open / Pending", val: recoveryData.open,     color: "#fbbf24", bg: "rgba(245,158,11,.08)",  border: "rgba(245,158,11,.18)" },
            { label: "Resolved",       val: recoveryData.resolved, color: "#4ade80", bg: "rgba(34,197,94,.08)",   border: "rgba(34,197,94,.18)" },
            { label: "Total",          val: recoveryData.total,    color: "#a5b4fc", bg: "rgba(99,102,241,.08)",  border: "rgba(99,102,241,.18)" },
            { label: "Total Held Amt", val: 0,                     color: "#f87171", bg: "rgba(239,68,68,.08)",   border: "rgba(239,68,68,.18)", fmtAmt: recoveryData.totalAmt },
          ].map(s => (
            <div key={s.label} style={{ padding: "12px", borderRadius: 11, background: s.bg, border: `1px solid ${s.border}`, textAlign: "center" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: s.color, margin: 0 }}>
                {"fmtAmt" in s ? fmt(s.fmtAmt!) : s.val}
              </p>
              <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "3px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.15)" }}>
            <p style={{ fontSize: 11, color: tok.cardSub, margin: 0 }}>Resolution rate</p>
            <div style={{ height: 5, borderRadius: 3, background: tok.alertBg, marginTop: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: recoveryData.total > 0 ? `${Math.round(recoveryData.resolved / recoveryData.total * 100)}%` : "0%", background: "#4ade80", borderRadius: 3 }} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", margin: "4px 0 0" }}>
              {recoveryData.total > 0 ? `${Math.round(recoveryData.resolved / recoveryData.total * 100)}%` : "N/A"}
            </p>
          </div>
          <button onClick={() => navigate("/admin/recovery-requests")} style={{ padding: "10px 18px", borderRadius: 10, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)", color: "#fbbf24", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Manage →
          </button>
        </div>
      </div>

      {/* ══ RECENT ACTIVITY LOG ══ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Activity size={14} color="#a5b4fc" />, "Recent Activity Log", `${activityFeed.length} events`)}
        {activityFeed.length === 0 ? emptyBox(Activity, "No recent activity") : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
            {activityFeed.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 11, background: tok.sysRowBg, border: `1px solid ${tok.alertBdr}` }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${e.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <e.icon size={13} color={e.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, margin: 0 }}>{e.label}</p>
                  <p style={{ fontSize: 10.5, color: tok.cardSub, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.detail}</p>
                </div>
                <span style={{ fontSize: 10, color: tok.cardSub, flexShrink: 0 }}>{e.time}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: activityFeed.length === 0 ? 12 : 0 }}>
          <button
            onClick={resetActivityFeed}
            disabled={feedResetting}
            style={{ flex: 1, padding: "8px", borderRadius: 9, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.3)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: feedResetting ? "not-allowed" : "pointer", opacity: feedResetting ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {feedResetting
              ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Refreshing…</>
              : <>↺ Refresh Log</>
            }
          </button>
          <button
            onClick={() => setActivityFeed([])}
            disabled={activityFeed.length === 0}
            style={{ flex: 1, padding: "8px", borderRadius: 9, background: activityFeed.length > 0 ? "rgba(239,68,68,.08)" : tok.alertBg, border: `1px solid ${activityFeed.length > 0 ? "rgba(239,68,68,.25)" : tok.alertBdr}`, color: activityFeed.length > 0 ? "#f87171" : tok.cardSub, fontSize: 12, fontWeight: 700, cursor: activityFeed.length > 0 ? "pointer" : "not-allowed" }}>
            ✕ Clear Log
          </button>
        </div>
      </div>

      {/* ══ PAYMENT ANALYTICS + PENDING PAYOUTS ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Payment Analytics */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<ArrowLeftRight size={14} color="#4ade80" />, "Payment Analytics", "Last 6 months")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Total Credits",  val: paymentStats.creditAmt,   color: "#4ade80", sub: `${paymentStats.creditCount} transactions`, icon: TrendingUp },
              { label: "Total Debits",   val: paymentStats.debitAmt,    color: "#f87171", sub: `${paymentStats.debitCount} transactions`, icon: TrendingDown },
            ].map(s => (
              <div key={s.label} style={{ padding: "14px", borderRadius: 12, background: `${s.color}0e`, border: `1px solid ${s.color}22` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                  <s.icon size={13} color={s.color} />
                  <span style={{ fontSize: 11, color: tok.cardSub }}>{s.label}</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 900, color: s.color, margin: 0 }}>{fmt(s.val)}</p>
                <p style={{ fontSize: 10, color: tok.cardSub, margin: "3px 0 0" }}>{s.sub}</p>
              </div>
            ))}
          </div>
          {paymentStats.creditCount + paymentStats.debitCount > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: tok.cardSub }}>Credit/Debit ratio</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>
                  {Math.round(paymentStats.creditCount / (paymentStats.creditCount + paymentStats.debitCount) * 100)}% credits
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "rgba(239,68,68,.2)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round(paymentStats.creditCount / (paymentStats.creditCount + paymentStats.debitCount) * 100)}%`, background: "#4ade80", borderRadius: 4 }} />
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={resetPaymentStats}
              disabled={payResetting}
              style={{ flex: 1, padding: "8px", borderRadius: 9, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.3)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: payResetting ? "not-allowed" : "pointer", opacity: payResetting ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              {payResetting
                ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Refreshing…</>
                : <>↺ Refresh Stats</>
              }
            </button>
            <button onClick={() => navigate("/admin/wallet-management")} style={{ flex: 1, padding: "8px", borderRadius: 9, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              View Transactions →
            </button>
          </div>
        </div>

        {/* Pending Payouts Queue */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Package size={14} color="#fbbf24" />, "Pending Payouts Queue", `${pendingPayouts.length} pending`)}
          {pendingPayouts.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px", borderRadius: 12, background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.15)" }}>
              <CheckCircle2 size={18} color="#4ade80" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: 0 }}>No pending payouts</p>
                <p style={{ fontSize: 11, color: tok.cardSub, margin: "2px 0 0" }}>All withdrawals are processed.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {pendingPayouts.slice(0, 8).map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 11, background: tok.sysRowBg, border: `1px solid ${tok.alertBdr}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(245,158,11,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Wallet size={13} color="#fbbf24" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                    <p style={{ fontSize: 10, color: tok.cardSub, margin: 0 }}>{p.method?.toUpperCase()} · {relTime(p.requested_at)}</p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 900, color: "#fbbf24", margin: 0, flexShrink: 0 }}>{fmt(p.amount)}</p>
                </div>
              ))}
              {pendingPayouts.length > 8 && (
                <p style={{ fontSize: 11, color: tok.cardSub, textAlign: "center", margin: "4px 0 0" }}>+{pendingPayouts.length - 8} more pending</p>
              )}
            </div>
          )}
          <button onClick={() => navigate("/admin/withdrawals")} style={{ width: "100%", marginTop: 10, padding: "8px", borderRadius: 9, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: "#fbbf24", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Process Payouts →
          </button>
        </div>
      </div>

      {/* ── Quick Access ── */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Wifi size={14} color={A1} />, "Quick Access", "All Sections")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
          {[
            { label: "Users",         path: "/admin/users",              icon: Users,        color: "#a5b4fc" },
            { label: "Freelancers",   path: "/admin/freelancers",        icon: UserCheck,    color: "#a5b4fc" },
            { label: "Employers",     path: "/admin/employers",          icon: Building2,    color: "#c4b5fd" },
            { label: "Jobs",          path: "/admin/jobs",               icon: Briefcase,    color: "#4ade80" },
            { label: "Wallet",        path: "/admin/wallet-management",  icon: Wallet,       color: "#4ade80" },
            { label: "Withdrawals",   path: "/admin/withdrawals",        icon: IndianRupee,  color: "#fbbf24" },
            { label: "Verifications", path: "/admin/verifications",      icon: Fingerprint,  color: "#fbbf24" },
            { label: "Bank Verify",   path: "/admin/bank-verifications", icon: Landmark,     color: "#fbbf24" },
            { label: "Audit Logs",    path: "/admin/audit-logs",         icon: ClipboardList,color: "#c4b5fd" },
            { label: "Server",        path: "/admin/server-monitor",     icon: Server,       color: "#4ade80" },
            { label: "Support",       path: "/admin/help-support",       icon: MessageSquare,color: "#f87171" },
            { label: "IP Blocking",   path: "/admin/ip-blocking",        icon: Globe,        color: "#f87171" },
          ].map(q => (
            <button key={q.label} onClick={() => navigate(q.path)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "14px 8px", borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = `${q.color}12`; b.style.borderColor = `${q.color}30`; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = tok.alertBg; b.style.borderColor = tok.alertBdr; }}>
              <q.icon size={18} color={q.color} />
              <span style={{ fontSize: 10, color: tok.cardText, fontWeight: 600, textAlign: "center" }}>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
