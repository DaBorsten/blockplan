"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { PROTECTED_PATH_PREFIXES, ROUTE_STUNDENPLAN } from "@/constants/routes";

// Centralised in @/constants/routes (PROTECTED_PATH_PREFIXES)

// Convex query liefert direkt { id, nickname } oder null

function isProtectedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true;
  if (pathname === "/willkommen") return true;
  return PROTECTED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

// (Validierung entfällt, da Convex typisiert ist)

export function NicknameGuard() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const me = useQuery(api.users.me, isSignedIn ? {} : "skip");

  useEffect(() => {
    if (!isSignedIn) return;
    if (!isProtectedPath(pathname)) return;
    if (me === undefined) return; // loading
    const hasNickname = !!me?.nickname?.trim();
    if (pathname === "/willkommen") {
      if (hasNickname) router.replace(ROUTE_STUNDENPLAN);
      return;
    }
    if (!hasNickname) router.replace("/willkommen");
  }, [isSignedIn, user?.id, pathname, router, me]);

  return null;
}
