"use client";

import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const themeOptions = [
  { value: "light", label: "Hell", icon: <Sun className="h-4 w-4" /> },
  { value: "dark", label: "Dunkel", icon: <Moon className="h-4 w-4" /> },
  { value: "system", label: "System", icon: <Laptop className="h-4 w-4" /> },
];

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const current = themeOptions.find((o) => o.value === (theme ?? "system"));

  return (
    <Select
      value={theme ?? "system"}
      onValueChange={(val) => {
        if (val) setTheme(val);
      }}
    >
      <SelectTrigger aria-label="Theme wählen" className="w-35">
        <span className="inline-flex items-center gap-2">
          {current?.icon}
          {current?.label}
        </span>
      </SelectTrigger>
      <SelectContent
        className="w-(--anchor-width) min-w-(--anchor-width)"
        align="start"
        side="bottom"
        alignItemWithTrigger={false}
      >
        <SelectGroup>
          <SelectItem value="light">
            <span className="inline-flex items-center gap-2">
              <Sun className="h-4 w-4" /> Hell
            </span>
          </SelectItem>
          <SelectItem value="dark">
            <span className="inline-flex items-center gap-2">
              <Moon className="h-4 w-4" /> Dunkel
            </span>
          </SelectItem>
          <SelectItem value="system">
            <span className="inline-flex items-center gap-2">
              <Laptop className="h-4 w-4" /> System
            </span>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
