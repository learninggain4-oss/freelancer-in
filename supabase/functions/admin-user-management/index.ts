import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getUserInfoFromJwt(authHeader: string): { userId: string | null; email: string | null } {
  try {
    const token = authHeader.replace("Bearer ", "");
    const parts = token.split(".");
    if (parts.length !== 3) return { userId: null, email: null };
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return {
      userId: payload.sub || null,
      email: typeof payload.email === "string" ? payload.email.toLowerCase() : null,
    };
  } catch {
    return { userId: null, email: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Use getUser for reliable token validation instead of manual JWT decoding
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: userError } = await adminClient.auth.getUser(token);

    let callerUserId: string | null = null;
    let callerEmail: string | null = null;

    if (userError || !callerUser) {
      console.error("Token validation failed:", userError);
      const fallback = getUserInfoFromJwt(authHeader);
      if (!fallback.userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      callerUserId = fallback.userId;
      callerEmail = fallback.email;
    } else {
      callerUserId = callerUser.id;
      callerEmail = callerUser.email?.toLowerCase() || null;
    }

    if (!callerUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const superAdminEmails = (Deno.env.get("SUPER_ADMIN_EMAILS") || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const normalizedCallerEmail = callerEmail || "";
    const isSuperAdmin = normalizedCallerEmail && superAdminEmails.includes(normalizedCallerEmail);

    let roleRows: any[] | null = null;
    if (!isSuperAdmin) {
      const { data, error: roleError } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", callerUserId)
        .in("role", ["admin", "super_admin"]);

      if (roleError) {
        console.error("Role check error:", roleError, { callerUserId, callerEmail });
        return new Response(JSON.stringify({
          error: "Failed to validate admin access",
          detail: roleError.message,
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      roleRows = data;
    }

    const isAdminOrSuperAdmin = isSuperAdmin || (roleRows && roleRows.length > 0);

    if (!isAdminOrSuperAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin or super_admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, user_id, profile_id, email, user_type } = await req.json();

    switch (action) {
      case "permanent_delete": {
        if (!profile_id) {
          return new Response(JSON.stringify({ error: "profile_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: profile } = await adminClient
          .from("profiles")
          .select("user_id, full_name")
          .eq("id", profile_id)
          .single();

        if (!profile) {
          return new Response(JSON.stringify({ error: "Profile not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const userId = profile.user_id;
        const pid = profile_id;

        // 1. Delete employee_skill_selections (child of employee_services)
        const { data: empServices } = await adminClient
          .from("employee_services")
          .select("id")
          .eq("profile_id", pid);
        if (empServices && empServices.length > 0) {
          const serviceIds = empServices.map((s: any) => s.id);
          await adminClient.from("employee_skill_selections").delete().in("employee_service_id", serviceIds);
        }

        // 2. Handle projects where user is client — delete entire project tree
        const { data: clientProjects } = await adminClient
          .from("projects")
          .select("id")
          .eq("client_id", pid);
        if (clientProjects && clientProjects.length > 0) {
          const projectIds = clientProjects.map((p: any) => p.id);
          // Get chat rooms for these projects
          const { data: chatRooms } = await adminClient
            .from("chat_rooms")
            .select("id")
            .in("project_id", projectIds);
          if (chatRooms && chatRooms.length > 0) {
            const roomIds = chatRooms.map((r: any) => r.id);
            // Get message ids for reactions cleanup
            const { data: roomMessages } = await adminClient
              .from("messages")
              .select("id")
              .in("chat_room_id", roomIds);
            if (roomMessages && roomMessages.length > 0) {
              await adminClient.from("message_reactions").delete().in("message_id", roomMessages.map((m: any) => m.id));
            }
            await adminClient.from("messages").delete().in("chat_room_id", roomIds);
            await adminClient.from("chat_rooms").delete().in("id", roomIds);
          }
          // Delete project child records
          await Promise.all([
            adminClient.from("project_applications").delete().in("project_id", projectIds),
            adminClient.from("project_submissions").delete().in("project_id", projectIds),
            adminClient.from("project_documents").delete().in("project_id", projectIds),
            adminClient.from("payment_confirmations").delete().in("project_id", projectIds),
            adminClient.from("recovery_requests").delete().in("project_id", projectIds),
          ]);
          await adminClient.from("projects").delete().in("id", projectIds);
        }

        // 3. Nullify assigned_employee_id on remaining projects
        await adminClient.from("projects").update({ assigned_employee_id: null }).eq("assigned_employee_id", pid);

        // 3b. Break FKs from other rows that reference this profile (no CASCADE)
        await adminClient.from("admin_audit_logs").update({ target_profile_id: null }).eq("target_profile_id", pid);
        await adminClient.from("profiles").update({ edit_reviewed_by: null }).eq("edit_reviewed_by", pid);
        await adminClient.from("recovery_requests").update({ resolved_by: null }).eq("resolved_by", pid);
        await adminClient.from("withdrawals").update({ reviewed_by: null }).eq("reviewed_by", pid);
        await adminClient.from("blocked_ips").update({ blocked_by: null }).eq("blocked_by", pid);

        // 4. Delete records referencing profile_id
        await Promise.all([
          adminClient.from("aadhaar_verifications").delete().eq("profile_id", pid),
          adminClient.from("bank_verifications").delete().eq("profile_id", pid),
          adminClient.from("documents").delete().eq("profile_id", pid),
          adminClient.from("employee_emergency_contacts").delete().eq("profile_id", pid),
          adminClient.from("employee_services").delete().eq("profile_id", pid),
          // Same as Node admin route — required before profiles DELETE
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
          // notifications.user_id is auth.users.id (not profiles.id)
          adminClient.from("notifications").delete().eq("user_id", userId),
          // Back-compat: if any legacy rows used profiles.id
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
          // announcement_dismissals.user_id is auth.users.id (not profiles.id)
          adminClient.from("announcement_dismissals").delete().eq("user_id", userId),
          adminClient.from("messages").delete().eq("sender_id", pid),
          // Tables referencing profile via non-standard columns
          adminClient.from("custom_quick_replies").delete().eq("created_by", pid),
          adminClient.from("quick_reply_analytics").delete().eq("used_by", pid),
        ]);

        // 5. Delete support conversations
        const { data: supportConvo } = await adminClient
          .from("support_conversations")
          .select("id")
          .eq("user_id", pid)
          .maybeSingle();
        if (supportConvo) {
          await adminClient.from("support_messages").delete().eq("conversation_id", supportConvo.id);
          await adminClient.from("support_conversations").delete().eq("id", supportConvo.id);
        }


        // 7. Delete the profile (check for errors)
        const { error: profileDeleteError } = await adminClient.from("profiles").delete().eq("id", pid);
        if (profileDeleteError) {
          console.error("Profile delete error:", profileDeleteError);
          return new Response(JSON.stringify({ error: "Failed to delete profile: " + profileDeleteError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // 8. Delete user_roles (FK to auth.users) — THIS was the missing piece
        await adminClient.from("user_roles").delete().eq("user_id", userId);

        // 9. Finally delete the auth user
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
        if (deleteError) {
          console.error("Auth delete error:", deleteError);
          return new Response(JSON.stringify({ error: `Auth delete failed: ${deleteError.message}` }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, message: "User permanently deleted" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "force_logout": {
        if (!user_id) {
          return new Response(JSON.stringify({ error: "user_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Use Admin REST API to ban user briefly, which invalidates all sessions
        const banRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ban_duration: "1s" }),
        });
        const banBody = await banRes.text();

        if (!banRes.ok) {
          console.error("Ban error:", banRes.status, banBody);
          return new Response(JSON.stringify({ error: "Failed to force logout user" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Immediately unban
        const unbanRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ban_duration: "none" }),
        });
        await unbanRes.text();

        const { data: targetProfile } = await adminClient
          .from("profiles")
          .select("id, full_name")
          .eq("user_id", user_id)
          .maybeSingle();


        return new Response(JSON.stringify({ success: true, message: "User logged out from all sessions" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_users_sessions": {
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        if (listError) {
          return new Response(JSON.stringify({ error: listError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, user_id, full_name, user_code, user_type, is_disabled, approval_status");

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

        const sessionData = users.map((u: any) => {
          const profile = profileMap.get(u.id);
          return {
            auth_user_id: u.id,
            email: u.email,
            last_sign_in_at: u.last_sign_in_at,
            created_at: u.created_at,
            updated_at: u.updated_at,
            profile_id: profile?.id || null,
            full_name: profile?.full_name?.[0] || null,
            user_code: profile?.user_code?.[0] || null,
            user_type: profile?.user_type || null,
            is_disabled: profile?.is_disabled || false,
            approval_status: profile?.approval_status || null,
          };
        });

        return new Response(JSON.stringify({ users: sessionData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "invite_user": {
        if (!email || !user_type) {
          return new Response(JSON.stringify({ error: "email and user_type required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!["employee", "client"].includes(user_type)) {
          return new Response(JSON.stringify({ error: "user_type must be 'employee' or 'client'" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if email already exists
        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existingProfile) {
          return new Response(JSON.stringify({ error: "A user with this email already exists" }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Invite user via Supabase Auth Admin API
        const inviteRes = await fetch(`${supabaseUrl}/auth/v1/invite`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const inviteBody = await inviteRes.json();

        if (!inviteRes.ok) {
          console.error("Invite error:", inviteRes.status, inviteBody);
          return new Response(JSON.stringify({ error: inviteBody.msg || inviteBody.error || "Failed to send invite" }), {
            status: inviteRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const invitedUserId = inviteBody.id;

        // Create a minimal profile for the invited user
        if (invitedUserId) {
          const { error: profileError } = await adminClient.from("profiles").insert({
            user_id: invitedUserId,
            email,
            full_name: [email.split("@")[0].toUpperCase()],
            user_code: ["PENDING"],
            user_type,
            approval_status: "approved",
            approved_at: new Date().toISOString(),
            referral_code: invitedUserId.substring(0, 8).toUpperCase(),
          });

          if (profileError) {
            console.error("Profile creation error:", profileError);
            // Don't fail the invite — user can complete profile later
          }
        }


        return new Response(JSON.stringify({ success: true, message: `Invite sent to ${email}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset_mpin": {
        let targetUserId = user_id;
        if (!targetUserId && profile_id) {
          const { data: p } = await adminClient.from("profiles").select("user_id").eq("id", profile_id).single();
          if (!p?.user_id) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          targetUserId = p.user_id;
        }
        if (!targetUserId) return new Response(JSON.stringify({ error: "user_id or profile_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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
        if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        return new Response(JSON.stringify({ success: true, message: "Full security reset done. User will be prompted to create M-Pin, Security Questions, and setup Google Auth on next login." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
