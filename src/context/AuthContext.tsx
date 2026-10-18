"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onIdTokenChanged, User } from "firebase/auth";
import { auth } from "@/config/firebase";
import { setSessionCookie, clearSessionCookie } from "@/actions/auth";

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * onIdTokenChanged fires on:
     *  - initial mount (resolved from persisted session)
     *  - sign-in
     *  - sign-out
     *  - automatic Firebase token refresh (every ~1 hour)
     *
     * This calls the server action to keep the HttpOnly __session cookie
     * perfectly in sync on the server.
     */
    const unsubscribe = onIdTokenChanged(auth, async (u) => {
      try {
        if (u) {
          const token = await u.getIdToken();
          await setSessionCookie(token);
        } else {
          await clearSessionCookie();
        }
      } catch (err) {
        console.error("Failed to update server session cookie:", err);
      } finally {
        setUser(u);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
