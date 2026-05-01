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

const SQ_QUESTIONS = [
  "What is the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your primary school?",
  "What city were you born in?",
  "What is the name of your best childhood friend?",
  "What was your childhood nickname?",
  "What is the name of the street you grew up on?",
  "What is your oldest sibling's first name?",
  "What was the make and model of your first vehicle?",
  "What is your all-time favourite food?",
];

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

    const { data: { user: u }, error } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (error || !u) return json({ error: "User not found" }, 404);

    const meta = u.app_metadata ?? {};
    const savedAnswers: { idx: number }[] = Array.isArray(meta.security_answers) ? meta.security_answers : [];
    const hasSq = savedAnswers.length >= 3;

    // Check TOTP in user_totp_secrets table
    const { data: totpRow } = await supabaseAdmin
      .from("user_totp_secrets")
      .select("is_enabled")
      .eq("user_id", user.id)
      .maybeSingle();
    const hasTotp = totpRow?.is_enabled === true;

    let sqQuestions: { idx: number; question: string }[] = [];
    if (hasSq) {
      const shuffled = [...savedAnswers].sort(() => Math.random() - 0.5).slice(0, 3);
      sqQuestions = shuffled.map(a => ({
        idx: a.idx,
        question: SQ_QUESTIONS[a.idx] ?? `Question ${a.idx + 1}`,
      }));
    }

    return json({ hasTotp, hasSq, sqQuestions });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
