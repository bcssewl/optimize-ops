"use client";
import { createClient } from "@/src/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Logo() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  return (
    <Link
      href={isLoggedIn ? "/dashboard" : "/"}
      className="font-semibold text-xl"
    >
      OptimizeOps
    </Link>
  );
}
