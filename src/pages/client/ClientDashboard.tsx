import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Briefcase,
  Plus,
  Users,
  IndianRupee,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const recentRequests = [
  { id: 1, employeeName: "Amit Kumar", project: "E-Commerce Site", status: "pending" },
  { id: 2, employeeName: "Sneha Reddy", project: "Logo Design", status: "approved" },
];

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
};

const ClientDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {profile?.full_name ?? "Client"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Code: <span className="font-mono font-medium text-foreground">{profile?.user_code ?? "—"}</span>
        </p>
      </div>

      {/* Balance & Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-xs">Balance</span>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">
              <IndianRupee className="inline h-4 w-4" />
              {(profile?.available_balance ?? 0).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span className="text-xs">Active Projects</span>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">0</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate("/client/projects/create")}>
          <Plus className="h-5 w-5 text-primary" />
          <span className="text-xs">New Project</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate("/client/wallet")}>
          <Wallet className="h-5 w-5 text-accent" />
          <span className="text-xs">Add Money</span>
        </Button>
      </div>

      {/* Recent Employee Requests */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Employee Requests
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/client/projects")}>
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentRequests.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{r.employeeName}</p>
                <p className="text-xs text-muted-foreground">{r.project}</p>
              </div>
              <Badge className={statusColor[r.status]}>{r.status}</Badge>
            </div>
          ))}
          {recentRequests.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No requests yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboard;
