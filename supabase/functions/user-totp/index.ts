import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base32Encode } from "https://deno.land/std@0.208.0/encoding/base32.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  return crypto.subtle
    .importKey("raw", key.buffer as ArrayBuffer, { name: "HMAC", hash: "SHA-1" }, false, ["sign"])
    .then((k) => crypto.subtle.sign("HMAC", k, data.buffer as ArrayBuffer))
    .then((sig) => new Uint8Array(sig));
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
  const timeStep = 30;
  const now = Math.floor(Date.now() / 1000 / timeStep);

  for (let i = -window; i <= window; i++) {
    const time = now + i;
    const timeBuffer = new Uint8Array(8);
    const view = new DataView(timeBuffer.buffer);
    view.setBigUint64(0, BigInt(time));

    const key = base32Decode(secret);
    const hmac = await hmacSha1(key, timeBuffer);
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const expected = (code % Math.pow(10, 6)).toString().padStart(6, "0");
    if (expected === token) return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    const { action, code, user_id: target_user_id } = await req.json();

    // For check_status_by_id, allow checking another user's status (used during login)
    if (action === "check_status_by_id" && target_user_id) {
      const { data: totpRow } = await adminClient
        .from("user_totp_secrets")
        .select("is_enabled")
        .eq("user_id", target_user_id)
        .maybeSingle();

      return new Response(
        JSON.stringify({ is_enabled: totpRow?.is_enabled ?? false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "setup") {
      const secret = generateSecret();
      // Get user email for the label
      const otpauthUrl = `otpauth://totp/Freelancer-in:${user.email}?secret=${secret}&issuer=Freelancer-in&digits=6&period=30`;

      const { error: upsertError } = await adminClient
        .from("user_totp_secrets")
        .upsert({
          user_id: user.id,
          encrypted_secret: secret,
          is_enabled: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) throw new Error(upsertError.message);

      return new Response(
        JSON.stringify({ secret, otpauth_url: otpauthUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "enable") {
      if (!code) throw new Error("Verification code required");

      const { data: totpRow, error: fetchError } = await adminClient
        .from("user_totp_secrets")
        .select("encrypted_secret")
        .eq("user_id", user.id)
        .single();

      if (fetchError || !totpRow) throw new Error("TOTP not set up yet");

      const isValid = await verifyTOTP(totpRow.encrypted_secret, code);
      if (!isValid) throw new Error("Invalid verification code");

      await adminClient
        .from("user_totp_secrets")
        .update({ is_enabled: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (!code) throw new Error("Verification code required");

      const uid = target_user_id || user.id;
      const { data: totpRow, error: fetchError } = await adminClient
        .from("user_totp_secrets")
        .select("encrypted_secret, is_enabled")
        .eq("user_id", uid)
        .single();

      if (fetchError || !totpRow || !totpRow.is_enabled) {
        return new Response(
          JSON.stringify({ valid: true, totp_not_enabled: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isValid = await verifyTOTP(totpRow.encrypted_secret, code);
      return new Response(
        JSON.stringify({ valid: isValid }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check_status") {
      const { data: totpRow } = await adminClient
        .from("user_totp_secrets")
        .select("is_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({ is_enabled: totpRow?.is_enabled ?? false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disable") {
      if (!code) throw new Error("Verification code required");

      const { data: totpRow } = await adminClient
        .from("user_totp_secrets")
        .select("encrypted_secret")
        .eq("user_id", user.id)
        .single();

      if (!totpRow) throw new Error("TOTP not set up");

      const isValid = await verifyTOTP(totpRow.encrypted_secret, code);
      if (!isValid) throw new Error("Invalid verification code");

      await adminClient
        .from("user_totp_secrets")
        .delete()
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Unknown action");
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
