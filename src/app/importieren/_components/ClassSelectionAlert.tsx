import { AlertTriangle } from "lucide-react";

export function ClassSelectionAlert() {
  return (
    <div className="mt-3">
      <div
        className="flex items-start gap-3 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-400/40 dark:bg-yellow-950/40 dark:text-yellow-200 p-3"
        role="alert"
        aria-live="assertive"
      >
        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium">Keine Klasse ausgewählt</p>
          <p className="text-sm">
            Bitte wählen Sie zuerst eine Klasse in der Kopfzeile aus, bevor Sie
            importieren.
          </p>
        </div>
      </div>
    </div>
  );
}
