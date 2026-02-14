"use client";

import { FileItem } from "./FileItem";
import { FileDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useIsAnimated } from "@/components/AnimationProvider";
import { cn } from "@/lib/utils";
import {DragEvent} from "react";

type FileListProps = {
  files: Array<{ id: string; file: File; name: string; displayName: string }>;
  isLoading: boolean;
  isDragOver: boolean;
  editId: string | null;
  editValue: string;
  onEditAction: (id: string, name: string) => void;
  onDeleteAction: (id: string) => void;
  onEditChangeAction: (value: string) => void;
  onEditSaveAction: () => void;
  onEditCancelAction: () => void;
  onDropAction: (e: DragEvent<HTMLDivElement>) => void;
  onDragOverAction: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnterAction: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeaveAction: (e: DragEvent<HTMLDivElement>) => void;
};

export function FileList({
  files,
  isLoading,
  isDragOver,
  editId,
  editValue,
  onEditAction,
  onDeleteAction,
  onEditChangeAction,
  onEditSaveAction,
  onEditCancelAction,
  onDropAction,
  onDragOverAction,
  onDragEnterAction,
  onDragLeaveAction,
}: FileListProps) {
  const anim = useIsAnimated();
  return (
    <div
      className={cn(
        "relative scrollable flex-1 w-full flex flex-col gap-2 p-4 min-h-0 border-2 border-dashed rounded-xl overflow-y-auto overflow-hidden transition-colors duration-200",
        isDragOver ? "border-primary bg-primary/5" : "border-border",
        isLoading ? "opacity-60 pointer-events-none" : ""
      )}
      onDrop={isLoading ? undefined : onDropAction}
      onDragOver={isLoading ? undefined : onDragOverAction}
      onDragEnter={isLoading ? undefined : onDragEnterAction}
      onDragLeave={isLoading ? undefined : onDragLeaveAction}
      role="region"
      aria-label="Drop files here or click to upload"
      aria-busy={isLoading}
    >
      <AnimatePresence initial={false}>
        {files.map((f) => (
          <motion.div
            key={f.id}
            layout={anim}
            initial={anim ? { opacity: 0, y: 10, scale: 0.97 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={anim ? { opacity: 0, x: -20, scale: 0.95 } : undefined}
            transition={anim ? { duration: 0.25, ease: "easeOut" } : { duration: 0 }}
          >
            <FileItem
              id={f.id}
              displayName={f.displayName}
              fileName={f.name}
              fileSize={f.file.size}
              onEditAction={onEditAction}
              onDeleteAction={onDeleteAction}
              isEditOpen={editId === f.id}
              editValue={editValue}
              onEditChangeAction={onEditChangeAction}
              onEditSaveAction={onEditSaveAction}
              onEditCancelAction={onEditCancelAction}
              isLoading={isLoading}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3 animate-pulse">
              <FileDown
                className="w-8 h-8 text-primary"
                style={{
                  animation: "gentle-bounce 1s ease-in-out infinite",
                }}
              />
            </div>
            <h3 className="text-primary font-semibold text-lg">
              Weitere Dateien hinzufügen
            </h3>
          </div>

          <style jsx>{`
            :global @keyframes gentle-bounce {
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
  );
}