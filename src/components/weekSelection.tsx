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
import { Specialization } from "@/types/specialization";
import { updateUrl } from "@/utils/updateTimetableURL";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function WeekSelectionCombobox() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const specParam = searchParams?.get("spec");
  const specialization: Specialization = (specParam ? Number(specParam) : 1) as Specialization;
  const weekID = searchParams?.get("week") ?? null;
  const classID = searchParams?.get("class") ?? null;
  const [open, setOpen] = React.useState(false);
  const [weeks, setWeeks] = React.useState<
    { label: string; value: string | null }[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchWeeks = async () => {
      setLoading(true);
      if (user?.id && classID) {
        const result = await fetchWeekIDsWithNames(user.id, classID);
        setWeeks(result || []);
      } else {
        setWeeks([{ label: "Keine Woche", value: null }]);
      }
      setLoading(false);
    };
    fetchWeeks();
  }, [user?.id, classID]);

  const router = useRouter();

  const handleWeekChange = (weekId: string | null | string) => {
    const nextWeek = weekId && weekId.length > 0 ? (weekId as string) : null;
    updateUrl(router, nextWeek, specialization, classID);
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
