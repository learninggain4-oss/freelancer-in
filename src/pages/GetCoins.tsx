import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Coins, CheckCircle, Briefcase, Calendar, Star, Users, Trophy,
  IndianRupee, Loader2, Sparkles, ArrowRight, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GetCoins = () => {
  const { profile, refreshProfile } = useAuth();
  const [coinRate, setCoinRate] = useState<number>(100);
  const [minCoins, setMinCoins] = useState<number>(250);
  const [converting, setConverting] = useState(false);
  const [totalRedeemed, setTotalRedeemed] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const [rewards, setRewards] = useState({
    complete_profile: 1000, complete_project: 2000, daily_attendance: 3000, star_review: 3000, referral_10: 10000,
  });

  const userCoins = (profile as any)?.coin_balance ?? 0;

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("app_settings").select("key, value").in("key", [
        "coin_conversion_rate", "min_coin_conversion", "coin_reward_complete_profile",
        "coin_reward_complete_project", "coin_reward_daily_attendance", "coin_reward_5star_review", "coin_reward_referral_10",
      ]);
      if (data) {
        for (const row of data) {
          if (row.key === "coin_conversion_rate") setCoinRate(Number(row.value) || 100);
          if (row.key === "min_coin_conversion") setMinCoins(Number(row.value) || 250);
          if (row.key === "coin_reward_complete_profile") setRewards((p) => ({ ...p, complete_profile: Number(row.value) || 1000 }));
          if (row.key === "coin_reward_complete_project") setRewards((p) => ({ ...p, complete_project: Number(row.value) || 2000 }));
          if (row.key === "coin_reward_daily_attendance") setRewards((p) => ({ ...p, daily_attendance: Number(row.value) || 3000 }));
          if (row.key === "coin_reward_5star_review") setRewards((p) => ({ ...p, star_review: Number(row.value) || 3000 }));
          if (row.key === "coin_reward_referral_10") setRewards((p) => ({ ...p, referral_10: Number(row.value) || 10000 }));
        }
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    supabase.from("coin_reward_claims" as any).select("reward_type").eq("profile_id", profile.id)
      .then(({ data }) => { if (data) setClaimedRewards((data as any[]).map((r) => r.reward_type)); });
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return;
    supabase.from("coin_transactions" as any).select("amount").eq("profile_id", profile.id).eq("type", "conversion")
      .then(({ data }) => { if (data) setTotalRedeemed((data as any[]).reduce((s: number, t: any) => s + Math.abs(t.amount), 0)); });
  }, [profile]);

  const handleConvert = async () => {
    if (userCoins < minCoins) return;
    setConverting(true);
    try {
      const { data, error } = await supabase.functions.invoke("coin-operations", { body: { action: "convert_coins" } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Converted ${data.coins_converted} coins to ₹${Number(data.rupees_credited).toFixed(2)}`);
      await refreshProfile();
      setTotalRedeemed((prev) => prev + (data.coins_converted || 0));
    } catch (err: any) { toast.error(err.message || "Conversion failed"); }
    finally { setConverting(false); }
  };

  const isCompleted = (rewardType: string) => claimedRewards.includes(rewardType);

  const earnActivities = [
    { icon: CheckCircle, text: "Complete Your Profile", coins: rewards.complete_profile, rewardType: "complete_profile", color: "text-accent", bg: "bg-accent/10" },
    { icon: Briefcase, text: "Complete a Project", coins: rewards.complete_project, rewardType: "complete_project", color: "text-primary", bg: "bg-primary/10" },
    { icon: Calendar, text: "Daily Attendance Present", coins: rewards.daily_attendance, rewardType: "daily_attendance", color: "text-warning", bg: "bg-warning/10" },
    { icon: Star, text: "Receive a 5-Star Review", coins: rewards.star_review, rewardType: "5star_review", color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: Users, text: "Refer 10 Friends", coins: rewards.referral_10, rewardType: "referral_10", color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-5 p-4 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 p-5 text-white">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Get Coins</h1>
            <p className="text-xs opacity-80">Earn & convert to wallet balance</p>
          </div>
        </div>
      </div>

      {/* Conversion Rate */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400" />
        <CardContent className="flex items-center justify-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <span className="text-lg font-bold text-foreground">{coinRate}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-1">
            <IndianRupee className="h-4 w-4 text-accent" />
            <span className="text-lg font-bold text-accent">1</span>
          </div>
        </CardContent>
      </Card>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
          <CardContent className="relative flex flex-col items-center p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 mb-2">
              <Coins className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{userCoins.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Available Coins</p>
            <p className="text-[10px] text-muted-foreground">≈ ₹{(userCoins / coinRate).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
          <CardContent className="relative flex flex-col items-center p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 mb-2">
              <Trophy className="h-6 w-6 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalRedeemed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Redeemed</p>
          </CardContent>
        </Card>
      </div>

      {/* How to Earn */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-amber-500" /> How to Earn Coins
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {earnActivities.map((item, i) => {
            const completed = isCompleted(item.rewardType);
            return (
              <div key={i} className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${completed ? "bg-accent/5 border border-accent/10" : "hover:bg-muted/30"}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${completed ? "bg-accent/10" : item.bg}`}>
                  <item.icon className={`h-4.5 w-4.5 ${completed ? "text-accent" : item.color}`} />
                </div>
                <span className={`flex-1 text-sm ${completed ? "text-accent font-medium" : "text-foreground"}`}>{item.text}</span>
                {completed ? (
                  <Badge className="border-0 bg-accent/10 text-accent text-[10px] gap-1">
                    <CheckCircle className="h-3 w-3" /> Done
                  </Badge>
                ) : (
                  <span className="text-sm font-bold text-amber-500">+{item.coins.toLocaleString()}</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Convert Button */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-accent via-primary to-accent" />
        <CardContent className="py-5 space-y-3">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Min <span className="font-bold text-foreground">{minCoins.toLocaleString()}</span> coins required
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You have {userCoins.toLocaleString()} coins (≈ ₹{(userCoins / coinRate).toFixed(2)})
            </p>
          </div>
          <Button
            className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-500/90 hover:to-amber-600/90 shadow-sm"
            disabled={userCoins < minCoins || converting}
            onClick={handleConvert}
          >
            {converting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {converting ? "Converting..." : userCoins >= minCoins
              ? `Convert ${userCoins.toLocaleString()} Coins to ₹${(userCoins / coinRate).toFixed(2)}`
              : `Need ${(minCoins - userCoins).toLocaleString()} more coins`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GetCoins;
