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
  ArrowLeft,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Button } from "@/components/ui/button";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const EmployeeWallet = () => {
  const { profile, refreshProfile } = useAuth();
  const [showTransfer, setShowTransfer] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useDashboardTheme();
  const T = TH[theme];

  // Handle scanned wallet from QR scanner
  useEffect(() => {
    const state = location.state as { scannedWallet?: string } | null;
    if (state?.scannedWallet) {
      setShowTransfer(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text }} className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }} className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl animate-fade-in-up">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate(-1)}
              className="h-10 w-10 text-white hover:bg-white/20 rounded-2xl backdrop-blur-md">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-xl">
              <Wallet className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">My Wallet</h1>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Financial Terminal</p>
            </div>
          </div>
          <WalletTypeBadge balance={profile?.available_balance ?? 0} compact />
        </div>
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
        <div style={{ background: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.2)" }} className="flex items-start gap-4 rounded-2xl border p-5 text-sm text-[#f87171] animate-fade-in-up shadow-lg backdrop-blur-md">
          <AlertCircle className="mt-0.5 h-6 w-6 shrink-0" />
          <div className="flex-1">
            <p className="font-black uppercase tracking-widest text-[10px] mb-1">Terminal Locked</p>
            <p className="font-medium opacity-90 leading-relaxed">Your wallet is currently inactive. Withdrawals are disabled. Please contact command center.</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <button
          onClick={() => navigate("/employee/wallet/transactions")}
          style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}
          className="group flex flex-col items-center justify-center gap-4 rounded-3xl p-6 border shadow-xl transition-all hover:bg-white/[0.02] hover:shadow-2xl active:scale-95"
        >
          <div style={{ background: "rgba(99,102,241,0.1)" }} className="flex h-16 w-16 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 shadow-lg">
            <Receipt className="h-8 w-8 text-[#6366f1]" />
          </div>
          <div className="text-center">
            <p style={{ color: T.text }} className="text-sm font-black uppercase tracking-widest">Logs</p>
            <p style={{ color: T.sub }} className="text-[10px] font-bold uppercase tracking-tighter opacity-60 mt-1">Transactions</p>
          </div>
        </button>
        <button
          onClick={() => navigate("/employee/wallet/withdrawals")}
          style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}
          className="group flex flex-col items-center justify-center gap-4 rounded-3xl p-6 border shadow-xl transition-all hover:bg-white/[0.02] hover:shadow-2xl active:scale-95"
        >
          <div style={{ background: "rgba(167,139,250,0.1)" }} className="flex h-16 w-16 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 shadow-lg">
            <History className="h-8 w-8 text-[#a78bfa]" />
          </div>
          <div className="text-center">
            <p style={{ color: T.text }} className="text-sm font-black uppercase tracking-widest">History</p>
            <p style={{ color: T.sub }} className="text-[10px] font-bold uppercase tracking-tighter opacity-60 mt-1">Withdrawals</p>
          </div>
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
