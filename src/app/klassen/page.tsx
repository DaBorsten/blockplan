"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { School, LogOut, SearchIcon } from "lucide-react";
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
import { useSetClass, useCurrentClass } from "@/store/useClassStore";

// AlertDialog removed in favor of unified Dialog like detail page
import { toast } from "sonner";
import { ROUTE_KLASSEN_BEITRETEN } from "@/constants/routes";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

type ClassItem = {
  class_id: string;
  class_title: string;
};

type ClassStats = { class_id: string; members: number; weeks: number };

export default function ManageClass() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
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

  const convexClasses = useQuery(api.classes.listClassesWithStats, {});
  const createClassMutation = useMutation(api.classes.createClass);
  const removeOrLeaveMutation = useMutation(api.classes.removeOrLeave);
  const meQuery = useQuery(api.users.me, {});
  const currentClassId = useCurrentClass();

  useEffect(() => {
    if (convexClasses === undefined) {
      setLoading(true);
      return;
    }
    setLoading(false);
    const mappedRaw = convexClasses as Array<{
      class_id: string;
      class_title: string;
      weeks?: number;
      members?: number;
    }>;
    const mapped: ClassItem[] = mappedRaw.map((c) => ({
      class_id: c.class_id,
      class_title: c.class_title,
    }));
    setClasses(mapped);
    // Directly map stats from the query result
    const statsList: ClassStats[] = mappedRaw.map((c) => ({
      class_id: c.class_id,
      weeks: c.weeks ?? 0,
      members: c.members ?? 0,
    }));
    // Replace local stats state (keeping existing shape)
    setStats(statsList);
  }, [convexClasses]);

  const [stats, setStats] = useState<ClassStats[]>([]);
  const [statsLoading] = useState(false);

  const [createLoading, setCreateLoading] = useState(false);

  const statsMap = useMemo(() => {
    const m: Record<string, ClassStats> = {};
    for (const s of stats) m[s.class_id] = s;
    return m;
  }, [stats]);

  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

  const handleCreateSave = async () => {
    if (!createName.trim() || !user?.id || createLoading) return;
    setCreateLoading(true);
    try {
      const trimmed = createName.trim();
      const result = await createClassMutation({ title: trimmed });
      setKlasse(result.class_id);
      setCreateOpen(false);
      setCreateName("");
      toast.success("Klasse erfolgreich erstellt");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Fehler beim Erstellen der Klasse",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // invite handlers removed (handled on details page)

  // Optional: Delete/leave class can be wired here when an API exists.

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6 h-full flex flex-col">
      <div className="flex flex-row justify-between items-center mb-4 md:mb-8 shrink-0">
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
            onClick={() => router.push(ROUTE_KLASSEN_BEITRETEN)}
          >
            Klasse beitreten
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-1 justify-center items-center">
          <Spinner />
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground flex items-center flex-col gap-2">
            <SearchIcon className="mr-2" aria-hidden />
            Keine Klassen gefunden
          </div>
        </div>
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
                        className="text-sm font-medium text-slate-900 dark:text-white flex-1 min-w-0 truncate"
                        title={cls.class_title}
                        aria-label={cls.class_title}
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
                    variant="destructive"
                    size="icon"
                    title={`Klasse ${cls.class_title} verlassen`}
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
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  if (!createLoading && createName.trim() && user?.id) {
                    handleCreateSave();
                  }
                }
              }}
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
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateSave}
              size="sm"
              className="cursor-pointer"
              disabled={!createName.trim()}
            >
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
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="cursor-pointer"
              disabled={leaveLoading || !pendingLeaveClass}
              onClick={async () => {
                if (!pendingLeaveClass || !meQuery?.id) return;
                setLeaveLoading(true);
                try {
                  const result = await removeOrLeaveMutation({
                    classId: pendingLeaveClass.class_id as Id<"classes">,
                    targetUserId: meQuery.id as Id<"users">,
                  });
                  if (currentClassId === pendingLeaveClass.class_id) {
                    setKlasse(null);
                  }
                  if (result?.deletedClass) {
                    toast.success(
                      `Klasse "${pendingLeaveClass.class_title}" gelöscht`,
                    );
                  } else {
                    toast.success(
                      `Klasse "${pendingLeaveClass.class_title}" verlassen`,
                    );
                  }
                  setLeaveOpen(false);
                  setPendingLeaveClass(null);
                  // live query will update list
                } catch (e) {
                  console.error(e);
                  toast.error(
                    e instanceof Error
                      ? e.message
                      : "Fehler beim Verlassen der Klasse",
                  );
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
