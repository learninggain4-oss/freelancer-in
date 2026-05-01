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

function base32Encode(bytes: Uint8Array): string {
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, val = 0, out = "";
  for (const b of bytes) {
    val = (val << 8) | b;
    bits += 8;
    while (bits >= 5) { out += alpha[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += alpha[(val << (5 - bits)) & 31];
  return out;
}

function generateSecret(): string {
  const b = new Uint8Array(20);
  crypto.getRandomValues(b);
  return base32Encode(b);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const { data: { user }, error: authErr } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const secret = generateSecret();
    const label = encodeURIComponent(user.email ?? user.id);
    const issuer = encodeURIComponent("Freelancer India");
    const otpauthUrl = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { totp_pending_secret: secret },
    });
    if (upErr) return json({ error: upErr.message }, 500);

    const formattedSecret = secret.match(/.{1,4}/g)?.join(" ") ?? secret;

    // Return api.qrserver.com URL — the browser fetches it, no QR lib needed in Deno
    const qrCodeDataUrl =
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=2&data=${encodeURIComponent(otpauthUrl)}`;

    return json({ qrCodeDataUrl, formattedSecret, otpauthUrl });
  } catch (err: any) {
    return json({ error: String(err?.message ?? err) }, 500);
  }
});
