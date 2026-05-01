import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get caller email for super admin check
    const { data: { user: callerUser } } = await supabaseAdmin.auth.getUser(token);
    const callerEmail = (callerUser?.email || "").toLowerCase();
    const superAdminEmails = ["freeandin9@gmail.com", ...(Deno.env.get("SUPER_ADMIN_EMAILS") || "").split(",").map((e: string) => e.trim().toLowerCase()).filter(Boolean)];
    const isSuperAdmin = superAdminEmails.includes(callerEmail);

    if (!isSuperAdmin) {
      // Check admin role
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const { action, ip_address, reason } = body;

    if (!ip_address) {
      return new Response(JSON.stringify({ error: "ip_address is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin's profile id
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (action === "block") {
      const { error } = await supabaseAdmin.from("blocked_ips").upsert(
        {
          ip_address,
          reason: reason || null,
          blocked_by: profile?.id || null,
        },
        { onConflict: "ip_address" }
      );
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, action: "blocked" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "unblock") {
      const { error } = await supabaseAdmin
        .from("blocked_ips")
        .delete()
        .eq("ip_address", ip_address);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, action: "unblocked" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
