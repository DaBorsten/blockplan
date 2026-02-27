import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { Group, Groups } from "@/types/group";
import { useCurrentGroup, useSetGroup } from "@/store/useGroupStore";

const options: Groups = [
  { label: "Alle", value: 1 },
  { label: "Teil A", value: 2 },
  { label: "Teil B", value: 3 }
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
        className="min-w-24 h-auto"
      >
        <SelectValue>
          {options.find((o) => o.value === group)?.label ?? "Wählen"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="center" alignItemWithTrigger={false}>
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
