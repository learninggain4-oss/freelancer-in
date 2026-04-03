import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Crown, Zap, Star, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

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
  const location = useLocation();
  const basePath = location.pathname.startsWith("/employer") ? "/employer" : "/freelancer";

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

  // Determine current tier based on balance thresholds
  // For now, everyone starts at Silver (free). Higher tiers require subscription.
  // We show Silver as default since tier assignment isn't tracked per-user yet.
  const currentTier = walletTypes.length > 0 ? walletTypes[0] : null;
  const tierName = currentTier?.name ?? "Silver";
  const Icon = tierIcons[tierName] ?? Shield;
  const colors = tierColors[tierName] ?? tierColors.Silver;

  if (!currentTier) return null;

  if (compact) {
    return (
      <button
      onClick={() => navigate(`${basePath}/wallet-types`)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${colors.bg} ${colors.text} ${colors.border}`}
      >
        <Icon className="h-3 w-3" />
        {tierName}
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(`${basePath}/wallet-types`)}
      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-3.5 transition-all hover:shadow-md active:scale-[0.98] ${colors.bg} ${colors.border}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${colors.glow} to-transparent opacity-50`} />
      <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg} ring-2 ring-inset ${colors.border}`}>
        <Icon className={`h-5 w-5 ${colors.text}`} />
      </div>
      <div className="relative flex-1 text-left">
        <p className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{tierName} Wallet</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {currentTier.wallet_price === "Free" ? "Free tier" : currentTier.wallet_price}
          {" · "}
          {currentTier.monthly_withdrawal_limit} withdrawal{currentTier.monthly_withdrawal_limit !== "1" && currentTier.monthly_withdrawal_limit !== "Unlimited" ? "s" : ""}/mo
        </p>
      </div>
      <ChevronRight className={`relative h-4 w-4 ${colors.text} transition-transform group-hover:translate-x-0.5`} />
    </button>
  );
};

export default WalletTypeBadge;
