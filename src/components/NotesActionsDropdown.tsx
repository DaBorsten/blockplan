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
import NotesTransferDialog from "@/components/NotesTransferDialog";
import { useSearchParams } from "next/navigation";

type Props = {
  getNotes: () => string | null | undefined;
};

export default function NotesActionsDropdown({ getNotes }: Props) {
  const { mode, toggleMode } = useModeStore();
  const searchParams = useSearchParams();
  const weekID = searchParams.get("week");
  const specParam = searchParams.get("spec");
  const initialSpec = specParam ? Number(specParam) : 1;
  const classID = searchParams.get("class");
  const [openTransfer, setOpenTransfer] = React.useState(false);
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
    // Open dialog; target week is current active week
    setOpenTransfer(true);
  };

  return (
    <>
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
          <DropdownMenuItem onSelect={handleTransfer} disabled={!weekID || !classID}>
            <Send className="mr-2" />
            Notizen übertragen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    {weekID && classID && (
        <NotesTransferDialog
          open={openTransfer}
          onOpenChange={setOpenTransfer}
          targetWeekId={weekID}
          classId={classID}
      initialSpecialization={initialSpec}
        />
      )}
    </>
  );
}
