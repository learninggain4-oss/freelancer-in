import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import cron from "node-cron";
import crypto from "crypto";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const PORT = process.env.SERVER_PORT || 3001;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

function isSuperAdmin(userEmail) {
  return SUPER_ADMIN_EMAILS.includes((userEmail || "").toLowerCase());
}

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service role key not configured");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getAnonClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase anon key not configured");
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function getUserFromToken(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const anonClient = getAnonClient();
  const { data: { user }, error } = await anonClient.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ─── TOTP helpers ───

function base32Decode(str) {
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

function base32Encode(bytes) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    result += alphabet[parseInt(chunk, 2)];
  }
  const padding = (8 - (result.length % 8)) % 8;
  return result + "=".repeat(padding);
}

async function hmacSha1(key, data) {
  const { createHmac } = await import("crypto");
  const hmac = createHmac("sha1", Buffer.from(key));
  hmac.update(Buffer.from(data));
  return new Uint8Array(hmac.digest());
}

async function verifyTOTP(secret, token, window = 1) {
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
    const expected = (code % 1000000).toString().padStart(6, "0");
    if (expected === token) return true;
  }
  return false;
}

function generateSecret() {
  const { randomBytes } = require("crypto");
  const bytes = randomBytes(20);
  return base32Encode(new Uint8Array(bytes));
}

async function hashPassword(password) {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(password).digest("hex");
}

// ─── Rate limiter ───
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function generateWithdrawalOrderId(length = 15) {
  const safeLength = Math.max(5, Math.floor(length));
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const datePrefix = `${dd}${mm}${yy}`;
  const randomLength = safeLength - datePrefix.length;
  let randomDigits = "";
  for (let i = 0; i < randomLength; i++) {
    randomDigits += Math.floor(Math.random() * 10).toString();
  }
  return `${datePrefix}${randomDigits}`;
}

