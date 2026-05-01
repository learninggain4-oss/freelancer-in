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

async function hashAnswer(raw: string, userId: string, idx: number): Promise<string> {
  const data = new TextEncoder().encode(`${raw}:${userId}:sq-${idx}`);
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

    const { answers } = await req.json() as { answers: { idx: number; answer: string }[] };
    if (!Array.isArray(answers) || answers.length < 3)
      return json({ error: "Must provide at least 3 answers" }, 400);

    const { data: { user: u }, error } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (error || !u) return json({ error: "User not found" }, 404);

    const savedAnswers: { idx: number; hash: string }[] = Array.isArray(u.app_metadata?.security_answers)
      ? u.app_metadata.security_answers : [];

    let allCorrect = true;
    for (const provided of answers) {
      const stored = savedAnswers.find(a => a.idx === provided.idx);
      if (!stored) { allCorrect = false; break; }
      const hash = await hashAnswer(String(provided.answer || "").toLowerCase().trim(), user.id, provided.idx);
      if (hash !== stored.hash) { allCorrect = false; break; }
    }

    return json({ valid: allCorrect });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
