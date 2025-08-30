"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, Send, Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModeStore } from "@/store/useModeStore";
import NotesTransferDialog from "@/components/NotesTransferDialog";
// Selection state from Zustand store
import { useCurrentWeek } from "@/store/useWeekStore";
import { useCurrentGroup } from "@/store/useGroupStore";
import { useCurrentClass } from "@/store/useClassStore";
import { allDays } from "@/constants/allDays";
import { toast } from "sonner";

type Props = {
  getNotes: () => string | null | undefined;
};

export default function NotesActionsDropdown({ getNotes }: Props) {
  useModeStore();
  const weekID = useCurrentWeek();
  const classID = useCurrentClass();
  const initialSpec = useCurrentGroup();
  const [openTransfer, setOpenTransfer] = React.useState(false);
  const handleCopy = async () => {
    // Block copying when no week is selected
    if (!weekID) {
      toast.message("Keine Woche ausgewählt");
      return;
    }
    // If a week is selected, copy formatted weekly notes; otherwise fallback to current notes
    if (weekID) {
      try {
        const params = new URLSearchParams({ week_id: weekID, specialization: String(initialSpec) });
        const res = await fetch(`/api/week/notes/week?${params.toString()}`);
        if (!res.ok) throw new Error("Fehler beim Laden der Wochen-Notizen");
        const json = await res.json();

        // Robustly extract rows from API response (supports result, result.rows, and columns+array rows)
        type RawResult = { rows?: unknown[]; columns?: string[] } | unknown[] | null | undefined;
        const raw: RawResult = (json && (json.data as RawResult)) ?? (json as RawResult);
        let rowsObj: Array<Record<string, unknown>> = [];
        if (Array.isArray(raw)) {
          // Either array of objects or array rows with separate columns attached on json
          if (raw.length > 0 && typeof raw[0] === "object" && !Array.isArray(raw[0])) {
            rowsObj = raw as Array<Record<string, unknown>>;
          }
        } else if (raw && typeof raw === "object") {
          const maybeRows = (raw as Record<string, unknown>).rows as unknown[] | undefined;
          const maybeCols = (raw as Record<string, unknown>).columns as string[] | undefined;
          if (Array.isArray(maybeRows)) {
            if (maybeRows.length > 0 && Array.isArray(maybeRows[0]) && Array.isArray(maybeCols)) {
              // rows are arrays -> map to objects using columns
              rowsObj = (maybeRows as unknown[][]).map((arr) => {
                const o: Record<string, unknown> = {};
                for (let i = 0; i < maybeCols.length; i++) o[maybeCols[i]] = arr[i];
                return o;
              });
            } else if (maybeRows.length > 0 && typeof maybeRows[0] === "object") {
              rowsObj = maybeRows as Array<Record<string, unknown>>;
            }
          }
        }

        // Normalize and validate
        type Row = {
          day: string | number | null | undefined;
          hour: number | string | null | undefined;
          subject: string | null | undefined;
          teacher: string | null | undefined;
          notes: string | null | undefined;
          specialization: number | string | null | undefined;
        };
        const toDayName = (d: Row["day"]): string | undefined => {
          // Accept German names, numeric strings, and numbers. Prefer mapped names.
          if (typeof d === "string") {
            const t = d.trim();
            // Map numeric string if applicable, else accept if it's a known name
            const n = Number(t);
            if (!Number.isNaN(n)) {
              if (n >= 1 && n <= allDays.length) return allDays[n - 1];
              if (n >= 0 && n < allDays.length) return allDays[n];
            }
            if (allDays.includes(t)) return t;
          } else if (typeof d === "number") {
            const n = d;
            if (n >= 1 && n <= allDays.length) return allDays[n - 1];
            if (n >= 0 && n < allDays.length) return allDays[n];
          }
          return undefined;
        };

        const entries = rowsObj
          .map((r) => ({
            day: toDayName((r as Row).day),
            hour: Number((r as Row).hour ?? 0),
            subject: String((r as Row).subject ?? "").trim(),
            teacher: String((r as Row).teacher ?? "").trim(),
            notes: String((r as Row).notes ?? "").trim(),
            specialization: Number((r as Row).specialization ?? 1),
          }))
          .filter((e) => !!e.day && !!e.notes) as Array<{
          day: string;
          hour: number;
          subject: string;
          teacher: string;
          notes: string;
          specialization: number;
        }>;

        if (!entries.length) {
          toast.message("Keine Notizen gefunden");
          return;
        }

        // Group by day
        const byDay = new Map<string, typeof entries>();
        for (const e of entries) {
          const list = byDay.get(e.day) ?? [];
          list.push(e);
          byDay.set(e.day, list);
        }

        // Sort within day: hour asc, then specialization (2 before 3, others last)
        const specOrder = (s: number) => (s === 2 ? 0 : s === 3 ? 1 : 2);
        for (const [, list] of byDay) {
          list.sort((a, b) => {
            if (a.hour !== b.hour) return a.hour - b.hour;
            if (a.specialization !== b.specialization) return specOrder(a.specialization) - specOrder(b.specialization);
            return 0;
          });
        }

        // Emit only days that exist, ordered Mo..Fr
        const dayOrder = allDays.filter((d) => byDay.has(d));
        const out: string[] = [];
        for (const d of dayOrder) {
          const list = byDay.get(d)!;
          if (!list.length) continue;
          out.push(`${d}:`);
          for (const it of list) {
            const label = it.subject && it.teacher ? `${it.subject}/${it.teacher}` : it.subject || it.teacher || "Notiz";
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
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          try {
            document.execCommand("copy");
          } finally {
            document.body.removeChild(ta);
          }
        }
        toast.success("Wochen-Notizen kopiert");
        return;
      } catch (e) {
        console.error(e);
        toast.error("Kopieren fehlgeschlagen");
      }
    }

    // Fallback: copy current notes
    const notes = (getNotes() ?? "").trim();
    if (!notes) {
      toast.message("Keine Notizen vorhanden");
      return;
    }
    try {
      await navigator.clipboard.writeText(notes);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = notes;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(ta);
      }
    }
    toast.success("Notizen kopiert");
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
          <DropdownMenuItem onSelect={handleCopy} disabled={!weekID}>
            <Copy className="mr-2" />
            Notizen kopieren
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
