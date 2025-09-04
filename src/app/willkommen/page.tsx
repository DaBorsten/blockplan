"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTE_STUNDENPLAN } from "@/constants/routes";

export default function WelcomePage() {
  const { user } = useUser();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidNickname = nickname.trim().length > 0;

  const save = async () => {
    if (loading) return;
    const trimmed = nickname.trim();
    if (!user?.id) {
      toast.error("Du bist nicht angemeldet.");
      return;
    }
    if (trimmed.length === 0) {
      toast.error("Bitte gib einen Spitznamen ein.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Fehler beim Speichern des Spitznamens");
        return;
      }
      toast.success("Willkommen! Ihr Konto wurde erfolgreich initialisiert.");
      router.replace(ROUTE_STUNDENPLAN);
    } catch (error) {
      toast.error(
        "Fehler beim Speichern des Spitznamens.",
        error instanceof Error ? { description: error.message } : undefined,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6 max-w-lg">
      <h1 className="text-2xl font-semibold mb-2">Willkommen</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Bitte wähle einen Spitznamen, um deinen Account zu initialisieren.
      </p>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="flex-1">
          <label htmlFor="nickname" className="sr-only">
            Spitzname
          </label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Spitzname"
            maxLength={32}
            autoFocus
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading || !isValidNickname}>
          Konto erstellen
        </Button>
      </form>
      <div className="mt-6 text-sm text-muted-foreground">
        Du kannst dein Konto jederzeit über das Benutzermenü löschen.
      </div>
    </div>
  );
}
