import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function PrivateRoute({ children }) {
  const { userLoggedIn, loading } = useAuth();
  if (loading) return null;
  return userLoggedIn ? children : <Navigate to="/signin" replace />;
}

export function PublicRoute({ children }) {
  const { userLoggedIn, loading } = useAuth();
  if (loading) return null;
  return !userLoggedIn ? children : <Navigate to="/app/upload" replace />;
}
