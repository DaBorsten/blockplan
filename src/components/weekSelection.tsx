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
// query params handled via nuqs hooks
import { useCurrentWeek, useSetWeek } from "@/store/useWeekStore";
import { useCurrentClass } from "@/store/useClassStore";

export function WeekSelectionCombobox() {
  const weekID = useCurrentWeek();
  const classID = useCurrentClass();
  const setWeekID = useSetWeek();

  const [open, setOpen] = React.useState(false);
  const [weeks, setWeeks] = React.useState<
    { label: string; value: string | null }[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchWeeks = async () => {
      setLoading(true);
      if (classID) {
        const result = await fetchWeekIDsWithNames(classID);
        const filtered = (result || []).filter((w) => w.value !== null);
        setWeeks([{ label: "Keine Woche", value: null }, ...filtered]);
      } else {
        setWeeks([{ label: "Keine Woche", value: null }]);
      }
      setLoading(false);
    };
    fetchWeeks();
  }, [classID]);

  const handleWeekChange = (weekId: string | null | string) => {
    const nextWeek = weekId && weekId.length > 0 ? (weekId as string) : null;
    setWeekID(nextWeek);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[150px] justify-between"
        >
          {weekID
            ? weeks.find((w) => w.value === weekID)?.label
            : loading
            ? "Lade Wochen..."
            : "Woche wählen"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandInput placeholder="Suchen" className="h-9" />
          <CommandList>
            <CommandEmpty>Keine Woche</CommandEmpty>
            <CommandGroup>
              {weeks.map((week) => (
                <CommandItem
                  key={week.value ?? "none"}
                  value={week.value ?? ""}
                  onSelect={(currentValue) => {
                    if (currentValue === (weekID ?? "")) {
                      setOpen(false);
                      return;
                    }
                    setOpen(false);
                    handleWeekChange(currentValue);
                  }}
                >
                  {week.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      weekID === week.value ? "opacity-100" : "opacity-0",
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
