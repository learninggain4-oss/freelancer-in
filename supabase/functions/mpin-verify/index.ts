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

async function hashMpin(pin: string, userId: string): Promise<string> {
  const data = new TextEncoder().encode(`${pin}:${userId}:flexpay`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
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

    const { pin } = await req.json();
    if (!pin || !/^\d{4}$/.test(pin))
      return json({ error: "PIN must be exactly 4 digits" }, 400);

    const { data: { user: u }, error } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (error || !u) return json({ error: "User not found" }, 404);

    const meta = u.app_metadata ?? {};

    const blockedUntil = meta.mpin_blocked_until;
    if (blockedUntil && new Date(blockedUntil) > new Date()) {
      return json({ blocked: true, blockedUntil, attemptsLeft: 0, valid: false }, 429);
    }

    const expected = meta.mpin_hash;
    if (!expected) return json({ error: "No PIN set", hasPin: false }, 400);

    const valid = (await hashMpin(pin, user.id)) === expected;

    if (valid) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: { mpin_failed_attempts: 0, mpin_blocked_until: null },
      });
      return json({ valid: true, attemptsLeft: 3 });
    }

    const failedAttempts = (meta.mpin_failed_attempts ?? 0) + 1;
    const newMeta: Record<string, unknown> = { mpin_failed_attempts: failedAttempts };

    if (failedAttempts >= 3) {
      const until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      newMeta.mpin_blocked_until = until;
      await supabaseAdmin.auth.admin.updateUserById(user.id, { app_metadata: newMeta });
      return json({ valid: false, blocked: true, blockedUntil: until, attemptsLeft: 0 }, 429);
    }

    await supabaseAdmin.auth.admin.updateUserById(user.id, { app_metadata: newMeta });
    return json({ valid: false, attemptsLeft: 3 - failedAttempts });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
