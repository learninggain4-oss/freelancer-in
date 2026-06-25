import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ok = (body: object) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const errResp = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const warn = (label: string, error: any) => {
  if (error) console.warn(`public-register ${label}:`, error.message || error);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errResp(405, "Method not allowed");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return errResp(400, "Invalid JSON body");
  }

  const {
    email, user_type, full_name, username, gender, date_of_birth, marital_status,
    education_level, mobile_number, whatsapp_number, education_background,
    referred_by, approval_status,
    geo, employer_biz, work_experiences, emergency_contacts, services,
  } = body;

  if (!email || !full_name) return errResp(400, "Email and full name are required");

  const emailLower = String(email).trim().toLowerCase();
  const nameUpper = String(full_name).trim().toUpperCase();
  const normalizeUserType = (value: unknown) => {
    const raw = String(value || "Freelancer").trim().toLowerCase();
    if (["freelancer", "employee"].includes(raw)) return "Freelancer";
    if (["employer", "client"].includes(raw)) return "Employer";
    return null;
  };
  const uType = normalizeUserType(user_type);
  if (!uType) return errResp(400, "Account Type Error --- please contact support");

  // Find existing auth user (created by client-side signUp just before this call)
  let userId: string | null = null;
  try {
    const { data } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const existing = data?.users?.find((u: any) => u.email?.toLowerCase() === emailLower);
    if (existing) userId = existing.id;
  } catch (e) {
    console.warn("listUsers failed:", (e as any)?.message);
  }
  if (!userId) return errResp(400, "Auth user not found for this email. Please retry registration.");

  // Reuse existing profile if one already exists for this user
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  let profileId: string;
  if (existingProfile?.id) {
    profileId = existingProfile.id;
  } else {
    profileId = crypto.randomUUID();
    const profilePayload: Record<string, any> = {
      id: profileId, user_id: userId, email: emailLower,
      user_type: uType, full_name: [nameUpper], user_code: [],
      username: username ? String(username).trim().toLowerCase() : null,
      gender: gender || null, date_of_birth: date_of_birth || null,
      marital_status: marital_status || null, education_level: education_level || null,
      mobile_number: mobile_number || null, whatsapp_number: whatsapp_number || null,
      education_background: education_background || null,
      referred_by: referred_by || null,
      approval_status: approval_status || "approved",
    };
    const { error: profErr } = await adminClient.from("profiles").insert(profilePayload);
    if (profErr) return errResp(500, profErr.message);
  }

  // Registration metadata
  if (geo) {
    const { error } = await adminClient.from("registration_metadata").insert([{
      profile_id: profileId,
      ip_address: geo.ip || null, city: geo.city || null,
      region: geo.region || null, country: geo.country || null,
      latitude: geo.lat || null, longitude: geo.lon || null,
    }]);
    warn("registration_metadata", error);
  }

  // Employer business profile
  if (uType === "Employer" && employer_biz) {
    const { error } = await adminClient.from("employer_profiles").insert([{
      profile_id: profileId,
      company_name: employer_biz.company_name || null,
      business_type: employer_biz.business_type || null,
      industry_sector: employer_biz.industry_sector || null,
      gst_number: employer_biz.gst_number || null,
      business_description: employer_biz.business_description || null,
      typical_budget_min: employer_biz.typical_budget_min ? Number(employer_biz.typical_budget_min) : null,
      typical_budget_max: employer_biz.typical_budget_max ? Number(employer_biz.typical_budget_max) : null,
      preferred_categories: employer_biz.preferred_categories?.length ? employer_biz.preferred_categories : null,
      city: employer_biz.city || null, state: employer_biz.state || null,
    }]);
    warn("employer_profiles", error);
  }

  // Work experiences (no certificate uploads on this path)
  if (Array.isArray(work_experiences)) {
    for (const w of work_experiences.filter((w: any) => w?.company_name?.trim())) {
      const { error } = await adminClient.from("work_experiences").insert({
        profile_id: profileId, company_name: w.company_name, company_type: w.company_type,
        work_description: w.work_description || null,
        start_year: Number(w.start_year),
        end_year: w.is_current ? null : Number(w.end_year),
        is_current: !!w.is_current,
        certificate_path: null, certificate_name: null,
      });
      warn("work_experiences", error);
    }
  }

  // Emergency contacts
  if (Array.isArray(emergency_contacts)) {
    for (const c of emergency_contacts.filter((c: any) => c?.contact_name?.trim())) {
      const { error } = await adminClient.from("employee_emergency_contacts").insert({
        profile_id: profileId, contact_name: c.contact_name,
        contact_phone: c.contact_phone, relationship: c.relationship,
      });
      warn("employee_emergency_contacts", error);
    }
  }

  // Services + skill selections
  if (Array.isArray(services)) {
    for (const s of services) {
      if (!s?.category_id || !s?.service_title) continue;
      const { data: svcData, error: serviceErr } = await adminClient.from("employee_services").insert({
        profile_id: profileId, category_id: s.category_id, service_title: s.service_title,
        hourly_rate: Number(s.hourly_rate) || 0, minimum_budget: Number(s.minimum_budget) || 0,
      }).select("id").single();
      warn("employee_services", serviceErr);
      if (svcData?.id && Array.isArray(s.skill_ids) && s.skill_ids.length > 0) {
        const { error } = await adminClient.from("employee_skill_selections").insert(
          s.skill_ids.map((skillId: string) => ({ employee_service_id: svcData.id, skill_id: skillId })),
        );
        warn("employee_skill_selections", error);
      }
    }
  }

  return ok({ success: true, profile_id: profileId, user_id: userId });
});
