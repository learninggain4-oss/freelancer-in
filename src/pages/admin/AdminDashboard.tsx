import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, Clock, CheckCircle, Wallet, Fingerprint, Landmark,
  LifeBuoy, Briefcase, Edit, UserCheck, Building2,
  IndianRupee, UserPlus, MessageSquare, Star,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    approvedUsers: 0,
    pendingWithdrawals: 0,
    pendingAadhaar: 0,
    pendingBank: 0,
    pendingRecovery: 0,
    totalJobs: 0,
    pendingProfileEdits: 0,
    totalEmployees: 0,
    totalClients: 0,
    employeeEarnings: 0,
    clientEarnings: 0,
    employeesInvited: 0,
    clientsInvited: 0,
    unreadSupportChats: 0,
    totalReviews: 0,
    avgRating: "0",
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [profiles, withdrawals, aadhaar, bank, recovery, jobs, transactions, referredProfiles, supportMessages, reviews] = await Promise.all([
        supabase.from("profiles").select("id, approval_status, user_type, edit_request_status"),
        supabase.from("withdrawals").select("id").eq("status", "pending"),
        supabase.from("aadhaar_verifications").select("id").eq("status", "pending"),
        supabase.from("bank_verifications").select("id").eq("status", "pending"),
        supabase.from("recovery_requests").select("id").eq("status", "pending"),
        supabase.from("projects").select("id", { count: "exact" }),
        supabase.from("transactions").select("profile_id, amount, type"),
        supabase.from("profiles").select("id, user_type, referred_by").not("referred_by", "is", null),
        supabase.from("messages").select("id, is_read, chat_room_id, chat_rooms!inner(type)").eq("is_read", false).eq("chat_rooms.type", "support"),
        supabase.from("reviews" as any).select("rating"),
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
        pendingApprovals: allProfiles.filter((p) => p.approval_status === "pending").length,
        approvedUsers: allProfiles.filter((p) => p.approval_status === "approved").length,
        pendingWithdrawals: withdrawals.data?.length || 0,
        pendingAadhaar: aadhaar.data?.length || 0,
        pendingBank: bank.data?.length || 0,
        pendingRecovery: recovery.data?.length || 0,
        totalJobs: jobs.count || jobs.data?.length || 0,
        pendingProfileEdits: allProfiles.filter((p) => p.edit_request_status === "requested").length,
        totalEmployees: allProfiles.filter((p) => p.user_type === "employee").length,
        totalClients: allProfiles.filter((p) => p.user_type === "client").length,
        employeeEarnings,
        clientEarnings,
        employeesInvited: referredUsers.filter(p => p.user_type === "employee").length,
        clientsInvited: referredUsers.filter(p => p.user_type === "client").length,
        unreadSupportChats: supportMessages.data?.length || 0,
      });
    };
    fetchStats();
  }, []);

  const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary", path: "/admin/users" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: Clock, color: "text-warning", path: "/admin/users" },
    { label: "Approved Users", value: stats.approvedUsers, icon: CheckCircle, color: "text-accent", path: "/admin/users" },
    { label: "Employees", value: stats.totalEmployees, icon: UserCheck, color: "text-primary", path: "/admin/employees" },
    { label: "Clients", value: stats.totalClients, icon: Building2, color: "text-primary", path: "/admin/clients" },
    { label: "Employee Earnings", value: formatCurrency(stats.employeeEarnings), icon: IndianRupee, color: "text-accent", isCurrency: true, path: "/admin/wallet-management" },
    { label: "Client Earnings", value: formatCurrency(stats.clientEarnings), icon: IndianRupee, color: "text-accent", isCurrency: true, path: "/admin/wallet-management" },
    { label: "Employees Invited", value: stats.employeesInvited, icon: UserPlus, color: "text-primary", path: "/admin/employees" },
    { label: "Clients Invited", value: stats.clientsInvited, icon: UserPlus, color: "text-primary", path: "/admin/clients" },
    { label: "Support Chat Unread", value: stats.unreadSupportChats, icon: MessageSquare, color: "text-destructive", path: "/admin/recovery-requests" },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: Wallet, color: "text-destructive", path: "/admin/withdrawals" },
    { label: "Pending Aadhaar", value: stats.pendingAadhaar, icon: Fingerprint, color: "text-warning", path: "/admin/verifications" },
    { label: "Pending Bank", value: stats.pendingBank, icon: Landmark, color: "text-warning", path: "/admin/bank-verifications" },
    { label: "Pending Recovery", value: stats.pendingRecovery, icon: LifeBuoy, color: "text-destructive", path: "/admin/recovery-requests" },
    { label: "Total Jobs", value: stats.totalJobs, icon: Briefcase, color: "text-accent", path: "/admin/jobs" },
    { label: "Profile Edits", value: stats.pendingProfileEdits, icon: Edit, color: "text-warning", path: "/admin/profile-edits" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card
            key={c.label}
            className="cursor-pointer transition-shadow hover:shadow-md hover:border-primary/30"
            onClick={() => navigate(c.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className={`font-bold text-foreground ${(c as any).isCurrency ? "text-2xl" : "text-3xl"}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
