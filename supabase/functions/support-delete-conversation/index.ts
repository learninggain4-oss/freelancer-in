import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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
      return json({ error: "Super admin only" }, 403);
    }

    const { conversationId } = await req.json();
    if (!conversationId) return json({ error: "conversationId required" }, 400);

    const { data: conv, error: fetchErr } = await supabaseAdmin
      .from("support_conversations")
      .select("id")
      .eq("id", conversationId)
      .maybeSingle();

    if (fetchErr || !conv) return json({ error: "Conversation not found" }, 404);

    const { error: msgErr } = await supabaseAdmin
      .from("support_messages")
      .delete()
      .eq("conversation_id", conversationId);
    if (msgErr) return json({ error: "Failed to delete messages: " + msgErr.message }, 500);

    const { error } = await supabaseAdmin
      .from("support_conversations")
      .delete()
      .eq("id", conversationId);
    if (error) return json({ error: error.message }, 500);

    return json({ success: true });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
