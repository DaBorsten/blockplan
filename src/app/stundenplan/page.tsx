"use client";

import { GroupSelection } from "@/components/GroupSelection";
import { WeekSelectionCombobox } from "@/components/WeekSelectionCombobox";
import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api.js";
import { Timetable } from "@/components/Timetable";
import { NotesActionsDropdown } from "@/components/NotesActionsDropdown";
import { ModeLockButton } from "@/components/ModeLockButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NoteItem } from "@/components/NoteItem";
import { Lesson } from "@/types/timetableData";
import { toast } from "sonner";
import { useClassStore } from "@/store/useClassStore";
import { useAutoLatestWeek } from "@/store/usePreferencesStore";
import { useCurrentWeek, useSetWeek } from "@/store/useWeekStore";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

type NoteType = "homework" | "tests" | "exams" | "other";

interface NotesTabContentProps {
  type: NoteType;
  activeNotes: { id: string; text: string }[];
  archivedNotes: { id: string; text: string }[];
  onAddNote: (type: NoteType) => void;
  onToggleArchive: (id: string, currentArchived: boolean) => void;
  onNoteChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

function NotesTabContent({
  type,
  activeNotes,
  archivedNotes,
  onAddNote,
  onToggleArchive,
  onNoteChange,
  onDelete,
}: NotesTabContentProps) {
  return (
    <TabsContent value={type} className="mt-4 flex-1 min-h-0 flex flex-col">
      <Accordion
        type="single"
        collapsible
        defaultValue={`${type}-active`}
        className="w-full flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <AccordionItem
          value={`${type}-active`}
          className="data-[state=open]:flex-1 data-[state=open]:min-h-0 flex flex-col [&>[data-slot=accordion-content][data-state=open]]:flex-1 [&>[data-slot=accordion-content][data-state=open]]:flex [&>[data-slot=accordion-content][data-state=open]]:flex-col [&>[data-slot=accordion-content][data-state=open]]:min-h-0"
        >
          <AccordionTrigger>Aktiv</AccordionTrigger>
          <AccordionContent className="pb-0! flex-1 min-h-0">
            <div className="flex flex-col gap-2 h-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-center flex-none"
                onClick={() => onAddNote(type)}
              >
                Neue Notiz hinzufügen
              </Button>
              <ScrollArea className="flex-1 h-0 pr-1">
                <ul className="space-y-2">
                  {activeNotes.map((item) => (
                    <NoteItem
                      key={item.id}
                      item={item}
                      isActive={true}
                      onToggle={() => onToggleArchive(item.id, false)}
                      onChange={(text) => onNoteChange(item.id, text)}
                      onDelete={() => onDelete(item.id)}
                    />
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem
          value={`${type}-archived`}
          className="data-[state=open]:flex-1 data-[state=open]:min-h-0 flex flex-col [&>[data-slot=accordion-content][data-state=open]]:flex-1 [&>[data-slot=accordion-content][data-state=open]]:flex [&>[data-slot=accordion-content][data-state=open]]:flex-col [&>[data-slot=accordion-content][data-state=open]]:min-h-0"
        >
          <AccordionTrigger>Archiviert</AccordionTrigger>
          <AccordionContent className="pb-0! flex-1 min-h-0">
            <ScrollArea className="h-full pr-1">
              <ul className="space-y-2">
                {archivedNotes.map((item) => (
                  <NoteItem
                    key={item.id}
                    item={item}
                    isActive={false}
                    onToggle={() => onToggleArchive(item.id, true)}
                    onDelete={() => onDelete(item.id)}
                  />
                ))}
                {archivedNotes.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Noch keine archivierten Notizen.
                  </p>
                )}
              </ul>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </TabsContent>
  );
}

export default function TimetablePage() {
  const [activeClickedLesson, setActiveClickedLesson] = useState<Lesson | null>(
    null,
  );
  const [activeNotes, setActiveNotes] = useState<string | null>(null);
  const [isEditNotesModalOpen, setIsEditNotesModalOpen] = useState(false);
  const [isEditClassNotesModalOpen, setIsEditClassNotesModalOpen] =
    useState(false);
  const lastLessonIdRef = useRef<string | null>(null);

  const { classId } = useClassStore();
  const autoLatestWeek = useAutoLatestWeek();
  const currentWeekId = useCurrentWeek();
  const setWeekId = useSetWeek();

  const initialAppliedRef = useRef(false);
  const weeksForClass = useQuery(
    api.weeks.listWeeks,
    classId ? ({ classId } as { classId: Id<"classes"> }) : "skip",
  );
  useEffect(() => {
    if (initialAppliedRef.current) return;
    if (!autoLatestWeek) return;
    if (!classId) return;
    if (weeksForClass === undefined) return;
    const latest = weeksForClass
      .slice()
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0];
    const latestId = latest?.id as unknown as string | undefined;
    if (latestId) {
      if (latestId !== currentWeekId) {
        setWeekId(latestId);
        setTimeout(() => {
          toast.message("Automatisch zur neuesten Woche gewechselt", {
            duration: 5000,
          });
        }, 50);
      }
      initialAppliedRef.current = true;
    }
  }, [autoLatestWeek, classId, weeksForClass, currentWeekId, setWeekId]);

  const liveEntry = useQuery(
    api.timetable.getEntry,
    isEditNotesModalOpen && activeClickedLesson?.id
      ? { entryId: activeClickedLesson.id as Id<"timetables"> }
      : "skip",
  );

  // Track if user already modified current dialog content to avoid overwriting while typing
  const userTouchedRef = useRef(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isEditNotesModalOpen) return;
    const lessonId = activeClickedLesson?.id ?? null;
    if (lessonId !== lastLessonIdRef.current) {
      lastLessonIdRef.current = lessonId;
      userTouchedRef.current = false; // fresh lesson -> allow initial sync
      setActiveNotes(activeClickedLesson?.notes ?? "");
    } else if (activeClickedLesson && activeNotes === "") {
      // Same lesson reopened but we previously had empty; seed from lesson object (already re-rendered with icon)
      setActiveNotes(activeClickedLesson.notes ?? "");
    }
  }, [isEditNotesModalOpen, activeClickedLesson, activeNotes]);

