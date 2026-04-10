import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPORT_DIR = path.join(__dirname, "exports");
const EXPORT_FILE = path.join(EXPORT_DIR, "users-export.xlsx");
const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "excel-export-errors.log");

function logError(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, line);
  } catch (e) {
    console.error("Excel export log error:", e.message);
  }
  console.error("[excelExport]", msg);
}

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase credentials not configured");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function fmt(val) {
  if (val === null || val === undefined) return "";
  if (Array.isArray(val)) return val.join(" ");
  return String(val);
}

export async function generateExcel() {
  try {
    if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

    const adminClient = getAdminClient();

    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select(
        "id, user_id, user_code, full_name, email, mobile_number, whatsapp_number, " +
        "user_type, approval_status, is_disabled, disabled_reason, " +
        "available_balance, coin_balance, hold_balance, wallet_active, wallet_number, upi_id, " +
        "registration_ip, registration_city, registration_country, registration_region, " +
        "registration_latitude, registration_longitude, " +
        "gender, date_of_birth, marital_status, education_level, education_background, " +
        "work_experience, previous_job_details, " +
        "bank_name, bank_holder_name, bank_account_number, bank_ifsc_code, " +
        "emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, " +
        "referral_code, referred_by, " +
        "approval_notes, approved_at, last_seen_at, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (profilesError) {
      logError(`profiles fetch error: ${profilesError.message}`);
      throw profilesError;
    }

    const [{ data: regMeta }, { data: empProfiles }] = await Promise.all([
      adminClient
        .from("registration_metadata")
        .select("profile_id, ip_address, city, region, country, latitude, longitude"),
      adminClient
        .from("employer_profiles")
        .select("profile_id, company_name, business_type, industry_sector, gst_number, business_description, typical_budget_min, typical_budget_max, preferred_categories, city, state"),
    ]);

    const regMetaMap = new Map();
    for (const r of regMeta || []) regMetaMap.set(r.profile_id, r);

    const empMap = new Map();
    for (const e of empProfiles || []) empMap.set(e.profile_id, e);

    const seenIds = new Set();
    const rows = [];
    for (const p of profiles || []) {
      if (seenIds.has(p.user_id)) continue;
      seenIds.add(p.user_id);
      rows.push(p);
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "Freelancer India Admin";
    wb.created = new Date();

    const ws = wb.addWorksheet("Users", {
      views: [{ state: "frozen", ySplit: 2 }],
    });

    const lastUpdated = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const COLS = [
      { header: "S.No", key: "sno", width: 6 },
      { header: "User Code", key: "user_code", width: 14 },
      { header: "Full Name", key: "full_name", width: 22 },
      { header: "Email", key: "email", width: 28 },
      { header: "Mobile", key: "mobile_number", width: 14 },
      { header: "WhatsApp", key: "whatsapp_number", width: 14 },
      { header: "User Type", key: "user_type", width: 12 },
      { header: "Approval Status", key: "approval_status", width: 16 },
      { header: "Is Disabled", key: "is_disabled", width: 12 },
      { header: "Account Status", key: "account_status", width: 14 },
      { header: "Disabled Reason", key: "disabled_reason", width: 20 },
      { header: "Wallet Balance (₹)", key: "available_balance", width: 18 },
      { header: "Coin Balance", key: "coin_balance", width: 12 },
      { header: "Hold Balance (₹)", key: "hold_balance", width: 16 },
      { header: "Wallet Active", key: "wallet_active", width: 13 },
      { header: "Wallet Number", key: "wallet_number", width: 16 },
      { header: "UPI ID", key: "upi_id", width: 20 },
      { header: "Bank Name", key: "bank_name", width: 18 },
      { header: "Account Holder", key: "bank_holder_name", width: 20 },
      { header: "Account Number", key: "bank_account_number", width: 18 },
      { header: "IFSC Code", key: "bank_ifsc_code", width: 12 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Date of Birth", key: "date_of_birth", width: 14 },
      { header: "Marital Status", key: "marital_status", width: 14 },
      { header: "Education Level", key: "education_level", width: 18 },
      { header: "Education Background", key: "education_background", width: 22 },
      { header: "Work Experience", key: "work_experience", width: 18 },
      { header: "Previous Job", key: "previous_job_details", width: 22 },
      { header: "Emergency Contact", key: "emergency_contact_name", width: 20 },
      { header: "Emergency Phone", key: "emergency_contact_phone", width: 16 },
      { header: "Emergency Relation", key: "emergency_contact_relationship", width: 18 },
      { header: "Referral Code", key: "referral_code", width: 14 },
      { header: "Referred By", key: "referred_by", width: 14 },
      { header: "Reg. IP", key: "registration_ip", width: 16 },
      { header: "Reg. City", key: "registration_city", width: 16 },
      { header: "Reg. Region", key: "registration_region", width: 16 },
      { header: "Reg. Country", key: "registration_country", width: 16 },
      { header: "Latitude", key: "registration_latitude", width: 12 },
      { header: "Longitude", key: "registration_longitude", width: 12 },
      { header: "Meta IP", key: "meta_ip", width: 16 },
      { header: "Meta City", key: "meta_city", width: 16 },
      { header: "Meta Region", key: "meta_region", width: 16 },
      { header: "Meta Country", key: "meta_country", width: 16 },
      { header: "Meta Latitude", key: "meta_latitude", width: 12 },
      { header: "Meta Longitude", key: "meta_longitude", width: 12 },
      { header: "Company Name", key: "company_name", width: 22 },
      { header: "Business Type", key: "business_type", width: 16 },
      { header: "Industry Sector", key: "industry_sector", width: 18 },
      { header: "GST Number", key: "gst_number", width: 16 },
      { header: "Business Description", key: "business_description", width: 24 },
      { header: "Budget Min (₹)", key: "typical_budget_min", width: 14 },
      { header: "Budget Max (₹)", key: "typical_budget_max", width: 14 },
      { header: "Preferred Categories", key: "preferred_categories", width: 22 },
      { header: "Employer City", key: "emp_city", width: 16 },
      { header: "Employer State", key: "emp_state", width: 16 },
      { header: "Approval Notes", key: "approval_notes", width: 22 },
      { header: "Approved At", key: "approved_at", width: 20 },
      { header: "Last Seen", key: "last_seen_at", width: 20 },
      { header: "Registered At", key: "created_at", width: 20 },
      { header: "Updated At", key: "updated_at", width: 20 },
      { header: "Profile ID", key: "id", width: 36 },
    ];

    ws.columns = COLS.map(c => ({ key: c.key, width: c.width }));

    ws.mergeCells(1, 1, 1, COLS.length);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `Freelancer India — User Export  |  Last Updated: ${lastUpdated} IST  |  Total Users: ${rows.length}`;
    titleCell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B4FC8" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 22;

    const headerRow = ws.getRow(2);
    COLS.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        bottom: { style: "medium", color: { argb: "FF3B82F6" } },
      };
    });
    headerRow.height = 28;

    rows.forEach((p, idx) => {
      const meta = regMetaMap.get(p.id) || {};
      const emp = empMap.get(p.id) || {};

      const r = ws.addRow({
        sno: idx + 1,
        user_code: fmt(p.user_code),
        full_name: fmt(p.full_name),
        email: fmt(p.email),
        mobile_number: fmt(p.mobile_number),
        whatsapp_number: fmt(p.whatsapp_number),
        user_type: p.user_type === "employee" ? "Freelancer" : p.user_type === "client" ? "Employer" : fmt(p.user_type),
        approval_status: fmt(p.approval_status),
        is_disabled: p.is_disabled ? "TRUE" : "FALSE",
        account_status: p.is_disabled ? "Blocked" : "Active",
        disabled_reason: fmt(p.disabled_reason),
        available_balance: p.available_balance ?? 0,
        coin_balance: p.coin_balance ?? 0,
        hold_balance: p.hold_balance ?? 0,
        wallet_active: p.wallet_active ? "Yes" : "No",
        wallet_number: fmt(p.wallet_number),
        upi_id: fmt(p.upi_id),
        bank_name: fmt(p.bank_name),
        bank_holder_name: fmt(p.bank_holder_name),
        bank_account_number: fmt(p.bank_account_number),
        bank_ifsc_code: fmt(p.bank_ifsc_code),
        gender: fmt(p.gender),
        date_of_birth: fmt(p.date_of_birth),
        marital_status: fmt(p.marital_status),
        education_level: fmt(p.education_level),
        education_background: fmt(p.education_background),
        work_experience: fmt(p.work_experience),
        previous_job_details: fmt(p.previous_job_details),
        emergency_contact_name: fmt(p.emergency_contact_name),
        emergency_contact_phone: fmt(p.emergency_contact_phone),
        emergency_contact_relationship: fmt(p.emergency_contact_relationship),
        referral_code: fmt(p.referral_code),
        referred_by: fmt(p.referred_by),
        registration_ip: fmt(p.registration_ip),
        registration_city: fmt(p.registration_city),
        registration_region: fmt(p.registration_region),
        registration_country: fmt(p.registration_country),
        registration_latitude: p.registration_latitude ?? "",
        registration_longitude: p.registration_longitude ?? "",
        meta_ip: fmt(meta.ip_address),
        meta_city: fmt(meta.city),
        meta_region: fmt(meta.region),
        meta_country: fmt(meta.country),
        meta_latitude: meta.latitude ?? "",
        meta_longitude: meta.longitude ?? "",
        company_name: fmt(emp.company_name),
        business_type: fmt(emp.business_type),
        industry_sector: fmt(emp.industry_sector),
        gst_number: fmt(emp.gst_number),
        business_description: fmt(emp.business_description),
        typical_budget_min: emp.typical_budget_min ?? "",
        typical_budget_max: emp.typical_budget_max ?? "",
        preferred_categories: Array.isArray(emp.preferred_categories) ? emp.preferred_categories.join(", ") : "",
        emp_city: fmt(emp.city),
        emp_state: fmt(emp.state),
        approval_notes: fmt(p.approval_notes),
        approved_at: fmt(p.approved_at),
        last_seen_at: fmt(p.last_seen_at),
        created_at: fmt(p.created_at),
        updated_at: fmt(p.updated_at),
        id: fmt(p.id),
      });

      r.height = 16;

      const isEven = idx % 2 === 0;
      r.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: isEven ? "FFF8FAFC" : "FFFFFFFF" },
        };
        cell.alignment = { vertical: "middle", wrapText: false };
        cell.font = { size: 9 };
      });

      const balCell = r.getCell("available_balance");
      balCell.numFmt = "#,##0.00";
      const holdCell = r.getCell("hold_balance");
      holdCell.numFmt = "#,##0.00";
    });

    ws.autoFilter = {
      from: { row: 2, column: 1 },
      to: { row: 2, column: COLS.length },
    };

    await wb.xlsx.writeFile(EXPORT_FILE);
    console.log(`[excelExport] Generated: ${EXPORT_FILE} (${rows.length} users)`);
    return EXPORT_FILE;
  } catch (err) {
    logError(`generateExcel failed: ${err.message}\n${err.stack || ""}`);
    throw err;
  }
}

export function getExportFilePath() {
  return EXPORT_FILE;
}

export function scheduleRealtimeRefresh(supabaseUrl, supabaseServiceKey) {
  try {
    const client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { params: { eventsPerSecond: 2 } },
    });
    client
      .channel("profiles-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
        console.log("[excelExport] New user registered — refreshing Excel...", payload.new?.email || "");
        generateExcel().catch(e => logError(`Auto-refresh failed: ${e.message}`));
      })
      .subscribe((status) => {
        console.log("[excelExport] Realtime subscription status:", status);
      });
    console.log("[excelExport] Realtime refresh listener attached.");
  } catch (err) {
    logError(`scheduleRealtimeRefresh failed: ${err.message}`);
  }
}
