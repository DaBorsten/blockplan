"use client";

import Navigation from "@/components/navigation";
import { SpecializationSelect } from "@/components/specializationSelection";
import { WeekSelectionCombobox } from "@/components/weekSelection";

export default function Timetable() {
  return (
    <div>
      <Navigation />
      <WeekSelectionCombobox />
      <SpecializationSelect />

      {/* <Timetable /> */}
    </div>
  );
}
