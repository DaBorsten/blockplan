import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";

type DropzoneProps = {
  onFiles: (files: FileList | null) => void;
  onClick: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  text?: string;
  accept?: string;
};

const Dropzone = forwardRef<HTMLDivElement, DropzoneProps>(
  ({ onFiles, onClick, onDrop, fileInputRef, text, accept }, ref) => (
    <div
      ref={ref}
      className="flex-1 w-full flex items-center justify-center cursor-pointer hover:bg-muted transition text-lg select-none min-h-[300px] min-w-0 border-2 border-dashed border-muted-foreground rounded-2xl"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="text-muted-foreground mb-2 text-center w-full">
        {text || "Dateien hierher ziehen oder klicken, um auszuwählen"}
      </div>
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept || "*/*"}
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  )
);

Dropzone.displayName = "Dropzone";

export default Dropzone;
