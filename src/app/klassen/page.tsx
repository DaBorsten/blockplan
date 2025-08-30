"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, School, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useSetClass } from "@/store/useClassStore";
// AlertDialog removed in favor of unified Dialog like detail page
import { toast } from "sonner";
import { ROUTE_KLASSEN_BEITRETEN } from "@/constants/routes";

type ClassItem = {
  class_id: string;
  class_title: string;
};

type ClassStats = { class_id: string; members: number; weeks: number };

export default function ManageClass() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  // Leave dialog unified (like detail page)
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pendingLeaveClass, setPendingLeaveClass] = useState<ClassItem | null>(
    null,
  );
  const [leaveLoading, setLeaveLoading] = useState(false);
  // Invite management moved to details page

  const { user } = useUser();
  const router = useRouter();
  const setKlasse = useSetClass();
  const withParams = (url: string) => url; // no query params now

  const fetchStats = useCallback(
    async (classIds: string[], signal?: AbortSignal) => {
      setStatsLoading(true);
      try {
        const res = await fetch(`/api/class/stats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ class_ids: classIds }),
          signal,
        });
        if (signal?.aborted) return;
        if (!res.ok) {
          console.error("Fehler beim Abrufen der Klassenstatistiken");
          toast.error("Statistiken konnten nicht geladen werden");
          return;
        }
        const data = await res.json();
        setStats(data.data || []);
      } catch (error) {
        if (
          signal?.aborted ||
          (error instanceof Error && error.name === "AbortError")
        )
          return;
        console.error("Fehler beim Abrufen der Statistiken:", error);
        toast.error("Netzwerkfehler beim Laden der Statistiken");
      } finally {
        if (!signal?.aborted) {
          setStatsLoading(false);
        }
      }
    },
    [],
  );

  const fetchClasses = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/class/classes`, { signal });
        if (signal?.aborted) return;
        const data = await res.json();
        const result: ClassItem[] = data.data || [];
        setClasses(result);
        // After classes loaded, fetch stats
        if (result.length) {
          fetchStats(
            result.map((c) => c.class_id),
            signal,
          );
        } else {
          setStats([]);
        }
      } catch (error) {
        if (
          signal?.aborted ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          return; // silently ignore aborts
        }
        console.error("Fehler beim Laden der Klassen:", error);
        toast.error("Netzwerkfehler beim Laden der Klassen");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [fetchStats],
  );

  const [stats, setStats] = useState<ClassStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const statsMap = useMemo(() => {
    const m: Record<string, ClassStats> = {};
    for (const s of stats) m[s.class_id] = s;
    return m;
  }, [stats]);

  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

  // invites fetching removed (handled on details page)

  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    // Wrap call in void to avoid unhandled promise rejections
    void fetchClasses(controller.signal);
    return () => controller.abort();
  }, [user?.id, fetchClasses]);

  // edit moved to details page

  const handleEditSave = async () => {
    if (editId) {
      const res = await fetch("/api/class/className", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classID: editId, newClassName: editName }),
      });
      if (!res.ok) {
        toast.error("Fehler beim Umbenennen der Klasse");
        return;
      }
      toast.success("Klasse erfolgreich umbenannt");
      setEditId(null);
      setEditName("");
      if (user?.id) fetchClasses();
      setEditOpen(false);
    }
  };

  const handleCreateSave = async () => {
    if (!createName.trim() || !user?.id) return;

    try {
      setLoading(true);

      // create class
      const res = await fetch("/api/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class: createName }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Fehler beim Erstellen der Klasse");
        return;
      }

      const data = await res.json();
      const class_id =
        data?.class_id || data?.id || (data?.data && data.data.class_id);

      if (!class_id) {
        console.error("Kein class_id in Antwort:", data);
        toast.error("Unerwartete Serverantwort beim Erstellen der Klasse");
        return;
      }

      // owner membership now auto-created server-side

      // Optimistisch in Liste einfügen und direkt auswählen
      const newClasses = [
        { class_id, class_title: createName.trim() },
        ...classes,
      ];
      setClasses(newClasses);
      setKlasse(class_id);
      // Stats neu laden
      if (user?.id) fetchStats(newClasses.map((c) => c.class_id));
      setCreateOpen(false);
      setCreateName("");
      toast.success("Klasse erfolgreich erstellt und ausgewählt");
    } catch (err) {
      console.error("Fehler beim Erstellen der Klasse:", err);
      toast.error("Netzwerkfehler beim Erstellen der Klasse");
    } finally {
      setLoading(false);
    }
  };

  // invite handlers removed (handled on details page)

  // Optional: Delete/leave class can be wired here when an API exists.

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6">
      <div className="flex flex-row justify-between items-center mb-4 md:mb-8">
        <div className="hidden md:flex flex-col">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Klassen verwalten
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Verwalten Sie Ihre erstellten Klassen
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Button
            className="whitespace-nowrap"
            onClick={() => setCreateOpen(true)}
          >
            Klasse erstellen
          </Button>
          <Button
            variant="outline"
            className="whitespace-nowrap"
            onClick={() => router.push(withParams(ROUTE_KLASSEN_BEITRETEN))}
          >
            Klasse beitreten
          </Button>
        </div>
      </div>
      {loading ? (
        <div>Lade...</div>
      ) : classes.length === 0 ? (
        <div>Keine Klassen gefunden.</div>
      ) : (
        <ul className="grid gap-3">
          {classes.map((cls) => (
            <li key={cls.class_id} className="block">
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card/60 dark:bg-card border-border shadow-sm">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Link
                    href={`/klassen/${cls.class_id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center"
                      title={cls.class_title}
                      aria-hidden
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground border border-border dark:bg-sidebar-accent dark:text-sidebar-accent-foreground">
                        <School className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div
                        className="text-sm font-medium text-slate-900 dark:text-white truncate"
                        title={cls.class_title}
                      >
                        {cls.class_title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {statsLoading && !statsMap[cls.class_id] ? (
                          <span>Lädt…</span>
                        ) : (
                          (() => {
                            const st = statsMap[cls.class_id];
                            if (!st) return <span>-</span>;
                            return (
                              <span>
                                {plural(st.weeks, "Woche", "Wochen")} ·{" "}
                                {plural(st.members, "Mitglied", "Mitglieder")}
                              </span>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    title="Klasse verlassen"
                    onClick={() => {
                      setPendingLeaveClass(cls);
                      setLeaveOpen(true);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Invite Dialog moved to details page */}

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) {
            setEditId(null);
            setEditName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klasse umbenennen</DialogTitle>
            <DialogDescription>
              Bitte geben Sie einen neuen Namen für die Klasse ein.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Neuer Klassenname"
              autoFocus
            />
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              size="sm"
              className="cursor-pointer"
            >
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button
              onClick={handleEditSave}
              size="sm"
              className="cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Class Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateName("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Klasse erstellen</DialogTitle>
            <DialogDescription>
              Bitte geben Sie den Titel der Klasse ein.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Klassentitel"
              autoFocus
            />
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              size="sm"
              className="cursor-pointer"
            >
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateSave}
              size="sm"
              className="cursor-pointer"
              disabled={!createName.trim()}
            >
              <Check className="w-4 h-4" />
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unified leave dialog */}
      <Dialog
        open={leaveOpen}
        onOpenChange={(o) => {
          if (!o) {
            setPendingLeaveClass(null);
            setLeaveLoading(false);
          }
          setLeaveOpen(o);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klasse verlassen?</DialogTitle>
            <DialogDescription>
              {pendingLeaveClass ? (
                <>
                  Möchten Sie &quot;{pendingLeaveClass.class_title}&quot;
                  wirklich verlassen? Dieser Vorgang kann nicht rückgängig
                  gemacht werden.
                </>
              ) : (
                "Möchten Sie die Klasse wirklich verlassen?"
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => setLeaveOpen(false)}
              disabled={leaveLoading}
            >
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="cursor-pointer"
              disabled={leaveLoading || !pendingLeaveClass}
              onClick={async () => {
                if (!user?.id || !pendingLeaveClass) return;
                setLeaveLoading(true);
                try {
                  const params = new URLSearchParams({
                    class_id: pendingLeaveClass.class_id,
                    target_user_id: user.id,
                  });
                  const res = await fetch(
                    `/api/class/member?${params.toString()}`,
                    { method: "DELETE" },
                  );
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    toast.error(
                      data.error ||
                        `Fehler beim Verlassen (Status: ${res.status})`,
                    );
                    return;
                  }
                  toast.success(
                    `Klasse "${pendingLeaveClass.class_title}" erfolgreich verlassen`,
                  );
                  setLeaveOpen(false);
                  setPendingLeaveClass(null);
                  if (user?.id) fetchClasses();
                } catch (err) {
                  console.error(err);
                  toast.error("Netzwerkfehler beim Verlassen der Klasse");
                } finally {
                  setLeaveLoading(false);
                }
              }}
            >
              {leaveLoading ? "Bitte warten…" : "Verlassen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
