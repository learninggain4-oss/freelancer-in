import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "ready" | "already" | "invalid" | "success" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: ANON_KEY } }
        );
        const data = await res.json();
        if (data.valid) setState("ready");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setSubmitting(false);
    if (error) { setState("error"); return; }
    if (data?.success) setState("success");
    else if (data?.reason === "already_unsubscribed") setState("already");
    else setState("error");
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Email preferences</h1>
        {state === "loading" && <p className="text-slate-600">Verifying your link…</p>}
        {state === "invalid" && <p className="text-slate-600">This unsubscribe link is invalid or has expired.</p>}
        {state === "already" && <p className="text-slate-600">You're already unsubscribed from these emails.</p>}
        {state === "error" && <p className="text-red-600">Something went wrong. Please try again later.</p>}
        {state === "ready" && (
          <>
            <p className="text-slate-600 mb-6">Click below to unsubscribe from Freelancer-in account notification emails.</p>
            <button
              onClick={confirm}
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl"
            >
              {submitting ? "Unsubscribing…" : "Confirm Unsubscribe"}
            </button>
          </>
        )}
        {state === "success" && <p className="text-emerald-600 font-medium">You've been unsubscribed. We're sorry to see you go.</p>}
      </div>
    </div>
  );
}
