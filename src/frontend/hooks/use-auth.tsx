import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/auth";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: UserRole;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  isSuperAdmin: false,
  role: null,
  loading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const initializedRef = useRef(false);

  // Mark client-side hydration complete (avoid SSR mismatch)
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let cancelled = false;

    // STEP 1: Read session from localStorage synchronously (fast path)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      if (session?.user?.id) {
        const userRole = await getUserRole(session.user.id);
        if (!cancelled) setRole(userRole);
      }
      setLoading(false); // ← gate opens once initial session resolved
      initializedRef.current = true;
    });

    // STEP 2: Listen for subsequent auth changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      // Skip the very first event if getSession() already handled it
      if (!initializedRef.current) return;

      setSession(newSession);
      if (newSession?.user?.id) {
        const userRole = await getUserRole(newSession.user.id);
        setRole(userRole);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    // Safety timeout: never let the app stay stuck loading
    const timeout = setTimeout(() => {
      if (!initializedRef.current) {
        console.warn("Auth session timeout — forcing gate open");
        setLoading(false);
        initializedRef.current = true;
      }
    }, 5000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [isClient]);

  const user = session?.user ?? null;
  const isAdmin = role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";
  const isAuthenticated = !loading && session !== null;

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isSuperAdmin, role, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
