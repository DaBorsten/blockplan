"use client";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { SignedInWrapper } from "@/components/SignedInWrapper";
import { PublicPageWrapper } from "@/components/PublicPageWrapper";
import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { RequireAuth } from "@/components/RequireAuth";
import { FinalizeProfile } from "./FinalizeProfile";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { PROTECTED_PATH_PREFIXES } from "@/constants/routes";
import { NewsBanner } from "@/components/NewsBanner";

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
      <div className="min-h-dvh flex items-center justify-center text-sm text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  if (isPublicRoute) {
    return (
      <div className="min-h-dvh flex flex-col">
        <NewsBanner />
        <PublicPageWrapper className="flex-1 flex flex-col">{children}</PublicPageWrapper>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-dvh flex flex-col">
        <NewsBanner />
        <PublicPageWrapper className="flex-1 flex flex-col">
          <RequireAuth />
        </PublicPageWrapper>
      </div>
    );
  }

  if (isSignedIn && isProtectedPath(pathname) && me === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-sm text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  const hasNickname = !!me?.nickname?.trim();

  if (isSignedIn && !hasNickname && isProtectedPath(pathname)) {
    return (
      <div className="min-h-dvh flex flex-col">
        <NewsBanner />
        <PublicPageWrapper className="flex-1 flex flex-col">
          <FinalizeProfile />
        </PublicPageWrapper>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <NewsBanner />
      <SignedInWrapper className="flex-1 min-h-0">{children}</SignedInWrapper>
    </div>
  );
}
