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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@clerk/nextjs";
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

export default function NotesTransferDialog({ open, onOpenChange, targetWeekId, classId, initialSpecialization }: Props) {
  const { user } = useUser();
  const [weeks, setWeeks] = useState<{ label: string; value: string | null }[]>([]);
  const [sourceWeekId, setSourceWeekId] = useState<string | null>(null);
  const [targetWeekIdState, setTargetWeekIdState] = useState<string | null>(null);
  const [specialization, setSpecialization] = useState<Specialization>(1);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadWeeks = async () => {
      if (!user?.id || !classId) return;
      setLoadingWeeks(true);
      const data = await fetchWeekIDsWithNames(user.id, classId);
      const list = (data || []).filter((w) => w.value);
      setWeeks(list as { label: string; value: string | null }[]);
      // default source is first available when opening
      setSourceWeekId((prev) => (open ? (list[0]?.value ?? null) : prev));
      // target defaults to current active when opening
      setTargetWeekIdState((prev) => (open ? targetWeekId : prev));
      setLoadingWeeks(false);
    };
    if (open) loadWeeks();
  }, [open, user?.id, classId, targetWeekId]);

  // Reset specialization and source/target on dialog open
  useEffect(() => {
    if (!open) return;
    // reset explicitly on open
    setSourceWeekId(null);
    setTargetWeekIdState(targetWeekId);
    if (initialSpecialization) setSpecialization(initialSpecialization as Specialization);
    setPreviewCount(null);
    setTotalCount(null);
  }, [open, targetWeekId, initialSpecialization]);

  const canPreview = useMemo(() => !!sourceWeekId && !!targetWeekIdState && !!specialization, [sourceWeekId, targetWeekIdState, specialization]);

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
        const res = await fetch(`/api/week/notes/transfer?${params.toString()}`);
        const json = await res.json();
        if (res.ok) {
          setPreviewCount(json.transferableCount ?? 0);
          setTotalCount(json.totalCount ?? null);
        }
        else {
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
        body: JSON.stringify({ sourceWeekId: sourceWeekId!, targetWeekId: targetWeekIdState!, specialization }),
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
          <p className="text-sm text-muted-foreground">Wähle Quelle, Ziel und Spezialisierung.</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-sm mb-1 flex items-center gap-2"><Calendar className="h-4 w-4 opacity-70" /> Quelle (Woche)</label>
              <Select value={sourceWeekId ?? undefined} onValueChange={(v) => setSourceWeekId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingWeeks ? "Lade Wochen..." : "Woche wählen"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {weeks.map((w) => (
                      <SelectItem key={w.value!} value={w.value!}>{w.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm mb-1 flex items-center gap-2"><Calendar className="h-4 w-4 opacity-70" /> Ziel (Woche)</label>
              <Select value={targetWeekIdState ?? undefined} onValueChange={(v) => setTargetWeekIdState(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingWeeks ? "Lade Wochen..." : "Woche wählen"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {weeks.map((w) => (
                      <SelectItem key={w.value!} value={w.value!}>{w.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm mb-1 flex items-center gap-2"><Users2 className="h-4 w-4 opacity-70" /> Spezialisierung</label>
            <Select value={String(specialization)} onValueChange={(v) => setSpecialization(Number(v) as Specialization)}>
              <SelectTrigger>
                <SelectValue placeholder="Spezialisierung wählen" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  {specOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border p-3 bg-muted/60 text-sm flex items-center gap-2">
            {loadingPreview ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (previewCount ?? 0) > 0 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span>
              <span className="font-semibold">{previewCount ?? 0}</span>
              {typeof totalCount === "number" ? ` von ${totalCount}` : ""} Notizen können übertragen werden.
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Abbrechen</Button>
          <Button onClick={onSubmit} disabled={!canPreview || submitting}>
            {submitting ? "Übertrage..." : "Übertragen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
