"use client";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { SignedInWrapper } from "@/components/SignedInWrapper";
import { PublicPageWrapper } from "@/components/PublicPageWrapper";
import { ReactNode } from "react";
import { Spinner } from "./ui/spinner";
import { RequireAuth } from "@/components/RequireAuth";
import { FinalizeProfile } from "./FinalizeProfile";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { PROTECTED_PATH_PREFIXES } from "@/constants/routes";

function isProtectedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (PUBLIC_ROUTES.has(pathname)) return false;
  return PROTECTED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  const me = useQuery(api.users.me, isSignedIn ? {} : "skip");

  // Während Clerk noch lädt: Loader minimal – verhindert falschen Public Snapshot.
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  if (isPublicRoute) {
    return <PublicPageWrapper>{children}</PublicPageWrapper>;
  }

  if (!isSignedIn) {
    // Protected route but user not authenticated
    return (
      <PublicPageWrapper>
        <RequireAuth />
      </PublicPageWrapper>
    );
  }

  if (isSignedIn && isProtectedPath(pathname) && me === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  const hasNickname = !!me?.nickname?.trim();

  if (isSignedIn && !hasNickname && isProtectedPath(pathname)) {
    return (
      <PublicPageWrapper>
        <FinalizeProfile />
      </PublicPageWrapper>
    );
  }

  return <SignedInWrapper>{children}</SignedInWrapper>;
}
