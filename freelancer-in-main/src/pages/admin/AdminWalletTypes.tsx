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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  ArchiveRestore,
  Layers,
  LayoutGrid,
  Check,
  X,
  RefreshCw,
  Wallet,
  Crown,
  Shield,
  Zap,
  Star,
} from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { cn } from "@/lib/utils";

const TH = {
  black: {
    bg: "#070714",
    card: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.08)",
    text: "#e2e8f0",
    sub: "#94a3b8",
    input: "rgba(255,255,255,.07)",
    nav: "rgba(255,255,255,.04)",
    badge: "rgba(99,102,241,.2)",
    badgeFg: "#a5b4fc",
  },
  white: {
    bg: "#f0f4ff",
    card: "#ffffff",
    border: "rgba(0,0,0,.08)",
    text: "#1e293b",
    sub: "#64748b",
    input: "#f8fafc",
    nav: "#f1f5f9",
    badge: "rgba(99,102,241,.1)",
    badgeFg: "#4f46e5",
  },
  wb: {
    bg: "#f0f4ff",
    card: "#ffffff",
    border: "rgba(0,0,0,.08)",
    text: "#1e293b",
    sub: "#64748b",
    input: "#f8fafc",
    nav: "#f1f5f9",
    badge: "rgba(99,102,241,.1)",
    badgeFg: "#4f46e5",
  },
};

const iconMap: Record<string, React.ElementType> = {
  Wallet,
  Crown,
  Shield,
  Zap,
  Star,
};

// യഥാർത്ഥ മെറ്റാലിക് ലോഗോകളുടെ ലുക്ക് നൽകാൻ ഐക്കണുകളും അവയുടെ പ്രീമിയം സ്റ്റൈലുകളും മാപ്പ് ചെയ്യുന്നു
const tierIconsStyles: Record<string, string> = {
  Silver: "drop-shadow-[0_0_8px_rgba(148,163,184,0.7)] text-slate-300 fill-slate-300",
  Gold: "drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] text-amber-300 fill-amber-300",
  Platinum: "drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] text-purple-300 fill-purple-300",
  Diamond: "drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] text-cyan-200 fill-cyan-300 animate-pulse",
};

interface WalletTypeRow {
  id: string;
  name: string;
  description?: string | null;
  icon_name?: string | null;
  color?: string | null;
  monthly_min_balance?: number | null;
  wallet_max_capacity?: number | null;
  transaction_limit?: number | null;
  wallet_price?: string | null;
  monthly_withdrawal_limit?: string | null;
  monthly_transaction_limit?: string | null;
  minimum_withdrawal?: number | null;
  wallet_price_monthly?: number | null;
  wallet_expiry?: string | null;
  perks?: any | null;
  upgrade_requirements?: string | null;
  display_order: number;
  is_active: boolean;
  is_cleared?: boolean;
  refund_amount_35?: number | null;
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
  perks: string[];
  upgrade_requirements: string;
  display_order: number;
  is_active: boolean;
  refund_amount_35: number;
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
  perks: [],
  upgrade_requirements: "",
  display_order: 0,
  is_active: true,
  refund_amount_35: 0,
};

const ALL_POSSIBLE_PERKS = [
  "Basic Wallet Access",
  "Basic Customer Support",
  "Standard UPI Transfers",
  "Priority Customer Support",
  "Daily 8 Hours Rewards",
  "Learn & Earn Rewards",
  "Instant Cashouts",
  "Zero Transaction Fees",
  "Permanent Work Salary Rewards",
  "Exclusive Rewards & Cashback",
  "Dedicated Account Manager",
];

