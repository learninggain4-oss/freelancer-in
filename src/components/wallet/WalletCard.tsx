import { useState, useCallback } from "react";
import { Wallet, Clock, Copy, CreditCard, QrCode, PlusCircle, ArrowLeftRight, Shield, Star, Crown, Zap, ScanLine, ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const tierIcons: Record<string, React.ElementType> = {
  Silver: Shield,
  Gold: Star,
  Platinum: Crown,
  Diamond: Zap,
};

const tierLabelColors: Record<string, string> = {
  Silver: "bg-slate-500/20 text-slate-200",
  Gold: "bg-amber-500/20 text-amber-200",
  Platinum: "bg-purple-500/20 text-purple-200",
  Diamond: "bg-cyan-500/20 text-cyan-200",
};

interface WalletCardProps {
  name: string;
  userCode: string;
  walletNumber?: string | null;
  availableBalance: number;
  holdBalance: number;
  compact?: boolean;
  walletActive?: boolean;
  onAddMoney?: () => void;
  onTransfer?: () => void;
  onWithdraw?: () => void;
}

const WalletCard = ({
  name,
  userCode,
  walletNumber,
  availableBalance,
  holdBalance,
  compact = false,
  walletActive = true,
  onAddMoney,
  onTransfer,
  onWithdraw,
}: WalletCardProps) => {
  const totalBalance = availableBalance + holdBalance;
  const [pressed, setPressed] = useState(false);
  const navigate = useNavigate();

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
  const TierIcon = tierIcons[tierName] ?? Shield;
  const tierColor = tierLabelColors[tierName] ?? tierLabelColors.Silver;

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
      {/* Shimmer sweep */}
      <div className={`pointer-events-none absolute inset-0 ${pressed ? "animate-shimmer-fast" : "animate-shimmer"}`}>
        <div className={`h-full w-1/2 bg-gradient-to-r from-transparent to-transparent skew-x-[-20deg] transition-colors duration-150 ${pressed ? "via-primary-foreground/25" : "via-primary-foreground/10"}`} />
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-foreground/10" />
      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-primary-foreground/5" />
      <div className="absolute right-4 top-4 opacity-10">
        <CreditCard className="h-10 w-10" />
      </div>

      {/* Header with wallet type */}
      <div className="relative flex items-center gap-2 text-sm font-medium text-primary-foreground/80">
        <Wallet className="h-4 w-4" />
        <span>FlexPay Wallet</span>
        <span className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tierColor}`}>
          <TierIcon className="h-3 w-3" />
          {tierName}
        </span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${walletActive ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/25 text-red-200"}`}>
          {walletActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Main balance */}
      <div className="relative mt-4">
        <p className="text-3xl font-extrabold tracking-tight">
          ₹{availableBalance.toLocaleString("en-IN")}
        </p>
        <p className="mt-0.5 text-xs text-primary-foreground/70">Available Balance</p>
      </div>

      {/* Secondary info */}
      <div className="relative mt-3 flex items-center gap-4 text-xs text-primary-foreground/80">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          ₹{holdBalance.toLocaleString("en-IN")} on hold
        </span>
        <span className="font-semibold text-primary-foreground/90">
          Total: ₹{totalBalance.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Action Buttons Row */}
      {!compact && walletActive && (
        <div className="relative mt-4 flex items-center gap-2 flex-wrap">
          {onAddMoney && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddMoney(); }}
              className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/25 active:scale-95"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Money
            </button>
          )}
          {onTransfer && (
            <button
              onClick={(e) => { e.stopPropagation(); onTransfer(); }}
              className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/25 active:scale-95"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Transfer
            </button>
          )}
          {onWithdraw && (
            <button
              onClick={(e) => { e.stopPropagation(); onWithdraw(); }}
              className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/25 active:scale-95"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Withdraw
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/wallet/scan`); }}
            className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/25 active:scale-95"
          >
            <ScanLine className="h-3.5 w-3.5" />
            Scan QR
          </button>
          {walletNumber && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/wallet/qr`); }}
              className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-all hover:bg-primary-foreground/25 active:scale-95 ml-auto"
            >
              <QrCode className="h-3.5 w-3.5" />
              My QR
            </button>
          )}
        </div>
      )}

      {/* Footer: name, code, wallet number */}
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
          <span className="shrink-0 rounded-md bg-primary-foreground/15 px-2 py-1 text-xs font-bold">
            {userCode}
          </span>
        </div>
      )}
    </div>
  );
};

export default WalletCard;
