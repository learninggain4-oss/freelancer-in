import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, ArchiveRestore, Layers, LayoutGrid, CheckCircle2, XCircle } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { cn } from "@/lib/utils";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

interface WalletTypeRow extends WalletTypeForm {
  id: string;
  is_cleared?: boolean;
}

interface WalletTypeForm {
  name: string;
  description: string;
  icon_name: string;
  color: string;
  monthly_min_balance: number;
  wallet_max_capacity: number;
  transaction_limit: number;
  wallet_price: string;
  monthly_withdrawal_limit: string;
  monthly_transaction_limit: string;
  minimum_withdrawal: number;
  wallet_price_monthly: number;
  wallet_expiry: string;
  perks: string;
  upgrade_requirements: string;
  display_order: number;
  is_active: boolean;
}

const defaultForm: WalletTypeForm = {
  name: "",
  description: "",
  icon_name: "Wallet",
  color: "#2563EB",
  monthly_min_balance: 0,
  wallet_max_capacity: 0,
  transaction_limit: 0,
  wallet_price: "Free",
  monthly_withdrawal_limit: "1",
  monthly_transaction_limit: "10",
  minimum_withdrawal: 0,
  wallet_price_monthly: 0,
  wallet_expiry: "Unlimited",
  perks: "",
  upgrade_requirements: "",
  display_order: 0,
  is_active: true,
};

