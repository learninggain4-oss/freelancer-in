import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { conversationId } = await req.json();
    if (!conversationId) return json({ error: "conversationId required" }, 400);

    const { data: conv, error: fetchErr } = await supabaseAdmin
      .from("support_conversations")
      .select("id, user_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (fetchErr || !conv) return json({ error: "Conversation not found" }, 404);

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_type")
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = callerProfile?.user_type === "admin";
    if (!isAdmin && conv.user_id !== user.id) {
      return json({ error: "Not your conversation" }, 403);
    }

    const { error } = await supabaseAdmin
      .from("support_messages")
      .delete()
      .eq("conversation_id", conversationId);
    if (error) return json({ error: error.message }, 500);

    return json({ success: true });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
