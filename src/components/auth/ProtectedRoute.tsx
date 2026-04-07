import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredApproval?: boolean;
}

const ProtectedRoute = ({ children, requiredApproval = true }: ProtectedRouteProps) => {
  const { user, profile, loading, isAdmin } = useAuth();
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpDone, setOtpDone] = useState(false);
  const didOtp = useRef(false);

  // Handle admin impersonation: if token_hash is in URL, verify OTP here so
  // the new tab lands directly on the dashboard with no intermediate page.
  useEffect(() => {
    if (didOtp.current) return;
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const otpType = (params.get("type") || "magiclink") as "magiclink";
    if (!tokenHash) {
      setOtpDone(true);
      return;
    }
    didOtp.current = true;
    setOtpVerifying(true);
    // Clean URL immediately so the token is not visible
    window.history.replaceState({}, "", window.location.pathname);
    // Set bypass flags before OTP so they're ready when the session fires
    sessionStorage.setItem("admin_view", "1");

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: otpType })
      .finally(() => {
        setOtpVerifying(false);
        setOtpDone(true);
      });
  }, []);

  const spinner = (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (loading || otpVerifying || !otpDone) return spinner;

  if (!user) return <Navigate to="/login" replace />;

  // Admin/Super Admin users must only access the admin panel
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

  if (!profile) return spinner;

  // Skip approval check when admin is previewing this account via impersonation
  const isAdminView = sessionStorage.getItem("admin_view") === "1";
  if (!isAdminView && requiredApproval && profile.approval_status !== "approved") {
    return <Navigate to="/verification-pending" replace />;
  }

  // Set MPIN / SQ / TOTP bypass flags if in admin-view mode
  if (isAdminView && user?.id) {
    sessionStorage.setItem(`mpin_ok_${user.id}`, "1");
    sessionStorage.setItem(`sq_done_${user.id}`, "1");
    sessionStorage.setItem(`totp_ok_${user.id}`, "1");
  }

  // Redirect invited users with incomplete profiles
  if (
    profile.full_name &&
    profile.full_name.length > 0 &&
    profile.full_name[0] === "PENDING"
  ) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
