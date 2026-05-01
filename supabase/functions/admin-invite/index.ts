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

    const { data: roleCheck } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleCheck) return json({ error: "Admin access required" }, 403);

    const { action, emails, user_type } = await req.json();

    if (action === "bulk_invite") {
      if (!emails?.length) return json({ error: "emails array required" }, 400);
      if (!user_type) return json({ error: "user_type required" }, 400);

      const results = [];
      for (const email of emails) {
        const trimmed = String(email).trim().toLowerCase();
        if (!trimmed || !trimmed.includes("@")) {
          results.push({ email: trimmed, success: false, error: "Invalid email" });
          continue;
        }
        try {
          const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(trimmed);
          if (inviteErr) {
            results.push({ email: trimmed, success: false, error: inviteErr.message });
            continue;
          }
          const invitedUserId = inviteData?.user?.id;
          if (invitedUserId) {
            await supabaseAdmin.from("profiles").insert({
              user_id: invitedUserId,
              email: trimmed,
              full_name: [trimmed.split("@")[0].toUpperCase()],
              user_code: ["PENDING"],
              user_type,
              approval_status: "approved",
              approved_at: new Date().toISOString(),
              referral_code: invitedUserId.substring(0, 8).toUpperCase(),
            }).catch(() => {});
          }
          results.push({ email: trimmed, success: true });
        } catch (e: any) {
          results.push({ email: trimmed, success: false, error: e.message });
        }
      }
      return json({ results });
    }

    if (action === "history") {
      const { data: invited } = await supabaseAdmin
        .from("profiles")
        .select("id, email, user_type, approval_status, created_at, full_name, user_code")
        .contains("user_code", ["PENDING"])
        .order("created_at", { ascending: false })
        .limit(100);
      return json({ invited: invited ?? [] });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
