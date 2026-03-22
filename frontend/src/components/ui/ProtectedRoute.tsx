import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import type { SessionUser } from "../../lib/types/app";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

type ProtectedRouteProps = {
  session: SessionUser | null;
  sessionResolved: boolean;
  requiredRole?: string;
  children: ReactNode;
};

export function ProtectedRoute({ session, sessionResolved, requiredRole, children }: ProtectedRouteProps) {
  const location = useLocation();

  if (!sessionResolved) {
    return <LoadingState label="Checking your session" />;
  }

  if (!session?._id) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (requiredRole && session.role !== requiredRole) {
    return <ErrorState title="Access denied" message="This area is not available for your account." />;
  }

  return <>{children}</>;
}
