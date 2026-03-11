import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, Crown, Shield, Zap, Star, ChevronRight } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Wallet, Crown, Shield, Zap, Star,
};

const WalletTypes = () => {
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No wallet types available yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Wallet Types</h1>
      <p className="text-sm text-muted-foreground">
        Explore the different wallet tiers and their benefits.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {walletTypes.map((wt) => {
          const IconComp = iconMap[wt.icon_name] || Wallet;
          return (
            <Card
              key={wt.id}
              className="relative overflow-hidden border-2 transition-shadow hover:shadow-lg"
              style={{ borderColor: wt.color }}
            >
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ backgroundColor: wt.color }}
              />
              <CardHeader className="flex flex-row items-center gap-3 pb-2 pt-5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${wt.color}20`, color: wt.color }}
                >
                  <IconComp className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{wt.name}</CardTitle>
                  {wt.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {wt.description}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Limits */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Min Balance", value: `₹${Number(wt.min_balance).toLocaleString("en-IN")}` },
                    { label: "Max Balance", value: `₹${Number(wt.max_balance).toLocaleString("en-IN")}` },
                    { label: "Daily Withdrawal", value: `₹${Number(wt.daily_withdrawal_limit).toLocaleString("en-IN")}` },
                    { label: "Per Transaction", value: `₹${Number(wt.transaction_limit).toLocaleString("en-IN")}` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-md bg-muted/50 p-2">
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Perks */}
                {wt.perks && (wt.perks as string[]).length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      Perks
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(wt.perks as string[]).map((perk, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${wt.color}15`,
                            color: wt.color,
                            borderColor: `${wt.color}30`,
                          }}
                        >
                          {perk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upgrade Requirements */}
                {wt.upgrade_requirements && (
                  <div className="flex items-start gap-2 rounded-md border border-dashed p-2.5">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Upgrade: </span>
                      {wt.upgrade_requirements}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WalletTypes;
