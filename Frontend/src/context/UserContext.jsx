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

  const fetchDbUser = useCallback(async () => {
    if (!userLoggedIn || !currentUser) {
      setDbUser(null);
      setUserLoading(false);
      return;
    }
    try {
      const res = await getMe();
      setDbUser(res.data.data.user);
    } catch (err) {
      // User may not exist in DB yet (first sign-in) — register them
      if (err.message?.includes("not found")) {
        try {
          const regRes = await registerUser({
            firebaseUID: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || "",
            photoURL: currentUser.photoURL || "",
          });
          setDbUser(regRes.data.data.user);
        } catch (regErr) {
          console.error("Failed to auto-register user:", regErr.message);
        }
      }
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
    <UserContext.Provider value={{ dbUser, setDbUser, userLoading, refreshUser, completeOnboarding }}>
      {children}
    </UserContext.Provider>
  );
}
