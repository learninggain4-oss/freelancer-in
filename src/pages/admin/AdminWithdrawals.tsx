import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, XCircle, BadgeCheck, Pencil, Save, EyeOff, ChevronDown, ChevronUp, Wallet, Clock, TrendingDown, Copy } from "lucide-react";
import { WithdrawalCountdown } from "@/components/withdrawal/WithdrawalCountdown";
import { cn } from "@/lib/utils";

type Withdrawal = {
  id: string; amount: number; method: string; status: string;
  requested_at: string; review_notes: string | null; employee_id: string;
  upi_id: string | null; bank_account_number: string | null;
  bank_ifsc_code: string | null; bank_holder_name: string | null;
  is_cleared?: boolean; order_id?: string | null;
  employee?: { full_name: string[]; user_code: string[]; email: string };
  bankVerified?: boolean;
};

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showCleared, setShowCleared] = useState(false);
  const [expandedEdit, setExpandedEdit] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchWithdrawals = async () => {
    setLoading(true);
    let query = supabase.from("withdrawals").select("id, amount, method, status, requested_at, review_notes, employee_id, upi_id, bank_account_number, bank_ifsc_code, bank_holder_name, is_cleared").order("requested_at", { ascending: false });
    if (!showCleared) query = query.eq("is_cleared", false);
    const { data: wData } = await query;

    if (wData && wData.length > 0) {
      const employeeIds = [...new Set(wData.map(w => w.employee_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, user_code, email").in("id", employeeIds);
      const { data: bankVerifs } = await supabase.from("bank_verifications").select("profile_id, status").in("profile_id", employeeIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const bankVerifMap = new Map((bankVerifs || []).map(b => [b.profile_id, b.status === "verified"]));
      setWithdrawals(wData.map(w => ({ ...w, employee: profileMap.get(w.employee_id) as any, bankVerified: bankVerifMap.get(w.employee_id) ?? false })));
    } else {
      setWithdrawals([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchWithdrawals(); }, [showCleared]);

  const handleAction = async () => {
    if (!selected || !actionType) return;
    setProcessing(true);
    const status = actionType === "approve" ? "approved" : "rejected";
    const res = await supabase.functions.invoke("wallet-operations", {
      body: { action: "admin_process_withdrawal", withdrawal_id: selected.id, status, reject_reason: actionType === "reject" ? notes : undefined, review_notes: actionType === "approve" ? notes : undefined },
    });
    if (res.error || res.data?.error) toast.error(res.data?.error || "Failed");
    else { toast.success(`Withdrawal ${status}`); fetchWithdrawals(); }
    setProcessing(false); setSelected(null); setActionType(null); setNotes("");
  };

  const handleClear = async (id: string) => {
    const { error } = await supabase.from("withdrawals").update({ is_cleared: true }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Cleared"); fetchWithdrawals(); }
  };

  const handleRestore = async (id: string) => {
    const { error } = await supabase.from("withdrawals").update({ is_cleared: false }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Restored"); fetchWithdrawals(); }
  };

  const handleSaveEdit = async () => {
    if (!expandedEdit) return;
    const { error } = await supabase.from("withdrawals").update({ amount: Number(editForm.amount), status: editForm.status as any, review_notes: editForm.review_notes || null, method: editForm.method }).eq("id", expandedEdit);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); setExpandedEdit(null); fetchWithdrawals(); }
  };

  const startEdit = (w: Withdrawal) => {
    if (expandedEdit === w.id) { setExpandedEdit(null); return; }
    setEditForm({ amount: w.amount, status: w.status, review_notes: w.review_notes || "", method: w.method });
    setExpandedEdit(w.id);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-warning/15 text-warning border-warning/30",
      approved: "bg-accent/15 text-accent border-accent/30",
      rejected: "bg-destructive/15 text-destructive border-destructive/30",
      completed: "bg-primary/15 text-primary border-primary/30",
    };
    return <Badge variant="outline" className={map[status] || ""}>{status}</Badge>;
  };

  const filterByStatus = (status: string | null) => status ? withdrawals.filter(w => w.status === status) : withdrawals;

  const totalPending = filterByStatus("pending").length;
  const totalApproved = filterByStatus("approved").length;
  const totalAmount = withdrawals.reduce((s, w) => s + Number(w.amount), 0);

  const WithdrawalTable = ({ items }: { items: Withdrawal[] }) => (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>Employee</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Bank Details</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Countdown</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No withdrawals found</TableCell></TableRow>
          ) : items.map(w => (
            <>
              <TableRow key={w.id} className={cn("transition-colors", w.is_cleared && "opacity-50")}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {(w.employee?.full_name?.[0] || "?")[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{w.employee?.full_name?.[0] || "—"}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground">{w.employee?.user_code?.[0]}</p>
                        {w.bankVerified ? <BadgeCheck className="h-3 w-3 text-accent" /> : <span className="rounded bg-warning/10 px-1 text-[9px] font-medium text-warning">Unverified</span>}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-foreground">₹{Number(w.amount).toLocaleString()}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px] uppercase">{w.method}</Badge></TableCell>
                <TableCell>
                  <div className="text-xs space-y-0.5 max-w-[160px]">
                    {w.bank_holder_name && <p className="truncate"><span className="text-muted-foreground">Holder:</span> {w.bank_holder_name}</p>}
                    {w.upi_id && <p className="truncate"><span className="text-muted-foreground">UPI:</span> {w.upi_id}</p>}
                    {w.bank_account_number && <p><span className="text-muted-foreground">A/C:</span> {w.bank_account_number}</p>}
                    {w.bank_ifsc_code && <p><span className="text-muted-foreground">IFSC:</span> {w.bank_ifsc_code}</p>}
                    {!w.upi_id && !w.bank_account_number && <span className="text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(w.requested_at).toLocaleDateString()}</TableCell>
                <TableCell className="min-w-[140px]">
                  {w.status === "pending" ? <WithdrawalCountdown requestedAt={w.requested_at} /> : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {w.is_cleared && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
                    {statusBadge(w.status)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(w)} title="Edit" className="h-8 w-8">
                      {expandedEdit === w.id ? <ChevronUp className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </Button>
                    {w.status === "pending" && !w.is_cleared && (
                      <>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-accent hover:text-accent" onClick={() => { setSelected(w); setActionType("approve"); }}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setSelected(w); setActionType("reject"); }}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {w.is_cleared ? (
                      <Button size="sm" variant="ghost" onClick={() => handleRestore(w.id)} className="text-xs h-8">Restore</Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Clear"><EyeOff className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear this withdrawal?</AlertDialogTitle>
                            <AlertDialogDescription>Soft-delete. Can be restored later.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleClear(w.id)}>Clear</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              {expandedEdit === w.id && (
                <TableRow>
                  <TableCell colSpan={8} className="bg-muted/20 p-4">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="space-y-1"><Label className="text-xs">Amount (₹)</Label><Input type="number" value={editForm.amount} onChange={e => setEditForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
                      <div className="space-y-1"><Label className="text-xs">Method</Label><Input value={editForm.method} onChange={e => setEditForm((f: any) => ({ ...f, method: e.target.value }))} /></div>
                      <div className="space-y-1"><Label className="text-xs">Status</Label>
                        <Select value={editForm.status} onValueChange={v => setEditForm((f: any) => ({ ...f, status: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1"><Label className="text-xs">Notes</Label><Input value={editForm.review_notes} onChange={e => setEditForm((f: any) => ({ ...f, review_notes: e.target.value }))} /></div>
                    </div>
                    <Button className="mt-3" onClick={handleSaveEdit}><Save className="mr-1 h-3 w-3" /> Save</Button>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Withdrawal Management</h2>
          <p className="text-sm text-muted-foreground">Review and process employee withdrawals</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showCleared} onCheckedChange={setShowCleared} id="show-cleared-w" />
          <Label htmlFor="show-cleared-w" className="text-xs text-muted-foreground">Show cleared</Label>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: totalPending, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
          { label: "Approved", value: totalApproved, icon: CheckCircle, color: "text-accent", bg: "bg-accent/10" },
          { label: "Total Volume", value: `₹${totalAmount.toLocaleString("en-IN")}`, icon: TrendingDown, color: "text-primary", bg: "bg-primary/10" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", s.bg)}>
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="pending">Pending ({filterByStatus("pending").length})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="pending"><WithdrawalTable items={filterByStatus("pending")} /></TabsContent>
        <TabsContent value="approved"><WithdrawalTable items={filterByStatus("approved")} /></TabsContent>
        <TabsContent value="rejected"><WithdrawalTable items={filterByStatus("rejected")} /></TabsContent>
        <TabsContent value="all"><WithdrawalTable items={filterByStatus(null)} /></TabsContent>
      </Tabs>

      <Dialog open={!!selected && !!actionType} onOpenChange={open => { if (!open) { setSelected(null); setActionType(null); setNotes(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{actionType === "approve" ? "Approve Withdrawal" : "Reject Withdrawal"}</DialogTitle>
            <DialogDescription>₹{Number(selected?.amount).toLocaleString()} via {selected?.method} — {selected?.employee?.full_name?.[0]}</DialogDescription>
          </DialogHeader>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">{actionType === "reject" ? "Rejection reason" : "Notes (optional)"}</p>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={actionType === "reject" ? "Enter reason..." : "Notes..."} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setActionType(null); setNotes(""); }}>Cancel</Button>
            <Button onClick={handleAction} disabled={processing} variant={actionType === "approve" ? "default" : "destructive"}>
              {processing ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;
