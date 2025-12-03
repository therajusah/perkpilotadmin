import { type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps): ReactElement {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div 
        className="min-h-screen bg-black flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Loading authentication status"
      >
        <div className="text-white">
          <span className="sr-only">Loading authentication status, please wait</span>
          <span aria-hidden="true">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

