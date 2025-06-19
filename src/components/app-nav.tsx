import { AuthButton } from "@/src/components/auth-button";
import Link from "next/link";

export function AppNav() {
  return (
    <nav className="w-full border-b border-b-foreground/10 bg-white dark:bg-gray-950 h-16 flex items-center justify-center">
      <div className="w-full max-w-6xl flex justify-between items-center px-5 text-sm">
        <div className="flex gap-6 items-center font-semibold">
          <Link href="/" className="text-xl font-bold tracking-tight">
            OptimizeOps
          </Link>
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/departments" className="hover:underline">
            Departments
          </Link>
        </div>
        <AuthButton />
      </div>
    </nav>
  );
}
