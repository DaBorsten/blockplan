"use client";

import * as React from "react";
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
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function WeekSelectionCombobox() {
  const weekID = useCurrentWeek();
  const classID = useCurrentClass();
  const setWeekID = useSetWeek();

  const [open, setOpen] = React.useState(false);
  const weeksRaw = useQuery(
    api.weeks.listWeeks,
    classID ? { classId: classID as Id<"classes"> } : "skip",
  );
  const loading = weeksRaw === undefined && !!classID;
  const weeks = React.useMemo(() => {
    if (!classID) return [{ label: "Keine Woche", value: null }];
    if (weeksRaw === undefined) return [{ label: "Lädt…", value: weekID }];
    const mapped = weeksRaw
      .map((w) => ({ label: w.title, value: w.id as string }))
      .sort((a, b) =>
        b.label.localeCompare(a.label, "de-DE", {
          numeric: true,
          sensitivity: "base",
        }),
      );
    return [{ label: "Keine Woche", value: null }, ...mapped];
  }, [weeksRaw, classID, weekID]);

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
          className="w-[150px] justify-between flex items-center gap-2 min-w-0"
        >
          <span
            className="flex-1 min-w-0 truncate text-left"
            title={
              weekID
                ? weeks.find((w) => w.value === weekID)?.label || undefined
                : undefined
            }
          >
            {weekID
              ? weeks.find((w) => w.value === weekID)?.label
              : loading
                ? "Lädt..."
                : "Woche wählen"}
          </span>
          <ChevronsUpDown className="opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandInput placeholder="Suchen" className="h-9" />
          <CommandList>
            <CommandEmpty>Keine Woche</CommandEmpty>
            <CommandGroup>
              {weeks.map((week) => {
                const isActive = weekID === week.value;
                return (
                  <CommandItem
                    key={week.value ?? "none"}
                    // Für die Suche soll der Label-Text verwendet werden, nicht die ID
                    value={week.label}
                    onSelect={() => {
                      if (isActive) {
                        setOpen(false);
                        return;
                      }
                      setOpen(false);
                      handleWeekChange(week.value ?? null);
                    }}
                  >
                    {week.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        isActive ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
