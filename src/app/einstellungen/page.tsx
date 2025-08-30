"use client";

import { useEffect, useState } from "react";
import { ModeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useUser();
  const [nickname, setNickname] = useState("");
  // Store the initially loaded nickname so we can disable the save button until a change occurs
  const [initialNickname, setInitialNickname] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch("/api/user/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          console.error("Fehler beim Laden der Benutzerdaten:", res.status);
          return;
        }
        const data = await res.json();
        if (!initialLoaded) {
          if (data?.data?.nickname) {
            setNickname(data.data.nickname);
            setInitialNickname(data.data.nickname);
          }
          setInitialLoaded(true);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error(
            "Netzwerkfehler beim Laden der Benutzerdaten:",
            error.message,
          );
        }
      }
    };
    run();
    return () => controller.abort();
  }, [user?.id, initialLoaded]);

  const save = async () => {
    if (!user?.id) return;
    const trimmed = nickname.trim();
    if (!trimmed) {
      toast.error("Bitte gib einen gültigen Nickname ein");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `Fehler beim Speichern (Status: ${res.status})`;
        toast.error(errorMessage);
      } else {
        toast.success("Erfolgreich gespeichert");
        setNickname(trimmed);
        setInitialNickname(trimmed);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Fehler beim Speichern:", error.message);
        toast.error("Netzwerkfehler beim Speichern");
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6 h-full w-full">
      <div className="mb-4 md:mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Einstellungen
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Webseite Einstellungen
        </p>
      </div>

      <div className="grid gap-6 max-w-xl">
        <section>
          <h3 className="text-lg font-medium mb-2">Profil</h3>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Spitzname"
              aria-label="Spitzname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={32}
            />
            <Button
              onClick={save}
              disabled={
                loading ||
                !nickname.trim() ||
                nickname.trim() === initialNickname.trim()
              }
              className="cursor-pointer"
            >
              Speichern
            </Button>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium mb-2">Darstellung</h3>
          <ModeToggle />
        </section>
      </div>
    </div>
  );
}
