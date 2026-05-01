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

async function verifyTOTP(secret: string, token: string, window = 1): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    const time = now + i;
    const timeBuffer = new Uint8Array(8);
    new DataView(timeBuffer.buffer).setBigUint64(0, BigInt(time));
    const key = await crypto.subtle.importKey(
      "raw", base32Decode(secret).buffer as ArrayBuffer,
      { name: "HMAC", hash: "SHA-1" }, false, ["sign"],
    );
    const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", key, timeBuffer.buffer as ArrayBuffer));
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      (((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) |
      (hmac[offset + 2] << 8) | hmac[offset + 3]) % 1_000_000;
    if (code.toString().padStart(6, "0") === String(token).padStart(6, "0")) return true;
  }
  return false;
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

    const { token } = await req.json();
    if (!token || !/^\d{6}$/.test(String(token)))
      return json({ error: "Token must be 6 digits" }, 400);

    const { data: { user: u }, error } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (error || !u) return json({ error: "User not found" }, 404);

    const secret = u.app_metadata?.totp_secret;
    if (!secret) return json({ error: "TOTP not configured", setup: false }, 400);

    const valid = await verifyTOTP(secret, String(token));
    return json({ valid });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
