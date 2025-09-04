"use client";
import React from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ClerkUserButton } from "@/components/ClerkUserButton";
import { ROUTE_STUNDENPLAN } from "@/constants/routes";

interface Props {
  children: React.ReactNode;
}

export default function Public({ children }: Props) {
  return (
    <>
      {/* Skip link for keyboard and screen reader users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Zum Inhalt springen
      </a>
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between p-4 md:p-6 h-16">
          <Link href="/" aria-label="Zur Startseite">
            <span className="font-semibold">Blockplan</span>
          </Link>
          <nav
            aria-label="Benutzeraktionen"
            className="flex items-center gap-2"
          >
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl={ROUTE_STUNDENPLAN}>
                <Button variant="ghost" size="sm" type="button">
                  Anmelden
                </Button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl={ROUTE_STUNDENPLAN}>
                <Button size="sm" type="button">
                  Registrieren
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <ClerkUserButton />
            </SignedIn>
          </nav>
        </header>
        <main id="main" className="flex-1 flex flex-col">
          {children}
        </main>
        <footer className="p-4 md:p-6 text-center text-sm text-muted-foreground">
          <Link href="/datenschutzhinweis">Datenschutzhinweis</Link>
          <span> | </span>
          <Link href="/impressum">Impressum</Link>
        </footer>
      </div>
    </>
  );
}
