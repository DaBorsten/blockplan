"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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

  const weeksRaw = useQuery(
    api.weeks.listWeeks,
    classID ? { classId: classID as Id<"classes"> } : "skip"
  );
  const loading = weeksRaw === undefined && !!classID;
  const weeks = React.useMemo(() => {
    if (!classID) return [{ label: "Leer", value: null }];
    if (weeksRaw === undefined) return [{ label: "Lädt…", value: weekID }];
    const mapped = weeksRaw
      .map((w) => ({
        label: w.title,
        value: w.id as string,
        createdAt: w.createdAt
      }))
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return [{ label: "Leer", value: null }, ...mapped];
  }, [weeksRaw, classID, weekID]);

  const handleWeekChange = (weekId: string | null) => {
    const nextWeek = weekId && weekId.length > 0 ? (weekId as string) : null;
    setWeekID(nextWeek);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Wochen Auswahl"
        render={
          <Button
            variant="outline"
            role="combobox"
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
        }
      />
      <DropdownMenuContent
        className="min-w-(--anchor-width) w-(--anchor-width) max-h-72 overflow-y-auto"
        align="start"
        side="bottom"
      >
        {weeks.map((week) => (
          <DropdownMenuItem
            key={week.value ?? "none"}
            onClick={() => {
              if (weekID === week.value) return;
              handleWeekChange(week.value ?? null);
            }}
          >
            {week.label}
            <Check
              className={cn(
                "ml-auto",
                weekID === week.value ? "opacity-100" : "opacity-0"
              )}
              aria-hidden="true"
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
