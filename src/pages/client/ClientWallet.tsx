import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Clock,
  IndianRupee,
  PlusCircle,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

const transactions = [
  { id: 1, type: "credit", description: "Added to Wallet", amount: 10000, date: "2026-02-10", status: "completed" },
  { id: 2, type: "debit", description: "Project Funding - E-Commerce", amount: 25000, date: "2026-02-08", status: "completed" },
  { id: 3, type: "debit", description: "Employee Withdrawal Approved", amount: 5000, date: "2026-02-06", status: "completed" },
];

const ClientWallet = () => {
  const { profile } = useAuth();
  const [addAmount, setAddAmount] = useState("");

  const handleAddMoney = () => {
    const amount = Number(addAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    toast.success(`₹${amount.toLocaleString("en-IN")} added to wallet (simulated)`);
    setAddAmount("");
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-foreground">Wallet</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" /><span className="text-xs">Available</span>
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
              <Clock className="h-4 w-4" /><span className="text-xs">On Hold</span>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">
              <IndianRupee className="inline h-4 w-4" />
              {(profile?.hold_balance ?? 0).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Money */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusCircle className="h-4 w-4" /> Add Money
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input type="number" placeholder="Enter amount" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleAddMoney}>
            <ArrowUpRight className="mr-2 h-4 w-4" /> Add to Wallet
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{tx.date}</p>
              </div>
              <span className={`ml-3 text-sm font-semibold ${tx.type === "credit" ? "text-accent" : "text-destructive"}`}>
                {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientWallet;
