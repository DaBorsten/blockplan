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
    if (!classID) return [{ label: "Leer", value: null }];
    if (weeksRaw === undefined) return [{ label: "Lädt…", value: weekID }];
    const mapped = weeksRaw
      .map((w) => ({
        label: w.title,
        value: w.id as string,
        createdAt: w.createdAt,
      }))
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return [{ label: "Leer", value: null }, ...mapped];
  }, [weeksRaw, classID, weekID]);

  const handleWeekChange = (weekId: string | null | string) => {
    const nextWeek = weekId && weekId.length > 0 ? (weekId as string) : null;
    setWeekID(nextWeek);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild aria-label="Wochen Auswahl">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-30 justify-between flex items-center gap-2 min-w-0"
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
                : "Leer"}
          </span>
          <ChevronsUpDown className="opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandList>
            <CommandEmpty>Leer</CommandEmpty>
            <CommandGroup>
              {weeks.map((week) => {
                const isActive = weekID === week.value;
                return (
                  <CommandItem
                    key={week.value ?? "none"}
                    // Wert muss eindeutig sein (cmdk nutzt value intern für Auswahl); Label bleibt im String für die Suche
                    value={`${week.label}__${week.value ?? "none"}`}
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
