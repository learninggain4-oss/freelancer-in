import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, Clock, CheckCircle, Wallet, Fingerprint, Landmark,
  LifeBuoy, Briefcase, Edit, UserCheck, Building2,
  IndianRupee, UserPlus, MessageSquare, TrendingUp,
  ArrowUpRight, Shield, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

      const employeeEarnings = allTransactions
        .filter(t => t.type === "credit" && employeeIds.has(t.profile_id))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const clientEarnings = allTransactions
        .filter(t => t.type === "credit" && clientIds.has(t.profile_id))
        .reduce((sum, t) => sum + Number(t.amount), 0);

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

  const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  const sections = [
    {
      title: "User Overview",
      icon: Users,
      cards: [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary", bg: "bg-primary/10", path: "/admin/users" },
        { label: "Employees", value: stats.totalEmployees, icon: UserCheck, color: "text-primary", bg: "bg-primary/10", path: "/admin/employees" },
        { label: "Clients", value: stats.totalClients, icon: Building2, color: "text-primary", bg: "bg-primary/10", path: "/admin/clients" },
        { label: "Approved", value: stats.approvedUsers, icon: CheckCircle, color: "text-accent", bg: "bg-accent/10", path: "/admin/users" },
      ],
    },
    {
      title: "Pending Actions",
      icon: Clock,
      cards: [
        { label: "User Approvals", value: stats.pendingApprovals, icon: Clock, color: "text-warning", bg: "bg-warning/10", path: "/admin/users", urgent: stats.pendingApprovals > 0 },
        { label: "Withdrawals", value: stats.pendingWithdrawals, icon: Wallet, color: "text-destructive", bg: "bg-destructive/10", path: "/admin/withdrawals", urgent: stats.pendingWithdrawals > 0 },
        { label: "Aadhaar Verify", value: stats.pendingAadhaar, icon: Fingerprint, color: "text-warning", bg: "bg-warning/10", path: "/admin/verifications", urgent: stats.pendingAadhaar > 0 },
        { label: "Bank Verify", value: stats.pendingBank, icon: Landmark, color: "text-warning", bg: "bg-warning/10", path: "/admin/bank-verifications", urgent: stats.pendingBank > 0 },
        { label: "Recovery", value: stats.pendingRecovery, icon: LifeBuoy, color: "text-destructive", bg: "bg-destructive/10", path: "/admin/recovery-requests", urgent: stats.pendingRecovery > 0 },
        { label: "Profile Edits", value: stats.pendingProfileEdits, icon: Edit, color: "text-warning", bg: "bg-warning/10", path: "/admin/profile-edits", urgent: stats.pendingProfileEdits > 0 },
        { label: "Support Unread", value: stats.unreadSupportChats, icon: MessageSquare, color: "text-destructive", bg: "bg-destructive/10", path: "/admin/recovery-requests", urgent: stats.unreadSupportChats > 0 },
      ],
    },
    {
      title: "Financial",
      icon: IndianRupee,
      cards: [
        { label: "Employee Earnings", value: formatCurrency(stats.employeeEarnings), icon: TrendingUp, color: "text-accent", bg: "bg-accent/10", path: "/admin/wallet-management", isCurrency: true },
        { label: "Client Earnings", value: formatCurrency(stats.clientEarnings), icon: IndianRupee, color: "text-accent", bg: "bg-accent/10", path: "/admin/wallet-management", isCurrency: true },
      ],
    },
    {
      title: "Growth & Engagement",
      icon: Activity,
      cards: [
        { label: "Employees Invited", value: stats.employeesInvited, icon: UserPlus, color: "text-primary", bg: "bg-primary/10", path: "/admin/employees" },
        { label: "Clients Invited", value: stats.clientsInvited, icon: UserPlus, color: "text-primary", bg: "bg-primary/10", path: "/admin/clients" },
        { label: "Total Jobs", value: stats.totalJobs, icon: Briefcase, color: "text-accent", bg: "bg-accent/10", path: "/admin/jobs" },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-primary-foreground shadow-lg">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-sm text-primary-foreground/70">Platform overview & management</p>
            </div>
          </div>
          {/* Quick Stats Row */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Users", value: stats.totalUsers, icon: Users },
              { label: "Pending", value: stats.pendingApprovals, icon: Clock },
              { label: "Jobs", value: stats.totalJobs, icon: Briefcase },
              { label: "Withdrawals", value: stats.pendingWithdrawals, icon: Wallet },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className="h-3.5 w-3.5 text-primary-foreground/70" />
                  <span className="text-xs text-primary-foreground/70">{s.label}</span>
                </div>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categorized Sections */}
      {sections.map((section, sIdx) => (
        <div key={section.title} className={cn("space-y-3", loaded && "animate-in fade-in slide-in-from-bottom-4")} style={{ animationDelay: `${sIdx * 100}ms`, animationFillMode: "both" }}>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
              <section.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">{section.title}</h2>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {section.cards.map((c) => (
              <Card
                key={c.label}
                className={cn(
                  "group cursor-pointer border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                  (c as any).urgent && "border-destructive/30 shadow-destructive/5"
                )}
                onClick={() => navigate(c.path)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110", c.bg)}>
                      <c.icon className={cn("h-4 w-4", c.color)} />
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className={cn("font-bold text-foreground", (c as any).isCurrency ? "text-lg" : "text-2xl")}>
                    {c.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
                  {(c as any).urgent && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                      <span className="text-[10px] font-medium text-destructive">Needs attention</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;
