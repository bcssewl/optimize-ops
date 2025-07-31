"use client";
import { createClient } from "@/src/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";

// Add types for window.google and window.handleSignInWithGoogle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    google?: any;
    handleSignInWithGoogle?: (response: any) => void;
  }
}

interface GooglePrebuiltButtonProps {
  text?: "signin_with" | "signup_with";
  className?: string;
}

const GooglePrebuiltButton = ({
  text = "signin_with",
  className = "",
}: GooglePrebuiltButtonProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Define the callback globally for Google
    // @ts-ignore
    window.handleSignInWithGoogle = async (response) => {
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });
        if (error) throw error;
        // Insert into users table only if user doesn't exist
        if (data?.user) {
          // Check if user already exists
          const { data: existingUser } = await supabase
            .from("users")
            .select("uuid")
            .eq("uuid", data.user.id)
            .single();

          // Only insert if user doesn't exist (preserve existing user's role)
          if (!existingUser) {
            // Extract full name from Google user metadata
            const fullName =
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              data.user.email?.split("@")[0] ||
              "Google User";

            await supabase.from("users").insert([
              {
                uuid: data.user.id,
                email: data.user.email,
                full_name: fullName,
                created_at: new Date().toISOString(),
                role: "supervisor", // Default role for new users only
                // organization_id: null, // Set if you have org logic
              },
            ]);
          }
        }
        router.push("/dashboard");
      } catch (error) {
        // Optionally handle error
        console.error("Google sign-in error", error);
      }
    };

    // Render the Google button after script loads and on route change
    if (window.google && window.google.accounts && buttonRef.current) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: window.handleSignInWithGoogle,
        ux_mode: "popup",
        auto_select: true,
        itp_support: true,
        use_fedcm_for_prompt: true,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        shape: "pill",
        theme: "outline",
        text,
        size: "large",
        logo_alignment: "center",
      });
    }
  }, [supabase, router, pathname, text]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.google && window.google.accounts && buttonRef.current) {
            window.google.accounts.id.initialize({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              callback: window.handleSignInWithGoogle,
              ux_mode: "popup",
              auto_select: true,
              itp_support: true,
              use_fedcm_for_prompt: true,
            });
            window.google.accounts.id.renderButton(buttonRef.current, {
              type: "standard",
              shape: "pill",
              theme: "outline",
              text,
              size: "large",
              logo_alignment: "center",
            });
          }
        }}
      />
      <div ref={buttonRef} className={className} />
    </>
  );
};

export default GooglePrebuiltButton;
