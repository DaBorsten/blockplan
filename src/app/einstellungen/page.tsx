"use client";

import { useEffect, useMemo, useState } from "react";
import { ModeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  useAutoLatestWeek,
  useSetAutoLatestWeek,
  useShowSubjectColors,
  useSetShowSubjectColors,
} from "@/hooks/usePreferences";

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

  const trimmedNickname = nickname.trim();
  const trimmedInitial = initialNickname.trim();
  const hasLoaded = me !== undefined;
  const baseline = initialLoaded
    ? trimmedInitial
    : (me?.nickname?.trim() ?? "");
  const isDirty =
    hasLoaded && trimmedNickname.length > 0 && trimmedNickname !== baseline;
  const canSave = isDirty && !loading;
  // Preferences
  const autoLatestWeek = useAutoLatestWeek();
  const setAutoLatestWeek = useSetAutoLatestWeek();
  const showSubjectColors = useShowSubjectColors();
  const setShowSubjectColors = useSetShowSubjectColors();

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6 h-full w-full flex flex-col">
      <div className="mb-6 md:mb-10">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Einstellungen
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-prose">
          Passen Sie Ihr Profil und die Darstellung der Anwendung an.
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
              if (!canSave) return;
              void save();
            }}
            className="flex flex-col gap-4"
          >
            <CardContent>
              <div className="space-y-2">
                <Input
                  placeholder="Spitzname"
                  aria-label="Spitzname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={32}
                  className="w-full max-w-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Maximal 32 Zeichen. Wird in Klassen angezeigt.
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="submit"
                disabled={!canSave}
                className="disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed"
              >
                {loading ? "Speichert…" : "Speichern"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Darstellung</CardTitle>
            <CardDescription>
              Helles oder dunkles Design wählen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModeToggle />
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Wochen-Auswahl</CardTitle>
            <CardDescription>
              Automatisch zur neuesten Woche wechseln.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground max-w-prose">
                  In der Stundenplan-Ansicht wird beim Neuladen automatisch die neueste Woche ausgewählt.
                </div>
              <Switch
                checked={autoLatestWeek}
                onCheckedChange={(val) => setAutoLatestWeek(!!val)}
                aria-label="Automatisch neueste Woche auswählen"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Fächerspezifische Farben</CardTitle>
            <CardDescription>
              Farbstreifen für Fächer bei Stunden im Stundenplan anzeigen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground max-w-prose">
                  Wenn aktiviert, bekommen Stundenplan-Einträge einen Streifen mit der konfigurierten Fächerfarbe für den jeweiligen Lehrer.
                </div>
              <Switch
                checked={showSubjectColors}
                onCheckedChange={(val) => setShowSubjectColors(!!val)}
                aria-label="Fächerspezifische Farben anzeigen"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
