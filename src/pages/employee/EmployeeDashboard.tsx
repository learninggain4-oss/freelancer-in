import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Briefcase,
  ArrowDownToLine,
  TrendingUp,
  Clock,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const recentTransactions = [
    { id: 1, type: "credit", description: "Project Payment - Web Design", amount: 5000, date: "2026-02-10", status: "completed" },
    { id: 2, type: "debit", description: "Withdrawal to Bank", amount: 3000, date: "2026-02-09", status: "completed" },
    { id: 3, type: "credit", description: "Project Payment - Logo Design", amount: 2500, date: "2026-02-08", status: "pending" },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {profile?.full_name ?? "Employee"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Code: <span className="font-mono font-medium text-foreground">{profile?.user_code ?? "—"}</span>
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-xs">Available</span>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">
              <IndianRupee className="inline h-4 w-4" />
              {(profile?.available_balance ?? 0).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">On Hold</span>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">
              <IndianRupee className="inline h-4 w-4" />
              {(profile?.hold_balance ?? 0).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 py-4"
          onClick={() => navigate("/employee/projects")}
        >
          <Briefcase className="h-5 w-5 text-primary" />
          <span className="text-xs">View Projects</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 py-4"
          onClick={() => navigate("/employee/wallet")}
        >
          <ArrowDownToLine className="h-5 w-5 text-accent" />
          <span className="text-xs">Withdraw Funds</span>
        </Button>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {tx.description}
                </p>
                <p className="text-xs text-muted-foreground">{tx.date}</p>
              </div>
              <div className="ml-3 flex flex-col items-end gap-1">
                <span
                  className={`text-sm font-semibold ${
                    tx.type === "credit" ? "text-accent" : "text-destructive"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                </span>
                <Badge
                  variant={tx.status === "completed" ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}
          {recentTransactions.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No transactions yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
