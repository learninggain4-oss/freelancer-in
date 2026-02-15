import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, Clock, CheckCircle, Wallet, Fingerprint, Landmark,
  LifeBuoy, Briefcase, Edit, UserCheck, Building2,
} from "lucide-react";

const AdminDashboard = () => {
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
  });

  useEffect(() => {
    const fetch = async () => {
      const [profiles, withdrawals, aadhaar, bank, recovery, jobs] = await Promise.all([
        supabase.from("profiles").select("id, approval_status, user_type, edit_request_status"),
        supabase.from("withdrawals").select("id").eq("status", "pending"),
        supabase.from("aadhaar_verifications").select("id").eq("status", "pending"),
        supabase.from("bank_verifications").select("id").eq("status", "pending"),
        supabase.from("recovery_requests").select("id").eq("status", "pending"),
        supabase.from("projects").select("id", { count: "exact" }),
      ]);

      const allProfiles = profiles.data || [];
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
      });
    };
    fetch();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: Clock, color: "text-warning" },
    { label: "Approved Users", value: stats.approvedUsers, icon: CheckCircle, color: "text-accent" },
    { label: "Employees", value: stats.totalEmployees, icon: UserCheck, color: "text-primary" },
    { label: "Clients", value: stats.totalClients, icon: Building2, color: "text-primary" },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: Wallet, color: "text-destructive" },
    { label: "Pending Aadhaar", value: stats.pendingAadhaar, icon: Fingerprint, color: "text-warning" },
    { label: "Pending Bank", value: stats.pendingBank, icon: Landmark, color: "text-warning" },
    { label: "Pending Recovery", value: stats.pendingRecovery, icon: LifeBuoy, color: "text-destructive" },
    { label: "Total Jobs", value: stats.totalJobs, icon: Briefcase, color: "text-accent" },
    { label: "Profile Edits", value: stats.pendingProfileEdits, icon: Edit, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
