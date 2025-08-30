"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchWeekIDsWithNames } from "@/utils/weeks";
import type { Specialization } from "@/types/specialization";
import { toast } from "sonner";
import { Calendar, Users2, Loader2, CheckCircle2, XCircle } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // initial target week from URL (can be changed in dialog)
  targetWeekId: string;
  classId: string;
  initialSpecialization?: number;
};

const specOptions: { label: string; value: Specialization }[] = [
  { label: "Alle", value: 1 },
  { label: "Gruppe A", value: 2 },
  { label: "Gruppe B", value: 3 },
];

export default function NotesTransferDialog({
  open,
  onOpenChange,
  targetWeekId,
  classId,
  initialSpecialization,
}: Props) {
  const [weeks, setWeeks] = useState<{ label: string; value: string | null }[]>(
    [],
  );
  const [sourceWeekId, setSourceWeekId] = useState<string | null>(null);
  const [targetWeekIdState, setTargetWeekIdState] = useState<string | null>(
    null,
  );
  const [specialization, setSpecialization] = useState<Specialization>(1);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadWeeks = async () => {
      if (!classId) return;
      setLoadingWeeks(true);
      try {
        const data = await fetchWeekIDsWithNames(classId);
        const list = (data || []).filter((w) => w.value);
        setWeeks(list as { label: string; value: string | null }[]);
        if (open) {
          // Set defaults only when dialog is open
          setSourceWeekId((prev) => prev ?? list[0]?.value ?? null);
          setTargetWeekIdState((prev) => prev ?? targetWeekId);
        }
      } catch (e) {
        console.error("Wochen laden fehlgeschlagen", e);
        toast.error("Wochen konnten nicht geladen werden");
      } finally {
        setLoadingWeeks(false);
      }
    };
    if (open) loadWeeks();
  }, [open, classId, targetWeekId]);

  // Reset specialization and counters on dialog open
  useEffect(() => {
    if (!open) return;
    // Reset preview counters
    setPreviewCount(null);
    setTotalCount(null);
    // Initialize specialization (defaults to provided or 1)
    setSpecialization((initialSpecialization as Specialization) || 1);
  }, [open, targetWeekId, initialSpecialization]);

  const canPreview = useMemo(
    () =>
      !!sourceWeekId &&
      !!targetWeekIdState &&
      !!specialization &&
      sourceWeekId !== targetWeekIdState,
    [sourceWeekId, targetWeekIdState, specialization],
  );

  useEffect(() => {
    const run = async () => {
      if (!canPreview) {
        setPreviewCount(null);
        setTotalCount(null);
        return;
      }
      setLoadingPreview(true);
      try {
        const params = new URLSearchParams({
          sourceWeekId: sourceWeekId!,
          targetWeekId: targetWeekIdState!,
          specialization: String(specialization),
        });
        const res = await fetch(
          `/api/week/notes/transfer?${params.toString()}`,
        );
        const json = await res.json();
        if (res.ok) {
          setPreviewCount(json.transferableCount ?? 0);
          setTotalCount(json.totalCount ?? null);
        } else {
          setPreviewCount(null);
          setTotalCount(null);
          console.error(json.error || "Preview failed");
        }
      } finally {
        setLoadingPreview(false);
      }
    };
    run();
  }, [canPreview, sourceWeekId, targetWeekIdState, specialization]);

  const onSubmit = async () => {
    if (!canPreview) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/week/notes/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceWeekId: sourceWeekId!,
          targetWeekId: targetWeekIdState!,
          specialization,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Transfer failed");
      const count = json.updatedCount ?? 0;
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Notizen übertragen</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Wähle Quelle, Ziel und Spezialisierung.
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div className="min-w-0">
              <label className="text-sm mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 opacity-70" /> Quelle (Woche)
              </label>
              <Select
                value={sourceWeekId ?? undefined}
                onValueChange={(v) => setSourceWeekId(v)}
                disabled={loadingWeeks}
              >
                <SelectTrigger
                  disabled={loadingWeeks}
                  className="w-full overflow-hidden text-ellipsis"
                >
                  <SelectValue
                    placeholder={
                      loadingWeeks ? "Lade Wochen..." : "Woche wählen"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {weeks.map((w) => (
                      <SelectItem key={w.value!} value={w.value!}>
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
                value={targetWeekIdState ?? undefined}
                onValueChange={(v) => setTargetWeekIdState(v)}
                disabled={loadingWeeks}
              >
                <SelectTrigger
                  disabled={loadingWeeks}
                  className="w-full overflow-hidden text-ellipsis"
                >
                  <SelectValue
                    placeholder={
                      loadingWeeks ? "Lade Wochen..." : "Woche wählen"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {weeks.map((w) => (
                      <SelectItem key={w.value!} value={w.value!}>
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
              <Users2 className="h-4 w-4 opacity-70" /> Spezialisierung
            </label>
            <Select
              value={String(specialization)}
              onValueChange={(v) =>
                setSpecialization(Number(v) as Specialization)
              }
            >
              <SelectTrigger className="w-full overflow-hidden text-ellipsis">
                <SelectValue placeholder="Spezialisierung wählen" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  {specOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border p-3 bg-muted/60 text-sm flex items-center gap-2">
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
            <span>
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