const AdminWalletTypes = () => {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const queryClient = useQueryClient();
  const [showCleared, setShowCleared] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WalletTypeForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: walletTypes = [], isLoading } = useQuery<WalletTypeRow[]>({
    queryKey: ["admin-wallet-types", showCleared],
    queryFn: async () => {
      let query = supabase.from("wallet_types").select("*").order("display_order");
      if (!showCleared) query = query.eq("is_cleared", false);
      const { data, error } = await query;
      if (error) throw error;
      return data as WalletTypeRow[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: WalletTypeForm & { id?: string }) => {
      const payload: any = {
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
        perks: data.perks,
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
      const { error } = await supabase
        .from("wallet_types")
        .update({ is_cleared: cleared } as any)
        .eq("id", id);
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

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (wt: WalletTypeRow) => {
    const cleanPrice = wt.wallet_price ? wt.wallet_price.replace(/[^0-9]/g, "") : "0";
    const autoCalculatedRefund = Math.round((Number(cleanPrice) || 0) * 0.35);

    setEditingId(wt.id);
    setForm({
      name: wt.name,
      description: wt.description || "",
      icon_name: wt.icon_name || "Wallet",
      color: wt.color || "#2563EB",
      monthly_min_balance: Number(wt.monthly_min_balance || 0),
      wallet_max_capacity: Number(wt.wallet_max_capacity || 0),
      transaction_limit: Number(wt.transaction_limit || 0),
      wallet_price: wt.wallet_price || "Free",
      monthly_withdrawal_limit: wt.monthly_withdrawal_limit || "1",
      monthly_transaction_limit: wt.monthly_transaction_limit || "10",
      minimum_withdrawal: Number(wt.minimum_withdrawal || 0),
      wallet_price_monthly: Number(wt.wallet_price_monthly || 0),
      wallet_expiry: wt.wallet_expiry || "Unlimited",
      perks: Array.isArray(wt.perks) ? wt.perks : [],
      upgrade_requirements: wt.upgrade_requirements || "",
      display_order: wt.display_order,
      is_active: wt.is_active,
      refund_amount_35:
        wt.refund_amount_35 !== undefined && wt.refund_amount_35 !== null
          ? Number(wt.refund_amount_35)
          : autoCalculatedRefund,
    });
    setDialogOpen(true);
  };

  const handlePerkToggle = (perk: string) => {
    const isSelected = form.perks.includes(perk);
    if (isSelected) {
      setForm({ ...form, perks: form.perks.filter((p) => p !== perk) });
    } else {
      setForm({ ...form, perks: [...form.perks, perk] });
    }
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
            <Button onClick={openCreate} className="rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl">
              <Plus className="mr-2 h-4 w-4" />
              Add New Tier
            </Button>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div
        className="rounded-3xl border p-6 transition-all hover:shadow-xl"
        style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p style={{ color: T.sub }}>Loading wallet tiers...</p>
          </div>
        ) : walletTypes.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border-2 border-dashed" style={{ borderColor: T.border }}>
            <LayoutGrid className="mx-auto h-12 w-12 opacity-20 mb-4" style={{ color: T.text }} />
            <p className="text-lg font-medium" style={{ color: T.text }}>
              No wallet types found
            </p>
            <p style={{ color: T.sub }}>Start by creating your first wallet tier.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: T.border }}>
            <Table>
              <TableHeader>
                <TableRow
                  style={{
                    borderColor: T.border,
                    background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                  }}
                >
                  <TableHead className="w-16" style={{ color: T.sub }}>
                    Order
                  </TableHead>
                  <TableHead style={{ color: T.sub }}>Tier Name & Logo</TableHead>
                  <TableHead style={{ color: T.sub }}>Price & Refund Info</TableHead>
                  <TableHead style={{ color: T.sub }}>Included Features</TableHead>
                  <TableHead style={{ color: T.sub }}>Status</TableHead>
                  <TableHead className="text-right" style={{ color: T.sub }}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletTypes.map((wt) => {
                  const currentPerks = (wt.perks as string[]) || [];
                  const cleanPrice = wt.wallet_price ? wt.wallet_price.replace(/[^0-9]/g, "") : "0";
                  const autoRefund = Math.round((Number(cleanPrice) || 0) * 0.35);
                  const displayRefund =
                    wt.refund_amount_35 !== undefined && wt.refund_amount_35 !== null
                      ? wt.refund_amount_35
                      : autoRefund;

                  const IconComp = iconMap[wt.icon_name || "Wallet"] || Wallet;
                  const iconStyle = tierIconsStyles[wt.name] || "text-slate-400";

                  return (
                    <TableRow
                      key={wt.id}
                      className={cn("transition-colors", wt.is_cleared && "opacity-50")}
                      style={{ borderColor: T.border }}
                    >
                      <TableCell className="font-mono text-xs" style={{ color: T.sub }}>
                        #{wt.display_order}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* പ്രീമിയം ഇൻഡസ്ട്രിയൽ മെറ്റാലിക് ലോഗോ ഫീൽ നൽകാൻ ഇന്നർ ഷാഡോയോട് കൂടിയ കണ്ടെയ്നർ */}
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-900 shadow-inner ring-1 ring-black/5 dark:ring-white/10"
                            style={{
                              boxShadow: `inset 0 2px 4px rgba(0,0,0,0.06), 0 4px 12px ${wt.color || "#ccc"}20`,
                            }}
                          >
                            <IconComp className={`h-5 w-5 ${iconStyle}`} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold" style={{ color: T.text }}>
                              {wt.name}
                            </span>
                            {wt.is_cleared && (
                              <Badge
                                variant="outline"
                                className="text-[9px] py-0 px-1 w-fit border-red-500/30 text-red-500 bg-red-500/10 mt-0.5"
                              >
                                Cleared
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-bold" style={{ color: T.text }}>
                            {wt.wallet_price}
                          </span>
                          {wt.wallet_price !== "Free" && (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                              <RefreshCw className="h-3 w-3" />
                              <span>35% Refund: ₹{displayRefund.toLocaleString("en-IN")}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="max-w-[300px]">
                        <div className="flex flex-wrap gap-1.5">
                          {ALL_POSSIBLE_PERKS.map((perk, idx) => {
                            const hasPerk = currentPerks.some(
                              (p) => p.toLowerCase().trim() === perk.toLowerCase().trim(),
                            );
                            return (
                              <Badge
                                key={idx}
                                variant="outline"
                                className={cn(
                                  "text-[10px] py-0 px-1.5 flex items-center gap-1 transition-all",
                                  hasPerk
                                    ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5 font-semibold"
                                    : "border-slate-500/20 text-slate-400 opacity-40 line-through",
                                )}
                              >
                                {hasPerk ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                                {perk}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>

                      <TableCell>
                        {wt.is_active ? (
                          <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/10">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-500/30 text-slate-500 bg-slate-500/10">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            style={{ color: T.sub }}
                            onClick={() => openEdit(wt)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            style={{ color: T.sub }}
                            onClick={() => clearMutation.mutate({ id: wt.id, cleared: !wt.is_cleared })}
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                            onClick={() => setDeleteId(wt.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
          style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(20px)" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: T.text }}>
              {editingId ? "Edit Tier Details" : "Create New Wallet Tier"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Tier Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ background: T.input, borderColor: T.border, color: T.text }}
                  placeholder="e.g. Gold Tier"
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ background: T.input, borderColor: T.border, color: T.text }}
                  placeholder="Briefly describe this tier..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Icon Name</Label>
                  <Input
                    value={form.icon_name}
                    onChange={(e) => setForm({ ...form, icon_name: e.target.value })}
                    style={{ background: T.input, borderColor: T.border, color: T.text }}
                    placeholder="Wallet, Star, Crown, Shield, Zap"
                  />
                  {/* പ്രിവ്യൂ ലോഗോ ഇവിടെ തത്സമയം കാണാൻ സാധിക്കും */}
                  {iconMap[form.icon_name] && (
                    <div
                      className="flex items-center gap-2 mt-1.5 p-1.5 rounded-lg border bg-black/5 dark:bg-white/5"
                      style={{ borderColor: T.border }}
                    >
                      <span className="text-[10px]" style={{ color: T.sub }}>
                        Logo Preview:
                      </span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white dark:bg-slate-950 shadow-inner">
                        {(() => {
                          const PreviewIcon = iconMap[form.icon_name] || Wallet;
                          const previewStyle = tierIconsStyles[form.name] || "text-indigo-500";
                          return <PreviewIcon className={`h-4 w-4 ${previewStyle}`} />;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent"
                    />
                    <Input
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      style={{ background: T.input, borderColor: T.border, color: T.text }}
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Display Price String</Label>
                  <Input
                    value={form.wallet_price}
                    onChange={(e) => {
                      const val = e.target.value;
                      const cleanPrice = val ? val.replace(/[^0-9]/g, "") : "0";
                      const autoRefund = Math.round((Number(cleanPrice) || 0) * 0.35);
                      setForm({ ...form, wallet_price: val, refund_amount_35: autoRefund });
                    }}
                    style={{ background: T.input, borderColor: T.border, color: T.text }}
                    placeholder="Free / ₹2,500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1" style={{ color: T.text }}>
                    <RefreshCw className="h-3 w-3 text-emerald-500" /> 35% Refund (₹)
                  </Label>
                  <Input
                    type="number"
                    value={form.refund_amount_35 || 0}
                    onChange={(e) => setForm({ ...form, refund_amount_35: Number(e.target.value) })}
                    style={{ background: T.input, borderColor: T.border, color: T.text }}
                    disabled={form.wallet_price === "Free"}
                    placeholder="Calculated automatically"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Display Order</Label>
                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                    style={{ background: T.input, borderColor: T.border, color: T.text }}
                  />
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
                  <Input
                    type="number"
                    value={form.monthly_min_balance}
                    onChange={(e) => setForm({ ...form, monthly_min_balance: Number(e.target.value) })}
                    style={{ background: T.input, borderColor: T.border, color: T.text }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Max Capacity (₹)</Label>
                  <Input
                    type="number"
                    value={form.wallet_max_capacity}
                    onChange={(e) => setForm({ ...form, wallet_max_capacity: Number(e.target.value) })}
                    style={{ background: T.input, borderColor: T.border, color: T.text }}
                    placeholder="0 = Unlimited"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Withdrawals / Mo</Label>
                  <Input
                    value={form.monthly_withdrawal_limit}
                    onChange={(e) => setForm({ ...form, monthly_withdrawal_limit: e.target.value })}
                    style={{ background: T.input, borderColor: T.border, color: T.text }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Transfers / Mo</Label>
                  <Input
                    value={form.monthly_transaction_limit}
                    onChange={(e) => setForm({ ...form, monthly_transaction_limit: e.target.value })}
                    style={{ background: T.input, borderColor: T.border, color: T.text }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Min Withdrawal (₹)</Label>
                  <Input
                    type="number"
                    value={form.minimum_withdrawal}
                    onChange={(e) => setForm({ ...form, minimum_withdrawal: Number(e.target.value) })}
                    style={{ background: T.input, borderColor: T.border, color: T.text }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: T.text }}>Per Transfer Limit (₹)</Label>
                  <Input
                    type="number"
                    value={form.transaction_limit}
                    onChange={(e) => setForm({ ...form, transaction_limit: Number(e.target.value) })}
                    style={{ background: T.input, borderColor: T.border, color: T.text }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label style={{ color: T.text }}>Select Included Perks</Label>
                <div
                  className="rounded-xl border p-3.5 space-y-2.5 max-h-[160px] overflow-y-auto"
                  style={{ background: T.input, borderColor: T.border }}
                >
                  {ALL_POSSIBLE_PERKS.map((perk) => {
                    const isChecked = form.perks.includes(perk);
                    return (
                      <div key={perk} className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium" style={{ color: T.text }}>
                          {perk}
                        </span>
                        <Switch checked={isChecked} onCheckedChange={() => handlePerkToggle(perk)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label style={{ color: T.text }}>Upgrade Requirements</Label>
                <Textarea
                  value={form.upgrade_requirements}
                  onChange={(e) => setForm({ ...form, upgrade_requirements: e.target.value })}
                  style={{ background: T.input, borderColor: T.border, color: T.text }}
                  placeholder="Subscribe or maintain balance..."
                  className="min-h-[60px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 border-t pt-6" style={{ borderColor: T.border }}>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              style={{ background: "transparent", borderColor: T.border, color: T.text }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate({ ...form, id: editingId || undefined })}
              disabled={!form.name || saveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : editingId ? (
                "Update Tier"
              ) : (
                "Create Tier"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(20px)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.text }}>Delete wallet tier?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.sub }}>
              This will permanently remove the tier. Users currently on this tier may experience issues. Consider
              clearing instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: "transparent", borderColor: T.border, color: T.text }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminWalletTypes;
