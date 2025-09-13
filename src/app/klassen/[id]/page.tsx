"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  X,
  Trash2,
  Copy as CopyIcon,
  Crown,
  Swords,
  User,
  Palette,
  Users,
} from "lucide-react";
import { TeacherColorsManager } from "@/components/TeacherColorsManager";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

type Member = {
  user_id: string;
  role: "owner" | "admin" | "member";
  nickname?: string | null;
};

type Invitation = {
  id: string;
  code: string;
  expiration_date: string;
  active: boolean;
  user_id: string;
  class_id: string;
  can_delete?: boolean;
};

export default function ClassMembersPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const classIdQuery = id || null;

  // Always invoke hooks to preserve order; pass a placeholder that will fail only if used.
  const membersData = useQuery(
    api.classes.listMembers,
    classIdQuery ? { classId: classIdQuery as Id<"classes"> } : "skip",
  );
  const classMeta = useQuery(
    api.classes.getClass,
    classIdQuery ? { classId: classIdQuery as Id<"classes"> } : "skip",
  );
  const members = membersData?.members || [];
  const currentRole = membersData?.currentRole || null;
  const membersLoading = membersData === undefined;
  const [classTitle, setClassTitle] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  type ExpiryPreset = "30m" | "1h" | "6h" | "12h" | "1d" | "7d" | "never";
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>("never");
  const [inviteLoading, setInviteLoading] = useState(false);
  // Invitations state now powered by Convex live query
  const invites = useQuery(
    api.invitations.listInvitations,
    classIdQuery ? { classId: classIdQuery as Id<"classes"> } : "skip",
  );
  const createInvitation = useMutation(api.invitations.createInvitation);
  const deleteInvitation = useMutation(api.invitations.deleteInvitation);
  // Weeks (Convex live)
  type Week = { id: string; title: string };
  const weeksRaw = useQuery(
    api.weeks.listWeeks,
    classIdQuery ? { classId: classIdQuery as Id<"classes"> } : "skip",
  );
  const weeksLoading = weeksRaw === undefined && !!classIdQuery;
  const weeks: Week[] = useMemo(() => weeksRaw || [], [weeksRaw]);
  const [weekEditId, setWeekEditId] = useState<string | null>(null);
  const [weekEditName, setWeekEditName] = useState("");
  const [weekEditOpen, setWeekEditOpen] = useState(false);

  const NEVER_EXPIRES_DATE = "9999-12-31T23:59:59.000Z";

  // Sync class title from live query
  useEffect(() => {
    if (classMeta?.title) setClassTitle(classMeta.title);
  }, [classMeta?.title]);

  const renameClass = useMutation(api.classes.renameClass);
  const deleteClass = useMutation(api.classes.deleteClass);
  const updateMemberRole = useMutation(api.classes.updateMemberRole);
  const removeOrLeaveMutation = useMutation(api.classes.removeOrLeave);

  // Invites spinner mimic: show spinner until first query result
  const invitesLoading = inviteOpen && invites === undefined;

  const handleEditSave = async () => {
    if (!classIdQuery) return;
    try {
      await renameClass({
        classId: classIdQuery as Id<"classes">,
        newTitle: editName,
      });
      setEditOpen(false);
      setClassTitle(editName);
      toast.success("Klasse erfolgreich umbenannt");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Umbenennen");
    }
  };

  const handleCreateInvite = async () => {
    if (!classIdQuery) return;
    try {
      setInviteLoading(true);
      let expirationISO: string | undefined;
      if (expiryPreset !== "never") {
        const now = Date.now();
        const addMs: Record<Exclude<ExpiryPreset, "never">, number> = {
          "30m": 30 * 60 * 1000,
          "1h": 60 * 60 * 1000,
          "6h": 6 * 60 * 60 * 1000,
          "12h": 12 * 60 * 60 * 1000,
          "1d": 24 * 60 * 60 * 1000,
          "7d": 7 * 24 * 60 * 60 * 1000,
        };
        expirationISO = new Date(
          now + addMs[expiryPreset as Exclude<ExpiryPreset, "never">],
        ).toISOString();
      }
      await createInvitation({
        classId: classIdQuery as Id<"classes">,
        expires: expiryPreset !== "never",
        expirationISO,
      });
      toast.success("Einladung erstellt");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Erstellen");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    if (!classIdQuery) return;
    try {
      await deleteInvitation({ invitationId: inviteId as Id<"invitations"> });
      toast.success("Einladung gelöscht");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Löschen");
    }
  };

  const copyInviteLink = async (code: string) => {
    const origin =
      typeof window !== "undefined" && window.location
        ? window.location.origin
        : "";
    const url = `${origin}/klassen/beitreten?code=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link kopiert");
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        const ok = document.execCommand("copy");
        if (ok) {
          toast.success("Link kopiert");
        } else {
          toast.error("Kopieren fehlgeschlagen");
        }
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const canRemove = (target: Member) => {
    if (!currentRole) return false;
    if (user?.id === target.user_id) return true; // self leave allowed except owner, handled on server
    if (currentRole === "owner") return target.role !== "owner";
    if (currentRole === "admin") return target.role === "member";
    return false;
  };

  const removeOrLeave = async (target: Member) => {
    if (!classIdQuery) return;
    try {
      const res = await removeOrLeaveMutation({
        classId: classIdQuery as Id<"classes">,
        targetUserId: target.user_id as Id<"users">,
      });
      if (user?.id === target.user_id) {
        if (res?.deletedClass) {
          toast.success("Klasse gelöscht");
          router.replace("/klassen");
        } else {
          router.replace("/");
        }
        return;
      }
      toast.success("Aktion erfolgreich");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Aktion fehlgeschlagen");
    }
  };

  const changeRole = async (target: Member, role: "admin" | "member") => {
    if (!classIdQuery) return;
    try {
      await updateMemberRole({
        classId: classIdQuery as Id<"classes">,
        targetUserId: target.user_id as unknown as Id<"users">,
        role,
      });
      toast.success("Rolle erfolgreich geändert");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Rollenänderung fehlgeschlagen",
      );
    }
  };

  // promote/demote helpers replaced by unified dropdown logic

  const [activeTab, setActiveTab] = useState<
    "wochen" | "mitglieder" | "farben"
  >("mitglieder");

  // (Removed manual fetch logic – Convex liefert Live-Daten)

  const groupedWeeks = useMemo(() => {
    const map: Record<string, Week[]> = {};
    for (const w of weeks) {
      const title = w.title || "";
      const idx = title.lastIndexOf("_");
      const key = idx > 0 ? title.slice(0, idx) : title;
      (map[key] ||= []).push(w);
    }
    const sections: Array<[string, Week[]]> = Object.entries(map);
    const extractionCache = new Map<string, { grade: number; kw: number }>();
    const getExtracted = (s: string) => {
      if (!extractionCache.has(s)) {
        const gradeMatch = s.match(/^(\d{1,2})/);
        const kwMatch = s.match(/KW\s*(\d{1,3})/i) || s.match(/KW(\d{1,3})/i);
        extractionCache.set(s, {
          grade: gradeMatch ? parseInt(gradeMatch[1], 10) : -Infinity,
          kw: kwMatch ? parseInt(kwMatch[1], 10) : -Infinity,
        });
      }
      return extractionCache.get(s)!;
    };
    sections.sort((a, b) => {
      const ea = getExtracted(a[0]);
      const eb = getExtracted(b[0]);
      const ga = ea.grade;
      const gb = eb.grade;
      if (ga !== gb) return gb - ga;
      const kwa = ea.kw;
      const kwb = eb.kw;
      if (kwa !== kwb) return kwb - kwa;
      return a[0].localeCompare(b[0]);
    });
    for (const [, items] of sections) {
      items.sort((x, y) => {
        const mx = x.title.match(/_(\d+)$/);
        const my = y.title.match(/_(\d+)$/);
        const nx = mx ? parseInt(mx[1], 10) : -Infinity;
        const ny = my ? parseInt(my[1], 10) : -Infinity;
        return ny - nx;
      });
    }
    return sections;
  }, [weeks]);

  // Confirmation dialog for remove/leave actions (top-level in component scope)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<Member | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Week delete confirmation dialog state
  const [weekDeleteOpen, setWeekDeleteOpen] = useState(false);
  const [pendingWeek, setPendingWeek] = useState<Week | null>(null);
  const [weekDeleteLoading, setWeekDeleteLoading] = useState(false);

  const openConfirm = (target: Member) => {
    setPendingTarget(target);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingTarget) return;
    setConfirmLoading(true);
    try {
      await removeOrLeave(pendingTarget);
      setConfirmOpen(false);
      setPendingTarget(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleWeekEdit = (wid: string, title: string) => {
    setWeekEditId(wid);
    setWeekEditName(title);
    setWeekEditOpen(true);
  };

  const renameWeekMutation = useMutation(api.weeks.renameWeek);
  const deleteWeekMutation = useMutation(api.weeks.deleteWeek);

  const saveWeekEdit = async () => {
    if (!weekEditId) return;
    try {
      await renameWeekMutation({
        weekId: weekEditId as Id<"weeks">,
        newTitle: weekEditName,
      });
      setWeekEditOpen(false);
      setWeekEditId(null);
      setWeekEditName("");
      toast.success("Woche erfolgreich umbenannt");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Fehler beim Umbenennen der Woche",
      );
    }
  };

  const deleteWeek = async (wid: string) => {
    try {
      await deleteWeekMutation({ weekId: wid as Id<"weeks"> });
      toast.success("Woche erfolgreich gelöscht");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Fehler beim Löschen der Woche",
      );
    }
  };

  const openWeekDelete = (week: Week) => {
    setPendingWeek(week);
    setWeekDeleteOpen(true);
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0">
      <div className="sticky top-0 z-20 pb-2 px-4 md:px-6 border-b flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-2xl font-semibold truncate">
              Klasse{" "}
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md tracking-tight">
                {classTitle || ""}
              </span>
            </h1>
            {(currentRole === "owner" || currentRole === "admin") && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    setEditName(classTitle || "");
                    setEditOpen(true);
                  }}
                  aria-label="Klasse umbenennen"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </Button>
              </div>
            )}
          </div>
          {(currentRole === "owner" ||
            currentRole === "admin" ||
            currentRole === "member") && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setInviteOpen(true)}
                variant="outline"
                size="default"
              >
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">Einladungen</span>
              </Button>
              {currentRole === "owner" && (
                <Button
                  variant="destructive"
                  size="default"
                  className="shrink-0"
                  onClick={() => setDeleteOpen(true)}
                  aria-label="Klasse löschen"
                  title="Klasse löschen"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden md:inline">Löschen</span>
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 p-1 -m-1 overflow-x-auto">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="w-full"
          >
            <TabsList className="overflow-x-auto flex max-w-full">
              <TabsTrigger
                value="mitglieder"
                className="flex items-center gap-1"
              >
                Mitglieder{membersLoading ? "" : ` (${members.length})`}
              </TabsTrigger>
              <TabsTrigger value="wochen" className="flex items-center gap-1">
                Wochen{weeksLoading ? "" : ` (${weeks.length})`}
              </TabsTrigger>
              <TabsTrigger value="farben" className="flex items-center gap-1">
                Farben <Palette className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 p-4 md:p-6">
        {activeTab === "mitglieder" && (
          <>
            {membersLoading ? (
              <div className="flex flex-1 justify-center items-center h-full">
                <Spinner />
              </div>
            ) : (
              <ul className="divide-y rounded-md border">
                {members.map((m: Member) => (
                  <li
                    key={m.user_id}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs">
                        {(m.nickname || m.user_id).substring(0, 2)}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">
                          {m.nickname || m.user_id}
                        </div>
                        <div className="text-muted-foreground text-xs flex items-center gap-1">
                          {m.role === "owner" && (
                            <>
                              <Crown className="w-3.5 h-3.5" />
                              <span>Besitzer</span>
                            </>
                          )}
                          {m.role === "admin" && (
                            <>
                              <Swords className="w-3.5 h-3.5" />
                              <span>Admin</span>
                            </>
                          )}
                          {m.role === "member" && (
                            <>
                              <User className="w-3.5 h-3.5" />
                              <span>Mitglied</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Role selection dropdown */}
                      {currentRole === "owner" && m.role !== "owner" && (
                        <Select
                          value={m.role === "admin" ? "admin" : "member"}
                          onValueChange={(val) => {
                            if (val === m.role) return;
                            changeRole(m, val as "admin" | "member");
                          }}
                        >
                          <SelectTrigger className="h-8 w-[140px] text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Mitglied</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {canRemove(m) && (
                        <Button
                          variant="destructive"
                          size="default"
                          onClick={() => openConfirm(m)}
                        >
                          {user?.id === m.user_id
                            ? "Klasse verlassen"
                            : "Entfernen"}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {activeTab === "wochen" && (
          <div className="flex flex-1 h-full flex-col">
            {weeksLoading ? (
              <div className="flex flex-1 justify-center items-center h-full">
                <Spinner />
              </div>
            ) : weeks.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Keine Wochen gefunden.
              </div>
            ) : (
              <div className="space-y-6">
                {groupedWeeks.map(([section, items]) => (
                  <section key={section}>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {section}
                    </h3>
                    <ul className="grid gap-3">
                      {items.map((week) => (
                        <li key={week.id} className="block">
                          <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card/60 border-border shadow-sm">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className="w-10 h-10 rounded-md flex items-center justify-center font-semibold text-sm"
                                aria-hidden
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground border border-border">
                                  {week.title ? week.title.split(" ")[0] : "W"}
                                </div>
                              </div>
                              <div className="min-w-0">
                                <div
                                  className="text-sm font-medium truncate"
                                  title={week.title}
                                >
                                  {week.title}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() =>
                                  handleWeekEdit(week.id, week.title)
                                }
                                size="sm"
                                className="p-2 rounded-md w-9 h-9 md:w-auto md:h-auto md:px-3 cursor-pointer"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                                <span className="hidden md:inline">
                                  Bearbeiten
                                </span>
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => openWeekDelete(week)}
                                size="sm"
                                className="p-2 rounded-md w-9 h-9 md:w-auto md:h-auto md:px-3 cursor-pointer"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                <span className="hidden md:inline">
                                  Löschen
                                </span>
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "farben" && id && (
          <TeacherColorsManager classId={id as string} />
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
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
              placeholder="Neuer Name"
            />
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button onClick={handleEditSave}>
              <Check className="w-4 h-4" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Week delete confirmation dialog */}
      <Dialog
        open={weekDeleteOpen}
        onOpenChange={(o) => {
          setWeekDeleteOpen(o);
          if (!o) {
            setPendingWeek(null);
            setWeekDeleteLoading(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Woche löschen?</DialogTitle>
            <DialogDescription>
              Diese Aktion löscht die Woche{" "}
              <span className="font-medium">
                „{pendingWeek?.title || "(ohne Titel)"}“
              </span>{" "}
              dauerhaft. Fortfahren?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekDeleteOpen(false)}
              className="cursor-pointer"
              disabled={weekDeleteLoading}
            >
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="cursor-pointer"
              disabled={weekDeleteLoading || !pendingWeek}
              onClick={async () => {
                if (!pendingWeek) return;
                try {
                  setWeekDeleteLoading(true);
                  await deleteWeek(pendingWeek.id);
                  setWeekDeleteOpen(false);
                  setPendingWeek(null);
                } finally {
                  setWeekDeleteLoading(false);
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              {weekDeleteLoading ? "Bitte warten…" : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Einladungslinks verwalten</DialogTitle>
            <DialogDescription>
              Erstellen Sie Einladungslinks und sehen Sie bestehende.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex flex-row gap-2 flex-1 min-w-0 items-end w-full">
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <p className="font-medium">Ablaufzeit</p>
                <Select
                  value={expiryPreset}
                  onValueChange={(v: ExpiryPreset) => setExpiryPreset(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ablauf" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30m">30 Minuten</SelectItem>
                    <SelectItem value="1h">1 Stunde</SelectItem>
                    <SelectItem value="6h">6 Stunden</SelectItem>
                    <SelectItem value="12h">12 Stunden</SelectItem>
                    <SelectItem value="1d">1 Tag</SelectItem>
                    <SelectItem value="7d">7 Tage</SelectItem>
                    <SelectItem value="never">Nie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateInvite}
                disabled={inviteLoading}
                size="sm"
                className="cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Erstellen
              </Button>
            </div>
            <div className="border rounded-md divide-y flex-1 overflow-y-auto min-h-0">
              {invitesLoading ? (
                <div className="px-3 py-4 flex justify-center">
                  <Spinner />
                </div>
              ) : invites && invites.length > 0 ? (
                invites.map((inv: Invitation) => {
                  const isPermanent =
                    inv.expiration_date === NEVER_EXPIRES_DATE;
                  const expirationTs = isPermanent
                    ? Infinity
                    : new Date(inv.expiration_date).getTime();
                  const now = Date.now();
                  const expired = !isPermanent && expirationTs < now;
                  const expText = isPermanent
                    ? "Kein Ablauf"
                    : new Date(inv.expiration_date).toLocaleString();
                  const expColor = expired
                    ? "text-amber-500"
                    : "text-emerald-500"; // orange for expired, green for valid
                  const ariaLabel = isPermanent
                    ? "Einladung läuft nicht ab"
                    : expired
                      ? `Einladung abgelaufen am ${expText}`
                      : `Einladung gültig bis ${expText}`;
                  return (
                    <div
                      key={inv.id}
                      className="px-3 py-2 flex items-center justify-between text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-xs break-all">
                          {inv.code}
                        </span>
                        <span
                          className={`${expColor} text-[12px]`}
                          aria-label={ariaLabel}
                        >
                          {expText}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                          onClick={() => copyInviteLink(inv.code)}
                          title="Link kopieren"
                          aria-label="Link kopieren"
                        >
                          <CopyIcon className="w-4 h-4" />
                        </Button>
                        {inv.can_delete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer"
                            onClick={() => handleDeleteInvite(inv.id)}
                            title="Löschen"
                            aria-label="Einladung löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Keine Einladungen vorhanden.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klasse löschen?</DialogTitle>
            <DialogDescription>
              Diese Aktion löscht die Klasse dauerhaft inklusive aller Wochen,
              Farben und Stundenplandaten. Fortfahren?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(false)}
              className="cursor-pointer"
            >
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="cursor-pointer"
              onClick={async () => {
                if (!classIdQuery) return;
                try {
                  await deleteClass({ classId: classIdQuery as Id<"classes"> });
                  toast.success("Klasse gelöscht");
                  router.replace("/klassen");
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : "Löschen fehlgeschlagen",
                  );
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Confirmation dialog for remove / leave actions */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => {
          if (!o) {
            setPendingTarget(null);
          }
          setConfirmOpen(o);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user?.id === pendingTarget?.user_id
                ? "Klasse verlassen?"
                : "Mitglied entfernen?"}
            </DialogTitle>
            <DialogDescription>
              {user?.id === pendingTarget?.user_id
                ? "Bist du sicher, dass du die Klasse verlassen möchtest? Du kannst über einen neuen Invite wieder beitreten."
                : "Bist du sicher, dass dieses Mitglied entfernt werden soll?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setPendingTarget(null);
              }}
              size="sm"
              className="cursor-pointer"
              disabled={confirmLoading}
            >
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button
              onClick={handleConfirm}
              variant="destructive"
              size="sm"
              className="cursor-pointer"
              disabled={confirmLoading}
            >
              {confirmLoading
                ? "Bitte warten…"
                : user?.id === pendingTarget?.user_id
                  ? "Verlassen"
                  : "Entfernen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={weekEditOpen}
        onOpenChange={(o) => {
          setWeekEditOpen(o);
          if (!o) {
            setWeekEditId(null);
            setWeekEditName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Woche umbenennen</DialogTitle>
            <DialogDescription>
              Bitte geben Sie einen neuen Namen für die Woche ein.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              value={weekEditName}
              onChange={(e) => setWeekEditName(e.target.value)}
              placeholder="Neuer Wochenname"
              autoFocus
            />
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setWeekEditOpen(false)}
              size="sm"
              className="cursor-pointer"
            >
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button onClick={saveWeekEdit} size="sm" className="cursor-pointer">
              <Check className="w-4 h-4" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
