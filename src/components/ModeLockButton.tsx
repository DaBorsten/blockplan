"use client";

import { Button } from "@/components/ui/button";
import { useModeStore } from "@/store/useModeStore";
import { Pencil, PencilOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ModeLockButton() {
  const { mode, toggleMode } = useModeStore();
  const isEditable = mode === "notes";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMode}
          aria-label={
            isEditable
              ? "Bearbeitung deaktivieren (nur kopieren)"
              : "Bearbeiten aktivieren"
          }
        >
          {isEditable ? (
            <PencilOff className="h-4 w-4" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isEditable ? "Bearbeiten deaktivieren" : "Bearbeiten aktivieren"}
      </TooltipContent>
    </Tooltip>
  );
}
