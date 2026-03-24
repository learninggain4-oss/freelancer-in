import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Crown, Shield, Zap, Star, Check, Infinity, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  Wallet, Crown, Shield, Zap, Star,
};

const tierGradients: Record<string, string> = {
  Silver: "from-slate-200 via-slate-100 to-slate-50 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900",
  Gold: "from-yellow-200 via-amber-100 to-yellow-50 dark:from-yellow-900 dark:via-amber-900 dark:to-yellow-950",
  Platinum: "from-purple-200 via-violet-100 to-purple-50 dark:from-purple-900 dark:via-violet-900 dark:to-purple-950",
  Diamond: "from-blue-200 via-sky-100 to-blue-50 dark:from-blue-900 dark:via-sky-900 dark:to-blue-950",
};

const tierShine: Record<string, string> = {
  Silver: "bg-gradient-to-br from-slate-400/20 to-transparent",
  Gold: "bg-gradient-to-br from-yellow-400/30 to-transparent",
  Platinum: "bg-gradient-to-br from-purple-400/20 to-transparent",
  Diamond: "bg-gradient-to-br from-blue-400/30 to-transparent",
};

const WalletTypes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const basePath = location.pathname.startsWith("/client") ? "/client" : "/employee";

  const { data: walletTypes = [], isLoading } = useQuery({
    queryKey: ["wallet-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_types")
        .select("*")
        .eq("is_active", true)
        .eq("is_cleared", false)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: upgradeRequests = [] } = useQuery({
    queryKey: ["wallet-upgrade-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wallet_upgrade_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (walletTypes.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Wallet Types</h1>
        <div className="rounded-xl border bg-card p-12 text-center">
          <Wallet className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No wallet types available yet.</p>
        </div>
      </div>
    );
  }

  const handleUpgrade = async (planName: string) => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    try {
      // Get current profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, wallet_type_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        toast.error("Profile not found");
        return;
      }

      // Get current wallet type name
      let currentType = "Silver";
      if (profile.wallet_type_id) {
        const { data: wt } = await supabase
          .from("wallet_types")
          .select("name")
          .eq("id", profile.wallet_type_id)
          .single();
        if (wt) currentType = wt.name;
      }

      // Check for existing pending request
      const { data: existing } = await supabase
        .from("wallet_upgrade_requests")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (existing && existing.length > 0) {
        toast.error("You already have a pending upgrade request");
        return;
      }

      const { error } = await supabase.from("wallet_upgrade_requests").insert({
        profile_id: profile.id,
        user_id: user.id,
        current_wallet_type: currentType,
        requested_wallet_type: planName,
        status: "pending",
      });

      if (error) throw error;
      toast.success(`Upgrade request for ${planName} submitted successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit upgrade request");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Wallet Plans</h1>
        <p className="text-sm text-muted-foreground">
          Choose the wallet tier that fits your needs. Silver is free for everyone!
        </p>
      </div>

      {/* Tier Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
        {walletTypes.map((wt) => {
          const IconComp = iconMap[wt.icon_name] || Wallet;
          const gradient = tierGradients[wt.name] || tierGradients.Silver;
          const shine = tierShine[wt.name] || tierShine.Silver;
          const isFree = wt.wallet_price === "Free";
          const isUnlimitedCapacity = Number(wt.wallet_max_capacity) === 0;
          const isUnlimitedWithdrawal = wt.monthly_withdrawal_limit === "Unlimited";

          const details = [
            {
              label: "Wallet Price",
              value: isFree ? "Free" : wt.wallet_price,
              highlight: isFree,
            },
            {
              label: "Monthly Min Balance",
              value: Number(wt.monthly_min_balance) === 0 ? "₹0" : `₹${Number(wt.monthly_min_balance).toLocaleString("en-IN")}`,
            },
            {
              label: "Monthly Withdrawals",
              value: isUnlimitedWithdrawal ? "Unlimited" : wt.monthly_withdrawal_limit,
              isUnlimited: isUnlimitedWithdrawal,
            },
            {
              label: "Wallet Capacity",
              value: isUnlimitedCapacity ? "Unlimited" : `₹${Number(wt.wallet_max_capacity).toLocaleString("en-IN")}`,
              isUnlimited: isUnlimitedCapacity,
            },
            {
              label: "Wallet Validity",
              value: wt.wallet_expiry || "Unlimited",
              isUnlimited: true,
            },
            {
              label: "Monthly Transactions",
              value: wt.monthly_transaction_limit,
            },
            {
              label: "Min Withdrawal",
              value: Number(wt.minimum_withdrawal) === 0 ? "₹0" : `₹${Number(wt.minimum_withdrawal).toLocaleString("en-IN")}`,
            },
          ];

          return (
            <div
              key={wt.id}
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl bg-gradient-to-br ${gradient}`}
              style={{ borderColor: `${wt.color}40` }}
            >
              {/* Shine overlay */}
              <div className={`pointer-events-none absolute inset-0 ${shine} opacity-60`} />

              {/* Top accent bar */}
              <div
                className="h-1.5 w-full"
                style={{ background: `linear-gradient(90deg, ${wt.color}, ${wt.color}88, ${wt.color})` }}
              />

              {/* Header */}
              <div className="relative px-5 pt-5 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${wt.color}, ${wt.color}CC)`,
                        boxShadow: `0 8px 24px ${wt.color}40`,
                      }}
                    >
                      <IconComp className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-foreground">{wt.name}</h2>
                      {wt.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground max-w-[200px]">{wt.description}</p>
                      )}
                    </div>
                  </div>
                  {isFree && (
                    <Badge
                      className="border-0 text-xs font-bold px-3 py-1 rounded-full shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, #10B981, #059669)`,
                        color: "white",
                      }}
                    >
                      FREE
                    </Badge>
                  )}
                </div>

                {/* Price tag */}
                {!isFree && (
                  <div className="mt-3 inline-flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-foreground">{wt.wallet_price?.replace("/Yearly", "")}</span>
                    <span className="text-xs font-medium text-muted-foreground">/year</span>
                  </div>
                )}
                {isFree && (
                  <div className="mt-3 inline-flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-foreground">₹0</span>
                    <span className="text-xs font-medium text-muted-foreground">forever</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="mx-5 h-px" style={{ background: `${wt.color}25` }} />

              {/* Details grid */}
              <div className="relative px-5 py-4 space-y-2.5">
                {details.map((detail) => (
                  <div key={detail.label} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{detail.label}</span>
                    <span className={`text-sm font-semibold flex items-center gap-1 ${detail.highlight ? "text-emerald-600 dark:text-emerald-400" : detail.isUnlimited ? "text-foreground" : "text-foreground"}`}>
                      {detail.isUnlimited && detail.value === "Unlimited" && (
                        <Infinity className="h-3.5 w-3.5" style={{ color: wt.color }} />
                      )}
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="mx-5 h-px" style={{ background: `${wt.color}25` }} />

              {/* Perks */}
              {wt.perks && (wt.perks as string[]).length > 0 && (
                <div className="relative px-5 py-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    What's included
                  </p>
                  <div className="space-y-2">
                    {(wt.perks as string[]).map((perk, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${wt.color}20` }}
                        >
                          <Check className="h-3 w-3" style={{ color: wt.color }} />
                        </div>
                        <span className="text-xs font-medium text-foreground">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upgrade note */}
              {wt.upgrade_requirements && !isFree && (
                <div className="px-5 pb-3">
                  <div
                    className="rounded-xl px-4 py-3 text-xs font-medium"
                    style={{
                      backgroundColor: `${wt.color}10`,
                      color: wt.color,
                      border: `1px dashed ${wt.color}30`,
                    }}
                  >
                    {wt.upgrade_requirements}
                  </div>
                </div>
              )}

              {/* Upgrade action */}
              <div className="px-5 pb-5">
                <Button
                  type="button"
                  className="w-full"
                  variant={isFree ? "secondary" : "default"}
                  disabled={isFree}
                  onClick={() => handleUpgrade(wt.name)}
                >
                  {isFree ? "Current Plan" : `Upgrade to ${wt.name}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Upgrade Request Status */}
      {upgradeRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">My Upgrade Requests</h2>
          <div className="space-y-2">
            {upgradeRequests.map((req: any) => {
              const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
                pending: { icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", label: "Pending" },
                approved: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", label: "Approved" },
                rejected: { icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800", label: "Rejected" },
              };
              const config = statusConfig[req.status] || statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <Card key={req.id} className={`flex items-center gap-3 border p-3 ${config.bg}`}>
                  <StatusIcon className={`h-5 w-5 shrink-0 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {req.current_wallet_type} → {req.requested_wallet_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {req.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">Note: {req.admin_notes}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={`shrink-0 ${config.color} border-current`}>
                    {config.label}
                  </Badge>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletTypes;
