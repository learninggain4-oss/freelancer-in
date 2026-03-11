import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Web Push helpers ──

function base64UrlDecode(s: string): Uint8Array {
  const padding = "=".repeat((4 - (s.length % 4)) % 4);
  const base64 = (s + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function base64UrlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importVapidKeys(publicKeyB64: string, privateKeyB64: string) {
  const pubRaw = base64UrlDecode(publicKeyB64);
  const privRaw = base64UrlDecode(privateKeyB64);

  const publicKey = await crypto.subtle.importKey("raw", pubRaw, { name: "ECDSA", namedCurve: "P-256" }, true, []);

  // VAPID private keys are raw 32-byte keys, import as JWK
  const privKeyBytes = privRaw;
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(pubRaw.slice(1, 33)),
    y: base64UrlEncode(pubRaw.slice(33, 65)),
    d: base64UrlEncode(privKeyBytes),
    ext: true,
  };

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );

  return { publicKey, privateKey, publicKeyRaw: pubRaw };
}

async function createJWT(claims: Record<string, unknown>, privateKey: CryptoKey): Promise<string> {
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, data);

  // DER to raw r||s
  const sig = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  if (sig[0] === 0x30) {
    const rLen = sig[3];
    const rStart = 4;
    r = sig.slice(rStart, rStart + rLen);
    const sLen = sig[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    s = sig.slice(sStart, sStart + sLen);
  } else {
    r = sig.slice(0, 32);
    s = sig.slice(32, 64);
  }

  const padTo32 = (a: Uint8Array) => {
    if (a.length === 32) return a;
    if (a.length > 32) return a.slice(a.length - 32);
    const p = new Uint8Array(32);
    p.set(a, 32 - a.length);
    return p;
  };

  const rawSig = new Uint8Array(64);
  rawSig.set(padTo32(r), 0);
  rawSig.set(padTo32(s), 32);

  return `${header}.${payload}.${base64UrlEncode(rawSig)}`;
}

function concatUint8(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Proper HKDF extract + expand
async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    salt.length ? salt : new Uint8Array(32),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoWithCounter = concatUint8(info, new Uint8Array([1]));
  const okm = new Uint8Array(await crypto.subtle.sign("HMAC", key, infoWithCounter));
  return okm.slice(0, length);
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const prk = await hkdfExtract(salt, ikm);
  return hkdfExpand(prk, info, length);
}

function createInfo(type: string, clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const header = encoder.encode(`Content-Encoding: ${type}\0`);
  const clientInfo = concatUint8(encoder.encode("P-256\0"), new Uint8Array([0, 65]), clientPublicKey);
  const serverInfo = concatUint8(new Uint8Array([0, 65]), serverPublicKey);
  return concatUint8(header, clientInfo, serverInfo);
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth_key: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
) {
  const { publicKey, privateKey, publicKeyRaw } = await importVapidKeys(vapidPublicKey, vapidPrivateKey);

  // ECDH
  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));

  const clientAuthSecret = base64UrlDecode(subscription.auth_key);
  const clientPublicKey = base64UrlDecode(subscription.p256dh);

  const clientPubKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: clientPubKey }, localKeyPair.privateKey, 256)
  );

  // Salt MUST be generated first and used in key derivation
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive encryption keys using auth secret
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const prk = await hkdf(clientAuthSecret, sharedSecret, authInfo, 32);

  const cekInfo = createInfo("aesgcm", clientPublicKey, localPublicKeyRaw);
  const contentEncryptionKey = await hkdf(salt, prk, cekInfo, 16);

  const nonceInfo = createInfo("nonce", clientPublicKey, localPublicKeyRaw);
  const nonce = await hkdf(salt, prk, nonceInfo, 12);

  // Encrypt payload
  const paddedPayload = concatUint8(new Uint8Array([0, 0]), new TextEncoder().encode(payload));

  const cryptoKey = await crypto.subtle.importKey("raw", contentEncryptionKey, { name: "AES-GCM" }, false, ["encrypt"]);

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cryptoKey, paddedPayload)
  );

  // VAPID JWT
  const url = new URL(subscription.endpoint);
  const aud = `${url.protocol}//${url.host}`;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  const jwt = await createJWT({ aud, exp, sub: vapidSubject }, privateKey);

  const vapidAuth = `vapid t=${jwt}, k=${base64UrlEncode(publicKeyRaw)}`;

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aesgcm",
      "Crypto-Key": `dh=${base64UrlEncode(localPublicKeyRaw)}`,
      Encryption: `salt=${base64UrlEncode(salt)}`,
      Authorization: vapidAuth,
      TTL: "86400",
    },
    body: encrypted,
  });

  const responseText = await response.text();
  console.log(`Push to ${subscription.endpoint.slice(0, 50)}... status=${response.status} body=${responseText}`);

  return { status: response.status, ok: response.ok, statusText: response.statusText };
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@freelancer-india.lovable.app";

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: { user } } = await anonClient.auth.getUser(token);

      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { title, message, user_ids, send_to_all } = await req.json();
    console.log(`Sending push: title="${title}" send_to_all=${send_to_all} user_ids=${JSON.stringify(user_ids)}`);

    if (!title || !message) {
      return new Response(JSON.stringify({ error: "Title and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch subscriptions
    let query = supabase.from("push_subscriptions").select("*");
    if (!send_to_all && user_ids?.length) {
      query = query.in("user_id", user_ids);
    }

    const { data: subscriptions, error } = await query;
    if (error) {
      console.error("DB error fetching subscriptions:", error);
      throw error;
    }

    console.log(`Found ${(subscriptions || []).length} subscription(s)`);

    const payload = JSON.stringify({ title, body: message, url: "/" });
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const sub of subscriptions || []) {
      try {
        const result = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth_key: sub.auth_key },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        );
        if (result.ok || result.status === 201) {
          sent++;
        } else {
          failed++;
          errors.push(`${sub.endpoint.slice(0, 50)}: ${result.status} ${result.statusText}`);
          // Remove expired subscriptions
          if (result.status === 404 || result.status === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            console.log(`Removed expired subscription ${sub.id}`);
          }
        }
      } catch (e) {
        failed++;
        const errMsg = e instanceof Error ? e.message : String(e);
        errors.push(`${sub.endpoint?.slice(0, 50)}: ${errMsg}`);
        console.error(`Push error for sub ${sub.id}:`, errMsg);
      }
    }

    console.log(`Push results: sent=${sent} failed=${failed}`);
    if (errors.length) console.log(`Errors: ${JSON.stringify(errors)}`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: (subscriptions || []).length, errors: errors.slice(0, 5) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-push-notification error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
