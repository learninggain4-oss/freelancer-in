import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find pending withdrawals older than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: expired, error } = await supabase
      .from("withdrawals")
      .select("id, employee_id, amount")
      .eq("status", "pending")
      .lt("requested_at", twoHoursAgo);

    if (error) throw error;
    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ expired: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let count = 0;
    for (const w of expired) {
      const wAmount = Number(w.amount);

      // Restore employee balance
      const { data: empProfile } = await supabase
        .from("profiles")
        .select("available_balance, user_id")
        .eq("id", w.employee_id)
        .single();

      if (empProfile) {
        await supabase
          .from("profiles")
          .update({
            available_balance: Number(empProfile.available_balance) + wAmount,
          })
          .eq("id", w.employee_id);

        await supabase.from("transactions").insert({
          profile_id: w.employee_id,
          type: "credit",
          amount: wAmount,
          description: "Withdrawal auto-rejected (expired after 2 hours) — amount restored",
          reference_id: w.id,
        });

        // Notify employee
        await supabase.from("notifications").insert({
          user_id: empProfile.user_id,
          title: "Withdrawal Auto-Rejected",
          message: `Your withdrawal of ₹${wAmount.toLocaleString("en-IN")} was automatically rejected because it was not approved within 2 hours. The amount has been restored to your balance.`,
          type: "financial",
          reference_id: w.id,
          reference_type: "withdrawal",
        });
      }

      // Update withdrawal status
      await supabase
        .from("withdrawals")
        .update({
          status: "rejected",
          review_notes: "Auto-rejected: not approved within 2 hours",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", w.id);

      count++;
    }

    return new Response(JSON.stringify({ expired: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("auto-expire-withdrawals error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
