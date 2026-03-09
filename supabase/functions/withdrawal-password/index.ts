import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to get auth user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { action, password, current_password } = await req.json();

    // Get profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, withdrawal_password_hash")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      return new Response(
        JSON.stringify({ has_password: !!profile.withdrawal_password_hash }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "set") {
      if (!password || password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If already has a password, require current password
      if (profile.withdrawal_password_hash) {
        if (!current_password) {
          return new Response(
            JSON.stringify({ error: "Current password is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const currentHash = await hashPassword(current_password);
        if (currentHash !== profile.withdrawal_password_hash) {
          return new Response(
            JSON.stringify({ error: "Current password is incorrect" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const hash = await hashPassword(password);
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ withdrawal_password_hash: hash })
        .eq("id", profile.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to save password" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (!password) {
        return new Response(
          JSON.stringify({ error: "Password is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!profile.withdrawal_password_hash) {
        return new Response(
          JSON.stringify({ error: "No withdrawal password set" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const hash = await hashPassword(password);
      const valid = hash === profile.withdrawal_password_hash;
      return new Response(
        JSON.stringify({ valid }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset") {
      // Reset withdrawal password by verifying account login password
      const { account_password, new_password } = await req.json().catch(() => ({})) || {};
      const loginPassword = (await req.json().catch(() => null)) ? undefined : undefined;
      // Re-read body since we already consumed it above — use params from initial parse
      // Actually the body was already parsed at line 47, let me use the variables from the request body
    }

    // Handle reset action: verify login password, then set new withdrawal password
    if (action === "reset_withdrawal") {
      const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
        email: user.email!,
        password: password, // user sends their account password in 'password' field
      });
      if (signInError) {
        return new Response(
          JSON.stringify({ error: "Account password is incorrect" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Clear the withdrawal password so user can set a new one
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ withdrawal_password_hash: null })
        .eq("id", profile.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to reset withdrawal password" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
