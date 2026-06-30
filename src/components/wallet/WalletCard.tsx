import { useState, useCallback, useEffect } from "react";
import {
  Wallet,
  Clock,
  Copy,
  CreditCard,
  PlusCircle,
  ArrowLeftRight,
  Shield,
  Star,
  Crown,
  Zap,
  ScanLine,
  ArrowDownToLine,
  Settings,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getFirstTimeDepositCashback, getActionBadgePercentages } from "@/utils/deposit-utils";

// യഥാർത്ഥ മെറ്റാലിക് ലോഗോകളുടെ ഫീൽ ലഭിക്കാൻ കസ്റ്റം ഐക്കൺ കളറുകൾ ഡിസൈൻ ചെയ്തിരിക്കുന്നു
const tierIcons: Record<string, React.ElementType> = {
  Silver: Shield,
  Gold: Star,
  Platinum: Crown,
  Diamond: Zap,
};

const tierLabelColors: Record<string, { badge: string; iconClass: string }> = {
  Silver: {
    badge: "bg-slate-500/30 text-slate-100 border border-slate-400/30 backdrop-blur-md",
    iconClass: "drop-shadow-[0_0_6px_rgba(226,232,240,0.6)] text-slate-300 fill-slate-300",
  },
  Gold: {
    badge: "bg-amber-500/30 text-amber-100 border border-amber-400/30 backdrop-blur-md",
    iconClass: "drop-shadow-[0_0_8px_rgba(245,158,11,0.7)] text-amber-300 fill-amber-300",
  },
  Platinum: {
    badge: "bg-purple-500/30 text-purple-100 border border-purple-400/30 backdrop-blur-md",
    iconClass: "drop-shadow-[0_0_8px_rgba(168,85,247,0.7)] text-purple-300 fill-purple-300",
  },
  Diamond: {
    badge: "bg-cyan-500/30 text-cyan-100 border border-cyan-400/30 backdrop-blur-md animate-pulse",
    iconClass: "drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] text-cyan-200 fill-cyan-300",
  },
};

interface WalletCardProps {
  name: string;
  userCode: string;
  walletNumber?: string | null;
  availableBalance: number;
  holdBalance: number;
  compact?: boolean;
  walletActive?: boolean;
  profileId?: string;
  onAddMoney?: () => void;
  onTransfer?: () => void;
  onWithdraw?: () => void;
  onWalletSettings?: () => void;
}

