import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPER_ADMIN_EMAIL = "freeandin9@gmail.com";

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

    if (user.email !== SUPER_ADMIN_EMAIL) {
      return json({ error: "Forbidden: super admin only" }, 403);
    }

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, id, created_at")
      .eq("role", "admin");
    const rolesArr = roles ?? [];

    const { data: { users: allAuthUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const superAuthUsers = (allAuthUsers ?? []).filter(
      u => (u.email ?? "").toLowerCase() === SUPER_ADMIN_EMAIL,
    );

    const seenUserIds = new Set(rolesArr.map(r => r.user_id));
    const extraEntries = superAuthUsers
      .filter(u => !seenUserIds.has(u.id))
      .map(u => ({ user_id: u.id, role_id: null, role_created_at: u.created_at, from_roles: false }));

    const allEntries = [
      ...rolesArr.map(r => ({ user_id: r.user_id, role_id: r.id, role_created_at: r.created_at, from_roles: true })),
      ...extraEntries,
    ];

    if (!allEntries.length) return json({ admins: [] });

    const allUserIds = allEntries.map(e => e.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, full_name, email, user_type, approval_status, is_disabled, created_at, mobile_number")
      .in("user_id", allUserIds);

    const admins = allEntries.map(entry => {
      const profile = (profiles ?? []).find(p => p.user_id === entry.user_id);
      const authUser = (allAuthUsers ?? []).find(u => u.id === entry.user_id);
      const email = profile?.email ?? authUser?.email ?? "";
      return {
        role_id: entry.role_id,
        user_id: entry.user_id,
        profile_id: profile?.id ?? null,
        full_name: (profile?.full_name as string[] | null)?.[0] ?? null,
        email,
        user_type: profile?.user_type ?? null,
        approval_status: profile?.approval_status ?? null,
        is_disabled: profile?.is_disabled ?? false,
        mobile_number: profile?.mobile_number ?? null,
        role_created_at: entry.role_created_at,
        last_sign_in: authUser?.last_sign_in_at ?? null,
        is_super_admin: email.toLowerCase() === SUPER_ADMIN_EMAIL,
      };
    });

    return json({ admins });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
