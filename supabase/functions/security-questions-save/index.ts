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

    const { answers } = await req.json() as { answers: string[] };
    if (!Array.isArray(answers) || answers.length !== 10)
      return json({ error: "Must provide an array of 10 entries" }, 400);

    const hashes: { idx: number; hash: string; answer: string }[] = [];
    for (let idx = 0; idx < answers.length; idx++) {
      const raw = String(answers[idx] || "").toLowerCase().trim();
      if (raw) {
        hashes.push({
          idx,
          hash: await hashAnswer(raw, user.id, idx),
          answer: raw,
        });
      }
    }

    if (hashes.length < 3)
      return json({ error: "Please answer at least 3 security questions" }, 400);

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        security_questions_done: true,
        security_answers: hashes,
      },
    });
    if (error) return json({ error: error.message }, 500);

    return json({ success: true });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
