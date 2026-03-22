import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import WalletCard from "@/components/wallet/WalletCard";
import WalletTypeBadge from "@/components/wallet/WalletTypeBadge";
import TransferDialog from "@/components/wallet/TransferDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertCircle,
  Receipt,
  History,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const EmployeeWallet = () => {
  const { profile, refreshProfile } = useAuth();
  const [showTransfer, setShowTransfer] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scanned wallet from QR scanner
  useEffect(() => {
    const state = location.state as { scannedWallet?: string } | null;
    if (state?.scannedWallet) {
      setShowTransfer(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="space-y-5 p-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">My Wallet</h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage your funds & withdrawals</p>
        </div>
        <WalletTypeBadge balance={profile?.available_balance ?? 0} compact />
      </div>

      {/* Wallet Card */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <WalletCard
          name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Employee"}
          userCode={Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—"}
          walletNumber={profile?.wallet_number}
          availableBalance={profile?.available_balance ?? 0}
          holdBalance={profile?.hold_balance ?? 0}
          walletActive={(profile as any)?.wallet_active ?? true}
          onTransfer={() => setShowTransfer(true)}
          onWithdraw={() => navigate("/employee/wallet/withdraw")}
        />
      </div>

      {/* Wallet Type Card */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
        <WalletTypeBadge balance={profile?.available_balance ?? 0} />
      </div>

      {/* Wallet Inactive Warning */}
      {!(profile as any)?.wallet_active && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive animate-fade-in-up">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your wallet is currently inactive. Withdrawals are disabled. Please contact support.</span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <button
          onClick={() => navigate("/employee/wallet/transactions")}
          className="group flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-border active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Transactions</p>
            <p className="text-[11px] text-muted-foreground">View history</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          onClick={() => navigate("/employee/wallet/withdrawals")}
          className="group flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-border active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 transition-transform group-hover:scale-110">
            <History className="h-5 w-5 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Withdrawals</p>
            <p className="text-[11px] text-muted-foreground">Track requests</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Transfer Dialog */}
      <TransferDialog
        open={showTransfer}
        onOpenChange={setShowTransfer}
        initialWalletNumber={(location.state as any)?.scannedWallet || ""}
        maxBalance={profile?.available_balance ?? 0}
        onSuccess={() => {
          refreshProfile();
          queryClient.invalidateQueries({ queryKey: ["employee-transactions"] });
        }}
      />
    </div>
  );
};

export default EmployeeWallet;
