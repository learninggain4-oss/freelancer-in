import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const AdminPreview = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user || !profile) {
      navigate("/login", { replace: true });
      return;
    }

    // Mark session as admin-impersonated — ProtectedRoute reads this to bypass approval check
    sessionStorage.setItem("admin_view", "1");
    // Bypass MPIN + security question gates for this tab
    sessionStorage.setItem(`mpin_ok_${user.id}`, "1");
    sessionStorage.setItem(`sq_done_${user.id}`, "1");
    sessionStorage.setItem(`totp_ok_${user.id}`, "1");

    // Route directly to the correct dashboard based on user_type
    if ((profile as any).user_type === "client") {
      navigate("/employer/dashboard", { replace: true });
    } else if ((profile as any).user_type === "employee") {
      navigate("/freelancer/dashboard", { replace: true });
    } else {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default AdminPreview;
