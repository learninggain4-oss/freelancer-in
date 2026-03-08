import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Star, CheckCircle, Trophy, IndianRupee, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GetCoins = () => {
  const { profile, refreshProfile } = useAuth();
  const [coinRate, setCoinRate] = useState<number>(100);
  const [minCoins, setMinCoins] = useState<number>(250);
  const [converting, setConverting] = useState(false);
  const [totalRedeemed, setTotalRedeemed] = useState(0);

  const userCoins = (profile as any)?.coin_balance ?? 0;

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["coin_conversion_rate", "min_coin_conversion"]);
      if (data) {
        for (const row of data) {
          if (row.key === "coin_conversion_rate") setCoinRate(Number(row.value) || 100);
          if (row.key === "min_coin_conversion") setMinCoins(Number(row.value) || 250);
        }
      }
    };
    fetchSettings();
  }, []);

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
      // Refresh redeemed count
      setTotalRedeemed((prev) => prev + (data.coins_converted || 0));
    } catch (err: any) {
      toast.error(err.message || "Conversion failed");
    } finally {
      setConverting(false);
    }
  };

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
            {[
              { icon: CheckCircle, text: "Complete your profile", coins: 50 },
              { icon: Star, text: "Complete a project", coins: 100 },
              { icon: Star, text: "Receive a 5-star review", coins: 25 },
              { icon: CheckCircle, text: "Refer a friend", coins: 75 },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <item.icon className="h-4 w-4 shrink-0 text-accent" />
                <span className="flex-1 text-foreground">{item.text}</span>
                <span className="font-semibold text-amber-500">+{item.coins}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Convert to Wallet */}
      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
        <CardContent className="py-5 space-y-3">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Minimum <span className="font-semibold text-foreground">{minCoins} Coins</span> required for conversion
            </p>
            <p className="text-xs text-muted-foreground">
              {coinRate} Coins = ₹1 • You have {userCoins} coins (≈ ₹{(userCoins / coinRate).toFixed(2)})
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
                ? `Convert ${userCoins} Coins to ₹${(userCoins / coinRate).toFixed(2)}`
                : `Minimum ${minCoins} Coins Required`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GetCoins;
