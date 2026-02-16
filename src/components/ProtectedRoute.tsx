
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ["admin", "technician", "client"]
}) => {
  const { isAuthenticated, isLoading, checkUserRole } = useAuth();

  // Show nothing while checking the authentication state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (!checkUserRole(allowedRoles)) {
    // Redirect clients to their portal
    if (checkUserRole(["client"])) {
      return <Navigate to="/cliente" replace />;
    }
    // Redirect admins/technicians to dashboard
    return <Navigate to="/" replace />;
  }

  // If authenticated and has correct role, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
