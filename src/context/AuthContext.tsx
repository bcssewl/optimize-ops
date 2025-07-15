"use client";
import { createClient } from "@/src/lib/supabase/client";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface AuthUser {
  id: string;
  email: string;
  role?: "admin" | "supervisor" | "manager" | "staff";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<AuthUser | null>(null);

  // Update ref whenever user state changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const getUser = async () => {
      if (!mounted) return;

      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      if (!mounted) return;

      if (userData?.user) {
        // Fetch user role from users table
        const { data: userRow } = await supabase
          .from("users")
          .select("id, email, role")
          .eq("uuid", userData.user.id)
          .single();

        if (!mounted) return;

        setUser({
          id: userData.user.id,
          email: userData.user.email || "",
          role: userRow?.role || undefined,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getUser();

    // Listen for auth state changes and update user state
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(
          "*** Auth state changed:",
          event,
          "Session exists:",
          !!session
        );

        // Only refetch on actual sign-in/sign-out, not session restoration
        if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
        } else if (event === "SIGNED_IN" && session?.user && !userRef.current) {
          // Only fetch user data if we don't already have user data
          getUser();
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []); // Remove user dependency to prevent infinite loop

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
