"use client";

import { SpecializationSelect } from "@/components/specializationSelection";
import { WeekSelectionCombobox } from "@/components/weekSelection";
import { useEffect, useState } from "react";
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
import { toast } from "sonner";

export default function TimetablePage() {
  const [activeClickedLesson, setActiveClickedLesson] = useState<Lesson | null>(
    null,
  );
  const [activeNotes, setActiveNotes] = useState<string | null>(null);
  const [isEditNotesModalOpen, setIsEditNotesModalOpen] = useState(false);
  const [notesUpdated, setNotesUpdated] = useState(false);

  // Notizen per API laden, wenn Lesson angeklickt wird
  useEffect(() => {
    const abortController = new AbortController();
    const fetchNotes = async () => {
      if (activeClickedLesson) {
        try {
          const res = await fetch(
            `/api/week/notes?lessonId=${activeClickedLesson.id}`,
            { signal: abortController.signal },
          );
          if (!res.ok) {
            throw new Error(`Fehler beim Laden der Notizen: ${res.status}`);
          }
          const data = await res.json();
          setActiveNotes(data.notes ?? "");
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
          console.error("Fehler beim Laden der Notizen:", error);
          toast.error("Notizen konnten nicht geladen werden");
          setActiveNotes("");
        }
      } else {
        setActiveNotes("");
      }
    };
    if (isEditNotesModalOpen) {
      fetchNotes();
    }
  }, [activeClickedLesson, isEditNotesModalOpen, notesUpdated]);

  // Notizen-Dialog-Logik
  const [editNotes, setEditNotes] = useState<string | null>(null);
  useEffect(() => {
    setEditNotes(activeNotes);
  }, [activeNotes]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNotes = async () => {
    if (!activeClickedLesson) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/week/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: activeClickedLesson.id,
          notes: editNotes ?? "",
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }
      toast.success("Notizen gespeichert.");
      setIsEditNotesModalOpen(false);
      setNotesUpdated((v) => !v);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unbekannter Fehler";
      toast.error(`Fehler beim Speichern der Notizen: ${errorMessage}`);
      console.error("Fehler beim Speichern der Notizen:", error);
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
