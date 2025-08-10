"use client";

import * as React from "react";
import { fetchWeekIDsWithNames } from "@/utils/weeks";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWeekIDStore } from "@/store/useWeekIDStore";

type Props = {
  onChange?: (weekId: string | null) => void;
  value?: string | null;
};

export function WeekSelectionCombobox({ onChange, value }: Props) {
  const { weekID, setWeekID } = useWeekIDStore();
  const [open, setOpen] = React.useState(false);
  const [weeks, setWeeks] = React.useState<
    { label: string; value: string | null }[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchWeeks = async () => {
      setLoading(true);
      const result = await fetchWeekIDsWithNames();
      setWeeks(result || []);
      setLoading(false);
    };
    fetchWeeks();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? weeks.find((w) => w.value === value)?.label
            : loading
            ? "Lade Wochen..."
            : "Woche wählen"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Woche suchen..." className="h-9" />
          <CommandList>
            <CommandEmpty>Keine Woche gefunden.</CommandEmpty>
            <CommandGroup>
              {weeks.map((week) => (
                <CommandItem
                  key={week.value ?? "none"}
                  value={week.value ?? ""}
                  onSelect={(currentValue) => {
                    const newValue =
                      currentValue === value ? null : currentValue;
                    setOpen(false);
                    if (onChange) onChange(newValue);
                    setWeekID(newValue);
                  }}
                >
                  {week.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === week.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
