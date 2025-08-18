"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, Share2, Send, Ellipsis, NotebookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModeStore } from "@/store/useModeStore";

type Props = {
  getNotes: () => string | null | undefined;
};

export default function NotesActionsDropdown({ getNotes }: Props) {
  const { mode, toggleMode } = useModeStore();
  const handleCopy = async () => {
    const notes = getNotes() ?? "";
    try {
      await navigator.clipboard.writeText(notes);
      // optional: show toast
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const handleShare = async () => {
    const notes = getNotes() ?? "";
    if (navigator.share) {
      try {
        await navigator.share({ text: notes, title: "Stundenplan Notizen" });
      } catch (e) {
        console.error("Share cancelled or failed", e);
      }
      return;
    }

    // Fallback: copy to clipboard
    await handleCopy();
  };

  const handleTransfer = async () => {
    const notes = getNotes() ?? "";
    try {
      // Placeholder: POST to /api/notes/transfer - implement server-side
      await fetch(`/api/week/notes/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    } catch (e) {
      console.error("Transfer failed", e);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={"icon"}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={toggleMode}>
          {mode === "notes" ? (
            <Copy className="mr-2" />
          ) : (
            <NotebookText className="mr-2" />
          )}
          {mode === "notes" ? "Kopieren Modus" : "Notizen Modus"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleCopy}>
          <Copy className="mr-2" />
          Notizen kopieren
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleShare}>
          <Share2 className="mr-2" />
          Notizen teilen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleTransfer}>
          <Send className="mr-2" />
          Notizen übertragen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
