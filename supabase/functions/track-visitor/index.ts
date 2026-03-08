import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const body = await req.json();

    // Get real IP from headers (Deno Deploy / Supabase edge provides these)
    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      null;

    // Geo lookup using ipapi.co with the real IP
    let city: string | null = null;
    let country: string | null = null;
    if (ip_address) {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip_address}/json/`, {
          signal: AbortSignal.timeout(3000),
        });
        if (geoRes.ok) {
          const geo = await geoRes.json();
          city = geo.city || null;
          country = geo.country_name || null;
        }
      } catch {
        // Geo lookup is optional
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabaseAdmin.from("site_visitors").insert({
      ip_address,
      user_agent: body.user_agent || null,
      page_path: body.page_path || null,
      referrer: body.referrer || null,
      profile_id: body.profile_id || null,
      device_type: body.device_type || null,
      city,
      country,
    });

    if (error) throw error;

    // Check if this IP is blocked
    let blocked = false;
    if (ip_address) {
      const { data: blockData } = await supabaseAdmin
        .from("blocked_ips")
        .select("id")
        .eq("ip_address", ip_address)
        .maybeSingle();
      blocked = !!blockData;
    }

    return new Response(JSON.stringify({ success: true, blocked }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
