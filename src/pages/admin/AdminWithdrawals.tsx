import React, { useEffect, useState } from "react";
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
import { CheckCircle, XCircle, BadgeCheck, Pencil, Save, EyeOff, ChevronDown, ChevronUp, Wallet, Clock, TrendingDown, Copy, Landmark, Loader2 } from "lucide-react";
import { WithdrawalCountdown } from "@/components/withdrawal/WithdrawalCountdown";
import { cn } from "@/lib/utils";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

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
  const { theme } = useDashboardTheme();
  const T = TH[theme];
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
    let query = supabase.from("withdrawals").select("id, amount, method, status, requested_at, review_notes, employee_id, upi_id, bank_account_number, bank_ifsc_code, bank_holder_name, is_cleared, order_id").order("requested_at", { ascending: false });
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
      pending: "bg-amber-500/20 text-amber-500 border-amber-500/30",
      approved: "bg-green-500/20 text-green-500 border-green-500/30",
      rejected: "bg-red-500/20 text-red-500 border-red-500/30",
      completed: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    };
    return <Badge variant="outline" className={cn("backdrop-blur-md", map[status] || "")}>{status}</Badge>;
  };

  const filterByStatus = (status: string | null) => status ? withdrawals.filter(w => w.status === status) : withdrawals;

  const totalPending = filterByStatus("pending").length;
  const totalApproved = filterByStatus("approved").length;
  const totalAmount = withdrawals.reduce((s, w) => s + Number(w.amount), 0);

  const WithdrawalTable = ({ items }: { items: Withdrawal[] }) => (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: T.border, background: T.card, backdropFilter: "blur(12px)" }}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: T.border, background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
              <TableHead style={{ color: T.sub }}>Employee</TableHead>
              <TableHead style={{ color: T.sub }}>Order ID</TableHead>
              <TableHead style={{ color: T.sub }}>Amount</TableHead>
              <TableHead style={{ color: T.sub }}>Method</TableHead>
              <TableHead style={{ color: T.sub }}>Bank Details</TableHead>
              <TableHead style={{ color: T.sub }}>Requested</TableHead>
              <TableHead style={{ color: T.sub }}>Countdown</TableHead>
              <TableHead style={{ color: T.sub }}>Status</TableHead>
              <TableHead className="text-right" style={{ color: T.sub }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="py-12 text-center" style={{ color: T.sub }}>No withdrawals found</TableCell></TableRow>
            ) : items.map(w => (
              <React.Fragment key={w.id}>
                <TableRow className={cn("transition-colors", w.is_cleared && "opacity-50")} style={{ borderColor: T.border }}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs" style={{ background: T.nav, color: T.text }}>
                        {(w.employee?.full_name?.[0] || "?")[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: T.text }}>{w.employee?.full_name?.[0] || "—"}</p>
                        <div className="flex items-center gap-1">
                          <p className="text-xs" style={{ color: T.sub }}>{w.employee?.user_code?.[0]}</p>
                          {w.bankVerified ? <BadgeCheck className="h-3 w-3 text-green-400" /> : <span className="rounded bg-amber-500/10 px-1 text-[9px] font-medium text-amber-500">Unverified</span>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {w.order_id ? (
                      <button
                        className="group flex items-center gap-1 font-mono text-xs transition-colors"
                        style={{ color: T.text }}
                        onClick={() => { navigator.clipboard.writeText(w.order_id!); toast.success("Order ID copied"); }}
                        title="Click to copy"
                      >
                        {w.order_id}
                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : <span className="text-xs" style={{ color: T.sub }}>—</span>}
                  </TableCell>
                  <TableCell className="font-bold" style={{ color: T.text }}>₹{Number(w.amount).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px] uppercase" style={{ background: T.nav, color: T.text }}>{w.method}</Badge></TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5 max-w-[160px]">
                      {w.bank_holder_name && <p className="truncate" style={{ color: T.text }}><span style={{ color: T.sub }}>Holder:</span> {w.bank_holder_name}</p>}
                      {w.upi_id && <p className="truncate" style={{ color: T.text }}><span style={{ color: T.sub }}>UPI:</span> {w.upi_id}</p>}
                      {w.bank_account_number && <p style={{ color: T.text }}><span style={{ color: T.sub }}>A/C:</span> {w.bank_account_number}</p>}
                      {w.bank_ifsc_code && <p style={{ color: T.text }}><span style={{ color: T.sub }}>IFSC:</span> {w.bank_ifsc_code}</p>}
                      {!w.upi_id && !w.bank_account_number && <span style={{ color: T.sub }}>—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap" style={{ color: T.sub }}>{new Date(w.requested_at).toLocaleDateString()}</TableCell>
                  <TableCell className="min-w-[140px]">
                    {w.status === "pending" ? <WithdrawalCountdown requestedAt={w.requested_at} /> : <span className="text-xs" style={{ color: T.sub }}>—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {w.is_cleared && <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500 bg-red-500/10">Cleared</Badge>}
                      {statusBadge(w.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(w)} title="Edit" className="h-8 w-8" style={{ color: T.sub }}>
                        {expandedEdit === w.id ? <ChevronUp className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                      </Button>
                      {w.status === "pending" && !w.is_cleared && (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => { setSelected(w); setActionType("approve"); }}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => { setSelected(w); setActionType("reject"); }}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {w.is_cleared ? (
                        <Button size="sm" variant="ghost" onClick={() => handleRestore(w.id)} className="text-xs h-8" style={{ color: T.text }}>Restore</Button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-500/10" title="Clear"><EyeOff className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(16px)" }}>
                            <AlertDialogHeader>
                              <AlertDialogTitle style={{ color: T.text }}>Clear this withdrawal?</AlertDialogTitle>
                              <AlertDialogDescription style={{ color: T.sub }}>Soft-delete. Can be restored later.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel style={{ background: "transparent", borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleClear(w.id)} className="bg-red-500 hover:bg-red-600">Clear</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {expandedEdit === w.id && (
                  <TableRow style={{ borderColor: T.border }}>
                    <TableCell colSpan={9} style={{ background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }} className="p-4">
                      <div className="grid gap-4 sm:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-xs" style={{ color: T.sub }}>Amount (₹)</Label>
                          <Input type="number" value={editForm.amount} onChange={e => setEditForm((f: any) => ({ ...f, amount: e.target.value }))} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs" style={{ color: T.sub }}>Method</Label>
                          <Input value={editForm.method} onChange={e => setEditForm((f: any) => ({ ...f, method: e.target.value }))} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs" style={{ color: T.sub }}>Status</Label>
                          <Select value={editForm.status} onValueChange={v => setEditForm((f: any) => ({ ...f, status: v }))}>
                            <SelectTrigger style={{ background: T.input, borderColor: T.border, color: T.text }}><SelectValue /></SelectTrigger>
                            <SelectContent style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(16px)" }}>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs" style={{ color: T.sub }}>Notes</Label>
                          <Input value={editForm.review_notes} onChange={e => setEditForm((f: any) => ({ ...f, review_notes: e.target.value }))} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                        </div>
                      </div>
                      <Button className="mt-3 bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveEdit}><Save className="mr-1 h-3 w-3" /> Save Changes</Button>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 pb-20 space-y-6" style={{ background: T.bg }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl">
            <Landmark className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Withdrawal Management</h2>
          <p className="mt-2 text-indigo-100">Review and process employee fund withdrawal requests with precision.</p>
        </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 rounded-2xl border p-2 px-4" style={{ borderColor: T.border, background: T.card, backdropFilter: "blur(12px)" }}>
          <Switch checked={showCleared} onCheckedChange={setShowCleared} id="show-cleared-w" />
          <Label htmlFor="show-cleared-w" className="text-sm font-medium" style={{ color: T.text }}>Show Cleared Records</Label>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Pending", value: totalPending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: "Approved", value: totalApproved, icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
          { label: "Total Volume", value: `₹${totalAmount.toLocaleString("en-IN")}`, icon: TrendingDown, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
        ].map(s => (
          <div key={s.label} className={cn("flex items-center gap-4 rounded-2xl border p-5 transition-all hover:scale-[1.02]", s.border)} style={{ background: T.card, backdropFilter: "blur(12px)" }}>
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", s.bg)}>
              <s.icon className={cn("h-6 w-6", s.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: T.text }}>{s.value}</p>
              <p className="text-sm font-medium" style={{ color: T.sub }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4 h-12 gap-2 bg-transparent p-0">
          {["pending", "approved", "rejected", "all"].map(tab => (
            <TabsTrigger 
              key={tab}
              value={tab} 
              className="rounded-xl px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
              style={{ color: T.sub, border: `1px solid ${T.border}`, background: T.card }}
            >
              <span className="capitalize">{tab}</span>
              {tab === "pending" && totalPending > 0 && <span className="ml-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] text-white">{totalPending}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="pending"><WithdrawalTable items={filterByStatus("pending")} /></TabsContent>
        <TabsContent value="approved"><WithdrawalTable items={filterByStatus("approved")} /></TabsContent>
        <TabsContent value="rejected"><WithdrawalTable items={filterByStatus("rejected")} /></TabsContent>
        <TabsContent value="all"><WithdrawalTable items={filterByStatus(null)} /></TabsContent>
      </Tabs>

      <Dialog open={!!selected && !!actionType} onOpenChange={open => { if (!open) { setSelected(null); setActionType(null); setNotes(""); } }}>
        <DialogContent className="max-w-md" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(16px)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: T.text }}>{actionType === "approve" ? "Approve Withdrawal" : "Reject Withdrawal"}</DialogTitle>
            <DialogDescription style={{ color: T.sub }}>
              <span className="font-bold text-indigo-400">₹{Number(selected?.amount).toLocaleString()}</span> via {selected?.method} — {selected?.employee?.full_name?.[0]}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label style={{ color: T.text }}>{actionType === "reject" ? "Rejection Reason" : "Approval Notes (optional)"}</Label>
              <Textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder={actionType === "reject" ? "Specify why this withdrawal is being rejected..." : "Internal notes or confirmation details..."} 
                style={{ background: T.input, borderColor: T.border, color: T.text }}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setActionType(null); setNotes(""); }} style={{ background: "transparent", borderColor: T.border, color: T.text }}>Cancel</Button>
            <Button 
              onClick={handleAction} 
              disabled={processing} 
              className={cn("min-w-[100px]", actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : actionType === "approve" ? "Confirm Approve" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;
