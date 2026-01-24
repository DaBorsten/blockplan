import React, { forwardRef, useState } from "react";
import { Upload, FileDown } from "lucide-react";

type DropzoneProps = {
  onClick: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  text?: string;
  supportedFiles?: string;
};

export const Dropzone = forwardRef<HTMLDivElement, DropzoneProps>(
  ({ onClick, onDrop, text, supportedFiles }, ref) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      // Nur reagieren, wenn Dateien gezogen werden (nicht Text/andere)
      if (
        e.dataTransfer.types.includes("Files") &&
        !e.dataTransfer.types.includes("text/plain")
      ) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
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
        setIsDragOver(false);
      }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      // Nur reagieren, wenn Dateien gezogen werden (nicht Text/andere)
      if (
        !e.dataTransfer.types.includes("Files") ||
        e.dataTransfer.types.includes("text/plain")
      ) {
        return;
      }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      onDrop(e);
    };

    return (
      <div
        ref={ref}
        className={`relative flex-1 w-full flex items-center justify-center cursor-pointer hover:bg-muted transition text-lg select-none min-h-75 min-w-0 border-2 border-dashed rounded-2xl overflow-hidden ${
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${text || "Dateien hierher ziehen zum Hochladen"}${supportedFiles ? `. Unterstützte Formate: ${supportedFiles}` : ""}. Drücken Sie Enter oder Leertaste zum Öffnen des Datei-Dialogs`}
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
        </div>

        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <FileDown
                  className="w-10 h-10 text-primary"
                  style={{ animation: "gentle-bounce 1s ease-in-out infinite" }}
                />
              </div>
              <h3 className="text-primary font-semibold text-xl">
                Dateien hier ablegen
              </h3>
            </div>
          </div>
        )}

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
    );
  },
);

Dropzone.displayName = "Dropzone";
