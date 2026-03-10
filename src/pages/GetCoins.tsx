import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, CheckCircle, Briefcase, Calendar, Star, Users, Trophy, IndianRupee, Loader2 } from "lucide-react";
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
    complete_profile: 1000,
    complete_project: 2000,
    daily_attendance: 3000,
    star_review: 3000,
    referral_10: 10000,
  });

  const userCoins = (profile as any)?.coin_balance ?? 0;

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [
          "coin_conversion_rate",
          "min_coin_conversion",
          "coin_reward_complete_profile",
          "coin_reward_complete_project",
          "coin_reward_daily_attendance",
          "coin_reward_5star_review",
          "coin_reward_referral_10",
        ]);
      if (data) {
        for (const row of data) {
          if (row.key === "coin_conversion_rate") setCoinRate(Number(row.value) || 100);
          if (row.key === "min_coin_conversion") setMinCoins(Number(row.value) || 250);
          if (row.key === "coin_reward_complete_profile")
            setRewards((prev) => ({ ...prev, complete_profile: Number(row.value) || 1000 }));
          if (row.key === "coin_reward_complete_project")
            setRewards((prev) => ({ ...prev, complete_project: Number(row.value) || 2000 }));
          if (row.key === "coin_reward_daily_attendance")
            setRewards((prev) => ({ ...prev, daily_attendance: Number(row.value) || 3000 }));
          if (row.key === "coin_reward_5star_review")
            setRewards((prev) => ({ ...prev, star_review: Number(row.value) || 3000 }));
          if (row.key === "coin_reward_referral_10")
            setRewards((prev) => ({ ...prev, referral_10: Number(row.value) || 10000 }));
        }
      }
    };
    fetchSettings();
  }, []);

  // Fetch claimed reward types
  useEffect(() => {
    if (!profile?.id) return;
    const fetchClaimed = async () => {
      const { data } = await supabase
        .from("coin_reward_claims" as any)
        .select("reward_type")
        .eq("profile_id", profile.id);
      if (data) {
        setClaimedRewards((data as any[]).map((r) => r.reward_type));
      }
    };
    fetchClaimed();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return;
    const fetchRedeemed = async () => {
      const { data } = await supabase
        .from("coin_transactions" as any)
        .select("amount")
        .eq("profile_id", profile.id)
        .eq("type", "conversion");
      if (data) {
        const total = (data as any[]).reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
        setTotalRedeemed(total);
      }
    };
    fetchRedeemed();
  }, [profile]);

  const handleConvert = async () => {
    if (userCoins < minCoins) return;
    setConverting(true);
    try {
      const { data, error } = await supabase.functions.invoke("coin-operations", {
        body: { action: "convert_coins" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Converted ${data.coins_converted} coins to ₹${Number(data.rupees_credited).toFixed(2)}`);
      await refreshProfile();
      setTotalRedeemed((prev) => prev + (data.coins_converted || 0));
    } catch (err: any) {
      toast.error(err.message || "Conversion failed");
    } finally {
      setConverting(false);
    }
  };

  // Check if a reward type has been claimed
  const isCompleted = (rewardType: string) => claimedRewards.includes(rewardType);

  const earnActivities = [
    { icon: CheckCircle, text: "Complete Your Profile", coins: rewards.complete_profile, rewardType: "complete_profile" },
    { icon: Briefcase, text: "Complete a Project", coins: rewards.complete_project, rewardType: "complete_project" },
    { icon: Calendar, text: "Daily Attendance Present", coins: rewards.daily_attendance, rewardType: "daily_attendance" },
    { icon: Star, text: "Receive a 5-Star Review", coins: rewards.star_review, rewardType: "5star_review" },
    { icon: Users, text: "Refer 10 Friends", coins: rewards.referral_10, rewardType: "referral_10" },
  ];

  return (
    <div className="space-y-6 px-4 py-6">
      <h2 className="text-2xl font-bold text-foreground">Get Coins</h2>

      {/* Conversion Rate Card */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5">
        <CardContent className="flex items-center justify-center gap-3 py-5">
          <Coins className="h-6 w-6 text-amber-500" />
          <span className="text-lg font-bold text-foreground">{coinRate} Coins</span>
          <span className="text-muted-foreground">=</span>
          <span className="flex items-center text-lg font-bold text-accent">
            <IndianRupee className="h-4 w-4" />1
          </span>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-5 w-5 text-primary" />
            Your Coins
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Complete activities on the platform and earn coins that you can convert to wallet balance!
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-background p-3 text-center">
              <Coins className="mx-auto mb-1 h-5 w-5 text-amber-500" />
              <p className="text-xl font-bold text-foreground">{userCoins}</p>
              <p className="text-xs text-muted-foreground">Available Coins</p>
              <p className="text-[10px] text-muted-foreground">≈ ₹{(userCoins / coinRate).toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-background p-3 text-center">
              <Trophy className="mx-auto mb-1 h-5 w-5 text-amber-500" />
              <p className="text-xl font-bold text-foreground">{totalRedeemed}</p>
              <p className="text-xs text-muted-foreground">Redeemed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How to Earn Coins</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {earnActivities.map((item, i) => {
              const completed = isCompleted(item.rewardType);
              return (
                <li key={i} className={`flex items-center gap-3 text-sm rounded-lg p-2 ${completed ? "bg-accent/10" : ""}`}>
                  <item.icon className={`h-4 w-4 shrink-0 ${completed ? "text-accent" : "text-muted-foreground"}`} />
                  <span className={`flex-1 ${completed ? "text-accent font-medium" : "text-foreground"}`}>{item.text}</span>
                  {completed ? (
                    <Badge variant="outline" className="border-accent/30 text-accent text-[10px] gap-1">
                      <CheckCircle className="h-3 w-3" /> Completed
                    </Badge>
                  ) : (
                    <span className="font-semibold text-amber-500">+{item.coins.toLocaleString()}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Convert to Wallet */}
      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
        <CardContent className="py-5 space-y-3">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Minimum <span className="font-semibold text-foreground">{minCoins.toLocaleString()} Coins</span> required for conversion
            </p>
            <p className="text-xs text-muted-foreground">
              {coinRate} Coins = ₹1 • You have {userCoins.toLocaleString()} coins (≈ ₹{(userCoins / coinRate).toFixed(2)})
            </p>
          </div>
          <Button
            className="w-full gap-2"
            disabled={userCoins < minCoins || converting}
            onClick={handleConvert}
          >
            {converting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IndianRupee className="h-4 w-4" />
            )}
            {converting
              ? "Converting..."
              : userCoins >= minCoins
                ? `Convert ${userCoins.toLocaleString()} Coins to ₹${(userCoins / coinRate).toFixed(2)}`
                : `Minimum ${minCoins.toLocaleString()} Coins Required`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GetCoins;
