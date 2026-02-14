"use client";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Authenticated, Unauthenticated, useMutation } from "convex/react";
import { toast } from "sonner";
import { ClerkUserButton } from "./ClerkUserButton";

export function FinalizeProfile() {
  const { user } = useUser();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const initUser = useMutation(api.users.initUser);
  const githubRepo = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "";

  const isValidNickname = nickname.trim().length > 0;

  const save = async () => {
    if (loading) return;
    const trimmed = nickname.trim();
    if (!user?.id) {
      toast.error("Du bist nicht angemeldet.");
      return;
    }
    if (trimmed.length === 0) {
      toast.error("Bitte gib einen Anzeigename ein.");
      return;
    }
    setLoading(true);
    try {
      await initUser({ nickname: trimmed });
      toast.success("Willkommen! Dein Konto wurde initialisiert.");
      /* router.replace(redirectTo); */
    } catch (error) {
      toast.error(
        "Fehler beim Speichern des Anzeigenamens.",
        error instanceof Error ? { description: error.message } : undefined,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
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
        <nav aria-label="Benutzeraktionen" className="flex items-center gap-2">
          <Unauthenticated>
            <SignUpButton mode="modal">
              <Button size="sm" type="button">
                Registrieren
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
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

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex gap-3">
          <Card className="h-full">
            <CardHeader className="gap-4">
              <CardTitle className="text-center text-2xl">Willkommen</CardTitle>
              <CardDescription>
                Bitte wähle einen Anzeigename, um deinen Account zu
                finalisieren.
              </CardDescription>
            </CardHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
              className="flex flex-col gap-4"
            >
              <CardContent>
                <div className="space-y-2">
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Anzeigename"
                    maxLength={32}
                    autoFocus
                    disabled={loading}
                    className="w-full max-w-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximal 32 Zeichen. Wird in Klassen angezeigt.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Du kannst dein Konto jederzeit über das Benutzermenü
                    löschen.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit" disabled={loading || !isValidNickname}>
                  Festlegen
                </Button>
              </CardFooter>
            </form>
          </Card>
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
