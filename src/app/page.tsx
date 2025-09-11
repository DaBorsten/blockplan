"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { CalendarDays, StickyNote, Share2, Loader2 } from "lucide-react";
import Link from "next/link";
import { ROUTE_STUNDENPLAN } from "@/constants/routes";
import { Authenticated, Unauthenticated } from "convex/react";

export default function LandingPage() {
  const { isLoaded } = useUser();

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="max-w-3xl w-full text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Dein Stundenplan mit Notizen
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Organisiere Unterricht, erfasse Notizen pro Stunde und arbeite in
          Klassen zusammen.
        </p>
        <div className="flex items-center justify-center gap-3">
          {!isLoaded ? (
            <div
              className="flex items-center gap-2"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">Lädt...</span>
            </div>
          ) : (
            <>
              <Unauthenticated>
                <SignUpButton mode="modal" forceRedirectUrl={ROUTE_STUNDENPLAN}>
                  <Button size="lg">Jetzt starten</Button>
                </SignUpButton>
                <SignInButton mode="modal" forceRedirectUrl={ROUTE_STUNDENPLAN}>
                  <Button variant="outline" size="lg">
                    Ich habe bereits ein Konto
                  </Button>
                </SignInButton>
              </Unauthenticated>
              <Authenticated>
                <Button asChild size="lg">
                  <Link href={ROUTE_STUNDENPLAN}>Zum Stundenplan</Link>
                </Button>
              </Authenticated>
            </>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6">
          <div className="rounded-lg border p-4 flex flex-col items-center gap-2">
            <CalendarDays className="h-6 w-6" aria-hidden="true" />
            <div className="font-medium">Woche im Blick</div>
            <div className="text-xs text-muted-foreground">
              Schnell zwischen Wochen wechseln
            </div>
          </div>
          <div className="rounded-lg border p-4 flex flex-col items-center gap-2">
            <StickyNote className="h-6 w-6" aria-hidden="true" />
            <div className="font-medium">Notizen je Stunde</div>
            <div className="text-xs text-muted-foreground">
              Strukturiert, gruppenbasiert
            </div>
          </div>
          <div className="rounded-lg border p-4 flex flex-col items-center gap-2">
            <Share2 className="h-6 w-6" aria-hidden="true" />
            <div className="font-medium">Gemeinsam arbeiten</div>
            <div className="text-xs text-muted-foreground">
              Klassen verwalten und einladen
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
