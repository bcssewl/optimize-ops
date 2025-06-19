"use client";
import Logo from "@/src/components/Logo";
import { AuthButton } from "@/src/components/auth-button";
import { createClient } from "@/src/lib/supabase/client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppNav() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4 px-4">
      <div
        className={
          pathname === "/"
            ? "container mx-auto flex items-center justify-between"
            : "flex items-center justify-between"
        }
      >
        <Logo />
        <AuthButton />
      </div>
    </nav>
  );
}
