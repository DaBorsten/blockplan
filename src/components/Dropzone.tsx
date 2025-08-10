import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

type DropzoneProps = {
  onFiles: (files: FileList | null) => void;
  onClick: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  text?: string;
  supportedFiles?: string;
  accept?: string;
};

const Dropzone = forwardRef<HTMLDivElement, DropzoneProps>(
  (
    { onFiles, onClick, onDrop, fileInputRef, text, supportedFiles, accept },
    ref,
  ) => (
    <div
      ref={ref}
      className="flex-1 w-full flex items-center justify-center cursor-pointer hover:bg-muted transition text-lg select-none min-h-[300px] min-w-0 border-2 border-dashed border-muted-foreground rounded-2xl"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>

        <h3 className="text-muted-foreground mb-2 text-center w-full">
          {text || "Dateien hierher ziehen zum Hochladen"}
        </h3>
        {supportedFiles && (
          <p className="text-xs text-muted-foreground mb-2 text-center w-full">
            {"Unterstützte Formate: " + supportedFiles}
          </p>
        )}
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept || "*/*"}
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
    </div>
  ),
);

Dropzone.displayName = "Dropzone";

export default Dropzone;
