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

type FileItem = {
  id: string;
  file: File;
  name: string;
};

function getId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

export default function Import() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: FileItem[] = [];
    Array.from(fileList).forEach((file) => {
      if (file.type === "application/pdf") {
        newFiles.push({ id: getId(), file, name: file.name });
      }
    });
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleEdit = (id: string, name: string) => {
    setEditId(id);
    setEditName(extractFileName(name));
  };

  const handleEditSave = () => {
    setFiles((prev) =>
      prev.map((f) => (f.id === editId ? { ...f, name: editName } : f)),
    );
    setEditId(null);
    setEditName("");
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="grid min-h-svh w-full px-2"
      style={{ gridTemplateRows: "1fr auto" }}
    >
      <div className="flex flex-col items-center justify-center w-full">
        {/* Dropzone oder Dateiliste */}
        {files.length === 0 ? (
          <Dropzone
            onFiles={handleFiles}
            onClick={openFileDialog}
            onDrop={handleDrop}
            fileInputRef={fileInputRef}
            text="PDF Dateien hierher ziehen oder klicken, um auszuwählen"
            accept="application/pdf"
          />
        ) : (
          <div
            className="flex-1 w-full bg-muted/60 p-4 md:p-8 flex flex-col gap-3 min-h-[300px] min-w-0"
            style={{ minHeight: 300 }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background transition-colors group hover:bg-primary/10"
              >
                <div className="flex-1 min-w-0">
                  <div
                    className="truncate font-medium"
                    title={extractFileName(f.name)}
                  >
                    {extractFileName(f.name)}
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
                      onClick={() => handleEdit(f.id, f.name)}
                      className="cursor-pointer"
                      aria-label="Umbenennen"
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
                    />
                    <DialogFooterUI>
                      <Button onClick={handleEditSave}>Speichern</Button>
                      <Button variant="outline" onClick={() => setEditId(null)}>
                        Abbrechen
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
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Footer mit Buttons, immer ganz unten im Grid */}
      <footer className="sticky bottom-0 w-full bg-background border-t flex flex-col sm:flex-row gap-3 px-4 py-4 max-w-full justify-center z-10">
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={openFileDialog}
          >
            Weitere Dateien auswählen
          </Button>
          <Button
            className="flex-1"
            disabled={files.length === 0}
            onClick={() => {
              if (files.length === 0) {
                toast.error("Keine Dateien zum Importieren ausgewählt.");
                return;
              }
              if (files.length === 1) {
                toast.info("Stundenplan wird analysiert …");
              } else {
                toast.info("Stundenpläne werden analysiert …");
              }
              // Hier könnte die eigentliche Import-Logik folgen
            }}
          >
            Importieren
          </Button>
        </div>
      </footer>
    </div>
  );
}
