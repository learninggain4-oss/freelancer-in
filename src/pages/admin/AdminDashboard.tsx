import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, Wallet } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    approvedUsers: 0,
    pendingWithdrawals: 0,
  });

  useEffect(() => {
    const fetch = async () => {
      const [profiles, withdrawals] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, approval_status", { count: "exact" }),
        supabase
          .from("withdrawals")
          .select("id, status", { count: "exact" })
          .eq("status", "pending"),
      ]);

      const allProfiles = profiles.data || [];
      setStats({
        totalUsers: allProfiles.length,
        pendingApprovals: allProfiles.filter((p) => p.approval_status === "pending").length,
        approvedUsers: allProfiles.filter((p) => p.approval_status === "approved").length,
        pendingWithdrawals: withdrawals.data?.length || 0,
      });
    };
    fetch();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: Clock, color: "text-warning" },
    { label: "Approved Users", value: stats.approvedUsers, icon: CheckCircle, color: "text-accent" },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: Wallet, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
