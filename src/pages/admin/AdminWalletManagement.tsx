import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search, Wallet, IndianRupee, Clock, PlusCircle, MinusCircle,
  Lock, ArrowRightLeft, Pencil, Trash2, User, ChevronLeft, ChevronRight, EyeOff,
} from "lucide-react";

type Profile = {
  id: string;
  full_name: string[];
  user_code: string[];
  email: string;
  user_type: string;
  available_balance: number;
  hold_balance: number;
  wallet_number: string | null;
  wallet_active: boolean;
};

type Transaction = {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  reference_id: string | null;
  is_cleared: boolean;
};

type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  status: string;
  requested_at: string;
  review_notes: string | null;
  upi_id: string | null;
  bank_account_number: string | null;
  bank_ifsc_code: string | null;
  bank_holder_name: string | null;
  is_cleared: boolean;
};


const AdminWalletManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Action dialogs
  const [actionDialog, setActionDialog] = useState<{
    type: "add" | "deduct" | "hold" | "transfer" | null;
  }>({ type: null });
  const [actionAmount, setActionAmount] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [transferTarget, setTransferTarget] = useState("");
  const [transferTargetResults, setTransferTargetResults] = useState<Profile[]>([]);
  const [selectedTransferTarget, setSelectedTransferTarget] = useState<Profile | null>(null);

  // Transaction edit/delete
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editTxAmount, setEditTxAmount] = useState("");
  const [editTxDesc, setEditTxDesc] = useState("");
  const [editTxType, setEditTxType] = useState("");
  const [editTxAdjustBalance, setEditTxAdjustBalance] = useState(true);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [deleteTxAdjustBalance, setDeleteTxAdjustBalance] = useState(true);

  // Withdrawal edit/delete
  const [editW, setEditW] = useState<Withdrawal | null>(null);
  const [editWAmount, setEditWAmount] = useState("");
  const [editWStatus, setEditWStatus] = useState("");
  const [editWNotes, setEditWNotes] = useState("");
  const [editWAdjustBalance, setEditWAdjustBalance] = useState(true);
  const [deleteW, setDeleteW] = useState<Withdrawal | null>(null);
  const [deleteWAdjustBalance, setDeleteWAdjustBalance] = useState(true);

  // Pagination
  const TX_PAGE_SIZE = 15;
  const W_PAGE_SIZE = 15;
  const [txPage, setTxPage] = useState(1);
  const [wPage, setWPage] = useState(1);
  const [showClearedTx, setShowClearedTx] = useState(false);
  const [showClearedW, setShowClearedW] = useState(false);

  const [userTab, setUserTab] = useState<"employee" | "client">("employee");

  // Fetch all users
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-wallet-all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, email, user_type, available_balance, hold_balance")
        .in("user_type", ["employee", "client"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !selectedUser,
  });

  const filteredUsers = allUsers.filter((u) => {
    if (u.user_type !== userTab) return false;
    if (search.length < 2) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name?.[0] || "").toLowerCase().includes(q) ||
      (u.user_code?.[0] || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  // Fresh user data
  const { data: freshUser } = useQuery({
    queryKey: ["admin-wallet-user", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, email, user_type, available_balance, hold_balance")
        .eq("id", selectedUser.id)
        .single();
      return data as Profile | null;
    },
    enabled: !!selectedUser?.id,
    refetchInterval: 5000,
  });

  const displayUser = freshUser || selectedUser;

  // Transactions
  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["admin-wallet-transactions", selectedUser?.id, showClearedTx],
    queryFn: async () => {
      if (!selectedUser?.id) return [];
      let q = supabase
        .from("transactions")
        .select("*")
        .eq("profile_id", selectedUser.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!showClearedTx) q = q.eq("is_cleared", false);
      const { data } = await q;
      return (data || []) as Transaction[];
    },
    enabled: !!selectedUser?.id,
  });

  // Withdrawals
  const { data: withdrawals = [], isLoading: loadingW } = useQuery({
    queryKey: ["admin-wallet-withdrawals", selectedUser?.id, showClearedW],
    queryFn: async () => {
      if (!selectedUser?.id) return [];
      let q = supabase
        .from("withdrawals")
        .select("*")
        .eq("employee_id", selectedUser.id)
        .order("requested_at", { ascending: false })
        .limit(50);
      if (!showClearedW) q = q.eq("is_cleared", false);
      const { data } = await q;
      return (data || []) as Withdrawal[];
    },
    enabled: !!selectedUser?.id,
  });


  const walletAction = useMutation({
    mutationFn: async (params: {
      action: string;
      target_profile_id: string;
      amount: number;
      description?: string;
      transfer_to_profile_id?: string;
    }) => {
      const res = await supabase.functions.invoke("wallet-operations", {
        body: params,
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Wallet updated successfully");
      invalidateAll();
      closeActionDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const txMutation = useMutation({
    mutationFn: async (params: {
      action: string;
      transaction_id: string;
      target_profile_id: string;
      adjust_balance: boolean;
      amount?: number;
      description?: string;
      type?: string;
    }) => {
      const res = await supabase.functions.invoke("wallet-operations", {
        body: params,
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.action === "admin_edit_transaction" ? "Transaction updated" : "Transaction deleted");
      invalidateAll();
      setEditTx(null);
      setDeleteTx(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const wMutation = useMutation({
    mutationFn: async (params: {
      action: string;
      withdrawal_id: string;
      target_profile_id: string;
      adjust_balance: boolean;
      amount?: number;
      status?: string;
      review_notes?: string;
    }) => {
      const res = await supabase.functions.invoke("wallet-operations", {
        body: params,
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.action === "admin_edit_withdrawal" ? "Withdrawal updated" : "Withdrawal deleted");
      invalidateAll();
      setEditW(null);
      setDeleteW(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const clearTxMutation = useMutation({
    mutationFn: async ({ id, clear }: { id: string; clear: boolean }) => {
      const { error } = await supabase.from("transactions").update({ is_cleared: clear }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => { toast.success(vars.clear ? "Transaction cleared" : "Transaction restored"); invalidateAll(); },
    onError: (e: any) => toast.error(e.message),
  });

  const clearWMutation = useMutation({
    mutationFn: async ({ id, clear }: { id: string; clear: boolean }) => {
      const { error } = await supabase.from("withdrawals").update({ is_cleared: clear }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => { toast.success(vars.clear ? "Withdrawal cleared" : "Withdrawal restored"); invalidateAll(); },
    onError: (e: any) => toast.error(e.message),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-wallet-user"] });
    queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["admin-wallet-withdrawals"] });
    queryClient.invalidateQueries({ queryKey: ["admin-wallet-audit-logs"] });
  };

  const closeActionDialog = () => {
    setActionDialog({ type: null });
    setActionAmount("");
    setActionDescription("");
    setTransferTarget("");
    setTransferTargetResults([]);
    setSelectedTransferTarget(null);
  };

  const searchTransferTarget = async (q: string) => {
    setTransferTarget(q);
    if (q.length < 2) { setTransferTargetResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, user_code, email, user_type, available_balance, hold_balance")
      .or(`email.ilike.%${q}%,full_name.cs.{${q}}`)
      .neq("id", selectedUser?.id || "")
      .limit(5);
    setTransferTargetResults((data || []) as Profile[]);
  };

  const handleWalletAction = () => {
    if (!displayUser) return;
    const amt = Number(actionAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }

    const actionMap: Record<string, string> = {
      add: "admin_wallet_add",
      deduct: "admin_wallet_deduct",
      hold: "admin_wallet_hold",
      transfer: "admin_wallet_transfer",
    };

    walletAction.mutate({
      action: actionMap[actionDialog.type!],
      target_profile_id: displayUser.id,
      amount: amt,
      description: actionDescription || undefined,
      transfer_to_profile_id: selectedTransferTarget?.id,
    });
  };

  const txTypeBadge: Record<string, string> = {
    credit: "bg-accent/15 text-accent border-accent/30",
    debit: "bg-destructive/15 text-destructive border-destructive/30",
    hold: "bg-warning/15 text-warning border-warning/30",
    release: "bg-primary/15 text-primary border-primary/30",
  };

  const wStatusBadge: Record<string, string> = {
    pending: "bg-warning/15 text-warning border-warning/30",
    approved: "bg-accent/15 text-accent border-accent/30",
    rejected: "bg-destructive/15 text-destructive border-destructive/30",
    completed: "bg-primary/15 text-primary border-primary/30",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Wallet Management</h2>

      {/* User Search */}
      {!selectedUser ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" /> Select User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={userTab} onValueChange={(v) => setUserTab(v as "employee" | "client")}>
              <TabsList className="w-full">
                <TabsTrigger value="employee" className="flex-1">Employees</TabsTrigger>
                <TabsTrigger value="client" className="flex-1">Clients</TabsTrigger>
              </TabsList>
            </Tabs>
            <Input
              placeholder="Filter by name, email, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loadingUsers && <Skeleton className="h-10 w-full" />}
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                  onClick={() => { setSelectedUser(u); setSearch(""); setTxPage(1); setWPage(1); }}
                >
                  <div>
                    <p className="font-medium text-foreground">{u.full_name?.[0]}</p>
                    <p className="text-xs text-muted-foreground">{u.user_code?.[0]} · {u.email}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-foreground">₹{Number(u.available_balance).toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">Hold: ₹{Number(u.hold_balance).toLocaleString("en-IN")}</p>
                  </div>
                </button>
              ))}
              {!loadingUsers && filteredUsers.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No {userTab}s found</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Selected User Header */}
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{displayUser?.full_name?.[0]}</p>
                  <p className="text-xs text-muted-foreground">
                    {displayUser?.user_code?.[0]} · {displayUser?.email} ·{" "}
                    <Badge variant="outline" className="text-[10px]">{displayUser?.user_type}</Badge>
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                Change User
              </Button>
            </CardContent>
          </Card>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="h-4 w-4" /><span className="text-xs">Available</span>
                </div>
                <p className="mt-1 text-xl font-bold text-foreground">
                  <IndianRupee className="inline h-4 w-4" />
                  {Number(displayUser?.available_balance ?? 0).toLocaleString("en-IN")}
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
                  {Number(displayUser?.hold_balance ?? 0).toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button variant="outline" className="gap-2" onClick={() => setActionDialog({ type: "add" })}>
              <PlusCircle className="h-4 w-4 text-accent" /> Add Money
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setActionDialog({ type: "deduct" })}>
              <MinusCircle className="h-4 w-4 text-destructive" /> Deduct
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setActionDialog({ type: "hold" })}>
              <Lock className="h-4 w-4 text-warning" /> Hold Amount
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setActionDialog({ type: "transfer" })}>
              <ArrowRightLeft className="h-4 w-4 text-primary" /> Transfer
            </Button>
          </div>

          {/* Tabs: Transactions & Withdrawals */}
          <Tabs defaultValue="transactions">
            <TabsList>
              <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions">
              <div className="mb-3 flex items-center gap-2">
                <Switch checked={showClearedTx} onCheckedChange={setShowClearedTx} id="show-cleared-tx" />
                <Label htmlFor="show-cleared-tx" className="text-xs text-muted-foreground">Show cleared</Label>
              </div>
              {(() => {
                const totalTxPages = Math.max(1, Math.ceil(transactions.length / TX_PAGE_SIZE));
                const safeTxPage = Math.min(txPage, totalTxPages);
                const paginatedTx = transactions.slice((safeTxPage - 1) * TX_PAGE_SIZE, safeTxPage * TX_PAGE_SIZE);
                return (
                  <div className="space-y-3">
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingTx ? (
                            <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                          ) : paginatedTx.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No transactions</TableCell></TableRow>
                          ) : paginatedTx.map((tx) => (
                            <TableRow key={tx.id} className={tx.is_cleared ? "opacity-50" : ""}>
                              <TableCell>
                                <Badge variant="outline" className={txTypeBadge[tx.type] || ""}>{tx.type}</Badge>
                                {tx.is_cleared && <Badge variant="outline" className="ml-1 text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
                              </TableCell>
                              <TableCell className="font-semibold">₹{Number(tx.amount).toLocaleString("en-IN")}</TableCell>
                              <TableCell className="max-w-[200px] truncate text-sm">{tx.description}</TableCell>
                              <TableCell className="text-sm">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button size="icon" variant="ghost" onClick={() => {
                                    setEditTx(tx);
                                    setEditTxAmount(String(tx.amount));
                                    setEditTxDesc(tx.description);
                                    setEditTxType(tx.type);
                                    setEditTxAdjustBalance(true);
                                  }}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  {tx.is_cleared ? (
                                    <Button size="icon" variant="ghost" onClick={() => clearTxMutation.mutate({ id: tx.id, clear: false })}>
                                      <EyeOff className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <Button size="icon" variant="ghost" className="text-warning" onClick={() => clearTxMutation.mutate({ id: tx.id, clear: true })} title="Clear">
                                      <EyeOff className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => {
                                    setDeleteTx(tx);
                                    setDeleteTxAdjustBalance(true);
                                  }}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {transactions.length > TX_PAGE_SIZE && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Showing {(safeTxPage - 1) * TX_PAGE_SIZE + 1}–{Math.min(safeTxPage * TX_PAGE_SIZE, transactions.length)} of {transactions.length}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-8 w-8" disabled={safeTxPage <= 1} onClick={() => setTxPage(safeTxPage - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          {Array.from({ length: totalTxPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalTxPages || Math.abs(p - safeTxPage) <= 1)
                            .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                              acc.push(p);
                              return acc;
                            }, [])
                            .map((p, i) =>
                              p === "ellipsis" ? (
                                <span key={`e${i}`} className="px-1 text-sm text-muted-foreground">…</span>
                              ) : (
                                <Button key={p} size="icon" variant={p === safeTxPage ? "default" : "outline"} className="h-8 w-8 text-xs" onClick={() => setTxPage(p)}>
                                  {p}
                                </Button>
                              )
                            )}
                          <Button size="icon" variant="outline" className="h-8 w-8" disabled={safeTxPage >= totalTxPages} onClick={() => setTxPage(safeTxPage + 1)}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="withdrawals">
              <div className="mb-3 flex items-center gap-2">
                <Switch checked={showClearedW} onCheckedChange={setShowClearedW} id="show-cleared-w" />
                <Label htmlFor="show-cleared-w" className="text-xs text-muted-foreground">Show cleared</Label>
              </div>
              {(() => {
                const totalWPages = Math.max(1, Math.ceil(withdrawals.length / W_PAGE_SIZE));
                const safeWPage = Math.min(wPage, totalWPages);
                const paginatedW = withdrawals.slice((safeWPage - 1) * W_PAGE_SIZE, safeWPage * W_PAGE_SIZE);
                return (
                  <div className="space-y-3">
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingW ? (
                            <TableRow><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                          ) : paginatedW.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">No withdrawals</TableCell></TableRow>
                          ) : paginatedW.map((w) => (
                            <TableRow key={w.id} className={w.is_cleared ? "opacity-50" : ""}>
                              <TableCell className="font-semibold">₹{Number(w.amount).toLocaleString("en-IN")}</TableCell>
                              <TableCell className="text-xs uppercase">{w.method}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={wStatusBadge[w.status] || ""}>{w.status}</Badge>
                                {w.is_cleared && <Badge variant="outline" className="ml-1 text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
                              </TableCell>
                              <TableCell className="text-sm">{new Date(w.requested_at).toLocaleDateString()}</TableCell>
                              <TableCell className="max-w-[150px] truncate text-xs">{w.review_notes || "—"}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button size="icon" variant="ghost" onClick={() => {
                                    setEditW(w);
                                    setEditWAmount(String(w.amount));
                                    setEditWStatus(w.status);
                                    setEditWNotes(w.review_notes || "");
                                    setEditWAdjustBalance(true);
                                  }}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  {w.is_cleared ? (
                                    <Button size="icon" variant="ghost" onClick={() => clearWMutation.mutate({ id: w.id, clear: false })}>
                                      <EyeOff className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <Button size="icon" variant="ghost" className="text-warning" onClick={() => clearWMutation.mutate({ id: w.id, clear: true })} title="Clear">
                                      <EyeOff className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => {
                                    setDeleteW(w);
                                    setDeleteWAdjustBalance(true);
                                  }}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {withdrawals.length > W_PAGE_SIZE && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Showing {(safeWPage - 1) * W_PAGE_SIZE + 1}–{Math.min(safeWPage * W_PAGE_SIZE, withdrawals.length)} of {withdrawals.length}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-8 w-8" disabled={safeWPage <= 1} onClick={() => setWPage(safeWPage - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          {Array.from({ length: totalWPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalWPages || Math.abs(p - safeWPage) <= 1)
                            .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                              acc.push(p);
                              return acc;
                            }, [])
                            .map((p, i) =>
                              p === "ellipsis" ? (
                                <span key={`e${i}`} className="px-1 text-sm text-muted-foreground">…</span>
                              ) : (
                                <Button key={p} size="icon" variant={p === safeWPage ? "default" : "outline"} className="h-8 w-8 text-xs" onClick={() => setWPage(p)}>
                                  {p}
                                </Button>
                              )
                            )}
                          <Button size="icon" variant="outline" className="h-8 w-8" disabled={safeWPage >= totalWPages} onClick={() => setWPage(safeWPage + 1)}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>

          </Tabs>
        </>
      )}

      {/* Wallet Action Dialog */}
      <Dialog open={!!actionDialog.type} onOpenChange={(o) => { if (!o) closeActionDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "add" && "Add Money"}
              {actionDialog.type === "deduct" && "Deduct Money"}
              {actionDialog.type === "hold" && "Hold Amount"}
              {actionDialog.type === "transfer" && "Transfer Funds"}
            </DialogTitle>
            <DialogDescription>
              {displayUser?.full_name?.[0]} ({displayUser?.user_code?.[0]})
              {actionDialog.type === "deduct" && " — Can go negative"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={actionAmount} onChange={(e) => setActionAmount(e.target.value)} placeholder="Enter amount" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={actionDescription} onChange={(e) => setActionDescription(e.target.value)} placeholder="Reason for this action..." />
            </div>
            {actionDialog.type === "transfer" && (
              <div className="space-y-2">
                <Label>Transfer To</Label>
                <Input value={transferTarget} onChange={(e) => searchTransferTarget(e.target.value)} placeholder="Search recipient..." />
                {transferTargetResults.map((t) => (
                  <button
                    key={t.id}
                    className={`flex w-full items-center justify-between rounded-lg border p-2 text-left text-sm transition-colors hover:bg-muted ${selectedTransferTarget?.id === t.id ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => { setSelectedTransferTarget(t); setTransferTarget(t.full_name?.[0] || ""); setTransferTargetResults([]); }}
                  >
                    <span>{t.full_name?.[0]} ({t.user_code?.[0]})</span>
                    <Badge variant="outline" className="text-[10px]">{t.user_type}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog}>Cancel</Button>
            <Button
              onClick={handleWalletAction}
              disabled={walletAction.isPending || (actionDialog.type === "transfer" && !selectedTransferTarget)}
            >
              {walletAction.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editTx} onOpenChange={(o) => { if (!o) setEditTx(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>Modify transaction record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={editTxType} onValueChange={setEditTxType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="hold">Hold</SelectItem>
                  <SelectItem value="release">Release</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={editTxAmount} onChange={(e) => setEditTxAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editTxDesc} onChange={(e) => setEditTxDesc(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editTxAdjustBalance} onCheckedChange={setEditTxAdjustBalance} />
              <Label className="text-sm">Adjust user balance accordingly</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTx(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!editTx || !displayUser) return;
                txMutation.mutate({
                  action: "admin_edit_transaction",
                  transaction_id: editTx.id,
                  target_profile_id: displayUser.id,
                  adjust_balance: editTxAdjustBalance,
                  amount: Number(editTxAmount),
                  description: editTxDesc,
                  type: editTxType,
                });
              }}
              disabled={txMutation.isPending}
            >
              {txMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Dialog */}
      <Dialog open={!!deleteTx} onOpenChange={(o) => { if (!o) setDeleteTx(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Delete ₹{Number(deleteTx?.amount).toLocaleString("en-IN")} {deleteTx?.type} transaction?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Switch checked={deleteTxAdjustBalance} onCheckedChange={setDeleteTxAdjustBalance} />
            <Label className="text-sm">Reverse the balance change</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTx(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteTx || !displayUser) return;
                txMutation.mutate({
                  action: "admin_delete_transaction",
                  transaction_id: deleteTx.id,
                  target_profile_id: displayUser.id,
                  adjust_balance: deleteTxAdjustBalance,
                });
              }}
              disabled={txMutation.isPending}
            >
              {txMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Withdrawal Dialog */}
      <Dialog open={!!editW} onOpenChange={(o) => { if (!o) setEditW(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Withdrawal</DialogTitle>
            <DialogDescription>Modify withdrawal record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={editWAmount} onChange={(e) => setEditWAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editWStatus} onValueChange={setEditWStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Review Notes</Label>
              <Textarea value={editWNotes} onChange={(e) => setEditWNotes(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editWAdjustBalance} onCheckedChange={setEditWAdjustBalance} />
              <Label className="text-sm">Adjust user balance accordingly</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditW(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!editW || !displayUser) return;
                wMutation.mutate({
                  action: "admin_edit_withdrawal",
                  withdrawal_id: editW.id,
                  target_profile_id: displayUser.id,
                  adjust_balance: editWAdjustBalance,
                  amount: Number(editWAmount),
                  status: editWStatus,
                  review_notes: editWNotes,
                });
              }}
              disabled={wMutation.isPending}
            >
              {wMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Withdrawal Dialog */}
      <Dialog open={!!deleteW} onOpenChange={(o) => { if (!o) setDeleteW(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Withdrawal</DialogTitle>
            <DialogDescription>
              Delete ₹{Number(deleteW?.amount).toLocaleString("en-IN")} {deleteW?.status} withdrawal?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Switch checked={deleteWAdjustBalance} onCheckedChange={setDeleteWAdjustBalance} />
            <Label className="text-sm">Reverse the balance change</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteW(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteW || !displayUser) return;
                wMutation.mutate({
                  action: "admin_delete_withdrawal",
                  withdrawal_id: deleteW.id,
                  target_profile_id: displayUser.id,
                  adjust_balance: deleteWAdjustBalance,
                });
              }}
              disabled={wMutation.isPending}
            >
              {wMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWalletManagement;
