import React, { useState } from "react";
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
  Search, Wallet, IndianRupee, Clock, PlusCircle, MinusCircle, Loader2,
  Lock, ArrowRightLeft, Pencil, Trash2, User, ChevronLeft, ChevronRight, EyeOff, Unlock, LayoutDashboard,
} from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { cn } from "@/lib/utils";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

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
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Action dialogs
  const [actionDialog, setActionDialog] = useState<{
    type: "add" | "deduct" | "hold" | "release" | "transfer" | null;
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

  const [userTab, setUserTab] = useState<"freelancer" | "employer">("freelancer");

  // Fetch all users
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-wallet-all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, email, user_type, available_balance, hold_balance, wallet_number, wallet_active")
        .in("user_type", ["employee", "client"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !selectedUser,
  });

  const filteredUsers = allUsers.filter((u) => {
    const dbType = userTab === "freelancer" ? "employee" : "client";
    if (u.user_type !== dbType) return false;
    if (search.length < 2) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name?.[0] || "").toLowerCase().includes(q) ||
      (u.user_code?.[0] || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.wallet_number || "").toLowerCase().includes(q)
    );
  });

  // Fresh user data
  const { data: freshUser } = useQuery({
    queryKey: ["admin-wallet-user", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, email, user_type, available_balance, hold_balance, wallet_number, wallet_active")
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

  const toggleWalletMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("profiles").update({ wallet_active: active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.active ? "Wallet activated" : "Wallet deactivated");
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-all-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-user"] });
    },
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
      .select("id, full_name, user_code, email, user_type, available_balance, hold_balance, wallet_number, wallet_active")
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
      release: "admin_wallet_release",
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
    credit: "bg-green-500/20 text-green-500 border-green-500/30",
    debit: "bg-red-500/20 text-red-500 border-red-500/30",
    hold: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    release: "bg-indigo-500/20 text-indigo-500 border-indigo-500/30",
  };

  const wStatusBadge: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    approved: "bg-green-500/20 text-green-500 border-green-500/30",
    rejected: "bg-red-500/20 text-red-500 border-red-500/30",
    completed: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  };

  return (
    <div className="min-h-screen p-4 pb-20 space-y-6" style={{ background: T.bg }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl">
            <LayoutDashboard className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Wallet Management</h2>
          <p className="mt-2 text-indigo-100">Oversee all user wallets, adjust balances, and monitor financial integrity.</p>
        </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* User Search */}
      {!selectedUser ? (
        <div className="rounded-3xl border p-6 transition-all hover:shadow-xl" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold" style={{ color: T.text }}>Select User</h3>
            </div>
            <Tabs value={userTab} onValueChange={(v) => setUserTab(v as "freelancer" | "employer")} className="w-[300px]">
              <TabsList className="w-full h-10 bg-transparent border p-0 gap-1 rounded-xl" style={{ borderColor: T.border }}>
                <TabsTrigger value="freelancer" className="flex-1 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white" style={{ color: T.sub }}>Freelancers</TabsTrigger>
                <TabsTrigger value="employer" className="flex-1 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white" style={{ color: T.sub }}>Employers</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.sub }} />
            <Input
              placeholder="Search by name, email, or user code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
              style={{ background: T.input, borderColor: T.border, color: T.text }}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loadingUsers ? (
              Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
            ) : filteredUsers.map((u) => (
              <div
                key={u.id}
                className="group relative flex flex-col justify-between rounded-2xl border p-4 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                style={{ background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)", borderColor: T.border }}
                onClick={() => { setSelectedUser(u); setSearch(""); setTxPage(1); setWPage(1); }}
              >
                <div className="flex justify-between">
                  <div className="flex-1">
                    <p className="font-bold truncate" style={{ color: T.text }}>{u.full_name?.[0]}</p>
                    <p className="text-xs" style={{ color: T.sub }}>{u.user_code?.[0]} · {u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={u.wallet_active}
                      onCheckedChange={(checked) => toggleWalletMutation.mutate({ id: u.id, active: checked })}
                      disabled={toggleWalletMutation.isPending}
                    />
                    <span className={cn("text-[9px] font-bold uppercase tracking-wider", u.wallet_active ? "text-green-500" : "text-red-500")}>
                      {u.wallet_active ? "Active" : "Locked"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: T.border }}>
                  <div>
                    <p className="text-[10px] font-medium" style={{ color: T.sub }}>Available Balance</p>
                    <p className="text-sm font-bold text-indigo-500">₹{Number(u.available_balance).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium" style={{ color: T.sub }}>On Hold</p>
                    <p className="text-sm font-bold text-amber-500">₹{Number(u.hold_balance).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
            ))}
            {!loadingUsers && filteredUsers.length === 0 && (
              <div className="col-span-full py-12 text-center" style={{ color: T.sub }}>
                No {userTab}s found matching your search.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Selected User Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-4 px-6" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <User className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold" style={{ color: T.text }}>{displayUser?.full_name?.[0]}</p>
                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 capitalize">{displayUser?.user_type}</Badge>
                </div>
                <p className="text-xs" style={{ color: T.sub }}>
                  {displayUser?.user_code?.[0]} · {displayUser?.email} · {displayUser?.wallet_number || "No Wallet Number"}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setSelectedUser(null)} className="rounded-xl px-6" style={{ borderColor: T.border, color: T.text }}>
              Change User
            </Button>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border p-6 transition-all hover:shadow-xl" style={{ background: T.card, borderColor: "rgba(99,102,241,0.2)", backdropFilter: "blur(12px)" }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: T.sub }}>
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Available Balance</span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-indigo-500">
                <span className="mr-1 text-xl">₹</span>
                {Number(displayUser?.available_balance ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-3xl border p-6 transition-all hover:shadow-xl" style={{ background: T.card, borderColor: "rgba(245,158,11,0.2)", backdropFilter: "blur(12px)" }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: T.sub }}>
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">On Hold Balance</span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-amber-500">
                <span className="mr-1 text-xl">₹</span>
                {Number(displayUser?.hold_balance ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { type: "add", label: "Add", icon: PlusCircle, color: "text-green-500", bg: "hover:bg-green-500/10" },
              { type: "deduct", label: "Deduct", icon: MinusCircle, color: "text-red-500", bg: "hover:bg-red-500/10" },
              { type: "hold", label: "Hold", icon: Lock, color: "text-amber-500", bg: "hover:bg-amber-500/10" },
              { type: "release", label: "Release", icon: Unlock, color: "text-indigo-500", bg: "hover:bg-indigo-500/10" },
              { type: "transfer", label: "Transfer", icon: ArrowRightLeft, color: "text-violet-500", bg: "hover:bg-violet-500/10" },
            ].map(act => (
              <Button 
                key={act.type}
                variant="outline" 
                className={cn("h-14 flex-col gap-1 rounded-2xl border transition-all", act.bg)} 
                onClick={() => setActionDialog({ type: act.type as any })}
                style={{ borderColor: T.border, background: T.card, color: T.text }}
              >
                <act.icon className={cn("h-5 w-5", act.color)} />
                <span className="text-[10px] font-bold uppercase tracking-tight">{act.label}</span>
              </Button>
            ))}
          </div>

          {/* Tabs: Transactions & Withdrawals */}
          <Tabs defaultValue="transactions" className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <TabsList className="h-10 bg-transparent border p-0 gap-1 rounded-xl" style={{ borderColor: T.border }}>
                <TabsTrigger value="transactions" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-6" style={{ color: T.sub }}>
                  Transactions ({transactions.length})
                </TabsTrigger>
                <TabsTrigger value="withdrawals" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-6" style={{ color: T.sub }}>
                  Withdrawals ({withdrawals.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="transactions" className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border p-3 px-4 w-fit" style={{ borderColor: T.border, background: T.card }}>
                <Switch checked={showClearedTx} onCheckedChange={setShowClearedTx} id="show-cleared-tx" />
                <Label htmlFor="show-cleared-tx" className="text-xs font-medium" style={{ color: T.text }}>Show Cleared Transactions</Label>
              </div>

              {(() => {
                const totalTxPages = Math.max(1, Math.ceil(transactions.length / TX_PAGE_SIZE));
                const safeTxPage = Math.min(txPage, totalTxPages);
                const paginatedTx = transactions.slice((safeTxPage - 1) * TX_PAGE_SIZE, safeTxPage * TX_PAGE_SIZE);
                return (
                  <div className="overflow-hidden rounded-2xl border" style={{ borderColor: T.border, background: T.card, backdropFilter: "blur(12px)" }}>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ borderColor: T.border, background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                          <TableHead style={{ color: T.sub }}>Type</TableHead>
                          <TableHead style={{ color: T.sub }}>Amount</TableHead>
                          <TableHead style={{ color: T.sub }}>Description</TableHead>
                          <TableHead style={{ color: T.sub }}>Date</TableHead>
                          <TableHead className="text-right" style={{ color: T.sub }}>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingTx ? (
                          <TableRow><TableCell colSpan={5} className="py-12"><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                        ) : paginatedTx.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="py-12 text-center" style={{ color: T.sub }}>No transaction history found</TableCell></TableRow>
                        ) : paginatedTx.map((tx) => (
                          <TableRow key={tx.id} className={cn("transition-colors", tx.is_cleared && "opacity-50")} style={{ borderColor: T.border }}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("backdrop-blur-md", txTypeBadge[tx.type] || "")}>{tx.type}</Badge>
                                {tx.is_cleared && <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500 bg-red-500/10">Cleared</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="font-bold" style={{ color: T.text }}>₹{Number(tx.amount).toLocaleString("en-IN")}</TableCell>
                            <TableCell className="max-w-[250px] truncate text-sm" style={{ color: T.text }}>{tx.description}</TableCell>
                            <TableCell className="text-sm" style={{ color: T.sub }}>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8" style={{ color: T.sub }} onClick={() => {
                                  setEditTx(tx);
                                  setEditTxAmount(String(tx.amount));
                                  setEditTxDesc(tx.description);
                                  setEditTxType(tx.type);
                                  setEditTxAdjustBalance(true);
                                }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {tx.is_cleared ? (
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-500" onClick={() => clearTxMutation.mutate({ id: tx.id, clear: false })}>
                                    <Unlock className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => clearTxMutation.mutate({ id: tx.id, clear: true })}>
                                    <EyeOff className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteTx(tx)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {totalTxPages > 1 && (
                      <div className="flex items-center justify-between border-t p-4" style={{ borderColor: T.border }}>
                        <p className="text-xs" style={{ color: T.sub }}>Page {safeTxPage} of {totalTxPages}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled={safeTxPage === 1} onClick={() => setTxPage(p => p - 1)} style={{ borderColor: T.border, color: T.text }}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                          </Button>
                          <Button size="sm" variant="outline" disabled={safeTxPage === totalTxPages} onClick={() => setTxPage(p => p + 1)} style={{ borderColor: T.border, color: T.text }}>
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="withdrawals" className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border p-3 px-4 w-fit" style={{ borderColor: T.border, background: T.card }}>
                <Switch checked={showClearedW} onCheckedChange={setShowClearedW} id="show-cleared-w" />
                <Label htmlFor="show-cleared-w" className="text-xs font-medium" style={{ color: T.text }}>Show Cleared Withdrawals</Label>
              </div>

              {(() => {
                const totalWPages = Math.max(1, Math.ceil(withdrawals.length / W_PAGE_SIZE));
                const safeWPage = Math.min(wPage, totalWPages);
                const paginatedW = withdrawals.slice((safeWPage - 1) * W_PAGE_SIZE, safeWPage * W_PAGE_SIZE);
                return (
                  <div className="overflow-hidden rounded-2xl border" style={{ borderColor: T.border, background: T.card, backdropFilter: "blur(12px)" }}>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ borderColor: T.border, background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                          <TableHead style={{ color: T.sub }}>Amount</TableHead>
                          <TableHead style={{ color: T.sub }}>Status</TableHead>
                          <TableHead style={{ color: T.sub }}>Method</TableHead>
                          <TableHead style={{ color: T.sub }}>Requested</TableHead>
                          <TableHead className="text-right" style={{ color: T.sub }}>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingW ? (
                          <TableRow><TableCell colSpan={5} className="py-12"><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                        ) : paginatedW.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="py-12 text-center" style={{ color: T.sub }}>No withdrawal history found</TableCell></TableRow>
                        ) : paginatedW.map((w) => (
                          <TableRow key={w.id} className={cn("transition-colors", w.is_cleared && "opacity-50")} style={{ borderColor: T.border }}>
                            <TableCell className="font-bold" style={{ color: T.text }}>₹{Number(w.amount).toLocaleString("en-IN")}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("backdrop-blur-md", wStatusBadge[w.status] || "")}>{w.status}</Badge>
                                {w.is_cleared && <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500 bg-red-500/10">Cleared</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm" style={{ color: T.text }}>{w.method}</TableCell>
                            <TableCell className="text-sm" style={{ color: T.sub }}>{new Date(w.requested_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8" style={{ color: T.sub }} onClick={() => {
                                  setEditW(w);
                                  setEditWAmount(String(w.amount));
                                  setEditWStatus(w.status);
                                  setEditWNotes(w.review_notes || "");
                                  setEditWAdjustBalance(true);
                                }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {w.is_cleared ? (
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-500" onClick={() => clearWMutation.mutate({ id: w.id, clear: false })}>
                                    <Unlock className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => clearWMutation.mutate({ id: w.id, clear: true })}>
                                    <EyeOff className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteW(w)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {totalWPages > 1 && (
                      <div className="flex items-center justify-between border-t p-4" style={{ borderColor: T.border }}>
                        <p className="text-xs" style={{ color: T.sub }}>Page {safeWPage} of {totalWPages}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled={safeWPage === 1} onClick={() => setWPage(p => p - 1)} style={{ borderColor: T.border, color: T.text }}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                          </Button>
                          <Button size="sm" variant="outline" disabled={safeWPage === totalWPages} onClick={() => setWPage(p => p + 1)} style={{ borderColor: T.border, color: T.text }}>
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionDialog.type} onOpenChange={(o) => !o && closeActionDialog()}>
        <DialogContent className="max-w-md" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(20px)" }}>
          <DialogHeader>
            <DialogTitle className="capitalize" style={{ color: T.text }}>{actionDialog.type} Funds</DialogTitle>
            <DialogDescription style={{ color: T.sub }}>Modify wallet balance for {displayUser?.full_name?.[0]}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionDialog.type === "transfer" && (
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Target Wallet / User</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: T.sub }} />
                  <Input 
                    value={transferTarget} 
                    onChange={e => searchTransferTarget(e.target.value)} 
                    placeholder="Search by name or email..." 
                    className="pl-9"
                    style={{ background: T.input, borderColor: T.border, color: T.text }}
                  />
                </div>
                {transferTargetResults.length > 0 && !selectedTransferTarget && (
                  <div className="mt-1 rounded-xl border overflow-hidden shadow-xl" style={{ background: T.card, borderColor: T.border }}>
                    {transferTargetResults.map(u => (
                      <button 
                        key={u.id} 
                        className="w-full px-4 py-2.5 text-left text-xs hover:bg-indigo-500/10 transition-colors border-b last:border-0" 
                        style={{ color: T.text, borderColor: T.border }}
                        onClick={() => { setSelectedTransferTarget(u); setTransferTarget(u.full_name?.[0] || ""); }}
                      >
                        <p className="font-bold">{u.full_name?.[0]}</p>
                        <p style={{ color: T.sub }}>{u.user_code?.[0]} · {u.email}</p>
                      </button>
                    ))}
                  </div>
                )}
                {selectedTransferTarget && (
                  <div className="flex items-center justify-between rounded-xl bg-indigo-500/10 p-2 px-3 border border-indigo-500/20">
                    <span className="text-xs font-bold text-indigo-400">{selectedTransferTarget.full_name?.[0]}</span>
                    <button className="text-[10px] text-red-400 hover:underline" onClick={() => setSelectedTransferTarget(null)}>Remove</button>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label style={{ color: T.text }}>Amount (₹)</Label>
              <Input 
                type="number" 
                value={actionAmount} 
                onChange={e => setActionAmount(e.target.value)} 
                placeholder="0.00" 
                style={{ background: T.input, borderColor: T.border, color: T.text }}
                className="h-11 font-bold text-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: T.text }}>Description</Label>
              <Textarea 
                value={actionDescription} 
                onChange={e => setActionDescription(e.target.value)} 
                placeholder="Internal memo or reason..." 
                style={{ background: T.input, borderColor: T.border, color: T.text }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog} style={{ background: "transparent", borderColor: T.border, color: T.text }}>Cancel</Button>
            <Button 
              onClick={handleWalletAction} 
              disabled={walletAction.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 min-w-[100px]"
            >
              {walletAction.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editTx} onOpenChange={(o) => !o && setEditTx(null)}>
        <DialogContent className="max-w-md" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(20px)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: T.text }}>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Type</Label>
                <Select value={editTxType} onValueChange={setEditTxType}>
                  <SelectTrigger style={{ background: T.input, borderColor: T.border, color: T.text }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(16px)" }}>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                    <SelectItem value="release">Release</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Amount (₹)</Label>
                <Input type="number" value={editTxAmount} onChange={e => setEditTxAmount(e.target.value)} style={{ background: T.input, borderColor: T.border, color: T.text }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: T.text }}>Description</Label>
              <Input value={editTxDesc} onChange={e => setEditTxDesc(e.target.value)} style={{ background: T.input, borderColor: T.border, color: T.text }} />
            </div>
            <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: T.border, background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
              <Switch checked={editTxAdjustBalance} onCheckedChange={setEditTxAdjustBalance} />
              <Label className="text-xs" style={{ color: T.text }}>Reflect changes in user balance</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTx(null)} style={{ background: "transparent", borderColor: T.border, color: T.text }}>Cancel</Button>
            <Button onClick={() => txMutation.mutate({ action: "admin_edit_transaction", transaction_id: editTx!.id, target_profile_id: displayUser!.id, adjust_balance: editTxAdjustBalance, amount: Number(editTxAmount), description: editTxDesc, type: editTxType })} disabled={txMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction */}
      <AlertDialog open={!!deleteTx} onOpenChange={(o) => !o && setDeleteTx(null)}>
        <AlertDialogContent style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(20px)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.text }}>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.sub }}>This will remove the transaction record permanently.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-3 rounded-xl border p-3 my-4" style={{ borderColor: T.border }}>
            <Switch checked={deleteTxAdjustBalance} onCheckedChange={setDeleteTxAdjustBalance} />
            <Label className="text-xs" style={{ color: T.text }}>Revert balance impact</Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: "transparent", borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => txMutation.mutate({ action: "admin_delete_transaction", transaction_id: deleteTx!.id, target_profile_id: displayUser!.id, adjust_balance: deleteTxAdjustBalance })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Withdrawal */}
      <Dialog open={!!editW} onOpenChange={(o) => !o && setEditW(null)}>
        <DialogContent className="max-w-md" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(20px)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: T.text }}>Edit Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Status</Label>
                <Select value={editWStatus} onValueChange={setEditWStatus}>
                  <SelectTrigger style={{ background: T.input, borderColor: T.border, color: T.text }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(16px)" }}>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Amount (₹)</Label>
                <Input type="number" value={editWAmount} onChange={e => setEditWAmount(e.target.value)} style={{ background: T.input, borderColor: T.border, color: T.text }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: T.text }}>Review Notes</Label>
              <Input value={editWNotes} onChange={e => setEditWNotes(e.target.value)} style={{ background: T.input, borderColor: T.border, color: T.text }} />
            </div>
            <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: T.border, background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
              <Switch checked={editWAdjustBalance} onCheckedChange={setEditWAdjustBalance} />
              <Label className="text-xs" style={{ color: T.text }}>Reflect changes in user balance</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditW(null)} style={{ background: "transparent", borderColor: T.border, color: T.text }}>Cancel</Button>
            <Button onClick={() => wMutation.mutate({ action: "admin_edit_withdrawal", withdrawal_id: editW!.id, target_profile_id: displayUser!.id, adjust_balance: editWAdjustBalance, amount: Number(editWAmount), status: editWStatus, review_notes: editWNotes })} disabled={wMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Withdrawal */}
      <AlertDialog open={!!deleteW} onOpenChange={(o) => !o && setDeleteW(null)}>
        <AlertDialogContent style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(20px)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.text }}>Delete Withdrawal Record?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.sub }}>Permanently remove this request record.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-3 rounded-xl border p-3 my-4" style={{ borderColor: T.border }}>
            <Switch checked={deleteWAdjustBalance} onCheckedChange={setDeleteWAdjustBalance} />
            <Label className="text-xs" style={{ color: T.text }}>Revert balance impact</Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: "transparent", borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => wMutation.mutate({ action: "admin_delete_withdrawal", withdrawal_id: deleteW!.id, target_profile_id: displayUser!.id, adjust_balance: deleteWAdjustBalance })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default AdminWalletManagement;
