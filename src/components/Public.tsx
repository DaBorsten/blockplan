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
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Zum Inhalt springen
      </a>
      <div className="min-h-dvh flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 md:px-8">
          <Link
            href="/"
            aria-label="Zur Startseite"
            className="flex items-center gap-3 group"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 98 98"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-brand transition-transform duration-200 group-hover:scale-105"
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
            <span className="font-semibold tracking-tight text-[15px]">Blockplan</span>
          </Link>
          <nav
            aria-label="Benutzeraktionen"
            className="flex items-center gap-2"
          >
            <Unauthenticated>
              <SignUpButton mode="modal" forceRedirectUrl={ROUTE_STUNDENPLAN}>
                <Button size="sm" type="button">
                  Registrieren
                </Button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl={ROUTE_STUNDENPLAN}>
                <Button variant="ghost" size="sm" type="button">
                  Anmelden
                </Button>
              </SignInButton>
            </Unauthenticated>
            <Authenticated>
              <ClerkUserButton />
            </Authenticated>
          </nav>
        </header>
        <main id="main" className="flex-1 flex flex-col">
          {children}
        </main>
        <footer className="px-6 py-6 md:px-8 md:py-8 text-center text-sm text-muted-foreground/70">
          <nav aria-label="Rechtliches" className="flex items-center justify-center gap-3 flex-wrap">
            {process.env.NEXT_PUBLIC_GITHUB_REPO && (
              <>
                <Link
                  href={process.env.NEXT_PUBLIC_GITHUB_REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Repository (öffnet in neuem Tab)"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub
                </Link>
                <span aria-hidden="true" className="text-border">·</span>
              </>
            )}
            <Link href="/datenschutzhinweis" className="hover:text-foreground transition-colors">
              Datenschutzhinweis
            </Link>
            <span aria-hidden="true" className="text-border">·</span>
            <Link href="/impressum" className="hover:text-foreground transition-colors">
              Impressum
            </Link>
          </nav>
        </footer>
      </div>
    </>
  );
}
