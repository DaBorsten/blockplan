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
import { useWeeksStore } from "@/store/useWeeksStore";
import { useWeekIDStore } from "@/store/useWeekIDStore";
import {
  Specialization,
  useSpecializationStore,
} from "@/store/useSpecializationStore";

export default function TimetablePage() {
  const searchParams = useSearchParams();
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<number>(1);
  const [relevantWeeks, setRelevantWeeks] = useState<any[]>([]);

  const { weekID, setWeekID } = useWeekIDStore();
  const { specialization, setSpecialization } = useSpecializationStore();

  // Initial aus URL lesen
  useEffect(() => {
    const week = searchParams.get("week") || null;
    const spec = searchParams.get("spec");

    setWeekID(week);
    setSpecialization(spec ? (Number(spec) as Specialization) : 1);
  }, [searchParams, weekID, specialization]);

  // Trigger fetch wenn beide ausgewählt
  useEffect(() => {
    const fetchRelevant = async () => {
      if (selectedWeek && selectedSpec) {
        const res = await fetch(
          `/api/timetable/week?weekId=${selectedWeek}&specialization=${selectedSpec}`,
        );
        const data = await res.json();
        const result = data.data;
        setRelevantWeeks(result || []);
      } else {
        setRelevantWeeks([]);
      }
    };
    fetchRelevant();
  }, [selectedWeek, selectedSpec]);

  const [timeTableData, setTimeTableData] = useState<any[]>([]);
  const [activeClickedLesson, setActiveClickedLesson] = useState<Lesson | null>(
    null,
  );
  const [activeNotes, setActiveNotes] = useState<string | null>(null);
  const [isEditNotesModalOpen, setIsEditNotesModalOpen] = useState(false);
  const [notesUpdated, setNotesUpdated] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(true);

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
    <div className="flex flex-col">
      <WeekSelectionCombobox />
      <SpecializationSelect />
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
