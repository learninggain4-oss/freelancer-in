import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error("OneSignal credentials not configured");
    }

    const body = await req.json();
    const { action } = body;

    // Action: send to specific user by user_id (auth uid)
    if (!action || action === "push_to_user") {
      const { user_id, title, message, type } = body;
      if (!user_id || !title) {
        return new Response(
          JSON.stringify({ error: "user_id and title required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_aliases: { external_id: [user_id] },
          target_channel: "push",
          headings: { en: title },
          contents: { en: message || "" },
          data: { type: type || "info" },
          web_url: "https://freelancer-india.lovable.app",
        }),
      });

      const result = await res.json();
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: send to all users or by segment
    if (action === "push_to_all") {
      const { title, message, type, segment } = body;

      const payload: any = {
        app_id: ONESIGNAL_APP_ID,
        headings: { en: title },
        contents: { en: message || "" },
        data: { type: type || "info" },
        web_url: "https://freelancer-india.lovable.app",
      };

      if (segment) {
        payload.included_segments = [segment];
      } else {
        payload.included_segments = ["Subscribed Users"];
      }

      const res = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: send to multiple specific users
    if (action === "push_to_users") {
      const { user_ids, title, message, type } = body;

      const res = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_aliases: { external_id: user_ids },
          target_channel: "push",
          headings: { en: title },
          contents: { en: message || "" },
          data: { type: type || "info" },
          web_url: "https://freelancer-india.lovable.app",
        }),
      });

      const result = await res.json();
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
