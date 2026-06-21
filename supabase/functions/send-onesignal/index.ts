const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ONESIGNAL_API_URL = "https://api.onesignal.com/notifications";
const WEB_APP_URL = "https://freelancer-india.lovable.app";

const postToOneSignal = async (payload: Record<string, unknown>, apiKey: string) => {
  const res = await fetch(ONESIGNAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let result: any = {};
  try {
    result = raw ? JSON.parse(raw) : {};
  } catch {
    result = { raw };
  }

  if (!res.ok || result?.errors) {
    const details = result?.errors ?? result;
    throw new Error(`OneSignal API error (${res.status}): ${JSON.stringify(details)}`);
  }

  return result;
};

const basePayload = (appId: string, title: string, message?: string, type?: string) => ({
  app_id: appId,
  headings: { en: title },
  contents: { en: message || "" },
  data: { type: type || "info" },
  web_url: WEB_APP_URL,
});

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
        return new Response(JSON.stringify({ error: "user_id and title required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await postToOneSignal(
        {
          ...basePayload(ONESIGNAL_APP_ID, title, message, type),
          include_aliases: { external_id: [user_id] },
          target_channel: "push",
        },
        ONESIGNAL_REST_API_KEY
      );

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: send to all users or by segment
    if (action === "push_to_all") {
      const { title, message, type, segment } = body;
      if (!title) {
        return new Response(JSON.stringify({ error: "title required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await postToOneSignal(
        {
          ...basePayload(ONESIGNAL_APP_ID, title, message, type),
          included_segments: [segment || "Subscribed Users"],
        },
        ONESIGNAL_REST_API_KEY
      );

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: send to multiple specific users
    if (action === "push_to_users") {
      const { user_ids, title, message, type } = body;
      if (!Array.isArray(user_ids) || user_ids.length === 0 || !title) {
        return new Response(JSON.stringify({ error: "user_ids (non-empty array) and title required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await postToOneSignal(
        {
          ...basePayload(ONESIGNAL_APP_ID, title, message, type),
          include_aliases: { external_id: user_ids },
          target_channel: "push",
        },
        ONESIGNAL_REST_API_KEY
      );

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-onesignal error", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
