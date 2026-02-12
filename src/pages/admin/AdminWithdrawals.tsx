import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  status: string;
  requested_at: string;
  review_notes: string | null;
  employee_id: string;
  employee?: { full_name: string[]; user_code: string[]; email: string };
};

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchWithdrawals = async () => {
    setLoading(true);
    // Fetch withdrawals and employee info separately since banking fields are restricted
    const { data: wData } = await supabase
      .from("withdrawals")
      .select("id, amount, method, status, requested_at, review_notes, employee_id")
      .order("requested_at", { ascending: false });

    if (wData && wData.length > 0) {
      const employeeIds = [...new Set(wData.map((w) => w.employee_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, email")
        .in("id", employeeIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      setWithdrawals(
        wData.map((w) => ({
          ...w,
          employee: profileMap.get(w.employee_id) as any,
        }))
      );
    } else {
      setWithdrawals([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleAction = async () => {
    if (!selected || !actionType) return;
    setProcessing(true);

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id")
      .single();

    const status = actionType === "approve" ? "approved" : "rejected";
    const { error } = await supabase
      .from("withdrawals")
      .update({
        status: status as any,
        review_notes: notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminProfile?.id || null,
      })
      .eq("id", selected.id);

    if (error) {
      toast.error("Failed to update withdrawal");
    } else {
      toast.success(`Withdrawal ${status}`);
      fetchWithdrawals();
    }
    setProcessing(false);
    setSelected(null);
    setActionType(null);
    setNotes("");
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-warning/15 text-warning border-warning/30",
      approved: "bg-accent/15 text-accent border-accent/30",
      rejected: "bg-destructive/15 text-destructive border-destructive/30",
      completed: "bg-primary/15 text-primary border-primary/30",
    };
    return (
      <Badge variant="outline" className={map[status] || ""}>
        {status}
      </Badge>
    );
  };

  const filterByStatus = (status: string | null) =>
    status ? withdrawals.filter((w) => w.status === status) : withdrawals;

  const WithdrawalTable = ({ items }: { items: Withdrawal[] }) => (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No withdrawals found
              </TableCell>
            </TableRow>
          ) : (
            items.map((w) => (
              <TableRow key={w.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{w.employee?.full_name?.[0] || "—"}</p>
                    <p className="text-xs text-muted-foreground">{w.employee?.user_code?.[0]}</p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">₹{Number(w.amount).toLocaleString()}</TableCell>
                <TableCell className="uppercase text-xs">{w.method}</TableCell>
                <TableCell className="text-sm">
                  {new Date(w.requested_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{statusBadge(w.status)}</TableCell>
                <TableCell className="text-right">
                  {w.status === "pending" && (
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-accent hover:text-accent"
                        onClick={() => { setSelected(w); setActionType("approve"); }}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { setSelected(w); setActionType("reject"); }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Withdrawal Management</h2>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({filterByStatus("pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <WithdrawalTable items={filterByStatus("pending")} />
        </TabsContent>
        <TabsContent value="approved">
          <WithdrawalTable items={filterByStatus("approved")} />
        </TabsContent>
        <TabsContent value="rejected">
          <WithdrawalTable items={filterByStatus("rejected")} />
        </TabsContent>
        <TabsContent value="all">
          <WithdrawalTable items={filterByStatus(null)} />
        </TabsContent>
      </Tabs>

      {/* Approve / Reject Dialog */}
      <Dialog
        open={!!selected && !!actionType}
        onOpenChange={(open) => {
          if (!open) { setSelected(null); setActionType(null); setNotes(""); }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Withdrawal" : "Reject Withdrawal"}
            </DialogTitle>
            <DialogDescription>
              ₹{Number(selected?.amount).toLocaleString()} via {selected?.method} — {selected?.employee?.full_name?.[0]}
            </DialogDescription>
          </DialogHeader>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Notes (optional)</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this decision..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setActionType(null); setNotes(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant={actionType === "approve" ? "default" : "destructive"}
            >
              {processing ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;
