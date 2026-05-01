import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const { data: { user: u }, error } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (error || !u) return json({ error: "User not found" }, 404);

    const meta = u.app_metadata ?? {};
    const hasPin = !!meta.mpin_hash;

    const blockedUntil = meta.mpin_blocked_until;
    if (blockedUntil && new Date(blockedUntil) > new Date()) {
      return json({ hasPin, blocked: true, blockedUntil, attemptsLeft: 0 });
    }

    const failedAttempts = meta.mpin_failed_attempts ?? 0;
    const attemptsLeft = Math.max(0, 3 - failedAttempts);
    return json({ hasPin, blocked: false, attemptsLeft });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
