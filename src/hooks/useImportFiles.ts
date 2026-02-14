import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

export function useImportFiles() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [isImporting, setIsImporting] = useState(false);
  const lastImportTimeRef = useRef<number>(0);
  const isImportingRef = useRef(false);
  const loadingRef = useRef(false);

  const importWeek = useMutation(api.notes.importWeekWithTimetable);

  const uploadFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile) throw new Error("Keine Datei ausgewählt");

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

      return await response.json();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Upload-Fehler für Datei ${selectedFile.name}:`, err);
      throw new Error(`Upload fehlgeschlagen: ${err.message}`, {
        cause: err,
      });
    }
  }, []);

  const handleImportFiles = useCallback(
    async (
      filesToImport: Array<{ file: File; displayName: string; id: string }>,
      classId: Id<"classes"> | undefined,
    ) => {
      const now = Date.now();

      // Debounce-Schutz
      if (now - lastImportTimeRef.current < 1000) {
        return { successful: [], failed: [] };
      }

      if (isImportingRef.current || loadingRef.current) {
        return { successful: [], failed: [] };
      }

      if (!classId) {
        toast.warning("Bitte wählen Sie zuerst eine Klasse aus.");
        return { successful: [], failed: [] };
      }

      if (filesToImport.length === 0) {
        toast.error("Keine Dateien zum Importieren ausgewählt.");
        return { successful: [], failed: [] };
      }

      lastImportTimeRef.current = now;
      const importSessionId = now;

      // State setters (setIsImporting, setLoading, setProgress) trigger UI re-renders.
      // Concurrent Refs (isImportingRef, loadingRef) enable synchronous guard checks outside the render cycle.
      setIsImporting(true);
      isImportingRef.current = true;
      setLoading(true);
      loadingRef.current = true;
      setProgress({ current: 0, total: filesToImport.length });

      const successfulFileIds: string[] = [];
      const failedFiles: Array<{ name: string; error: string }> = [];

      type ImportResult =
        | { success: true; id: string }
        | { success: false; name: string; error: string }
        | undefined;

      try {
        const importPromises = filesToImport.map(
          async (fileItem): Promise<ImportResult> => {
            const { id, file, displayName } = fileItem;
            try {
              const response = await uploadFile(file);

              if (!response) {
                setProgress((p) => ({
                  ...p,
                  current: Math.min(p.current + 1, p.total),
                }));
                return {
                  success: false,
                  name: displayName,
                  error: "Upload lieferte keine gültige Antwort",
                } as const;
              }

              try {
                await importWeek({
                  classId,
                  title: displayName,
                  timetable: response,
                });

                setProgress((p) => ({
                  ...p,
                  current: Math.min(p.current + 1, p.total),
                }));

                return { success: true, id } as const;
              } catch (e) {
                let errMsg = "Unbekannter Fehler";
                if (e instanceof Error) {
                  errMsg = e.message;
                  if (e.message.includes("unauthorized")) {
                    errMsg = "Keine Berechtigung für diese Aktion";
                  } else if (e.message.includes("invalid")) {
                    errMsg = "Ungültige Daten im Stundenplan";
                  }
                } else {
                  errMsg = String(e);
                }

                setProgress((p) => ({
                  ...p,
                  current: Math.min(p.current + 1, p.total),
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

              setProgress((p) => ({
                ...p,
                current: Math.min(p.current + 1, p.total),
              }));

              return {
                success: false,
                name: displayName,
                error: err.message,
              } as const;
            }
          },
        );

        const results = await Promise.all(importPromises);

        results.forEach((result) => {
          if (result) {
            if (result.success) {
              successfulFileIds.push(result.id);
            } else {
              failedFiles.push({ name: result.name, error: result.error });
            }
          }
        });

        // Toast-Nachricht
        const totalFiles = filesToImport.length;
        const successCount = successfulFileIds.length;
        const errorCount = failedFiles.length;
        const IMPORT_RESULT_TOAST_ID = `import-result-${importSessionId}`;

        if (errorCount === 0) {
          const fileText = totalFiles === 1 ? "Datei" : "Dateien";
          toast.success(
            `${
              totalFiles === 1 ? "" : `Alle ${totalFiles} `
            }${fileText} erfolgreich importiert!`,
            { id: IMPORT_RESULT_TOAST_ID },
          );
        } else if (successCount > 0) {
          if (successCount === 1) {
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
          const fileText =
            totalFiles === 1
              ? "Datei konnte"
              : `Alle ${totalFiles} Dateien konnten`;
          toast.error(`${fileText} nicht importiert werden.`, {
            id: IMPORT_RESULT_TOAST_ID,
          });
        }

        return { successful: successfulFileIds, failed: failedFiles };
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        toast.error(`Unerwarteter Fehler beim Importieren: ${err.message}`, {
          id: `import-error-${importSessionId}`,
        });
        return { successful: [], failed: [] };
      } finally {
        setLoading(false);
        loadingRef.current = false;
        setIsImporting(false);
        isImportingRef.current = false;
        setProgress({ current: 0, total: 0 });
      }
    },
    [importWeek, uploadFile],
  );

  return {
    loading,
    isImporting,
    progress,
    handleImportFiles,
  };
}
