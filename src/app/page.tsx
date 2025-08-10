"use client";

import { SpecializationSelect } from "@/components/specializationSelection";
import { WeekSelectionCombobox } from "@/components/weekSelection";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Timetable from "@/components/timetable";
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
import { useWeekIDStore } from "@/store/useWeekIDStore";
import {
  Specialization,
  useSpecializationStore,
} from "@/store/useSpecializationStore";

export default function TimetablePage() {
  const searchParams = useSearchParams();

  const { weekID, setWeekID } = useWeekIDStore();
  const { specialization, setSpecialization } = useSpecializationStore();

  // Initial aus URL lesen
  useEffect(() => {
    const week = searchParams.get("week") || null;
    const spec = searchParams.get("spec");

    setWeekID(week);
    setSpecialization(spec ? (Number(spec) as Specialization) : 1);
  }, [searchParams, weekID, specialization, setSpecialization, setWeekID]);

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
    <div className="flex flex-col px-6">
      <div className="flex flex-row justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Stundenplan
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Verwalten Sie Ihren Stundenplan effizient
          </p>
        </div>

        <div className="flex space-x-4">
          <WeekSelectionCombobox />
          <SpecializationSelect />
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
