import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter per user (10 requests per 60 seconds)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify JWT from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    // Rate limit check
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, amount, profile_id, withdrawal_id, status, review_notes } =
      await req.json();

    // Get the caller's profile
    const { data: callerProfile, error: cpErr } = await supabase
      .from("profiles")
      .select("id, user_type, available_balance, hold_balance, approval_status")
      .eq("user_id", user.id)
      .single();
    if (cpErr || !callerProfile) throw new Error("Profile not found");
    if (callerProfile.approval_status !== "approved")
      throw new Error("Account not approved");

    let result: any = { success: true };

    switch (action) {
      case "add_money": {
        if (callerProfile.user_type !== "client")
          throw new Error("Only clients can add money");
        if (!amount || amount <= 0) throw new Error("Invalid amount");

        const newBalance = Number(callerProfile.available_balance) + amount;
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({ available_balance: newBalance })
          .eq("id", callerProfile.id);
        if (updateErr) throw updateErr;

        await supabase.from("transactions").insert({
          profile_id: callerProfile.id,
          type: "credit",
          amount,
          description: "Added to wallet",
        });

        result.new_balance = newBalance;
        break;
      }

      case "process_withdrawal": {
        if (callerProfile.user_type !== "client")
          throw new Error("Only clients can process withdrawals");
        if (!withdrawal_id || !status)
          throw new Error("Missing withdrawal_id or status");

        const { data: withdrawal, error: wErr } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("id", withdrawal_id)
          .single();
        if (wErr || !withdrawal) throw new Error("Withdrawal not found");
        if (withdrawal.status !== "pending")
          throw new Error("Withdrawal already processed");

        if (status === "approved") {
          const wAmount = Number(withdrawal.amount);

          if (Number(callerProfile.available_balance) < wAmount)
            throw new Error("Insufficient balance to approve withdrawal");

          await supabase
            .from("profiles")
            .update({
              available_balance:
                Number(callerProfile.available_balance) - wAmount,
            })
            .eq("id", callerProfile.id);

          const { data: empProfile } = await supabase
            .from("profiles")
            .select("available_balance")
            .eq("id", withdrawal.employee_id)
            .single();

          if (empProfile) {
            await supabase
              .from("profiles")
              .update({
                available_balance:
                  Number(empProfile.available_balance) + wAmount,
              })
              .eq("id", withdrawal.employee_id);
          }

          await supabase.from("transactions").insert([
            {
              profile_id: callerProfile.id,
              type: "debit",
              amount: wAmount,
              description: `Withdrawal approved for employee`,
              reference_id: withdrawal_id,
            },
            {
              profile_id: withdrawal.employee_id,
              type: "credit",
              amount: wAmount,
              description: `Withdrawal received`,
              reference_id: withdrawal_id,
            },
          ]);
        }

        await supabase
          .from("withdrawals")
          .update({
            status,
            reviewed_by: callerProfile.id,
            reviewed_at: new Date().toISOString(),
            review_notes: review_notes || null,
          })
          .eq("id", withdrawal_id);

        result.status = status;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("wallet-operations error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
