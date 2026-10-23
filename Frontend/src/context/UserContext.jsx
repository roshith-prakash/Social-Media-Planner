import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getMe, completeOnboarding as completeOnboardingApi } from "../api/userApi";
import { registerUser } from "../api/authApi";

const UserContext = createContext(null);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}
export const useDBUser = useUser;

export function UserProvider({ children }) {
  const { currentUser, userLoggedIn } = useAuth();
  const [dbUser, setDbUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [backendOffline, setBackendOffline] = useState(false);

  const fetchDbUser = useCallback(async () => {
    if (!userLoggedIn || !currentUser) {
      setDbUser(null);
      setUserLoading(false);
      setBackendOffline(false);
      return null;
    }
    try {
      const res = await getMe();
      setDbUser(res.data.data.user);
      setBackendOffline(false);
      return res.data.data.user;
    } catch (err) {
      const is404 = err.response?.status === 404 || err.message?.includes("not found");
      if (is404) {
        try {
          const regRes = await registerUser({
            firebaseUID: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || "",
            photoURL: currentUser.photoURL || "",
          });
          setDbUser(regRes.data.data.user);
          setBackendOffline(false);
          return regRes.data.data.user;
        } catch (regErr) {
          console.error("Failed to auto-register user:", regErr.message);
          setBackendOffline(true);
          throw regErr;
        }
      }
      setBackendOffline(true);
      throw err;
    } finally {
      setUserLoading(false);
    }
  }, [currentUser, userLoggedIn]);

  useEffect(() => {
    fetchDbUser();
  }, [fetchDbUser]);

  const refreshUser = () => fetchDbUser();

  const completeOnboarding = async (data) => {
    const res = await completeOnboardingApi(data);
    setDbUser(res.data.data.user);
    return res.data.data.user;
  };

  return (
    <UserContext.Provider value={{ dbUser, setDbUser, userLoading, backendOffline, refreshUser, completeOnboarding }}>
      {children}
    </UserContext.Provider>
  );
}
