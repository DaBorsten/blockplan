"use client";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { SignedInWrapper } from "@/components/SignedInWrapper";
import { PublicPageWrapper } from "@/components/PublicPageWrapper";
import React from "react";
import { Spinner } from "./ui/shadcn-io/spinner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
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

  if (isPublicRoute || !isSignedIn) {
    return <PublicPageWrapper>{children}</PublicPageWrapper>;
  }
  return <SignedInWrapper>{children}</SignedInWrapper>;
}

export default AppShell;
