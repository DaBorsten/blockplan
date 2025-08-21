"use client";

import { SpecializationSelect } from "@/components/specializationSelection";
import { WeekSelectionCombobox } from "@/components/weekSelection";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Timetable from "@/components/timetable";
import NotesActionsDropdown from "@/components/NotesActionsDropdown";
import ModeLockButton from "@/components/ModeLockButton";
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
import { useModeStore } from "@/store/useModeStore";

export default function TimetablePage() {
  const searchParams = useSearchParams();
  const { setMode } = useModeStore();

  // Initial aus URL lesen
  useEffect(() => {
    const mode = (searchParams.get("mode") as "notes") || "copy";
    setMode(mode);
  }, [searchParams, setMode]);

  const [activeClickedLesson, setActiveClickedLesson] = useState<Lesson | null>(
    null,
  );
  const [activeNotes, setActiveNotes] = useState<string | null>(null);
  const [isEditNotesModalOpen, setIsEditNotesModalOpen] = useState(false);
  const [notesUpdated, setNotesUpdated] = useState(false);

  // Notizen per API laden, wenn Lesson angeklickt wird
  useEffect(() => {
    const fetchNotes = async () => {
      if (activeClickedLesson) {
        const res = await fetch(
          `/api/week/notes?lessonId=${activeClickedLesson.id}`,
        );
        const data = await res.json();
        setActiveNotes(data.notes ?? "");
      } else {
        setActiveNotes("");
      }
    };
    if (isEditNotesModalOpen) {
      fetchNotes();
    }
  }, [activeClickedLesson, isEditNotesModalOpen]);

  // Notizen-Dialog-Logik
  const [editNotes, setEditNotes] = useState<string | null>(null);
  useEffect(() => {
    setEditNotes(activeNotes);
  }, [activeNotes, isEditNotesModalOpen]);

  const handleSaveNotes = async () => {
    if (!activeClickedLesson) return;
    await fetch(`/api/week/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonID: activeClickedLesson.id,
        notes: editNotes,
      }),
    });
    setIsEditNotesModalOpen(false);
    setNotesUpdated((v) => !v);
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
        <div className="flex w-full items-center justify-between md:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div className="overflow-hidden">
              <WeekSelectionCombobox />
            </div>
            <SpecializationSelect />
          </div>
          <div className="flex items-center gap-2">
            <ModeLockButton />
            <NotesActionsDropdown getNotes={() => editNotes ?? ""} />
          </div>
        </div>

        {/* Desktop: original grouping */}
        <div className="hidden md:flex flex-wrap gap-4 items-center">
          <WeekSelectionCombobox />
          <SpecializationSelect />
          <ModeLockButton />
          <NotesActionsDropdown getNotes={() => editNotes ?? ""} />
        </div>
      </div>

      <Timetable
        setActiveClickedLesson={setActiveClickedLesson}
        setActiveNotes={setActiveNotes}
        setIsEditNotesModalOpen={setIsEditNotesModalOpen}
        notesUpdated={notesUpdated}
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
            onChange={(e) => setEditNotes(e.target.value)}
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
            <Button onClick={handleSaveNotes} disabled={!activeClickedLesson}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
