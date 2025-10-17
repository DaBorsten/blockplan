"use client";

import * as React from "react";
import { Check, ChevronsUpDown, School } from "lucide-react";

import { cn } from "@/lib/utils";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
// updateUrl replaced by nuqs hooks
import { useCurrentClass, useSetClass } from "@/store/useClassStore";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function ClassSelectionCombobox() {
  const classID = useCurrentClass();
  const setClassID = useSetClass();
  // Clerk user available if later needed for role-based filtering

  // Safe Query (liefert { initialized, classes })
  const queryArgs = React.useMemo(() => ({}) as const, []);
  const classesSafe = useQuery(api.classes.listClassesSafe, queryArgs);

  const isLoading = classesSafe === undefined;
  const isInitializing = classesSafe !== undefined && !classesSafe.initialized;
  const classes = React.useMemo(() => {
    if (isLoading) return [] as { label: string; value: string | null }[]; // separate rendering branch
    if (isInitializing) return [{ label: "Init…", value: null }];
    const mapped = classesSafe!.classes
      .map((c) => ({ label: c.class_title, value: c.class_id as string }))
      .sort((a, b) => a.label.localeCompare(b.label, "de"));
    return [{ label: "Keine Klasse", value: null }, ...mapped];
  }, [isLoading, isInitializing, classesSafe]);

  React.useEffect(() => {
    if (isLoading || isInitializing) return;
    const valid = new Set(classes.map((c) => c.value));
    if (classID && !valid.has(classID)) {
      setClassID(null);
    }
  }, [isLoading, isInitializing, classes, classID, setClassID]);

  const handleClassChange = (classId: Id<"classes"> | null) => {
    setClassID(classId);
  };

  const selectedLabel = React.useMemo(
    () => classes.find((w) => w.value === classID)?.label,
    [classes, classID],
  );

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
              <div className="flex flex-col gap-0.5 leading-none min-w-0">
                <span className="font-medium">Klasse</span>
                <span className="min-h-[1rem] inline-flex items-center min-w-0 max-w-full">
                  {isLoading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : isInitializing ? (
                    <span className="text-muted-foreground">Init…</span>
                  ) : selectedLabel ? (
                    <span
                      className="block overflow-hidden text-ellipsis whitespace-nowrap min-w-0 max-w-full"
                      title={selectedLabel}
                    >
                      {selectedLabel}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">(Keine)</span>
                  )}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-[var(--radix-dropdown-menu-trigger-width)] w-[var(--radix-dropdown-menu-trigger-width)]"
            align="start"
            side="bottom"
          >
            {isLoading && (
              <div className=" flex flex-1 gap-1 flex-col">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            )}
            {!isLoading &&
              classes.map((classItem) => (
                <DropdownMenuItem
                  key={classItem.value ?? "__none__"}
                  onSelect={(e) => {
                    if (classItem.value === classID) {
                      e.preventDefault();
                      return;
                    }
                    handleClassChange(classItem.value as Id<"classes"> | null);
                  }}
                  disabled={isInitializing}
                >
                  {classItem.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      classID === classItem.value ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden="true"
                  />
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
