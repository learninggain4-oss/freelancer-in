import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Star, CheckCircle, Trophy, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const GetCoins = () => {
  const [coinRate, setCoinRate] = useState<number>(100);
  const [minCoins, setMinCoins] = useState<number>(250);
  const userCoins = 0; // placeholder until coin tracking is implemented

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
            Earn Coins
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Complete activities on the platform and earn coins that you can redeem for rewards!
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-background p-3 text-center">
              <Coins className="mx-auto mb-1 h-5 w-5 text-amber-500" />
              <p className="text-xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Total Coins</p>
              <p className="text-[10px] text-muted-foreground">≈ ₹{(0 / coinRate).toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-background p-3 text-center">
              <Trophy className="mx-auto mb-1 h-5 w-5 text-amber-500" />
              <p className="text-xl font-bold text-foreground">0</p>
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

      <p className="text-center text-xs text-muted-foreground">
        Coin rewards system coming soon. Stay tuned!
      </p>
    </div>
  );
};

export default GetCoins;
