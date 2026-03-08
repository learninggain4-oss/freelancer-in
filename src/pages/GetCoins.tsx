import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Star, CheckCircle, Trophy } from "lucide-react";

const GetCoins = () => {
  return (
    <div className="space-y-6 px-4 py-6">
      <h2 className="text-2xl font-bold text-foreground">Get Coins</h2>

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