// ─── /functions/v1/user-totp ───
app.post("/functions/v1/user-totp", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Not authenticated" });

    const user = await getUserFromToken(authHeader);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const adminClient = getAdminClient();
    const { action, code, user_id: target_user_id } = req.body;

    if (action === "check_status_by_id" && target_user_id) {
      const { data: totpRow } = await adminClient
        .from("user_totp_secrets")
        .select("is_enabled")
        .eq("user_id", target_user_id)
        .maybeSingle();
      return res.json({ is_enabled: totpRow?.is_enabled ?? false });
    }

    if (action === "check_status") {
      const { data: totpRow } = await adminClient
        .from("user_totp_secrets")
        .select("is_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      return res.json({ is_enabled: totpRow?.is_enabled ?? false });
    }

    if (action === "setup") {
      const secret = generateSecret();
      const otpauthUrl = `otpauth://totp/Freelancer-in:${user.email}?secret=${secret}&issuer=Freelancer-in&digits=6&period=30`;
      await adminClient.from("user_totp_secrets").upsert({
        user_id: user.id,
        encrypted_secret: secret,
        is_enabled: false,
      }, { onConflict: "user_id" });
      return res.json({ secret, otpauth_url: otpauthUrl });
    }

    if (action === "enable") {
      if (!code) throw new Error("Verification code required");
      const { data: totpRow } = await adminClient
        .from("user_totp_secrets")
        .select("encrypted_secret")
        .eq("user_id", user.id)
        .single();
      if (!totpRow) throw new Error("TOTP not set up");
      const isValid = await verifyTOTP(totpRow.encrypted_secret, code);
      if (!isValid) throw new Error("Invalid verification code");
      await adminClient.from("user_totp_secrets").update({ is_enabled: true }).eq("user_id", user.id);
      return res.json({ success: true });
    }

    if (action === "verify") {
      if (!code) throw new Error("Verification code required");
      const { data: totpRow } = await adminClient
        .from("user_totp_secrets")
        .select("encrypted_secret, is_enabled")
        .eq("user_id", user.id)
        .single();
      if (!totpRow || !totpRow.is_enabled) throw new Error("TOTP not enabled");
      const isValid = await verifyTOTP(totpRow.encrypted_secret, code);
      return res.json({ valid: isValid });
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
      await adminClient.from("user_totp_secrets").delete().eq("user_id", user.id);
      return res.json({ success: true });
    }

    throw new Error("Unknown action");
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── /functions/v1/admin-totp ───
app.post("/functions/v1/admin-totp", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Not authenticated" });

    const user = await getUserFromToken(authHeader);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const adminClient = getAdminClient();
    const { action, code } = req.body;

    if (action === "check_status") {
      const { data: totpRow } = await adminClient
        .from("admin_totp_secrets")
        .select("is_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      return res.json({ is_enabled: totpRow?.is_enabled ?? false });
    }

    if (action === "setup") {
      const secret = generateSecret();
      const otpauthUrl = `otpauth://totp/Freelancer-in-Admin:${user.email}?secret=${secret}&issuer=Freelancer-in&digits=6&period=30`;
      await adminClient.from("admin_totp_secrets").upsert({
        user_id: user.id,
        encrypted_secret: secret,
        is_enabled: false,
      }, { onConflict: "user_id" });
      return res.json({ secret, otpauth_url: otpauthUrl });
    }

    if (action === "enable") {
      if (!code) throw new Error("Verification code required");
      const { data: totpRow } = await adminClient
        .from("admin_totp_secrets")
        .select("encrypted_secret")
        .eq("user_id", user.id)
        .single();
      if (!totpRow) throw new Error("TOTP not set up");
      const isValid = await verifyTOTP(totpRow.encrypted_secret, code);
      if (!isValid) throw new Error("Invalid verification code");
      await adminClient.from("admin_totp_secrets").update({ is_enabled: true }).eq("user_id", user.id);
      return res.json({ success: true });
    }

    if (action === "verify") {
      if (!code) throw new Error("Verification code required");
      const { data: totpRow } = await adminClient
        .from("admin_totp_secrets")
        .select("encrypted_secret, is_enabled")
        .eq("user_id", user.id)
        .single();
      if (!totpRow || !totpRow.is_enabled) throw new Error("TOTP not enabled");
      const isValid = await verifyTOTP(totpRow.encrypted_secret, code);
      return res.json({ valid: isValid });
    }

    if (action === "disable") {
      if (!code) throw new Error("Verification code required");
      const { data: totpRow } = await adminClient
        .from("admin_totp_secrets")
        .select("encrypted_secret")
        .eq("user_id", user.id)
        .single();
      if (!totpRow) throw new Error("TOTP not set up");
      const isValid = await verifyTOTP(totpRow.encrypted_secret, code);
      if (!isValid) throw new Error("Invalid verification code");
      await adminClient.from("admin_totp_secrets").delete().eq("user_id", user.id);
      return res.json({ success: true });
    }

    throw new Error("Unknown action");
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── /functions/v1/withdrawal-password ───
app.post("/functions/v1/withdrawal-password", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Not authenticated" });
    const user = await getUserFromToken(authHeader);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const adminClient = getAdminClient();
    const { action, password, current_password } = req.body;

    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, withdrawal_password_hash")
      .eq("user_id", user.id)
      .single();
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    if (action === "status") return res.json({ has_password: !!profile.withdrawal_password_hash });

    if (action === "set") {
      if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
      if (profile.withdrawal_password_hash) {
        if (!current_password) return res.status(400).json({ error: "Current password is required" });
        const currentHash = await hashPassword(current_password);
        if (currentHash !== profile.withdrawal_password_hash) return res.status(400).json({ error: "Current password is incorrect" });
      }
      const hash = await hashPassword(password);
      await adminClient.from("profiles").update({ withdrawal_password_hash: hash }).eq("id", profile.id);
      return res.json({ success: true });
    }

    if (action === "verify") {
      if (!password) return res.status(400).json({ error: "Password is required" });
      if (!profile.withdrawal_password_hash) return res.status(400).json({ error: "No withdrawal password set" });
      const hash = await hashPassword(password);
      return res.json({ valid: hash === profile.withdrawal_password_hash });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── /functions/v1/coin-operations ───
app.post("/functions/v1/coin-operations", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Missing authorization header" });
    const user = await getUserFromToken(authHeader);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const adminClient = getAdminClient();
    const { action } = req.body;

    const { data: profile, error: pErr } = await adminClient
      .from("profiles")
      .select("id, user_id, coin_balance, available_balance, approval_status")
      .eq("user_id", user.id)
      .single();
    if (pErr || !profile) throw new Error("Profile not found");
    if (profile.approval_status !== "approved") throw new Error("Account not approved");

    if (action === "convert_coins") {
      const coinBalance = Number(profile.coin_balance);
      const { data: settings } = await adminClient.from("app_settings").select("key, value").in("key", ["min_coin_conversion", "coin_conversion_rate"]);
      let minCoins = 250, rate = 100;
      if (settings) {
        for (const s of settings) {
          if (s.key === "min_coin_conversion") minCoins = Number(s.value) || 250;
          if (s.key === "coin_conversion_rate") rate = Number(s.value) || 100;
        }
      }
      if (coinBalance < minCoins) throw new Error(`Minimum ${minCoins} coins required for conversion`);
      const rupeeAmount = coinBalance / rate;
      await adminClient.from("profiles").update({ coin_balance: 0, available_balance: Number(profile.available_balance) + rupeeAmount }).eq("id", profile.id);
      await adminClient.from("coin_transactions").insert({ profile_id: profile.id, amount: -coinBalance, type: "conversion", description: `Converted ${coinBalance} coins to ₹${rupeeAmount.toFixed(2)}` });
      await adminClient.from("transactions").insert({ profile_id: profile.id, type: "credit", amount: rupeeAmount, description: `Coin conversion: ${coinBalance} coins` });
      return res.json({ success: true, coins_converted: coinBalance, rupees_credited: rupeeAmount, new_coin_balance: 0 });
    }

    throw new Error("Unknown action");
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── /functions/v1/check-ip-block ───
app.post("/functions/v1/check-ip-block", async (req, res) => {
  try {
    const ip_address = (req.headers["x-forwarded-for"] || "").split(",")[0]?.trim() || req.headers["x-real-ip"] || req.socket?.remoteAddress || null;
    if (!ip_address) return res.json({ blocked: false });

    const adminClient = getAdminClient();
    const { data } = await adminClient.from("blocked_ips").select("id").eq("ip_address", ip_address).maybeSingle();
    return res.json({ blocked: !!data });
  } catch (err) {
    res.status(500).json({ blocked: false, error: err.message });
  }
});

// ─── /functions/v1/track-visitor ───
app.post("/functions/v1/track-visitor", async (req, res) => {
  try {
    const ip_address = (req.headers["x-forwarded-for"] || "").split(",")[0]?.trim() || req.headers["x-real-ip"] || null;
    let city = null, country = null;
    if (ip_address) {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip_address}/json/`, { signal: AbortSignal.timeout(3000) });
        if (geoRes.ok) {
          const geo = await geoRes.json();
          city = geo.city || null;
          country = geo.country_name || null;
        }
      } catch {}
    }
    const adminClient = getAdminClient();
    await adminClient.from("site_visitors").insert({
      ip_address,
      user_agent: req.body.user_agent || null,
      page_path: req.body.page_path || null,
      referrer: req.body.referrer || null,
      profile_id: req.body.profile_id || null,
      device_type: req.body.device_type || null,
      city,
      country,
    });
    let blocked = false;
    if (ip_address) {
      const { data: blockData } = await adminClient.from("blocked_ips").select("id").eq("ip_address", ip_address).maybeSingle();
      blocked = !!blockData;
    }
    return res.json({ success: true, blocked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── /functions/v1/manage-ip-block ───
app.post("/functions/v1/manage-ip-block", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    const user = await getUserFromToken(authHeader);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const adminClient = getAdminClient();
    const { data: roleData } = await adminClient.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) return res.status(403).json({ error: "Forbidden" });

    const { action, ip_address, reason } = req.body;
    if (!ip_address) return res.status(400).json({ error: "ip_address is required" });

    const { data: profile } = await adminClient.from("profiles").select("id").eq("user_id", user.id).single();

    if (action === "block") {
      await adminClient.from("blocked_ips").upsert({ ip_address, reason: reason || null, blocked_by: profile?.id || null }, { onConflict: "ip_address" });
      return res.json({ success: true, action: "blocked" });
    } else if (action === "unblock") {
      await adminClient.from("blocked_ips").delete().eq("ip_address", ip_address);
      return res.json({ success: true, action: "unblocked" });
    }
    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── /functions/v1/verify-captcha ───
app.post("/functions/v1/verify-captcha", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: "Missing captcha token" });

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) return res.status(500).json({ success: false, error: "Server configuration error" });

    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });
    const verifyData = await verifyRes.json();
    return res.json({ success: verifyData.success === true });
  } catch (err) {
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

// ─── /functions/v1/send-onesignal ───
app.post("/functions/v1/send-onesignal", async (req, res) => {
  try {
    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) throw new Error("OneSignal credentials not configured");

    const { action, user_id, user_ids, title, message, type, segment } = req.body;
    const WEB_APP_URL = process.env.WEB_APP_URL || "https://freelancer-india.lovable.app";
    const basePayload = { app_id: ONESIGNAL_APP_ID, headings: { en: title }, contents: { en: message || "" }, data: { type: type || "info" }, web_url: WEB_APP_URL };

    const postToOneSignal = async (payload) => {
      const r = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Key ${ONESIGNAL_REST_API_KEY}` },
        body: JSON.stringify(payload),
      });
      const result = await r.json();
      if (!r.ok || result?.errors) throw new Error(`OneSignal API error: ${JSON.stringify(result?.errors ?? result)}`);
      return result;
    };

    if (!action || action === "push_to_user") {
      if (!user_id || !title) return res.status(400).json({ error: "user_id and title required" });
      const result = await postToOneSignal({ ...basePayload, include_aliases: { external_id: [user_id] }, target_channel: "push" });
      return res.json({ success: true, result });
    }
    if (action === "push_to_all") {
      if (!title) return res.status(400).json({ error: "title required" });
      const result = await postToOneSignal({ ...basePayload, included_segments: [segment || "Subscribed Users"] });
      return res.json({ success: true, result });
    }
    if (action === "push_to_users") {
      if (!Array.isArray(user_ids) || user_ids.length === 0 || !title) return res.status(400).json({ error: "user_ids and title required" });
      const result = await postToOneSignal({ ...basePayload, include_aliases: { external_id: user_ids }, target_channel: "push" });
      return res.json({ success: true, result });
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── /functions/v1/admin-user-management ───
app.post("/functions/v1/admin-user-management", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    const user = await getUserFromToken(authHeader);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const adminClient = getAdminClient();
    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) return res.status(403).json({ error: "Forbidden: admin role required" });

    const { action, user_id, profile_id, email, user_type } = req.body;

    if (action === "permanent_delete") {
      if (!profile_id) return res.status(400).json({ error: "profile_id required" });
      const { data: profile } = await adminClient.from("profiles").select("user_id, full_name").eq("id", profile_id).single();
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const pid = profile_id;
      const userId = profile.user_id;

      const { data: empServices } = await adminClient.from("employee_services").select("id").eq("profile_id", pid);
      if (empServices?.length > 0) {
        const serviceIds = empServices.map(s => s.id);
        await adminClient.from("employee_skill_selections").delete().in("employee_service_id", serviceIds);
      }

      const { data: clientProjects } = await adminClient.from("projects").select("id").eq("client_id", pid);
      if (clientProjects?.length > 0) {
        const projectIds = clientProjects.map(p => p.id);
        const { data: chatRooms } = await adminClient.from("chat_rooms").select("id").in("project_id", projectIds);
        if (chatRooms?.length > 0) {
          const roomIds = chatRooms.map(r => r.id);
          const { data: roomMessages } = await adminClient.from("messages").select("id").in("chat_room_id", roomIds);
          if (roomMessages?.length > 0) {
            await adminClient.from("message_reactions").delete().in("message_id", roomMessages.map(m => m.id));
          }
          await adminClient.from("messages").delete().in("chat_room_id", roomIds);
          await adminClient.from("chat_rooms").delete().in("id", roomIds);
        }
        await Promise.all([
          adminClient.from("project_applications").delete().in("project_id", projectIds),
          adminClient.from("project_submissions").delete().in("project_id", projectIds),
          adminClient.from("project_documents").delete().in("project_id", projectIds),
          adminClient.from("payment_confirmations").delete().in("project_id", projectIds),
          adminClient.from("recovery_requests").delete().in("project_id", projectIds),
        ]);
        await adminClient.from("projects").delete().in("id", projectIds);
      }

      await adminClient.from("projects").update({ assigned_employee_id: null }).eq("assigned_employee_id", pid);
      await Promise.all([
        adminClient.from("aadhaar_verifications").delete().eq("profile_id", pid),
        adminClient.from("bank_verifications").delete().eq("profile_id", pid),
        adminClient.from("documents").delete().eq("profile_id", pid),
        adminClient.from("employee_emergency_contacts").delete().eq("profile_id", pid),
        adminClient.from("employee_services").delete().eq("profile_id", pid),
        adminClient.from("notifications").delete().eq("user_id", userId),
        adminClient.from("registration_metadata").delete().eq("profile_id", pid),
        adminClient.from("transactions").delete().eq("profile_id", pid),
        adminClient.from("withdrawals").delete().eq("employee_id", pid),
        adminClient.from("user_roles").delete().eq("user_id", userId),
        adminClient.from("user_bank_accounts").delete().eq("profile_id", pid),
        adminClient.from("attendance").delete().eq("profile_id", pid),
        adminClient.from("coin_transactions").delete().eq("profile_id", pid),
      ]);

      await adminClient.from("profiles").delete().eq("id", pid);
      const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteAuthErr) console.error("Auth delete error:", deleteAuthErr.message);

      return res.json({ success: true, message: "User permanently deleted" });
    }

    if (action === "toggle_suspension") {
      if (!user_id) return res.status(400).json({ error: "user_id required" });
      const { data: userData } = await adminClient.auth.admin.getUserById(user_id);
      if (!userData?.user) return res.status(404).json({ error: "User not found" });
      const isBanned = !!userData.user.banned_until;
      if (isBanned) {
        await adminClient.auth.admin.updateUserById(user_id, { ban_duration: "none" });
        return res.json({ success: true, suspended: false });
      } else {
        await adminClient.auth.admin.updateUserById(user_id, { ban_duration: "876600h" });
        return res.json({ success: true, suspended: true });
      }
    }

    if (action === "list_sessions") {
      if (!user_id) return res.status(400).json({ error: "user_id required" });
      return res.json({ success: true, sessions: [] });
    }

    if (action === "revoke_sessions") {
      if (!user_id) return res.status(400).json({ error: "user_id required" });
      await adminClient.auth.admin.signOut(user_id, "global");
      return res.json({ success: true, message: "All sessions revoked" });
    }

    if (action === "invite_user") {
      if (!email || !user_type) return res.status(400).json({ error: "email and user_type required" });
      const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email);
      if (inviteErr) return res.status(400).json({ error: inviteErr.message });
      const invitedUserId = inviteData?.user?.id;
      if (invitedUserId) {
        await adminClient.from("profiles").insert({
          user_id: invitedUserId,
          email,
          full_name: [email.split("@")[0].toUpperCase()],
          user_code: ["PENDING"],
          user_type,
          approval_status: "approved",
          approved_at: new Date().toISOString(),
          referral_code: invitedUserId.substring(0, 8).toUpperCase(),
        }).catch(e => console.error("Profile creation error:", e.message));
      }
      return res.json({ success: true, message: `Invite sent to ${email}` });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("admin-user-management error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── /functions/v1/wallet-operations ───
app.post("/functions/v1/wallet-operations", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(400).json({ error: "Missing authorization header" });
    const user = await getUserFromToken(authHeader);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!checkRateLimit(user.id)) return res.status(429).json({ error: "Rate limit exceeded. Please try again later." });

    const supabase = getAdminClient();
    const { action, amount, profile_id, withdrawal_id, status, review_notes, project_id, upi_id, bank_account_number, bank_ifsc_code, bank_name, bank_holder_name, reject_reason, recovery_request_id, admin_notes, target_profile_id, transfer_to_profile_id, description, adjust_balance, transaction_id, type, target_wallet_number } = req.body;

    const { data: callerProfile, error: cpErr } = await supabase.from("profiles").select("id, user_id, user_type, available_balance, hold_balance, approval_status, wallet_number").eq("user_id", user.id).single();
    if (cpErr || !callerProfile) throw new Error("Profile not found");
    if (callerProfile.approval_status !== "approved") throw new Error("Account not approved");

    let result = { success: true };

    switch (action) {
      case "add_money": {
        if (callerProfile.user_type !== "client") throw new Error("Only clients can add money");
        if (!amount || amount <= 0) throw new Error("Invalid amount");
        const newBalance = Number(callerProfile.available_balance) + amount;
        await supabase.from("profiles").update({ available_balance: newBalance }).eq("id", callerProfile.id);
        await supabase.from("transactions").insert({ profile_id: callerProfile.id, type: "credit", amount, description: "Added to wallet" });
        result.new_balance = newBalance;
        break;
      }

      case "request_withdrawal": {
        if (callerProfile.user_type !== "employee") throw new Error("Only employees can request withdrawals");
        if (!amount || amount <= 0) throw new Error("Invalid amount");
        const requestedAmount = Number(amount);
        const originalBalance = Number(callerProfile.available_balance);
        if (requestedAmount > originalBalance) throw new Error("Insufficient balance");

        const { data: bankVerif } = await supabase.from("bank_verifications").select("status").eq("profile_id", callerProfile.id).single();
        if (!bankVerif || bankVerif.status !== "verified") throw new Error("Bank details must be verified before requesting withdrawals.");

        const nextBalance = originalBalance - requestedAmount;
        await supabase.from("profiles").update({ available_balance: nextBalance }).eq("id", callerProfile.id);
        const { data: newW, error: wErr } = await supabase.from("withdrawals").insert({
          employee_id: callerProfile.id,
          amount: requestedAmount,
          method: upi_id ? "UPI" : "Bank Transfer",
          upi_id: upi_id || null,
          bank_account_number: bank_account_number || null,
          bank_ifsc_code: bank_ifsc_code || null,
          bank_holder_name: bank_holder_name || null,
        }).select("id, order_id").single();
        if (wErr || !newW?.id) throw new Error("Failed to create withdrawal record");

        await supabase.from("transactions").insert({
          profile_id: callerProfile.id, type: "debit", amount: requestedAmount,
          description: newW.order_id ? `Withdrawal requested (Order ID: ${newW.order_id})` : "Withdrawal requested",
          reference_id: newW.id,
        });
        result.withdrawal_id = newW.id;
        result.order_id = newW.order_id;
        result.new_balance = nextBalance;
        break;
      }

      case "confirm_job": {
        if (callerProfile.user_type !== "client") throw new Error("Only clients can confirm jobs");
        if (!project_id) throw new Error("Missing project_id");
        const { data: proj } = await supabase.from("projects").select("id, client_id, assigned_employee_id, status").eq("id", project_id).single();
        if (!proj) throw new Error("Project not found");
        if (proj.client_id !== callerProfile.id) throw new Error("Not your project");
        if (proj.status !== "in_progress") throw new Error("Project must be in_progress to confirm job");
        await supabase.from("projects").update({ status: "job_confirmed" }).eq("id", project_id);
        result.status = "job_confirmed";
        break;
      }

      case "hold_project_payment": {
        if (callerProfile.user_type !== "client") throw new Error("Only clients can initiate payment");
        if (!project_id) throw new Error("Missing project_id");
        const { data: proj } = await supabase.from("projects").select("id, amount, validation_fees, client_id, assigned_employee_id, status").eq("id", project_id).single();
        if (!proj) throw new Error("Project not found");
        if (proj.client_id !== callerProfile.id) throw new Error("Not your project");
        if (proj.status !== "job_confirmed") throw new Error("Project must be job_confirmed");
        const budgetAmount = Number(proj.amount);
        const validationFees = Number(proj.validation_fees) || 0;
        const totalRequired = budgetAmount + validationFees;
        if (Number(callerProfile.available_balance) < totalRequired) throw new Error("Insufficient balance");
        await supabase.from("profiles").update({ available_balance: Number(callerProfile.available_balance) - totalRequired }).eq("id", callerProfile.id);
        if (proj.assigned_employee_id) {
          const { data: empP } = await supabase.from("profiles").select("hold_balance").eq("id", proj.assigned_employee_id).single();
          if (empP) await supabase.from("profiles").update({ hold_balance: Number(empP.hold_balance) + budgetAmount }).eq("id", proj.assigned_employee_id);
        }
        await supabase.from("projects").update({ status: "payment_processing" }).eq("id", project_id);
        result.status = "payment_processing";
        break;
      }

      case "confirm_validation": {
        if (callerProfile.user_type !== "client") throw new Error("Only clients can confirm validation");
        if (!project_id) throw new Error("Missing project_id");
        const { data: projV } = await supabase.from("projects").select("id, amount, validation_fees, client_id, assigned_employee_id, status").eq("id", project_id).single();
        if (!projV) throw new Error("Project not found");
        if (projV.client_id !== callerProfile.id) throw new Error("Not your project");
        if (projV.status !== "payment_processing") throw new Error("Project must be in payment_processing");
        await supabase.from("projects").update({ status: "validation" }).eq("id", project_id);
        result.status = "validation";
        break;
      }

      case "release_project_payment": {
        if (callerProfile.user_type !== "client") throw new Error("Only clients can release payments");
        if (!project_id) throw new Error("Missing project_id");
        const { data: project } = await supabase.from("projects").select("id, amount, validation_fees, client_id, assigned_employee_id, status").eq("id", project_id).single();
        if (!project) throw new Error("Project not found");
        if (project.client_id !== callerProfile.id) throw new Error("Not your project");
        if (project.status !== "validation") throw new Error("Project must be in validation");
        const totalAmount = Number(project.amount) + Number(project.validation_fees);
        const { data: empProfile } = await supabase.from("profiles").select("hold_balance, available_balance").eq("id", project.assigned_employee_id).single();
        if (empProfile) {
          await supabase.from("profiles").update({ hold_balance: Number(empProfile.hold_balance) - totalAmount, available_balance: Number(empProfile.available_balance) + totalAmount }).eq("id", project.assigned_employee_id);
        }
        await supabase.from("projects").update({ status: "completed" }).eq("id", project_id);
        await supabase.from("transactions").insert({ profile_id: project.assigned_employee_id, type: "release", amount: totalAmount, description: `Payment released for project: ${project_id}`, reference_id: project_id });
        result.status = "completed";
        break;
      }

      case "refund_project_payment": {
        if (callerProfile.user_type !== "client") throw new Error("Only clients can reject projects");
        if (!project_id) throw new Error("Missing project_id");
        const { data: project } = await supabase.from("projects").select("id, amount, validation_fees, client_id, assigned_employee_id, status, remarks").eq("id", project_id).single();
        if (!project) throw new Error("Project not found");
        if (project.client_id !== callerProfile.id) throw new Error("Not your project");
        await supabase.from("projects").update({ status: "cancelled", remarks: reject_reason || project.remarks || "Rejected by client" }).eq("id", project_id);
        result.status = "cancelled";
        break;
      }

      case "process_withdrawal": {
        if (callerProfile.user_type !== "client") throw new Error("Only clients can process withdrawals");
        if (!withdrawal_id || !status) throw new Error("Missing withdrawal_id or status");
        const { data: w } = await supabase.from("withdrawals").select("id, employee_id, amount, status").eq("id", withdrawal_id).single();
        if (!w) throw new Error("Withdrawal not found");
        if (w.status !== "pending") throw new Error("Withdrawal is not pending");

        if (status === "completed") {
          await supabase.from("withdrawals").update({ status: "completed", reviewed_at: new Date().toISOString(), review_notes: review_notes || null }).eq("id", withdrawal_id);
        } else if (status === "rejected") {
          await supabase.from("profiles").update({ available_balance: Number(callerProfile.available_balance) + Number(w.amount) }).eq("id", w.employee_id);
          await supabase.from("withdrawals").update({ status: "rejected", reviewed_at: new Date().toISOString(), review_notes: review_notes || null }).eq("id", withdrawal_id);
          await supabase.from("transactions").insert({ profile_id: w.employee_id, type: "credit", amount: w.amount, description: "Withdrawal rejected — amount restored", reference_id: withdrawal_id });
        }
        result.status = status;
        break;
      }

      case "admin_process_withdrawal":
      case "admin_release_held_balance":
      case "admin_hold_balance":
      case "admin_wallet_add":
      case "admin_wallet_deduct":
      case "admin_wallet_hold":
      case "admin_wallet_release":
      case "admin_wallet_transfer":
      case "admin_edit_transaction":
      case "admin_delete_transaction":
      case "admin_edit_withdrawal":
      case "admin_delete_withdrawal": {
        const { data: roleCheck } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
        if (!roleCheck) throw new Error("Admin access required");

        if (action === "admin_wallet_add") {
          if (!target_profile_id || !amount || amount <= 0) throw new Error("Missing target_profile_id or invalid amount");
          const { data: tp } = await supabase.from("profiles").select("id, available_balance, user_id").eq("id", target_profile_id).single();
          if (!tp) throw new Error("Target profile not found");
          const newBal = Number(tp.available_balance) + amount;
          await supabase.from("profiles").update({ available_balance: newBal }).eq("id", tp.id);
          await supabase.from("transactions").insert({ profile_id: tp.id, type: "credit", amount, description: description || "Admin: added to wallet" });
          await supabase.from("notifications").insert({ user_id: tp.user_id, title: "Wallet Credited", message: `₹${amount.toLocaleString("en-IN")} has been added to your wallet by admin.`, type: "financial" });
          result.new_balance = newBal;
        } else if (action === "admin_wallet_deduct") {
          if (!target_profile_id || !amount || amount <= 0) throw new Error("Missing target_profile_id or invalid amount");
          const { data: tp } = await supabase.from("profiles").select("id, available_balance, user_id").eq("id", target_profile_id).single();
          if (!tp) throw new Error("Target profile not found");
          const newBal = Number(tp.available_balance) - amount;
          await supabase.from("profiles").update({ available_balance: newBal }).eq("id", tp.id);
          await supabase.from("transactions").insert({ profile_id: tp.id, type: "debit", amount, description: description || "Admin: deducted from wallet" });
          await supabase.from("notifications").insert({ user_id: tp.user_id, title: "Wallet Deducted", message: `₹${amount.toLocaleString("en-IN")} has been deducted from your wallet by admin.`, type: "financial" });
          result.new_balance = newBal;
        } else if (action === "admin_process_withdrawal") {
          if (!withdrawal_id || !status) throw new Error("Missing withdrawal_id or status");
          const { data: w } = await supabase.from("withdrawals").select("id, employee_id, amount, status").eq("id", withdrawal_id).single();
          if (!w) throw new Error("Withdrawal not found");
          if (status === "rejected") {
            const { data: empP } = await supabase.from("profiles").select("available_balance, user_id").eq("id", w.employee_id).single();
            if (empP) {
              await supabase.from("profiles").update({ available_balance: Number(empP.available_balance) + Number(w.amount) }).eq("id", w.employee_id);
              await supabase.from("notifications").insert({ user_id: empP.user_id, title: "Withdrawal Rejected", message: `Your withdrawal of ₹${Number(w.amount).toLocaleString("en-IN")} was rejected. Amount restored.`, type: "financial" });
            }
          } else if (status === "completed") {
            const { data: empP } = await supabase.from("profiles").select("user_id").eq("id", w.employee_id).single();
            if (empP) await supabase.from("notifications").insert({ user_id: empP.user_id, title: "Withdrawal Completed", message: `Your withdrawal of ₹${Number(w.amount).toLocaleString("en-IN")} has been processed.`, type: "financial" });
          }
          await supabase.from("withdrawals").update({ status, reviewed_at: new Date().toISOString(), review_notes: review_notes || null }).eq("id", withdrawal_id);
          result.status = status;
        } else if (action === "admin_delete_transaction") {
          if (!transaction_id) throw new Error("Missing transaction_id");
          await supabase.from("transactions").delete().eq("id", transaction_id);
        } else if (action === "admin_delete_withdrawal") {
          if (!withdrawal_id) throw new Error("Missing withdrawal_id");
          await supabase.from("withdrawals").delete().eq("id", withdrawal_id);
        } else if (action === "admin_edit_transaction") {
          if (!transaction_id) throw new Error("Missing transaction_id");
          const updates = {};
          if (amount !== undefined) updates.amount = amount;
          if (description !== undefined) updates.description = description;
          if (type !== undefined) updates.type = type;
          await supabase.from("transactions").update(updates).eq("id", transaction_id);
        } else if (action === "admin_edit_withdrawal") {
          if (!withdrawal_id) throw new Error("Missing withdrawal_id");
          const updates = {};
          if (status !== undefined) updates.status = status;
          if (amount !== undefined) updates.amount = amount;
          if (review_notes !== undefined) updates.review_notes = review_notes;
          await supabase.from("withdrawals").update(updates).eq("id", withdrawal_id);
        } else if (action === "admin_wallet_hold") {
          if (!target_profile_id || !amount || amount <= 0) throw new Error("Missing target_profile_id or invalid amount");
          const { data: tp } = await supabase.from("profiles").select("id, available_balance, hold_balance, user_id").eq("id", target_profile_id).single();
          if (!tp) throw new Error("Target profile not found");
          const holdAmt = Math.min(amount, Number(tp.available_balance));
          if (holdAmt <= 0) throw new Error("Insufficient available balance");
          await supabase.from("profiles").update({ available_balance: Number(tp.available_balance) - holdAmt, hold_balance: Number(tp.hold_balance) + holdAmt }).eq("id", tp.id);
          await supabase.from("transactions").insert({ profile_id: tp.id, type: "hold", amount: holdAmt, description: description || "Admin: amount held" });
        } else if (action === "admin_wallet_release") {
          if (!target_profile_id || !amount || amount <= 0) throw new Error("Missing target_profile_id or invalid amount");
          const { data: tp } = await supabase.from("profiles").select("id, available_balance, hold_balance, user_id").eq("id", target_profile_id).single();
          if (!tp) throw new Error("Target profile not found");
          const releaseAmt = Math.min(amount, Number(tp.hold_balance));
          await supabase.from("profiles").update({ available_balance: Number(tp.available_balance) + releaseAmt, hold_balance: Number(tp.hold_balance) - releaseAmt }).eq("id", tp.id);
          await supabase.from("transactions").insert({ profile_id: tp.id, type: "release", amount: releaseAmt, description: description || "Admin: amount released" });
        } else if (action === "admin_wallet_transfer") {
          if (!target_profile_id || !transfer_to_profile_id || !amount || amount <= 0) throw new Error("Missing required fields");
          const { data: from } = await supabase.from("profiles").select("id, available_balance").eq("id", target_profile_id).single();
          const { data: to } = await supabase.from("profiles").select("id, available_balance").eq("id", transfer_to_profile_id).single();
          if (!from || !to) throw new Error("Profile not found");
          if (Number(from.available_balance) < amount) throw new Error("Insufficient balance");
          await supabase.from("profiles").update({ available_balance: Number(from.available_balance) - amount }).eq("id", from.id);
          await supabase.from("profiles").update({ available_balance: Number(to.available_balance) + amount }).eq("id", to.id);
          await supabase.from("transactions").insert([
            { profile_id: from.id, type: "debit", amount, description: description || "Admin: wallet transfer" },
            { profile_id: to.id, type: "credit", amount, description: description || "Admin: wallet transfer received" },
          ]);
        } else if (action === "admin_release_held_balance" || action === "admin_hold_balance") {
          if (!recovery_request_id || !amount || amount <= 0) throw new Error("Missing recovery_request_id or invalid amount");
          const { data: recReq } = await supabase.from("recovery_requests").select("*, employee:profiles!recovery_requests_employee_id_fkey(id, available_balance, hold_balance, user_id)").eq("id", recovery_request_id).single();
          if (!recReq) throw new Error("Recovery request not found");
          const emp = recReq.employee;
          if (!emp) throw new Error("Employee not found");
          if (action === "admin_hold_balance") {
            const holdAmount = Math.min(amount, Number(emp.available_balance));
            await supabase.from("profiles").update({ available_balance: Number(emp.available_balance) - holdAmount, hold_balance: Number(emp.hold_balance) + holdAmount }).eq("id", emp.id);
            await supabase.from("transactions").insert({ profile_id: emp.id, type: "hold", amount: holdAmount, description: `Recovery: balance held by admin for recovery request: ${recovery_request_id}`, reference_id: recReq.project_id });
          } else {
            const releaseAmount = Math.min(amount, Number(emp.hold_balance));
            await supabase.from("profiles").update({ available_balance: Number(emp.available_balance) + releaseAmount, hold_balance: Number(emp.hold_balance) - releaseAmount }).eq("id", emp.id);
            await supabase.from("transactions").insert({ profile_id: emp.id, type: "release", amount: releaseAmount, description: `Recovery: held balance released by admin for recovery request: ${recovery_request_id}`, reference_id: recReq.project_id });
          }
        }
        break;
      }

      case "lookup_wallet": {
        if (!target_wallet_number) throw new Error("Missing target_wallet_number");
        const { data: recipient } = await supabase.from("profiles").select("id, wallet_number, full_name, user_type, available_balance").eq("wallet_number", target_wallet_number).single();
        if (!recipient) throw new Error("Wallet not found");
        const recipientName = Array.isArray(recipient.full_name) ? recipient.full_name[0] : recipient.full_name ?? "Unknown";
        result.found = true;
        result.recipient_id = recipient.id;
        result.recipient_name = recipientName;
        result.recipient_wallet_number = recipient.wallet_number;
        break;
      }

      case "transfer_to_wallet": {
        if (!target_wallet_number || !amount || amount <= 0) throw new Error("Missing target wallet or invalid amount");
        if (target_wallet_number === callerProfile.wallet_number) throw new Error("Cannot transfer to own wallet");
        if (Number(callerProfile.available_balance) < amount) throw new Error("Insufficient balance");
        const { data: recipient } = await supabase.from("profiles").select("id, wallet_number, full_name, available_balance, user_id").eq("wallet_number", target_wallet_number).single();
        if (!recipient) throw new Error("Recipient wallet not found");
        const recipientName = Array.isArray(recipient.full_name) ? recipient.full_name[0] : recipient.full_name ?? "Someone";
        await supabase.from("profiles").update({ available_balance: Number(callerProfile.available_balance) - amount }).eq("id", callerProfile.id);
        await supabase.from("profiles").update({ available_balance: Number(recipient.available_balance) + amount }).eq("id", recipient.id);
        await supabase.from("transactions").insert([
          { profile_id: callerProfile.id, type: "debit", amount, description: `Transfer to wallet ${target_wallet_number}` },
          { profile_id: recipient.id, type: "credit", amount, description: `Transfer received from wallet` },
        ]);
        const { data: senderProfile } = await supabase.from("profiles").select("full_name").eq("id", callerProfile.id).single();
        const senderName = Array.isArray(senderProfile?.full_name) ? senderProfile.full_name[0] : senderProfile?.full_name ?? "Someone";
        await supabase.from("notifications").insert({ user_id: recipient.user_id, title: "Money Received! 💰", message: `${senderName} sent you ₹${amount.toLocaleString("en-IN")} via FlexPay wallet transfer.`, type: "financial" });
        result.recipient_name = recipientName;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    res.json(result);
  } catch (err) {
    console.error("wallet-operations error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ─── Cron: auto-expire-withdrawals (every 5 min) ───
async function autoExpireWithdrawals() {
  try {
    const supabase = getAdminClient();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: expired } = await supabase.from("withdrawals").select("id, employee_id, amount").eq("status", "pending").lt("requested_at", twoHoursAgo);
    if (!expired?.length) return;
    for (const w of expired) {
      const wAmount = Number(w.amount);
      const { data: empProfile } = await supabase.from("profiles").select("available_balance, user_id").eq("id", w.employee_id).single();
      if (empProfile) {
        await supabase.from("profiles").update({ available_balance: Number(empProfile.available_balance) + wAmount }).eq("id", w.employee_id);
        await supabase.from("transactions").insert({ profile_id: w.employee_id, type: "credit", amount: wAmount, description: "Withdrawal auto-rejected (expired after 2 hours) — amount restored", reference_id: w.id });
        await supabase.from("notifications").insert({ user_id: empProfile.user_id, title: "Withdrawal Auto-Rejected", message: `Your withdrawal of ₹${wAmount.toLocaleString("en-IN")} was automatically rejected because it was not approved within 2 hours.`, type: "financial", reference_id: w.id, reference_type: "withdrawal" });
      }
      await supabase.from("withdrawals").update({ status: "rejected", review_notes: "Auto-rejected: not approved within 2 hours", reviewed_at: new Date().toISOString() }).eq("id", w.id);
    }
    console.log(`Auto-expired ${expired.length} withdrawals`);
  } catch (err) {
    console.error("auto-expire-withdrawals error:", err.message);
  }
}

// ─── Cron: auto-publish-jobs (every 1 min) ───
async function autoPublishJobs() {
  try {
    const supabase = getAdminClient();
    const now = new Date().toISOString();
    const { data } = await supabase.from("projects").update({ status: "open", scheduled_publish_at: null }).eq("status", "draft").not("scheduled_publish_at", "is", null).lte("scheduled_publish_at", now).select("id, order_id");
    if (data?.length) console.log(`Auto-published ${data.length} jobs`);
  } catch (err) {
    console.error("auto-publish-jobs error:", err.message);
  }
}

if (SUPABASE_SERVICE_ROLE_KEY) {
  cron.schedule("*/5 * * * *", autoExpireWithdrawals);
  cron.schedule("*/1 * * * *", autoPublishJobs);
  console.log("Cron jobs scheduled");
} else {
  console.warn("SUPABASE_SERVICE_ROLE_KEY not set — cron jobs disabled");
}

app.get("/health", (_, res) => res.json({ ok: true }));

// ─── Support chat: delete single message ───
app.delete("/functions/v1/support-delete-message", async (req, res) => {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { messageId } = req.body;
    if (!messageId) return res.status(400).json({ error: "messageId required" });

    const supabase = getAdminClient();

    // Verify the message belongs to this user
    const { data: msg, error: fetchErr } = await supabase
      .from("support_messages")
      .select("id, sender_id")
      .eq("id", messageId)
      .maybeSingle();

    if (fetchErr || !msg) return res.status(404).json({ error: "Message not found" });

    // Allow admins to delete any message
    const { data: callerProfile } = await supabase.from("profiles").select("user_type").eq("user_id", user.id).maybeSingle();
    const isAdmin = callerProfile?.user_type === "admin";
    if (!isAdmin && msg.sender_id !== user.id) return res.status(403).json({ error: "Cannot delete another user's message" });

    const { error } = await supabase.from("support_messages").delete().eq("id", messageId);
    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Support chat: clear all messages in a conversation ───
app.delete("/functions/v1/support-clear-history", async (req, res) => {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { conversationId } = req.body;
    if (!conversationId) return res.status(400).json({ error: "conversationId required" });

    const supabase = getAdminClient();

    // Verify the conversation belongs to this user
    const { data: conv, error: fetchErr } = await supabase
      .from("support_conversations")
      .select("id, user_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (fetchErr || !conv) return res.status(404).json({ error: "Conversation not found" });

    // Allow admins to clear any conversation
    const { data: callerProfile2 } = await supabase.from("profiles").select("user_type").eq("user_id", user.id).maybeSingle();
    const isAdmin2 = callerProfile2?.user_type === "admin";
    if (!isAdmin2 && conv.user_id !== user.id) return res.status(403).json({ error: "Not your conversation" });

    const { error } = await supabase.from("support_messages").delete().eq("conversation_id", conversationId);
    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete entire support conversation (admin only) ──────────────────
app.delete("/functions/v1/support-delete-conversation", async (req, res) => {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { conversationId } = req.body;
    if (!conversationId) return res.status(400).json({ error: "conversationId required" });

    if (!isSuperAdmin(user.email)) {
      return res.status(403).json({ error: "Super admin only" });
    }

    const supabase = getAdminClient();

    // Verify conversation exists
    const { data: conv, error: fetchErr } = await supabase
      .from("support_conversations")
      .select("id")
      .eq("id", conversationId)
      .maybeSingle();
    if (fetchErr || !conv) return res.status(404).json({ error: "Conversation not found" });

    // Delete all messages first (avoid FK constraint if CASCADE not set in DB)
    const { error: msgErr } = await supabase
      .from("support_messages")
      .delete()
      .eq("conversation_id", conversationId);
    if (msgErr) return res.status(500).json({ error: "Failed to delete messages: " + msgErr.message });

    // Now delete the conversation
    const { error } = await supabase
      .from("support_conversations")
      .delete()
      .eq("id", conversationId);
    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── M-Pin helper ────────────────────────────────────────────────────────────
function hashMpin(pin, userId) {
  return crypto.createHash("sha256").update(`${pin}:${userId}:flexpay`).digest("hex");
}

// GET /functions/v1/mpin-status — check if user has a PIN set
app.get("/functions/v1/mpin-status", async (req, res) => {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const adminAuth = getAdminClient().auth.admin;
    const { data: { user: u }, error } = await adminAuth.getUserById(user.id);
    if (error || !u) return res.status(404).json({ error: "User not found" });

    const hasPin = !!(u.app_metadata?.mpin_hash);
    res.json({ hasPin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /functions/v1/mpin-set — create / reset M-Pin
app.post("/functions/v1/mpin-set", async (req, res) => {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { pin } = req.body;
    if (!pin || !/^\d{4,6}$/.test(pin))
      return res.status(400).json({ error: "PIN must be 4–6 digits" });

    const mpin_hash = hashMpin(pin, user.id);
    const adminAuth = getAdminClient().auth.admin;
    const { error } = await adminAuth.updateUserById(user.id, {
      app_metadata: { mpin_hash },
    });
    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /functions/v1/mpin-reset — clear M-Pin (user authenticated, logs out after)
app.post("/functions/v1/mpin-reset", async (req, res) => {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const adminAuth = getAdminClient().auth.admin;
    const { error } = await adminAuth.updateUserById(user.id, {
      app_metadata: { mpin_hash: null },
    });
    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /functions/v1/mpin-verify — verify M-Pin
app.post("/functions/v1/mpin-verify", async (req, res) => {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { pin } = req.body;
    if (!pin || !/^\d{4,6}$/.test(pin))
      return res.status(400).json({ error: "PIN must be 4–6 digits" });

    const adminAuth = getAdminClient().auth.admin;
    const { data: { user: u }, error } = await adminAuth.getUserById(user.id);
    if (error || !u) return res.status(404).json({ error: "User not found" });

    const expected = u.app_metadata?.mpin_hash;
    if (!expected) return res.status(400).json({ error: "No PIN set", hasPin: false });

    const valid = hashMpin(pin, user.id) === expected;
    res.json({ valid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server running on port ${PORT}`);
});
