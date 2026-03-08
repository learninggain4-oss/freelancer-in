import { Wallet, Clock, Copy, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface WalletCardProps {
  name: string;
  userCode: string;
  walletNumber?: string | null;
  availableBalance: number;
  holdBalance: number;
  compact?: boolean;
}

const WalletCard = ({
  name,
  userCode,
  walletNumber,
  availableBalance,
  holdBalance,
  compact = false,
}: WalletCardProps) => {
  const totalBalance = availableBalance + holdBalance;

  const copyWalletNumber = () => {
    if (walletNumber) {
      navigator.clipboard.writeText(walletNumber);
      toast.success("Wallet number copied!");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/85 to-primary/60 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600 p-5 text-primary-foreground shadow-lg animate-fade-in">
      {/* Decorative elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-foreground/10" />
      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-primary-foreground/5" />
      <div className="absolute right-4 top-4 opacity-10">
        <CreditCard className="h-10 w-10" />
      </div>

      {/* Header */}
      <div className="relative flex items-center gap-2 text-sm font-medium text-primary-foreground/80">
        <Wallet className="h-4 w-4" />
        <span>Freelancer Wallet</span>
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
