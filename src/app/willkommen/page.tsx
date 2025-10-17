"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTE_STUNDENPLAN } from "@/constants/routes";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function WelcomePage() {
  const { user } = useUser();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const initUser = useMutation(api.users.initUser);

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
      router.replace(ROUTE_STUNDENPLAN);
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
    <div className="px-4 md:px-6 pb-4 md:pb-6 h-full w-full flex flex-col">
      <div className="mb-6 md:mb-10">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Willkommen
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-prose">
          Bitte wähle einen Anzeigename, um deinen Account zu finalisieren.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-5xl w-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Dein öffentlicher Anzeigename.</CardDescription>
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
                  Du kannst dein Konto jederzeit über das Benutzermenü löschen.
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
  );
}
