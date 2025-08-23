"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const { user } = useUser();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!user?.id || !nickname.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, nickname }),
      });
      if (!res.ok) {
        // naive error handling
        alert("Fehler beim Speichern des Nicknames");
        return;
      }
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6 max-w-lg">
      <h1 className="text-2xl font-semibold mb-2">Willkommen</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Bitte wähle einen Nickname, um deinen Account zu initialisieren.
      </p>
      <div className="flex items-center gap-2">
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Nickname"
          maxLength={32}
        />
        <Button onClick={save} disabled={loading || !nickname.trim()} className="cursor-pointer">
          User initialisieren
        </Button>
      </div>
      <div className="mt-6 text-sm text-muted-foreground">
        Du kannst dein Konto jederzeit über das Benutzer-Menü löschen.
      </div>
    </div>
  );
}
