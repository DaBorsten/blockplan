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
import { updateUrl } from "@/utils/updateTimetableURL";
import { useRouter, useSearchParams } from "next/navigation";

const options = [
  { label: "Alle", value: 1 },
  { label: "Gruppe A", value: 2 },
  { label: "Gruppe B", value: 3 },
];

export function SpecializationSelect() {
  const searchParams = useSearchParams();
  const weekID = searchParams?.get("week") ?? null;
  const specParam = searchParams?.get("spec");
  const specialization: Specialization = (specParam ? Number(specParam) : 1) as Specialization;
  const classID = searchParams?.get("class") ?? null;
  const router = useRouter();

  const handleSpecChange = (spec: Specialization) => {
    updateUrl(router, weekID, spec, classID);
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
