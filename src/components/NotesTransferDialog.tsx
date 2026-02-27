"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger
} from "@/components/ui/select";
// Convex
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import type { Group } from "@/types/group";
import { toast } from "sonner";
import { Calendar, Users2, Loader2, CheckCircle2, XCircle } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  // initial target week from URL (can be changed in dialog)
  targetWeekId: string;
  classId: string;
  initialGroup?: Group;
};

const groupOptions: { label: string; value: Group }[] = [
  { label: "Alle", value: 1 },
  { label: "Gruppe A", value: 2 },
  { label: "Gruppe B", value: 3 }
];

export function NotesTransferDialog({
  open,
  onOpenChangeAction: onOpenChange,
  targetWeekId,
  classId,
  initialGroup
}: Props) {
  const classWeeks = useQuery(
    api.weeks.listWeeks,
    open && classId ? { classId: classId as Id<"classes"> } : "skip"
  );
  const weeks = useMemo(() => {
    if (!classWeeks) return [] as { label: string; value: string }[];
    const mapped = classWeeks
      .map((w) => ({
        label: w.title,
        value: w.id as string,
        createdAt: w.createdAt
      }))
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return mapped;
  }, [classWeeks]);
  const [sourceWeekId, setSourceWeekId] = useState<string | null>(null);
  const [targetWeekIdState, setTargetWeekIdState] = useState<string | null>(
    null
  );
  const [group, setGroup] = useState<Group>(1);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const loadingWeeks = classWeeks === undefined;
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize defaults when weeks load and dialog opens
  useEffect(() => {
    if (!open || !weeks.length) return;
    setSourceWeekId((prev) => prev ?? weeks[0]?.value ?? null);
    setTargetWeekIdState((prev) => prev ?? targetWeekId ?? null);
  }, [open, weeks, targetWeekId, sourceWeekId]);

  // Reset group and counters on dialog open
  useEffect(() => {
    if (!open) return;
    // Reset preview counters
    setPreviewCount(null);
    setTotalCount(null);
    // Initialize group (defaults to provided or 1)
    setGroup((initialGroup ?? 1) as Group);
  }, [open, targetWeekId, initialGroup]);

  const canPreview = useMemo(
    () =>
      !!sourceWeekId &&
      !!targetWeekIdState &&
      !!group &&
      sourceWeekId !== targetWeekIdState,
    [sourceWeekId, targetWeekIdState, group]
  );

  const preview = useQuery(
    api.notes.transferPreview,
    open && canPreview
      ? {
          sourceWeekId: sourceWeekId as Id<"weeks">,
          targetWeekId: targetWeekIdState as Id<"weeks">,
          group: group
        }
      : "skip"
  );
  useEffect(() => {
    if (!canPreview) {
      setLoadingPreview(false);
      setPreviewCount(null);
      return;
    }
    setLoadingPreview(preview === undefined);
    if (preview) {
      setPreviewCount(preview.transferableCount ?? 0);
    }
  }, [preview, canPreview]);

  const transferMutation = useMutation(api.notes.transferNotes);
  const onSubmit = async () => {
    if (!canPreview || !sourceWeekId || !targetWeekIdState) {
      toast.error("Bitte Quelle, Ziel und Gruppe korrekt auswählen.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await transferMutation({
        sourceWeekId: sourceWeekId as Id<"weeks">,
        targetWeekId: targetWeekIdState as Id<"weeks">,
        group
      });
      const count = res.updatedCount ?? 0;
      toast.success(`${count} Notizen übertragen.`);
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>Notizen übertragen</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Wähle Quelle, Ziel und Gruppe.
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="min-w-0">
              <label className="text-sm mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 opacity-70" /> Quelle (Woche)
              </label>
              <Select
                value={sourceWeekId ?? ""}
                onValueChange={(v) => setSourceWeekId(v)}
                disabled={loadingWeeks}
              >
                <SelectTrigger
                  disabled={loadingWeeks}
                  className="
                    w-full
                    truncate"
                  aria-label="Quellwoche auswählen"
                >
                  <span className="flex-1 truncate text-left text-sm">
                    {loadingWeeks
                      ? "Lade Wochen..."
                      : (weeks.find((w) => w.value === sourceWeekId)?.label ??
                        "Woche wählen")}
                  </span>
                </SelectTrigger>
                <SelectContent
                  className="w-(--anchor-width) min-w-(--anchor-width) max-h-48"
                  alignItemWithTrigger={false}
                >
                  <SelectGroup>
                    {weeks.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0">
              <label className="text-sm mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 opacity-70" /> Ziel (Woche)
              </label>
              <Select
                value={targetWeekIdState ?? ""}
                onValueChange={(v) => setTargetWeekIdState(v)}
                disabled={loadingWeeks}
              >
                <SelectTrigger
                  disabled={loadingWeeks}
                  className="
                    w-full
                    truncate"
                  aria-label="Ziel Woche auswählen"
                >
                  <span className="flex-1 truncate text-left text-sm">
                    {loadingWeeks
                      ? "Lade Wochen..."
                      : (weeks.find((w) => w.value === targetWeekIdState)
                          ?.label ?? "Woche wählen")}
                  </span>
                </SelectTrigger>
                <SelectContent
                  className="w-(--anchor-width) min-w-(--anchor-width) max-h-48"
                  alignItemWithTrigger={false}
                >
                  <SelectGroup>
                    {weeks.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {sourceWeekId &&
                targetWeekIdState &&
                sourceWeekId === targetWeekIdState && (
                  <p className="mt-1 text-xs text-red-500">
                    Quelle und Ziel dürfen nicht identisch sein.
                  </p>
                )}
            </div>
          </div>
          <div>
            <label className="text-sm mb-1 flex items-center gap-2">
              <Users2 className="h-4 w-4 opacity-70" /> Gruppe
            </label>
            <Select
              value={String(group)}
              onValueChange={(v) => {
                const numValue = Number(v);
                if ([1, 2, 3].includes(numValue)) {
                  setGroup(numValue as Group);
                } else {
                  console.error(`Invalid group value: ${v}`);
                  setGroup(1);
                }
              }}
            >
              <SelectTrigger className="w-full overflow-hidden text-ellipsis">
                <span className="flex-1 truncate text-left text-sm">
                  {groupOptions.find((o) => String(o.value) === String(group))
                    ?.label ?? "Gruppe wählen"}
                </span>
              </SelectTrigger>
              <SelectContent
                align="end"
                className="w-(--anchor-width) min-w-(--anchor-width)"
                alignItemWithTrigger={false}
              >
                <SelectGroup>
                  {groupOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div
            className="rounded-md border p-3 bg-muted/60 text-sm flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            tabIndex={0}
            role="group"
            aria-describedby="notes-transfer-status-text"
          >
            {loadingPreview ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : canPreview ? (
              (previewCount ?? 0) > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )
            ) : (
              <Loader2 className="h-4 w-4 opacity-50" />
            )}
            <span id="notes-transfer-status-text" aria-live="polite">
              {canPreview ? (
                <>
                  <span className="font-semibold">{previewCount ?? 0}</span>
                  {typeof totalCount === "number"
                    ? ` von ${totalCount}`
                    : ""}{" "}
                  Notizen können übertragen werden.
                </>
              ) : (
                <span>Bitte Quelle und Ziel auswählen.</span>
              )}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Abbrechen
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!canPreview || submitting || (previewCount ?? 0) === 0}
          >
            {submitting ? "Übertrage..." : "Übertragen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
