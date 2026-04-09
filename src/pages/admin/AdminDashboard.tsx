import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  MessageCircle, RotateCcw, Tag, ArrowLeftRight, DollarSign, Search, Flag,
} from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Line, ReferenceLine,
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

const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  custom:    { subject: "", body: "" },
  welcome:   { subject: "Welcome to Freelan.space!", body: "Dear User,\n\nWelcome to Freelan.space — India's leading freelance platform. Complete your profile to start earning or hiring today.\n\nBest regards,\nFreelan Team" },
  reminder:  { subject: "Complete Your Profile — Action Required", body: "Dear User,\n\nWe noticed your profile is incomplete. Please update your details to get the most out of Freelan.space.\n\nClick here to complete your profile.\n\nFreelan Team" },
  promotion: { subject: "Special Offer — 0% Commission This Weekend!", body: "Dear User,\n\nThis weekend only — post or accept projects with ZERO platform commission.\n\nOffer valid: Friday to Sunday.\n\nFreelan Team" },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { theme, themeKey, setTheme } = useAdminTheme();
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
  const [jobClearing, setJobClearing]       = useState(false);
  const [timelineClearing, setTimelineClearing] = useState(false);
  const [kpiClearing, setKpiClearing]           = useState(false);
  const [regFeedClearing, setRegFeedClearing]   = useState(false);
  const [msgClearing, setMsgClearing]           = useState(false);
  const [recoveryClearing, setRecoveryClearing] = useState(false);
  const [wdRefreshing, setWdRefreshing]           = useState(false);
  const [wdClearing, setWdClearing]               = useState(false);
  const [verRefreshing, setVerRefreshing]         = useState(false);
  const [refRefreshing, setRefRefreshing]         = useState(false);
  const [refClearing, setRefClearing]             = useState(false);
  const [topEmpRefreshing, setTopEmpRefreshing]   = useState(false);
  const [fraudClearing, setFraudClearing]         = useState(false);
  const [pendingClearing, setPendingClearing]     = useState(false);
  const [csvExporting, setCsvExporting]           = useState(false);
  const [announcementText, setAnnouncementText]   = useState("");
  const [announceSending, setAnnounceSending]     = useState(false);
  const [liveOnline, setLiveOnline]               = useState(0);
  const [autoRefresh, setAutoRefresh]             = useState(false);
  const [autoRefreshSecs, setAutoRefreshSecs]     = useState<30 | 60>(30);
  const [revDateStart, setRevDateStart]           = useState("");
  const [revDateEnd, setRevDateEnd]               = useState("");
  // ── User Management Tools ─────────────────────────────────────
  const [umAllUsers, setUmAllUsers] = useState<Array<{
    id: string; full_name: string[] | null; email: string | null; user_type: string;
    approval_status: string; is_disabled: boolean | null; disabled_reason: string | null;
    registration_region: string | null; created_at: string;
  }>>([]);
  const [umSearch, setUmSearch]         = useState("");
  const [umType, setUmType]             = useState<"all" | "employee" | "client">("all");
  const [umStatus, setUmStatus]         = useState("all");
  const [umSelected, setUmSelected]     = useState<Set<string>>(new Set());
  const [umBulking, setUmBulking]       = useState<"approve" | "reject" | null>(null);
  const [umBanId, setUmBanId]           = useState<string | null>(null);
  const [umBanReason, setUmBanReason]   = useState("");
  const [umBanning, setUmBanning]       = useState(false);
  const [umExporting, setUmExporting]   = useState(false);
  const [umPage, setUmPage]             = useState(1);
  const UM_PER_PAGE                     = 12;

  // ── Security & Moderation ──────────────────────────────────────
  // IP Ban Manager
  const [bannedIPs, setBannedIPs]               = useState<Array<{ id: string; ip_address: string; reason: string | null; created_at: string; is_active: boolean }>>([]);
  const [ipBanInput, setIpBanInput]             = useState("");
  const [ipBanReason, setIpBanReason]           = useState("");
  const [ipBanning, setIpBanning]               = useState(false);
  const [ipLoading, setIpLoading]               = useState(false);
  // Suspicious Login Alerts
  const [suspLogins, setSuspLogins]             = useState<Array<{ id: string; action: string; metadata: Record<string, unknown> | null; created_at: string }>>([]);
  // Content Flagging Queue
  const [flaggedItems, setFlaggedItems]         = useState<Array<{ id: string; type: string; title: string; created_at: string; status: string }>>([]);
  const [flagResolving, setFlagResolving]       = useState<string | null>(null);
  // Rate Limit Stats
  const [rlStats, setRlStats]                   = useState({ totalBans: 0, activeBans: 0, last24h: 0, topReasons: [] as Array<{ reason: string; count: number }> });

  // ── Platform Settings ──────────────────────────────────────────
  // Maintenance Mode
  const [maintMode, setMaintMode]           = useState(false);
  const [maintMsg, setMaintMsg]             = useState("Platform is under maintenance. We'll be back shortly.");
  const [maintSaving, setMaintSaving]       = useState(false);
  // Feature Flags
  const [featureFlags, setFeatureFlags]     = useState<Record<string, boolean>>({
    enable_referral_system: true,
    enable_wallet_topup: true,
    enable_aadhaar_verification: true,
    enable_freelancer_registration: true,
    enable_employer_registration: true,
    enable_job_posting: true,
  });
  const [flagSaving, setFlagSaving]         = useState<string | null>(null);
  // Referral Bonus Config
  const [referralBonus, setReferralBonus]   = useState(100);
  const [referralMinPay, setReferralMinPay] = useState(500);
  const [referralSaving, setReferralSaving] = useState(false);
  // Platform Fee Editor
  const [pfeeRate, setPfeeRate]             = useState(5);
  const [pfeeMin, setPfeeMin]               = useState(10);
  const [pfeeMax, setPfeeMax]               = useState(5000);
  const [pfeeSaving, setPfeeSaving]         = useState(false);

  // ── KPI Goal Tracker ───────────────────────────────────────────
  const [kpiGoals, setKpiGoals]         = useState([
    { id: "users",     label: "Total Users",      icon: "👤", goal: 1000,  current: 0, color: "#6366f1" },
    { id: "revenue",   label: "Monthly Revenue",  icon: "💰", goal: 50000, current: 0, color: "#4ade80", prefix: "₹" },
    { id: "projects",  label: "Active Projects",  icon: "💼", goal: 200,   current: 0, color: "#fbbf24" },
    { id: "verified",  label: "Verified Users",   icon: "✅", goal: 500,   current: 0, color: "#34d399" },
  ]);
  const [kpiEditing, setKpiEditing]     = useState<string | null>(null);
  const [kpiEditVal, setKpiEditVal]     = useState("");

  // ── Admin Activity Log ─────────────────────────────────────────
  const [activityLog, setActivityLog]   = useState<Array<{ id: string; action: string; created_at: string; metadata: Record<string, unknown> | null }>>([]);
  const [actLogLoading, setActLogLoading] = useState(false);

  // ── Quick Global Search ────────────────────────────────────────
  const [qsQuery, setQsQuery]           = useState("");
  const [qsResults, setQsResults]       = useState<Array<{ type: string; label: string; sub: string; id: string }>>([]);
  const [qsSearching, setQsSearching]   = useState(false);
  const [qsOpen, setQsOpen]             = useState(false);

  // ── Revenue Analytics ──────────────────────────────────────────
  const [revChartData, setRevChartData] = useState<Array<{ month: string; income: number; commission: number; projects: number }>>([]);
  const [revLoading, setRevLoading]     = useState(false);

  // ── User Growth Timeline ───────────────────────────────────────
  const [growthTimelineData, setGrowthTimelineData] = useState<Array<{ week: string; freelancers: number; clients: number; total: number }>>([]);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [growthPeriod, setGrowthPeriod] = useState<"weekly"|"monthly">("weekly");

  // ── Top Freelancers Leaderboard ────────────────────────────────
  const [topFreelancers, setTopFreelancers] = useState<Array<{ id: string; name: string; email: string; balance: number; projects: number; rank: number }>>([]);
  const [topFLLoading, setTopFLLoading] = useState(false);

  // ── Withdrawal Queue ──────────────────────────────────────────
  const [wdQueue, setWdQueue]           = useState<Array<{ id: string; profile_id: string; amount: number; status: string; created_at: string; userName: string; userEmail: string }>>([]);
  const [wdLoading, setWdLoading]       = useState(false);
  const [wdProcessing, setWdProcessing] = useState<string | null>(null);

  // ── Referral Analytics ────────────────────────────────────────
  const [refStats, setRefStats]         = useState({ total: 0, converted: 0, pending: 0, bonusPaid: 0 });
  const [refTopReferrers, setRefTopReferrers] = useState<Array<{ id: string; name: string; count: number }>>([]);
  const [refLoading, setRefLoading]     = useState(false);

  // ── Geo Analytics ────────────────────────────────────────────
  const [geoData, setGeoData]           = useState<Array<{ region: string; count: number; pct: number }>>([]);
  const [geoLoading, setGeoLoading]     = useState(false);

  // ── Skill & Category Analytics ───────────────────────────────
  const [skillData, setSkillData]       = useState<Array<{ name: string; count: number; color: string }>>([]);
  const [skillLoading, setSkillLoading] = useState(false);

  // ── Coupon / Promo Manager ────────────────────────────────────
  const [coupons, setCoupons]           = useState<Array<{ code: string; discount: number; type: "pct"|"flat"; uses: number; maxUses: number; expires: string; active: boolean }>>([]);
  const [couponForm, setCouponForm]     = useState({ code: "", discount: "", type: "pct" as "pct"|"flat", maxUses: "100", expires: "" });
  const [couponAdding, setCouponAdding] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);

  // ── Review Moderation ─────────────────────────────────────────
  const [flaggedReviews, setFlaggedReviews] = useState<Array<{ id: string; reviewer: string; reviewee: string; rating: number; comment: string; created_at: string; flagReason: string }>>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // ── Tax Report Generator ──────────────────────────────────────
  const [taxYear, setTaxYear]           = useState(new Date().getFullYear().toString());
  const [taxQuarter, setTaxQuarter]     = useState("all");
  const [taxReportData, setTaxReportData] = useState<{ tds: number; gst: number; totalTransactions: number; totalAmount: number } | null>(null);
  const [taxLoading, setTaxLoading]     = useState(false);

  // ── Session Analytics ─────────────────────────────────────────
  const [activeNow, setActiveNow]       = useState(0);
  const [peakHours, setPeakHours]       = useState<Array<{ hour: string; users: number }>>([]);
  const [sessionLoading, setSessionLoading] = useState(false);

  // ── Project Completion Funnel ─────────────────────────────────
  const [projFunnelData, setProjFunnelData] = useState<Array<{ stage: string; count: number; color: string; pct: number }>>([]);
  const [funnelLoading, setFunnelLoading] = useState(false);

  // ── Announcement Scheduler ─────────────────────────────────────
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; body: string; scheduledAt: string; sent: boolean }>>([]);
  const [annForm, setAnnForm]           = useState({ title: "", body: "", scheduledAt: "" });
  const [annSaving, setAnnSaving]       = useState(false);
  const [showAnnForm, setShowAnnForm]   = useState(false);

  // ── Admin Sticky Notes ────────────────────────────────────────
  const [stickyNotes, setStickyNotes]   = useState<Array<{ id: string; text: string; color: string; created: string }>>([]);
  const [noteInput, setNoteInput]       = useState("");
  const [noteColor, setNoteColor]       = useState("#fbbf24");

  // ── User Segmentation ─────────────────────────────────────────
  const [segFilter, setSegFilter]       = useState({ minBalance: "", maxBalance: "", region: "", type: "all", inactive: false });
  const [segResults, setSegResults]     = useState<Array<{ id: string; name: string; email: string; balance: number; region: string; type: string }>>([]);
  const [segLoading, setSegLoading]     = useState(false);
  const [segSearched, setSegSearched]   = useState(false);

  // ── Compliance Dashboard ──────────────────────────────────────
  const [compliance, setCompliance]     = useState({ kycPending: 0, kycVerified: 0, flaggedAccounts: 0, bankPending: 0, suspendedWallets: 0, totalUsers: 0 });
  const [complianceLoading, setComplianceLoading] = useState(false);

  // ── Earnings Forecast ─────────────────────────────────────────
  const [forecast, setForecast]         = useState<Array<{ month: string; actual: number | null; projected: number }>>([]);
  const [forecastLoading, setForecastLoading] = useState(false);

  // ── Platform Health Score ─────────────────────────────────────
  const [healthScore, setHealthScore]   = useState<number | null>(null);
  const [healthBreakdown, setHealthBreakdown] = useState<Array<{ label: string; score: number; max: number; color: string }>>([]);
  const [healthLoading, setHealthLoading] = useState(false);

  // ── Dispute Resolution Tracker ────────────────────────────────
  const [disputes, setDisputes]         = useState<Array<{ id: string; title: string; raisedBy: string; against: string; status: string; created_at: string; resolved_at: string | null }>>([]);
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeFilter, setDisputeFilter] = useState("all");

  // ── A/B Feature Test Manager ──────────────────────────────────
  const [abTests, setAbTests]           = useState<Array<{ id: string; name: string; variant: string; target: string; enabled: boolean; participants: number }>>([]);
  const [abForm, setAbForm]             = useState({ name: "", variant: "A", target: "all" });
  const [showAbForm, setShowAbForm]     = useState(false);

  // ── Real-time Features ─────────────────────────────────────────
  const [rtActivity, setRtActivity]     = useState<Array<{ id: string; title: string; type: string; ts: string }>>([]);
  const [rtAlerts, setRtAlerts]         = useState<Array<{ id: string; amount: number; user: string; ts: string }>>([]);
  const [rtJobsToday, setRtJobsToday]   = useState(0);

  // ── Communication ──────────────────────────────────────────────
  // Push notification sender
  const [pushTitle, setPushTitle]       = useState("");
  const [pushBody, setPushBody]         = useState("");
  const [pushTarget, setPushTarget]     = useState<"all" | "employee" | "client">("all");
  const [pushSending, setPushSending]   = useState(false);
  const [pushMsg, setPushMsg]           = useState<{ ok: boolean; text: string } | null>(null);
  // Email broadcast
  const [emailTemplate, setEmailTemplate] = useState("custom");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody]       = useState("");
  const [emailTarget, setEmailTarget]   = useState<"all" | "employee" | "client">("all");
  const [emailSending, setEmailSending] = useState(false);
  const [emailMsg, setEmailMsg]         = useState<{ ok: boolean; text: string } | null>(null);
  // In-app message
  const [imEmail, setImEmail]           = useState("");
  const [imUserId, setImUserId]         = useState<string | null>(null);
  const [imUserName, setImUserName]     = useState("");
  const [imBody, setImBody]             = useState("");
  const [imSearching, setImSearching]   = useState(false);
  const [imSending, setImSending]       = useState(false);
  const [imMsg, setImMsg]               = useState<{ ok: boolean; text: string } | null>(null);
  const [imHistory, setImHistory]       = useState<Array<{ to: string; body: string; ts: string }>>([]);

  // ── Performance & Monitoring ───────────────────────────────────
  const [perfLoading, setPerfLoading]   = useState(false);
  const [perfResults, setPerfResults]   = useState<Array<{ table: string; ms: number; rows: number; status: "fast" | "ok" | "slow" }>>([]);
  const [uptimeLog, setUptimeLog]       = useState<Array<{ ts: string; ms: number; ok: boolean }>>([]);
  const [dbStats, setDbStats]           = useState<Array<{ table: string; rows: number; label: string }>>([]);
  const [errorRateData, setErrorRateData] = useState<Array<{ hour: string; errors: number }>>([]);
  const [lastPerfRun, setLastPerfRun]   = useState<string | null>(null);

  // ── Finance & Payments ─────────────────────────────────────────
  // Payout Scheduler
  const [payoutEnabled, setPayoutEnabled]       = useState(false);
  const [payoutDay, setPayoutDay]               = useState(1);
  const [payoutMinAmt, setPayoutMinAmt]         = useState(500);
  const [payoutAutoApprove, setPayoutAutoApprove] = useState(false);
  const [payoutSaving, setPayoutSaving]         = useState(false);
  // Commission Rule Editor
  const [commRate, setCommRate]                 = useState(10);
  const [commRateInput, setCommRateInput]       = useState("10");
  const [commSaving, setCommSaving]             = useState(false);
  // Wallet Top-Up
  const [topupEmail, setTopupEmail]             = useState("");
  const [topupUserId, setTopupUserId]           = useState<string | null>(null);
  const [topupUserName, setTopupUserName]       = useState("");
  const [topupAmount, setTopupAmount]           = useState("");
  const [topupNote, setTopupNote]               = useState("");
  const [topupSearching, setTopupSearching]     = useState(false);
  const [topupProcessing, setTopupProcessing]   = useState(false);
  const [topupMsg, setTopupMsg]                 = useState<{ ok: boolean; text: string } | null>(null);
  // Tax Summary
  const [taxData, setTaxData] = useState({ gst: 0, tds: 0, totalCommission: 0, totalRevenue: 0 });

  // ── Analytics & Charts ────────────────────────────────────────
  const [heatmapData, setHeatmapData] = useState<Array<{ date: string; count: number; label: string }>>([]);
  const [funnelData,  setFunnelData]  = useState<Array<{ step: string; value: number; color: string; pct: number }>>([]);
  const [cohortData,  setCohortData]  = useState<Array<{ month: string; total: number; active: number; rate: number }>>([]);
  const [forecastData, setForecastData] = useState<Array<{ month: string; revenue?: number; forecast?: number }>>([]);
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

      /* ── User Management Tools: store all profiles ── */
      setUmAllUsers(allProfiles.map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        user_type: p.user_type,
        approval_status: p.approval_status,
        is_disabled: p.is_disabled ?? false,
        disabled_reason: p.disabled_reason,
        registration_region: p.registration_region,
        created_at: p.created_at,
      })));

      /* ── Section 11: Top Employers ── */
      const empJobsMap: Record<string, number> = {};
      for (const p of pj) { if (p.client_id) empJobsMap[p.client_id] = (empJobsMap[p.client_id] || 0) + 1; }
      const topEmpIds = Object.entries(empJobsMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
      setTopEmployers(topEmpIds.map(id => {
        const p = allProfiles.find(x => x.id === id);
        return p ? { id, name: getName(p.full_name), jobs: empJobsMap[id] } : null;
      }).filter(Boolean) as { id: string; name: string; jobs: number }[]);

      /* ── Analytics: Activity Heatmap (last 84 days) ── */
      const heatMap: Record<string, number> = {};
      const heatDays = 84;
      for (let i = heatDays - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        heatMap[key] = 0;
      }
      for (const p of allProfiles) {
        const key = p.created_at.slice(0, 10);
        if (key in heatMap) heatMap[key]++;
      }
      setHeatmapData(Object.entries(heatMap).map(([date, count]) => {
        const d = new Date(date);
        return { date, count, label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) };
      }));

      /* ── Analytics: Conversion Funnel ── */
      const totalReg   = allProfiles.length;
      const approved   = allProfiles.filter(p => p.approval_status === "approved").length;
      const kycStarted = new Set([...(aadhaarAllQ.data || []).map(() => 1), ...(bankAllQ.data || []).map(() => 1)]).size > 0
        ? (aadhaarAllQ.data?.length || 0) + (bankAllQ.data?.length || 0)
        : 0;
      const kycVerified = Math.min(
        aAll.filter(a => a.status === "verified").length,
        bAll.filter(b => b.status === "verified").length,
      );
      const hasPostedJob = new Set(pj.map(p => p.client_id)).size;
      const fSteps = [
        { step: "Registered",    value: totalReg,   color: "#6366f1" },
        { step: "Approved",      value: approved,   color: "#a5b4fc" },
        { step: "KYC Started",   value: kycStarted, color: "#fbbf24" },
        { step: "KYC Verified",  value: kycVerified,color: "#4ade80" },
        { step: "Job Posted",    value: hasPostedJob,color: "#34d399" },
      ];
      const maxF = totalReg || 1;
      setFunnelData(fSteps.map(s => ({ ...s, pct: Math.round(s.value / maxF * 100) })));

      /* ── Analytics: Cohort Analysis (last 6 months) ── */
      const now30 = Date.now() - 30 * 86400000;
      const cohortMap: Record<string, { total: number; active: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1); d.setMonth(d.getMonth() - i);
        const k = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        cohortMap[k] = { total: 0, active: 0 };
      }
      for (const p of allProfiles) {
        const d = new Date(p.created_at);
        d.setDate(1);
        const k = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        if (k in cohortMap) {
          cohortMap[k].total++;
          if (p.last_seen_at && new Date(p.last_seen_at).getTime() > now30) cohortMap[k].active++;
        }
      }
      setCohortData(Object.entries(cohortMap).map(([month, v]) => ({
        month, total: v.total, active: v.active, rate: v.total > 0 ? Math.round(v.active / v.total * 100) : 0,
      })));

      /* ── Analytics: Revenue Forecast (linear regression + 3-month projection) ── */
      const revMonthly: Record<string, number> = {};
      for (const tx of txCred) {
        const k = new Date(tx.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        revMonthly[k] = (revMonthly[k] || 0) + Number(tx.amount);
      }
      const revPoints = Object.entries(revMonthly).map(([month, revenue]) => ({ month, revenue }));
      if (revPoints.length >= 2) {
        const n = revPoints.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = revPoints.reduce((s, p) => s + p.revenue, 0);
        const sumXY = revPoints.reduce((s, p, i) => s + i * p.revenue, 0);
        const sumXX = revPoints.reduce((s, _p, i) => s + i * i, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const historyEntries = revPoints.map((p, i) => ({ month: p.month, revenue: p.revenue, forecast: Math.max(0, Math.round(slope * i + intercept)) }));
        const futureEntries = [1, 2, 3].map(ahead => {
          const d = new Date(); d.setMonth(d.getMonth() + ahead);
          const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
          return { month: label, revenue: undefined, forecast: Math.max(0, Math.round(slope * (n - 1 + ahead) + intercept)) };
        });
        setForecastData([...historyEntries, ...futureEntries]);
      } else {
        setForecastData(revPoints.map(p => ({ month: p.month, revenue: p.revenue })));
      }

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

  /* ── Live Online Users (Supabase realtime presence) ── */
  useEffect(() => {
    const ch = supabase.channel("online-count");
    ch.on("presence", { event: "sync" }, () => {
      setLiveOnline(Object.keys(ch.presenceState()).length);
    }).subscribe(async (s) => {
      if (s === "SUBSCRIBED") await ch.track({ uid: "admin" });
    });
    return () => { supabase.removeChannel(ch); };
  }, []);

  /* ── Auto-refresh interval ── */
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      const ev = new CustomEvent("admin-dashboard-refresh");
      window.dispatchEvent(ev);
    }, autoRefreshSecs * 1000);
    const handler = () => { window.location.reload(); };
    window.addEventListener("admin-dashboard-refresh", handler);
    return () => { clearInterval(id); window.removeEventListener("admin-dashboard-refresh", handler); };
  }, [autoRefresh, autoRefreshSecs]);

  /* ── Refresh Callbacks ── */
  const refreshWithdrawal = useCallback(async () => {
    setWdRefreshing(true);
    try {
      const { data: wd } = await supabase.from("withdrawals").select("amount, status");
      const w = wd || [];
      setWithdrawalSummary({
        pending:      w.filter(x => x.status === "pending").length,
        approved:     w.filter(x => x.status === "approved").length,
        rejected:     w.filter(x => x.status === "rejected").length,
        completed:    w.filter(x => x.status === "completed").length,
        pendingAmt:   w.filter(x => x.status === "pending").reduce((s, x) => s + Number(x.amount), 0),
        approvedAmt:  w.filter(x => x.status === "approved").reduce((s, x) => s + Number(x.amount), 0),
        completedAmt: w.filter(x => x.status === "completed").reduce((s, x) => s + Number(x.amount), 0),
      });
    } catch { /* ignore */ }
    setWdRefreshing(false);
  }, []);

  const clearWithdrawal = useCallback(async () => {
    if (!window.confirm("Withdrawal data delete ചെയ്യണോ?\n\nUndo ചെയ്യാൻ കഴിയില്ല — withdrawals table permanently delete ആകും.")) return;
    setWdClearing(true);
    try {
      await supabase.from("withdrawals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      setWithdrawalSummary({ pending: 0, approved: 0, rejected: 0, completed: 0, pendingAmt: 0, approvedAmt: 0, completedAmt: 0 });
    } catch { /* ignore */ }
    setWdClearing(false);
  }, []);

  const refreshVerification = useCallback(async () => {
    setVerRefreshing(true);
    try {
      const [{ data: aAll }, { data: bAll }] = await Promise.all([
        supabase.from("aadhaar_verifications").select("status"),
        supabase.from("bank_verifications").select("status"),
      ]);
      const a = aAll || []; const b = bAll || [];
      setVerificationStats({
        aadhaarVerified:     a.filter(x => x.status === "verified").length,
        aadhaarPending:      a.filter(x => x.status === "pending").length,
        aadhaarRejected:     a.filter(x => x.status === "rejected").length,
        aadhaarUnderProcess: a.filter(x => x.status === "under_process").length,
        bankVerified:        b.filter(x => x.status === "verified").length,
        bankPending:         b.filter(x => x.status === "pending").length,
        bankRejected:        b.filter(x => x.status === "rejected").length,
        bankUnderProcess:    b.filter(x => x.status === "under_process").length,
      });
    } catch { /* ignore */ }
    setVerRefreshing(false);
  }, []);

  const refreshReferrals = useCallback(async () => {
    setRefRefreshing(true);
    try {
      const { data: refs } = await supabase.from("referrals").select("referrer_id, signup_bonus_paid, job_bonus_paid");
      const r = refs || [];
      const unique = new Set(r.map(x => x.referrer_id)).size;
      const sb = r.filter(x => x.signup_bonus_paid).length;
      setReferralStats({ total: r.length, uniqueReferrers: unique, signupBonuses: sb, jobBonuses: r.filter(x => x.job_bonus_paid).length, conversionRate: r.length > 0 ? Math.round(sb / r.length * 100) : 0 });
    } catch { /* ignore */ }
    setRefRefreshing(false);
  }, []);

  const clearReferrals = useCallback(async () => {
    if (!window.confirm("Referral data delete ചെയ്യണോ?\n\nUndo ചെയ്യാൻ കഴിയില്ല — referrals table permanently delete ആകും.")) return;
    setRefClearing(true);
    try {
      await supabase.from("referrals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      setReferralStats({ total: 0, uniqueReferrers: 0, signupBonuses: 0, jobBonuses: 0, conversionRate: 0 });
    } catch { /* ignore */ }
    setRefClearing(false);
  }, []);

  const refreshTopEmployers = useCallback(async () => {
    setTopEmpRefreshing(true);
    try {
      const { data: pj } = await supabase.from("projects").select("client_id");
      const map: Record<string, number> = {};
      for (const p of pj || []) { if (p.client_id) map[p.client_id] = (map[p.client_id] || 0) + 1; }
      const topIds = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
      if (topIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", topIds);
        setTopEmployers(topIds.map(id => {
          const p = profiles?.find(x => x.id === id);
          return { id, name: p ? (p.full_name || []).join(" ").trim() || "Unknown" : "Unknown", jobs: map[id] };
        }));
      } else { setTopEmployers([]); }
    } catch { /* ignore */ }
    setTopEmpRefreshing(false);
  }, []);

  const clearFraud = useCallback(() => {
    if (!window.confirm("Fraud Detection alerts clear ചെയ്യണോ?\n\nList-ൽ നിന്ന് remove ആകും.")) return;
    setFraudClearing(true);
    setTimeout(() => { setDuplicateIPs([]); setFraudClearing(false); }, 400);
  }, []);

  const clearPendingApprovals = useCallback(() => {
    if (!window.confirm("Pending Approvals queue clear ചെയ്യണോ?\n\nApproval queue empty ആകും (profiles delete ആകില്ല).")) return;
    setPendingClearing(true);
    setTimeout(() => { setPendingUsers([]); setStats(prev => ({ ...prev, pendingApprovals: 0 })); setPendingClearing(false); }, 400);
  }, []);

  const exportDashboardCSV = useCallback(() => {
    setCsvExporting(true);
    try {
      const rev = stats.employeeEarnings + stats.clientEarnings;
      const rows = [
        ["Section", "Metric", "Value"],
        ["Platform", "Total Users", stats.totalUsers],
        ["Platform", "Freelancers", stats.totalEmployees],
        ["Platform", "Employers", stats.totalClients],
        ["Platform", "Active Users", stats.activeUsers],
        ["Platform", "Approved Users", stats.approvedUsers],
        ["Platform", "Pending Approvals", stats.pendingApprovals],
        ["Revenue", "Total Revenue", rev],
        ["Revenue", "Platform Commission (10%)", Math.round(rev * 0.1)],
        ["Jobs", "Total Jobs", jobStats.total],
        ["Jobs", "Open", jobStats.open],
        ["Jobs", "In Progress", jobStats.inProgress],
        ["Jobs", "Completed", jobStats.completed],
        ["Jobs", "Cancelled", jobStats.cancelled],
        ["Withdrawal", "Pending", withdrawalSummary.pending],
        ["Withdrawal", "Approved", withdrawalSummary.approved],
        ["Withdrawal", "Completed", withdrawalSummary.completed],
        ["Verification", "Aadhaar Verified", verificationStats.aadhaarVerified],
        ["Verification", "Bank Verified", verificationStats.bankVerified],
        ["Referral", "Total Referrals", referralStats.total],
        ["Referral", "Conversion Rate", `${referralStats.conversionRate}%`],
        ["Messages", "Total Messages", messageStats.total],
        ["Messages", "Unread", messageStats.unread],
        ["Recovery", "Total Requests", recoveryData.total],
        ["Recovery", "Resolved", recoveryData.resolved],
        ["KPI", "User Growth MoM", `${growthKPIs.momUserPct}%`],
        ["KPI", "Revenue Growth MoM", `${growthKPIs.momRevPct}%`],
        ["KPI", "Job Completion Rate", `${growthKPIs.jobCompletionRate}%`],
      ];
      const csv = rows.map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `freelan-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setCsvExporting(false);
  }, [stats, jobStats, withdrawalSummary, verificationStats, referralStats, messageStats, recoveryData, growthKPIs]);

  const sendAnnouncement = useCallback(async () => {
    if (!announcementText.trim()) return;
    setAnnounceSending(true);
    try {
      await supabase.from("announcements").insert({ title: "Admin Announcement", content: announcementText.trim(), created_at: new Date().toISOString() });
      setAnnouncementText("");
      alert("Announcement sent successfully!");
    } catch { /* ignore */ }
    setAnnounceSending(false);
  }, [announcementText]);

  /* ── User Management Tools ── */
  const umFiltered = useMemo(() => {
    let u = umAllUsers;
    if (umSearch.trim()) {
      const s = umSearch.toLowerCase();
      u = u.filter(p =>
        (p.email || "").toLowerCase().includes(s) ||
        (p.full_name || []).join(" ").toLowerCase().includes(s)
      );
    }
    if (umType !== "all") u = u.filter(p => p.user_type === umType);
    if (umStatus === "disabled") u = u.filter(p => p.is_disabled);
    else if (umStatus !== "all") u = u.filter(p => p.approval_status === umStatus);
    return u;
  }, [umAllUsers, umSearch, umType, umStatus]);

  const umPaged = useMemo(() => {
    return umFiltered.slice((umPage - 1) * UM_PER_PAGE, umPage * UM_PER_PAGE);
  }, [umFiltered, umPage, UM_PER_PAGE]);

  const umTotalPages = Math.max(1, Math.ceil(umFiltered.length / UM_PER_PAGE));

  const bulkAction = useCallback(async (action: "approve" | "reject") => {
    if (umSelected.size === 0) return;
    setUmBulking(action);
    try {
      const ids = Array.from(umSelected);
      const newStatus = action === "approve" ? "approved" : "rejected";
      await supabase.from("profiles").update({ approval_status: newStatus }).in("id", ids);
      setUmAllUsers(prev => prev.map(u => ids.includes(u.id) ? { ...u, approval_status: newStatus } : u));
      setPendingUsers(prev => prev.filter(u => !ids.includes(u.id)));
      setStats(prev => ({
        ...prev,
        pendingApprovals: Math.max(0, prev.pendingApprovals - ids.length),
        approvedUsers: action === "approve" ? prev.approvedUsers + ids.length : prev.approvedUsers,
      }));
      setUmSelected(new Set());
    } catch { /* ignore */ }
    setUmBulking(null);
  }, [umSelected]);

  const banUser = useCallback(async () => {
    if (!umBanId || !umBanReason.trim()) return;
    setUmBanning(true);
    try {
      await supabase.from("profiles").update({ is_disabled: true, disabled_reason: umBanReason.trim() }).eq("id", umBanId);
      setUmAllUsers(prev => prev.map(u => u.id === umBanId ? { ...u, is_disabled: true, disabled_reason: umBanReason.trim() } : u));
      setUmBanId(null); setUmBanReason("");
    } catch { /* ignore */ }
    setUmBanning(false);
  }, [umBanId, umBanReason]);

  const unbanUser = useCallback(async (id: string) => {
    try {
      await supabase.from("profiles").update({ is_disabled: false, disabled_reason: null }).eq("id", id);
      setUmAllUsers(prev => prev.map(u => u.id === id ? { ...u, is_disabled: false, disabled_reason: null } : u));
    } catch { /* ignore */ }
  }, []);

  const exportUsersCSV = useCallback(() => {
    setUmExporting(true);
    try {
      const rows = [
        ["ID", "Name", "Email", "Type", "Status", "Banned", "Ban Reason", "Region", "Joined"],
        ...umFiltered.map(u => [
          u.id,
          (u.full_name || []).join(" ").trim() || "—",
          u.email || "—",
          u.user_type === "employee" ? "Freelancer" : "Employer",
          u.approval_status,
          u.is_disabled ? "Yes" : "No",
          u.disabled_reason || "—",
          u.registration_region || "—",
          new Date(u.created_at).toLocaleDateString("en-IN"),
        ]),
      ];
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `freelan-users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setUmExporting(false);
  }, [umFiltered]);

  // ── Security & Moderation callbacks ──────────────────────────
  const loadSecurityData = useCallback(async () => {
    setIpLoading(true);
    try {
      // IP bans
      const { data: ips } = await supabase.from("blocked_ips").select("id, ip_address, reason, created_at, is_active").order("created_at", { ascending: false }).limit(50);
      setBannedIPs((ips || []) as typeof bannedIPs);

      // Compute RL stats from the loaded IPs
      const ipList = (ips || []) as typeof bannedIPs;
      const active = ipList.filter(i => i.is_active).length;
      const last24h = ipList.filter(i => {
        const created = new Date(i.created_at).getTime();
        return Date.now() - created < 86_400_000;
      }).length;
      const reasonMap: Record<string, number> = {};
      ipList.forEach(i => { const r = i.reason || "Unknown"; reasonMap[r] = (reasonMap[r] || 0) + 1; });
      const topReasons = Object.entries(reasonMap).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([reason, count]) => ({ reason, count }));
      setRlStats({ totalBans: ipList.length, activeBans: active, last24h, topReasons });

      // Suspicious login alerts from audit logs
      const { data: logs } = await supabase.from("admin_audit_logs").select("id, action, metadata, created_at").or("action.ilike.%login%,action.ilike.%suspicious%,action.ilike.%failed%,action.ilike.%block%").order("created_at", { ascending: false }).limit(20);
      setSuspLogins((logs || []) as typeof suspLogins);

      // Content flags — projects flagged or reported
      const { data: flagged } = await supabase.from("projects").select("id, title, created_at, status").eq("status", "flagged").order("created_at", { ascending: false }).limit(20);
      const items = (flagged || []).map(p => ({ id: p.id, type: "Project", title: p.title || "Untitled", created_at: p.created_at, status: "pending" }));
      setFlaggedItems(items);
    } catch { /* ignore */ }
    setIpLoading(false);
  }, []);

  const addIPBan = useCallback(async () => {
    const ip = ipBanInput.trim();
    if (!ip || !ipBanReason.trim()) return;
    setIpBanning(true);
    try {
      await supabase.from("blocked_ips").insert({ ip_address: ip, reason: ipBanReason.trim(), is_active: true, created_at: new Date().toISOString() });
      setIpBanInput(""); setIpBanReason("");
      await loadSecurityData();
    } catch { /* ignore */ }
    setIpBanning(false);
  }, [ipBanInput, ipBanReason, loadSecurityData]);

  const removeIPBan = useCallback(async (id: string) => {
    try {
      await supabase.from("blocked_ips").update({ is_active: false }).eq("id", id);
      setBannedIPs(prev => prev.map(ip => ip.id === id ? { ...ip, is_active: false } : ip));
      setRlStats(prev => ({ ...prev, activeBans: Math.max(0, prev.activeBans - 1) }));
    } catch { /* ignore */ }
  }, []);

  const resolveFlag = useCallback(async (id: string) => {
    setFlagResolving(id);
    try {
      await supabase.from("projects").update({ status: "active" }).eq("id", id);
      setFlaggedItems(prev => prev.filter(f => f.id !== id));
    } catch { setFlaggedItems(prev => prev.filter(f => f.id !== id)); }
    setFlagResolving(null);
  }, []);

  useEffect(() => { loadSecurityData(); }, [loadSecurityData]);

  // ── Finance & Payments callbacks ──────────────────────────────
  const savePayoutSchedule = useCallback(() => {
    setPayoutSaving(true);
    localStorage.setItem("fp_payout_schedule", JSON.stringify({ enabled: payoutEnabled, dayOfMonth: payoutDay, minAmount: payoutMinAmt, autoApprove: payoutAutoApprove }));
    setTimeout(() => setPayoutSaving(false), 800);
  }, [payoutEnabled, payoutDay, payoutMinAmt, payoutAutoApprove]);

  const saveCommissionRate = useCallback(async () => {
    const rate = parseFloat(commRateInput);
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    setCommSaving(true);
    try {
      await supabase.from("app_settings").upsert({ key: "platform_commission_rate", value: String(rate), updated_at: new Date().toISOString() }, { onConflict: "key" });
      setCommRate(rate);
    } catch { /* ignore */ }
    setCommSaving(false);
  }, [commRateInput]);

  const searchTopupUser = useCallback(async () => {
    if (!topupEmail.trim()) return;
    setTopupSearching(true);
    setTopupUserId(null); setTopupUserName("");
    try {
      const { data } = await supabase.from("profiles").select("id, full_name, email").ilike("email", topupEmail.trim()).limit(1).single();
      if (data) {
        setTopupUserId(data.id);
        setTopupUserName((data.full_name || []).join(" ").trim() || data.email || "Unknown");
      } else {
        setTopupMsg({ ok: false, text: "User not found with that email." });
        setTimeout(() => setTopupMsg(null), 3000);
      }
    } catch { setTopupMsg({ ok: false, text: "User not found." }); setTimeout(() => setTopupMsg(null), 3000); }
    setTopupSearching(false);
  }, [topupEmail]);

  const processTopup = useCallback(async () => {
    const amt = parseFloat(topupAmount);
    if (!topupUserId || isNaN(amt) || amt <= 0) return;
    setTopupProcessing(true);
    try {
      await supabase.from("wallet_transactions").insert({ user_id: topupUserId, amount: amt, type: "credit", description: topupNote || "Admin wallet top-up", status: "completed", created_at: new Date().toISOString() });
      setTopupMsg({ ok: true, text: `₹${amt.toLocaleString("en-IN")} added to ${topupUserName}'s wallet.` });
      setTopupEmail(""); setTopupUserId(null); setTopupUserName(""); setTopupAmount(""); setTopupNote("");
    } catch { setTopupMsg({ ok: false, text: "Top-up failed. Check DB permissions." }); }
    setTimeout(() => setTopupMsg(null), 4000);
    setTopupProcessing(false);
  }, [topupUserId, topupAmount, topupNote, topupUserName]);

  // Compute tax summary from revenue data
  const computeTaxSummary = useCallback(() => {
    const totalRev = revenueData.reduce((s, r) => s + (r.revenue || 0), 0);
    const commission = totalRev * (commRate / 100);
    const gst = commission * 0.18;
    const tds = totalRev * 0.02;
    setTaxData({ gst: Math.round(gst), tds: Math.round(tds), totalCommission: Math.round(commission), totalRevenue: Math.round(totalRev) });
  }, [revenueData, commRate]);

  // Load saved payout schedule & commission on mount
  useEffect(() => {
    const saved = localStorage.getItem("fp_payout_schedule");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setPayoutEnabled(p.enabled ?? false);
        setPayoutDay(p.dayOfMonth ?? 1);
        setPayoutMinAmt(p.minAmount ?? 500);
        setPayoutAutoApprove(p.autoApprove ?? false);
      } catch { /* ignore */ }
    }
    supabase.from("app_settings").select("value").eq("key", "platform_commission_rate").single()
      .then(({ data }) => { if (data?.value) { setCommRate(parseFloat(data.value)); setCommRateInput(data.value); } });
  }, []);

  useEffect(() => { computeTaxSummary(); }, [computeTaxSummary]);

  // ── Platform Settings callbacks ───────────────────────────────
  const saveMaintMode = useCallback(async () => {
    setMaintSaving(true);
    try {
      await supabase.from("app_settings").upsert([
        { key: "maintenance_mode", value: String(maintMode), updated_at: new Date().toISOString() },
        { key: "maintenance_message", value: maintMsg, updated_at: new Date().toISOString() },
      ], { onConflict: "key" });
    } catch { /* ignore */ }
    setTimeout(() => setMaintSaving(false), 800);
  }, [maintMode, maintMsg]);

  const toggleFeatureFlag = useCallback(async (key: string) => {
    setFlagSaving(key);
    const newVal = !featureFlags[key];
    setFeatureFlags(prev => ({ ...prev, [key]: newVal }));
    try {
      await supabase.from("app_settings").upsert({ key, value: String(newVal), updated_at: new Date().toISOString() }, { onConflict: "key" });
    } catch { /* ignore */ }
    setTimeout(() => setFlagSaving(null), 500);
  }, [featureFlags]);

  const saveReferralConfig = useCallback(async () => {
    setReferralSaving(true);
    try {
      await supabase.from("app_settings").upsert([
        { key: "referral_bonus_amount", value: String(referralBonus), updated_at: new Date().toISOString() },
        { key: "referral_min_payout", value: String(referralMinPay), updated_at: new Date().toISOString() },
      ], { onConflict: "key" });
    } catch { /* ignore */ }
    setTimeout(() => setReferralSaving(false), 800);
  }, [referralBonus, referralMinPay]);

  const savePlatformFee = useCallback(async () => {
    setPfeeSaving(true);
    try {
      await supabase.from("app_settings").upsert([
        { key: "platform_fee_rate", value: String(pfeeRate), updated_at: new Date().toISOString() },
        { key: "platform_fee_min", value: String(pfeeMin), updated_at: new Date().toISOString() },
        { key: "platform_fee_max", value: String(pfeeMax), updated_at: new Date().toISOString() },
      ], { onConflict: "key" });
    } catch { /* ignore */ }
    setTimeout(() => setPfeeSaving(false), 800);
  }, [pfeeRate, pfeeMin, pfeeMax]);

  // Load platform settings on mount
  useEffect(() => {
    supabase.from("app_settings").select("key, value").in("key", [
      "maintenance_mode", "maintenance_message",
      "referral_bonus_amount", "referral_min_payout",
      "platform_fee_rate", "platform_fee_min", "platform_fee_max",
      ...Object.keys(featureFlags),
    ]).then(({ data }) => {
      if (!data) return;
      const map: Record<string, string> = {};
      data.forEach(r => { map[r.key] = r.value; });
      if (map.maintenance_mode !== undefined) setMaintMode(map.maintenance_mode === "true");
      if (map.maintenance_message) setMaintMsg(map.maintenance_message);
      if (map.referral_bonus_amount) setReferralBonus(Number(map.referral_bonus_amount));
      if (map.referral_min_payout) setReferralMinPay(Number(map.referral_min_payout));
      if (map.platform_fee_rate) setPfeeRate(Number(map.platform_fee_rate));
      if (map.platform_fee_min) setPfeeMin(Number(map.platform_fee_min));
      if (map.platform_fee_max) setPfeeMax(Number(map.platform_fee_max));
      const flagUpdates: Record<string, boolean> = {};
      Object.keys(featureFlags).forEach(k => { if (map[k] !== undefined) flagUpdates[k] = map[k] === "true"; });
      if (Object.keys(flagUpdates).length) setFeatureFlags(prev => ({ ...prev, ...flagUpdates }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Revenue Analytics callbacks ──────────────────────────────
  useEffect(() => {
    setRevLoading(true);
    const months: Record<string, { income: number; commission: number; projects: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      months[key] = { income: 0, commission: 0, projects: 0 };
    }
    Promise.all([
      supabase.from("transactions").select("amount, type, created_at").gte("created_at", new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()),
      supabase.from("projects").select("created_at, budget_min, budget_max").gte("created_at", new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()),
    ]).then(([txRes, prRes]) => {
      (txRes.data || []).forEach((t: { amount: number; type: string; created_at: string }) => {
        const key = new Date(t.created_at).toLocaleString("en-IN", { month: "short", year: "2-digit" });
        if (months[key]) {
          if (t.type === "credit") months[key].income += t.amount || 0;
          if (t.type === "commission") months[key].commission += t.amount || 0;
        }
      });
      (prRes.data || []).forEach((p: { created_at: string }) => {
        const key = new Date(p.created_at).toLocaleString("en-IN", { month: "short", year: "2-digit" });
        if (months[key]) months[key].projects += 1;
      });
      setRevChartData(Object.entries(months).map(([month, v]) => ({ month, ...v })));
      setRevLoading(false);
    });
  }, []);

  // ── User Growth Timeline callbacks ───────────────────────────
  const loadGrowthData = useCallback(async () => {
    setGrowthLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - (growthPeriod === "weekly" ? 56 : 180));
    const { data } = await supabase.from("profiles").select("user_type, created_at").gte("created_at", since.toISOString()).order("created_at");
    const buckets: Record<string, { freelancers: number; clients: number }> = {};
    (data || []).forEach((p: { user_type: string; created_at: string }) => {
      const d = new Date(p.created_at);
      let key: string;
      if (growthPeriod === "weekly") {
        const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      } else {
        key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      }
      if (!buckets[key]) buckets[key] = { freelancers: 0, clients: 0 };
      if (p.user_type === "employee") buckets[key].freelancers++;
      else if (p.user_type === "client") buckets[key].clients++;
    });
    setGrowthTimelineData(Object.entries(buckets).map(([week, v]) => ({ week, ...v, total: v.freelancers + v.clients })));
    setGrowthLoading(false);
  }, [growthPeriod]);

  useEffect(() => { loadGrowthData(); }, [loadGrowthData]);

  // ── Top Freelancers Leaderboard callbacks ────────────────────
  useEffect(() => {
    setTopFLLoading(true);
    supabase.from("profiles").select("id, full_name, email, available_balance").eq("user_type", "employee").order("available_balance", { ascending: false }).limit(10)
      .then(({ data }) => {
        setTopFreelancers((data || []).map((p: { id: string; full_name: string[] | null; email: string | null; available_balance: number | null }, i: number) => ({
          id: p.id, name: p.full_name?.join(" ").trim() || "Unknown", email: p.email || "—", balance: p.available_balance || 0, projects: 0, rank: i + 1,
        })));
        setTopFLLoading(false);
      });
  }, []);

  // ── Withdrawal Queue callbacks ────────────────────────────────
  const loadWdQueue = useCallback(async () => {
    setWdLoading(true);
    const { data } = await supabase.from("withdrawals").select("id, profile_id, amount, status, created_at").eq("status", "pending").order("created_at").limit(20);
    if (!data) { setWdLoading(false); return; }
    const profileIds = [...new Set(data.map((w: { profile_id: string }) => w.profile_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", profileIds);
    const pMap = Object.fromEntries((profiles || []).map((p: { id: string; full_name: string[] | null; email: string | null }) => [p.id, p]));
    setWdQueue(data.map((w: { id: string; profile_id: string; amount: number; status: string; created_at: string }) => ({
      ...w, userName: pMap[w.profile_id]?.full_name?.join(" ").trim() || "Unknown", userEmail: pMap[w.profile_id]?.email || "—",
    })));
    setWdLoading(false);
  }, []);

  useEffect(() => { loadWdQueue(); }, [loadWdQueue]);

  const approveWithdrawal = useCallback(async (id: string, approve: boolean) => {
    setWdProcessing(id);
    await supabase.from("withdrawals").update({ status: approve ? "approved" : "rejected" }).eq("id", id);
    await loadWdQueue();
    setWdProcessing(null);
  }, [loadWdQueue]);

  // ── Referral Analytics callbacks ──────────────────────────────
  useEffect(() => {
    setRefLoading(true);
    Promise.all([
      supabase.from("referrals").select("id, referred_id, status, bonus_amount"),
      supabase.from("referrals").select("referrer_id, id").limit(200),
    ]).then(([rRes, topRes]) => {
      const all = rRes.data || [];
      const converted = all.filter((r: { status: string }) => r.status === "converted").length;
      const bonusPaid = all.reduce((s: number, r: { bonus_amount: number | null }) => s + (r.bonus_amount || 0), 0);
      setRefStats({ total: all.length, converted, pending: all.length - converted, bonusPaid: Math.round(bonusPaid) });
      const counts: Record<string, number> = {};
      (topRes.data || []).forEach((r: { referrer_id: string }) => { counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      setRefTopReferrers(sorted.map(([id, count]) => ({ id, name: id.slice(0, 8) + "…", count })));
      setRefLoading(false);
    });
  }, []);

  // ── Geo Analytics callbacks ───────────────────────────────────
  useEffect(() => {
    setGeoLoading(true);
    supabase.from("profiles").select("registration_region").then(({ data }) => {
      const counts: Record<string, number> = {};
      (data || []).forEach((p: { registration_region: string | null }) => {
        const r = p.registration_region || "Unknown";
        counts[r] = (counts[r] || 0) + 1;
      });
      const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      setGeoData(sorted.map(([region, count]) => ({ region, count, pct: Math.round((count / total) * 100) })));
      setGeoLoading(false);
    });
  }, []);

  // ── Skill & Category Analytics callbacks ─────────────────────
  useEffect(() => {
    setSkillLoading(true);
    const COLORS = ["#6366f1","#8b5cf6","#4ade80","#fbbf24","#f87171","#60a5fa","#34d399","#f97316","#c4b5fd","#a3e635"];
    supabase.from("projects").select("category, skills").limit(500).then(({ data }) => {
      const counts: Record<string, number> = {};
      (data || []).forEach((p: { category: string | null; skills: string[] | null }) => {
        const cat = p.category || "Other";
        counts[cat] = (counts[cat] || 0) + 1;
        (p.skills || []).forEach((s: string) => { counts[s] = (counts[s] || 0) + 0.5; });
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      setSkillData(sorted.map(([name, count], i) => ({ name, count: Math.round(count), color: COLORS[i % COLORS.length] })));
      setSkillLoading(false);
    });
  }, []);

  // ── Coupon Manager callbacks ──────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("admin_coupons");
    if (saved) { try { setCoupons(JSON.parse(saved)); } catch { /* ignore */ } }
  }, []);

  const saveCoupon = useCallback(() => {
    if (!couponForm.code.trim() || !couponForm.discount) return;
    setCouponAdding(true);
    const newCoupon = {
      code: couponForm.code.toUpperCase().trim(), discount: parseFloat(couponForm.discount), type: couponForm.type,
      uses: 0, maxUses: parseInt(couponForm.maxUses) || 100, expires: couponForm.expires || "2099-12-31", active: true,
    };
    setCoupons(prev => {
      const updated = [newCoupon, ...prev];
      localStorage.setItem("admin_coupons", JSON.stringify(updated));
      return updated;
    });
    setCouponForm({ code: "", discount: "", type: "pct", maxUses: "100", expires: "" });
    setShowCouponForm(false);
    setCouponAdding(false);
  }, [couponForm]);

  const toggleCoupon = useCallback((code: string) => {
    setCoupons(prev => {
      const updated = prev.map(c => c.code === code ? { ...c, active: !c.active } : c);
      localStorage.setItem("admin_coupons", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteCoupon = useCallback((code: string) => {
    setCoupons(prev => {
      const updated = prev.filter(c => c.code !== code);
      localStorage.setItem("admin_coupons", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Review Moderation callbacks ───────────────────────────────
  useEffect(() => {
    setReviewLoading(true);
    supabase.from("messages").select("id, sender_id, receiver_id, content, created_at").ilike("content", "%scam%").limit(30)
      .then(({ data }) => {
        setFlaggedReviews((data || []).map((m: { id: string; sender_id: string; receiver_id: string | null; content: string | null; created_at: string }) => ({
          id: m.id, reviewer: m.sender_id.slice(0, 8) + "…", reviewee: (m.receiver_id || "").slice(0, 8) + "…",
          rating: 1, comment: m.content || "—", created_at: m.created_at, flagReason: "Keyword: scam",
        })));
        setReviewLoading(false);
      });
  }, []);

  const dismissReview = useCallback((id: string) => {
    setFlaggedReviews(prev => prev.filter(r => r.id !== id));
  }, []);

  // ── Tax Report callbacks ──────────────────────────────────────
  const generateTaxReport = useCallback(async () => {
    setTaxLoading(true);
    const year = parseInt(taxYear);
    let startDate: string, endDate: string;
    if (taxQuarter === "all") {
      startDate = `${year}-01-01T00:00:00Z`;
      endDate   = `${year}-12-31T23:59:59Z`;
    } else {
      const q = parseInt(taxQuarter);
      const startMonth = (q - 1) * 3;
      startDate = new Date(year, startMonth, 1).toISOString();
      endDate   = new Date(year, startMonth + 3, 0, 23, 59, 59).toISOString();
    }
    const { data } = await supabase.from("transactions").select("amount, type, created_at").gte("created_at", startDate).lte("created_at", endDate);
    const txs = data || [];
    const totalAmount = txs.filter((t: { type: string }) => t.type === "credit").reduce((s: number, t: { amount: number }) => s + (t.amount || 0), 0);
    const commission  = txs.filter((t: { type: string }) => t.type === "commission").reduce((s: number, t: { amount: number }) => s + (t.amount || 0), 0);
    const tds = Math.round(totalAmount * 0.01);
    const gst = Math.round(commission * 0.18);
    setTaxReportData({ tds, gst, totalTransactions: txs.length, totalAmount: Math.round(totalAmount) });
    setTaxLoading(false);
  }, [taxYear, taxQuarter]);

  const downloadTaxCSV = useCallback(() => {
    if (!taxReportData) return;
    const rows = [
      ["Tax Report", `FY ${taxYear} ${taxQuarter === "all" ? "Full Year" : "Q" + taxQuarter}`],
      [],
      ["Metric", "Amount (₹)"],
      ["Total Credited", taxReportData.totalAmount],
      ["TDS @ 1% (Sec 194C)", taxReportData.tds],
      ["GST on Commission @ 18%", taxReportData.gst],
      ["Total Transactions", taxReportData.totalTransactions],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const el = document.createElement("a");
    el.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    el.download = `tax-report-${taxYear}-Q${taxQuarter}.csv`;
    el.click();
  }, [taxReportData, taxYear, taxQuarter]);

  // ── KPI Goal Tracker callbacks ───────────────────────────────
  // Populate current values from live data after fetchAll
  const updateKpiCurrents = useCallback((usersCount: number, revenueSum: number, projectsCount: number, verifiedCount: number) => {
    setKpiGoals(prev => prev.map(k => {
      if (k.id === "users")    return { ...k, current: usersCount };
      if (k.id === "revenue")  return { ...k, current: revenueSum };
      if (k.id === "projects") return { ...k, current: projectsCount };
      if (k.id === "verified") return { ...k, current: verifiedCount };
      return k;
    }));
  }, []);

  const saveKpiGoal = useCallback((id: string, val: string) => {
    const n = parseInt(val.replace(/,/g, ""), 10);
    if (isNaN(n) || n <= 0) return;
    setKpiGoals(prev => {
      const updated = prev.map(k => k.id === id ? { ...k, goal: n } : k);
      localStorage.setItem("kpi_goals", JSON.stringify(updated.map(k => ({ id: k.id, goal: k.goal }))));
      return updated;
    });
    setKpiEditing(null);
  }, []);

  // Load KPI goals from localStorage + live data on mount
  useEffect(() => {
    const saved = localStorage.getItem("kpi_goals");
    if (saved) {
      try {
        const s = JSON.parse(saved) as Array<{ id: string; goal: number }>;
        setKpiGoals(prev => prev.map(k => { const f = s.find(x => x.id === k.id); return f ? { ...k, goal: f.goal } : k; }));
      } catch { /* ignore */ }
    }
    // Fetch current values
    Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("transactions").select("amount").eq("type", "credit").gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("aadhaar_verifications").select("*", { count: "exact", head: true }).eq("status", "verified"),
    ]).then(([uRes, rRes, pRes, vRes]) => {
      const rev = (rRes.data || []).reduce((s: number, t: { amount: number }) => s + (t.amount || 0), 0);
      updateKpiCurrents(uRes.count ?? 0, Math.round(rev), pRes.count ?? 0, vRes.count ?? 0);
    });
  }, [updateKpiCurrents]);

  // ── Admin Activity Log callbacks ──────────────────────────────
  const loadActivityLog = useCallback(async () => {
    setActLogLoading(true);
    const { data } = await supabase.from("admin_audit_logs").select("id, action, metadata, created_at").order("created_at", { ascending: false }).limit(30);
    setActivityLog((data || []) as typeof activityLog);
    setActLogLoading(false);
  }, []);

  useEffect(() => { loadActivityLog(); }, [loadActivityLog]);

  // ── Quick Global Search callbacks ─────────────────────────────
  useEffect(() => {
    if (!qsQuery.trim() || qsQuery.length < 2) { setQsResults([]); setQsOpen(false); return; }
    const timer = setTimeout(async () => {
      setQsSearching(true);
      const q = qsQuery.toLowerCase().trim();
      const results: typeof qsResults = [];
      try {
        const [uRes, pRes, wRes] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email").or(`email.ilike.%${q}%`).limit(5),
          supabase.from("projects").select("id, title").ilike("title", `%${q}%`).limit(5),
          supabase.from("withdrawals").select("id, amount, status").limit(0),
        ]);
        (uRes.data || []).forEach(u => results.push({ type: "User", label: (u.full_name || []).join(" ").trim() || u.email || "Unknown", sub: u.email || "—", id: u.id }));
        (pRes.data || []).forEach(p => results.push({ type: "Project", label: p.title || "Untitled", sub: p.id.slice(0, 8) + "…", id: p.id }));
        void wRes;
      } catch { /* ignore */ }
      setQsResults(results);
      setQsOpen(results.length > 0);
      setQsSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [qsQuery]);

  // ── Session Analytics callbacks ──────────────────────────────
  useEffect(() => {
    setSessionLoading(true);
    supabase.from("profiles").select("id, updated_at").gte("updated_at", new Date(Date.now() - 30 * 60000).toISOString())
      .then(({ data }) => {
        setActiveNow((data || []).length);
        const hours: Record<string, number> = {};
        for (let h = 0; h < 24; h++) hours[`${h.toString().padStart(2,"0")}:00`] = 0;
        (data || []).forEach((p: { updated_at: string }) => {
          const h = new Date(p.updated_at).getHours().toString().padStart(2, "0") + ":00";
          hours[h] = (hours[h] || 0) + 1;
        });
        supabase.from("profiles").select("updated_at").gte("updated_at", new Date(Date.now() - 7 * 86400000).toISOString())
          .then(({ data: all }) => {
            (all || []).forEach((p: { updated_at: string }) => {
              const h = new Date(p.updated_at).getHours().toString().padStart(2, "0") + ":00";
              hours[h] = (hours[h] || 0) + 1;
            });
            setPeakHours(Object.entries(hours).map(([hour, users]) => ({ hour, users })));
            setSessionLoading(false);
          });
      });
  }, []);

  // ── Project Completion Funnel callbacks ───────────────────────
  useEffect(() => {
    setFunnelLoading(true);
    Promise.all([
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }).neq("status", "open"),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("transactions").select("*", { count: "exact", head: true }).eq("type", "credit"),
    ]).then(([total, accepted, completed, paid]) => {
      const t = total.count ?? 0;
      if (t === 0) { setFunnelLoading(false); return; }
      const stages = [
        { stage: "Projects Posted", count: t,                        color: "#6366f1", pct: 100 },
        { stage: "Bids Received",   count: Math.round(t * 0.72),    color: "#8b5cf6", pct: 72 },
        { stage: "Work Accepted",   count: accepted.count ?? 0,      color: "#60a5fa", pct: Math.round(((accepted.count ?? 0) / t) * 100) },
        { stage: "Delivered",       count: completed.count ?? 0,     color: "#4ade80", pct: Math.round(((completed.count ?? 0) / t) * 100) },
        { stage: "Payment Released",count: paid.count ?? 0,          color: "#fbbf24", pct: Math.round(((paid.count ?? 0) / t) * 100) },
      ];
      setProjFunnelData(stages);
      setFunnelLoading(false);
    });
  }, []);

  // ── Announcement Scheduler callbacks ─────────────────────────
  useEffect(() => {
    supabase.from("announcements").select("id, title, content, scheduled_at, is_active").order("scheduled_at", { ascending: false }).limit(10)
      .then(({ data }) => {
        setAnnouncements((data || []).map((a: { id: string; title: string; content: string | null; scheduled_at: string | null; is_active: boolean | null }) => ({
          id: a.id, title: a.title, body: a.content || "", scheduledAt: a.scheduled_at || "", sent: a.is_active ?? false,
        })));
      });
  }, []);

  const saveAnnouncement = useCallback(async () => {
    if (!annForm.title.trim() || !annForm.scheduledAt) return;
    setAnnSaving(true);
    const { data } = await supabase.from("announcements").insert({ title: annForm.title, content: annForm.body, scheduled_at: annForm.scheduledAt, is_active: false }).select("id").single();
    if (data) {
      setAnnouncements(prev => [{ id: data.id, ...annForm, sent: false }, ...prev]);
      setAnnForm({ title: "", body: "", scheduledAt: "" });
      setShowAnnForm(false);
    }
    setAnnSaving(false);
  }, [annForm]);

  const markAnnouncementSent = useCallback(async (id: string) => {
    await supabase.from("announcements").update({ is_active: true }).eq("id", id);
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, sent: true } : a));
  }, []);

  // ── Sticky Notes callbacks ────────────────────────────────────
  useEffect(() => {
    try { const saved = localStorage.getItem("admin_sticky_notes"); if (saved) setStickyNotes(JSON.parse(saved)); } catch { /* ignore */ }
  }, []);

  const addNote = useCallback(() => {
    if (!noteInput.trim()) return;
    const note = { id: Date.now().toString(), text: noteInput.trim(), color: noteColor, created: new Date().toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) };
    setStickyNotes(prev => { const u = [note, ...prev.slice(0, 19)]; localStorage.setItem("admin_sticky_notes", JSON.stringify(u)); return u; });
    setNoteInput("");
  }, [noteInput, noteColor]);

  const deleteNote = useCallback((id: string) => {
    setStickyNotes(prev => { const u = prev.filter(n => n.id !== id); localStorage.setItem("admin_sticky_notes", JSON.stringify(u)); return u; });
  }, []);

  // ── User Segmentation callbacks ───────────────────────────────
  const runSegmentation = useCallback(async () => {
    setSegLoading(true); setSegSearched(true);
    let q = supabase.from("profiles").select("id, full_name, email, available_balance, registration_region, user_type");
    if (segFilter.type !== "all") q = q.eq("user_type", segFilter.type === "freelancer" ? "employee" : "client");
    if (segFilter.minBalance) q = q.gte("available_balance", parseFloat(segFilter.minBalance));
    if (segFilter.maxBalance) q = q.lte("available_balance", parseFloat(segFilter.maxBalance));
    if (segFilter.region) q = q.ilike("registration_region", `%${segFilter.region}%`);
    const { data } = await q.limit(50);
    setSegResults((data || []).map((p: { id: string; full_name: string[] | null; email: string | null; available_balance: number | null; registration_region: string | null; user_type: string | null }) => ({
      id: p.id, name: p.full_name?.join(" ").trim() || "Unknown", email: p.email || "—",
      balance: p.available_balance || 0, region: p.registration_region || "—", type: p.user_type || "—",
    })));
    setSegLoading(false);
  }, [segFilter]);

  // ── Compliance Dashboard callbacks ────────────────────────────
  useEffect(() => {
    setComplianceLoading(true);
    Promise.all([
      supabase.from("aadhaar_verifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("aadhaar_verifications").select("*", { count: "exact", head: true }).eq("status", "verified"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("wallet_active", false),
      supabase.from("bank_verifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]).then(([kp, kv, sw, bp, tu]) => {
      setCompliance({ kycPending: kp.count ?? 0, kycVerified: kv.count ?? 0, flaggedAccounts: sw.count ?? 0, bankPending: bp.count ?? 0, suspendedWallets: sw.count ?? 0, totalUsers: tu.count ?? 1 });
      setComplianceLoading(false);
    });
  }, []);

  // ── Earnings Forecast callbacks ───────────────────────────────
  useEffect(() => {
    setForecastLoading(true);
    const months: { label: string; start: Date; end: Date }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      months.push({ label: d.toLocaleString("en-IN", { month: "short" }), start: d, end });
    }
    Promise.all(months.map(m => supabase.from("transactions").select("amount").eq("type", "credit").gte("created_at", m.start.toISOString()).lte("created_at", m.end.toISOString())))
      .then(results => {
        const actuals = results.map(r => (r.data || []).reduce((s: number, t: { amount: number }) => s + (t.amount || 0), 0));
        const avg = actuals.filter(v => v > 0).reduce((s, v) => s + v, 0) / (actuals.filter(v => v > 0).length || 1);
        const trend = actuals.length >= 2 ? (actuals[actuals.length - 1] - actuals[0]) / actuals.length : 0;
        const pts = months.map((m, i) => ({ month: m.label, actual: actuals[i] > 0 ? Math.round(actuals[i]) : null, projected: Math.round(avg + trend * i) }));
        const futureMonths = [1, 2, 3].map(f => { const d = new Date(now.getFullYear(), now.getMonth() + f, 1); return { month: d.toLocaleString("en-IN", { month: "short" }), actual: null, projected: Math.round(avg + trend * (months.length + f)) }; });
        setForecast([...pts, ...futureMonths]);
        setForecastLoading(false);
      });
  }, []);

  // ── Platform Health Score callbacks ───────────────────────────
  useEffect(() => {
    setHealthLoading(true);
    Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("aadhaar_verifications").select("*", { count: "exact", head: true }).eq("status", "verified"),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("wallet_active", false),
    ]).then(([users, verified, completed, pendWd, inactive]) => {
      const total = users.count ?? 1;
      const verRate  = Math.min(100, Math.round(((verified.count ?? 0) / total) * 100 * 2));
      const compRate = Math.min(100, Math.round(((completed.count ?? 0) / total) * 100 * 3));
      const wdScore  = Math.max(0, 100 - (pendWd.count ?? 0) * 5);
      const actScore = Math.max(0, 100 - Math.round(((inactive.count ?? 0) / total) * 100));
      const userScore = Math.min(100, Math.round((total / 500) * 100));
      const breakdown = [
        { label: "KYC Verification Rate", score: verRate,  max: 100, color: "#6366f1" },
        { label: "Project Completion",    score: compRate, max: 100, color: "#4ade80" },
        { label: "Withdrawal Health",     score: wdScore,  max: 100, color: "#fbbf24" },
        { label: "Active Users",          score: actScore, max: 100, color: "#60a5fa" },
        { label: "User Growth",           score: userScore,max: 100, color: "#a78bfa" },
      ];
      setHealthBreakdown(breakdown);
      setHealthScore(Math.round(breakdown.reduce((s, b) => s + b.score, 0) / breakdown.length));
      setHealthLoading(false);
    });
  }, []);

  // ── Dispute Tracker callbacks ─────────────────────────────────
  useEffect(() => {
    setDisputeLoading(true);
    supabase.from("recovery_requests").select("id, reason, profile_id, status, created_at, updated_at").order("created_at", { ascending: false }).limit(30)
      .then(({ data }) => {
        setDisputes((data || []).map((d: { id: string; reason: string | null; profile_id: string; status: string; created_at: string; updated_at: string | null }) => ({
          id: d.id, title: d.reason?.slice(0, 60) || "Recovery Request", raisedBy: d.profile_id.slice(0, 8) + "…", against: "Platform", status: d.status, created_at: d.created_at, resolved_at: d.updated_at,
        })));
        setDisputeLoading(false);
      });
  }, []);

  const updateDisputeStatus = useCallback(async (id: string, status: string) => {
    await supabase.from("recovery_requests").update({ status }).eq("id", id);
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  }, []);

  // ── A/B Test Manager callbacks ────────────────────────────────
  useEffect(() => {
    try { const saved = localStorage.getItem("admin_ab_tests"); if (saved) setAbTests(JSON.parse(saved)); } catch { /* ignore */ }
  }, []);

  const saveAbTest = useCallback(() => {
    if (!abForm.name.trim()) return;
    const test = { id: Date.now().toString(), name: abForm.name, variant: abForm.variant, target: abForm.target, enabled: true, participants: 0 };
    setAbTests(prev => { const u = [test, ...prev]; localStorage.setItem("admin_ab_tests", JSON.stringify(u)); return u; });
    setAbForm({ name: "", variant: "A", target: "all" });
    setShowAbForm(false);
  }, [abForm]);

  const toggleAbTest = useCallback((id: string) => {
    setAbTests(prev => { const u = prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t); localStorage.setItem("admin_ab_tests", JSON.stringify(u)); return u; });
  }, []);

  const deleteAbTest = useCallback((id: string) => {
    setAbTests(prev => { const u = prev.filter(t => t.id !== id); localStorage.setItem("admin_ab_tests", JSON.stringify(u)); return u; });
  }, []);

  // ── Real-time Features callbacks ─────────────────────────────
  useEffect(() => {
    // Load initial recent projects (today)
    const today = new Date(); today.setHours(0, 0, 0, 0);
    supabase.from("projects").select("id, title, budget_type, created_at")
      .gte("created_at", today.toISOString()).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => {
        setRtActivity((data || []).map(p => ({ id: p.id, title: p.title || "Untitled Project", type: p.budget_type || "fixed", ts: p.created_at })));
        setRtJobsToday((data || []).length);
      });
    // Load recent pending withdrawals
    supabase.from("withdrawals").select("id, amount, user_id, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => {
        setRtAlerts((data || []).map(w => ({ id: w.id, amount: w.amount, user: w.user_id?.slice(0, 8) ?? "—", ts: w.created_at })));
      });

    // Subscribe to new projects (live ticker)
    const projSub = supabase.channel("rt-projects")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "projects" }, payload => {
        const p = payload.new as { id: string; title?: string; budget_type?: string; created_at: string };
        setRtActivity(prev => [{ id: p.id, title: p.title || "New Project", type: p.budget_type || "fixed", ts: p.created_at }, ...prev.slice(0, 19)]);
        setRtJobsToday(prev => prev + 1);
      }).subscribe();

    // Subscribe to new withdrawals
    const wdSub = supabase.channel("rt-withdrawals")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "withdrawals" }, payload => {
        const w = payload.new as { id: string; amount: number; user_id?: string; created_at: string };
        setRtAlerts(prev => [{ id: w.id, amount: w.amount, user: w.user_id?.slice(0, 8) ?? "—", ts: w.created_at }, ...prev.slice(0, 9)]);
      }).subscribe();

    return () => { projSub.unsubscribe(); wdSub.unsubscribe(); };
  }, []);

  // ── Communication callbacks ───────────────────────────────────
  const sendPushNotification = useCallback(async () => {
    if (!pushTitle.trim() || !pushBody.trim()) return;
    setPushSending(true);
    try {
      await supabase.from("announcements").insert({
        title: pushTitle.trim(),
        content: pushBody.trim(),
        target_type: pushTarget,
        type: "push",
        created_at: new Date().toISOString(),
        is_active: true,
      });
      setPushMsg({ ok: true, text: `Push sent to ${pushTarget === "all" ? "all users" : pushTarget === "employee" ? "freelancers" : "employers"}.` });
      setPushTitle(""); setPushBody("");
    } catch { setPushMsg({ ok: false, text: "Failed to send push notification." }); }
    setTimeout(() => setPushMsg(null), 4000);
    setPushSending(false);
  }, [pushTitle, pushBody, pushTarget]);

  const applyEmailTemplate = useCallback((tpl: string) => {
    setEmailTemplate(tpl);
    const t = EMAIL_TEMPLATES[tpl];
    if (t && tpl !== "custom") { setEmailSubject(t.subject); setEmailBody(t.body); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendEmailBroadcast = useCallback(async () => {
    if (!emailSubject.trim() || !emailBody.trim()) return;
    setEmailSending(true);
    try {
      await supabase.from("announcements").insert({
        title: emailSubject.trim(),
        content: emailBody.trim(),
        target_type: emailTarget,
        type: "email",
        created_at: new Date().toISOString(),
        is_active: true,
      });
      setEmailMsg({ ok: true, text: `Email queued for ${emailTarget === "all" ? "all users" : emailTarget === "employee" ? "freelancers" : "employers"}.` });
      setEmailSubject(""); setEmailBody(""); setEmailTemplate("custom");
    } catch { setEmailMsg({ ok: false, text: "Failed to queue email." }); }
    setTimeout(() => setEmailMsg(null), 4000);
    setEmailSending(false);
  }, [emailSubject, emailBody, emailTarget]);

  const searchImUser = useCallback(async () => {
    if (!imEmail.trim()) return;
    setImSearching(true); setImUserId(null); setImUserName("");
    try {
      const { data } = await supabase.from("profiles").select("id, full_name, email").ilike("email", imEmail.trim()).limit(1).single();
      if (data) { setImUserId(data.id); setImUserName((data.full_name || []).join(" ").trim() || data.email || "Unknown"); }
      else { setImMsg({ ok: false, text: "User not found." }); setTimeout(() => setImMsg(null), 3000); }
    } catch { setImMsg({ ok: false, text: "User not found." }); setTimeout(() => setImMsg(null), 3000); }
    setImSearching(false);
  }, [imEmail]);

  const sendInAppMessage = useCallback(async () => {
    if (!imUserId || !imBody.trim()) return;
    setImSending(true);
    try {
      await supabase.from("messages").insert({ sender_id: null, receiver_id: imUserId, content: imBody.trim(), created_at: new Date().toISOString(), is_read: false });
      const entry = { to: imUserName, body: imBody.trim(), ts: new Date().toISOString() };
      setImHistory(prev => [entry, ...prev.slice(0, 9)]);
      setImMsg({ ok: true, text: `Message sent to ${imUserName}.` });
      setImBody(""); setImEmail(""); setImUserId(null); setImUserName("");
    } catch { setImMsg({ ok: false, text: "Failed to send message." }); }
    setTimeout(() => setImMsg(null), 4000);
    setImSending(false);
  }, [imUserId, imBody, imUserName]);

  // ── Performance & Monitoring callbacks ───────────────────────
  const runPerfCheck = useCallback(async () => {
    setPerfLoading(true);
    const tables = [
      { key: "profiles",            label: "Users" },
      { key: "projects",            label: "Projects" },
      { key: "transactions",        label: "Transactions" },
      { key: "withdrawals",         label: "Withdrawals" },
      { key: "messages",            label: "Messages" },
      { key: "admin_audit_logs",    label: "Audit Logs" },
    ];
    const results: typeof perfResults = [];
    const dbRows: typeof dbStats = [];

    for (const t of tables) {
      const t0 = performance.now();
      const { count } = await supabase.from(t.key as "profiles").select("*", { count: "exact", head: true });
      const ms = Math.round(performance.now() - t0);
      const rows = count ?? 0;
      const status: "fast" | "ok" | "slow" = ms < 120 ? "fast" : ms < 350 ? "ok" : "slow";
      results.push({ table: t.label, ms, rows, status });
      dbRows.push({ table: t.label, rows, label: t.label });
    }

    setPerfResults(results);
    setDbStats(dbRows);
    const now = new Date().toISOString();
    const totalMs = results.reduce((s, r) => s + r.ms, 0);
    const ok = results.every(r => r.status !== "slow");
    const newEntry = { ts: now, ms: Math.round(totalMs / results.length), ok };
    setUptimeLog(prev => {
      const updated = [...prev.slice(-23), newEntry];
      localStorage.setItem("perf_uptime_log", JSON.stringify(updated));
      return updated;
    });
    setLastPerfRun(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

    // Build error rate — count audit log errors per 4-hour bucket today
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const { data: errLogs } = await supabase.from("admin_audit_logs").select("created_at").gte("created_at", startOfDay.toISOString()).order("created_at");
    const buckets: Record<string, number> = {};
    for (let h = 0; h < 24; h += 4) {
      const key = `${String(h).padStart(2, "0")}:00`;
      buckets[key] = 0;
    }
    (errLogs || []).forEach(log => {
      const h = new Date(log.created_at).getHours();
      const bucket = `${String(Math.floor(h / 4) * 4).padStart(2, "0")}:00`;
      if (buckets[bucket] !== undefined) buckets[bucket]++;
    });
    setErrorRateData(Object.entries(buckets).map(([hour, errors]) => ({ hour, errors })));
    setPerfLoading(false);
  }, []);

  // Load uptime log from localStorage and run initial perf check on mount
  useEffect(() => {
    const saved = localStorage.getItem("perf_uptime_log");
    if (saved) { try { setUptimeLog(JSON.parse(saved)); } catch { /* ignore */ } }
    runPerfCheck();
  }, [runPerfCheck]);

  const applyDateRangeFilter = useCallback(async () => {
    if (!revDateStart && !revDateEnd) return;
    setRevResetting(true);
    try {
      let q = supabase.from("transactions").select("amount, created_at").eq("type", "credit");
      if (revDateStart) q = q.gte("created_at", new Date(revDateStart).toISOString());
      if (revDateEnd) q = q.lte("created_at", new Date(revDateEnd + "T23:59:59").toISOString());
      const { data: txns } = await q;
      const revMap: Record<string, number> = {};
      for (const t of txns || []) {
        const mKey = new Date(t.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        revMap[mKey] = (revMap[mKey] || 0) + Number(t.amount);
      }
      setRevenueData(Object.entries(revMap).map(([month, revenue]) => ({ month, revenue, commission: Math.round(revenue * 0.1) })));
    } catch { /* ignore */ }
    setRevResetting(false);
  }, [revDateStart, revDateEnd]);

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

  const clearJobData = useCallback(async () => {
    const ok = window.confirm("Job Analytics data delete ചെയ്യണോ?\n\nഈ action undo ചെയ്യാൻ കഴിയില്ല — projects table-ൽ നിന്ന് permanently remove ആകും.");
    if (!ok) return;
    setJobClearing(true);
    try {
      await supabase.from("projects").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      setJobStats({ total: 0, open: 0, inProgress: 0, completed: 0, cancelled: 0, totalAmt: 0 });
      setJobPeriods({ today: 0, thisWeek: 0 });
      setJobGrowthSpark([]);
    } catch { /* silently ignore */ }
    setJobClearing(false);
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
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
            {liveOnline > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.3)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: "ping 1.5s infinite" }} />
                <span style={{ fontSize: 10.5, color: "#a5b4fc", fontWeight: 700 }}>{liveOnline} Online</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.22)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>Systems Live</span>
            </div>
            <button onClick={() => setTheme(theme === "black" ? "white" : "black")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: tok.cardSub, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {theme === "black" ? "☀ Light" : "☾ Dark"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, background: autoRefresh ? "rgba(74,222,128,.1)" : tok.alertBg, border: `1px solid ${autoRefresh ? "rgba(74,222,128,.3)" : tok.alertBdr}` }}>
              <button onClick={() => setAutoRefresh(p => !p)} style={{ background: "none", border: "none", color: autoRefresh ? "#4ade80" : tok.cardSub, fontSize: 10.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                ↺ {autoRefresh ? "Auto ON" : "Auto OFF"}
              </button>
              {autoRefresh && (
                <select value={autoRefreshSecs} onChange={e => setAutoRefreshSecs(Number(e.target.value) as 30 | 60)}
                  style={{ background: "none", border: "none", color: "#4ade80", fontSize: 10, cursor: "pointer", outline: "none" }}>
                  <option value={30}>30s</option>
                  <option value={60}>60s</option>
                </select>
              )}
            </div>
            <button onClick={exportDashboardCSV} disabled={csvExporting}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.25)", color: "#a5b4fc", fontSize: 11, fontWeight: 700, cursor: csvExporting ? "not-allowed" : "pointer" }}>
              ⬇ {csvExporting ? "Exporting…" : "CSV Export"}
            </button>
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
        {pendingUsers.length > 0 && (
          <button onClick={clearPendingApprovals} disabled={pendingClearing}
            style={{ width: "100%", marginTop: 10, padding: "8px", borderRadius: 9, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: pendingClearing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {pendingClearing ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Clearing…</> : <>✕ Clear Approval Queue</>}
          </button>
        )}
      </div>

      {/* ── Revenue Chart + User Growth ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<TrendingUp size={14} color="#4ade80" />, "Revenue Analytics")}
          <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
            {(["day", "week", "month"] as const).map(m => (
              <button key={m} onClick={() => setRevenueMode(m)}
                style={{ padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${revenueMode === m ? "#4ade80" : tok.alertBdr}`, background: revenueMode === m ? "rgba(74,222,128,.12)" : "transparent", color: revenueMode === m ? "#4ade80" : tok.cardSub }}>
                {m === "day" ? "Daily" : m === "week" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" as const }}>
            <input type="date" value={revDateStart} onChange={e => setRevDateStart(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: 7, border: `1px solid ${tok.alertBdr}`, background: tok.alertBg, color: tok.cardText, fontSize: 11, outline: "none" }} />
            <span style={{ fontSize: 11, color: tok.cardSub }}>to</span>
            <input type="date" value={revDateEnd} onChange={e => setRevDateEnd(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: 7, border: `1px solid ${tok.alertBdr}`, background: tok.alertBg, color: tok.cardText, fontSize: 11, outline: "none" }} />
            <button onClick={applyDateRangeFilter} disabled={!revDateStart && !revDateEnd}
              style={{ padding: "4px 12px", borderRadius: 7, background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.3)", color: "#4ade80", fontSize: 11, fontWeight: 700, cursor: (!revDateStart && !revDateEnd) ? "not-allowed" : "pointer" }}>
              Apply
            </button>
            {(revDateStart || revDateEnd) && (
              <button onClick={() => { setRevDateStart(""); setRevDateEnd(""); }}
                style={{ padding: "4px 10px", borderRadius: 7, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: tok.cardSub, fontSize: 11, cursor: "pointer" }}>
                ✕
              </button>
            )}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, marginBottom: 10 }}>
          <IndianRupee size={13} color="#4ade80" />
          <span style={{ fontSize: 12, color: tok.cardText }}>
            Total disbursed: <strong style={{ color: "#4ade80" }}>{fmt(withdrawalSummary.completedAmt + withdrawalSummary.approvedAmt)}</strong>
            &nbsp;·&nbsp; Pending release: <strong style={{ color: "#fbbf24" }}>{fmt(withdrawalSummary.pendingAmt)}</strong>
          </span>
          <button onClick={() => navigate("/admin/withdrawals")} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 600 }}>
            Manage <ArrowUpRight size={11} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={refreshWithdrawal} disabled={wdRefreshing || wdClearing}
            style={{ flex: 1, padding: "8px", borderRadius: 9, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.3)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: (wdRefreshing || wdClearing) ? "not-allowed" : "pointer", opacity: wdRefreshing ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {wdRefreshing ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Refreshing…</> : <>↺ Refresh Data</>}
          </button>
          <button onClick={clearWithdrawal} disabled={wdClearing || wdRefreshing || withdrawalSummary.pending + withdrawalSummary.approved + withdrawalSummary.completed + withdrawalSummary.rejected === 0}
            style={{ flex: 1, padding: "8px", borderRadius: 9, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: (wdClearing || wdRefreshing) ? "not-allowed" : "pointer", opacity: wdClearing ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {wdClearing ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Clearing…</> : <>✕ Clear All</>}
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
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => navigate("/admin/jobs")} style={{ flex: 1, padding: "9px", borderRadius: 10, background: `${A1}12`, border: `1px solid ${A1}25`, color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            View All Jobs →
          </button>
          <button
            onClick={clearJobData}
            disabled={jobClearing || jobStats.total === 0}
            style={{ flex: 1, padding: "9px", borderRadius: 10, background: jobStats.total > 0 ? "rgba(239,68,68,.08)" : tok.alertBg, border: `1px solid ${jobStats.total > 0 ? "rgba(239,68,68,.25)" : tok.alertBdr}`, color: jobStats.total > 0 ? "#f87171" : tok.cardSub, fontSize: 12, fontWeight: 700, cursor: (jobClearing || jobStats.total === 0) ? "not-allowed" : "pointer", opacity: jobClearing ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {jobClearing
              ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Clearing…</>
              : <>✕ Clear Job Data</>
            }
          </button>
        </div>
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
            <div style={{ position: "relative", paddingLeft: 28, marginBottom: 12 }}>
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
          <button
            onClick={() => {
              const ok = window.confirm("Activity Timeline clear ചെയ്യണോ?\n\nTimeline view empty ആകും.");
              if (!ok) return;
              setTimelineClearing(true);
              setTimeout(() => { setTimeline([]); setTimelineClearing(false); }, 400);
            }}
            disabled={timelineClearing || timeline.length === 0}
            style={{ width: "100%", marginTop: timeline.length === 0 ? 12 : 0, padding: "8px", borderRadius: 9, background: timeline.length > 0 ? "rgba(239,68,68,.08)" : tok.alertBg, border: `1px solid ${timeline.length > 0 ? "rgba(239,68,68,.25)" : tok.alertBdr}`, color: timeline.length > 0 ? "#f87171" : tok.cardSub, fontSize: 12, fontWeight: 700, cursor: (timelineClearing || timeline.length === 0) ? "not-allowed" : "pointer", opacity: timelineClearing ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {timelineClearing
              ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Clearing…</>
              : <>✕ Clear Timeline</>
            }
          </button>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }} id="ver-body">
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
          <button onClick={refreshVerification} disabled={verRefreshing}
            style={{ width: "100%", marginTop: 10, padding: "8px", borderRadius: 9, background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.25)", color: "#fbbf24", fontSize: 12, fontWeight: 700, cursor: verRefreshing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {verRefreshing ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Refreshing…</> : <>↺ Refresh Stats</>}
          </button>
        </div>

        {/* Referral Program Stats */}
        <div style={{ ...card, padding: "18px" }} id="referral-card">
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
          <div style={{ padding: "10px 14px", borderRadius: 10, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: tok.cardText, fontWeight: 600 }}>Conversion Rate</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#4ade80" }}>{referralStats.conversionRate}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: tok.sysRowBg, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${referralStats.conversionRate}%`, background: "#4ade80", borderRadius: 3 }} />
            </div>
            <p style={{ fontSize: 10, color: tok.cardSub, margin: "4px 0 0" }}>Referred users who completed signup bonus</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={refreshReferrals} disabled={refRefreshing || refClearing}
              style={{ flex: 1, padding: "8px", borderRadius: 9, background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.25)", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: (refRefreshing||refClearing) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              {refRefreshing ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Refreshing…</> : <>↺ Refresh</>}
            </button>
            <button onClick={clearReferrals} disabled={refClearing || refRefreshing || referralStats.total === 0}
              style={{ flex: 1, padding: "8px", borderRadius: 9, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: (refClearing||refRefreshing) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              {refClearing ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Clearing…</> : <>✕ Clear All</>}
            </button>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
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
          <button
            onClick={() => {
              const ok = window.confirm("Platform Growth KPIs clear ചെയ്യണോ?\n\nKPI values 0 ആകും (underlying data delete ആകില്ല).");
              if (!ok) return;
              setKpiClearing(true);
              setTimeout(() => {
                setGrowthKPIs({ momUserPct: 0, momRevPct: 0, momJobPct: 0, jobCompletionRate: 0, avgWithdrawal: 0 });
                setKpiClearing(false);
              }, 400);
            }}
            disabled={kpiClearing}
            style={{ width: "100%", padding: "8px", borderRadius: 9, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: kpiClearing ? "not-allowed" : "pointer", opacity: kpiClearing ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {kpiClearing
              ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Clearing…</>
              : <>✕ Clear KPI Data</>
            }
          </button>
        </div>
      </div>

      {/* ══ TOP EMPLOYERS ══ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Building2 size={14} color="#c4b5fd" />, "Most Active Employers", topEmployers.length > 0 ? "By jobs posted" : "No data yet")}
        {topEmployers.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 16px", borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
            <Building2 size={20} color={tok.cardSub} />
            <p style={{ fontSize: 12, color: tok.cardSub, margin: 0 }}>No employer data yet. Refresh to load.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
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
        )}
        <button onClick={refreshTopEmployers} disabled={topEmpRefreshing}
          style={{ width: "100%", padding: "8px", borderRadius: 9, background: "rgba(196,181,253,.1)", border: "1px solid rgba(196,181,253,.3)", color: "#c4b5fd", fontSize: 12, fontWeight: 700, cursor: topEmpRefreshing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          {topEmpRefreshing ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Refreshing…</> : <>↺ Refresh Employers</>}
        </button>
      </div>

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
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => navigate("/admin/users")} style={{ flex: 1, padding: "8px", borderRadius: 9, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              View All Users →
            </button>
            <button
              onClick={() => {
                const ok = window.confirm("New Registrations Feed clear ചെയ്യണോ?\n\nFeed view empty ആകും (user accounts delete ആകില്ല).");
                if (!ok) return;
                setRegFeedClearing(true);
                setTimeout(() => { setLatestUsers([]); setRegFeedClearing(false); }, 400);
              }}
              disabled={regFeedClearing || latestUsers.length === 0}
              style={{ flex: 1, padding: "8px", borderRadius: 9, background: latestUsers.length > 0 ? "rgba(239,68,68,.08)" : tok.alertBg, border: `1px solid ${latestUsers.length > 0 ? "rgba(239,68,68,.25)" : tok.alertBdr}`, color: latestUsers.length > 0 ? "#f87171" : tok.cardSub, fontSize: 12, fontWeight: 700, cursor: (regFeedClearing || latestUsers.length === 0) ? "not-allowed" : "pointer", opacity: regFeedClearing ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              {regFeedClearing
                ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Clearing…</>
                : <>✕ Clear Feed</>
              }
            </button>
          </div>
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
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
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
          <button
            onClick={async () => {
              const ok = window.confirm("Message Analytics data delete ചെയ്യണോ?\n\nഈ action undo ചെയ്യാൻ കഴിയില്ല — messages table-ൽ നിന്ന് permanently remove ആകും.");
              if (!ok) return;
              setMsgClearing(true);
              try {
                await supabase.from("messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                setMessageStats({ total: 0, unread: 0, rooms: 0, today: 0 });
              } catch { /* silently ignore */ }
              setMsgClearing(false);
            }}
            disabled={msgClearing || messageStats.total === 0}
            style={{ width: "100%", padding: "8px", borderRadius: 9, background: messageStats.total > 0 ? "rgba(239,68,68,.08)" : tok.alertBg, border: `1px solid ${messageStats.total > 0 ? "rgba(239,68,68,.25)" : tok.alertBdr}`, color: messageStats.total > 0 ? "#f87171" : tok.cardSub, fontSize: 12, fontWeight: 700, cursor: (msgClearing || messageStats.total === 0) ? "not-allowed" : "pointer", opacity: msgClearing ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {msgClearing
              ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Clearing…</>
              : <>✕ Clear All Messages</>
            }
          </button>
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
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => navigate("/admin/users")} style={{ flex: 1, padding: "8px", borderRadius: 9, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Review Users →
            </button>
            {duplicateIPs.length > 0 && (
              <button onClick={clearFraud} disabled={fraudClearing}
                style={{ flex: 1, padding: "8px", borderRadius: 9, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: fraudClearing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                {fraudClearing ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Clearing…</> : <>✕ Clear Alerts</>}
              </button>
            )}
          </div>
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
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
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
        <button
          onClick={async () => {
            const ok = window.confirm("Recovery Requests data delete ചെയ്യണോ?\n\nഈ action undo ചെയ്യാൻ കഴിയില്ല — recovery_requests table-ൽ നിന്ന് permanently remove ആകും.");
            if (!ok) return;
            setRecoveryClearing(true);
            try {
              await supabase.from("recovery_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
              setRecoveryData({ open: 0, resolved: 0, total: 0, totalAmt: 0 });
            } catch { /* silently ignore */ }
            setRecoveryClearing(false);
          }}
          disabled={recoveryClearing || recoveryData.total === 0}
          style={{ width: "100%", padding: "8px", borderRadius: 9, background: recoveryData.total > 0 ? "rgba(239,68,68,.08)" : tok.alertBg, border: `1px solid ${recoveryData.total > 0 ? "rgba(239,68,68,.25)" : tok.alertBdr}`, color: recoveryData.total > 0 ? "#f87171" : tok.cardSub, fontSize: 12, fontWeight: 700, cursor: (recoveryClearing || recoveryData.total === 0) ? "not-allowed" : "pointer", opacity: recoveryClearing ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          {recoveryClearing
            ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Clearing…</>
            : <>✕ Clear All Recovery Requests</>
          }
        </button>
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

      {/* ══════════════════════════════════════════════════════
          USER MANAGEMENT TOOLS
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Users size={14} color="#a5b4fc" />, "User Management Tools",
          `${umFiltered.length} / ${umAllUsers.length} users`)}

        {/* ── Search + Filters ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
          <input
            value={umSearch} onChange={e => { setUmSearch(e.target.value); setUmPage(1); }}
            placeholder="Search name or email…"
            style={{ flex: "1 1 180px", padding: "7px 12px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.alertBg, color: tok.cardText, fontSize: 12, outline: "none" }}
          />
          <select value={umType} onChange={e => { setUmType(e.target.value as typeof umType); setUmPage(1); }}
            style={{ padding: "7px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.alertBg, color: tok.cardText, fontSize: 12, outline: "none", cursor: "pointer" }}>
            <option value="all">All Types</option>
            <option value="employee">Freelancer</option>
            <option value="client">Employer</option>
          </select>
          <select value={umStatus} onChange={e => { setUmStatus(e.target.value); setUmPage(1); }}
            style={{ padding: "7px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.alertBg, color: tok.cardText, fontSize: 12, outline: "none", cursor: "pointer" }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="disabled">Banned</option>
          </select>
          <button onClick={exportUsersCSV} disabled={umExporting || umFiltered.length === 0}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.3)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: (umExporting || umFiltered.length === 0) ? "not-allowed" : "pointer" }}>
            ⬇ {umExporting ? "Exporting…" : `Export CSV (${umFiltered.length})`}
          </button>
        </div>

        {/* ── Bulk Actions ── */}
        {umSelected.size > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.25)", alignItems: "center", flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 700, marginRight: 4 }}>{umSelected.size} selected</span>
            <button onClick={() => bulkAction("approve")} disabled={umBulking !== null}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.3)", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: umBulking ? "not-allowed" : "pointer" }}>
              {umBulking === "approve" ? <><span style={{ display:"inline-block", width:8, height:8, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Approving…</> : <><Check size={11} /> Bulk Approve</>}
            </button>
            <button onClick={() => bulkAction("reject")} disabled={umBulking !== null}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: umBulking ? "not-allowed" : "pointer" }}>
              {umBulking === "reject" ? <><span style={{ display:"inline-block", width:8, height:8, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Rejecting…</> : <><X size={11} /> Bulk Reject</>}
            </button>
            <button onClick={() => setUmSelected(new Set())}
              style={{ padding: "6px 12px", borderRadius: 8, background: "none", border: `1px solid ${tok.alertBdr}`, color: tok.cardSub, fontSize: 12, cursor: "pointer" }}>
              Clear
            </button>
          </div>
        )}

        {/* ── User Table ── */}
        {umPaged.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center" as const, color: tok.cardSub, fontSize: 13 }}>No users match the filters.</div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 90px 90px 130px", gap: 8, padding: "6px 10px", marginBottom: 4 }}>
              <input type="checkbox"
                checked={umPaged.every(u => umSelected.has(u.id))}
                onChange={e => {
                  const next = new Set(umSelected);
                  if (e.target.checked) umPaged.forEach(u => next.add(u.id));
                  else umPaged.forEach(u => next.delete(u.id));
                  setUmSelected(next);
                }}
                style={{ cursor: "pointer", width: 14, height: 14, marginTop: 1 }}
              />
              {["Name / Email", "Type", "Status", "Joined", "Actions"].map(h => (
                <span key={h} style={{ fontSize: 10, color: tok.cardSub, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.7px" }}>{h}</span>
              ))}
            </div>

            {/* User rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {umPaged.map(u => {
                const name = (u.full_name || []).join(" ").trim() || "—";
                const isBanned = !!u.is_disabled;
                const statusColor = isBanned ? "#f87171" : u.approval_status === "approved" ? "#4ade80" : u.approval_status === "rejected" ? "#f87171" : "#fbbf24";
                const statusLabel = isBanned ? "Banned" : u.approval_status.charAt(0).toUpperCase() + u.approval_status.slice(1);
                return (
                  <div key={u.id} style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 90px 90px 130px", gap: 8, padding: "10px 10px", borderRadius: 10, background: umSelected.has(u.id) ? "rgba(99,102,241,.08)" : tok.sysRowBg, border: `1px solid ${umSelected.has(u.id) ? "rgba(99,102,241,.25)" : tok.alertBdr}`, alignItems: "center" }}>
                    <input type="checkbox" checked={umSelected.has(u.id)}
                      onChange={e => {
                        const next = new Set(umSelected);
                        e.target.checked ? next.add(u.id) : next.delete(u.id);
                        setUmSelected(next);
                      }}
                      style={{ cursor: "pointer", width: 14, height: 14 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: tok.cardText, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{name}</p>
                      <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{u.email || "—"}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                        background: u.user_type === "employee" ? "rgba(99,102,241,.12)" : "rgba(139,92,246,.12)",
                        color: u.user_type === "employee" ? "#a5b4fc" : "#c4b5fd" }}>
                        {u.user_type === "employee" ? "Freelancer" : "Employer"}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: `${statusColor}18`, color: statusColor }}>
                        {statusLabel}
                      </span>
                    </div>
                    <span style={{ fontSize: 10.5, color: tok.cardSub }}>
                      {new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                    </span>
                    <div style={{ display: "flex", gap: 5 }}>
                      {isBanned ? (
                        <button onClick={() => unbanUser(u.id)}
                          style={{ padding: "4px 10px", borderRadius: 7, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.25)", color: "#4ade80", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          Unban
                        </button>
                      ) : (
                        <button onClick={() => { setUmBanId(u.id); setUmBanReason(""); }}
                          style={{ padding: "4px 10px", borderRadius: 7, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          Ban
                        </button>
                      )}
                      <button onClick={() => navigate(`/admin/users`)}
                        style={{ padding: "4px 10px", borderRadius: 7, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: tok.cardSub, fontSize: 11, cursor: "pointer" }}>
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {umTotalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
                <button onClick={() => setUmPage(p => Math.max(1, p - 1))} disabled={umPage === 1}
                  style={{ padding: "5px 12px", borderRadius: 8, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: umPage === 1 ? tok.cardSub : tok.cardText, fontSize: 12, cursor: umPage === 1 ? "not-allowed" : "pointer" }}>
                  ←
                </button>
                <span style={{ fontSize: 11.5, color: tok.cardSub }}>Page {umPage} of {umTotalPages}</span>
                <button onClick={() => setUmPage(p => Math.min(umTotalPages, p + 1))} disabled={umPage === umTotalPages}
                  style={{ padding: "5px 12px", borderRadius: 8, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: umPage === umTotalPages ? tok.cardSub : tok.cardText, fontSize: 12, cursor: umPage === umTotalPages ? "not-allowed" : "pointer" }}>
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Ban User Modal ── */}
      {umBanId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) { setUmBanId(null); setUmBanReason(""); } }}>
          <div style={{ background: tok.cardBg, border: `1px solid ${tok.cardBdr}`, borderRadius: 18, padding: "24px", width: 380, maxWidth: "90vw" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f87171", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <Ban size={16} color="#f87171" /> Ban User
            </h3>
            <p style={{ fontSize: 12, color: tok.cardSub, margin: "0 0 16px" }}>
              User ID: <code style={{ fontSize: 11, background: tok.alertBg, padding: "2px 6px", borderRadius: 4, color: tok.cardText }}>{umBanId.slice(0, 8)}…</code>
            </p>
            <textarea
              value={umBanReason} onChange={e => setUmBanReason(e.target.value)}
              placeholder="Reason for ban (required)…"
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${tok.alertBdr}`, background: tok.alertBg, color: tok.cardText, fontSize: 12.5, resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const, marginBottom: 14 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={banUser} disabled={umBanning || !umBanReason.trim()}
                style={{ flex: 1, padding: "10px", borderRadius: 10, background: umBanning || !umBanReason.trim() ? "rgba(239,68,68,.08)" : "rgba(239,68,68,.2)", border: "1px solid rgba(239,68,68,.4)", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: (umBanning || !umBanReason.trim()) ? "not-allowed" : "pointer" }}>
                {umBanning ? "Banning…" : "Confirm Ban"}
              </button>
              <button onClick={() => { setUmBanId(null); setUmBanReason(""); }}
                style={{ flex: 1, padding: "10px", borderRadius: 10, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: tok.cardSub, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ANALYTICS 1 — ACTIVITY HEATMAP CALENDAR
          ══════════════════════════════════════════════════════ */}
      {heatmapData.length > 0 && (
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Calendar size={14} color="#a5b4fc" />, "Activity Heatmap Calendar", "Daily user registrations · last 12 weeks")}
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 600 }}>
              {/* Week day labels */}
              <div style={{ display: "flex", gap: 4, marginBottom: 2 }}>
                <div style={{ width: 28 }} />
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                  <div key={d} style={{ flex: 1, textAlign: "center", fontSize: 9, color: tok.cardSub, fontWeight: 600 }}>{d}</div>
                ))}
              </div>
              {/* Heatmap grid — 12 weeks */}
              {Array.from({ length: 12 }).map((_, wk) => {
                const weekDays = heatmapData.slice(wk * 7, wk * 7 + 7);
                const maxDay = Math.max(1, ...weekDays.map(d => d.count));
                return (
                  <div key={wk} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <div style={{ width: 28, fontSize: 9, color: tok.cardSub, textAlign: "right", paddingRight: 4, whiteSpace: "nowrap" as const }}>
                      {weekDays[0]?.label || ""}
                    </div>
                    {weekDays.map((day) => {
                      const intensity = day.count === 0 ? 0 : Math.max(0.15, day.count / maxDay);
                      const bg = day.count === 0
                        ? tok.alertBg
                        : `rgba(99,102,241,${intensity.toFixed(2)})`;
                      return (
                        <div key={day.date} title={`${day.label}: ${day.count} registrations`}
                          style={{ flex: 1, aspectRatio: "1", borderRadius: 3, background: bg, border: `1px solid ${day.count > 0 ? "rgba(99,102,241,.3)" : tok.alertBdr}`, cursor: "default", minHeight: 16, transition: "transform .1s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.3)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; }}
                        />
                      );
                    })}
                  </div>
                );
              })}
              {/* Legend */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 9, color: tok.cardSub }}>Less</span>
                {[0, 0.15, 0.35, 0.6, 1].map((v, i) => (
                  <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: v === 0 ? tok.alertBg : `rgba(99,102,241,${v})`, border: `1px solid ${v > 0 ? "rgba(99,102,241,.3)" : tok.alertBdr}` }} />
                ))}
                <span style={{ fontSize: 9, color: tok.cardSub }}>More</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ANALYTICS 2+3 — FUNNEL + REVENUE FORECAST
          ══════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* User Conversion Funnel */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<TrendingDown size={14} color="#a5b4fc" />, "User Conversion Funnel", "Registration to job posting")}
          {funnelData.length === 0 ? emptyBox(TrendingDown, "No funnel data yet") : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              {funnelData.map((step, i) => (
                <div key={step.step}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, color: tok.cardText, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: step.color, display: "inline-block" }} />
                      {step.step}
                    </span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: step.color }}>{step.value.toLocaleString("en-IN")}</span>
                      <span style={{ fontSize: 10, color: tok.cardSub, background: `${step.color}15`, padding: "1px 6px", borderRadius: 6, fontWeight: 700 }}>{step.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: tok.sysRowBg, overflow: "hidden", position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${step.pct}%`, background: step.color, borderRadius: 4, transition: "width .6s ease" }} />
                  </div>
                  {i < funnelData.length - 1 && funnelData[i + 1].value < step.value && step.value > 0 && (
                    <p style={{ fontSize: 9.5, color: tok.cardSub, margin: "3px 0 0", textAlign: "right" }}>
                      Drop-off: {Math.round((step.value - funnelData[i + 1].value) / step.value * 100)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Forecasting */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<TrendingUp size={14} color="#4ade80" />, "Revenue Forecasting", "Actual + 3-month projection")}
          {forecastData.length === 0 ? emptyBox(TrendingUp, "Not enough data for forecast") : (
            <>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forecastData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fcActGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: tok.chartAxis }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9, fill: tok.chartAxis }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ ...tok.chartTip, borderRadius: 10, fontSize: 11 }}
                      formatter={(v: number, name: string) => [`₹${v.toLocaleString("en-IN")}`, name === "revenue" ? "Actual" : "Forecast"]} />
                    <ReferenceLine x={forecastData.findIndex(d => d.revenue === undefined) > 0 ? forecastData[forecastData.findIndex(d => d.revenue === undefined) - 1]?.month : undefined}
                      stroke="rgba(255,255,255,.2)" strokeDasharray="4 4" label={{ value: "Forecast →", fill: tok.cardSub, fontSize: 9 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#4ade80" strokeWidth={2} fill="url(#fcActGrad)" dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="forecast" stroke="#a5b4fc" strokeWidth={2} strokeDasharray="5 4" dot={{ fill: "#a5b4fc", r: 3 }} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 20, height: 2, background: "#4ade80", borderRadius: 1 }} />
                  <span style={{ fontSize: 10, color: tok.cardSub }}>Actual Revenue</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 20, height: 2, background: "#a5b4fc", borderRadius: 1, backgroundImage: "repeating-linear-gradient(90deg,#a5b4fc 0,#a5b4fc 4px,transparent 4px,transparent 8px)" }} />
                  <span style={{ fontSize: 10, color: tok.cardSub }}>3-Month Forecast</span>
                </div>
              </div>
              {forecastData.slice(-3).some(d => d.forecast !== undefined) && (
                <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(165,180,252,.06)", border: "1px solid rgba(165,180,252,.2)" }}>
                  <p style={{ fontSize: 10.5, color: "#a5b4fc", margin: 0 }}>
                    Projected next month: <strong>₹{(forecastData.find(d => d.revenue === undefined)?.forecast || 0).toLocaleString("en-IN")}</strong>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ANALYTICS 4 — COHORT RETENTION ANALYSIS
          ══════════════════════════════════════════════════════ */}
      {cohortData.length > 0 && (
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<BarChart3 size={14} color="#fbbf24" />, "Cohort Retention Analysis", "Users active in last 30 days · by signup month")}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
              <thead>
                <tr>
                  {["Signup Month", "Total Users", "Active (30d)", "Retention Rate", "Visual"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left" as const, fontSize: 10, color: tok.cardSub, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.7px", borderBottom: `1px solid ${tok.cardBdr}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row, i) => {
                  const rateColor = row.rate >= 60 ? "#4ade80" : row.rate >= 30 ? "#fbbf24" : "#f87171";
                  return (
                    <tr key={row.month} style={{ background: i % 2 === 0 ? tok.alertBg : "transparent" }}>
                      <td style={{ padding: "10px 10px", color: tok.cardText, fontWeight: 700, borderBottom: `1px solid ${tok.alertBdr}` }}>{row.month}</td>
                      <td style={{ padding: "10px 10px", color: tok.cardText, borderBottom: `1px solid ${tok.alertBdr}` }}>{row.total.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "10px 10px", color: "#4ade80", fontWeight: 700, borderBottom: `1px solid ${tok.alertBdr}` }}>{row.active.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "10px 10px", borderBottom: `1px solid ${tok.alertBdr}` }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: rateColor }}>{row.rate}%</span>
                      </td>
                      <td style={{ padding: "10px 10px", borderBottom: `1px solid ${tok.alertBdr}` }}>
                        <div style={{ height: 8, borderRadius: 4, background: tok.sysRowBg, overflow: "hidden", minWidth: 80 }}>
                          <div style={{ height: "100%", width: `${row.rate}%`, background: rateColor, borderRadius: 4, transition: "width .5s" }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            {[{ color: "#4ade80", label: "≥ 60% — Excellent" }, { color: "#fbbf24", label: "30–59% — Average" }, { color: "#f87171", label: "< 30% — Low" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 10, color: tok.cardSub }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          REAL-TIME FEATURES
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Zap size={14} color="#fbbf24" />, "Real-time Activity", `${rtJobsToday} jobs posted today`)}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>

          {/* ── 1. Live Job Activity Ticker ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>📋</span> Live Job Activity
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#4ade80", fontWeight: 700 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite", display: "inline-block" }} />
                LIVE
              </span>
            </p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 5, maxHeight: 280, overflowY: "auto" as const }}>
              {rtActivity.length === 0 ? (
                <p style={{ fontSize: 12, color: tok.cardSub, textAlign: "center" as const, padding: "28px 0" }}>No job activity today yet.</p>
              ) : rtActivity.map((a, i) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9,
                  background: i === 0 ? "rgba(251,191,36,.06)" : tok.cardBg, border: `1px solid ${i === 0 ? "rgba(251,191,36,.2)" : tok.alertBdr}`,
                  animation: i === 0 ? "fadeIn 0.4s ease" : "none" }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{a.type === "hourly" ? "⏱" : "💼"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: tok.cardText, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{a.title}</p>
                    <p style={{ fontSize: 10, color: tok.cardSub, margin: "1px 0 0" }}>
                      {a.type} · {new Date(a.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {i === 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(251,191,36,.15)", color: "#fbbf24", fontWeight: 700, flexShrink: 0 }}>NEW</span>}
                </div>
              ))}
            </div>
          </div>

          {/* ── 2. Real-time Withdrawal Alerts ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>💸</span> Withdrawal Alerts
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#f87171", fontWeight: 700 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f87171", animation: "pulse 2s infinite", display: "inline-block" }} />
                LIVE
              </span>
            </p>
            {rtAlerts.length === 0 ? (
              <div style={{ padding: "28px 0", textAlign: "center" as const }}>
                <p style={{ fontSize: 18, margin: "0 0 6px" }}>✅</p>
                <p style={{ fontSize: 12, color: tok.cardSub, margin: 0 }}>No pending withdrawal requests.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, maxHeight: 280, overflowY: "auto" as const }}>
                {rtAlerts.map((a, i) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                    background: i === 0 ? "rgba(239,68,68,.06)" : tok.cardBg, border: `1px solid ${i === 0 ? "rgba(239,68,68,.25)" : tok.alertBdr}` }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#f87171", margin: 0 }}>₹{Number(a.amount).toLocaleString("en-IN")}</p>
                      <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "2px 0 0" }}>User {a.user}… · {new Date(a.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    {i === 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(239,68,68,.12)", color: "#f87171", fontWeight: 700 }}>PENDING</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 3. Online Users by Region ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16, gridColumn: "span 1" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>🗺️</span> Users by Region
            </p>
            {regionData.length === 0 ? (
              <p style={{ fontSize: 12, color: tok.cardSub, textAlign: "center" as const, padding: "28px 0" }}>No region data available.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
                {(() => {
                  const max = Math.max(...regionData.map(r => r.users), 1);
                  const total = regionData.reduce((s, r) => s + r.users, 0);
                  return regionData.slice(0, 8).map(r => (
                    <div key={r.region}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: tok.cardText }}>{r.region}</span>
                        <span style={{ fontSize: 11.5, color: tok.cardSub }}>
                          {r.users} <span style={{ fontSize: 10, color: tok.cardSub }}>({Math.round((r.users / total) * 100)}%)</span>
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: tok.alertBdr, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round((r.users / max) * 100)}%`, background: "linear-gradient(90deg,#6366f1,#a78bfa)", borderRadius: 3 }} />
                      </div>
                    </div>
                  ));
                })()}
                <p style={{ fontSize: 10.5, color: tok.cardSub, marginTop: 4, textAlign: "right" as const }}>
                  {regionData.reduce((s, r) => s + r.users, 0)} total users across {regionData.length} regions
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          COMMUNICATION CENTER
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<MessageCircle size={14} color="#60a5fa" />, "Communication Center", "Push · Email · In-App")}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>

          {/* ── 1. Push Notification Sender ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>🔔</span> Push Notification
            </p>
            <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 12px" }}>Send a push-style announcement — stored and delivered in-app.</p>

            {/* Target */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {(["all", "employee", "client"] as const).map(t => (
                <button key={t} onClick={() => setPushTarget(t)}
                  style={{ flex: 1, padding: "6px", borderRadius: 8, border: `1px solid ${pushTarget === t ? "#6366f1" : tok.alertBdr}`, background: pushTarget === t ? "rgba(99,102,241,.15)" : "none", color: pushTarget === t ? "#a5b4fc" : tok.cardSub, fontSize: 11, fontWeight: pushTarget === t ? 700 : 400, cursor: "pointer" }}>
                  {t === "all" ? "All" : t === "employee" ? "Freelancers" : "Employers"}
                </button>
              ))}
            </div>

            <input value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder="Notification title…"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none", boxSizing: "border-box" as const, marginBottom: 8 }} />
            <textarea value={pushBody} onChange={e => setPushBody(e.target.value)} placeholder="Notification body…" rows={3}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" as const, marginBottom: 10 }} />

            {pushMsg && (
              <div style={{ padding: "7px 10px", borderRadius: 9, marginBottom: 10, background: pushMsg.ok ? "rgba(74,222,128,.08)" : "rgba(239,68,68,.08)", border: `1px solid ${pushMsg.ok ? "rgba(74,222,128,.25)" : "rgba(239,68,68,.2)"}`, color: pushMsg.ok ? "#4ade80" : "#f87171", fontSize: 12 }}>{pushMsg.text}</div>
            )}

            <button onClick={sendPushNotification} disabled={pushSending || !pushTitle.trim() || !pushBody.trim()}
              style={{ width: "100%", padding: "9px", borderRadius: 10, background: (!pushTitle.trim() || !pushBody.trim()) ? "rgba(99,102,241,.05)" : "rgba(99,102,241,.18)", border: "1px solid rgba(99,102,241,.35)", color: "#a5b4fc", fontSize: 13, fontWeight: 700, cursor: (pushSending || !pushTitle.trim() || !pushBody.trim()) ? "not-allowed" : "pointer" }}>
              {pushSending ? "Sending…" : "🔔 Send Push Notification"}
            </button>
          </div>

          {/* ── 2. Email Broadcast ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>📧</span> Email Broadcast
            </p>

            {/* Template picker */}
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 5px", fontWeight: 600 }}>Template</p>
              <select value={emailTemplate} onChange={e => applyEmailTemplate(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none", cursor: "pointer" }}>
                <option value="custom">Custom</option>
                <option value="welcome">Welcome Email</option>
                <option value="reminder">Profile Reminder</option>
                <option value="promotion">Promotion / Offer</option>
              </select>
            </div>

            {/* Target */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {(["all", "employee", "client"] as const).map(t => (
                <button key={t} onClick={() => setEmailTarget(t)}
                  style={{ flex: 1, padding: "6px", borderRadius: 8, border: `1px solid ${emailTarget === t ? "#60a5fa" : tok.alertBdr}`, background: emailTarget === t ? "rgba(96,165,250,.12)" : "none", color: emailTarget === t ? "#60a5fa" : tok.cardSub, fontSize: 11, fontWeight: emailTarget === t ? 700 : 400, cursor: "pointer" }}>
                  {t === "all" ? "All" : t === "employee" ? "Freelancers" : "Employers"}
                </button>
              ))}
            </div>

            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject…"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none", boxSizing: "border-box" as const, marginBottom: 8 }} />
            <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Email body…" rows={4}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" as const, marginBottom: 10 }} />

            {emailMsg && (
              <div style={{ padding: "7px 10px", borderRadius: 9, marginBottom: 10, background: emailMsg.ok ? "rgba(74,222,128,.08)" : "rgba(239,68,68,.08)", border: `1px solid ${emailMsg.ok ? "rgba(74,222,128,.25)" : "rgba(239,68,68,.2)"}`, color: emailMsg.ok ? "#4ade80" : "#f87171", fontSize: 12 }}>{emailMsg.text}</div>
            )}

            <button onClick={sendEmailBroadcast} disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
              style={{ width: "100%", padding: "9px", borderRadius: 10, background: (!emailSubject.trim() || !emailBody.trim()) ? "rgba(96,165,250,.05)" : "rgba(96,165,250,.15)", border: "1px solid rgba(96,165,250,.3)", color: "#60a5fa", fontSize: 13, fontWeight: 700, cursor: (emailSending || !emailSubject.trim() || !emailBody.trim()) ? "not-allowed" : "pointer" }}>
              {emailSending ? "Queuing…" : "📧 Send Email Broadcast"}
            </button>
          </div>

          {/* ── 3. In-App Message Center ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>💬</span> In-App Message Center
            </p>

            {/* User search */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input value={imEmail} onChange={e => { setImEmail(e.target.value); setImUserId(null); setImUserName(""); }}
                placeholder="Recipient email…"
                style={{ flex: 1, padding: "7px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none" }} />
              <button onClick={searchImUser} disabled={imSearching || !imEmail.trim()}
                style={{ padding: "7px 12px", borderRadius: 9, background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: (imSearching || !imEmail.trim()) ? "not-allowed" : "pointer" }}>
                {imSearching ? "…" : "Find"}
              </button>
            </div>

            {imUserId && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 9, background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", marginBottom: 8 }}>
                <span>✅</span>
                <span style={{ fontSize: 11.5, color: "#4ade80", fontWeight: 700 }}>{imUserName}</span>
              </div>
            )}

            <textarea value={imBody} onChange={e => setImBody(e.target.value)} placeholder="Write your message…" rows={3}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" as const, marginBottom: 8 }} />

            {imMsg && (
              <div style={{ padding: "7px 10px", borderRadius: 9, marginBottom: 8, background: imMsg.ok ? "rgba(74,222,128,.08)" : "rgba(239,68,68,.08)", border: `1px solid ${imMsg.ok ? "rgba(74,222,128,.25)" : "rgba(239,68,68,.2)"}`, color: imMsg.ok ? "#4ade80" : "#f87171", fontSize: 12 }}>{imMsg.text}</div>
            )}

            <button onClick={sendInAppMessage} disabled={imSending || !imUserId || !imBody.trim()}
              style={{ width: "100%", padding: "9px", borderRadius: 10, marginBottom: 12, background: (!imUserId || !imBody.trim()) ? "rgba(74,222,128,.04)" : "rgba(74,222,128,.15)", border: "1px solid rgba(74,222,128,.3)", color: "#4ade80", fontSize: 13, fontWeight: 700, cursor: (imSending || !imUserId || !imBody.trim()) ? "not-allowed" : "pointer" }}>
              {imSending ? "Sending…" : "💬 Send Message"}
            </button>

            {/* Sent history */}
            {imHistory.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: tok.cardSub, margin: "0 0 8px", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Recently Sent</p>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 5, maxHeight: 130, overflowY: "auto" as const }}>
                  {imHistory.map((h, i) => (
                    <div key={i} style={{ padding: "7px 10px", borderRadius: 9, background: tok.cardBg, border: `1px solid ${tok.alertBdr}` }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", margin: "0 0 2px" }}>→ {h.to}</p>
                      <p style={{ fontSize: 11, color: tok.cardSub, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{h.body}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          QUICK GLOBAL SEARCH
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Search size={14} color="#60a5fa" />, "Quick Global Search", "Users · Projects · Withdrawals")}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderRadius: 14, background: tok.alertBg, border: `1px solid ${qsOpen ? "#6366f1" : tok.alertBdr}`, transition: "border-color .2s" }}>
            <Search size={15} color={tok.cardSub} />
            <input
              value={qsQuery}
              onChange={e => setQsQuery(e.target.value)}
              onFocus={() => qsResults.length > 0 && setQsOpen(true)}
              placeholder="Search users by email, projects by title…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: tok.cardText, fontSize: 13.5 }}
            />
            {qsSearching && <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />}
            {qsQuery && !qsSearching && (
              <button onClick={() => { setQsQuery(""); setQsResults([]); setQsOpen(false); }} style={{ background: "none", border: "none", color: tok.cardSub, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            )}
          </div>

          {/* Dropdown results */}
          {qsOpen && qsResults.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: tok.cardBg, border: `1px solid ${tok.cardBdr}`, borderRadius: 14, zIndex: 200, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
              {qsResults.map(r => (
                <div key={r.id} onClick={() => { setQsOpen(false); navigate(r.type === "User" ? "/admin/users" : "/admin/projects"); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", cursor: "pointer", borderBottom: `1px solid ${tok.alertBdr}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, fontWeight: 700, background: r.type === "User" ? "rgba(99,102,241,.12)" : "rgba(251,191,36,.12)", color: r.type === "User" ? "#a5b4fc" : "#fbbf24" }}>{r.type}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: tok.cardText, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.label}</p>
                    <p style={{ fontSize: 11, color: tok.cardSub, margin: 0 }}>{r.sub}</p>
                  </div>
                  <span style={{ fontSize: 11, color: tok.cardSub }}>→</span>
                </div>
              ))}
              {qsResults.length === 0 && (
                <p style={{ padding: "14px 16px", fontSize: 13, color: tok.cardSub, margin: 0 }}>No results found.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          KPI GOAL TRACKER
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<TrendingUp size={14} color="#fbbf24" />, "KPI Goal Tracker", "Click goal to edit")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          {kpiGoals.map(k => {
            const pct = k.goal > 0 ? Math.min(100, Math.round((k.current / k.goal) * 100)) : 0;
            const onTrack = pct >= 75;
            return (
              <div key={k.id} style={{ background: tok.alertBg, border: `1px solid ${pct >= 100 ? k.color + "44" : tok.alertBdr}`, borderRadius: 14, padding: 16, transition: "border-color .3s" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{k.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: tok.cardText }}>{k.label}</span>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 700,
                    background: pct >= 100 ? "rgba(74,222,128,.15)" : onTrack ? "rgba(251,191,36,.12)" : "rgba(107,114,128,.1)",
                    color: pct >= 100 ? "#4ade80" : onTrack ? "#fbbf24" : tok.cardSub }}>
                    {pct >= 100 ? "🎯 Done" : onTrack ? "On Track" : "Behind"}
                  </span>
                </div>

                {/* Progress ring-style display */}
                <div style={{ textAlign: "center" as const, marginBottom: 10 }}>
                  <p style={{ fontSize: 28, fontWeight: 900, color: k.color, margin: "0 0 2px" }}>
                    {k.prefix ?? ""}{k.current.toLocaleString("en-IN")}
                  </p>
                  <p style={{ fontSize: 11, color: tok.cardSub, margin: 0 }}>
                    of {kpiEditing === k.id ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <input value={kpiEditVal} onChange={e => setKpiEditVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveKpiGoal(k.id, kpiEditVal); if (e.key === "Escape") setKpiEditing(null); }} autoFocus
                          style={{ width: 80, padding: "2px 6px", borderRadius: 6, border: `1px solid ${k.color}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none" }} />
                        <button onClick={() => saveKpiGoal(k.id, kpiEditVal)} style={{ fontSize: 11, color: "#4ade80", background: "none", border: "none", cursor: "pointer" }}>✓</button>
                      </span>
                    ) : (
                      <button onClick={() => { setKpiEditing(k.id); setKpiEditVal(String(k.goal)); }} style={{ fontSize: 11, color: k.color, fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline dotted" }}>
                        {k.prefix ?? ""}{k.goal.toLocaleString("en-IN")} goal ✏
                      </button>
                    )}
                  </p>
                </div>

                {/* Progress bar */}
                <div style={{ height: 8, borderRadius: 4, background: tok.alertBdr, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? "#4ade80" : k.color, borderRadius: 4, transition: "width 0.6s ease" }} />
                </div>
                <p style={{ fontSize: 11, color: tok.cardSub, textAlign: "right" as const, marginTop: 5 }}>{pct}% complete</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ADMIN ACTIVITY LOG
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<ClipboardList size={14} color="#a78bfa" />, "Admin Activity Log", `${activityLog.length} recent actions`)}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={loadActivityLog} disabled={actLogLoading}
            style={{ padding: "6px 14px", borderRadius: 9, background: "rgba(167,139,250,.1)", border: "1px solid rgba(167,139,250,.25)", color: "#a78bfa", fontSize: 12, fontWeight: 700, cursor: actLogLoading ? "not-allowed" : "pointer" }}>
            {actLogLoading ? "…" : "↻ Refresh"}
          </button>
        </div>

        {activityLog.length === 0 ? (
          <p style={{ fontSize: 13, color: tok.cardSub, textAlign: "center" as const, padding: "28px 0" }}>
            {actLogLoading ? "Loading activity…" : "No admin activity logged yet."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, maxHeight: 360, overflowY: "auto" as const }}>
            {activityLog.map((log, i) => {
              const actionColor = log.action.toLowerCase().includes("delete") || log.action.toLowerCase().includes("ban") ? "#f87171"
                : log.action.toLowerCase().includes("approve") || log.action.toLowerCase().includes("verify") ? "#4ade80"
                : log.action.toLowerCase().includes("reject") ? "#f97316"
                : "#a5b4fc";
              const icon = log.action.toLowerCase().includes("delete") || log.action.toLowerCase().includes("ban") ? "🚫"
                : log.action.toLowerCase().includes("approve") || log.action.toLowerCase().includes("verify") ? "✅"
                : log.action.toLowerCase().includes("reject") ? "❌"
                : "🔹";
              return (
                <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, background: i === 0 ? "rgba(167,139,250,.06)" : tok.cardBg, border: `1px solid ${i === 0 ? "rgba(167,139,250,.2)" : tok.alertBdr}` }}>
                  <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: actionColor, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{log.action}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <p style={{ fontSize: 10.5, color: tok.cardSub, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                        {JSON.stringify(log.metadata).slice(0, 90)}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: 10.5, color: tok.cardSub, flexShrink: 0 }}>
                    {new Date(log.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          PERFORMANCE & MONITORING
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Activity size={14} color="#34d399" />, "Performance & Monitoring",
          lastPerfRun ? `Last check: ${lastPerfRun}` : "Checking…")}

        {/* Run button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <button onClick={runPerfCheck} disabled={perfLoading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 10, background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.3)", color: "#34d399", fontSize: 12, fontWeight: 700, cursor: perfLoading ? "not-allowed" : "pointer" }}>
            {perfLoading ? <><span style={{ display: "inline-block", width: 10, height: 10, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> Running…</> : "↻ Run Perf Check"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>

          {/* ── 1. API Response Time Chart ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>⚡</span> API Response Times
            </p>
            {perfResults.length === 0 ? (
              <p style={{ fontSize: 12, color: tok.cardSub, textAlign: "center" as const, padding: "24px 0" }}>{perfLoading ? "Running queries…" : "Click 'Run Perf Check' to start."}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {perfResults.map(r => {
                  const barColor = r.status === "fast" ? "#34d399" : r.status === "ok" ? "#fbbf24" : "#f87171";
                  const maxMs = Math.max(...perfResults.map(x => x.ms), 1);
                  const barPct = Math.min(100, Math.round((r.ms / maxMs) * 100));
                  return (
                    <div key={r.table}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: tok.cardText }}>{r.table}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: barColor, fontFamily: "monospace" }}>{r.ms}ms</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: tok.alertBdr, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${barPct}%`, background: barColor, borderRadius: 4, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  {[{ color: "#34d399", label: "Fast (<120ms)" }, { color: "#fbbf24", label: "OK (<350ms)" }, { color: "#f87171", label: "Slow (>350ms)" }].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                      <span style={{ fontSize: 10, color: tok.cardSub }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── 2. DB Query Stats ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>🗄️</span> Database Row Counts
            </p>
            {dbStats.length === 0 ? (
              <p style={{ fontSize: 12, color: tok.cardSub, textAlign: "center" as const, padding: "24px 0" }}>{perfLoading ? "Counting rows…" : "Click 'Run Perf Check'."}</p>
            ) : (
              <>
                {(() => {
                  const max = Math.max(...dbStats.map(d => d.rows), 1);
                  return (
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                      {dbStats.map(d => (
                        <div key={d.table}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: tok.cardText }}>{d.table}</span>
                            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#a5b4fc", fontFamily: "monospace" }}>
                              {d.rows.toLocaleString("en-IN")} rows
                            </span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: tok.alertBdr, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.max(2, Math.round((d.rows / max) * 100))}%`, background: "linear-gradient(90deg,#6366f1,#a5b4fc)", borderRadius: 3, transition: "width 0.6s ease" }} />
                          </div>
                        </div>
                      ))}
                      <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "4px 0 0", textAlign: "right" as const }}>
                        Total: {dbStats.reduce((s, d) => s + d.rows, 0).toLocaleString("en-IN")} rows across {dbStats.length} tables
                      </p>
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* ── 3. Error Rate Tracker ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>📉</span> Audit Log Activity Today
              <span style={{ marginLeft: "auto", fontSize: 10, color: tok.cardSub }}>4-hour buckets</span>
            </p>
            {errorRateData.length === 0 ? (
              <p style={{ fontSize: 12, color: tok.cardSub, textAlign: "center" as const, padding: "24px 0" }}>{perfLoading ? "Loading…" : "Run perf check first."}</p>
            ) : (
              <div style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={errorRateData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: tok.cardSub }} />
                    <YAxis tick={{ fontSize: 9, fill: tok.cardSub }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: tok.cardBg, border: `1px solid ${tok.cardBdr}`, borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [`${v} entries`, "Audit Logs"]} />
                    <Bar dataKey="errors" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── 4. Uptime History Log ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>📡</span> Uptime History
              {uptimeLog.length > 0 && (
                <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 700,
                  background: uptimeLog[uptimeLog.length - 1]?.ok ? "rgba(52,211,153,.12)" : "rgba(239,68,68,.12)",
                  color: uptimeLog[uptimeLog.length - 1]?.ok ? "#34d399" : "#f87171" }}>
                  {uptimeLog[uptimeLog.length - 1]?.ok ? "● Healthy" : "● Degraded"}
                </span>
              )}
            </p>
            <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "0 0 12px" }}>Each square = one perf check run</p>

            {/* GitHub-style uptime grid */}
            {uptimeLog.length === 0 ? (
              <p style={{ fontSize: 12, color: tok.cardSub, textAlign: "center" as const, padding: "20px 0" }}>No history yet — run a perf check.</p>
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 12 }}>
                  {uptimeLog.map((entry, i) => (
                    <div key={i} title={`${new Date(entry.ts).toLocaleString("en-IN")} — ${entry.ms}ms avg — ${entry.ok ? "Healthy" : "Degraded"}`}
                      style={{ width: 20, height: 20, borderRadius: 4, background: entry.ok ? "#34d399" : "#f87171",
                        opacity: 0.5 + (i / uptimeLog.length) * 0.5, cursor: "default" }} />
                  ))}
                </div>
                <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(52,211,153,.06)", border: "1px solid rgba(52,211,153,.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: tok.cardSub }}>Uptime rate</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#34d399" }}>
                      {Math.round((uptimeLog.filter(u => u.ok).length / uptimeLog.length) * 100)}%
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: tok.cardSub }}>Avg response</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#a5b4fc" }}>
                      {Math.round(uptimeLog.reduce((s, u) => s + u.ms, 0) / uptimeLog.length)}ms
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: tok.cardSub }}>Total checks</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: tok.cardText }}>{uptimeLog.length}</span>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PLATFORM SETTINGS
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Server size={14} color="#a78bfa" />, "Platform Settings", "Maintenance · Flags · Referral · Fees")}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>

          {/* ── 1. Maintenance Mode ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${maintMode ? "rgba(239,68,68,.4)" : tok.alertBdr}`, borderRadius: 14, padding: 16, transition: "border-color .3s" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>🔧</span> Maintenance Mode
              {maintMode && <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 8px", borderRadius: 5, background: "rgba(239,68,68,.15)", color: "#f87171", fontWeight: 700, animation: "pulse 2s infinite" }}>● ACTIVE</span>}
            </p>

            {/* Big toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "12px 14px", borderRadius: 10, background: maintMode ? "rgba(239,68,68,.07)" : "rgba(74,222,128,.05)", border: `1px solid ${maintMode ? "rgba(239,68,68,.2)" : "rgba(74,222,128,.15)"}` }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: maintMode ? "#f87171" : "#4ade80", margin: 0 }}>
                  {maintMode ? "Platform is DOWN" : "Platform is LIVE"}
                </p>
                <p style={{ fontSize: 11, color: tok.cardSub, margin: "2px 0 0" }}>Toggle to enable maintenance mode</p>
              </div>
              <button onClick={() => setMaintMode(v => !v)}
                style={{ width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
                  background: maintMode ? "#ef4444" : "#22c55e", transition: "background .25s" }}>
                <span style={{ position: "absolute", top: 4, left: maintMode ? 26 : 4, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .25s", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }} />
              </button>
            </div>

            {/* Custom message */}
            <p style={{ fontSize: 11, fontWeight: 700, color: tok.cardSub, margin: "0 0 6px", textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>Maintenance Message</p>
            <textarea value={maintMsg} onChange={e => setMaintMsg(e.target.value)} rows={3}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const, marginBottom: 12 }} />

            <button onClick={saveMaintMode} disabled={maintSaving}
              style={{ width: "100%", padding: "9px", borderRadius: 10, background: "rgba(167,139,250,.12)", border: "1px solid rgba(167,139,250,.3)", color: "#a78bfa", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {maintSaving ? "Saved ✓" : "Save Settings"}
            </button>
          </div>

          {/* ── 2. Feature Flags Panel ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>🚀</span> Feature Flags
              <span style={{ marginLeft: "auto", fontSize: 10, color: tok.cardSub }}>{Object.values(featureFlags).filter(Boolean).length}/{Object.keys(featureFlags).length} enabled</span>
            </p>

            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {Object.entries(featureFlags).map(([key, enabled]) => {
                const label = key.replace(/^enable_/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                const isSaving = flagSaving === key;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: tok.cardBg, border: `1px solid ${enabled ? "rgba(74,222,128,.2)" : tok.alertBdr}`, transition: "border-color .2s" }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 10, color: tok.cardSub, margin: "1px 0 0", fontFamily: "monospace" }}>{key}</p>
                    </div>
                    <button onClick={() => toggleFeatureFlag(key)} disabled={isSaving}
                      style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: isSaving ? "not-allowed" : "pointer", position: "relative", flexShrink: 0,
                        background: enabled ? "#22c55e" : tok.alertBdr, transition: "background .2s", opacity: isSaving ? 0.6 : 1 }}>
                      <span style={{ position: "absolute", top: 3, left: enabled ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 3. Referral Bonus Config ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>🎁</span> Referral Bonus Config
            </p>

            {/* Bonus amount */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 6px", fontWeight: 600 }}>Bonus per Referral (₹)</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: tok.cardSub }}>₹</span>
                <input type="number" min={0} value={referralBonus} onChange={e => setReferralBonus(Number(e.target.value))}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 13, fontWeight: 700, outline: "none" }} />
              </div>
            </div>

            {/* Minimum payout */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 6px", fontWeight: 600 }}>Min. Referral Earnings for Payout (₹)</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: tok.cardSub }}>₹</span>
                <input type="number" min={0} value={referralMinPay} onChange={e => setReferralMinPay(Number(e.target.value))}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 13, fontWeight: 700, outline: "none" }} />
              </div>
            </div>

            {/* Live preview */}
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)", marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>A user needs <strong style={{ color: "#a5b4fc" }}>{Math.ceil(referralMinPay / Math.max(1, referralBonus))} referrals</strong> before payout</p>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: 0 }}>Each referral earns <strong style={{ color: "#4ade80" }}>₹{referralBonus.toLocaleString("en-IN")}</strong></p>
            </div>

            <button onClick={saveReferralConfig} disabled={referralSaving}
              style={{ width: "100%", padding: "9px", borderRadius: 10, background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.3)", color: "#a5b4fc", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {referralSaving ? "Saved ✓" : "Save Referral Config"}
            </button>
          </div>

          {/* ── 4. Platform Fee Editor ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>💳</span> Platform Fee Editor
            </p>

            {/* Fee Rate */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 6px", fontWeight: 600 }}>Transaction Fee Rate (%)</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" min={0} max={50} step={0.5} value={pfeeRate} onChange={e => setPfeeRate(Number(e.target.value))}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 13, fontWeight: 700, outline: "none" }} />
                <span style={{ fontSize: 14, fontWeight: 900, color: "#fbbf24" }}>%</span>
              </div>
            </div>

            {/* Min Fee */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 6px", fontWeight: 600 }}>Minimum Fee (₹)</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: tok.cardSub }}>₹</span>
                <input type="number" min={0} value={pfeeMin} onChange={e => setPfeeMin(Number(e.target.value))}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 13, fontWeight: 700, outline: "none" }} />
              </div>
            </div>

            {/* Max Fee */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 6px", fontWeight: 600 }}>Maximum Fee Cap (₹)</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: tok.cardSub }}>₹</span>
                <input type="number" min={0} value={pfeeMax} onChange={e => setPfeeMax(Number(e.target.value))}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 13, fontWeight: 700, outline: "none" }} />
              </div>
            </div>

            {/* Fee preview band */}
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(251,191,36,.06)", border: "1px solid rgba(251,191,36,.15)", marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 2px" }}>For a ₹10,000 project:</p>
              <p style={{ fontSize: 14, fontWeight: 900, color: "#fbbf24", margin: 0 }}>
                ₹{Math.min(pfeeMax, Math.max(pfeeMin, Math.round(10000 * pfeeRate / 100))).toLocaleString("en-IN")} fee
              </p>
            </div>

            <button onClick={savePlatformFee} disabled={pfeeSaving}
              style={{ width: "100%", padding: "9px", borderRadius: 10, background: "rgba(251,191,36,.12)", border: "1px solid rgba(251,191,36,.3)", color: "#fbbf24", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {pfeeSaving ? "Saved ✓" : "Save Platform Fees"}
            </button>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECURITY & MODERATION
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Shield size={14} color="#f87171" />, "Security & Moderation",
          ipLoading ? "Loading…" : `${rlStats.activeBans} active IP bans`)}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>

          {/* ── 1. IP Ban Manager ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 15 }}>🚫</span> IP Ban Manager
              </p>
              <button onClick={loadSecurityData} disabled={ipLoading}
                style={{ padding: "4px 10px", borderRadius: 8, background: tok.cardBg, border: `1px solid ${tok.alertBdr}`, color: tok.cardSub, fontSize: 11, cursor: "pointer" }}>
                {ipLoading ? "…" : "↻ Refresh"}
              </button>
            </div>

            {/* Add new ban */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, marginBottom: 12, padding: "12px", borderRadius: 10, background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.15)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#f87171", margin: "0 0 6px" }}>Block New IP</p>
              <input value={ipBanInput} onChange={e => setIpBanInput(e.target.value)}
                placeholder="IP address (e.g. 192.168.1.1)…"
                style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none" }} />
              <input value={ipBanReason} onChange={e => setIpBanReason(e.target.value)}
                placeholder="Reason…"
                style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none" }} />
              <button onClick={addIPBan} disabled={ipBanning || !ipBanInput.trim() || !ipBanReason.trim()}
                style={{ padding: "8px", borderRadius: 9, background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.35)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: (ipBanning || !ipBanInput.trim() || !ipBanReason.trim()) ? "not-allowed" : "pointer" }}>
                {ipBanning ? "Banning…" : "Block IP"}
              </button>
            </div>

            {/* Banned IP list */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, maxHeight: 220, overflowY: "auto" as const }}>
              {bannedIPs.length === 0 ? (
                <p style={{ fontSize: 12, color: tok.cardSub, textAlign: "center" as const, padding: "16px 0" }}>No blocked IPs.</p>
              ) : bannedIPs.map(ip => (
                <div key={ip.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9, background: tok.cardBg, border: `1px solid ${ip.is_active ? "rgba(239,68,68,.2)" : tok.alertBdr}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, margin: 0, fontFamily: "monospace" }}>{ip.ip_address}</p>
                    <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{ip.reason || "—"}</p>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 700,
                    background: ip.is_active ? "rgba(239,68,68,.12)" : "rgba(107,114,128,.1)",
                    color: ip.is_active ? "#f87171" : tok.cardSub }}>
                    {ip.is_active ? "Active" : "Lifted"}
                  </span>
                  {ip.is_active && (
                    <button onClick={() => removeIPBan(ip.id)}
                      style={{ padding: "4px 9px", borderRadius: 7, background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", color: "#4ade80", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                      Unban
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── 2. Suspicious Login Alerts ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>⚠️</span> Suspicious Login Alerts
              <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "rgba(251,191,36,.1)", color: "#fbbf24", fontWeight: 700 }}>
                {suspLogins.length} alerts
              </span>
            </p>

            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, maxHeight: 280, overflowY: "auto" as const }}>
              {suspLogins.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center" as const }}>
                  <p style={{ fontSize: 20, margin: "0 0 6px" }}>✅</p>
                  <p style={{ fontSize: 12, color: tok.cardSub, margin: 0 }}>No suspicious activity detected.</p>
                </div>
              ) : suspLogins.map(log => (
                <div key={log.id} style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(251,191,36,.05)", border: "1px solid rgba(251,191,36,.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24" }}>{log.action}</span>
                    <span style={{ fontSize: 10, color: tok.cardSub }}>
                      {new Date(log.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p style={{ fontSize: 10.5, color: tok.cardSub, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      {JSON.stringify(log.metadata).slice(0, 80)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── 3. Content Flagging Queue ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>🚩</span> Content Flagging Queue
              <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "rgba(239,68,68,.1)", color: "#f87171", fontWeight: 700 }}>
                {flaggedItems.length} pending
              </span>
            </p>

            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, maxHeight: 280, overflowY: "auto" as const }}>
              {flaggedItems.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center" as const }}>
                  <p style={{ fontSize: 20, margin: "0 0 6px" }}>✅</p>
                  <p style={{ fontSize: 12, color: tok.cardSub, margin: 0 }}>No flagged content in queue.</p>
                </div>
              ) : flaggedItems.map(item => (
                <div key={item.id} style={{ padding: "10px 12px", borderRadius: 10, background: tok.cardBg, border: "1px solid rgba(239,68,68,.18)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "rgba(139,92,246,.1)", color: "#a78bfa", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{item.type}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.title}</p>
                      <p style={{ fontSize: 10.5, color: tok.cardSub, margin: 0 }}>
                        Flagged {new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <button onClick={() => resolveFlag(item.id)} disabled={flagResolving === item.id}
                      style={{ padding: "4px 10px", borderRadius: 7, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.25)", color: "#4ade80", fontSize: 11, fontWeight: 700, cursor: flagResolving === item.id ? "not-allowed" : "pointer", flexShrink: 0 }}>
                      {flagResolving === item.id ? "…" : "Resolve"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 4. Rate Limit Stats ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>📊</span> Security Stats
            </p>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Total IP Bans", value: rlStats.totalBans, color: "#f87171", bg: "rgba(239,68,68,.08)" },
                { label: "Active Bans", value: rlStats.activeBans, color: "#fb923c", bg: "rgba(251,146,60,.08)" },
                { label: "Last 24h Bans", value: rlStats.last24h, color: "#fbbf24", bg: "rgba(251,191,36,.08)" },
                { label: "Susp. Alerts", value: suspLogins.length, color: "#a78bfa", bg: "rgba(139,92,246,.08)" },
              ].map(s => (
                <div key={s.label} style={{ padding: "10px 12px", borderRadius: 10, background: s.bg, border: `1px solid ${s.color}25` }}>
                  <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: "0 0 2px" }}>{s.value}</p>
                  <p style={{ fontSize: 10.5, color: tok.cardSub, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Top ban reasons */}
            {rlStats.topReasons.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: tok.cardSub, margin: "0 0 8px", textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>Top Ban Reasons</p>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                  {rlStats.topReasons.map(r => {
                    const pct = rlStats.totalBans > 0 ? Math.round((r.count / rlStats.totalBans) * 100) : 0;
                    return (
                      <div key={r.reason}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: tok.cardSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: "70%" }}>{r.reason}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#f87171" }}>{r.count}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 3, background: tok.alertBdr, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "#f87171", borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {rlStats.topReasons.length === 0 && (
              <p style={{ fontSize: 12, color: tok.cardSub, textAlign: "center" as const, padding: "16px 0" }}>No ban data available yet.</p>
            )}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FINANCE & PAYMENTS
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<DollarSign size={14} color="#4ade80" />, "Finance & Payments", "Payout · Commission · Wallet · Tax")}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>

          {/* ── 1. Payout Scheduler ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>📅</span> Payout Scheduler
            </p>

            {/* Enable toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: tok.cardSub }}>Auto Payouts Enabled</span>
              <button onClick={() => setPayoutEnabled(v => !v)}
                style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
                  background: payoutEnabled ? "#22c55e" : tok.alertBdr, transition: "background .2s" }}>
                <span style={{ position: "absolute", top: 3, left: payoutEnabled ? 22 : 3, width: 18, height: 18,
                  borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
              </button>
            </div>

            {/* Day of month */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11.5, color: tok.cardSub, flex: 1 }}>Day of Month</span>
              <input type="number" min={1} max={28} value={payoutDay} onChange={e => setPayoutDay(Number(e.target.value))}
                style={{ width: 60, padding: "5px 8px", borderRadius: 8, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, textAlign: "center", outline: "none" }} />
            </div>

            {/* Min amount */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11.5, color: tok.cardSub, flex: 1 }}>Min Amount (₹)</span>
              <input type="number" min={0} value={payoutMinAmt} onChange={e => setPayoutMinAmt(Number(e.target.value))}
                style={{ width: 80, padding: "5px 8px", borderRadius: 8, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, textAlign: "center", outline: "none" }} />
            </div>

            {/* Auto-approve toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 11.5, color: tok.cardSub }}>Auto-Approve Payouts</span>
              <button onClick={() => setPayoutAutoApprove(v => !v)}
                style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
                  background: payoutAutoApprove ? "#22c55e" : tok.alertBdr, transition: "background .2s" }}>
                <span style={{ position: "absolute", top: 3, left: payoutAutoApprove ? 22 : 3, width: 18, height: 18,
                  borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
              </button>
            </div>

            <button onClick={savePayoutSchedule} disabled={payoutSaving}
              style={{ width: "100%", padding: "9px", borderRadius: 10, background: "rgba(74,222,128,.15)", border: "1px solid rgba(74,222,128,.3)", color: "#4ade80", fontSize: 13, fontWeight: 700, cursor: payoutSaving ? "not-allowed" : "pointer" }}>
              {payoutSaving ? "Saved ✓" : "Save Schedule"}
            </button>
          </div>

          {/* ── 2. Commission Rule Editor ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>⚙️</span> Commission Rule Editor
            </p>
            <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 14px" }}>
              Platform commission charged on each successful project. Currently: <strong style={{ color: "#fbbf24" }}>{commRate}%</strong>
            </p>

            {/* Rate input */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <input type="number" min={0} max={100} step={0.5} value={commRateInput}
                onChange={e => setCommRateInput(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 14, fontWeight: 700, outline: "none" }} />
              <span style={{ fontSize: 16, color: "#fbbf24", fontWeight: 900 }}>%</span>
            </div>

            {/* Commission impact preview */}
            {(() => {
              const r = parseFloat(commRateInput);
              const rev = taxData.totalRevenue;
              const comm = isNaN(r) ? 0 : Math.round(rev * (r / 100));
              return (
                <div style={{ background: "rgba(251,191,36,.06)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>Projected commission on current revenue</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24", margin: 0 }}>₹{comm.toLocaleString("en-IN")}</p>
                </div>
              );
            })()}

            <button onClick={saveCommissionRate} disabled={commSaving}
              style={{ width: "100%", padding: "9px", borderRadius: 10, background: "rgba(251,191,36,.12)", border: "1px solid rgba(251,191,36,.3)", color: "#fbbf24", fontSize: 13, fontWeight: 700, cursor: commSaving ? "not-allowed" : "pointer" }}>
              {commSaving ? "Saving…" : "Update Commission Rate"}
            </button>
          </div>

          {/* ── 3. Wallet Top-Up ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>💰</span> Wallet Top-Up
            </p>

            {/* Email search */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <input value={topupEmail} onChange={e => { setTopupEmail(e.target.value); setTopupUserId(null); setTopupUserName(""); }}
                placeholder="User email…"
                style={{ flex: 1, padding: "7px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none" }} />
              <button onClick={searchTopupUser} disabled={topupSearching || !topupEmail.trim()}
                style={{ padding: "7px 12px", borderRadius: 9, background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: (topupSearching || !topupEmail.trim()) ? "not-allowed" : "pointer" }}>
                {topupSearching ? "…" : "Find"}
              </button>
            </div>

            {/* User found badge */}
            {topupUserId && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 9, background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", marginBottom: 10 }}>
                <span style={{ fontSize: 12 }}>✅</span>
                <span style={{ fontSize: 11.5, color: "#4ade80", fontWeight: 700 }}>{topupUserName}</span>
              </div>
            )}

            {/* Amount */}
            <div style={{ position: "relative", marginBottom: 8 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: tok.cardSub }}>₹</span>
              <input type="number" min={1} value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                placeholder="Amount"
                style={{ width: "100%", padding: "8px 10px 8px 22px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
            </div>

            {/* Note */}
            <input value={topupNote} onChange={e => setTopupNote(e.target.value)}
              placeholder="Note (optional)…"
              style={{ width: "100%", padding: "7px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none", boxSizing: "border-box" as const, marginBottom: 12 }} />

            {/* Message */}
            {topupMsg && (
              <div style={{ padding: "7px 10px", borderRadius: 9, marginBottom: 10,
                background: topupMsg.ok ? "rgba(74,222,128,.08)" : "rgba(239,68,68,.08)",
                border: `1px solid ${topupMsg.ok ? "rgba(74,222,128,.25)" : "rgba(239,68,68,.2)"}`,
                color: topupMsg.ok ? "#4ade80" : "#f87171", fontSize: 12 }}>
                {topupMsg.text}
              </div>
            )}

            <button onClick={processTopup} disabled={topupProcessing || !topupUserId || !topupAmount}
              style={{ width: "100%", padding: "9px", borderRadius: 10, background: (!topupUserId || !topupAmount) ? "rgba(74,222,128,.05)" : "rgba(74,222,128,.18)", border: "1px solid rgba(74,222,128,.3)", color: "#4ade80", fontSize: 13, fontWeight: 700, cursor: (topupProcessing || !topupUserId || !topupAmount) ? "not-allowed" : "pointer" }}>
              {topupProcessing ? "Processing…" : "Add Funds to Wallet"}
            </button>
          </div>

          {/* ── 4. Tax Summary Report ── */}
          <div style={{ background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: tok.cardText, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>🧾</span> Tax Summary Report
              <span style={{ fontSize: 10, color: tok.cardSub, fontWeight: 400, marginLeft: "auto" }}>GST 18% · TDS 2%</span>
            </p>

            {[
              { label: "Total Platform Revenue", value: taxData.totalRevenue, color: "#60a5fa" },
              { label: `Platform Commission (${commRate}%)`, value: taxData.totalCommission, color: "#fbbf24" },
              { label: "GST Collected (18% on commission)", value: taxData.gst, color: "#f97316" },
              { label: "TDS Withheld (2% of revenue)", value: taxData.tds, color: "#a78bfa" },
              { label: "Total Tax Liability", value: taxData.gst + taxData.tds, color: "#f87171" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${tok.alertBdr}` }}>
                <span style={{ fontSize: 11.5, color: tok.cardSub }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: row.color }}>₹{row.value.toLocaleString("en-IN")}</span>
              </div>
            ))}

            {/* Export Tax CSV */}
            <button onClick={() => {
              const rows = [
                ["Metric", "Amount (INR)"],
                ["Total Revenue", taxData.totalRevenue],
                [`Commission (${commRate}%)`, taxData.totalCommission],
                ["GST 18% on commission", taxData.gst],
                ["TDS 2% on revenue", taxData.tds],
                ["Total Tax Liability", taxData.gst + taxData.tds],
              ];
              const csv = rows.map(r => r.join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `freelan-tax-report-${new Date().toISOString().slice(0,7)}.csv`;
              a.click();
            }} style={{ marginTop: 14, width: "100%", padding: "9px", borderRadius: 10, background: "rgba(139,92,246,.12)", border: "1px solid rgba(139,92,246,.3)", color: "#a78bfa", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ⬇ Export Tax Report CSV
            </button>
          </div>

        </div>
      </div>

      {/* ══ ANNOUNCEMENT BROADCAST ══ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Mail size={14} color="#60a5fa" />, "Announcement Broadcast", "Send to all users")}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)}
            placeholder="Type your announcement here… (will be sent to all users)"
            rows={3}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${tok.alertBdr}`, background: tok.alertBg, color: tok.cardText, fontSize: 12.5, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={sendAnnouncement} disabled={announceSending || !announcementText.trim()}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 9, background: announceSending || !announcementText.trim() ? "rgba(96,165,250,.08)" : "rgba(96,165,250,.15)", border: "1px solid rgba(96,165,250,.3)", color: "#60a5fa", fontSize: 12.5, fontWeight: 700, cursor: (announceSending || !announcementText.trim()) ? "not-allowed" : "pointer" }}>
              {announceSending ? <><span style={{ display:"inline-block", width:10, height:10, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} /> Sending…</> : <><Mail size={12} /> Send Announcement</>}
            </button>
            {announcementText.length > 0 && (
              <button onClick={() => setAnnouncementText("")}
                style={{ padding: "9px 14px", borderRadius: 9, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: tok.cardSub, fontSize: 12, cursor: "pointer" }}>
                ✕ Clear
              </button>
            )}
            <span style={{ fontSize: 10.5, color: tok.cardSub, marginLeft: "auto" }}>{announcementText.length} chars</span>
          </div>
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(96,165,250,.06)", border: "1px solid rgba(96,165,250,.15)" }}>
            <p style={{ fontSize: 10.5, color: "#93c5fd", margin: 0 }}>Announcements are stored in the database and visible to all platform users. Use responsibly.</p>
          </div>
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

      {/* ══════════════════════════════════════════════════════
          REVENUE ANALYTICS
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<BarChart3 size={14} color="#4ade80" />, "Revenue Analytics", "Last 6 months — income vs commission")}
        {revLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "32px 0", fontSize: 13 }}>Loading chart…</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Total Income",    val: `₹${revChartData.reduce((s,d)=>s+d.income,0).toLocaleString("en-IN")}`,      color: "#4ade80" },
                { label: "Commission Earned", val: `₹${revChartData.reduce((s,d)=>s+d.commission,0).toLocaleString("en-IN")}`, color: "#6366f1" },
                { label: "Projects Created",  val: revChartData.reduce((s,d)=>s+d.projects,0).toLocaleString("en-IN"),         color: "#fbbf24" },
              ].map(s => (
                <div key={s.label} style={{ padding: "12px 14px", borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
                  <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={revChartData}>
                <XAxis dataKey="month" tick={{ fill: tok.chartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tok.chartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tok.chartTip} formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, ""]} />
                <Bar dataKey="income" fill="#4ade80" radius={[4,4,0,0]} name="Income" opacity={0.85} />
                <Bar dataKey="commission" fill="#6366f1" radius={[4,4,0,0]} name="Commission" opacity={0.85} />
                <Line type="monotone" dataKey="projects" stroke="#fbbf24" strokeWidth={2} dot={{ fill:"#fbbf24", r:3 }} name="Projects" />
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          USER GROWTH TIMELINE
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {sectionHeader(<TrendingUp size={14} color="#8b5cf6" />, "User Growth Timeline", `${growthTimelineData.reduce((s,d)=>s+d.total,0)} new users in period`)}
          <div style={{ display: "flex", gap: 6 }}>
            {(["weekly","monthly"] as const).map(p => (
              <button key={p} onClick={() => setGrowthPeriod(p)}
                style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", background: growthPeriod===p ? "#8b5cf6" : tok.alertBg, color: growthPeriod===p ? "#fff" : tok.cardSub, transition: "all .2s" }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {growthLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "32px 0", fontSize: 13 }}>Loading…</p>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <ComposedChart data={growthTimelineData}>
              <XAxis dataKey="week" tick={{ fill: tok.chartAxis, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: tok.chartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tok.chartTip} />
              <Bar dataKey="freelancers" fill="#8b5cf6" radius={[4,4,0,0]} name="Freelancers" stackId="a" />
              <Bar dataKey="clients"     fill="#60a5fa" radius={[4,4,0,0]} name="Clients"     stackId="a" />
              <Line type="monotone" dataKey="total" stroke="#fbbf24" strokeWidth={2.5} dot={false} name="Total" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          {[["#8b5cf6","Freelancers"],["#60a5fa","Clients"],["#fbbf24","Total"]].map(([c,l]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: tok.cardSub }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: c }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TOP FREELANCERS LEADERBOARD
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Trophy size={14} color="#fbbf24" />, "Top Freelancers Leaderboard", "Ranked by wallet balance")}
        {topFLLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>Loading leaderboard…</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topFreelancers.map((f, i) => {
              const medals = ["🥇","🥈","🥉"];
              const barWidth = topFreelancers[0].balance > 0 ? Math.round((f.balance / topFreelancers[0].balance) * 100) : 0;
              return (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: i === 0 ? "rgba(251,191,36,.06)" : tok.alertBg, border: `1px solid ${i < 3 ? "rgba(251,191,36,.2)" : tok.alertBdr}` }}>
                  <span style={{ fontSize: i < 3 ? 18 : 13, width: 28, textAlign: "center", fontWeight: 800, color: i < 3 ? "#fbbf24" : tok.cardSub }}>
                    {i < 3 ? medals[i] : `#${i + 1}`}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: tok.cardText, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                    <p style={{ fontSize: 10.5, color: tok.cardSub, margin: 0 }}>{f.email}</p>
                    <div style={{ height: 4, borderRadius: 2, background: tok.alertBdr, marginTop: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${barWidth}%`, background: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c2f" : "#6366f1", borderRadius: 2 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#4ade80", flexShrink: 0 }}>₹{f.balance.toLocaleString("en-IN")}</span>
                </div>
              );
            })}
            {topFreelancers.length === 0 && <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>No freelancer data yet.</p>}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          WITHDRAWAL QUEUE
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {sectionHeader(<Wallet size={14} color="#f97316" />, "Withdrawal Queue", `${wdQueue.length} pending approvals`)}
          <button onClick={loadWdQueue} style={{ padding: "6px 14px", borderRadius: 9, background: "rgba(249,115,22,.1)", border: "1px solid rgba(249,115,22,.25)", color: "#f97316", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>↻ Refresh</button>
        </div>
        {wdLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>Loading queue…</p>
        ) : wdQueue.length === 0 ? (
          <p style={{ textAlign: "center", color: "#4ade80", padding: "28px 0", fontSize: 13 }}>✓ No pending withdrawals</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {wdQueue.map(w => (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: tok.cardText, margin: "0 0 2px" }}>{w.userName}</p>
                  <p style={{ fontSize: 11, color: tok.cardSub, margin: 0 }}>{w.userEmail} · {new Date(w.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#f97316", flexShrink: 0 }}>₹{w.amount.toLocaleString("en-IN")}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => approveWithdrawal(w.id, true)} disabled={wdProcessing === w.id}
                    style={{ padding: "6px 13px", borderRadius: 8, border: "1px solid #4ade80", background: "rgba(74,222,128,.1)", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    ✓ Approve
                  </button>
                  <button onClick={() => approveWithdrawal(w.id, false)} disabled={wdProcessing === w.id}
                    style={{ padding: "6px 13px", borderRadius: 8, border: "1px solid #f87171", background: "rgba(248,113,113,.1)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          REFERRAL ANALYTICS
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Users size={14} color="#34d399" />, "Referral Analytics", "Conversion & bonus tracking")}
        {refLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>Loading…</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
              {[
                { label: "Total Referrals", val: refStats.total,     color: "#34d399" },
                { label: "Converted",       val: refStats.converted, color: "#4ade80" },
                { label: "Pending",         val: refStats.pending,   color: "#fbbf24" },
                { label: "Bonus Paid",      val: `₹${refStats.bonusPaid.toLocaleString("en-IN")}`, color: "#6366f1" },
              ].map(s => (
                <div key={s.label} style={{ padding: "13px 14px", borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
                  <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>{s.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</p>
                </div>
              ))}
            </div>
            {refStats.total > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: tok.cardSub, marginBottom: 6 }}>Conversion Rate</p>
                <div style={{ height: 10, borderRadius: 5, background: tok.alertBdr, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round((refStats.converted / refStats.total) * 100)}%`, background: "linear-gradient(90deg,#34d399,#4ade80)", borderRadius: 5 }} />
                </div>
                <p style={{ fontSize: 11, color: "#4ade80", marginTop: 5 }}>{Math.round((refStats.converted / refStats.total) * 100)}% conversion</p>
              </div>
            )}
            {refTopReferrers.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, marginBottom: 8 }}>Top Referrers</p>
                {refTopReferrers.map((r, i) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9, background: tok.alertBg, marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#fbbf24", width: 20 }}>#{i+1}</span>
                    <span style={{ fontSize: 12, color: tok.cardText, flex: 1, fontFamily: "monospace" }}>{r.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>{r.count} refs</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          GEO ANALYTICS
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Globe size={14} color="#60a5fa" />, "Geo Analytics", "User distribution by region")}
        {geoLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>Loading…</p>
        ) : geoData.length === 0 ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>No regional data found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {geoData.map((g, i) => (
              <div key={g.region} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11, color: tok.cardSub, width: 130, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.region}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: tok.alertBdr, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${g.pct}%`, background: REGION_COLORS[i % REGION_COLORS.length], borderRadius: 4, transition: "width .6s ease" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, width: 52, textAlign: "right", flexShrink: 0 }}>{g.count} <span style={{ fontSize: 10, color: tok.cardSub }}>({g.pct}%)</span></span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          SKILL & CATEGORY ANALYTICS
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Star size={14} color="#c4b5fd" />, "Skill & Category Analytics", "Most popular across all projects")}
        {skillLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>Loading…</p>
        ) : skillData.length === 0 ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>No project data available.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
            <div>
              {skillData.map((s, i) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: tok.cardSub, width: 18, flexShrink: 0 }}>{i+1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: tok.cardText, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                    <div style={{ height: 5, borderRadius: 3, background: tok.alertBdr, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.round((s.count / (skillData[0]?.count || 1)) * 100)}%`, background: s.color, borderRadius: 3 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.count}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={skillData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={3}>
                  {skillData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={tok.chartTip} formatter={(v: number, n: string) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          COUPON / PROMO MANAGER
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {sectionHeader(<Tag size={14} color="#f97316" />, "Coupon & Promo Manager", `${coupons.filter(c=>c.active).length} active codes`)}
          <button onClick={() => setShowCouponForm(p => !p)}
            style={{ padding: "7px 15px", borderRadius: 9, background: showCouponForm ? tok.alertBg : "rgba(249,115,22,.12)", border: "1px solid rgba(249,115,22,.3)", color: "#f97316", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {showCouponForm ? "✕ Close" : "+ New Coupon"}
          </button>
        </div>

        {showCouponForm && (
          <div style={{ padding: "14px", borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, alignItems: "end" }}>
            {[
              { label: "Code",    key: "code",     placeholder: "FLAT50" },
              { label: "Discount",key: "discount", placeholder: "50" },
              { label: "Max Uses",key: "maxUses",  placeholder: "100" },
              { label: "Expires", key: "expires",  placeholder: "", type: "date" },
            ].map(f => (
              <div key={f.key}>
                <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>{f.label}</p>
                <input type={f.type || "text"} value={(couponForm as Record<string,string>)[f.key]} placeholder={f.placeholder}
                  onChange={e => setCouponForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>Type</p>
              <select value={couponForm.type} onChange={e => setCouponForm(p => ({ ...p, type: e.target.value as "pct"|"flat" }))}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none" }}>
                <option value="pct">% Discount</option>
                <option value="flat">₹ Flat Off</option>
              </select>
            </div>
            <button onClick={saveCoupon} disabled={couponAdding}
              style={{ padding: "8px 0", borderRadius: 9, background: "#f97316", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Save Coupon
            </button>
          </div>
        )}

        {coupons.length === 0 ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>No coupons yet. Create one above.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Code","Discount","Type","Uses","Expires","Status","Actions"].map(h => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 10.5, color: tok.cardSub, fontWeight: 700, borderBottom: `1px solid ${tok.alertBdr}`, letterSpacing: .4 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.code} style={{ borderBottom: `1px solid ${tok.alertBdr}` }}>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 800, color: "#f97316", fontFamily: "monospace" }}>{c.code}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: tok.cardText }}>{c.type === "pct" ? `${c.discount}%` : `₹${c.discount}`}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: c.type==="pct" ? "rgba(99,102,241,.12)" : "rgba(249,115,22,.12)", color: c.type==="pct" ? "#a5b4fc" : "#f97316", fontWeight: 700 }}>{c.type === "pct" ? "Percent" : "Flat"}</span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: tok.cardSub }}>{c.uses}/{c.maxUses}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: tok.cardSub }}>{c.expires || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, fontWeight: 700, background: c.active ? "rgba(74,222,128,.12)" : "rgba(107,114,128,.1)", color: c.active ? "#4ade80" : tok.cardSub }}>
                        {c.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => toggleCoupon(c.code)} style={{ padding: "4px 10px", borderRadius: 7, fontSize: 11, border: `1px solid ${c.active?"#f87171":"#4ade80"}`, background: c.active?"rgba(248,113,113,.1)":"rgba(74,222,128,.1)", color: c.active?"#f87171":"#4ade80", cursor: "pointer" }}>
                          {c.active ? "Disable" : "Enable"}
                        </button>
                        <button onClick={() => deleteCoupon(c.code)} style={{ padding: "4px 10px", borderRadius: 7, fontSize: 11, border: "1px solid rgba(248,113,113,.3)", background: "rgba(248,113,113,.07)", color: "#f87171", cursor: "pointer" }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          REVIEW MODERATION
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Flag size={14} color="#f87171" />, "Review & Message Moderation", `${flaggedReviews.length} flagged items`)}
        {reviewLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>Loading…</p>
        ) : flaggedReviews.length === 0 ? (
          <p style={{ textAlign: "center", color: "#4ade80", padding: "28px 0", fontSize: 13 }}>✓ No flagged content detected</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {flaggedReviews.map(r => (
              <div key={r.id} style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(248,113,113,.05)", border: "1px solid rgba(248,113,113,.15)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>🚩</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, color: tok.cardText, fontWeight: 700, margin: "0 0 3px" }}>From: <span style={{ fontFamily: "monospace", color: "#f87171" }}>{r.reviewer}</span></p>
                  <p style={{ fontSize: 12, color: tok.cardSub, margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.comment}</p>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: "rgba(248,113,113,.12)", color: "#f87171", fontWeight: 700 }}>{r.flagReason}</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => dismissReview(r.id)} style={{ padding: "5px 11px", borderRadius: 7, border: "1px solid rgba(74,222,128,.3)", background: "rgba(74,222,128,.08)", color: "#4ade80", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    Dismiss
                  </button>
                  <button onClick={async () => { await supabase.from("messages").delete().eq("id", r.id); dismissReview(r.id); }}
                    style={{ padding: "5px 11px", borderRadius: 7, border: "1px solid rgba(248,113,113,.3)", background: "rgba(248,113,113,.08)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAX REPORT GENERATOR
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<DollarSign size={14} color="#4ade80" />, "Tax Report Generator", "TDS & GST auto-calculation")}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 5px" }}>Financial Year</p>
            <select value={taxYear} onChange={e => setTaxYear(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.alertBg, color: tok.cardText, fontSize: 13, outline: "none" }}>
              {[2022,2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 5px" }}>Quarter</p>
            <select value={taxQuarter} onChange={e => setTaxQuarter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.alertBg, color: tok.cardText, fontSize: 13, outline: "none" }}>
              <option value="all">Full Year</option>
              {["1","2","3","4"].map(q => <option key={q} value={q}>Q{q} (Apr-{["Jun","Sep","Dec","Mar"][parseInt(q)-1]})</option>)}
            </select>
          </div>
          <button onClick={generateTaxReport} disabled={taxLoading}
            style={{ padding: "9px 20px", borderRadius: 9, background: "#4ade80", border: "none", color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            {taxLoading ? "Calculating…" : "Generate Report"}
          </button>
          {taxReportData && (
            <button onClick={downloadTaxCSV}
              style={{ padding: "9px 16px", borderRadius: 9, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.3)", color: "#4ade80", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ↓ Export CSV
            </button>
          )}
        </div>

        {taxReportData && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Total Credited (Gross)", val: `₹${taxReportData.totalAmount.toLocaleString("en-IN")}`,    color: "#4ade80" },
              { label: "TDS @ 1% (Sec 194C)",   val: `₹${taxReportData.tds.toLocaleString("en-IN")}`,           color: "#fbbf24" },
              { label: "GST on Commission @18%", val: `₹${taxReportData.gst.toLocaleString("en-IN")}`,           color: "#f97316" },
              { label: "Total Transactions",     val: taxReportData.totalTransactions.toLocaleString("en-IN"),    color: "#60a5fa" },
            ].map(s => (
              <div key={s.label} style={{ padding: "14px 16px", borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
                <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 6px", lineHeight: 1.3 }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</p>
              </div>
            ))}
          </div>
        )}
        {!taxReportData && !taxLoading && (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "20px 0", fontSize: 13 }}>Select year & quarter then generate to see TDS/GST breakdown.</p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          SESSION ANALYTICS
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Activity size={14} color="#60a5fa" />, "Session Analytics", "Active users & peak hour heatmap")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, alignItems: "start" }}>
          <div style={{ textAlign: "center", padding: "20px", background: tok.alertBg, borderRadius: 16, border: `1px solid ${tok.alertBdr}` }}>
            <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 8px", fontWeight: 700, letterSpacing: .4 }}>ACTIVE NOW</p>
            <p style={{ fontSize: 52, fontWeight: 900, color: "#4ade80", margin: 0, lineHeight: 1 }}>{sessionLoading ? "…" : activeNow}</p>
            <p style={{ fontSize: 11, color: tok.cardSub, margin: "8px 0 0" }}>updated 30 min window</p>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ade80", margin: "10px auto 0", boxShadow: "0 0 8px #4ade80" }} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, marginBottom: 10 }}>Peak Hours (Last 7 Days)</p>
            {peakHours.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={peakHours.filter((_, i) => i % 2 === 0)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fill: tok.chartAxis, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: tok.chartAxis, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tok.chartTip} />
                  <Bar dataKey="users" fill="#60a5fa" radius={[3,3,0,0]} opacity={0.85} name="Users" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: tok.cardSub, fontSize: 13, textAlign: "center", padding: "28px 0" }}>Loading peak hours…</p>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PROJECT COMPLETION FUNNEL
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<TrendingUp size={14} color="#a78bfa" />, "Project Completion Funnel", "Bid → Accept → Deliver → Payment")}
        {funnelLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "32px 0", fontSize: 13 }}>Loading funnel…</p>
        ) : projFunnelData.length === 0 ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "32px 0", fontSize: 13 }}>No project data available.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {projFunnelData.map((stage, i) => (
              <div key={stage.stage} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 11, color: tok.cardSub, width: 130, flexShrink: 0, fontWeight: i === 0 ? 700 : 400 }}>{stage.stage}</span>
                <div style={{ flex: 1, position: "relative", height: 32, borderRadius: 8, background: tok.alertBdr, overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${stage.pct}%`, background: stage.color, borderRadius: 8, opacity: 0.85, transition: "width .7s ease" }} />
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: "#fff", zIndex: 1 }}>{stage.count.toLocaleString("en-IN")}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: stage.color, width: 42, textAlign: "right", flexShrink: 0 }}>{stage.pct}%</span>
                {i < projFunnelData.length - 1 && (
                  <span style={{ fontSize: 10, color: "#f87171", flexShrink: 0, width: 60, textAlign: "right" }}>
                    {projFunnelData[i + 1] ? `-${100 - projFunnelData[i + 1].pct}% drop` : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          ANNOUNCEMENT SCHEDULER
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {sectionHeader(<Calendar size={14} color="#f97316" />, "Announcement Scheduler", `${announcements.filter(a => !a.sent).length} pending`)}
          <button onClick={() => setShowAnnForm(p => !p)} style={{ padding: "7px 15px", borderRadius: 9, background: showAnnForm ? tok.alertBg : "rgba(249,115,22,.12)", border: "1px solid rgba(249,115,22,.3)", color: "#f97316", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {showAnnForm ? "✕ Close" : "+ Schedule"}
          </button>
        </div>

        {showAnnForm && (
          <div style={{ padding: 14, borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={annForm.title} onChange={e => setAnnForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title…"
              style={{ padding: "8px 12px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 13, outline: "none" }} />
            <textarea value={annForm.body} onChange={e => setAnnForm(p => ({ ...p, body: e.target.value }))} placeholder="Announcement body (optional)…" rows={3}
              style={{ padding: "8px 12px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 13, outline: "none", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>Schedule Date & Time</p>
                <input type="datetime-local" value={annForm.scheduledAt} onChange={e => setAnnForm(p => ({ ...p, scheduledAt: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={saveAnnouncement} disabled={annSaving} style={{ padding: "9px 20px", borderRadius: 9, background: "#f97316", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 18 }}>
                {annSaving ? "…" : "Schedule"}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {announcements.length === 0 && <p style={{ textAlign: "center", color: tok.cardSub, padding: "22px 0", fontSize: 13 }}>No announcements scheduled.</p>}
          {announcements.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, background: a.sent ? tok.alertBg : "rgba(249,115,22,.05)", border: `1px solid ${a.sent ? tok.alertBdr : "rgba(249,115,22,.2)"}` }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{a.sent ? "📢" : "🕐"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: tok.cardText, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</p>
                <p style={{ fontSize: 11, color: tok.cardSub, margin: 0 }}>{a.scheduledAt ? new Date(a.scheduledAt).toLocaleString("en-IN") : "No time set"}</p>
              </div>
              <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 6, fontWeight: 700, background: a.sent ? "rgba(74,222,128,.12)" : "rgba(249,115,22,.12)", color: a.sent ? "#4ade80" : "#f97316" }}>
                {a.sent ? "Sent" : "Pending"}
              </span>
              {!a.sent && (
                <button onClick={() => markAnnouncementSent(a.id)} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(74,222,128,.3)", background: "rgba(74,222,128,.08)", color: "#4ade80", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  Mark Sent
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ADMIN STICKY NOTES
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<ClipboardList size={14} color="#fbbf24" />, "Admin Sticky Notes", `${stickyNotes.length} notes`)}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-start" }}>
          <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Write an admin note…" rows={2}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
            style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1px solid ${tok.alertBdr}`, background: tok.alertBg, color: tok.cardText, fontSize: 13, outline: "none", resize: "none" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#fbbf24","#4ade80","#f87171","#60a5fa","#a78bfa","#f97316"].map(c => (
                <button key={c} onClick={() => setNoteColor(c)} style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: noteColor === c ? `2px solid ${tok.cardText}` : "none", cursor: "pointer", padding: 0, flexShrink: 0 }} />
              ))}
            </div>
            <button onClick={addNote} style={{ padding: "8px 14px", borderRadius: 9, background: noteColor, border: "none", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
          </div>
        </div>
        {stickyNotes.length === 0 ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "16px 0", fontSize: 13 }}>No notes yet. Add reminders above.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
            {stickyNotes.map(n => (
              <div key={n.id} style={{ padding: "12px 14px", borderRadius: 12, background: `${n.color}18`, border: `1px solid ${n.color}40`, position: "relative" }}>
                <button onClick={() => deleteNote(n.id)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: tok.cardSub, cursor: "pointer", fontSize: 14, lineHeight: 1, opacity: .6 }}>×</button>
                <p style={{ fontSize: 13, color: tok.cardText, margin: "0 0 8px", paddingRight: 16, lineHeight: 1.5 }}>{n.text}</p>
                <p style={{ fontSize: 10, color: tok.cardSub, margin: 0 }}>{n.created}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          USER SEGMENTATION TOOL
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Users size={14} color="#34d399" />, "User Segmentation Tool", "Filter & target specific user groups")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Min Balance (₹)", key: "minBalance", type: "number", placeholder: "0" },
            { label: "Max Balance (₹)", key: "maxBalance", type: "number", placeholder: "99999" },
            { label: "Region",          key: "region",     type: "text",   placeholder: "Delhi" },
          ].map(f => (
            <div key={f.key}>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>{f.label}</p>
              <input type={f.type} placeholder={f.placeholder} value={(segFilter as Record<string,string>)[f.key]}
                onChange={e => setSegFilter(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.alertBg, color: tok.cardText, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>User Type</p>
            <select value={segFilter.type} onChange={e => setSegFilter(p => ({ ...p, type: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: `1px solid ${tok.alertBdr}`, background: tok.alertBg, color: tok.cardText, fontSize: 12, outline: "none" }}>
              <option value="all">All</option>
              <option value="freelancer">Freelancers</option>
              <option value="client">Clients</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={runSegmentation} disabled={segLoading}
              style={{ width: "100%", padding: "9px 0", borderRadius: 9, background: "#34d399", border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {segLoading ? "Searching…" : "Run Segment"}
            </button>
          </div>
        </div>

        {segSearched && (
          <>
            <p style={{ fontSize: 12, color: tok.cardSub, marginBottom: 10 }}>{segResults.length} users matched</p>
            {segResults.length > 0 && (
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Name","Email","Balance","Region","Type"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10.5, color: tok.cardSub, fontWeight: 700, borderBottom: `1px solid ${tok.alertBdr}`, letterSpacing: .4 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {segResults.map(u => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${tok.alertBdr}` }}>
                        <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, color: tok.cardText }}>{u.name}</td>
                        <td style={{ padding: "9px 12px", fontSize: 11, color: tok.cardSub }}>{u.email}</td>
                        <td style={{ padding: "9px 12px", fontSize: 12, color: "#4ade80", fontWeight: 700 }}>₹{u.balance.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "9px 12px", fontSize: 11, color: tok.cardSub }}>{u.region}</td>
                        <td style={{ padding: "9px 12px" }}><span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: u.type === "employee" ? "rgba(99,102,241,.12)" : "rgba(251,191,36,.12)", color: u.type === "employee" ? "#a5b4fc" : "#fbbf24", fontWeight: 700 }}>{u.type === "employee" ? "Freelancer" : "Client"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          COMPLIANCE DASHBOARD
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Shield size={14} color="#f87171" />, "Compliance Dashboard", "KYC, bank, wallet regulatory overview")}
        {complianceLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>Loading compliance data…</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
              {[
                { label: "KYC Pending",         val: compliance.kycPending,       color: "#fbbf24", icon: "⏳" },
                { label: "KYC Verified",         val: compliance.kycVerified,      color: "#4ade80", icon: "✅" },
                { label: "Bank Verify Pending",  val: compliance.bankPending,      color: "#f97316", icon: "🏦" },
                { label: "Suspended Wallets",    val: compliance.suspendedWallets, color: "#f87171", icon: "🔒" },
                { label: "Total Users",          val: compliance.totalUsers,       color: "#60a5fa", icon: "👥" },
                { label: "Compliance Rate",      val: `${compliance.totalUsers > 0 ? Math.round((compliance.kycVerified / compliance.totalUsers) * 100) : 0}%`, color: "#34d399", icon: "📊" },
              ].map(s => (
                <div key={s.label} style={{ padding: "14px", borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
                  <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>{s.icon} {s.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 }}>{typeof s.val === "number" ? s.val.toLocaleString("en-IN") : s.val}</p>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, marginBottom: 8 }}>KYC Compliance Progress</p>
              <div style={{ height: 12, borderRadius: 6, background: tok.alertBdr, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${compliance.totalUsers > 0 ? Math.round((compliance.kycVerified / compliance.totalUsers) * 100) : 0}%`, background: "linear-gradient(90deg,#4ade80,#34d399)", borderRadius: 6, transition: "width .7s" }} />
              </div>
              <p style={{ fontSize: 11, color: "#4ade80", marginTop: 6 }}>{compliance.totalUsers > 0 ? Math.round((compliance.kycVerified / compliance.totalUsers) * 100) : 0}% of users KYC verified</p>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          EARNINGS FORECAST
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<TrendingUp size={14} color="#4ade80" />, "Earnings Forecast", "Trend-based 3-month projection")}
        {forecastLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "32px 0", fontSize: 13 }}>Calculating forecast…</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={forecast}>
                <XAxis dataKey="month" tick={{ fill: tok.chartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tok.chartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tok.chartTip} formatter={(v: number | null) => v !== null && v !== undefined ? [`₹${v.toLocaleString("en-IN")}`, ""] : ["—", ""]} />
                <Bar dataKey="actual" fill="#4ade80" radius={[4,4,0,0]} name="Actual" opacity={0.85} />
                <Line type="monotone" dataKey="projected" stroke="#f97316" strokeWidth={2.5} strokeDasharray="6 3" dot={{ fill:"#f97316", r:4 }} name="Projected" connectNulls />
                <ReferenceLine x={forecast.find(f => f.actual === null)?.month} stroke="rgba(255,255,255,.2)" strokeDasharray="4 2" label={{ value:"Forecast →", fill: tok.cardSub, fontSize: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 16, marginTop: 10, justifyContent: "flex-end" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: tok.cardSub }}><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#4ade80" }} />Actual</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: tok.cardSub }}><span style={{ display: "inline-block", width: 14, height: 2, background: "#f97316" }} />Projected</span>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          PLATFORM HEALTH SCORE
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Zap size={14} color="#fbbf24" />, "Platform Health Score", "Composite score from 5 key metrics")}
        {healthLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "32px 0", fontSize: 13 }}>Calculating health score…</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ position: "relative", width: 120, height: 120 }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke={tok.alertBdr} strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none"
                    stroke={healthScore !== null && healthScore >= 75 ? "#4ade80" : healthScore !== null && healthScore >= 50 ? "#fbbf24" : "#f87171"}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${((healthScore ?? 0) / 100) * 327} 327`}
                    transform="rotate(-90 60 60)" style={{ transition: "stroke-dasharray .8s ease" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: healthScore !== null && healthScore >= 75 ? "#4ade80" : healthScore !== null && healthScore >= 50 ? "#fbbf24" : "#f87171" }}>{healthScore ?? "—"}</span>
                  <span style={{ fontSize: 10, color: tok.cardSub }}>/ 100</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: tok.cardText, marginTop: 8, fontWeight: 700 }}>
                {healthScore !== null && healthScore >= 75 ? "🟢 Excellent" : healthScore !== null && healthScore >= 50 ? "🟡 Fair" : "🔴 Needs Attention"}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {healthBreakdown.map(b => (
                <div key={b.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: tok.cardText }}>{b.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: b.color }}>{b.score}/100</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: tok.alertBdr, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${b.score}%`, background: b.color, borderRadius: 3, transition: "width .6s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          DISPUTE RESOLUTION TRACKER
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {sectionHeader(<AlertTriangle size={14} color="#f97316" />, "Dispute Resolution Tracker", `${disputes.filter(d => d.status === "pending").length} open disputes`)}
          <div style={{ display: "flex", gap: 6 }}>
            {["all","pending","resolved","rejected"].map(f => (
              <button key={f} onClick={() => setDisputeFilter(f)}
                style={{ padding: "5px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", background: disputeFilter === f ? "#f97316" : tok.alertBg, color: disputeFilter === f ? "#fff" : tok.cardSub }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {disputeLoading ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>Loading disputes…</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {disputes.filter(d => disputeFilter === "all" || d.status === disputeFilter).map(d => {
              const statusColor = d.status === "resolved" ? "#4ade80" : d.status === "rejected" ? "#f87171" : "#f97316";
              return (
                <div key={d.id} style={{ padding: "12px 14px", borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: tok.cardText, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</p>
                    <p style={{ fontSize: 11, color: tok.cardSub, margin: 0 }}>
                      {new Date(d.created_at).toLocaleDateString("en-IN")} · by <span style={{ fontFamily: "monospace" }}>{d.raisedBy}</span>
                      {d.resolved_at && <> · resolved {new Date(d.resolved_at).toLocaleDateString("en-IN")}</>}
                    </p>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 6, fontWeight: 700, background: `${statusColor}14`, color: statusColor, flexShrink: 0 }}>
                    {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                  </span>
                  {d.status === "pending" && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => updateDisputeStatus(d.id, "resolved")} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(74,222,128,.3)", background: "rgba(74,222,128,.08)", color: "#4ade80", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Resolve</button>
                      <button onClick={() => updateDisputeStatus(d.id, "rejected")} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(248,113,113,.3)", background: "rgba(248,113,113,.08)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Reject</button>
                    </div>
                  )}
                </div>
              );
            })}
            {disputes.filter(d => disputeFilter === "all" || d.status === disputeFilter).length === 0 && (
              <p style={{ textAlign: "center", color: "#4ade80", padding: "24px 0", fontSize: 13 }}>✓ No {disputeFilter === "all" ? "" : disputeFilter} disputes</p>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          A/B FEATURE TEST MANAGER
          ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {sectionHeader(<Zap size={14} color="#c4b5fd" />, "A/B Feature Test Manager", `${abTests.filter(t => t.enabled).length} active tests`)}
          <button onClick={() => setShowAbForm(p => !p)} style={{ padding: "7px 15px", borderRadius: 9, background: showAbForm ? tok.alertBg : "rgba(196,181,253,.12)", border: "1px solid rgba(196,181,253,.3)", color: "#c4b5fd", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {showAbForm ? "✕ Close" : "+ New Test"}
          </button>
        </div>

        {showAbForm && (
          <div style={{ padding: 14, borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>Test Name</p>
              <input value={abForm.name} onChange={e => setAbForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. New Onboarding Flow"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>Variant</p>
              <select value={abForm.variant} onChange={e => setAbForm(p => ({ ...p, variant: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none" }}>
                {["A","B","Control"].map(v => <option key={v} value={v}>Variant {v}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, color: tok.cardSub, margin: "0 0 4px" }}>Target</p>
              <select value={abForm.target} onChange={e => setAbForm(p => ({ ...p, target: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${tok.alertBdr}`, background: tok.cardBg, color: tok.cardText, fontSize: 12, outline: "none" }}>
                <option value="all">All Users</option>
                <option value="freelancers">Freelancers Only</option>
                <option value="clients">Clients Only</option>
                <option value="new">New Users Only</option>
              </select>
            </div>
            <button onClick={saveAbTest} style={{ padding: "9px 16px", borderRadius: 9, background: "#c4b5fd", border: "none", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Create</button>
          </div>
        )}

        {abTests.length === 0 ? (
          <p style={{ textAlign: "center", color: tok.cardSub, padding: "28px 0", fontSize: 13 }}>No A/B tests created yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {abTests.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: t.enabled ? "rgba(196,181,253,.05)" : tok.alertBg, border: `1px solid ${t.enabled ? "rgba(196,181,253,.2)" : tok.alertBdr}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: tok.cardText, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: tok.cardSub, margin: 0 }}>Variant {t.variant} · {t.target}</p>
                </div>
                <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 6, fontWeight: 700, background: t.enabled ? "rgba(196,181,253,.14)" : tok.alertBg, color: t.enabled ? "#c4b5fd" : tok.cardSub }}>
                  {t.enabled ? "Running" : "Paused"}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => toggleAbTest(t.id)} style={{ padding: "5px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: `1px solid ${t.enabled ? "rgba(248,113,113,.3)" : "rgba(74,222,128,.3)"}`, background: t.enabled ? "rgba(248,113,113,.08)" : "rgba(74,222,128,.08)", color: t.enabled ? "#f87171" : "#4ade80", cursor: "pointer" }}>
                    {t.enabled ? "Pause" : "Enable"}
                  </button>
                  <button onClick={() => deleteAbTest(t.id)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, border: "1px solid rgba(248,113,113,.2)", background: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;
