import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Crown, Zap, Star, ChevronRight, ChevronDown, Check, Infinity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const tierIcons: Record<string, React.ElementType> = {
  Silver: Shield,
  Gold: Star,
  Platinum: Crown,
  Diamond: Zap,
};

const tierColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Silver: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700", glow: "from-slate-400/20" },
  Gold: { bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", glow: "from-amber-400/20" },
  Platinum: { bg: "bg-purple-50 dark:bg-purple-950", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800", glow: "from-purple-400/20" },
  Diamond: { bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800", glow: "from-blue-400/20" },
};

interface WalletTypeBadgeProps {
  balance: number;
  compact?: boolean;
}

const WalletTypeBadge = ({ balance, compact = false }: WalletTypeBadgeProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const { data: walletTypes = [] } = useQuery({
    queryKey: ["wallet-types-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_types")
        .select("*")
        .eq("is_active", true)
        .eq("is_cleared", false)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const currentTier = walletTypes.length > 0 ? walletTypes[0] : null;
  const tierName = currentTier?.name ?? "Silver";
  const Icon = tierIcons[tierName] ?? Shield;
  const colors = tierColors[tierName] ?? tierColors.Silver;

  if (!currentTier) return null;

  if (compact) {
    return (
      <button
        onClick={() => navigate("/wallet-types")}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${colors.bg} ${colors.text} ${colors.border}`}
      >
        <Icon className="h-3 w-3" />
        {tierName}
      </button>
    );
  }

  const isUnlimitedWithdrawal = currentTier.monthly_withdrawal_limit === "Unlimited";
  const isUnlimitedCapacity = Number(currentTier.wallet_max_capacity) === 0;
  const isFree = currentTier.wallet_price === "Free";

  const features = [
    { label: "Wallet Price", value: isFree ? "Free" : currentTier.wallet_price },
    { label: "Monthly Min Balance", value: Number(currentTier.monthly_min_balance) === 0 ? "₹0" : `₹${Number(currentTier.monthly_min_balance).toLocaleString("en-IN")}` },
    { label: "Monthly Withdrawals", value: isUnlimitedWithdrawal ? "Unlimited" : currentTier.monthly_withdrawal_limit, unlimited: isUnlimitedWithdrawal },
    { label: "Wallet Capacity", value: isUnlimitedCapacity ? "Unlimited" : `₹${Number(currentTier.wallet_max_capacity).toLocaleString("en-IN")}`, unlimited: isUnlimitedCapacity },
    { label: "Wallet Validity", value: currentTier.wallet_expiry || "Unlimited" },
    { label: "Monthly Transactions", value: currentTier.monthly_transaction_limit },
    { label: "Min Withdrawal", value: Number(currentTier.minimum_withdrawal) === 0 ? "₹0" : `₹${Number(currentTier.minimum_withdrawal).toLocaleString("en-IN")}` },
    { label: "Max Withdrawal", value: "Check plan details" },
  ];

  const perks = (currentTier as any).perks;
  const perksList: string[] = Array.isArray(perks) ? perks : [];

  return (
    <div className={`relative overflow-hidden rounded-xl border transition-all ${colors.bg} ${colors.border}`}>
      <div className={`absolute inset-0 bg-gradient-to-r ${colors.glow} to-transparent opacity-50`} />

      {/* Header - clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="relative flex w-full items-center gap-3 p-3.5 transition-all hover:shadow-md active:scale-[0.99]"
      >
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg} ring-2 ring-inset ${colors.border}`}>
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
        <div className="flex-1 text-left">
          <p className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{tierName} Wallet</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isFree ? "Free tier" : currentTier.wallet_price}
            {" · "}
            {currentTier.monthly_withdrawal_limit} withdrawal{currentTier.monthly_withdrawal_limit !== "1" && currentTier.monthly_withdrawal_limit !== "Unlimited" ? "s" : ""}/mo
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 ${colors.text} transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expandable features panel */}
      <div
        className={`relative overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-2">
            {features.map((f) => (
              <div key={f.label} className="rounded-lg bg-background/60 px-3 py-2">
                <p className="text-[10px] font-medium text-muted-foreground">{f.label}</p>
                <p className="text-xs font-bold text-foreground flex items-center gap-1">
                  {(f as any).unlimited && <Infinity className="h-3 w-3 text-accent" />}
                  {f.value}
                </p>
              </div>
            ))}
          </div>

          {/* Perks */}
          {perksList.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Perks</p>
              {perksList.map((perk, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className={`h-3.5 w-3.5 shrink-0 ${colors.text}`} />
                  <span className="text-xs text-foreground">{perk}</span>
                </div>
              ))}
            </div>
          )}

          {/* View all plans link */}
          <button
            onClick={() => navigate("/wallet-types")}
            className={`flex w-full items-center justify-center gap-1 rounded-lg border py-2 text-xs font-semibold transition-all hover:shadow-sm active:scale-[0.98] ${colors.border} ${colors.text}`}
          >
            View All Plans <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletTypeBadge;
