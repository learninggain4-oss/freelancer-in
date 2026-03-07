import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    if (userError || !callerUser) {
      console.error("Token validation failed:", userError);
      // Fallback to manual JWT decoding
      const fallbackId = getUserIdFromJwt(authHeader);
      if (!fallbackId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      var callerUserId = fallbackId;
    } else {
      var callerUserId = callerUser.id;
    }



    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, user_id, profile_id } = await req.json();

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

        // 4. Delete records referencing profile_id
        await Promise.all([
          adminClient.from("aadhaar_verifications").delete().eq("profile_id", pid),
          adminClient.from("bank_verifications").delete().eq("profile_id", pid),
          adminClient.from("documents").delete().eq("profile_id", pid),
          adminClient.from("employee_emergency_contacts").delete().eq("profile_id", pid),
          adminClient.from("employee_services").delete().eq("profile_id", pid),
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
          adminClient.from("announcement_dismissals").delete().eq("user_id", pid),
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

        // 6. Clean up audit log references & delete logs where this user was the admin
        await adminClient.from("admin_audit_logs").update({ target_profile_id: null }).eq("target_profile_id", pid);
        await adminClient.from("admin_audit_logs").delete().eq("admin_id", pid);

        await adminClient.from("admin_audit_logs").insert({
          admin_id: callerUserId,
          action: "permanent_delete_user",
          target_profile_id: null,
          target_profile_name: profile.full_name?.[0] || "Unknown",
          details: { reason: "Permanent deletion by admin", deleted_profile_id: pid },
        });

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
          return new Response(JSON.stringify({ error: "Database error deleting user" }), {
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

        const { error: logoutError } = await adminClient.auth.admin.signOut(user_id, "global");
        if (logoutError) {
          return new Response(JSON.stringify({ error: logoutError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: targetProfile } = await adminClient
          .from("profiles")
          .select("id, full_name")
          .eq("user_id", user_id)
          .maybeSingle();

        await adminClient.from("admin_audit_logs").insert({
          admin_id: callerUserId,
          action: "force_logout",
          target_profile_id: targetProfile?.id || null,
          target_profile_name: targetProfile?.full_name?.[0] || "Unknown",
          details: { scope: "global" },
        });

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

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
