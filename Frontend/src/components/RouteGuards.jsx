import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../context/UserContext";

export function PrivateRoute({ children }) {
  const { userLoggedIn, loading } = useAuth();
  if (loading) return null;
  return userLoggedIn ? children : <Navigate to="/signin" replace />;
}

export function PublicRoute({ children }) {
  const { userLoggedIn, loading } = useAuth();
  const { dbUser, userLoading } = useUser();
  if (loading) return null;
  // Only redirect away from public login/signup if user has confirmed active DB account
  if (userLoggedIn && dbUser && !userLoading) {
    return <Navigate to="/app/upload" replace />;
  }
  return children;
}
