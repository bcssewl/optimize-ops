"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function ProtectedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("No code found in URL.");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          // Optionally insert user into users table here if needed
          router.push("/dashboard");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [searchParams, router]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  return <div className="p-8 text-center">Redirecting...</div>;
}
