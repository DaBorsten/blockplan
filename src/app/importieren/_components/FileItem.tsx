"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, X, FileText } from "lucide-react";

type FileItemProps = {
  id: string;
  displayName: string;
  fileName: string;
  fileSize: number;
  onEditAction: (id: string, name: string) => void;
  onDeleteAction: (id: string) => void;
  isEditOpen: boolean;
  editValue: string;
  onEditChangeAction: (value: string) => void;
  onEditSaveAction: () => void;
  onEditCancelAction: () => void;
  isLoading: boolean;
};

function formatFileSize(bytes: number): string {
  if (bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes < 1024 * 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)} TB`;
}

export function FileItem({
  id,
  displayName,
  fileName,
  fileSize,
  onEditAction,
  onDeleteAction,
  isEditOpen,
  editValue,
  onEditChangeAction,
  onEditSaveAction,
  onEditCancelAction,
  isLoading,
}: FileItemProps) {
  return (
    <div className="flex items-center gap-3 border rounded-lg px-3 py-2.5 bg-card transition-all duration-150 group hover:bg-accent/50 hover:border-accent-foreground/20">
      {/* File Icon */}
      <div className="shrink-0 w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
        <FileText className="w-4 h-4 text-primary" />
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <button
          className="truncate font-medium text-sm leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm w-full text-left"
          title={displayName}
          aria-label={`Importname: ${displayName}. Klicken Sie zum Umbenennen.`}
          onClick={() => onEditAction(id, displayName)}
        >
          {displayName}
        </button>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="truncate text-xs text-muted-foreground"
            title={fileName}
          >
            {fileName}
          </span>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatFileSize(fileSize)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEditAction(id, displayName)}
          className="cursor-pointer h-8 w-8"
          aria-label="Umbenennen"
          disabled={isLoading}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDeleteAction(id)}
          className="cursor-pointer h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label="Löschen"
          disabled={isLoading}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => !open && onEditCancelAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importname ändern</DialogTitle>
          </DialogHeader>
          <Label htmlFor="editName">Neuer Name</Label>
          <Input
            id="editName"
            value={editValue}
            onChange={(e) => onEditChangeAction(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                if (!isLoading) {
                  onEditSaveAction();
                }
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (!isLoading) {
                  onEditSaveAction();
                }
              }
            }}
            disabled={isLoading}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onEditCancelAction}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Abbrechen
            </Button>
            <Button
              onClick={onEditSaveAction}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
