"use client";

import { SpecializationSelect } from "@/components/specializationSelection";
import { WeekSelectionCombobox } from "@/components/weekSelection";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadSpecificTimetables } from "@/utils/db";

export default function Timetable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<number>(1);
  const [relevantWeeks, setRelevantWeeks] = useState<any[]>([]);

  // Initial aus URL lesen
  useEffect(() => {
    const week = searchParams.get("week") || null;
    const spec = searchParams.get("spec");
    setSelectedWeek(week);
    setSelectedSpec(spec ? Number(spec) : 1);
  }, [searchParams]);

  // Bei Änderung Auswahl → URL aktualisieren
  const updateUrl = (week: string | null, spec: number) => {
    const params = new URLSearchParams();
    if (week) params.set("week", week);
    if (spec && spec !== 1) params.set("spec", String(spec));
    router.replace("?" + params.toString(), { scroll: false });
  };

  const handleWeekChange = (weekId: string | null) => {
    setSelectedWeek(weekId);
    updateUrl(weekId, selectedSpec);
  };

  const handleSpecChange = (spec: number) => {
    setSelectedSpec(spec);
    updateUrl(selectedWeek, spec);
  };

  // Trigger fetch wenn beide ausgewählt
  useEffect(() => {
    const fetchRelevant = async () => {
      if (selectedWeek && selectedSpec) {
        const result = await LoadSpecificTimetables(selectedWeek, selectedSpec);
        setRelevantWeeks(result || []);
      } else {
        setRelevantWeeks([]);
      }
    };
    fetchRelevant();
  }, [selectedWeek, selectedSpec]);

  return (
    <div>
      <WeekSelectionCombobox onChange={handleWeekChange} value={selectedWeek} />
      <SpecializationSelect onChange={handleSpecChange} value={selectedSpec} />

      {selectedWeek && selectedSpec && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">
            Ausgewählte Wochen:
          </h3>
          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(relevantWeeks, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
