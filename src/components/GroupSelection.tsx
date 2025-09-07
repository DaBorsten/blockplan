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

export function GroupSelect() {
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
      <SelectTrigger aria-label="Gruppenauswahl">
        <SelectValue placeholder="Gruppe wählen" />
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
