"use client";

import * as React from "react";
import { fetchWeekIDsWithNames } from "@/utils/weeks";
import { Check, ChevronsUpDown, School } from "lucide-react";

import { cn } from "@/lib/utils";
import { useWeekIDStore } from "@/store/useWeekIDStore";
import { useSpecializationStore } from "@/store/useSpecializationStore";
import { updateUrl } from "@/utils/updateTimetableURL";
import { useRouter } from "next/navigation";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function ClassSelectionCombobox() {
  const { weekID, setWeekID } = useWeekIDStore();
  const { specialization } = useSpecializationStore();
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
    updateUrl(router, weekId, specialization);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <School className="size-4 text-foreground"  />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">Klasse</span>
                <span className="">
                  {weeks.find((w) => w.value === weekID)?.label}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width)"
            align="start"
          >
            {weeks.map((week) => (
              <DropdownMenuItem
                key={week.value ?? "none"}
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
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
