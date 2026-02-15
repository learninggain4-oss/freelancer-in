import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Wallet, PlusCircle, MinusCircle, ArrowRightLeft, Lock, Unlock,
  Pencil, Trash2, XCircle, IndianRupee, Search,
} from "lucide-react";

type Profile = {
  id: string;
  full_name: string[];
  user_code: string[];
  email: string;
  user_type: string;
  available_balance: number;
  hold_balance: number;
};

const AdminWalletManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [actionDialog, setActionDialog] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [transferTo, setTransferTo] = useState("");

  // Transaction editing
  const [editTx, setEditTx] = useState<any>(null);
  const [editTxDesc, setEditTxDesc] = useState("");
  const [editTxAmount, setEditTxAmount] = useState("");

  // Withdrawal editing
  const [editW, setEditW] = useState<any>(null);
  const [editWAmount, setEditWAmount] = useState("");
  const [editWStatus, setEditWStatus] = useState("");
  const [editWNotes, setEditWNotes] = useState("");

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-wallet-users", searchTerm],
    queryFn: async () => {
      let q = supabase
        .from("profiles")
        .select("id, full_name, user_code, email, user_type, available_balance, hold_balance")
        .order("created_at", { ascending: false })
        .limit(50);
      if (searchTerm.trim()) {
        q = q.or(`email.ilike.%${searchTerm}%,full_name.cs.{${searchTerm}},user_code.cs.{${searchTerm}}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["admin-wallet-tx", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("profile_id", selectedUser.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUser,
  });

  const { data: withdrawals = [], isLoading: wLoading } = useQuery({
    queryKey: ["admin-wallet-withdrawals", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("employee_id", selectedUser.id)
        .order("requested_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUser,
  });

  const walletMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await supabase.functions.invoke("wallet-operations", { body });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Operation successful");
      resetDialog();
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-tx"] });
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-withdrawals"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetDialog = () => {
    setActionDialog(null);
    setAmount("");
    setNotes("");
    setTransferTo("");
    setEditTx(null);
    setEditW(null);
  };

  const handleWalletAction = (action: string) => {
    if (!selectedUser) return;
    const amt = Number(amount);
    if (action === "admin_transfer_balance") {
      walletMutation.mutate({
        action,
        amount: amt,
        from_profile_id: selectedUser.id,
        to_profile_id: transferTo,
        review_notes: notes || undefined,
      });
    } else {
      walletMutation.mutate({
        action,
        amount: amt,
        profile_id: selectedUser.id,
        review_notes: notes || undefined,
      });
    }
  };

  const handleEditTransaction = () => {
    if (!editTx) return;
    walletMutation.mutate({
      action: "admin_edit_transaction",
      transaction_id: editTx.id,
      description: editTxDesc,
      amount: Number(editTxAmount) || undefined,
    });
  };

  const handleDeleteTransaction = (txId: string) => {
    walletMutation.mutate({ action: "admin_delete_transaction", transaction_id: txId });
  };

  const handleClearTransactions = () => {
    if (!selectedUser) return;
    walletMutation.mutate({ action: "admin_clear_transactions", profile_id: selectedUser.id });
  };

  const handleEditWithdrawal = () => {
    if (!editW) return;
    walletMutation.mutate({
      action: "admin_edit_withdrawal",
      withdrawal_id: editW.id,
      new_amount: Number(editWAmount) || undefined,
      new_status: editWStatus || undefined,
      review_notes: editWNotes || undefined,
    });
  };

  const handleDeleteWithdrawal = (wId: string) => {
    walletMutation.mutate({ action: "admin_delete_withdrawal", withdrawal_id: wId });
  };

  const txTypeBadge: Record<string, string> = {
    credit: "bg-accent/15 text-accent border-accent/30",
    debit: "bg-destructive/15 text-destructive border-destructive/30",
    hold: "bg-warning/15 text-warning border-warning/30",
    release: "bg-primary/15 text-primary border-primary/30",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Wallet Management</h2>

      {/* Search users */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" /> Search User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by name, code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
            {usersLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No users found</p>
            ) : (
              users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`flex w-full items-center justify-between rounded-lg border p-2.5 text-left text-sm transition-colors hover:bg-muted ${selectedUser?.id === u.id ? "border-primary bg-primary/5" : ""}`}
                >
                  <div>
                    <span className="font-medium text-foreground">{u.full_name?.[0]}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{u.user_code?.[0]}</span>
                    <Badge variant="outline" className="ml-2 text-[10px]">{u.user_type}</Badge>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <span className="text-accent font-medium">₹{Number(u.available_balance).toLocaleString("en-IN")}</span>
                    {Number(u.hold_balance) > 0 && (
                      <span className="ml-2 text-warning">Hold: ₹{Number(u.hold_balance).toLocaleString("en-IN")}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <>
          {/* Balance Cards + Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-xl font-bold text-foreground">
                  <IndianRupee className="inline h-4 w-4" />
                  {Number(selectedUser.available_balance).toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">On Hold</p>
                <p className="text-xl font-bold text-foreground">
                  <IndianRupee className="inline h-4 w-4" />
                  {Number(selectedUser.hold_balance).toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setActionDialog("admin_add_money")}>
              <PlusCircle className="mr-1 h-3.5 w-3.5" /> Add Money
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setActionDialog("admin_debit_money")}>
              <MinusCircle className="mr-1 h-3.5 w-3.5" /> Debit
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setActionDialog("admin_hold_user_balance")}>
              <Lock className="mr-1 h-3.5 w-3.5" /> Hold
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setActionDialog("admin_release_user_balance")}>
              <Unlock className="mr-1 h-3.5 w-3.5" /> Release
            </Button>
            <Button size="sm" variant="outline" onClick={() => setActionDialog("admin_transfer_balance")}>
              <ArrowRightLeft className="mr-1 h-3.5 w-3.5" /> Transfer
            </Button>
          </div>

          {/* Tabs: Transactions / Withdrawals */}
          <Tabs defaultValue="transactions">
            <TabsList>
              <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" variant="destructive" onClick={handleClearTransactions} disabled={transactions.length === 0}>
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Clear All
                </Button>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txLoading ? (
                      <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No transactions</TableCell></TableRow>
                    ) : transactions.map((tx: any) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={txTypeBadge[tx.type] || ""}>{tx.type}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">₹{Number(tx.amount).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{tx.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => {
                              setEditTx(tx);
                              setEditTxDesc(tx.description);
                              setEditTxAmount(String(tx.amount));
                            }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteTransaction(tx.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="withdrawals" className="space-y-3">
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wLoading ? (
                      <TableRow><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                    ) : withdrawals.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No withdrawals</TableCell></TableRow>
                    ) : withdrawals.map((w: any) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-xs">{new Date(w.requested_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">₹{Number(w.amount).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-xs uppercase">{w.method}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            w.status === "approved" ? "bg-accent/15 text-accent" :
                            w.status === "rejected" ? "bg-destructive/15 text-destructive" :
                            w.status === "pending" ? "bg-warning/15 text-warning" : ""
                          }>{w.status}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs">{w.review_notes || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => {
                              setEditW(w);
                              setEditWAmount(String(w.amount));
                              setEditWStatus(w.status);
                              setEditWNotes(w.review_notes || "");
                            }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteWithdrawal(w.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Wallet Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => { if (!o) resetDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog === "admin_add_money" && "Add Money"}
              {actionDialog === "admin_debit_money" && "Debit Money"}
              {actionDialog === "admin_hold_user_balance" && "Hold Balance"}
              {actionDialog === "admin_release_user_balance" && "Release Balance"}
              {actionDialog === "admin_transfer_balance" && "Transfer Balance"}
            </DialogTitle>
            <DialogDescription>{selectedUser?.full_name?.[0]} ({selectedUser?.user_code?.[0]})</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Amount (₹)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
            </div>
            {actionDialog === "admin_transfer_balance" && (
              <div>
                <Label>Transfer To (Profile ID)</Label>
                <Input value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="Recipient profile ID" />
              </div>
            )}
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason / notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>Cancel</Button>
            <Button onClick={() => handleWalletAction(actionDialog!)} disabled={walletMutation.isPending}>
              {walletMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editTx} onOpenChange={(o) => { if (!o) setEditTx(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Amount</Label>
              <Input type="number" value={editTxAmount} onChange={(e) => setEditTxAmount(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={editTxDesc} onChange={(e) => setEditTxDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTx(null)}>Cancel</Button>
            <Button onClick={handleEditTransaction} disabled={walletMutation.isPending}>
              {walletMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Withdrawal Dialog */}
      <Dialog open={!!editW} onOpenChange={(o) => { if (!o) setEditW(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Amount</Label>
              <Input type="number" value={editWAmount} onChange={(e) => setEditWAmount(e.target.value)} />
            </div>
            <div>
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
            <div>
              <Label>Notes</Label>
              <Textarea value={editWNotes} onChange={(e) => setEditWNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditW(null)}>Cancel</Button>
            <Button onClick={handleEditWithdrawal} disabled={walletMutation.isPending}>
              {walletMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWalletManagement;
