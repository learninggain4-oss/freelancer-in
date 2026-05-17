import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import WalletCard from "@/components/wallet/WalletCard";
import WalletTypeBadge from "@/components/wallet/WalletTypeBadge";
import TransferDialog from "@/components/wallet/TransferDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertCircle, Receipt, History, Wallet, ArrowLeft,
  PlusCircle, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  warm:  { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", input:"#fffdf7", nav:"#fef0d0", badge:"rgba(217,119,6,.1)", badgeFg:"#b45309" },
  forest: { bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", input:"#ffffff", nav:"#dcfce7", badge:"rgba(22,163,74,.1)", badgeFg:"#15803d" },
  ocean: { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", input:"#ffffff", nav:"#e0f2fe", badge:"rgba(14,165,233,.1)", badgeFg:"#0369a1" },
};

const STATUS_CFG = {
  pending:  { icon: Clock,         color: "#f59e0b", bg: "rgba(245,158,11,.1)",  label: "Pending" },
  approved: { icon: CheckCircle2,  color: "#10b981", bg: "rgba(16,185,129,.1)", label: "Approved" },
  rejected: { icon: XCircle,       color: "#ef4444", bg: "rgba(239,68,68,.1)",  label: "Rejected" },
} as const;

const fmt = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const EmployeeWallet = () => {
  const { profile, refreshProfile } = useAuth();
  const [showTransfer, setShowTransfer] = useState(false);
  const [showDeposits, setShowDeposits] = useState(true);
  const depositsRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.startsWith("/freelancer") ? "/freelancer" : "/employee";
  const { theme } = useDashboardTheme();
  const T = TH[theme];

  const { data: depositData, isLoading: depositsLoading } = useQuery({
    queryKey: ["my-deposit-requests", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("wallet-operations", {
        body: { action: "my_deposit_requests" },
      });
      if (error || data?.error) return [];
      return data?.requests || [];
    },
    enabled: !!profile?.id,
    refetchInterval: 30000,
  });

  // Handle scanned wallet from QR scanner
  useEffect(() => {
    const state = location.state as { scannedWallet?: string } | null;
    if (state?.scannedWallet) {
      setShowTransfer(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const openDepositSection = () => {
    setShowDeposits(true);
    setTimeout(() => depositsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

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
          name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Freelancer"}
          userCode={Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—"}
          walletNumber={profile?.wallet_number}
          availableBalance={profile?.available_balance ?? 0}
          holdBalance={profile?.hold_balance ?? 0}
          walletActive={(profile as any)?.wallet_active ?? true}
          onAddMoney={openDepositSection}
          onTransfer={() => setShowTransfer(true)}
          onWithdraw={() => navigate(`${base}/wallet/withdraw`)}
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
          onClick={() => navigate(`${base}/wallet/transactions`)}
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
          onClick={() => navigate(`${base}/wallet/withdrawals`)}
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

      {/* Deposit History */}
      <div ref={depositsRef} className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <button
          onClick={() => setShowDeposits(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl mb-3"
          style={{ background: T.card, border: `1px solid ${T.border}` }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,.1)" }}>
              <PlusCircle className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black" style={{ color: T.text }}>Deposit Requests</p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>
                {depositData?.length ? `${depositData.length} request${depositData.length !== 1 ? "s" : ""}` : "No requests yet"}
              </p>
            </div>
          </div>
          {showDeposits ? <ChevronUp className="h-4 w-4" style={{ color: T.sub }} /> : <ChevronDown className="h-4 w-4" style={{ color: T.sub }} />}
        </button>

        {showDeposits && (
          <div className="space-y-2">
            {depositsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              </div>
            ) : !depositData?.length ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-2xl"
                style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <PlusCircle className="h-8 w-8 opacity-20" style={{ color: T.sub }} />
                <p className="text-sm font-bold" style={{ color: T.sub }}>No deposit requests yet</p>
                <button onClick={openDepositSection}
                  className="mt-1 text-xs font-black text-indigo-400 underline underline-offset-2">
                  Make your first deposit →
                </button>
              </div>
            ) : depositData.map((dep: any) => {
              const st = STATUS_CFG[dep.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
              const Icon = st.icon;
              return (
                <div key={dep.id} className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: T.card, border: `1px solid ${T.border}` }}>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: st.bg }}>
                    <Icon className="h-5 w-5" style={{ color: st.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black" style={{ color: T.text }}>{fmt(dep.amount)}</p>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <p className="text-xs truncate" style={{ color: T.sub }}>{dep.payment_method} · {dep.order_id}</p>
                    <p className="text-[10px]" style={{ color: T.sub }}>{fmtDate(dep.created_at)}</p>
                    {dep.admin_notes && dep.status !== "pending" && (
                      <p className="text-[10px] mt-0.5 italic" style={{ color: T.sub }}>Note: {dep.admin_notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transfer Dialog */}
      <TransferDialog
        open={showTransfer}
        onOpenChange={setShowTransfer}
        initialWalletNumber={(location.state as any)?.scannedWallet || ""}
        maxBalance={profile?.available_balance ?? 0}
        onSuccess={() => {
          refreshProfile();
          queryClient.invalidateQueries({ queryKey: ["freelancer-transactions"] });
        }}
      />
    </div>
  );
};

export default EmployeeWallet;
