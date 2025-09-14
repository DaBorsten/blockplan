"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Select
      value={theme ?? "system"}
      onValueChange={(val: string) => setTheme(val)}
    >
      <SelectTrigger aria-label="Theme wählen" className="w-[140px]">
        <SelectValue placeholder="Theme" className="flex items-center gap-2" />
      </SelectTrigger>
      <SelectContent
        className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] p-0"
        align="start"
      >
        <SelectItem value="light" className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2">
            <Sun className="h-4 w-4" /> Hell
          </span>
        </SelectItem>
        <SelectItem value="dark" className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2">
            <Moon className="h-4 w-4" /> Dunkel
          </span>
        </SelectItem>
        <SelectItem value="system" className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2">
            <Laptop className="h-4 w-4" /> System
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
