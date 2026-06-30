import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredApproval?: boolean;
}

const ProtectedRoute = ({ children, requiredApproval = true }: ProtectedRouteProps) => {
  const { user, profile, loading, profileLoading, profileError, isAdmin, refreshProfile } = useAuth();

  if (loading || (user && profileLoading && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Admin/Super Admin users must only access the admin panel
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-foreground">Unable to load your profile.</p>
          <p className="mt-2 text-sm text-muted-foreground">Please check your connection and try again.</p>
          <button
            type="button"
            onClick={() => refreshProfile()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (requiredApproval && profile && profile.approval_status !== "approved") {
    return <Navigate to="/verification-pending" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
