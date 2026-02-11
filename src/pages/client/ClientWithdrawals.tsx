import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, User, Check, X } from "lucide-react";
import { toast } from "sonner";

const withdrawals = [
  { id: "1", employeeName: "Amit Kumar", code: "EMP00001", amount: 5000, method: "UPI", upiId: "amit@upi", date: "2026-02-10", status: "pending" },
  { id: "2", employeeName: "Sneha Reddy", code: "EMP00002", amount: 3000, method: "Bank Transfer", date: "2026-02-08", status: "pending" },
  { id: "3", employeeName: "Ravi Verma", code: "EMP00003", amount: 2000, method: "UPI", upiId: "ravi@upi", date: "2026-02-05", status: "completed" },
];

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  pending: "secondary",
  rejected: "destructive",
};

const ClientWithdrawals = () => {
  const handleAction = (id: string, action: "approve" | "reject") => {
    toast.success(`Withdrawal ${action}d (simulated)`);
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-foreground">Employee Withdrawals</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pending Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {withdrawals.filter((w) => w.status === "pending").map((w) => (
            <div key={w.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <User className="h-3 w-3" /> {w.employeeName}
                  </p>
                  <p className="text-xs text-muted-foreground">{w.code} • {w.method}</p>
                </div>
                <span className="flex items-center text-base font-bold text-foreground">
                  <IndianRupee className="h-4 w-4" />{w.amount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => handleAction(w.id, "approve")}>
                  <Check className="mr-1 h-3 w-3" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => handleAction(w.id, "reject")}>
                  <X className="mr-1 h-3 w-3" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {withdrawals.filter((w) => w.status !== "pending").map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{w.employeeName}</p>
                <p className="text-xs text-muted-foreground">₹{w.amount.toLocaleString("en-IN")} • {w.date}</p>
              </div>
              <Badge variant={statusVariant[w.status]}>{w.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientWithdrawals;
