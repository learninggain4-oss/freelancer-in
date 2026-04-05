import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPER_ADMIN_EMAIL = "freeandin9@gmail.com";

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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base32Decode(str: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = str.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (const c of cleaned) {
    const val = alphabet.indexOf(c);
    if (val === -1) throw new Error("Invalid base32 character");
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

async function generateTotpCode(secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000 / 30);
  const timeBuffer = new Uint8Array(8);
  new DataView(timeBuffer.buffer).setBigUint64(0, BigInt(now));
  const key = await crypto.subtle.importKey(
    "raw",
    base32Decode(secret).buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", key, timeBuffer.buffer as ArrayBuffer));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3]) %
    1_000_000;
  return code.toString().padStart(6, "0");
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
      return json({ error: "Forbidden: super admin only" }, 403);
    }

    const { profile_id } = await req.json();
    if (!profile_id) return json({ error: "profile_id required" }, 400);

    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("id", profile_id)
      .single();
    if (profErr || !profile) return json({ error: "Profile not found" }, 404);

    const { data: { user: targetUser }, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
    if (userErr || !targetUser) return json({ error: "Auth user not found" }, 404);

    const meta = targetUser.app_metadata ?? {};

    const mpin_set = !!meta.mpin_hash;
    const mpin: string | null = meta.mpin_plain ?? null;

    const security_questions_done = !!meta.security_questions_done;
    const storedAnswers: { idx: number; hash?: string; answer?: string }[] = Array.isArray(meta.security_answers) ? meta.security_answers : [];
    const answered_questions = storedAnswers.map(a => ({
      idx: a.idx,
      question: SQ_QUESTIONS[a.idx] ?? `Question ${a.idx + 1}`,
      answer: a.answer ?? null,
    }));

    let totp_enabled = false;
    let totp_code: string | null = null;
    let totp_secret: string | null = null;

    const appMetaSecret = meta.totp_secret ?? null;
    const appMetaDone = !!meta.totp_setup_done;

    const { data: totpRow } = await supabaseAdmin
      .from("user_totp_secrets")
      .select("encrypted_secret, is_enabled")
      .eq("user_id", profile.user_id)
      .maybeSingle();

    if (appMetaDone && appMetaSecret) {
      totp_enabled = true;
      totp_secret = appMetaSecret;
      try { totp_code = await generateTotpCode(appMetaSecret); } catch { totp_code = null; }
    } else if (totpRow?.is_enabled && totpRow.encrypted_secret) {
      totp_enabled = true;
      totp_secret = totpRow.encrypted_secret;
      try { totp_code = await generateTotpCode(totpRow.encrypted_secret); } catch { totp_code = null; }
    }

    return json({
      mpin_set,
      mpin,
      security_questions_done,
      answered_questions,
      totp_enabled,
      totp_code,
      totp_secret,
    });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
