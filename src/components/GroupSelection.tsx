import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Group, Groups } from "@/types/group";
import { useCurrentGroup, useSetGroup } from "@/store/useGroupStore";

const options: Groups = [
  { label: "Alle", value: 1 },
  { label: "Gruppe A", value: 2 },
  { label: "Gruppe B", value: 3 },
];

export function GroupSelection() {
  const group = useCurrentGroup();
  const setGroup = useSetGroup();
  const handleGroupChange = (newGroup: Group) => {
    setGroup(newGroup);
  };

  return (
    <Select
      value={typeof group === "number" ? String(group) : undefined}
      onValueChange={(val) => handleGroupChange(Number(val) as Group)}
    >
      <SelectTrigger
        aria-label="Gruppenauswahl"
        className="min-w-[8rem] w-auto"
      >
        <SelectValue placeholder="Gruppe wählen" />
      </SelectTrigger>
      <SelectContent
        align="end"
        className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]"
      >
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
