import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getStoredAdminAuth } from "@/lib/auth";

type ProtectedRouteProps = {
  children: ReactNode;
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const auth = getStoredAdminAuth();

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
