import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { action } = await req.json();

    // Get caller profile
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("id, user_id, coin_balance, available_balance, approval_status")
      .eq("user_id", user.id)
      .single();
    if (pErr || !profile) throw new Error("Profile not found");
    if (profile.approval_status !== "approved") throw new Error("Account not approved");

    let result: Record<string, unknown> = { success: true };

    switch (action) {
      case "convert_coins": {
        const coinBalance = Number(profile.coin_balance);

        // Fetch min_coin_conversion and coin_conversion_rate
        const { data: settings } = await supabase
          .from("app_settings")
          .select("key, value")
          .in("key", ["min_coin_conversion", "coin_conversion_rate"]);

        let minCoins = 250;
        let rate = 100;
        if (settings) {
          for (const s of settings) {
            if (s.key === "min_coin_conversion") minCoins = Number(s.value) || 250;
            if (s.key === "coin_conversion_rate") rate = Number(s.value) || 100;
          }
        }

        if (coinBalance < minCoins) {
          throw new Error(`Minimum ${minCoins} coins required for conversion`);
        }

        const rupeeAmount = coinBalance / rate;

        // Deduct all coins
        await supabase
          .from("profiles")
          .update({
            coin_balance: 0,
            available_balance: Number(profile.available_balance) + rupeeAmount,
          })
          .eq("id", profile.id);

        // Record coin transaction
        await supabase.from("coin_transactions").insert({
          profile_id: profile.id,
          amount: -coinBalance,
          type: "conversion",
          description: `Converted ${coinBalance} coins to ₹${rupeeAmount.toFixed(2)}`,
        });

        // Record wallet transaction
        await supabase.from("transactions").insert({
          profile_id: profile.id,
          type: "credit",
          amount: rupeeAmount,
          description: `Coin conversion: ${coinBalance} coins`,
        });

        result.coins_converted = coinBalance;
        result.rupees_credited = rupeeAmount;
        result.new_coin_balance = 0;
        break;
      }

      default:
        throw new Error("Unknown action");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
