import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Specialization,
  useSpecializationStore,
} from "@/store/useSpecializationStore";
import { updateUrl } from "@/utils/updateTimetableURL";
import { useWeekIDStore } from "@/store/useWeekIDStore";
import { useRouter } from "next/navigation";

const options = [
  { label: "Alle", value: 1 },
  { label: "Gruppe A", value: 2 },
  { label: "Gruppe B", value: 3 },
];

export function SpecializationSelect() {
  const { weekID } = useWeekIDStore();
  const { specialization, setSpecialization } = useSpecializationStore();
  const router = useRouter();

  const handleSpecChange = (spec: Specialization) => {
    setSpecialization(spec);
    updateUrl(router, weekID, spec);
  };

  return (
    <Select
      value={
        typeof specialization === "number" ? String(specialization) : undefined
      }
      onValueChange={(val) => {
        const num = val ? Number(val) : null;
        handleSpecChange(num as Specialization);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Fachrichtung wählen" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
