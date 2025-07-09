"use client";
import { createClient } from "@/src/lib/supabase/client";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
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

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        // Fetch user role from users table
        const { data: userRow } = await supabase
          .from("users")
          .select("id, email, role")
          .eq("uuid", userData.user.id)
          .single();
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
    // const { data: listener } = supabase.auth.onAuthStateChange(() => {
    //   getUser();
    // });
    // return () => {
    //   listener?.subscription.unsubscribe();
    // };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
