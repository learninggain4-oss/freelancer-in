import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function generatePassword(len = 12) {
  return crypto.randomBytes(len).toString("base64").slice(0, len) + "!A1";
}

function toStr(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function toBool(v) {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).trim().toLowerCase();
  if (s === "true" || s === "yes" || s === "1") return true;
  if (s === "false" || s === "no" || s === "0") return false;
  return null;
}

function toNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

export const IMPORT_TEMPLATE_COLUMNS = [
  { key: "email",            header: "Email *",              note: "Required. Used to match existing users or create new ones." },
  { key: "full_name",        header: "Full Name",            note: "" },
  { key: "mobile_number",    header: "Mobile Number",        note: "" },
  { key: "whatsapp_number",  header: "WhatsApp Number",      note: "" },
  { key: "user_type",        header: "User Type",            note: "employee / client" },
  { key: "gender",           header: "Gender",               note: "male / female / other" },
  { key: "date_of_birth",    header: "Date of Birth",        note: "YYYY-MM-DD" },
  { key: "approval_status",  header: "Approval Status",      note: "pending / approved / rejected" },
  { key: "approval_notes",   header: "Approval Notes",       note: "" },
  { key: "available_balance",header: "Available Balance",    note: "Number" },
  { key: "hold_balance",     header: "Hold Balance",         note: "Number" },
  { key: "wallet_active",    header: "Wallet Active",        note: "TRUE / FALSE" },
  { key: "is_disabled",      header: "Is Disabled",          note: "TRUE / FALSE" },
  { key: "disabled_reason",  header: "Disabled Reason",      note: "" },
  { key: "temp_password",    header: "Temp Password",        note: "For NEW users only. Auto-generated if blank." },
];

export async function generateImportTemplate() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Import Template");

  ws.getRow(1).values = IMPORT_TEMPLATE_COLUMNS.map(c => c.header);
  ws.getRow(2).values = IMPORT_TEMPLATE_COLUMNS.map(c => c.note);

  const headerRow = ws.getRow(1);
  headerRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  const noteRow = ws.getRow(2);
  noteRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
    cell.font = { italic: true, size: 8, color: { argb: "FF6B7280" } };
    cell.alignment = { wrapText: true };
  });
  noteRow.height = 30;

  ws.addRow(["example@email.com", "Sample User", "9876543210", "9876543210", "employee", "male", "1990-01-15", "approved", "", "0", "0", "TRUE", "FALSE", "", ""]);

  IMPORT_TEMPLATE_COLUMNS.forEach((_, i) => {
    ws.getColumn(i + 1).width = 20;
  });

  ws.views = [{ state: "frozen", ySplit: 2 }];

  return wb;
}

export async function parseImportExcel(filePath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.getWorksheet(1);
  if (!ws) throw new Error("Excel file has no worksheet");

  const headerRow = ws.getRow(1);
  const headers = [];
  headerRow.eachCell((cell, col) => {
    headers[col] = String(cell.value || "").replace(" *", "").trim().toLowerCase().replace(/ /g, "_");
  });

  const rows = [];
  ws.eachRow((row, rowNum) => {
    if (rowNum <= 2) return;
    const obj = {};
    row.eachCell((cell, col) => {
      const h = headers[col];
      if (h) {
        let v = cell.value;
        if (v && typeof v === "object" && v.text) v = v.text;
        if (v && typeof v === "object" && v.result !== undefined) v = v.result;
        obj[h] = v === null || v === undefined ? "" : String(v).trim();
      }
    });
    if (obj.email && obj.email !== "") rows.push(obj);
  });

  return rows;
}

