"use client";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function RequireAuth() {
  return (
    <div className="min-h-screen flex flex-col">
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
          <SignInButton mode="modal">
            <Button variant="default" size="lg" type="button">
              Anmelden
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="secondary" size="lg" type="button">
              Registrieren
            </Button>
          </SignUpButton>
        </div>
      </div>

      <footer className="p-4 md:p-6 text-center text-sm text-muted-foreground">
        <Link href="/datenschutzhinweis">Datenschutzhinweis</Link>
        <span> | </span>
        <Link href="/impressum">Impressum</Link>
      </footer>
    </div>
  );
}
