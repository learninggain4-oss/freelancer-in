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
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, ArchiveRestore } from "lucide-react";

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
  wallet_expiry: "Unlimited",
  perks: "",
  upgrade_requirements: "",
  display_order: 0,
  is_active: true,
};

const AdminWalletTypes = () => {
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

  const openEdit = (wt: any) => {
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
      wallet_expiry: wt.wallet_expiry || "Unlimited",
      perks: (wt.perks || []).join(", "),
      upgrade_requirements: wt.upgrade_requirements || "",
      display_order: wt.display_order,
      is_active: wt.is_active,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">Wallet Types</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCleared(!showCleared)}>
            {showCleared ? <EyeOff className="mr-1.5 h-4 w-4" /> : <Eye className="mr-1.5 h-4 w-4" />}
            {showCleared ? "Hide Cleared" : "Show Cleared"}
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Tier
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : walletTypes.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No wallet types found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletTypes.map((wt) => (
                  <TableRow key={wt.id} className={wt.is_cleared ? "opacity-50" : ""}>
                    <TableCell>{wt.display_order}</TableCell>
                    <TableCell className="font-medium">{wt.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: wt.color }} />
                        <span className="text-xs text-muted-foreground">{wt.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{wt.wallet_price}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      Cap: {Number(wt.wallet_max_capacity) === 0 ? "∞" : `₹${Number(wt.wallet_max_capacity).toLocaleString("en-IN")}`} |
                      W/M: {wt.monthly_withdrawal_limit}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={wt.is_active ? "default" : "secondary"}>
                          {wt.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {wt.is_cleared && <Badge variant="outline">Cleared</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(wt)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => clearMutation.mutate({ id: wt.id, cleared: !wt.is_cleared })}>
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(wt.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Create"} Wallet Type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Gold" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Icon Name</Label>
                <Input value={form.icon_name} onChange={(e) => setForm({ ...form, icon_name: e.target.value })} placeholder="Wallet, Crown, Shield, Zap, Star" />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 w-9 cursor-pointer rounded border-0" />
                  <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Wallet Price</Label>
                <Input value={form.wallet_price} onChange={(e) => setForm({ ...form, wallet_price: e.target.value })} placeholder="Free or ₹2,500/Yearly" />
              </div>
              <div className="grid gap-2">
                <Label>Wallet Expiry</Label>
                <Input value={form.wallet_expiry} onChange={(e) => setForm({ ...form, wallet_expiry: e.target.value })} placeholder="Unlimited" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Monthly Min Balance (₹)</Label>
                <Input type="number" value={form.monthly_min_balance} onChange={(e) => setForm({ ...form, monthly_min_balance: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Wallet Max Capacity (₹)</Label>
                <Input type="number" value={form.wallet_max_capacity} onChange={(e) => setForm({ ...form, wallet_max_capacity: Number(e.target.value) })} placeholder="0 for unlimited" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Monthly Withdrawal Limit</Label>
                <Input value={form.monthly_withdrawal_limit} onChange={(e) => setForm({ ...form, monthly_withdrawal_limit: e.target.value })} placeholder="1 or Unlimited" />
              </div>
              <div className="grid gap-2">
                <Label>Monthly Transaction Limit</Label>
                <Input value={form.monthly_transaction_limit} onChange={(e) => setForm({ ...form, monthly_transaction_limit: e.target.value })} placeholder="10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Min Withdrawal (₹)</Label>
                <Input type="number" value={form.minimum_withdrawal} onChange={(e) => setForm({ ...form, minimum_withdrawal: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Per Transaction Limit (₹)</Label>
                <Input type="number" value={form.transaction_limit} onChange={(e) => setForm({ ...form, transaction_limit: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Perks (comma-separated)</Label>
              <Textarea value={form.perks} onChange={(e) => setForm({ ...form, perks: e.target.value })} placeholder="e.g. Free Wallet, Help & Support" />
            </div>
            <div className="grid gap-2">
              <Label>Upgrade Requirements</Label>
              <Textarea value={form.upgrade_requirements} onChange={(e) => setForm({ ...form, upgrade_requirements: e.target.value })} placeholder="e.g. Subscribe for ₹2,500/year" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Display Order</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: editingId || undefined })} disabled={!form.name || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete wallet type?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Consider clearing instead.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminWalletTypes;