export async function processImport(rows, dryRun = false) {
  const adminClient = getAdminClient();
  const results = { created: [], updated: [], skipped: [], errors: [] };

  const { data: existingProfiles } = await adminClient
    .from("profiles")
    .select("id, user_id, email");

  const emailToProfile = {};
  for (const p of existingProfiles || []) {
    if (p.email) emailToProfile[p.email.toLowerCase()] = p;
  }

  for (const row of rows) {
    const email = toStr(row.email)?.toLowerCase();
    if (!email) { results.skipped.push({ row, reason: "Email missing" }); continue; }

    const existing = emailToProfile[email];

    try {
      if (existing) {
        const updates = {};
        if (toStr(row.full_name))       updates.full_name        = [toStr(row.full_name).toUpperCase()];
        if (toStr(row.mobile_number))   updates.mobile_number    = toStr(row.mobile_number);
        if (toStr(row.whatsapp_number)) updates.whatsapp_number  = toStr(row.whatsapp_number);
        if (toStr(row.user_type))       updates.user_type        = toStr(row.user_type);
        if (toStr(row.gender))          updates.gender           = toStr(row.gender);
        if (toStr(row.date_of_birth))   updates.date_of_birth    = toStr(row.date_of_birth);
        if (toStr(row.approval_status)) updates.approval_status  = toStr(row.approval_status);
        if (toStr(row.approval_notes))  updates.approval_notes   = toStr(row.approval_notes);
        if (toNumber(row.available_balance) !== null) updates.available_balance = toNumber(row.available_balance);
        if (toNumber(row.hold_balance) !== null)      updates.hold_balance      = toNumber(row.hold_balance);
        if (toBool(row.wallet_active) !== null)       updates.wallet_active     = toBool(row.wallet_active);
        if (toBool(row.is_disabled) !== null)         updates.is_disabled       = toBool(row.is_disabled);
        if (toStr(row.disabled_reason)) updates.disabled_reason  = toStr(row.disabled_reason);

        if (Object.keys(updates).length === 0) {
          results.skipped.push({ email, reason: "No fields to update" });
          continue;
        }

        if (!dryRun) {
          updates.updated_at = new Date().toISOString();
          const { error } = await adminClient.from("profiles").update(updates).eq("id", existing.id);
          if (error) throw error;
        }
        results.updated.push({ email, fields: Object.keys(updates).filter(k => k !== "updated_at") });

      } else {
        const fullName  = toStr(row.full_name) || email.split("@")[0];
        const userType  = toStr(row.user_type) || "employee";
        const password  = toStr(row.temp_password) || generatePassword();
        const approvalStatus = toStr(row.approval_status) || "pending";

        if (!dryRun) {
          let userId = null;

          // Try creating a new auth user
          const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName },
          });

          if (authErr) {
            const alreadyExists = authErr.message?.toLowerCase().includes("already") ||
                                  authErr.message?.toLowerCase().includes("registered") ||
                                  authErr.message?.toLowerCase().includes("exists");
            if (!alreadyExists) throw authErr;

            // Auth user already exists — find their user ID
            const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
            const existingAuthUser = allUsers.find(u => u.email?.toLowerCase() === email);
            if (!existingAuthUser) throw new Error("Auth user not found despite 'already registered' error");
            userId = existingAuthUser.id;
          } else {
            userId = authData.user.id;
          }

          // Check if a profile already exists for this auth user (created by trigger or previous import)
          const { data: existingProf } = await adminClient.from("profiles").select("id").eq("id", userId).maybeSingle();

          if (existingProf) {
            // Profile exists — update it instead
            const updates = { full_name: [fullName.toUpperCase()], user_type: userType, approval_status: approvalStatus, updated_at: new Date().toISOString() };
            if (toStr(row.mobile_number))   updates.mobile_number   = toStr(row.mobile_number);
            if (toStr(row.whatsapp_number)) updates.whatsapp_number = toStr(row.whatsapp_number);
            if (toStr(row.gender))          updates.gender          = toStr(row.gender);
            if (toStr(row.date_of_birth))   updates.date_of_birth   = toStr(row.date_of_birth);
            if (toStr(row.approval_notes))  updates.approval_notes  = toStr(row.approval_notes);
            if (toNumber(row.available_balance) !== null) updates.available_balance = toNumber(row.available_balance);
            if (toNumber(row.hold_balance) !== null)      updates.hold_balance      = toNumber(row.hold_balance);
            if (toBool(row.wallet_active) !== null)       updates.wallet_active     = toBool(row.wallet_active);
            if (toBool(row.is_disabled) !== null)         updates.is_disabled       = toBool(row.is_disabled);
            if (toStr(row.disabled_reason)) updates.disabled_reason = toStr(row.disabled_reason);
            const { error: updErr } = await adminClient.from("profiles").update(updates).eq("id", userId);
            if (updErr) throw updErr;
            results.updated.push({ email, fields: Object.keys(updates).filter(k => !["updated_at"].includes(k)) });
            continue;
          }

          // No profile yet — create one
          const profilePayload = {
            id: userId,
            user_id: userId,
            email,
            full_name: [fullName.toUpperCase()],
            user_code: [],
            user_type: userType,
            approval_status: approvalStatus,
          };
          if (toStr(row.mobile_number))   profilePayload.mobile_number   = toStr(row.mobile_number);
          if (toStr(row.whatsapp_number)) profilePayload.whatsapp_number = toStr(row.whatsapp_number);
          if (toStr(row.gender))          profilePayload.gender          = toStr(row.gender);
          if (toStr(row.date_of_birth))   profilePayload.date_of_birth   = toStr(row.date_of_birth);
          if (toStr(row.approval_notes))  profilePayload.approval_notes  = toStr(row.approval_notes);
          if (toNumber(row.available_balance) !== null) profilePayload.available_balance = toNumber(row.available_balance);
          if (toNumber(row.hold_balance) !== null)      profilePayload.hold_balance      = toNumber(row.hold_balance);
          if (toBool(row.wallet_active) !== null)       profilePayload.wallet_active     = toBool(row.wallet_active);
          if (toBool(row.is_disabled) !== null)         profilePayload.is_disabled       = toBool(row.is_disabled);
          if (toStr(row.disabled_reason)) profilePayload.disabled_reason = toStr(row.disabled_reason);

          const { error: profErr } = await adminClient.from("profiles").insert(profilePayload);
          if (profErr) throw profErr;
        }

        results.created.push({
          email,
          full_name: fullName,
          user_type: userType,
          temp_password: toStr(row.temp_password) ? "(provided)" : password,
        });
      }
    } catch (err) {
      results.errors.push({ email, error: err.message });
    }
  }

  return results;
}
