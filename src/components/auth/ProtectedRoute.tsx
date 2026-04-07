import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredApproval?: boolean;
}

const ProtectedRoute = ({ children, requiredApproval = true }: ProtectedRouteProps) => {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Admin/Super Admin users must only access the admin panel
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

  // Wait for profile to load
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Skip approval check when admin is previewing this account via impersonation
  const isAdminView = sessionStorage.getItem("admin_view") === "1";
  if (!isAdminView && requiredApproval && profile.approval_status !== "approved") {
    return <Navigate to="/verification-pending" replace />;
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
