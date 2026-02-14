"use client";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function RequireAuth() {
  const githubRepo = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "";

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="space-y-2 max-w-md px-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Anmeldung erforderlich
          </h1>
          <p className="text-sm text-muted-foreground">
            Bitte melde dich an oder registriere dich, um auf diese Seite
            zuzugreifen.
          </p>
        </div>
        <div className="flex gap-3">
          <SignUpButton mode="modal">
            <Button variant="secondary" size="lg" type="button">
              Registrieren
            </Button>
          </SignUpButton>
          <SignInButton mode="modal">
            <Button variant="default" size="lg" type="button">
              Anmelden
            </Button>
          </SignInButton>
        </div>
      </div>

      <footer className="p-4 md:p-6 text-center text-sm text-muted-foreground">
        {githubRepo && (
          <>
            <Link
              href={{ pathname: githubRepo }}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository (öffnet in neuem Tab)"
            >
              GitHub
            </Link>
            <span> | </span>
          </>
        )}
        <Link href="/datenschutzhinweis">Datenschutzhinweis</Link>
        <span> | </span>
        <Link href="/impressum">Impressum</Link>
      </footer>
    </div>
  );
}
