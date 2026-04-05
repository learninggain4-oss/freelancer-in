import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// qrcode toString(svg) works in Deno — no Canvas API required
import QRCode from "https://esm.sh/qrcode@1.5.4";

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
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += alphabet[(value << (5 - bits)) & 31];
  return result;
}

function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
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

    const secret = generateSecret();
    const label = encodeURIComponent(user.email || user.id);
    const issuer = encodeURIComponent("Freelancer India");
    const otpauthUrl = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: { totp_pending_secret: secret },
    });
    if (updateErr) return json({ error: updateErr.message }, 500);

    const formattedSecret = secret.match(/.{1,4}/g)?.join(" ") ?? secret;

    // Use SVG mode — no Canvas needed, works perfectly in Deno
    const svgString: string = await QRCode.toString(otpauthUrl, {
      type: "svg",
      width: 220,
      margin: 2,
    });
    const qrCodeDataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;

    return json({ qrCodeDataUrl, formattedSecret, otpauthUrl });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
