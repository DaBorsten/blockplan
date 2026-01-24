"use client";

// Extrahiert den gewünschten Namen aus dem Dateinamen
const extractFileName = (fullName: string): string => {
  const regex = /KW\s*\d+_\d+/i;
  const match = fullName.match(regex);
  return match ? match[0].replace(/\s+/, " ") : fullName;
};

import React, { useRef, useState, useCallback } from "react";
import { AlertTriangle, Loader2, Upload, FileDown } from "lucide-react";
import { Dropzone } from "@/components/Dropzone";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter as DialogFooterUI,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useClassStore } from "@/store/useClassStore";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

type FileItem = {
  id: string;
  file: File;
  name: string; // Originaler Dateiname
  displayName: string; // Extrahierter/benutzerdefinierter Name
};

function getId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export default function Import() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [isDragOverFileList, setIsDragOverFileList] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const lastImportTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<number>(0);

  const { classId } = useClassStore();
  const needsClass = !classId;
  const importWeek = useMutation(api.notes.importWeekWithTimetable);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const MAX_MB = 10;
    const MAX_BYTES = MAX_MB * 1024 * 1024;
    const newFiles: FileItem[] = [];
    const existing = new Set(files.map((f) => `${f.name}-${f.file.size}`));
    Array.from(fileList).forEach((file) => {
      if (file.type !== "application/pdf") {
        toast.warning(`Übersprungen (kein PDF): ${file.name}`);
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.warning(`Zu groß (> ${MAX_MB} MB): ${file.name}`);
        return;
      }
      const key = `${file.name}-${file.size}`;

      if (existing.has(key)) {
        toast.message(`Bereits hinzugefügt: ${file.name}`);
        return;
      }
      newFiles.push({
        id: getId(),
        file,
        name: file.name,
        displayName: extractFileName(file.name),
      });

      existing.add(key);
    });
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverFileList(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragEnterFileList = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Nur reagieren, wenn Dateien gezogen werden (nicht Text/andere)
    if (
      e.dataTransfer.types.includes("Files") &&
      !e.dataTransfer.types.includes("text/plain")
    ) {
      setIsDragOverFileList(true);
    }
  };

  const handleDragLeaveFileList = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Prüfen ob wir wirklich das Container verlassen (nicht nur in ein Kind-Element)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragOverFileList(false);
    }
  };

  const handleDragOverFileList = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Nur reagieren, wenn Dateien gezogen werden (nicht Text/andere)
    if (
      !e.dataTransfer.types.includes("Files") ||
      e.dataTransfer.types.includes("text/plain")
    ) {
      return;
    }
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleEdit = (id: string, displayName: string) => {
    setEditId(id);
    setEditName(displayName);
  };

  const handleEditSave = () => {
    const next = editName.trim();
    if (!next) {
      toast.warning("Der Name darf nicht leer sein");
      return;
    }
    setFiles((prev) =>
      prev.map((f) => (f.id === editId ? { ...f, displayName: editName } : f)),
    );
    setEditId(null);
    setEditName("");
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  async function uploadFile(selectedFile: File) {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      try {
        const response = await fetch("/api/import/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Upload fehlgeschlagen (Status: ${response.status})`,
          );
        }
        const responseData = await response.json();
        return responseData;
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`Upload-Fehler für Datei ${selectedFile.name}:`, err);
        throw new Error(`Upload fehlgeschlagen: ${err.message}`, {
          cause: err,
        });
      }
    }
    throw new Error("Keine Datei ausgewählt");
  }

  const handleImport = useCallback(async () => {
    const now = Date.now();

    // Debounce-Schutz: 1 Sekunde zwischen Import-Versuchen
    if (now - lastImportTimeRef.current < 1000) {
      return;
    }

    // Einfacher Schutz gegen doppelte Ausführung
    if (isImporting || loading) {
      return;
    }

    if (needsClass) {
      toast.warning("Bitte wählen Sie zuerst eine Klasse aus.");
      return;
    }
    if (files.length === 0) {
      toast.error("Keine Dateien zum Importieren ausgewählt.");
      return;
    }

    // Timestamp für diese Import-Session setzen
    lastImportTimeRef.current = now;
    const importSessionId = now;

    setIsImporting(true);
    setLoading(true);
    setProgress({ current: 0, total: files.length });
    progressRef.current = 0;

    const successfulFileIds: string[] = [];
    const failedFiles: Array<{ name: string; error: string }> = [];

    // Capture stable snapshot of classId before async operations
    const importClassId = classId;

    type ImportResult =
      | { success: true; id: string }
      | { success: false; name: string; error: string }
      | undefined;

    try {
      // Alle Dateien parallel verarbeiten
      const importPromises = files.map(
        async (fileItem): Promise<ImportResult> => {
          const { id, file, displayName } = fileItem;
          try {
            const response = await uploadFile(file);

            if (!response) {
              const nextProgress = ++progressRef.current;
              setProgress((p) => ({
                ...p,
                current: Math.min(nextProgress, p.total),
              }));
              return {
                success: false,
                name: displayName,
                error: "Upload lieferte keine gültige Antwort",
              } as const;
            }

            try {
              // Convex Mutation Aufruf
              await importWeek({
                classId: importClassId as Id<"classes">,
                title: displayName,
                timetable: response,
              });

              // Fortschritt erhöhen nach erfolgreichem Import
              const nextProgress = ++progressRef.current;
              setProgress((p) => ({
                ...p,
                current: Math.min(nextProgress, p.total),
              }));

              return { success: true, id } as const;
            } catch (e) {
              let errMsg = "Unbekannter Fehler";
              if (e instanceof Error) {
                // Convex-spezifische Fehler könnten mehr Details enthalten
                errMsg = e.message;
                // Optional: Prüfen auf spezifische Fehlercodes oder -typen
                if (e.message.includes("unauthorized")) {
                  errMsg = "Keine Berechtigung für diese Aktion";
                } else if (e.message.includes("invalid")) {
                  errMsg = "Ungültige Daten im Stundenplan";
                }
              } else {
                errMsg = String(e);
              }

              // Fortschritt erhöhen auch bei Fehler
              const nextProgress = ++progressRef.current;
              setProgress((p) => ({
                ...p,
                current: Math.min(nextProgress, p.total),
              }));

              return {
                success: false,
                name: displayName,
                error: errMsg,
              } as const;
            }
          } catch (error: unknown) {
            const err =
              error instanceof Error ? error : new Error(String(error));

            // Fortschritt erhöhen auch bei Fehler
            const nextProgress = ++progressRef.current;
            setProgress((p) => ({
              ...p,
              current: Math.min(nextProgress, p.total),
            }));

            return {
              success: false,
              name: displayName,
              error: err.message,
            } as const;
          }
        },
      );

      // Auf alle Promises warten
      const results = await Promise.all(importPromises);

      // Ergebnisse sammeln
      results.forEach((result) => {
        if (result) {
          if (result.success) {
            successfulFileIds.push(result.id);
          } else {
            failedFiles.push({ name: result.name, error: result.error });
          }
        }
      });

      // Nur erfolgreich importierte Dateien entfernen
      if (successfulFileIds.length > 0) {
        setFiles((prevFiles) =>
          prevFiles.filter((f) => !successfulFileIds.includes(f.id)),
        );
      }

      // Eine einzige zusammenfassende Toast-Nachricht mit Session-basierter ID
      const totalFiles = files.length;
      const successCount = successfulFileIds.length;
      const errorCount = failedFiles.length;

      // Session-basierte Toast-ID verhindert Duplikate innerhalb einer Session
      const IMPORT_RESULT_TOAST_ID = `import-result-${importSessionId}`;

      if (errorCount === 0) {
        // Alle erfolgreich
        const fileText = totalFiles === 1 ? "Datei" : "Dateien";
        toast.success(
          `${
            totalFiles === 1 ? "" : `Alle ${totalFiles} `
          }${fileText} erfolgreich importiert!`,
          { id: IMPORT_RESULT_TOAST_ID },
        );
      } else if (successCount > 0) {
        // Teilweise erfolgreich
        if (totalFiles === 1) {
          toast.error(`Datei konnte nicht importiert werden.`, {
            id: IMPORT_RESULT_TOAST_ID,
          });
        } else if (successCount === 1) {
          toast.warning(
            `1 Datei von ${totalFiles} importiert. ${errorCount} fehlgeschlagen.`,
            { id: IMPORT_RESULT_TOAST_ID },
          );
        } else {
          toast.warning(
            `${successCount} Dateien von ${totalFiles} importiert. ${errorCount} fehlgeschlagen.`,
            { id: IMPORT_RESULT_TOAST_ID },
          );
        }
      } else {
        // Alle fehlgeschlagen
        const fileText =
          totalFiles === 1
            ? "Datei konnte"
            : `Alle ${totalFiles} Dateien konnten`;
        toast.error(`${fileText} nicht importiert werden.`, {
          id: IMPORT_RESULT_TOAST_ID,
        });
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error(`Unerwarteter Fehler beim Importieren: ${err.message}`, {
        id: `import-error-${importSessionId}`,
      });
    } finally {
      setLoading(false);
      setIsImporting(false);
      // Fortschritt zurücksetzen
      setProgress({ current: 0, total: 0 });
    }
  }, [isImporting, loading, needsClass, files, classId, importWeek]);

  return (
    <div className="flex flex-col h-full px-4 md:px-6 pb-4 md:pb-6">
      <div className="mb-4 md:mb-8 shrink-0 ">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Importieren
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Laden Sie Ihre Stundenplan-Dateien hoch
        </p>
        {needsClass && (
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
                  Bitte wählen Sie zuerst eine Klasse in der Kopfzeile aus,
                  bevor Sie importieren.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 min-h-0 flex-col items-center justify-center w-full max-w-5xl self-center">
        {/* Verstecktes Input-Element - immer gerendert */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Dropzone oder Dateiliste */}
        <div className="relative w-full flex-1 min-h-0 flex flex-col items-center justify-center">
          {files.length === 0 ? (
            <Dropzone
              onClick={loading || needsClass ? () => {} : openFileDialog}
              onDrop={loading || needsClass ? () => {} : handleDrop}
              text="Dateien hierher ziehen zum Hochladen"
              supportedFiles="PDF"
            />
          ) : (
            <div
              className={`relative scrollable flex-1 w-full flex p-4 md:p-6 flex-col gap-3 min-h-0 border-2 border-dashed rounded-2xl overflow-y-auto overflow-hidden ${
                isDragOverFileList
                  ? "border-primary bg-primary/5"
                  : "border-border"
              } ${loading ? "opacity-60 pointer-events-none" : ""}`}
              onDrop={loading || needsClass ? undefined : handleDrop}
              onDragOver={
                loading || needsClass ? undefined : handleDragOverFileList
              }
              onDragEnter={
                loading || needsClass ? undefined : handleDragEnterFileList
              }
              onDragLeave={
                loading || needsClass ? undefined : handleDragLeaveFileList
              }
            >
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background transition-colors group hover:bg-primary/10"
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="truncate font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                      title={f.displayName}
                      tabIndex={0}
                      role="button"
                      aria-label={`Importname: ${f.displayName}. Drücken Sie Enter oder Leertaste zum Umbenennen.`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleEdit(f.id, f.displayName);
                        }
                      }}
                    >
                      {f.displayName}
                    </div>
                    <div
                      className="truncate text-xs text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                      title={f.name}
                      tabIndex={0}
                      aria-label={`Dateiname: ${f.name}`}
                    >
                      {f.name}
                    </div>
                  </div>
                  <Dialog
                    open={editId === f.id}
                    onOpenChange={(open) => !open && setEditId(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(f.id, f.displayName)}
                        className="cursor-pointer"
                        aria-label="Umbenennen"
                        disabled={loading}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Importname ändern</DialogTitle>
                      </DialogHeader>
                      <Label htmlFor="editName">Neuer Name</Label>
                      <Input
                        id="editName"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                            e.preventDefault();
                            if (!loading) {
                              handleEditSave();
                            }
                          }
                        }}
                        autoFocus
                        disabled={loading}
                      />
                      <DialogFooterUI>
                        <Button
                          variant="outline"
                          onClick={() => setEditId(null)}
                          disabled={loading}
                          className="cursor-pointer"
                        >
                          Abbrechen
                        </Button>
                        <Button
                          onClick={handleEditSave}
                          disabled={loading}
                          className="cursor-pointer"
                        >
                          Speichern
                        </Button>
                      </DialogFooterUI>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(f.id)}
                    className="ml-1 cursor-pointer"
                    aria-label="Löschen"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {/* Drag Overlay für Dateiliste */}
              {isDragOverFileList && (
                <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <FileDown
                        className="w-10 h-10 text-primary"
                        style={{
                          animation: "gentle-bounce 1s ease-in-out infinite",
                        }}
                      />
                    </div>
                    <h3 className="text-primary font-semibold text-xl">
                      Weitere Dateien hinzufügen
                    </h3>
                  </div>

                  {/* CSS für sanfte Bounce-Animation */}
                  <style jsx>{`
                    @keyframes gentle-bounce {
                      0%,
                      20%,
                      53%,
                      80%,
                      100% {
                        transform: translateY(0);
                      }
                      40%,
                      43% {
                        transform: translateY(-6px);
                      }
                      70% {
                        transform: translateY(-3px);
                      }
                    }
                  `}</style>
                </div>
              )}
            </div>
          )}
          {loading && (
            <div
              className="absolute inset-0 flex items-center justify-center z-20 bg-background/60 rounded-2xl"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              aria-label="Import läuft"
            >
              <div className="w-full max-w-md mx-auto p-4">
                <div className="flex items-center gap-3 mb-3 justify-center text-sm text-muted-foreground">
                  <Loader2 className="animate-spin w-5 h-5 text-primary" aria-hidden="true" />
                  <span>
                    Import läuft… {progress.current}/{progress.total}
                  </span>
                </div>
                <Progress
                  value={
                    progress.total
                      ? Math.round((progress.current / progress.total) * 100)
                      : 0
                  }
                  aria-label={`Importfortschritt: ${progress.current} von ${progress.total} Dateien`}
                  aria-valuenow={progress.current}
                  aria-valuemin={0}
                  aria-valuemax={progress.total}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="w-full flex flex-col sm:flex-row gap-3 mt-4 shrink-0 max-w-5xl self-center justify-end">
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={openFileDialog}
          disabled={needsClass || loading}
        >
          <Upload className="w-4 h-4" />
          <span>Dateien auswählen</span>
        </Button>
        <Button
          className="cursor-pointer"
          disabled={files.length === 0 || loading || needsClass || isImporting}
          onClick={handleImport}
        >
          Importieren
        </Button>
      </div>
    </div>
  );
}
