"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NoteItemData {
  id: string;
  text: string;
}

interface NoteItemProps {
  item: NoteItemData;
  isActive: boolean;
  onToggle: () => void;
  onChange?: (text: string) => void;
  onDelete: () => void;
  isSaving?: boolean;
}

export function NoteItem({
  item,
  isActive,
  onToggle,
  onChange,
  onDelete,
  isSaving,
}: NoteItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleToggle = () => {
    setIsExiting(true);
    setTimeout(() => {
      onToggle();
      setIsExiting(false);
    }, 300);
  };

  const handleDelete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDelete();
    }, 300);
  };

  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-md border border-input px-3 py-2 transition-all duration-300 ease-in-out",
        isActive ? "bg-background/40" : "bg-background/20 opacity-75",
        isEntering && "opacity-0 translate-x-4",
        isExiting &&
          "opacity-0 -translate-x-4 h-0 py-0 overflow-hidden border-0 m-0",
      )}
    >
      <Checkbox
        checked={!isActive}
        onCheckedChange={handleToggle}
        aria-label={
          isActive ? "Als erledigt archivieren" : "Zurück zu aktiv verschieben"
        }
        className="h-5 w-5 shrink-0"
      />
      <Textarea
        className={cn(
          "flex-1 min-w-0 min-h-7 resize-none bg-transparent px-3 py-2 text-sm focus-visible:outline-none border-none shadow-none focus-visible:ring-0 whitespace-pre-wrap [word-break:break-word]",
          !isActive && "line-through",
        )}
        style={{ overflowWrap: "anywhere" }}
        value={item.text}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={isActive ? "Notiz eingeben..." : undefined}
        disabled={isSaving || !isActive}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        aria-label={isActive ? "Notiz löschen" : "Archivierte Notiz löschen"}
        className="shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