const AdminWalletTypes = () => {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const queryClient = useQueryClient();
  const [showCleared, setShowCleared] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WalletTypeForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: walletTypes = [], isLoading } = useQuery({
    queryKey: ["admin-wallet-types", showCleared],
    queryFn: async () => {
      let query = supabase.from("wallet_types").select("*").order("display_order");
      if (!showCleared) query = query.eq("is_cleared", false);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: WalletTypeForm & { id?: string }) => {
      const perksArray = data.perks.split(",").map((p) => p.trim()).filter(Boolean);
      const payload = {
        name: data.name,
        description: data.description,
        icon_name: data.icon_name,
        color: data.color,
        monthly_min_balance: data.monthly_min_balance,
        wallet_max_capacity: data.wallet_max_capacity,
        transaction_limit: data.transaction_limit,
        wallet_price: data.wallet_price,
        monthly_withdrawal_limit: data.monthly_withdrawal_limit,
        monthly_transaction_limit: data.monthly_transaction_limit,
        minimum_withdrawal: data.minimum_withdrawal,
        wallet_price_monthly: data.wallet_price_monthly,
        wallet_expiry: data.wallet_expiry,
        perks: perksArray,
        upgrade_requirements: data.upgrade_requirements,
        display_order: data.display_order,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      };
      if (data.id) {
        const { error } = await supabase.from("wallet_types").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("wallet_types").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-types"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      toast.success(editingId ? "Wallet type updated" : "Wallet type created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearMutation = useMutation({
    mutationFn: async ({ id, cleared }: { id: string; cleared: boolean }) => {
      const { error } = await supabase.from("wallet_types").update({ is_cleared: cleared }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-types"] });
      toast.success("Updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wallet_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-types"] });
      setDeleteId(null);
      toast.success("Deleted");
    },
  });

  const openCreate = () => { setEditingId(null); setForm(defaultForm); setDialogOpen(true); };

  const openEdit = (wt: WalletTypeRow) => {
    setEditingId(wt.id);
    setForm({
      name: wt.name,
      description: wt.description || "",
      icon_name: wt.icon_name || "Wallet",
      color: wt.color || "#2563EB",
      monthly_min_balance: Number(wt.monthly_min_balance),
      wallet_max_capacity: Number(wt.wallet_max_capacity),
      transaction_limit: Number(wt.transaction_limit),
      wallet_price: wt.wallet_price || "Free",
      monthly_withdrawal_limit: wt.monthly_withdrawal_limit || "1",
      monthly_transaction_limit: wt.monthly_transaction_limit || "10",
      minimum_withdrawal: Number(wt.minimum_withdrawal),
      wallet_price_monthly: Number(wt.wallet_price_monthly || 0),
      wallet_expiry: wt.wallet_expiry || "Unlimited",
      perks: Array.isArray(wt.perks) ? wt.perks.join(", ") : String(wt.perks || ""),
      upgrade_requirements: wt.upgrade_requirements || "",
      display_order: wt.display_order,
      is_active: wt.is_active,
    });
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen p-4 pb-20 space-y-6" style={{ background: T.bg }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl">
              <Layers className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Wallet Tier Management</h2>
            <p className="mt-2 text-indigo-100">Configure wallet types, limits, and premium subscription benefits.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowCleared(!showCleared)}
              className="rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md"
            >
              {showCleared ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showCleared ? "Hide Cleared" : "Show Cleared"}
            </Button>
            <Button 
              onClick={openCreate}
              className="rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Tier
            </Button>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="rounded-3xl border p-6 transition-all hover:shadow-xl" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p style={{ color: T.sub }}>Loading wallet tiers...</p>
          </div>
        ) : walletTypes.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border-2 border-dashed" style={{ borderColor: T.border }}>
            <LayoutGrid className="mx-auto h-12 w-12 opacity-20 mb-4" style={{ color: T.text }} />
            <p className="text-lg font-medium" style={{ color: T.text }}>No wallet types found</p>
            <p style={{ color: T.sub }}>Start by creating your first wallet tier.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: T.border }}>
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: T.border, background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                  <TableHead className="w-16" style={{ color: T.sub }}>Order</TableHead>
                  <TableHead style={{ color: T.sub }}>Tier Name</TableHead>
                  <TableHead style={{ color: T.sub }}>Price / Month</TableHead>
                  <TableHead style={{ color: T.sub }}>Capacity Limit</TableHead>
                  <TableHead style={{ color: T.sub }}>Min Withdrawal</TableHead>
                  <TableHead style={{ color: T.sub }}>Status</TableHead>
                  <TableHead className="text-right" style={{ color: T.sub }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletTypes.map((wt) => (
                  <TableRow key={wt.id} className={cn("transition-colors", wt.is_cleared && "opacity-50")} style={{ borderColor: T.border }}>
                    <TableCell className="font-mono text-xs" style={{ color: T.sub }}>#{wt.display_order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: wt.color }} />
                        <span className="font-bold" style={{ color: T.text }}>{wt.name}</span>
                        {wt.is_cleared && <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500 bg-red-500/10">Cleared</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold" style={{ color: T.text }}>{wt.wallet_price}</span>
                        {Number((wt as unknown as WalletTypeRow).wallet_price_monthly || 0) > 0 && <span className="text-[10px]" style={{ color: T.sub }}>₹{(wt as unknown as WalletTypeRow).wallet_price_monthly}/mo</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium" style={{ color: T.text }}>
                        {Number(wt.wallet_max_capacity) === 0 ? "Unlimited" : `₹${Number(wt.wallet_max_capacity).toLocaleString("en-IN")}`}
                      </span>
                    </TableCell>
                    <TableCell style={{ color: T.text }}>₹{Number(wt.minimum_withdrawal).toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      {wt.is_active ? (
                        <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/10">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-500/30 text-slate-500 bg-slate-500/10">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" style={{ color: T.sub }} onClick={() => openEdit(wt as unknown as WalletTypeRow)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" style={{ color: T.sub }} onClick={() => clearMutation.mutate({ id: wt.id, cleared: !wt.is_cleared })}>
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={() => setDeleteId(wt.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(20px)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: T.text }}>{editingId ? "Edit Tier Details" : "Create New Wallet Tier"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Tier Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ background: T.input, borderColor: T.border, color: T.text }} placeholder="e.g. Gold Tier" />
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ background: T.input, borderColor: T.border, color: T.text }} placeholder="Briefly describe this tier..." className="min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Icon Name</Label>
                  <Input value={form.icon_name} onChange={(e) => setForm({ ...form, icon_name: e.target.value })} style={{ background: T.input, borderColor: T.border, color: T.text }} placeholder="Wallet, Star, etc." />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent" />
                    <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ background: T.input, borderColor: T.border, color: T.text }} className="flex-1 font-mono text-xs" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Display Price String</Label>
                  <Input value={form.wallet_price} onChange={(e) => setForm({ ...form, wallet_price: e.target.value })} style={{ background: T.input, borderColor: T.border, color: T.text }} placeholder="Free / ₹2,500" />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Monthly Cost (₹)</Label>
                  <Input type="number" value={form.wallet_price_monthly} onChange={(e) => setForm({ ...form, wallet_price_monthly: Number(e.target.value) })} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Display Order</Label>
                  <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                </div>
                <div className="flex items-end gap-3 pb-2">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <Label style={{ color: T.text }}>Tier Active</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Min Balance (₹)</Label>
                  <Input type="number" value={form.monthly_min_balance} onChange={(e) => setForm({ ...form, monthly_min_balance: Number(e.target.value) })} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Max Capacity (₹)</Label>
                  <Input type="number" value={form.wallet_max_capacity} onChange={(e) => setForm({ ...form, wallet_max_capacity: Number(e.target.value) })} style={{ background: T.input, borderColor: T.border, color: T.text }} placeholder="0 = Unlimited" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Withdrawals / Mo</Label>
                  <Input value={form.monthly_withdrawal_limit} onChange={(e) => setForm({ ...form, monthly_withdrawal_limit: e.target.value })} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Transfers / Mo</Label>
                  <Input value={form.monthly_transaction_limit} onChange={(e) => setForm({ ...form, monthly_transaction_limit: e.target.value })} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Min Withdrawal (₹)</Label>
                  <Input type="number" value={form.minimum_withdrawal} onChange={(e) => setForm({ ...form, minimum_withdrawal: Number(e.target.value) })} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Per Transfer Limit (₹)</Label>
                  <Input type="number" value={form.transaction_limit} onChange={(e) => setForm({ ...form, transaction_limit: Number(e.target.value) })} style={{ background: T.input, borderColor: T.border, color: T.text }} />
                </div>
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Perks (comma-separated list)</Label>
                <Textarea value={form.perks} onChange={(e) => setForm({ ...form, perks: e.target.value })} style={{ background: T.input, borderColor: T.border, color: T.text }} placeholder="24/7 Support, Lower Fees, etc." className="min-h-[60px]" />
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Upgrade Requirements</Label>
                <Textarea value={form.upgrade_requirements} onChange={(e) => setForm({ ...form, upgrade_requirements: e.target.value })} style={{ background: T.input, borderColor: T.border, color: T.text }} placeholder="Subscribe or maintain balance..." className="min-h-[60px]" />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 border-t pt-6" style={{ borderColor: T.border }}>
            <Button variant="outline" onClick={() => setDialogOpen(false)} style={{ background: "transparent", borderColor: T.border, color: T.text }}>Cancel</Button>
            <Button 
              onClick={() => saveMutation.mutate({ ...form, id: editingId || undefined })} 
              disabled={!form.name || saveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
            >
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? "Update Tier" : "Create Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(20px)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.text }}>Delete wallet tier?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.sub }}>This will permanently remove the tier. Users currently on this tier may experience issues. Consider clearing instead.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: "transparent", borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminWalletTypes;
