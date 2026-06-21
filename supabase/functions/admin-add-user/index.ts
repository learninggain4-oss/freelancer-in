import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function ok(body: object) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errResp(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getUserIdFromJwt(authHeader: string): string | null {
  try {
    const token = authHeader.replace("Bearer ", "");
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.sub || null;
  } catch {
    return null;
  }
}

function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const envEmails = (Deno.env.get("SUPER_ADMIN_EMAILS") || "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return envEmails.includes(email.toLowerCase());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return errResp(401, "Unauthorized");

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = authHeader.replace("Bearer ", "");

  // Validate token — with JWT fallback like admin-user-management
  let callerUserId: string;
  let callerEmail: string | null = null;

  const { data: { user: callerUser }, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !callerUser) {
    console.error("Token validation failed:", userError?.message, "— falling back to JWT decode");
    const fallbackId = getUserIdFromJwt(authHeader);
    if (!fallbackId) return errResp(401, "Unauthorized");
    callerUserId = fallbackId;
  } else {
    callerUserId = callerUser.id;
    callerEmail = callerUser.email ?? null;
  }

  // Check user_roles table
  const { data: roleRows, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", callerUserId)
    .in("role", ["admin", "super_admin"]);

  if (roleError) {
    console.error("Role check error:", roleError.message);
  }

  const hasRoleInTable = roleRows && roleRows.length > 0;
  const hasSuperAdminEmail = isSuperAdminEmail(callerEmail);

  if (!hasRoleInTable && !hasSuperAdminEmail) {
    console.error(`Forbidden: user ${callerUserId} (${callerEmail}) has no admin role. roleRows=${JSON.stringify(roleRows)}`);
    return errResp(403, "Forbidden: admin or super_admin role required");
  }

  // Parse body
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return errResp(400, "Invalid JSON body");
  }

  const {
    email, full_name, password, user_type, mobile_number,
    whatsapp_number, gender, date_of_birth, approval_status,
    approval_notes, force_new,
  } = body;

  if (!email?.trim()) return errResp(400, "Email is required");
  if (!full_name?.trim()) return errResp(400, "Full name is required");
  if (!password || password.length < 6) return errResp(400, "Password must be at least 6 characters");

  const emailLower = email.trim().toLowerCase();
  const nameUpper  = full_name.trim().toUpperCase();
  const uType      = user_type || "employee";
  const approvalSt = approval_status || "pending";

  const profileFields: Record<string, any> = {
    full_name: [nameUpper],
    user_type: uType,
    approval_status: approvalSt,
  };
  if (mobile_number)   profileFields.mobile_number   = mobile_number.trim();
  if (whatsapp_number) profileFields.whatsapp_number = whatsapp_number.trim();
  if (gender)          profileFields.gender          = gender;
  if (date_of_birth)   profileFields.date_of_birth   = date_of_birth;
  if (approval_notes)  profileFields.approval_notes  = approval_notes.trim();

  // force_new=false (default): check existing profile → UPDATE
  if (!force_new) {
    const { data: existingProf } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", emailLower)
      .maybeSingle();

    if (existingProf) {
      const { error: updErr } = await adminClient
        .from("profiles")
        .update({ ...profileFields, updated_at: new Date().toISOString() })
        .eq("id", existingProf.id);
      if (updErr) return errResp(500, updErr.message);
      return ok({ success: true, action: "updated", profile_id: existingProf.id, email: emailLower, full_name: nameUpper });
    }
  }

  // Find or create auth user
  let userId: string | null = null;
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email: emailLower,
    password,
    email_confirm: true,
    user_metadata: { full_name: nameUpper },
  });

  if (authErr) {
    const alreadyExists =
      authErr.message?.toLowerCase().includes("already") ||
      authErr.message?.toLowerCase().includes("registered") ||
      authErr.message?.toLowerCase().includes("exists");
    if (!alreadyExists) return errResp(400, authErr.message);

    const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const existingAuth = allUsers.find((u) => u.email?.toLowerCase() === emailLower);
    if (!existingAuth) return errResp(400, "Auth user not found");
    userId = existingAuth.id;
  } else {
    userId = authData.user.id;
  }

  // force_new: always INSERT a brand-new profile with a new UUID
  if (force_new) {
    const newProfileId = crypto.randomUUID();
    const { error: profErr } = await adminClient.from("profiles").insert({
      id: newProfileId, user_id: userId, email: emailLower,
      user_code: [], ...profileFields,
    });
    if (profErr) return errResp(500, profErr.message);
    return ok({ success: true, action: "created", user_id: userId, profile_id: newProfileId, email: emailLower, full_name: nameUpper });
  }

  // Normal: check if profile exists for auth user → UPDATE or INSERT
  const { data: authProf } = await adminClient
    .from("profiles")
    .select("id")
    .eq("user_id", userId!)
    .maybeSingle();

  if (authProf) {
    const { error: updErr } = await adminClient
      .from("profiles")
      .update({ ...profileFields, updated_at: new Date().toISOString() })
      .eq("id", authProf.id);
    if (updErr) return errResp(500, updErr.message);
    return ok({ success: true, action: "updated", user_id: userId, email: emailLower, full_name: nameUpper });
  }

  const { error: profErr } = await adminClient.from("profiles").insert({
    id: userId, user_id: userId, email: emailLower,
    user_code: [], ...profileFields,
  });
  if (profErr) return errResp(500, profErr.message);
  return ok({ success: true, action: "created", user_id: userId, email: emailLower, full_name: nameUpper });
});
