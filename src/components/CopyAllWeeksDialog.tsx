"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { allDays } from "@/constants/allDays";
import { Copy } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
};

export function CopyAllWeeksDialog({ open, onOpenChange, classId }: Props) {
  const weeks = useQuery(
    api.weeks.listWeeks,
    open ? { classId: classId as Id<"classes"> } : "skip"
  );

  const sortedWeeks = useMemo(
    () => weeks ? [...weeks].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)) : undefined,
    [weeks]
  );

  // Track deselected IDs — default is "all selected"
  const [deselectedIds, setDeselectedIds] = useState<Set<string>>(new Set());

  const isSelected = (id: string) => !deselectedIds.has(id);

  const selectedIdsArray = useMemo(
    () => sortedWeeks
      ? sortedWeeks.filter((w) => isSelected(w.id)).map((w) => w.id as Id<"weeks">)
      : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortedWeeks, deselectedIds]
  );

  const allWeeksNotes = useQuery(
    api.notes.getAllWeeksNotes,
    open && weeks && selectedIdsArray.length > 0
      ? {
        classId: classId as Id<"classes">,
        weekIds: selectedIdsArray,
        group: 1,
      }
      : "skip"
  );

  const toggleAll = (checked: boolean) => {
    if (!sortedWeeks) return;
    if (checked) {
      setDeselectedIds(new Set());
    } else {
      setDeselectedIds(new Set(sortedWeeks.map((w) => w.id)));
    }
  };

  const toggleWeek = (id: string, checked: boolean) => {
    setDeselectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = async () => {
    if (!allWeeksNotes) {
      toast.message("Notizen werden geladen...");
      return;
    }

    const compareEntries = (
      a: { hour: number; groups: number[] },
      b: { hour: number; groups: number[] }
    ) => {
      if (a.hour !== b.hour) return a.hour - b.hour;
      const getMinGroup = (groups: number[]) =>
        Array.isArray(groups) && groups.length ? Math.min(...groups) : 1;
      const groupOrder = (s: number) => (s === 2 ? 0 : s === 3 ? 1 : 2);
      return groupOrder(getMinGroup(a.groups)) - groupOrder(getMinGroup(b.groups));
    };

    const sections: string[] = [];
    const notesByWeekId = new Map(allWeeksNotes.map((w) => [w.weekId, w]));

    for (const week of sortedWeeks ?? []) {
      if (!isSelected(week.id)) continue;
      const weekData = notesByWeekId.get(week.id as Id<"weeks">);
      if (!weekData) continue;
      const entries = weekData.notes
        .map((n) => ({
          day: n.day,
          hour: n.hour,
          subject: n.subject?.trim() ?? "",
          teacher: n.teacher?.trim() ?? "",
          notes: n.notes?.trim() ?? "",
          groups: n.groups ?? [],
        }))
        .filter((e) => e.notes);

      if (!entries.length) continue;

      const byDay = new Map<string, typeof entries>();
      for (const e of entries) {
        const list = byDay.get(e.day) ?? [];
        list.push(e);
        byDay.set(e.day, list);
      }
      for (const [, list] of byDay) list.sort(compareEntries);

      const dayOrder = allDays.filter((d) => byDay.has(d));
      const weekLines: string[] = [`=== ${weekData.weekTitle} ===`];

      for (const d of dayOrder) {
        const list = byDay.get(d);
        if (!list?.length) continue;
        if (weekLines.length > 1) weekLines.push("");
        weekLines.push(`${d}:`);
        for (const it of list) {
          const label =
            it.subject && it.teacher
              ? `${it.subject}/${it.teacher}`
              : it.subject || it.teacher || "Notiz";
          weekLines.push(`${label}: ${it.notes}`);
        }
      }

      sections.push(weekLines.join("\n"));
    }

    if (!sections.length) {
      toast.message("Keine Notizen gefunden");
      return;
    }

    const text = sections.join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(
        `Notizen von ${sections.length} ${sections.length === 1 ? "Woche" : "Wochen"} kopiert`
      );
      onOpenChange(false);
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  const allSelected = sortedWeeks ? deselectedIds.size === 0 : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Notizen aller Wochen kopieren</DialogTitle>
          <DialogDescription>
            Wähle die Wochen aus, deren Notizen kopiert werden sollen.
          </DialogDescription>
        </DialogHeader>

        {!sortedWeeks ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : sortedWeeks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Keine Wochen vorhanden
          </p>
        ) : (
          <div className="flex flex-col min-h-0 flex-1 overflow-hidden rounded-lg border">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/50 border-b shrink-0">
              <Checkbox
                id="select-all"
                checked={allSelected ? true : false}
                onCheckedChange={(v) => toggleAll(!!v)}
              />
              <Label htmlFor="select-all" className="font-medium cursor-pointer text-sm">
                Alle auswählen
              </Label>
            </div>
            <div className="overflow-y-auto flex-1">
              {sortedWeeks.map((w, i) => (
                <div
                  key={w.id}
                  className={`flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors${i < sortedWeeks.length - 1 ? " border-b border-border/50" : ""}`}
                >
                  <Checkbox
                    id={`week-${w.id}`}
                    checked={isSelected(w.id)}
                    onCheckedChange={(v) => toggleWeek(w.id, !!v)}
                  />
                  <Label htmlFor={`week-${w.id}`} className="cursor-pointer font-normal text-sm flex-1">
                    {w.title}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 justify-end shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Abbrechen
          </Button>
          <Button
            size="sm"
            className="cursor-pointer"
            disabled={selectedIdsArray.length === 0 || !allWeeksNotes}
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4 mr-1" />
            Kopieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
