import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Specialization } from "@/types/specialization";
import { useCurrentGroup, useSetGroup } from "@/store/useGroupStore";

const options = [
  { label: "Alle", value: 1 },
  { label: "Gruppe A", value: 2 },
  { label: "Gruppe B", value: 3 },
];

export function SpecializationSelect() {
  const specialization = useCurrentGroup();
  const setSpecialization = useSetGroup();
  const handleSpecChange = (spec: Specialization) => {
    setSpecialization(spec);
  };

  return (
    <Select
      value={
        typeof specialization === "number" ? String(specialization) : undefined
      }
  onValueChange={(val) => handleSpecChange(Number(val) as Specialization)}
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
