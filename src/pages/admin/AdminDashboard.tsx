import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Clock, CheckCircle, Wallet, Fingerprint, Landmark,
  LifeBuoy, Briefcase, Edit, UserCheck, Building2,
  IndianRupee, UserPlus, MessageSquare, TrendingUp,
  ArrowUpRight, Shield, Activity,
} from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

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
    cardText:   "white",
    cardSub:    "rgba(255,255,255,.4)",
    secTitle:   "rgba(255,255,255,.8)",
    secIcon:    "rgba(255,255,255,.15)",
    arrowFg:    "rgba(255,255,255,.2)",
    badgeBg:    "rgba(255,255,255,.06)",
    badgeFg:    "rgba(255,255,255,.35)",
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
  },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { theme } = useDashboardTheme();
  const tok = TH[theme];

  const [stats, setStats] = useState({
    totalUsers: 0, pendingApprovals: 0, approvedUsers: 0,
    pendingWithdrawals: 0, pendingAadhaar: 0, pendingBank: 0,
    pendingRecovery: 0, totalJobs: 0, pendingProfileEdits: 0,
    totalEmployees: 0, totalClients: 0, employeeEarnings: 0,
    clientEarnings: 0, employeesInvited: 0, clientsInvited: 0,
    unreadSupportChats: 0,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const [profiles, withdrawals, aadhaar, bank, recovery, jobs, transactions, referredProfiles, supportMessages] = await Promise.all([
        supabase.from("profiles").select("id, approval_status, user_type, edit_request_status"),
        supabase.from("withdrawals").select("id").eq("status", "pending"),
        supabase.from("aadhaar_verifications").select("id").eq("status", "pending"),
        supabase.from("bank_verifications").select("id").eq("status", "pending"),
        supabase.from("recovery_requests").select("id").eq("status", "pending"),
        supabase.from("projects").select("id", { count: "exact" }),
        supabase.from("transactions").select("profile_id, amount, type"),
        supabase.from("profiles").select("id, user_type, referred_by").not("referred_by", "is", null),
        supabase.from("messages").select("id, is_read, chat_room_id, chat_rooms!inner(type)").eq("is_read", false).eq("chat_rooms.type", "support"),
      ]);

      const allProfiles = profiles.data || [];
      const allTransactions = transactions.data || [];
      const referredUsers = referredProfiles.data || [];
      const employeeIds = new Set(allProfiles.filter(p => p.user_type === "employee").map(p => p.id));
      const clientIds = new Set(allProfiles.filter(p => p.user_type === "client").map(p => p.id));
      const employeeEarnings = allTransactions.filter(t => t.type === "credit" && employeeIds.has(t.profile_id)).reduce((s, t) => s + Number(t.amount), 0);
      const clientEarnings = allTransactions.filter(t => t.type === "credit" && clientIds.has(t.profile_id)).reduce((s, t) => s + Number(t.amount), 0);

      setStats({
        totalUsers: allProfiles.length,
        pendingApprovals: allProfiles.filter(p => p.approval_status === "pending").length,
        approvedUsers: allProfiles.filter(p => p.approval_status === "approved").length,
        pendingWithdrawals: withdrawals.data?.length || 0,
        pendingAadhaar: aadhaar.data?.length || 0,
        pendingBank: bank.data?.length || 0,
        pendingRecovery: recovery.data?.length || 0,
        totalJobs: jobs.count || jobs.data?.length || 0,
        pendingProfileEdits: allProfiles.filter(p => p.edit_request_status === "requested").length,
        totalEmployees: allProfiles.filter(p => p.user_type === "employee").length,
        totalClients: allProfiles.filter(p => p.user_type === "client").length,
        employeeEarnings, clientEarnings,
        employeesInvited: referredUsers.filter(p => p.user_type === "employee").length,
        clientsInvited: referredUsers.filter(p => p.user_type === "client").length,
        unreadSupportChats: supportMessages.data?.length || 0,
      });
      setLoaded(true);
    };
    fetchStats();
  }, []);

  const fmt = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  const sections = [
    {
      title: "User Overview", icon: Users, color: A1,
      cards: [
        { label: "Total Users",   value: stats.totalUsers,     icon: Users,       color: "#a5b4fc", bg: "rgba(99,102,241,.14)",  path: "/admin/users" },
        { label: "Employees",     value: stats.totalEmployees, icon: UserCheck,   color: "#a5b4fc", bg: "rgba(99,102,241,.14)",  path: "/admin/employees" },
        { label: "Clients",       value: stats.totalClients,   icon: Building2,   color: "#a5b4fc", bg: "rgba(99,102,241,.14)",  path: "/admin/clients" },
        { label: "Approved",      value: stats.approvedUsers,  icon: CheckCircle, color: "#4ade80", bg: "rgba(34,197,94,.12)",   path: "/admin/users" },
      ],
    },
    {
      title: "Pending Actions", icon: Clock, color: "#f59e0b",
      cards: [
        { label: "User Approvals", value: stats.pendingApprovals,   icon: Clock,         color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/users",              urgent: stats.pendingApprovals > 0 },
        { label: "Withdrawals",    value: stats.pendingWithdrawals, icon: Wallet,        color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/withdrawals",        urgent: stats.pendingWithdrawals > 0 },
        { label: "Aadhaar Verify", value: stats.pendingAadhaar,     icon: Fingerprint,   color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/verifications",      urgent: stats.pendingAadhaar > 0 },
        { label: "Bank Verify",    value: stats.pendingBank,        icon: Landmark,      color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/bank-verifications", urgent: stats.pendingBank > 0 },
        { label: "Recovery",       value: stats.pendingRecovery,    icon: LifeBuoy,      color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/recovery-requests",  urgent: stats.pendingRecovery > 0 },
        { label: "Profile Edits",  value: stats.pendingProfileEdits,icon: Edit,          color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/profile-edits",      urgent: stats.pendingProfileEdits > 0 },
        { label: "Support Unread", value: stats.unreadSupportChats, icon: MessageSquare, color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/recovery-requests",  urgent: stats.unreadSupportChats > 0 },
      ],
    },
    {
      title: "Financial", icon: IndianRupee, color: "#4ade80",
      cards: [
        { label: "Employee Earnings", value: fmt(stats.employeeEarnings), icon: TrendingUp,  color: "#4ade80", bg: "rgba(34,197,94,.12)", path: "/admin/wallet-management", isCurrency: true },
        { label: "Client Earnings",   value: fmt(stats.clientEarnings),   icon: IndianRupee, color: "#4ade80", bg: "rgba(34,197,94,.12)", path: "/admin/wallet-management", isCurrency: true },
      ],
    },
    {
      title: "Growth & Engagement", icon: Activity, color: A2,
      cards: [
        { label: "Employees Invited", value: stats.employeesInvited, icon: UserPlus, color: "#a5b4fc", bg: "rgba(99,102,241,.14)", path: "/admin/employees" },
        { label: "Clients Invited",   value: stats.clientsInvited,   icon: UserPlus, color: A2,        bg: "rgba(139,92,246,.14)", path: "/admin/clients" },
        { label: "Total Jobs",        value: stats.totalJobs,        icon: Briefcase,color: "#4ade80",  bg: "rgba(34,197,94,.12)", path: "/admin/jobs" },
      ],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Hero Header */}
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 20, padding: "28px 28px 24px", background: tok.heroGrad, border: `1px solid ${tok.heroBdr}` }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, borderRadius: "50%", background: tok.orbA, filter: "blur(30px)" }} />
        <div style={{ position: "absolute", bottom: -30, left: 60, width: 100, height: 100, borderRadius: "50%", background: tok.orbB, filter: "blur(20px)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,.15)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.2)" }}>
              <Shield size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "white", letterSpacing: "-0.5px" }}>Admin Dashboard</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 1 }}>Platform overview & management</p>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(34,197,94,.18)", border: "1px solid rgba(34,197,94,.3)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>Live</span>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[
              { label: "Users",       value: stats.totalUsers,         icon: Users,    color: "#a5b4fc" },
              { label: "Pending",     value: stats.pendingApprovals,   icon: Clock,    color: "#fbbf24" },
              { label: "Jobs",        value: stats.totalJobs,          icon: Briefcase,color: "#4ade80" },
              { label: "Withdrawals", value: stats.pendingWithdrawals, icon: Wallet,   color: "#f87171" },
            ].map(s => (
              <div key={s.label} style={{ padding: "12px 14px", borderRadius: 14, background: tok.statBox, border: `1px solid ${tok.statBdr}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <s.icon size={13} style={{ color: s.color }} />
                  <span style={{ fontSize: 11, color: tok.statSub }}>{s.label}</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 900, color: tok.statTxt }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, sIdx) => (
        <div key={section.title} style={{ display: "flex", flexDirection: "column", gap: 14, opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(20px)", transition: `all .4s ease ${sIdx * 80}ms` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: tok.secIcon, border: `1px solid ${section.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <section.icon size={14} style={{ color: section.color }} />
            </div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.secTitle }}>{section.title}</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {section.cards.map(c => (
              <div key={c.label}
                style={{ background: tok.cardBg, border: (c as any).urgent ? "1px solid rgba(239,68,68,.3)" : `1px solid ${tok.cardBdr}`, borderRadius: 16, padding: "18px", cursor: "pointer", transition: "all .2s", backdropFilter: "blur(12px)", boxShadow: theme === "white" || theme === "wb" ? "0 2px 8px rgba(0,0,0,.06)" : "none" }}
                onClick={() => navigate(c.path)}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-3px)"; el.style.boxShadow = theme === "black" ? "0 12px 32px rgba(0,0,0,.35)" : "0 8px 24px rgba(0,0,0,.12)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = theme === "white" || theme === "wb" ? "0 2px 8px rgba(0,0,0,.06)" : "none"; }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <c.icon size={17} style={{ color: c.color }} />
                  </div>
                  <ArrowUpRight size={13} style={{ color: tok.arrowFg }} />
                </div>
                <p style={{ fontWeight: 900, color: tok.cardText, fontSize: (c as any).isCurrency ? 16 : 24, letterSpacing: "-0.5px" }}>{c.value}</p>
                <p style={{ fontSize: 11, color: tok.cardSub, marginTop: 3 }}>{c.label}</p>
                {(c as any).urgent && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                    <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>Needs attention</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;
