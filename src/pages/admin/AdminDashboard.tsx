import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Clock, CheckCircle, Wallet, Fingerprint, Landmark,
  LifeBuoy, Briefcase, Edit, UserCheck, Building2,
  IndianRupee, UserPlus, MessageSquare, TrendingUp,
  ArrowUpRight, Shield, Activity,
} from "lucide-react";

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const AdminDashboard = () => {
  const navigate = useNavigate();
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
        { label: "Total Users",   value: stats.totalUsers,     icon: Users,      color: "#a5b4fc", bg: "rgba(99,102,241,.14)", path: "/admin/users" },
        { label: "Employees",     value: stats.totalEmployees, icon: UserCheck,  color: "#a5b4fc", bg: "rgba(99,102,241,.14)", path: "/admin/employees" },
        { label: "Clients",       value: stats.totalClients,   icon: Building2,  color: "#a5b4fc", bg: "rgba(99,102,241,.14)", path: "/admin/clients" },
        { label: "Approved",      value: stats.approvedUsers,  icon: CheckCircle,color: "#4ade80", bg: "rgba(34,197,94,.12)", path: "/admin/users" },
      ],
    },
    {
      title: "Pending Actions", icon: Clock, color: "#f59e0b",
      cards: [
        { label: "User Approvals",  value: stats.pendingApprovals,  icon: Clock,        color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/users",              urgent: stats.pendingApprovals > 0 },
        { label: "Withdrawals",     value: stats.pendingWithdrawals,icon: Wallet,       color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/withdrawals",        urgent: stats.pendingWithdrawals > 0 },
        { label: "Aadhaar Verify",  value: stats.pendingAadhaar,    icon: Fingerprint,  color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/verifications",      urgent: stats.pendingAadhaar > 0 },
        { label: "Bank Verify",     value: stats.pendingBank,       icon: Landmark,     color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/bank-verifications", urgent: stats.pendingBank > 0 },
        { label: "Recovery",        value: stats.pendingRecovery,   icon: LifeBuoy,     color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/recovery-requests",  urgent: stats.pendingRecovery > 0 },
        { label: "Profile Edits",   value: stats.pendingProfileEdits,icon: Edit,        color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/profile-edits",      urgent: stats.pendingProfileEdits > 0 },
        { label: "Support Unread",  value: stats.unreadSupportChats,icon: MessageSquare,color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/recovery-requests",  urgent: stats.unreadSupportChats > 0 },
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

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.09)",
    borderRadius: 16,
    padding: "18px",
    cursor: "pointer",
    transition: "all .2s",
    backdropFilter: "blur(12px)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Hero Header */}
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 20, padding: "28px 28px 24px", background: `linear-gradient(135deg,rgba(99,102,241,.25) 0%,rgba(139,92,246,.2) 50%,rgba(99,102,241,.1) 100%)`, border: "1px solid rgba(99,102,241,.25)" }}>
        {/* Animated orbs */}
        <div style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(99,102,241,.2)", filter: "blur(30px)", animation: "orbGlow 6s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: -30, left: 60, width: 100, height: 100, borderRadius: "50%", background: "rgba(139,92,246,.15)", filter: "blur(20px)", animation: "orbGlow 8s ease-in-out infinite 2s" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,.12)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.15)" }}>
              <Shield size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "white", letterSpacing: "-0.5px" }}>Admin Dashboard</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 1 }}>Platform overview & management</p>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.25)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>Live</span>
            </div>
          </div>

          {/* Quick stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[
              { label: "Users",       value: stats.totalUsers,            icon: Users,    color: "#a5b4fc" },
              { label: "Pending",     value: stats.pendingApprovals,      icon: Clock,    color: "#fbbf24" },
              { label: "Jobs",        value: stats.totalJobs,             icon: Briefcase,color: "#4ade80" },
              { label: "Withdrawals", value: stats.pendingWithdrawals,    icon: Wallet,   color: "#f87171" },
            ].map(s => (
              <div key={s.label} style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <s.icon size={13} style={{ color: s.color }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>{s.label}</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categorized sections */}
      {sections.map((section, sIdx) => (
        <div key={section.title} style={{ display: "flex", flexDirection: "column", gap: 14, opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(20px)", transition: `all .4s ease ${sIdx * 80}ms` }}>
          {/* Section title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: `${section.color}18`, border: `1px solid ${section.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <section.icon size={14} style={{ color: section.color }} />
            </div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.8)", letterSpacing: 0 }}>{section.title}</h2>
          </div>

          {/* Cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {section.cards.map(c => (
              <div key={c.label}
                style={{ ...cardStyle, border: (c as any).urgent ? "1px solid rgba(239,68,68,.3)" : "1px solid rgba(255,255,255,.09)" }}
                onClick={() => navigate(c.path)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 32px rgba(0,0,0,.35)"; (e.currentTarget as HTMLDivElement).style.borderColor = c.color + "40"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = (c as any).urgent ? "rgba(239,68,68,.3)" : "rgba(255,255,255,.09)"; }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <c.icon size={17} style={{ color: c.color }} />
                  </div>
                  <ArrowUpRight size={13} style={{ color: "rgba(255,255,255,.2)" }} />
                </div>
                <p style={{ fontWeight: 900, color: "white", fontSize: (c as any).isCurrency ? 16 : 24, letterSpacing: "-0.5px" }}>{c.value}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 3 }}>{c.label}</p>
                {(c as any).urgent && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
                    <span style={{ fontSize: 10, color: "#f87171", fontWeight: 600 }}>Needs attention</span>
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
