"use client";

import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type ImportProgressOverlayProps = {
  current: number;
  total: number;
};

export function ImportProgressOverlay({
  current,
  total,
}: ImportProgressOverlayProps) {
  const percent = total ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 pointer-events-auto"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Import läuft"
    >
      <div className="w-full max-w-sm mx-auto p-6 bg-card border rounded-xl shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Loader2 className="animate-spin w-6 h-6 text-primary" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="font-medium text-sm">Import läuft…</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {current} von {total} {total === 1 ? "Datei" : "Dateien"}
            </p>
          </div>
          <div className="w-full">
            <Progress
              value={percent}
              className="h-2"
              aria-label={`Importfortschritt: ${current} von ${total} Dateien`}
              aria-valuenow={current}
              aria-valuemin={0}
              aria-valuemax={total}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{percent}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
