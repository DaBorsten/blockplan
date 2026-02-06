"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ROUTE_STUNDENPLAN } from "@/constants/routes";
import { Authenticated, Unauthenticated, useConvexAuth } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";

const features = [
  {
    num: "01",
    title: "Wochen",
    description: "Zwischen Unterrichtswochen wechseln, immer im Blick.",
  },
  {
    num: "02",
    title: "Notizen",
    description: "Strukturiert an jeder Stunde — pro Gruppe.",
  },
  {
    num: "03",
    title: "Zusammen",
    description: "Klassen erstellen, einladen, in Echtzeit teilen.",
  },
] as const;

export default function LandingPage() {
  const { isLoading } = useConvexAuth();

  return (
    <main className="flex-1 flex flex-col">
      {/* ─── Hero ─── */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-24 md:py-32 overflow-hidden">
        {/* Animated grid + gradient orbs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
          <div className="landing-grid absolute inset-0" />
          <div className="absolute inset-0 dark:hidden bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.2),transparent_50%)]" />
          {/* Mask: fade grid out towards edges */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--background)_75%)]" />
          <div className="landing-orb absolute w-[min(500px,80vw)] h-[min(500px,80vw)] rounded-full bg-brand/6 dark:bg-brand/9 blur-[100px] top-[10%] left-[15%]" style={{ animationDuration: "25s" }} />
          <div className="landing-orb absolute w-[min(400px,70vw)] h-[min(400px,70vw)] rounded-full bg-brand/4 dark:bg-brand/7 blur-[80px] bottom-[5%] right-[10%]" style={{ animationDuration: "30s", animationDelay: "5s" }} />
        </div>

        <div className="relative z-10 max-w-2xl w-full text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] animate-landing-fade-up">
            Dein Stundenplan.
            <br />
            <span className="text-brand">Mit Notizen.</span>
          </h1>

          <p className="mt-6 text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mx-auto animate-landing-fade-up [animation-delay:180ms]">
            Organisiere Unterricht, erfasse Notizen und arbeite in Klassen
            zusammen&nbsp;— in&nbsp;Echtzeit.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3 animate-landing-fade-up [animation-delay:300ms]">
            {isLoading ? (
              <Skeleton
                className="h-11 w-44"
                role="status"
                aria-live="polite"
                aria-busy="true"
              />
            ) : (
              <>
                <Unauthenticated>
                  <SignUpButton
                    mode="modal"
                    forceRedirectUrl={ROUTE_STUNDENPLAN}
                  >
                    <Button size="lg" className="gap-2 group cursor-pointer">
                      Jetzt starten
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </SignUpButton>
                  <SignInButton
                    mode="modal"
                    forceRedirectUrl={ROUTE_STUNDENPLAN}
                  >
                    <Button variant="outline" size="lg" className="cursor-pointer bg-background dark:bg-background/60">
                      Anmelden
                    </Button>
                  </SignInButton>
                </Unauthenticated>
                <Authenticated>
                  <Button asChild size="lg" className="gap-2 group cursor-pointer">
                    <Link href={ROUTE_STUNDENPLAN}>
                      Zum Stundenplan
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </Authenticated>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="border-t border-border dark:border-border/80">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border dark:divide-border/80">
          {features.map((f, i) => (
            <div
              key={f.num}
              className="px-6 md:px-10 py-8 md:py-12 animate-landing-fade-up"
              style={{ animationDelay: `${500 + i * 100}ms` }}
            >
              <span className="text-xs font-mono text-brand dark:text-brand/70 tracking-widest">
                {f.num}
              </span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
