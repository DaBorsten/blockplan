"use client";

import { Suspense, lazy } from "react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Authenticated, Unauthenticated, useConvexAuth } from "convex/react";
import { ROUTE_STUNDENPLAN } from "@/constants/routes";
import { Skeleton } from "@/components/ui/skeleton";

const LandingAuthenticatedAction = lazy(() =>
  import("@/app/_components/LandingAuthenticatedAction").then((module) => ({
    default: module.LandingAuthenticatedAction,
  })),
);

export function LandingAuthActions() {
  const { isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="w-44">
        <Skeleton
          className="h-11 w-full"
          role="status"
          aria-live="polite"
          aria-busy="true"
        />
      </div>
    );
  }

  return (
    <>
      <Unauthenticated>
        <SignUpButton mode="modal" forceRedirectUrl={ROUTE_STUNDENPLAN}>
          <Button size="lg" className="gap-2 group">
            Jetzt starten
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </SignUpButton>
        <SignInButton mode="modal" forceRedirectUrl={ROUTE_STUNDENPLAN}>
          <Button
            variant="outline"
            size="lg"
            className="bg-background dark:bg-background/60"
          >
            Anmelden
          </Button>
        </SignInButton>
      </Unauthenticated>
      <Authenticated>
        <Suspense
          fallback={<Skeleton className="h-11 w-44" role="status" aria-live="polite" aria-busy="true" />}
        >
          <LandingAuthenticatedAction />
        </Suspense>
      </Authenticated>
    </>
  );
}
