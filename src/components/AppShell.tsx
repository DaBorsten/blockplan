"use client";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { SignedInWrapper } from "@/components/SignedInWrapper";
import { PublicPageWrapper } from "@/components/PublicPageWrapper";
import dynamic from "next/dynamic";
import React from "react";
import { Spinner } from "./ui/shadcn-io/spinner";

const RequireAuth = dynamic(() => import("@/components/RequireAuth"), {
  loading: () => <Spinner />,
  ssr: false,
});

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

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

  return <SignedInWrapper>{children}</SignedInWrapper>;
}

export default AppShell;