  // Reopen same lesson case: if dialog was closed and reopens with same lesson id, force one fresh sync
  useEffect(() => {
    if (isEditNotesModalOpen && !wasOpenRef.current) {
      // just opened -> bump refresh key to force convex recompute (guards stale cached empty entry)
      if (activeClickedLesson) {
        userTouchedRef.current = false;
        setActiveNotes(activeClickedLesson.notes ?? "");
      }
    }
    wasOpenRef.current = isEditNotesModalOpen;
  }, [isEditNotesModalOpen, activeClickedLesson]);

  // When liveEntry changes (server push) sync only if user has not started editing
  useEffect(() => {
    if (!isEditNotesModalOpen || !activeClickedLesson) return;
    if (!liveEntry || liveEntry.notes === undefined) return; // loading
    if (userTouchedRef.current) return; // user editing
    const incoming = liveEntry.notes ?? "";
    const current = activeNotes ?? "";
    if (incoming === current) return;
    setActiveNotes(incoming);
    setEditNotes(incoming);
  }, [liveEntry, isEditNotesModalOpen, activeClickedLesson, activeNotes]);

  // Notizen-Dialog-Logik
  const [editNotes, setEditNotes] = useState<string | null>(null);
  useEffect(() => {
    setEditNotes(activeNotes);
  }, [activeNotes]);

