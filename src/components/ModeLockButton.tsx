"use client";

import { Button } from "@/components/ui/button";
import { useModeStore } from "@/store/useModeStore";
import { Lock, Unlock } from "lucide-react";
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
              ? "Bearbeiten erlaubt (entsperrt)"
              : "Nur Kopieren (gesperrt)"
          }
        >
          {isEditable ? (
            <Unlock className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isEditable ? "Notizen bearbeiten erlaubt" : "Nur Kopieren"}
      </TooltipContent>
    </Tooltip>
  );
}
