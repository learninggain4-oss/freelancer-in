import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate caller via getClaims
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } },
    });

    const { data: { user: caller }, error: userError } = await callerClient.auth.getUser();
    if (userError || !caller) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = caller.id;

    // Check admin role using service role client
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, user_id, profile_id } = await req.json();

    switch (action) {
      case "permanent_delete": {
        if (!profile_id) {
          return new Response(JSON.stringify({ error: "profile_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: profile } = await adminClient
          .from("profiles")
          .select("user_id, full_name")
          .eq("id", profile_id)
          .single();

        if (!profile) {
          return new Response(JSON.stringify({ error: "Profile not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await adminClient.from("admin_audit_logs").insert({
          admin_id: callerUserId,
          action: "permanent_delete_user",
          target_profile_id: profile_id,
          target_profile_name: profile.full_name?.[0] || "Unknown",
          details: { reason: "Permanent deletion by admin" },
        });

        const { error: deleteError } = await adminClient.auth.admin.deleteUser(profile.user_id);
        if (deleteError) {
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, message: "User permanently deleted" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "force_logout": {
        if (!user_id) {
          return new Response(JSON.stringify({ error: "user_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: logoutError } = await adminClient.auth.admin.signOut(user_id, "global");
        if (logoutError) {
          return new Response(JSON.stringify({ error: logoutError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: targetProfile } = await adminClient
          .from("profiles")
          .select("id, full_name")
          .eq("user_id", user_id)
          .maybeSingle();

        await adminClient.from("admin_audit_logs").insert({
          admin_id: callerUserId,
          action: "force_logout",
          target_profile_id: targetProfile?.id || null,
          target_profile_name: targetProfile?.full_name?.[0] || "Unknown",
          details: { scope: "global" },
        });

        return new Response(JSON.stringify({ success: true, message: "User logged out from all sessions" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_users_sessions": {
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        if (listError) {
          return new Response(JSON.stringify({ error: listError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, user_id, full_name, user_code, user_type, is_disabled, approval_status");

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

        const sessionData = users.map((u: any) => {
          const profile = profileMap.get(u.id);
          return {
            auth_user_id: u.id,
            email: u.email,
            last_sign_in_at: u.last_sign_in_at,
            created_at: u.created_at,
            updated_at: u.updated_at,
            profile_id: profile?.id || null,
            full_name: profile?.full_name?.[0] || null,
            user_code: profile?.user_code?.[0] || null,
            user_type: profile?.user_type || null,
            is_disabled: profile?.is_disabled || false,
            approval_status: profile?.approval_status || null,
          };
        });

        return new Response(JSON.stringify({ users: sessionData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
