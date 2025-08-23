"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

// Define which paths actually require an enforced nickname.
// Everything else (e.g. /legal-notice, /privacy-policy) is ignored by this guard.
const PROTECTED_PREFIXES = [
  "/class",
  "/manage",
  "/import",
  "/settings",
  "/setup",
  "/dev",
];

function isProtectedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true; // main app dashboard
  if (pathname === "/welcome") return true; // onboarding page itself
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function NicknameGuard() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const run = async () => {
      if (!isSignedIn || !user?.id) return;

      // Skip completely for non-protected routes (public or marketing pages)
      if (!isProtectedPath(pathname)) return;

      try {
        const res = await fetch(`/api/user?user_id=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        const hasNickname = Boolean(data?.data?.nickname);
        if (pathname === "/welcome") {
          // Already on welcome: if user finished (has nickname) redirect home
            if (hasNickname) router.replace("/");
            return;
        }
        if (!hasNickname) router.replace("/welcome");
      } catch {
        // if profile query fails, be safe and route to welcome
        if (isProtectedPath(pathname) && pathname !== "/welcome") {
          router.replace("/welcome");
        }
      }
    };
    run();
  }, [isSignedIn, user?.id, pathname, router]);

  return null;
}
