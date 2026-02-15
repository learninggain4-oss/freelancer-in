import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("projects")
      .update({ status: "open", scheduled_publish_at: null })
      .eq("status", "draft")
      .not("scheduled_publish_at", "is", null)
      .lte("scheduled_publish_at", now)
      .select("id, name, order_id");

    if (error) throw error;

    console.log(`Auto-published ${data?.length ?? 0} jobs:`, data?.map((j: any) => j.order_id));

    return new Response(JSON.stringify({ published: data?.length ?? 0, jobs: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Auto-publish error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
