import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logAudit(
  adminClient: ReturnType<typeof createClient>,
  adminProfileId: string | null,
  action: string,
  targetProfileId: string | null,
  targetName: string | null,
  details: unknown,
) {
  if (!adminProfileId) return;
  try {
    await adminClient.from("admin_audit_logs").insert({
      admin_id: adminProfileId,
      action,
      target_profile_id: targetProfileId ?? null,
      target_profile_name: targetName ?? null,
      details: details ?? null,
    });
  } catch { /* fail silently */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const superAdminEmails = (Deno.env.get("SUPER_ADMIN_EMAILS") || "")
      .split(",").map((e: string) => e.trim().toLowerCase()).filter(Boolean);

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !callerUser) {
      return json({ error: "Unauthorized" }, 401);
    }

    const callerUserId = callerUser.id;
    const callerEmail = (callerUser.email || "").toLowerCase();
    const isSuperAdmin = superAdminEmails.includes(callerEmail);

    if (!isSuperAdmin) {
      const { data: roleRows } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", callerUserId)
        .in("role", ["admin", "super_admin"]);

      if (!roleRows || roleRows.length === 0) {
        return json({ error: "Forbidden: admin role required" }, 403);
      }
    }

    let adminProfileId: string | null = null;
    try {
      const { data: ap } = await adminClient.from("profiles").select("id").eq("user_id", callerUserId).maybeSingle();
      adminProfileId = ap?.id ?? null;
    } catch { /* non-critical */ }

    const body = await req.json();
    const { action, user_id, profile_id, email, user_type } = body;

    switch (action) {
      case "permanent_delete": {
        if (!profile_id) return json({ error: "profile_id required" }, 400);

        const { data: profile } = await adminClient.from("profiles").select("user_id, full_name").eq("id", profile_id).single();
        if (!profile) return json({ error: "Profile not found" }, 404);

        const userId = profile.user_id;
        const pid = profile_id;

        const { data: empServices } = await adminClient.from("employee_services").select("id").eq("profile_id", pid);
        if (empServices && empServices.length > 0) {
          await adminClient.from("employee_skill_selections").delete().in("employee_service_id", empServices.map((s: any) => s.id));
        }

        const { data: clientProjects } = await adminClient.from("projects").select("id").eq("client_id", pid);
        if (clientProjects && clientProjects.length > 0) {
          const projectIds = clientProjects.map((p: any) => p.id);
          const { data: chatRooms } = await adminClient.from("chat_rooms").select("id").in("project_id", projectIds);
          if (chatRooms && chatRooms.length > 0) {
            const roomIds = chatRooms.map((r: any) => r.id);
            const { data: roomMessages } = await adminClient.from("messages").select("id").in("chat_room_id", roomIds);
            if (roomMessages && roomMessages.length > 0) {
              await adminClient.from("message_reactions").delete().in("message_id", roomMessages.map((m: any) => m.id));
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

        await adminClient.from("admin_audit_logs").update({ target_profile_id: null }).eq("target_profile_id", pid);
        await adminClient.from("profiles").update({ edit_reviewed_by: null }).eq("edit_reviewed_by", pid);
        await adminClient.from("recovery_requests").update({ resolved_by: null }).eq("resolved_by", pid);
        await adminClient.from("withdrawals").update({ reviewed_by: null }).eq("reviewed_by", pid);
        await adminClient.from("blocked_ips").update({ blocked_by: null }).eq("blocked_by", pid);

        await Promise.all([
          adminClient.from("aadhaar_verifications").delete().eq("profile_id", pid),
          adminClient.from("bank_verifications").delete().eq("profile_id", pid),
          adminClient.from("documents").delete().eq("profile_id", pid),
          adminClient.from("employee_emergency_contacts").delete().eq("profile_id", pid),
          adminClient.from("employee_services").delete().eq("profile_id", pid),
          adminClient.from("employer_profiles").delete().eq("profile_id", pid),
          adminClient.from("user_bank_accounts").delete().eq("profile_id", pid),
          adminClient.from("attendance").delete().eq("profile_id", pid),
          adminClient.from("coin_transactions").delete().eq("profile_id", pid),
          adminClient.from("coin_reward_claims").delete().eq("profile_id", pid),
          adminClient.from("employee_payment_apps").delete().eq("profile_id", pid),
          adminClient.from("push_subscriptions").delete().eq("profile_id", pid),
          adminClient.from("pwa_install_status").delete().eq("profile_id", pid),
          adminClient.from("site_visitors").delete().eq("profile_id", pid),
          adminClient.from("upgrade_appointments").delete().eq("profile_id", pid),
          adminClient.from("user_reviews").delete().eq("profile_id", pid),
          adminClient.from("wallet_upgrade_requests").delete().eq("profile_id", pid),
          adminClient.from("reviews").delete().eq("reviewee_id", pid),
          adminClient.from("reviews").delete().eq("reviewer_id", pid),
          adminClient.from("notifications").delete().eq("user_id", userId),
          adminClient.from("notifications").delete().eq("user_id", pid),
          adminClient.from("registration_metadata").delete().eq("profile_id", pid),
          adminClient.from("transactions").delete().eq("profile_id", pid),
          adminClient.from("work_experiences").delete().eq("profile_id", pid),
          adminClient.from("referrals").delete().eq("referrer_id", pid),
          adminClient.from("referrals").delete().eq("referred_id", pid),
          adminClient.from("withdrawals").delete().eq("employee_id", pid),
          adminClient.from("recovery_requests").delete().eq("employee_id", pid),
          adminClient.from("project_applications").delete().eq("employee_id", pid),
          adminClient.from("project_submissions").delete().eq("employee_id", pid),
          adminClient.from("project_documents").delete().eq("uploaded_by", pid),
          adminClient.from("payment_confirmations").delete().eq("employee_id", pid),
          adminClient.from("message_reactions").delete().eq("user_id", pid),
          adminClient.from("support_message_reactions").delete().eq("user_id", pid),
          adminClient.from("announcement_dismissals").delete().eq("user_id", userId),
          adminClient.from("messages").delete().eq("sender_id", pid),
          adminClient.from("custom_quick_replies").delete().eq("created_by", pid),
          adminClient.from("quick_reply_analytics").delete().eq("used_by", pid),
        ]);

        const { data: supportConvo } = await adminClient.from("support_conversations").select("id").eq("user_id", pid).maybeSingle();
        if (supportConvo) {
          await adminClient.from("support_messages").delete().eq("conversation_id", supportConvo.id);
          await adminClient.from("support_conversations").delete().eq("id", supportConvo.id);
        }

        await adminClient.from("user_roles").delete().eq("user_id", userId);

        const { error: profileDeleteError } = await adminClient.from("profiles").delete().eq("id", pid);
        if (profileDeleteError) {
          console.error("Profile delete error:", profileDeleteError);
          return json({ error: "Failed to delete profile: " + profileDeleteError.message }, 500);
        }

        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
        if (deleteError) {
          console.error("Auth delete error:", deleteError);
          return json({ error: "Auth delete failed: " + deleteError.message }, 500);
        }

        logAudit(adminClient, adminProfileId, "permanent_delete", null, (profile.full_name as any)?.[0] ?? null, { deleted_profile_id: pid, deleted_user_id: userId });
        return json({ success: true, message: "User permanently deleted" });
      }

      case "revoke_sessions": {
        if (!user_id) return json({ error: "user_id required" }, 400);
        const revokeRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ scope: "global" }),
        });
        if (!revokeRes.ok) {
          const errData = await revokeRes.json().catch(() => ({}));
          return json({ error: (errData as any).message || "Failed to revoke sessions" }, 500);
        }
        let targetProf: any = null;
        try { const { data: tp } = await adminClient.from("profiles").select("id, full_name").eq("user_id", user_id).maybeSingle(); targetProf = tp; } catch { /* non-critical */ }
        logAudit(adminClient, adminProfileId, "force_logout", targetProf?.id ?? null, targetProf?.full_name?.[0] ?? null, { auth_user_id: user_id });
        return json({ success: true, message: "All sessions revoked" });
      }

      case "invite_user": {
        if (!email || !user_type) return json({ error: "email and user_type required" }, 400);
        const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email);
        if (inviteErr) return json({ error: inviteErr.message }, 400);
        const invitedUserId = (inviteData as any)?.user?.id;
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
          }).catch((e: any) => console.error("Profile creation error:", e.message));
        }
        return json({ success: true, message: `Invite sent to ${email}` });
      }

      case "reset_mpin": {
        let targetUserId = user_id;
        if (!targetUserId && profile_id) {
          const { data: p } = await adminClient.from("profiles").select("user_id").eq("id", profile_id).single();
          if (!(p as any)?.user_id) return json({ error: "User not found" }, 404);
          targetUserId = (p as any).user_id;
        }
        if (!targetUserId) return json({ error: "user_id or profile_id required" }, 400);
        const { error: updateErr } = await adminClient.auth.admin.updateUserById(targetUserId, {
          app_metadata: {
            mpin_hash: null,
            mpin_failed_attempts: 0,
            mpin_blocked_until: null,
            security_questions_done: false,
            security_answers: [],
            totp_secret: null,
            totp_setup_done: false,
            totp_pending_secret: null,
          },
        });
        if (updateErr) return json({ error: updateErr.message }, 500);
        return json({ success: true, message: "Full security reset done. User will be prompted to create M-Pin, Security Questions, and setup Google Auth on next login." });
      }

      case "send_password_reset": {
        const targetEmail = body.email;
        if (!targetEmail) return json({ error: "email required" }, 400);
        const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({ type: "recovery", email: targetEmail });
        if (linkErr) return json({ error: linkErr.message }, 400);
        return json({ success: true, message: `Password reset link sent to ${targetEmail}`, action_link: (linkData as any)?.properties?.action_link });
      }

      case "save_admin_notes": {
        const pid = body.profile_id;
        const notes = body.notes;
        if (!pid) return json({ error: "profile_id required" }, 400);
        const { error: nErr } = await adminClient.from("profiles").update({ approval_notes: notes ?? null }).eq("id", pid);
        if (nErr) return json({ error: nErr.message }, 500);
        return json({ success: true, message: "Notes saved" });
      }

      case "send_notification": {
        const { target_user_id, title, message: notifMsg } = body;
        if (!target_user_id || !title || !notifMsg) return json({ error: "target_user_id, title and message required" }, 400);
        const { error: nErr } = await adminClient.from("notifications").insert({ user_id: target_user_id, title, message: notifMsg, type: "info" });
        if (nErr) return json({ error: nErr.message }, 500);
        return json({ success: true, message: "Notification sent" });
      }

      case "generate_magic_link": {
        const targetEmail = body.email;
        const redirectTo = body.redirect_to;
        if (!targetEmail) return json({ error: "email required" }, 400);
        const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
          type: "magiclink",
          email: targetEmail,
          options: { redirectTo: redirectTo || undefined },
        });
        if (linkErr) return json({ error: linkErr.message }, 500);
        let actionLink: string = (linkData as any)?.properties?.action_link;
        if (!actionLink) return json({ error: "Failed to generate link" }, 500);
        if (redirectTo) {
          try {
            const linkUrl = new URL(actionLink);
            linkUrl.searchParams.set("redirect_to", redirectTo);
            actionLink = linkUrl.toString();
          } catch { /* keep original */ }
        }
        let impProf: any = null;
        try { const { data: ip } = await adminClient.from("profiles").select("id, full_name").eq("email", targetEmail).maybeSingle(); impProf = ip; } catch { /* non-critical */ }
        logAudit(adminClient, adminProfileId, "impersonate_user", impProf?.id ?? null, impProf?.full_name?.[0] ?? targetEmail, { email: targetEmail });
        return json({ success: true, link: actionLink });
      }

      case "log_audit": {
        const { audit_action, target_profile_id: tpid, target_profile_name: tpname, details: auditDetails } = body;
        if (!audit_action) return json({ error: "audit_action required" }, 400);
        logAudit(adminClient, adminProfileId, audit_action, tpid ?? null, tpname ?? null, auditDetails ?? null);
        return json({ success: true });
      }

      case "get_audit_log": {
        const tpid = body.target_profile_id;
        let q = adminClient
          .from("admin_audit_logs")
          .select("id, action, admin_id, target_profile_id, target_profile_name, details, created_at, profiles!admin_audit_logs_admin_id_fkey(full_name, email)")
          .order("created_at", { ascending: false })
          .limit(100);
        if (tpid) q = q.eq("target_profile_id", tpid);
        const { data: logs, error: logErr } = await q;
        if (logErr) return json({ error: logErr.message }, 500);
        return json({ success: true, logs: logs || [] });
      }

      case "get_referral_chain": {
        if (!profile_id) return json({ error: "profile_id required" }, 400);
        const { data: prof } = await adminClient.from("profiles").select("referral_code, referred_by").eq("id", profile_id).single();
        if (!prof) return json({ error: "Profile not found" }, 404);
        let referrer = null;
        if ((prof as any).referred_by) {
          const { data: r } = await adminClient.from("profiles").select("id, full_name, email, user_code, user_type").eq("referral_code", (prof as any).referred_by).maybeSingle();
          referrer = r ?? null;
        }
        const { data: referrals } = await adminClient.from("profiles").select("id, full_name, email, user_code, user_type, created_at").eq("referred_by", (prof as any).referral_code).order("created_at", { ascending: false }).limit(20);
        return json({ success: true, referral_code: (prof as any).referral_code, referred_by: (prof as any).referred_by, referrer, referrals: referrals || [] });
      }

      case "get_kyc_docs": {
        if (!profile_id) return json({ error: "profile_id required" }, 400);
        const { data: bvList, error: bvErr } = await adminClient
          .from("bank_verifications")
          .select("id, status, rejection_reason, created_at, verified_at, document_path, document_name, attempt_count")
          .eq("profile_id", profile_id)
          .order("created_at", { ascending: false });
        if (bvErr) return json({ error: bvErr.message }, 500);
        const docs = await Promise.all((bvList || []).map(async (bv: any) => {
          let doc_url = null;
          if (bv.document_path) {
            const { data: signedData } = await adminClient.storage.from("kyc-documents").createSignedUrl(bv.document_path, 3600);
            doc_url = (signedData as any)?.signedUrl ?? null;
          }
          return { ...bv, doc_url };
        }));
        return json({ success: true, docs });
      }

      case "get_aadhaar_docs": {
        if (!profile_id) return json({ error: "profile_id required" }, 400);
        const { data: avList, error: avErr } = await adminClient
          .from("aadhaar_verifications")
          .select("id, status, rejection_reason, is_cleared, created_at, verified_at, aadhaar_number, name_on_aadhaar, dob_on_aadhaar, address_on_aadhaar, front_image_path, back_image_path")
          .eq("profile_id", profile_id)
          .order("created_at", { ascending: false });
        if (avErr) return json({ error: avErr.message }, 500);
        const records = await Promise.all((avList || []).map(async (av: any) => {
          let front_url = null, back_url = null;
          if (av.front_image_path) {
            const { data: fd } = await adminClient.storage.from("aadhaar-documents").createSignedUrl(av.front_image_path, 3600);
            front_url = (fd as any)?.signedUrl ?? null;
          }
          if (av.back_image_path) {
            const { data: bd } = await adminClient.storage.from("aadhaar-documents").createSignedUrl(av.back_image_path, 3600);
            back_url = (bd as any)?.signedUrl ?? null;
          }
          return { ...av, front_url, back_url };
        }));
        logAudit(adminClient, adminProfileId, "view_aadhaar_docs", profile_id, null, {});
        return json({ success: true, records });
      }

      case "send_email": {
        const tpid = body.target_profile_id;
        const tuid = body.target_user_id;
        const { subject, message: emailMsg } = body;
        if (!tuid || !subject || !emailMsg) return json({ error: "target_user_id, subject and message required" }, 400);
        await adminClient.from("notifications").insert({ user_id: tuid, title: subject, message: emailMsg, type: "admin_email" }).catch(() => {});
        if (tpid) logAudit(adminClient, adminProfileId, "send_email", tpid, null, { subject });
        return json({ success: true, message: "Message sent via in-app notification", via: "in_app" });
      }

      case "get_user_stats": {
        if (!profile_id) return json({ error: "profile_id required" }, 400);
        const [
          { count: projectsPosted },
          { count: servicesListed },
          { data: reviewsData },
          { data: txnData },
        ] = await Promise.all([
          adminClient.from("projects").select("*", { count: "exact", head: true }).eq("client_id", profile_id),
          adminClient.from("employee_services").select("*", { count: "exact", head: true }).eq("profile_id", profile_id),
          adminClient.from("reviews").select("rating").eq("reviewee_id", profile_id),
          adminClient.from("transactions").select("amount, type").eq("profile_id", profile_id),
        ]);
        const reviewCount = (reviewsData as any[])?.length ?? 0;
        const avgRating = reviewCount > 0 ? ((reviewsData as any[]).reduce((s: number, r: any) => s + r.rating, 0) / reviewCount).toFixed(1) : null;
        const totalEarned = ((txnData as any[]) || []).filter((t: any) => t.type?.includes("credit") || t.type?.includes("earn") || t.type?.includes("add")).reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
        return json({ success: true, projects_posted: projectsPosted ?? 0, services_listed: servicesListed ?? 0, review_count: reviewCount, avg_rating: avgRating, total_earned: totalEarned });
      }

      case "issue_warning": {
        const { target_profile_id: tpid, target_user_id: tuid, warning_level, reason } = body;
        if (!tpid || !tuid || !warning_level || !reason) return json({ error: "target_profile_id, target_user_id, warning_level, and reason required" }, 400);
        const warnLabels: Record<string, string> = { minor: "Minor Warning", moderate: "Moderate Warning", severe: "Severe Warning", final: "Final Warning" };
        const warnEmojis: Record<string, string> = { minor: "⚠️", moderate: "🔶", severe: "🔴", final: "🚫" };
        const label = warnLabels[warning_level] || "Warning";
        const emoji = warnEmojis[warning_level] || "⚠️";
        await adminClient.from("notifications").insert({ user_id: tuid, title: `${emoji} Official ${label}`, message: reason, type: "admin_warning" });
        logAudit(adminClient, adminProfileId, "issue_warning", tpid, null, { warning_level, reason });
        return json({ success: true, message: `${label} issued and user notified` });
      }

      case "bulk_notify": {
        const { target_user_ids, title: bulkTitle, message: bulkMsg } = body;
        if (!Array.isArray(target_user_ids) || !bulkTitle || !bulkMsg) return json({ error: "target_user_ids (array), title, and message required" }, 400);
        if (target_user_ids.length === 0) return json({ error: "No users selected" }, 400);
        if (target_user_ids.length > 500) return json({ error: "Max 500 users per bulk send" }, 400);
        const rows = target_user_ids.map((uid: string) => ({ user_id: uid, title: bulkTitle, message: bulkMsg, type: "admin_bulk" }));
        const { error: bulkErr } = await adminClient.from("notifications").insert(rows);
        if (bulkErr) return json({ error: bulkErr.message }, 500);
        logAudit(adminClient, adminProfileId, "bulk_notify", null, null, { count: target_user_ids.length, title: bulkTitle });
        return json({ success: true, sent: target_user_ids.length });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
