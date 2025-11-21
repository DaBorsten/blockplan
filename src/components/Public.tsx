"use client";
import React from "react";
import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ClerkUserButton } from "@/components/ClerkUserButton";
import { ROUTE_STUNDENPLAN } from "@/constants/routes";
import { Authenticated, Unauthenticated } from "convex/react";

interface Props {
  children: React.ReactNode;
}

export function Public({ children }: Props) {
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
          <Link
            href="/"
            aria-label="Zur Startseite"
            className="flex items-center gap-4"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 98 98"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-black dark:text-white"
            >
              <rect
                x="0.171875"
                y="0.171875"
                width="47.2656"
                height="97.6562"
                rx="14.8438"
                fill="currentColor"
              />
              <rect
                x="50.5625"
                y="0.171875"
                width="47.2656"
                height="37.8906"
                rx="14.8438"
                fill="currentColor"
              />
              <rect
                x="50.5625"
                y="41.1875"
                width="47.2656"
                height="56.6406"
                rx="14.8438"
                fill="currentColor"
              />
            </svg>
            <span className="font-semibold">Blockplan</span>
          </Link>
          <nav
            aria-label="Benutzeraktionen"
            className="flex items-center gap-2"
          >
            <Unauthenticated>
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
            </Unauthenticated>
            <Authenticated>
              <ClerkUserButton />
            </Authenticated>
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
