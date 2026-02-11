import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredApproval?: boolean;
}

const ProtectedRoute = ({ children, requiredApproval = true }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredApproval && profile?.approval_status === "pending") {
    return <Navigate to="/verification-pending" replace />;
  }

  if (requiredApproval && profile?.approval_status === "rejected") {
    return <Navigate to="/verification-pending" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
