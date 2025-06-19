"use client";
import { createClient } from "@/src/lib/supabase/client";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    // Optionally, subscribe to auth changes for real-time updates
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.avatar_url;

  if (user) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="focus:outline-none">
            <Avatar className="w-8 h-8 border-2">
              {avatarUrl ? (
                <AvatarImage
                  src={avatarUrl}
                  alt={user.user_metadata?.full_name}
                />
              ) : (
                <AvatarFallback>
                  {user.user_metadata?.full_name
                    ? user.user_metadata?.full_name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                    : user.email[0]}
                </AvatarFallback>
              )}
            </Avatar>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-0">
          <div className="px-4 pt-4">{user.user_metadata?.full_name}</div>
          <div className="px-4 pb-4 border-b-1  text-sm text-muted-foreground">
            {user.email}
          </div>

          <button
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-red-100 transition-colors border-t"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push("/auth/login");
            }}
          >
            <LogOut size={16} /> Log out
          </button>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
