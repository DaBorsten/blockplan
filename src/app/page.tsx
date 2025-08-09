"use client";

import { SpecializationSelect } from "@/components/specializationSelection";
import { WeekSelectionCombobox } from "@/components/weekSelection";

export default function Timetable() {
  return (
    <div>
      <WeekSelectionCombobox />
      <SpecializationSelect />

      {/* <Timetable /> */}
    </div>
  );
}
