import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Wallet,
  Crown,
  Shield,
  Zap,
  Star,
  Check,
  X,
  Infinity,
  CreditCard,
  Lock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// യഥാർത്ഥ മെറ്റാലിക് ലോഗോകളുടെ ലുക്ക് നൽകാൻ ഐക്കണുകളും അവയുടെ ക്ലാസുകളും മാപ്പ് ചെയ്യുന്നു
const iconMap: Record<string, React.ElementType> = {
  Wallet,
  Crown,
  Shield,
  Zap,
  Star,
};

const tierIconsStyles: Record<string, string> = {
  Silver: "drop-shadow-[0_0_8px_rgba(226,232,240,0.8)] text-slate-100 fill-slate-200",
  Gold: "drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] text-amber-200 fill-amber-300",
  Platinum: "drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] text-purple-200 fill-purple-300",
  Diamond: "drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] text-cyan-100 fill-cyan-200 animate-pulse",
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

// കംപാരസന് വേണ്ടി എല്ലാ പ്രധാന ഫീച്ചറുകളുടെയും ഒരു മാസ്റ്റർ ലിസ്റ്റ്
const ALL_POSSIBLE_PERKS = [
  "Basic Wallet Access",
  "Basic Customer Support",
  "Standard UPI Transfers",
  "Priority Customer Support",
  "Daily 8 Hours Rewards",
  "Learn & Earn Rewards",
  "Instant Cashouts",
  "Zero Transaction Fees",
  "Permanent Work Salary Rewards",
  "Exclusive Rewards & Cashback",
  "Dedicated Account Manager",
];

const WalletTypes = () => {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [withdrawalPassword, setWithdrawalPassword] = useState("");
  const [pendingPlan, setPendingPlan] = useState<{
    id: string;
    name: string;
    priceStr: string;
  } | null>(null);

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

  const { data: userProfile } = useQuery({
    queryKey: ["user-wallet-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, wallet_type_id, available_balance")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
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

  const handleUpgradeClick = (targetWalletId: string, planName: string, priceStr: string) => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }
    setWithdrawalPassword("");
    setPendingPlan({ id: targetWalletId, name: planName, priceStr });
    setIsConfirmOpen(true);
  };

  const processUpgrade = async () => {
    if (!user || !pendingPlan) return;

    if (!withdrawalPassword) {
      toast.error("Please enter your withdrawal password");
      return;
    }

    setIsUpgrading(true);
    try {
      const { data: verifyData, error: verifyErr } = await supabase.functions.invoke("withdrawal-password", {
        body: {
          action: "set",
          current_password: withdrawalPassword,
          password: withdrawalPassword,
        },
      });

      if (verifyErr || verifyData?.error) {
        toast.error("Incorrect withdrawal password. Please try again.");
        setIsUpgrading(false);
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, wallet_type_id, available_balance")
        .eq("user_id", user.id)
        .single();

      if (profileErr || !profile) {
        toast.error("Profile not found");
        setIsUpgrading(false);
        return;
      }

      const cleanPrice = pendingPlan.priceStr.replace(/[^0-9]/g, "");
      const planPrice = Number(cleanPrice) || 0;
      const currentBalance = Number(profile.available_balance) || 0;

      // ബാലൻസ് കുറവാണെങ്കിൽ ഫീമെയിൽ വോയ്‌സ് അലർട്ട് നൽകുന്ന ഭാഗം
      if (currentBalance < planPrice) {
        toast.error(
          `Insufficient wallet balance. You need ₹${planPrice.toLocaleString("en-IN")} to purchase this plan.`,
        );

        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();

          const speechText = "Insufficient balance in your wallet account. Please Add fund and Try again.";
          const utterance = new SpeechSynthesisUtterance(speechText);
          utterance.lang = "en-US";
          utterance.rate = 1.0;

          // ലഭ്യമായ ശബ്ദങ്ങളിൽ നിന്നും സ്ത്രീ ശബ്ദം (Female Voice) ഫിൽട്ടർ ചെയ്ത് എടുക്കുന്നു
          const voices = window.speechSynthesis.getVoices();
          const femaleVoice = voices.find((voice) => {
            const name = voice.name.toLowerCase();
            return (
              voice.lang.startsWith("en") &&
              (name.includes("female") ||
                name.includes("zira") ||
                name.includes("samantha") ||
                name.includes("google us english") ||
                name.includes("hazel"))
            );
          });

          // ഫീമെയിൽ ശബ്ദം ലഭ്യമാണെങ്കിൽ അത് സെറ്റ് ചെയ്യുന്നു
          if (femaleVoice) {
            utterance.voice = femaleVoice;
          }

          window.speechSynthesis.speak(utterance);
        }

        setIsUpgrading(false);
        return;
      }

      const newBalance = currentBalance - planPrice;
      const currentWalletType =
        walletTypes.find((wt) => wt.id === profile.wallet_type_id)?.name || "Silver";

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          available_balance: newBalance,
          wallet_type_id: pendingPlan.id,
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      const { error: upgradeHistoryError } = await supabase
        .from("wallet_upgrade_requests")
        .insert({
          profile_id: profile.id,
          user_id: user.id,
          current_wallet_type: currentWalletType,
          requested_wallet_type: pendingPlan.name,
          status: "approved",
          reviewed_at: new Date().toISOString(),
          admin_notes: `Wallet type upgrade paid from FlexPay Wallet. Amount: ₹${planPrice.toLocaleString("en-IN")}`,
        });

      if (upgradeHistoryError) {
        await supabase
          .from("profiles")
          .update({
            available_balance: currentBalance,
            wallet_type_id: profile.wallet_type_id,
          })
          .eq("id", profile.id);
        throw upgradeHistoryError;
      }

      toast.success(`₹${planPrice} deducted. Successfully updated plan to ${pendingPlan.name}!`);

      // -------------------------------------------------------------
      // വിജയകരമായി അപ്‌ഗ്രേഡ് ചെയ്താൽ നൽകേണ്ട പുതിയ ഫീമെയിൽ വോയ്‌സ് അലർട്ട്
      // -------------------------------------------------------------
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();

        const successSpeechText = `Thank you for upgrading your wallet to ${pendingPlan.name}. Your upgrade has been completed successfully, and your new benefits are now active.`;
        const successUtterance = new SpeechSynthesisUtterance(successSpeechText);
        successUtterance.lang = "en-US";
        successUtterance.rate = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find((voice) => {
          const name = voice.name.toLowerCase();
          return (
            voice.lang.startsWith("en") &&
            (name.includes("female") ||
              name.includes("zira") ||
              name.includes("samantha") ||
              name.includes("google us english") ||
              name.includes("hazel"))
          );
        });

        if (femaleVoice) {
          successUtterance.voice = femaleVoice;
        }

        window.speechSynthesis.speak(successUtterance);
      }

      if (refreshProfile) refreshProfile();

      await queryClient.invalidateQueries({ queryKey: ["user-wallet-profile", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["user-profile-tier", user.id] });

      setIsConfirmOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to process plan purchase");
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Wallet Plans</h1>
        <p className="text-sm text-muted-foreground">
          Choose the wallet tier that fits your needs. Silver is free for everyone!
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
        {walletTypes.map((wt) => {
          const IconComp = iconMap[wt.icon_name] || Wallet;
          const gradient = tierGradients[wt.name] || tierGradients.Silver;
          const shine = tierShine[wt.name] || tierShine.Silver;
          const iconStyle = tierIconsStyles[wt.name] || "text-white";
          const isFree = wt.wallet_price === "Free";
          const isUnlimitedCapacity = Number(wt.wallet_max_capacity) === 0;
          const isUnlimitedWithdrawal = wt.monthly_withdrawal_limit === "Unlimited";
          const isCurrentPlan = userProfile?.wallet_type_id === wt.id || (isFree && !userProfile?.wallet_type_id);

          const currentPerks = (wt.perks as string[]) || [];

          const cleanPrice = wt.wallet_price ? wt.wallet_price.replace(/[^0-9]/g, "") : "0";
          const numericPrice = Number(cleanPrice) || 0;
          const refundAmount = Math.round(numericPrice * 0.35);

          const details = [
            { label: "Wallet Price", value: isFree ? "Free" : wt.wallet_price, highlight: isFree },
            {
              label: "Monthly Min Balance",
              value:
                Number(wt.monthly_min_balance) === 0
                  ? "₹0"
                  : `₹${Number(wt.monthly_min_balance).toLocaleString("en-IN")}`,
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
            { label: "Monthly Transactions", value: wt.monthly_transaction_limit },
            {
              label: "Min Withdrawal",
              value:
                Number(wt.minimum_withdrawal) === 0
                  ? "₹0"
                  : `₹${Number(wt.minimum_withdrawal).toLocaleString("en-IN")}`,
            },
          ];

          return (
            <div
              key={wt.id}
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl bg-gradient-to-br ${gradient}`}
              style={{ borderColor: `${wt.color}40` }}
            >
              <div className={`pointer-events-none absolute inset-0 ${shine} opacity-60`} />
              <div
                className="h-1.5 w-full"
                style={{ background: `linear-gradient(90deg, ${wt.color}, ${wt.color}88, ${wt.color})` }}
              />

              <div className="relative px-5 pt-5 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-950 shadow-inner ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        boxShadow: `inset 0 2px 4px rgba(0,0,0,0.06), 0 8px 20px ${wt.color}25`,
                      }}
                    >
                      <IconComp className={`h-8 w-8 ${iconStyle}`} />
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
                      style={{ background: `linear-gradient(135deg, #10B981, #059669)`, color: "white" }}
                    >
                      FREE
                    </Badge>
                  )}
                </div>

                {!isFree && (
                  <div className="mt-3 flex flex-col gap-1">
                    <div className="inline-flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-foreground">
                        {wt.wallet_price?.replace("/Yearly", "")}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">/year</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 w-fit">
                      <RefreshCw className="h-3 w-3 animate-pulse" />
                      <span>35% Refund Available: ₹{refundAmount.toLocaleString("en-IN")} after 1 year</span>
                    </div>
                  </div>
                )}
                {isFree && (
                  <div className="mt-3 inline-flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-foreground">₹0</span>
                    <span className="text-xs font-medium text-muted-foreground">forever</span>
                  </div>
                )}
              </div>

              <div className="mx-5 h-px" style={{ background: `${wt.color}25` }} />

              <div className="relative px-5 py-4 space-y-2.5">
                {details.map((detail) => (
                  <div key={detail.label} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{detail.label}</span>
                    <span
                      className={`text-sm font-semibold flex items-center gap-1 ${detail.highlight ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}
                    >
                      {detail.isUnlimited && detail.value === "Unlimited" && (
                        <Infinity className="h-3.5 w-3.5" style={{ color: wt.color }} />
                      )}
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mx-5 h-px" style={{ background: `${wt.color}25` }} />

              <div className="relative px-5 py-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Features & Comparison
                </p>
                <div className="space-y-2">
                  {ALL_POSSIBLE_PERKS.map((perk, i) => {
                    const hasPerk = currentPerks.some((p) => p.toLowerCase().trim() === perk.toLowerCase().trim());

                    return (
                      <div key={i} className={`flex items-center gap-2 ${!hasPerk ? "opacity-40" : ""}`}>
                        {hasPerk ? (
                          <div
                            className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${wt.color}20` }}
                          >
                            <Check className="h-3 w-3" style={{ color: wt.color }} />
                          </div>
                        ) : (
                          <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-muted">
                            <X className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <span
                          className={`text-xs font-medium ${hasPerk ? "text-foreground" : "line-through text-muted-foreground"}`}
                        >
                          {perk}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {wt.upgrade_requirements && !isFree && (
                <div className="px-5 pb-3">
                  <div
                    className="rounded-xl px-4 py-3 text-xs font-medium"
                    style={{ backgroundColor: `${wt.color}10`, color: wt.color, border: `1px dashed ${wt.color}30` }}
                  >
                    {wt.upgrade_requirements}
                  </div>
                </div>
              )}

              <div className="px-5 pb-5">
                {isFree && isCurrentPlan ? (
                  <Button type="button" className="w-full" variant="secondary" disabled={true}>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="w-full gap-2 font-semibold shadow-md bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => handleUpgradeClick(wt.id, wt.name, wt.wallet_price)}
                  >
                    <CreditCard className="h-4 w-4" />
                    {isCurrentPlan ? `Renew / Buy ${wt.name}` : `Pay ${wt.wallet_price}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="sm:max-w-[420px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Plan Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to select the <span className="font-bold text-foreground">{pendingPlan?.name}</span>{" "}
              plan? An amount of <span className="font-bold text-foreground">{pendingPlan?.priceStr}</span> will be
              deducted directly from your wallet balance.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Withdrawal Password
            </label>
            <input
              type="password"
              placeholder="Enter your security password"
              value={withdrawalPassword}
              onChange={(e) => setWithdrawalPassword(e.target.value)}
              disabled={isUpgrading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring tracking-wider"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpgrading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-foreground text-background hover:bg-foreground/95 gap-2"
              onClick={(e) => {
                e.preventDefault();
                processUpgrade();
              }}
              disabled={isUpgrading || !withdrawalPassword}
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Verify & Pay"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WalletTypes;
