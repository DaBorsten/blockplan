"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { PROTECTED_PATH_PREFIXES, ROUTE_STUNDENPLAN } from "@/constants/routes";

// Centralised in @/constants/routes (PROTECTED_PATH_PREFIXES)

interface UserMeResponse {
  data?: { nickname?: string };
}

function isProtectedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true;
  if (pathname === "/willkommen") return true;
  return PROTECTED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isUserMeResponse(obj: unknown): obj is UserMeResponse {
  if (obj === null || typeof obj !== "object") return false;
  if (!("data" in obj)) return true; // data optional
  const data = (obj as { data?: unknown }).data;
  if (data == null) return true;
  if (typeof data !== "object") return false;
  const nick = (data as { nickname?: unknown }).nickname;
  return nick === undefined || typeof nick === "string";
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
        const res = await fetch("/api/user/me", { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401) {
            // Benutzer ist nicht authentifiziert
            router.replace("/");
            return;
          }
          throw new Error(`Profile load failed: ${res.status}`);
        }
        const json: unknown = await res.json().catch(() => ({} as unknown));

        const parsed: UserMeResponse = isUserMeResponse(json) ? json : {};
        const hasNickname = Boolean(parsed.data?.nickname);
        if (pathname === "/willkommen") {
          // Already on willkommen: if user finished (has nickname) redirect timetable
          if (hasNickname) router.replace(ROUTE_STUNDENPLAN);
          return;
        }
        if (!hasNickname) router.replace("/willkommen");
      } catch (error) {
        console.error("Fehler beim Laden des Benutzerprofils:", error);
        // if profile query fails, be safe and route to willkommen
        if (isProtectedPath(pathname) && pathname !== "/willkommen") {
          router.replace("/willkommen");
        }
      }
    };
    run();
  }, [isSignedIn, user?.id, pathname, router]);

  return null;
}
