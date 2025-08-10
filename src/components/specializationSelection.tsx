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

type Props = {
  onChange?: (spec: Specialization) => void;
  value?: number;
};

const options = [
  { label: "Alle", value: 1 },
  { label: "AE", value: 2 },
  { label: "FiSi", value: 3 },
];

export function SpecializationSelect({ onChange, value }: Props) {
  const { specialization, setSpecialization } = useSpecializationStore();

  const [internalValue, setInternalValue] = React.useState<number | null>(null);

  return (
    <Select
      value={typeof value === "number" ? String(value) : undefined}
      onValueChange={(val) => {
        const num = val ? Number(val) : null;
        if (onChange && num !== null) onChange(num);
        setSpecialization(num as Specialization);
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Fachrichtung wählen" />
      </SelectTrigger>
      <SelectContent>
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
