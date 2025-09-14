"use client";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function RequireAuth() {
  const pathname = usePathname();
  return (
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
        <SignInButton mode="modal" fallbackRedirectUrl={pathname}>
          <Button variant="default" size="sm" type="button">
            Anmelden
          </Button>
        </SignInButton>
        <SignUpButton mode="modal" fallbackRedirectUrl={pathname}>
          <Button variant="secondary" size="sm" type="button">
            Registrieren
          </Button>
        </SignUpButton>
      </div>
    </div>
  );
}
