"use client";

import { useEffect, useMemo, useState } from "react";
import { ModeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useUser();
  const [nickname, setNickname] = useState("");
  // Store the initially loaded nickname so we can disable the save button until a change occurs
  const [initialNickname, setInitialNickname] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [previousUserId, setPreviousUserId] = useState<string | undefined>();

  const NO_ARGS = useMemo(() => ({}) as const, []);
  const me = useQuery(api.users.me, user?.id ? NO_ARGS : "skip");
  const initUser = useMutation(api.users.initUser);

  useEffect(() => {
    if (!initialLoaded && me !== undefined) {
      if (me?.nickname) {
        setNickname(me.nickname);
        setInitialNickname(me.nickname);
      }
      setInitialLoaded(true);
    }
  }, [me, initialLoaded]);

  useEffect(() => {
    if (user?.id !== previousUserId) {
      setInitialLoaded(false);
      setInitialNickname("");
      setPreviousUserId(user?.id);
    }
  }, [previousUserId, user?.id]);

  const save = async () => {
    if (!user?.id) return;
    const trimmed = nickname.trim();
    if (!trimmed) {
      toast.error("Bitte gib einen gültigen Nickname ein");
      return;
    }
    setLoading(true);
    try {
      await initUser({ nickname: trimmed });
      toast.success("Erfolgreich gespeichert");
      setNickname(trimmed);
      setInitialNickname(trimmed);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler";
      console.error("Fehler beim Speichern:", message);
      toast.error(message || "Fehler beim Speichern");
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
