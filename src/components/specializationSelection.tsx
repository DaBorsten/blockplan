import * as React from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SpecializationSelect() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Fachrichtung wählen" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">Alle</SelectItem>
          <SelectItem value="ae">AE</SelectItem>
          <SelectItem value="fisi">FiSi</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
