import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AdminPreview = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [verifyDone, setVerifyDone] = useState(false);
  const didVerify = useRef(false);

  // Step 1: If a token_hash is in the URL, verify OTP to establish session.
  // This bypasses Supabase redirect-URL whitelist entirely.
  useEffect(() => {
    if (didVerify.current) return;
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const otpType = (params.get("type") || "magiclink") as "magiclink";
    if (!tokenHash) {
      setVerifyDone(true);
      return;
    }
    didVerify.current = true;
    setVerifying(true);
    // Clean the sensitive token from the URL immediately
    window.history.replaceState({}, "", "/admin-preview");

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: otpType })
      .then(({ error }) => {
        if (error) navigate("/login", { replace: true });
      })
      .finally(() => {
        setVerifying(false);
        setVerifyDone(true);
      });
  }, [navigate]);

  // Step 2: Once session + profile are ready, set bypass flags and route.
  useEffect(() => {
    if (loading) return;
    if (verifying) return;
    if (!verifyDone) return;

    // No user and no pending OTP → send to login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // Profile still loading — wait
    if (!profile) return;

    // Mark session as admin-impersonated (ProtectedRoute skips approval check)
    sessionStorage.setItem("admin_view", "1");
    // Bypass MPIN + security question + TOTP gates for this tab
    sessionStorage.setItem(`mpin_ok_${user.id}`, "1");
    sessionStorage.setItem(`sq_done_${user.id}`, "1");
    sessionStorage.setItem(`totp_ok_${user.id}`, "1");

    if ((profile as any).user_type === "client") {
      navigate("/employer/dashboard", { replace: true });
    } else if ((profile as any).user_type === "employee") {
      navigate("/freelancer/dashboard", { replace: true });
    } else {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, profile, loading, navigate, verifying, verifyDone]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default AdminPreview;
