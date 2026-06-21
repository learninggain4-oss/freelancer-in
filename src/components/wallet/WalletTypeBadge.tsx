import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Crown, Zap, Star, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// യഥാർത്ഥ മെറ്റാലിക് ലോഗോകളുടെ ഫീൽ വരാൻ കളറുകളും ഐക്കണുകളും കസ്റ്റം ഡിസൈൻ ചെയ്തിരിക്കുന്നു
const tierIcons: Record<string, React.ElementType> = {
  Silver: Shield,
  Gold: Star,
  Platinum: Crown,
  Diamond: Zap,
};

const tierColors: Record<string, { bg: string; text: string; border: string; glow: string; iconClass: string }> = {
  Silver: {
    bg: "bg-slate-100 dark:bg-slate-900/50",
    text: "text-slate-600 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
    glow: "from-slate-400/20",
    iconClass: "drop-shadow-[0_0_8px_rgba(148,163,184,0.6)] text-slate-500 fill-slate-300 dark:fill-slate-600",
  },
  Gold: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-800",
    glow: "from-amber-400/20",
    iconClass: "drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] text-amber-500 fill-amber-400 dark:fill-amber-500",
  },
  Platinum: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-300 dark:border-purple-800",
    glow: "from-purple-400/20",
    iconClass: "drop-shadow-[0_0_10px_rgba(168,85,247,0.6)] text-purple-500 fill-purple-300 dark:fill-purple-600",
  },
  Diamond: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-800",
    glow: "from-blue-400/20",
    iconClass:
      "drop-shadow-[0_0_12px_rgba(59,130,246,0.7)] text-blue-500 fill-blue-400 dark:fill-blue-500 animate-pulse",
  },
};

interface WalletTypeBadgeProps {
  balance: number;
  compact?: boolean;
}

const WalletTypeBadge = ({ balance, compact = false }: WalletTypeBadgeProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const basePath = location.pathname.startsWith("/employer") ? "/employer" : "/freelancer";

  // യൂസറുടെ നിലവിലെ പ്രൊഫൈൽ വിവരങ്ങൾ എടുക്കുന്നു
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-tier", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("wallet_type_id").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

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

  // യൂസറുടെ പ്രൊഫൈലിലെ wallet_type_id മാച്ച് ചെയ്യുന്ന പ്ലാൻ കണ്ടെത്തുന്നു, ഇല്ലെങ്കിൽ ഡിഫോൾട്ട് Silver (ആദ്യ പ്ലാൻ)
  const currentTier =
    walletTypes.find((wt) => wt.id === userProfile?.wallet_type_id) || (walletTypes.length > 0 ? walletTypes[0] : null);

  const tierName = currentTier?.name ?? "Silver";
  const Icon = tierIcons[tierName] ?? Shield;
  const colors = tierColors[tierName] ?? tierColors.Silver;

  if (!currentTier) return null;

  if (compact) {
    return (
      <button
        onClick={() => navigate(`${basePath}/wallet-types`)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}
      >
        <Icon className={`h-3 w-3 ${colors.iconClass}`} />
        {tierName}
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(`${basePath}/wallet-types`)}
      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-3.5 transition-all hover:shadow-md active:scale-[0.98] ${colors.bg} ${colors.border}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${colors.glow} to-transparent opacity-40`} />

      {/* പ്രീമിയം ലോഗോ ലുക്കിനായുള്ള കണ്ടെയ്നർ ബോക്സ് */}
      <div
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-950 shadow-inner ring-1 ring-black/5 dark:ring-white/10`}
      >
        <Icon className={`h-6 w-6 ${colors.iconClass}`} />
      </div>

      <div className="relative flex-1 text-left">
        <p className={`text-xs font-black uppercase tracking-wider ${colors.text}`}>{tierName} Wallet</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {String(currentTier.wallet_price) === "Free" ? "Free tier" : currentTier.wallet_price}
          {" · "}
          {currentTier.monthly_withdrawal_limit} withdrawal
          {currentTier.monthly_withdrawal_limit !== "1" && currentTier.monthly_withdrawal_limit !== "Unlimited"
            ? "s"
            : ""}
          /mo
        </p>
      </div>
      <ChevronRight className={`relative h-4 w-4 ${colors.text} transition-transform group-hover:translate-x-0.5`} />
    </button>
  );
};

export default WalletTypeBadge;