  const [isSavingClassNotes, setIsSavingClassNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateLessonNotes = useMutation(api.notes.updateLessonNotes);
  const handleSaveNotes = async () => {
    if (!activeClickedLesson) return;
    setIsSaving(true);
    try {
      await updateLessonNotes({
        lessonId: activeClickedLesson.id as Id<"timetables">,
        notes: editNotes ?? undefined,
      });
      toast.success("Notizen gespeichert.");
      setIsEditNotesModalOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Fehler beim Speichern der Notizen: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // New Convex-based Class Notes Logic - Load notes by type and archived status
  const homeworkActiveNotes = useQuery(
    api.notes.getClassNotes,
    isEditClassNotesModalOpen && classId
      ? {
          classId: classId as Id<"classes">,
          noteType: "homework",
          archived: false,
        }
      : "skip",
  );
  const homeworkArchivedNotes = useQuery(
    api.notes.getClassNotes,
    isEditClassNotesModalOpen && classId
      ? {
          classId: classId as Id<"classes">,
          noteType: "homework",
          archived: true,
        }
      : "skip",
  );
  const testsActiveNotes = useQuery(
    api.notes.getClassNotes,
    isEditClassNotesModalOpen && classId
      ? {
          classId: classId as Id<"classes">,
          noteType: "tests",
          archived: false,
        }
      : "skip",
  );
  const testsArchivedNotes = useQuery(
    api.notes.getClassNotes,
    isEditClassNotesModalOpen && classId
      ? { classId: classId as Id<"classes">, noteType: "tests", archived: true }
      : "skip",
  );
  const examsActiveNotes = useQuery(
    api.notes.getClassNotes,
    isEditClassNotesModalOpen && classId
      ? {
          classId: classId as Id<"classes">,
          noteType: "exams",
          archived: false,
        }
      : "skip",
  );
  const examsArchivedNotes = useQuery(
    api.notes.getClassNotes,
    isEditClassNotesModalOpen && classId
      ? { classId: classId as Id<"classes">, noteType: "exams", archived: true }
      : "skip",
  );
  const otherActiveNotes = useQuery(
    api.notes.getClassNotes,
    isEditClassNotesModalOpen && classId
      ? {
          classId: classId as Id<"classes">,
          noteType: "other",
          archived: false,
        }
      : "skip",
  );
  const otherArchivedNotes = useQuery(
    api.notes.getClassNotes,
    isEditClassNotesModalOpen && classId
      ? { classId: classId as Id<"classes">, noteType: "other", archived: true }
      : "skip",
  );

  const addClassNote = useMutation(api.notes.addClassNote);
  const updateClassNote = useMutation(api.notes.updateClassNote);
  const toggleArchiveClassNote = useMutation(api.notes.toggleArchiveClassNote);
  const deleteClassNote = useMutation(api.notes.deleteClassNote);

  const [pendingNoteEdits, setPendingNoteEdits] = useState<
    Record<string, string>
  >({});
  const [pendingNewNotes, setPendingNewNotes] = useState<
    { id: string; type: string; text: string; archived_at?: number }[]
  >([]);
  const [pendingArchivedChanges, setPendingArchivedChanges] = useState<
    Record<string, { shouldArchive: boolean; timestamp: number }>
  >({});
  const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(
    new Set(),
  );

  const getNoteText = (id: string, originalText: string) =>
    pendingNoteEdits[id] ?? originalText;

  const isNoteArchived = (id: string, originalArchived?: number) =>
    id in pendingArchivedChanges
      ? pendingArchivedChanges[id].shouldArchive
      : originalArchived !== undefined;

  const getArchivedTimestamp = (id: string, originalArchived?: number) =>
    id in pendingArchivedChanges
      ? pendingArchivedChanges[id].timestamp
      : (originalArchived ?? 0);

  const isNoteDeleted = (id: string) => pendingDeletions.has(id);

  const handleNoteChange = (id: string, text: string) => {
    if (id.startsWith("temp-")) {
      setPendingNewNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, text } : n)),
      );
    } else {
      setPendingNoteEdits((prev) => ({ ...prev, [id]: text }));
    }
  };

  const handleToggleArchive = (id: string, currentArchived: boolean) => {
    if (id.startsWith("temp-")) {
      setPendingNewNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, archived_at: n.archived_at ? undefined : Date.now() }
            : n,
        ),
      );
    } else {
      setPendingArchivedChanges((prev) => ({
        ...prev,
        [id]: { shouldArchive: !currentArchived, timestamp: Date.now() },
      }));
    }
  };

  const handleDeleteNote = (id: string) => {
    if (id.startsWith("temp-")) {
      setPendingNewNotes((prev) => prev.filter((n) => n.id !== id));
    } else {
      setPendingDeletions((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }
  };

  const handleSaveClassNotes = async () => {
    setIsSavingClassNotes(true);
    try {
      const promises: Promise<unknown>[] = [];

      // 1. Delete notes
      for (const id of pendingDeletions) {
        promises.push(deleteClassNote({ noteId: id as Id<"notes"> }));
      }

      // 2. Update existing notes (text)
      for (const [id, text] of Object.entries(pendingNoteEdits)) {
        if (!pendingDeletions.has(id)) {
          if (!text.trim()) continue;
          promises.push(updateClassNote({ noteId: id as Id<"notes">, text }));
        }
      }

      // 3. Update existing notes (archive status)
      for (const [id, change] of Object.entries(pendingArchivedChanges)) {
        if (!pendingDeletions.has(id)) {
          promises.push(
            toggleArchiveClassNote({
              noteId: id as Id<"notes">,
              shouldArchive: change.shouldArchive,
            }),
          );
        }
      }

      // Execute deletions and updates first (can be parallel)
      const results = await Promise.allSettled(promises);
      const failures = results.filter((r) => r.status === "rejected");

      // 4. Create new notes sequentially in reverse order (oldest first)
      // This ensures the first note created gets the oldest _creationTime
      const notesToCreate = [...pendingNewNotes].reverse();
      for (const note of notesToCreate) {
        if (!note.text.trim()) continue;
        try {
          await addClassNote({
            classId: classId as Id<"classes">,
            note_type: note.type as "homework" | "tests" | "exams" | "other",
            text: note.text,
            archived_at: note.archived_at,
          });
        } catch (error) {
          failures.push({ status: "rejected" as const, reason: error });
        }
      }

      if (failures.length > 0) {
        toast.warning(`${failures.length} Operation(en) fehlgeschlagen`);
      }

      setPendingNoteEdits({});
      setPendingNewNotes([]);
      setPendingArchivedChanges({});
      setPendingDeletions(new Set());
      setIsEditClassNotesModalOpen(false);
      toast.success("Klassennotizen gespeichert");
    } catch (error) {
      toast.error("Fehler beim Speichern der Klassennotizen");
      console.error(error);
    } finally {
      setIsSavingClassNotes(false);
    }
  };

  const handleCancelClassNotes = () => {
    setPendingNoteEdits({});
    setPendingNewNotes([]);
    setPendingArchivedChanges({});
    setPendingDeletions(new Set());
    setIsEditClassNotesModalOpen(false);
  };

  const allHomeworkNotes = [
    ...(homeworkActiveNotes ?? []),
    ...(homeworkArchivedNotes ?? []),
  ];
  const homeworkActive = [
    ...pendingNewNotes
      .filter((n) => n.type === "homework" && !n.archived_at)
      .map((n) => ({ id: n.id, text: n.text })),
    ...allHomeworkNotes
      .filter(
        (n) => !isNoteArchived(n._id, n.archived_at) && !isNoteDeleted(n._id),
      )
      .map((n) => ({ id: n._id, text: getNoteText(n._id, n.note_content) })),
  ];
  const homeworkArchived = [
    ...pendingNewNotes
      .filter((n) => n.type === "homework" && n.archived_at)
      .map((n) => ({ id: n.id, text: n.text })),
    ...allHomeworkNotes
      .filter(
        (n) => isNoteArchived(n._id, n.archived_at) && !isNoteDeleted(n._id),
      )
      .sort(
        (a, b) =>
          getArchivedTimestamp(b._id, b.archived_at) -
          getArchivedTimestamp(a._id, a.archived_at),
      )
      .map((n) => ({ id: n._id, text: getNoteText(n._id, n.note_content) })),
  ];

  const allTestsNotes = [
    ...(testsActiveNotes ?? []),
    ...(testsArchivedNotes ?? []),
  ];
  const testsActive = [
    ...pendingNewNotes
      .filter((n) => n.type === "tests" && !n.archived_at)
      .map((n) => ({ id: n.id, text: n.text })),
    ...allTestsNotes
      .filter(
        (n) => !isNoteArchived(n._id, n.archived_at) && !isNoteDeleted(n._id),
      )
      .map((n) => ({ id: n._id, text: getNoteText(n._id, n.note_content) })),
  ];
  const testsArchived = [
    ...pendingNewNotes
      .filter((n) => n.type === "tests" && n.archived_at)
      .map((n) => ({ id: n.id, text: n.text })),
    ...allTestsNotes
      .filter(
        (n) => isNoteArchived(n._id, n.archived_at) && !isNoteDeleted(n._id),
      )
      .sort(
        (a, b) =>
          getArchivedTimestamp(b._id, b.archived_at) -
          getArchivedTimestamp(a._id, a.archived_at),
      )
      .map((n) => ({ id: n._id, text: getNoteText(n._id, n.note_content) })),
  ];

  const allExamsNotes = [
    ...(examsActiveNotes ?? []),
    ...(examsArchivedNotes ?? []),
  ];
  const examsActive = [
    ...pendingNewNotes
      .filter((n) => n.type === "exams" && !n.archived_at)
      .map((n) => ({ id: n.id, text: n.text })),
    ...allExamsNotes
      .filter(
        (n) => !isNoteArchived(n._id, n.archived_at) && !isNoteDeleted(n._id),
      )
      .map((n) => ({ id: n._id, text: getNoteText(n._id, n.note_content) })),
  ];
  const examsArchived = [
    ...pendingNewNotes
      .filter((n) => n.type === "exams" && n.archived_at)
      .map((n) => ({ id: n.id, text: n.text })),
    ...allExamsNotes
      .filter(
        (n) => isNoteArchived(n._id, n.archived_at) && !isNoteDeleted(n._id),
      )
      .sort(
        (a, b) =>
          getArchivedTimestamp(b._id, b.archived_at) -
          getArchivedTimestamp(a._id, a.archived_at),
      )
      .map((n) => ({ id: n._id, text: getNoteText(n._id, n.note_content) })),
  ];

  const allOtherNotes = [
    ...(otherActiveNotes ?? []),
    ...(otherArchivedNotes ?? []),
  ];
  const otherActive = [
    ...pendingNewNotes
      .filter((n) => n.type === "other" && !n.archived_at)
      .map((n) => ({ id: n.id, text: n.text })),
    ...allOtherNotes
      .filter(
        (n) => !isNoteArchived(n._id, n.archived_at) && !isNoteDeleted(n._id),
      )
      .map((n) => ({ id: n._id, text: getNoteText(n._id, n.note_content) })),
  ];
  const otherArchived = [
    ...pendingNewNotes
      .filter((n) => n.type === "other" && n.archived_at)
      .map((n) => ({ id: n.id, text: n.text })),
    ...allOtherNotes
      .filter(
        (n) => isNoteArchived(n._id, n.archived_at) && !isNoteDeleted(n._id),
      )
      .sort(
        (a, b) =>
          getArchivedTimestamp(b._id, b.archived_at) -
          getArchivedTimestamp(a._id, a.archived_at),
      )
      .map((n) => ({ id: n._id, text: getNoteText(n._id, n.note_content) })),
  ];

  const handleAddNote = async (type: NoteType) => {
    if (!classId) return;
    const id = `temp-${Date.now()}`;
    setPendingNewNotes((prev) => [{ id, type, text: "" }, ...prev]);
  };

  const handleOpenClassNotes = () => {
    if (!classId) {
      toast.message("Keine Klasse ausgewählt");
      return;
    }
    setIsEditClassNotesModalOpen(true);
  };

  return (
    <div className="flex flex-1 h-full flex-col px-4 pb-4 md:px-6 md:pb-6 min-h-0">
      <div className="flex flex-row justify-between items-center mb-4 md:mb-8">
        <div className="hidden md:flex flex-col">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Stundenplan
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Verwalten Sie Ihren Stundenplan effizient
          </p>
        </div>

        {/* Mobile: controls split left/right */}
        <div className="flex w-full items-start justify-between md:hidden gap-2 flex-nowrap">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <div className="overflow-hidden">
              <WeekSelectionCombobox />
            </div>
            <GroupSelection />
          </div>
          <div className="flex items-center gap-2 flex-nowrap">
            <ModeLockButton />
            <NotesActionsDropdown
              getNotes={() => editNotes ?? ""}
              onOpenClassNotes={handleOpenClassNotes}
            />
          </div>
        </div>

        {/* Desktop: original grouping */}
        <div className="hidden md:flex flex-nowrap gap-4 items-start">
          <div className="flex flex-wrap gap-2">
            <WeekSelectionCombobox />
            <GroupSelection />
          </div>
          <div className="flex flex-nowrap gap-2">
            <ModeLockButton />
            <NotesActionsDropdown
              getNotes={() => editNotes ?? ""}
              onOpenClassNotes={handleOpenClassNotes}
            />
          </div>
        </div>
      </div>

      <Timetable
        setActiveClickedLesson={setActiveClickedLesson}
        setActiveNotes={setActiveNotes}
        setIsEditNotesModalOpen={setIsEditNotesModalOpen}
      />

      <Dialog
        open={isEditNotesModalOpen}
        onOpenChange={setIsEditNotesModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notizen bearbeiten</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editNotes ?? ""}
            onChange={(e) => {
              const next = e.target.value;
              if (next !== (editNotes ?? "")) {
                userTouchedRef.current = true;
                setEditNotes(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                if (!isSaving && activeClickedLesson) {
                  handleSaveNotes();
                }
              }
            }}
            placeholder="Notizen eintragen..."
            rows={6}
            className="min-h-20 max-h-[calc(100svh-12rem)] resize-y"
          />
          <DialogFooter className="flex w-full flex-row gap-2 sm:justify-end">
            <Button
              variant="secondary"
              className="flex-1 sm:flex-none"
              onClick={() => setIsEditNotesModalOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              onClick={handleSaveNotes}
              disabled={!activeClickedLesson || isSaving}
            >
              {isSaving ? "Speichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditClassNotesModalOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelClassNotes();
          else setIsEditClassNotesModalOpen(true);
        }}
      >
        <DialogContent className="md:max-w-3xl h-[80dvh] max-h-[80dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Klassen Notizen bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col">
            {homeworkActiveNotes === undefined ||
            homeworkArchivedNotes === undefined ||
            testsActiveNotes === undefined ||
            testsArchivedNotes === undefined ||
            examsActiveNotes === undefined ||
            examsArchivedNotes === undefined ||
            otherActiveNotes === undefined ||
            otherArchivedNotes === undefined ? (
              <div className="flex flex-1 items-center justify-center py-6">
                <Spinner />
              </div>
            ) : (
              <Tabs
                defaultValue="homework"
                className="mt-2 flex-1 min-h-0 flex flex-col"
              >
                <TabsList className="w-full">
                  <TabsTrigger value="homework" className="flex-1">
                    Aufgabe
                  </TabsTrigger>
                  <TabsTrigger value="tests" className="flex-1">
                    Ex
                  </TabsTrigger>
                  <TabsTrigger value="exams" className="flex-1">
                    Schulaufgabe
                  </TabsTrigger>
                  <TabsTrigger value="other" className="flex-1">
                    Sonstige
                  </TabsTrigger>
                </TabsList>

                <NotesTabContent
                  type="homework"
                  activeNotes={homeworkActive}
                  archivedNotes={homeworkArchived}
                  onAddNote={handleAddNote}
                  onToggleArchive={handleToggleArchive}
                  onNoteChange={handleNoteChange}
                  onDelete={handleDeleteNote}
                />

                <NotesTabContent
                  type="tests"
                  activeNotes={testsActive}
                  archivedNotes={testsArchived}
                  onAddNote={handleAddNote}
                  onToggleArchive={handleToggleArchive}
                  onNoteChange={handleNoteChange}
                  onDelete={handleDeleteNote}
                />

                <NotesTabContent
                  type="exams"
                  activeNotes={examsActive}
                  archivedNotes={examsArchived}
                  onAddNote={handleAddNote}
                  onToggleArchive={handleToggleArchive}
                  onNoteChange={handleNoteChange}
                  onDelete={handleDeleteNote}
                />

                <NotesTabContent
                  type="other"
                  activeNotes={otherActive}
                  archivedNotes={otherArchived}
                  onAddNote={handleAddNote}
                  onToggleArchive={handleToggleArchive}
                  onNoteChange={handleNoteChange}
                  onDelete={handleDeleteNote}
                />
              </Tabs>
            )}
          </div>
          <DialogFooter className="flex w-full flex-row gap-2 sm:justify-end">
            <Button
              variant="secondary"
              className="flex-1 sm:flex-none"
              onClick={handleCancelClassNotes}
            >
              Abbrechen
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              onClick={handleSaveClassNotes}
              disabled={isSavingClassNotes}
            >
              {isSavingClassNotes ? "Speichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
