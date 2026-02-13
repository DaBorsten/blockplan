"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { School, LogOut, SearchIcon, Calendar, Users } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
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
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 shrink-0">
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Klassen
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Verwalten Sie Ihre Klassen und treten Sie neuen bei
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1 md:flex-none"
            onClick={() => setCreateOpen(true)}
          >
            Klasse erstellen
          </Button>
          <Button
            variant="outline"
            className="flex-1 md:flex-none"
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
        <ul className="grid grid-cols-1 gap-4 min-w-0 pb-4 md:pb-6">
          {classes.map((cls) => (
            <li key={cls.class_id} className="group min-w-0">
              <Link
                href={`/klassen/${cls.class_id}`}
                className="flex w-full min-w-0 max-w-full items-center gap-4 p-4 rounded-xl border bg-card hover:bg-card-foreground/5 transition-colors relative overflow-hidden"
              >                
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted ring-1 ring-border">
                  <School className="h-6 w-6 text-foreground" />
                </div>

                <div className="relative flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate mb-2" title={cls.class_title}>
                    {cls.class_title}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {statsLoading && !statsMap[cls.class_id] ? (
                      <span className="text-xs text-muted-foreground animate-pulse">Lädt…</span>
                    ) : (
                      (() => {
                        const st = statsMap[cls.class_id];
                        if (!st) return <span className="text-xs text-muted-foreground">-</span>;
                        return (
                          <>
                            <Badge className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              <Calendar className="h-3 w-3" />
                              {st.weeks} {st.weeks === 1 ? "Woche" : "Wochen"}
                            </Badge>
                            <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300/90">
                              <Users className="h-3 w-3" />
                              {st.members} {st.members === 1 ? "Mitglied" : "Mitglieder"}
                            </Badge>
                          </>
                        );
                      })()
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="relative shrink-0 bg-destructive/10 hover:bg-destructive/20! cursor-pointer"
                  title={`Klasse ${cls.class_title} verlassen`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPendingLeaveClass(cls);
                    setLeaveOpen(true);
                  }}
                  asChild={false}
                >
                  <LogOut className="h-4 w-4 text-destructive" />
                </Button>
              </Link>
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
