import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Wallet,
  Clock,
  IndianRupee,
  ArrowDownToLine,
  Building2,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

const withdrawalHistory = [
  { id: 1, amount: 3000, method: "UPI", date: "2026-02-09", status: "completed" },
  { id: 2, amount: 5000, method: "Bank Transfer", date: "2026-02-05", status: "pending" },
  { id: 3, amount: 2000, method: "UPI", date: "2026-01-28", status: "rejected" },
];

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  pending: "secondary",
  rejected: "destructive",
};

const EmployeeWallet = () => {
  const { profile } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState(profile?.upi_id ?? "");

  const handleWithdraw = () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > (profile?.available_balance ?? 0)) {
      toast.error("Insufficient balance");
      return;
    }
    toast.success(`Withdrawal request of ₹${amount.toLocaleString("en-IN")} submitted`);
    setWithdrawAmount("");
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-foreground">Wallet</h1>

      {/* Balance Overview */}
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

      {/* Withdrawal Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownToLine className="h-4 w-4" />
            Request Withdrawal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>UPI ID</Label>
            <Input
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3" />
              <span>Bank: {profile?.bank_name ?? "Not set"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3 w-3" />
              <span>A/C: {profile?.bank_account_number ? `****${profile.bank_account_number.slice(-4)}` : "Not set"}</span>
            </div>
          </div>
          <Button className="w-full" onClick={handleWithdraw}>
            Submit Withdrawal
          </Button>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {withdrawalHistory.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">₹{w.amount.toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground">{w.method} • {w.date}</p>
              </div>
              <Badge variant={statusVariant[w.status]}>{w.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeWallet;
