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
import { useSpecializationStore } from "@/store/useSpecializationStore";
import { updateUrl } from "@/utils/updateTimetableURL";
import { useRouter } from "next/navigation";
import { useClassIDStore } from "@/store/useClassIDStore";

export function WeekSelectionCombobox() {
  const { weekID, setWeekID } = useWeekIDStore();
  const { specialization } = useSpecializationStore();
  const { classID } = useClassIDStore();
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

  const router = useRouter();

  const handleWeekChange = (weekId: string | null) => {
    setWeekID(weekId);
    updateUrl(router, weekId, specialization, classID);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {weekID
            ? weeks.find((w) => w.value === weekID)?.label
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
                    if (currentValue === weekID) {
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
