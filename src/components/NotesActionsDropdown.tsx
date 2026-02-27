"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Copy, Send, Ellipsis, LucideNotebookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModeStore } from "@/store/useModeStore";
import { NotesTransferDialog } from "@/components/NotesTransferDialog";
// Selection state from Zustand store
import { useCurrentWeek } from "@/store/useWeekStore";
import { useCurrentGroup } from "@/store/useGroupStore";
import { useCurrentClass } from "@/store/useClassStore";
import { allDays } from "@/constants/allDays";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

type Props = {
  getNotesAction: () => string | null | undefined;
  onOpenClassNotesAction?: () => void;
};

export function NotesActionsDropdown({
  getNotesAction,
  onOpenClassNotesAction
}: Props) {
  useModeStore();
  const weekID = useCurrentWeek();
  const classID = useCurrentClass();
  const initialGroup = useCurrentGroup();
  const [openTransfer, setOpenTransfer] = React.useState(false);
  const weekNotes = useQuery(
    api.notes.getWeekNotes,
    weekID && initialGroup != null
      ? { weekId: weekID as Id<"weeks">, group: Number(initialGroup) }
      : "skip"
  );

  const handleCopy = async () => {
    // Block copying when no week is selected
    if (!weekID) {
      toast.message("Keine Woche ausgewählt");
      return;
    }
    // Warte, bis die Daten geladen sind
    if (weekNotes === undefined) {
      toast.message("Notizen werden geladen...");
      return;
    }
    // If a week is selected, copy formatted weekly notes; otherwise fallback to current notes
    if (weekID && weekNotes) {
      if (!weekNotes.notes?.length) {
        toast.message("Keine Notizen gefunden");
        return;
      }
      // Transform Convex result
      const entries = weekNotes.notes
        .map((n) => ({
          day: n.day,
          hour: n.hour,
          subject: n.subject?.trim() ?? "",
          teacher: n.teacher?.trim() ?? "",
          notes: n.notes?.trim() ?? "",
          groups: n.groups ?? []
        }))
        .filter((e) => e.notes);
      if (!entries.length) {
        toast.message("Keine Notizen gefunden");
        return;
      }
      const byDay = new Map<string, typeof entries>();
      for (const e of entries) {
        const list = byDay.get(e.day) ?? ([] as typeof entries);
        list.push(e);
        byDay.set(e.day, list);
      }
      const compareEntries = (
        a: (typeof entries)[0],
        b: (typeof entries)[0]
      ) => {
        if (a.hour !== b.hour) return a.hour - b.hour;

        const getMinGroup = (groups: number[]) =>
          Array.isArray(groups) && groups.length ? Math.min(...groups) : 1;

        const groupOrder = (s: number) => (s === 2 ? 0 : s === 3 ? 1 : 2);

        const ag = getMinGroup(a.groups);
        const bg = getMinGroup(b.groups);

        if (ag !== bg) return groupOrder(ag) - groupOrder(bg);
        return 0;
      };
      for (const [, list] of byDay) {
        list.sort(compareEntries);
      }
      const dayOrder = allDays.filter((d) => byDay.has(d));
      const out: string[] = [];
      for (const d of dayOrder) {
        const list = byDay.get(d);
        if (!list) continue;
        if (!list.length) continue;
        out.push(`${d}:`);
        for (const it of list) {
          const label =
            it.subject && it.teacher
              ? `${it.subject}/${it.teacher}`
              : it.subject || it.teacher || "Notiz";
          out.push(`${label}: ${it.notes}`);
        }
        out.push("");
      }
      const text = out.join("\n").trim();
      if (!text) {
        toast.message("Keine Notizen gefunden");
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Wochen-Notizen kopiert");
      } catch (error) {
        toast.error("Kopieren fehlgeschlagen");
        console.error("Clipboard-Fehler:", error);
      }
      return;
    }

    // Fallback: copy current notes
    const notes = (getNotesAction() ?? "").trim();
    if (!notes) {
      toast.message("Keine Notizen vorhanden");
      return;
    }
    try {
      await navigator.clipboard.writeText(notes);
      toast.success("Notizen kopiert");
    } catch (error) {
      toast.error("Kopieren fehlgeschlagen");
      console.error("Clipboard-Fehler:", error);
    }
  };

  const handleTransfer = async () => {
    // Open dialog; target week is current active week
    setOpenTransfer(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size={"icon"}
              aria-label="Notizen Aktionen"
            >
              <Ellipsis />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-auto max-w-56">
          <DropdownMenuItem onClick={handleCopy} disabled={!weekID}>
            <Copy className="mr-2" />
            Notizen kopieren
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleTransfer}
            disabled={!weekID || !classID}
          >
            <Send className="mr-2" />
            Notizen übertragen
          </DropdownMenuItem>
          {onOpenClassNotesAction && (
            <DropdownMenuItem
              onClick={() => {
                if (!classID) return;
                onOpenClassNotesAction?.();
              }}
              disabled={!classID}
            >
              <LucideNotebookText className="mr-2" />
              Klassen Notizen
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {weekID && classID && (
        <NotesTransferDialog
          open={openTransfer}
          onOpenChangeAction={setOpenTransfer}
          targetWeekId={weekID}
          classId={classID}
          initialGroup={initialGroup}
        />
      )}
    </>
  );
}