const WalletCard = ({
  name,
  userCode,
  walletNumber,
  availableBalance,
  holdBalance,
  compact = false,
  walletActive = true,
  profileId,
  onAddMoney,
  onTransfer,
  onWithdraw,
  onWalletSettings,
}: WalletCardProps) => {
  const totalBalance = availableBalance + holdBalance;
  const [pressed, setPressed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cashbackPercent, setCashbackPercent] = useState(0);
  const [badgePercentages, setBadgePercentages] = useState({
    addMoneyPercent: 0,
    transferPercent: 0,
    withdrawPercent: 0,
  });

  // യൂസറുടെ നിലവിലെ പ്രൊഫൈൽ ഇൻഫർമേഷൻ ക്വറി ചെയ്യുന്നു
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

  useEffect(() => {
    const loadCashback = async () => {
      try {
        const cashback = await getFirstTimeDepositCashback();
        setCashbackPercent(cashback);
      } catch (e) {}
    };
    loadCashback();
  }, []);

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const badges = await getActionBadgePercentages();
        setBadgePercentages(badges);
      } catch (e) {}
    };
    loadBadges();
  }, []);

  // പ്രൊഫൈലിലെ പ്ലാൻ ഐഡി വെച്ച് കറന്റ് പ്ലാൻ മാറ്റുന്നു
  const currentTier =
    walletTypes.find((wt) => wt.id === userProfile?.wallet_type_id) || (walletTypes.length > 0 ? walletTypes[0] : null);
  const tierName = currentTier?.name ?? "Silver";
  const TierIcon = tierIcons[tierName] ?? Shield;
  const tierStyle = tierLabelColors[tierName] ?? tierLabelColors.Silver;

  const handlePress = useCallback(() => {
    setPressed(true);
    setTimeout(() => setPressed(false), 600);
  }, []);

  const copyWalletNumber = () => {
    if (walletNumber) {
      navigator.clipboard.writeText(walletNumber);
      toast.success("Wallet number copied!");
    }
  };

  const basePath = window.location.pathname.includes("/employer/") ? "/employer" : "/freelancer";

  return (
    <div
      onPointerDown={handlePress}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-wallet-from via-wallet-via to-wallet-to p-5 text-primary-foreground shadow-lg animate-fade-in select-none transition-transform duration-150 ${!walletActive ? "grayscale opacity-75" : ""}`}
    >
      <div className={`pointer-events-none absolute inset-0 ${pressed ? "animate-shimmer-fast" : "animate-shimmer"}`}>
        <div
          className={`h-full w-1/2 bg-gradient-to-r from-transparent to-transparent skew-x-[-20deg] transition-colors duration-150 ${pressed ? "via-primary-foreground/25" : "via-primary-foreground/10"}`}
        />
      </div>

      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-foreground/10" />
      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-primary-foreground/5" />
      <div className="absolute right-4 top-4 opacity-10">
        <CreditCard className="h-10 w-10" />
      </div>

      <div className="relative flex items-center gap-2 text-sm font-medium text-primary-foreground/80">
        <Wallet className="h-4 w-4" />
        <span>FlexPay Wallet</span>

        {/* റിയൽ ലോഗോ ബാഡ്ജ് ലുക്ക് ഇവിടെ നൽകിയിരിക്കുന്നു */}
        <span
          className={`ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm ${tierStyle.badge}`}
        >
          <TierIcon className={`h-3 w-3 ${tierStyle.iconClass}`} />
          {tierName}
        </span>

        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${walletActive ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/25 text-red-200"}`}
        >
          {walletActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="relative mt-4">
        <p className="text-3xl font-extrabold tracking-tight">₹{availableBalance.toLocaleString("en-IN")}</p>
        <p className="mt-0.5 text-xs text-primary-foreground/70">Available Balance</p>
      </div>

      <div className="relative mt-3 flex items-center gap-4 text-xs text-primary-foreground/80">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />₹{holdBalance.toLocaleString("en-IN")} on hold
        </span>
        <span className="font-semibold text-primary-foreground/90">Total: ₹{totalBalance.toLocaleString("en-IN")}</span>
      </div>

      {!compact && walletActive && (
        <div className="relative mt-4 flex items-center gap-2 flex-wrap">
          {onAddMoney && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddMoney();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/25 active:scale-95"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add
              </button>
              {cashbackPercent > 0 && (
                <div
                  className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #22c55e, #10b981)",
                    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.4)",
                  }}
                >
                  <span>🎉</span>
                  <span>{cashbackPercent}%</span>
                </div>
              )}
            </div>
          )}
          {onTransfer && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTransfer();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/25 active:scale-95"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Transfer
              </button>
            </div>
          )}
          {onWithdraw && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onWithdraw();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/25 active:scale-95"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Withdraw
              </button>
            </div>
          )}
          {onWalletSettings && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWalletSettings();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/25 active:scale-95"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`${basePath}/wallet/scan`);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/25 active:scale-95"
          >
            <ScanLine className="h-3.5 w-3.5" />
            Scan QR
          </button>

          {/* New My QR Button Added Here */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`${basePath}/wallet/my-qr`);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/25 active:scale-95"
          >
            <QrCode className="h-3.5 w-3.5" />
            My QR
          </button>
        </div>
      )}

      {!compact && (
        <div className="relative mt-4 flex items-end justify-between border-t border-primary-foreground/15 pt-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            {walletNumber && (
              <button
                onClick={copyWalletNumber}
                className="mt-0.5 flex items-center gap-1 text-xs text-primary-foreground/70 transition-colors hover:text-primary-foreground active:scale-95"
              >
                Wallet: {walletNumber}
                <Copy className="h-3 w-3" />
              </button>
            )}
          </div>
          <span className="shrink-0 rounded-md bg-primary-foreground/15 px-2 py-1 text-xs font-bold">{userCode}</span>
        </div>
      )}
    </div>
  );
};

export default WalletCard;
