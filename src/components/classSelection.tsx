"use client";

import * as React from "react";
import { fetchUserClassesWithNames } from "@/utils/classes";
import { Check, ChevronsUpDown, School } from "lucide-react";

import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { updateUrl } from "@/utils/updateTimetableURL";
import { Specialization } from "@/types/specialization";
import { useSearchParams } from "next/navigation";

export function ClassSelectionCombobox() {
  const searchParams = useSearchParams();
  const classID = searchParams?.get("class") ?? null;
  const weekID = searchParams?.get("week") ?? null;
  const specParam = searchParams?.get("spec");
  const specialization: Specialization = (specParam ? Number(specParam) : 1) as Specialization;
  const [classes, setClasses] = React.useState<
    { label: string; value: string | null }[]
  >([]);
  const { user } = useUser();

  React.useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const result = await fetchUserClassesWithNames(user.id);
      setClasses(result || []);
    };
    load();
    // Also reload when class query changes so new joins appear immediately
  }, [user?.id, classID]);

  const router = useRouter();

  const handleClassChange = (classId: string | null) => {
    updateUrl(router, weekID, specialization, classId);
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
                <School className="size-4 text-white" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">Klasse</span>
                <span className="">
                  {classes.find((w) => w.value === classID)?.label}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width)"
            align="start"
          >
            {classes.map((classItem) => (
              <DropdownMenuItem
                key={classItem.value ?? "none"}
                onSelect={() => {
                  if (classItem.value === classID) return;
                  handleClassChange(classItem.value);
                }}
              >
                {classItem.label}
                <Check
                  className={cn(
                    "ml-auto",
                    classID === classItem.value ? "opacity-100" : "opacity-0",
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
