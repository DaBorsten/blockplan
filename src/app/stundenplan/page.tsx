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
import { Lesson } from "@/types/timetableData";
import { toast } from "sonner";

export default function TimetablePage() {
  const [activeClickedLesson, setActiveClickedLesson] = useState<Lesson | null>(
    null,
  );
  const [activeNotes, setActiveNotes] = useState<string | null>(null);
  const [isEditNotesModalOpen, setIsEditNotesModalOpen] = useState(false);
  const lastLessonIdRef = useRef<string | null>(null);

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

  // Externe Updates nachdem User noch nicht getippt hat werden oben abgefangen; hier kein zusätzlicher Overwrite nötig.

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
            <NotesActionsDropdown getNotes={() => editNotes ?? ""} />
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
            <NotesActionsDropdown getNotes={() => editNotes ?? ""} />
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
            placeholder="Notizen eintragen..."
            rows={6}
          />
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsEditNotesModalOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={!activeClickedLesson || isSaving}
            >
              {isSaving ? "Speichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
