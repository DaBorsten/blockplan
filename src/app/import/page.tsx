"use client";

// Extrahiert den gewünschten Namen aus dem Dateinamen
const extractFileName = (fullName: string): string => {
  const regex = /KW\s+(\d+)_(\d+)_(\d+)([A-Z])/;
  const match = fullName.match(regex);
  if (match) {
    const [, n1, n2, n3, letter] = match;
    return `${n3}${letter} KW ${n1}_${n2}`;
  }
  return fullName;
};

import React, { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useSearchParams } from "next/navigation";

type FileItem = {
  id: string;
  file: File;
  name: string; // Originaler Dateiname
  displayName: string; // Extrahierter/benutzerdefinierter Name
};

function getId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

export default function Import() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();
  const classID = searchParams?.get("class") ?? null;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: FileItem[] = [];
    Array.from(fileList).forEach((file) => {
      if (file.type === "application/pdf") {
        newFiles.push({
          id: getId(),
          file,
          name: file.name,
          displayName: extractFileName(file.name),
        });
      }
    });
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleEdit = (id: string, displayName: string) => {
    setEditId(id);
    setEditName(displayName);
  };

  const handleEditSave = () => {
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
          throw new Error(errorData.error || "Fehler beim Upload");
        }
        const responseData = await response.json();
        return responseData;
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        throw Error("Internet oder Server Fehler", { cause: err });
      }
    }
  }

  return (
    <div className="flex flex-col h-full px-4 md:px-6 pb-4 md:pb-6">
      <div className="mb-8 flex-shrink-0">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Importieren
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Laden Sie Ihre Stundenplan-Dateien hoch
        </p>
      </div>

      <div className="flex flex-1 min-h-0 flex-col items-center justify-center w-full">
        {/* Dropzone oder Dateiliste */}
        <div className="relative w-full flex-1 min-h-0 flex flex-col items-center justify-center">
          {files.length === 0 ? (
            <Dropzone
              onFiles={loading ? () => {} : handleFiles}
              onClick={loading ? () => {} : openFileDialog}
              onDrop={loading ? () => {} : handleDrop}
              fileInputRef={fileInputRef}
              text="Dateien hierher ziehen zum Hochladen"
              supportedFiles="PDF"
              accept="application/pdf"
            />
          ) : (
            <div
              className={`scrollable flex-1 w-full flex p-4 md:p-6 flex-col gap-3 min-h-0 border-2 border-dashed border-border rounded-2xl overflow-y-auto ${
                loading ? "opacity-60 pointer-events-none" : ""
              }`}
              onDrop={loading ? undefined : handleDrop}
              onDragOver={loading ? undefined : (e) => e.preventDefault()}
            >
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background transition-colors group hover:bg-primary/10"
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium" title={f.displayName}>
                      {f.displayName}
                    </div>
                    <div
                      className="truncate text-xs text-muted-foreground"
                      title={f.name}
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
                        <DialogTitle>Dateiname ändern</DialogTitle>
                      </DialogHeader>
                      <Label htmlFor="editName">Neuer Name</Label>
                      <Input
                        id="editName"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
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
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/60 rounded-2xl">
              <Loader2 className="animate-spin w-16 h-16 text-primary" />
            </div>
          )}
        </div>
      </div>
      <div className="w-full flex flex-col sm:flex-row gap-3 mt-4 flex-shrink-0">
        <Button
          variant="default"
          className="flex-1 cursor-pointer"
          onClick={openFileDialog}
        >
          <Upload className="w-4 h-4" />
          <span>Dateien auswählen</span>
        </Button>
        <Button
          className="flex-1 cursor-pointer"
          disabled={files.length === 0 || loading}
          onClick={async () => {
            if (files.length === 0) {
              toast.error("Keine Dateien zum Importieren ausgewählt.");
              return;
            }
            setLoading(true);
            try {
              // Simuliere Import-Vorgang
              await new Promise((resolve) => setTimeout(resolve, 2000));

              for (const { file, displayName } of files) {
                const response = await uploadFile(file);

                if (response) {
                  await fetch("/api/week", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      timetable: response,
                      week: displayName,
                      class_id: classID,
                    }),
                  });
                }
              }

              toast.success("Import abgeschlossen!");
              setFiles([]);
            } catch (error: unknown) {
              const err =
                error instanceof Error ? error : new Error(String(error));
              toast.error(`Fehler beim Importieren. ${err.message}`);
            } finally {
              setLoading(false);
            }
          }}
        >
          Importieren
        </Button>
      </div>
    </div>
  );
}
