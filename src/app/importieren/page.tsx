"use client";

import React, { useRef, useCallback } from "react";
import { Upload, FileUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useIsAnimated } from "@/components/AnimationProvider";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";
import { useClassStore } from "@/store/useClassStore";
import { useFileManager } from "@/hooks/useFileManager";
import { useImportFiles } from "@/hooks/useImportFiles";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { validateAndCreateFileItems } from "@/utils/fileImport";
import { ClassSelectionAlert } from "./_components/ClassSelectionAlert";
import { FileList } from "./_components/FileList";
import { ImportProgressOverlay } from "./_components/ImportProgressOverlay";
import type { Id } from "@/../convex/_generated/dataModel";

// No-op function to prevent recreation on every render
const NO_OP = () => {};

export default function Import() {
  const { classId } = useClassStore();
  const needsClass = !classId;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const anim = useIsAnimated();

  // Hooks
  const {
    files,
    setFiles,
    editId,
    editName,
    setEditName,
    handleDelete,
    handleEdit,
    handleEditSave,
    handleEditCancel,
    removeSuccessfulFiles,
  } = useFileManager();

  const { loading, progress, handleImportFiles } = useImportFiles();

  const {
    isDragOverFileList,
    setIsDragOverFileList,
    handleDragEnterFileList,
    handleDragLeaveFileList,
    handleDragOverFileList,
  } = useDragAndDrop();

  // File handlers
  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      const newFiles = validateAndCreateFileItems(fileList, files);
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files, setFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOverFileList(false);
      if (!loading && !needsClass) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles, loading, needsClass, setIsDragOverFileList],
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImport = useCallback(async () => {
    if (!classId) return;

    const { successful } = await handleImportFiles(
      files.map((f) => ({
        file: f.file,
        displayName: f.displayName,
        id: f.id,
      })),
      classId as Id<"classes">,
    );

    if (successful.length > 0) {
      removeSuccessfulFiles(successful);
    }
  }, [files, classId, handleImportFiles, removeSuccessfulFiles]);

  return (
    <div className="flex flex-col h-full px-4 md:px-6 pb-4 md:pb-6">
      {/* Header */}
      <div className="mb-4 md:mb-6 shrink-0">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
          Importieren
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Laden Sie Ihre Stundenplan-Dateien hoch
        </p>
        {needsClass && <ClassSelectionAlert />}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        aria-label="PDF-Dateien auswählen"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 flex-col w-full max-w-3xl self-center">
        <div className="relative w-full flex-1 min-h-0 flex flex-col">
          <AnimatePresence mode="wait">
            {files.length === 0 ? (
              /* Empty State - Dropzone */
              <motion.div
                key="dropzone"
                className="flex-1 flex flex-col items-center justify-center"
                initial={anim ? { opacity: 0, scale: 0.96 } : false}
                animate={{ opacity: 1, scale: 1 }}
                exit={anim ? { opacity: 0, scale: 0.96 } : undefined}
                transition={
                  anim ? { duration: 0.25, ease: "easeOut" } : { duration: 0 }
                }
              >
                <Dropzone
                  onClick={loading || needsClass ? NO_OP : openFileDialog}
                  onDrop={loading || needsClass ? NO_OP : handleDrop}
                  text="Dateien hierher ziehen zum Hochladen"
                  supportedFiles="PDF"
                />
              </motion.div>
            ) : (
              /* Files loaded */
              <motion.div
                key="filelist"
                className="flex flex-col flex-1 min-h-0 gap-4"
                initial={anim ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={anim ? { opacity: 0, y: -12 } : undefined}
                transition={
                  anim ? { duration: 0.3, ease: "easeOut" } : { duration: 0 }
                }
              >
                {/* File count & Add button */}
                <motion.div
                  className="flex items-center justify-between shrink-0"
                  initial={anim ? { opacity: 0, y: -8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    anim ? { duration: 0.25, delay: 0.1 } : { duration: 0 }
                  }
                >
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {files.length}
                    </span>
                    {files.length === 1 ? " Datei" : " Dateien"} ausgewählt
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={openFileDialog}
                    disabled={needsClass || loading}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Hinzufügen</span>
                  </Button>
                </motion.div>

                {/* File List */}
                <FileList
                  files={files}
                  isLoading={loading}
                  isDragOver={isDragOverFileList}
                  editId={editId}
                  editValue={editName}
                  onEditAction={handleEdit}
                  onDeleteAction={handleDelete}
                  onEditChangeAction={setEditName}
                  onEditSaveAction={handleEditSave}
                  onEditCancelAction={handleEditCancel}
                  onDropAction={loading || needsClass ? NO_OP : handleDrop}
                  onDragOverAction={
                    loading || needsClass ? NO_OP : handleDragOverFileList
                  }
                  onDragEnterAction={
                    loading || needsClass ? NO_OP : handleDragEnterFileList
                  }
                  onDragLeaveAction={
                    loading || needsClass ? NO_OP : handleDragLeaveFileList
                  }
                />

                {/* Import Button */}
                <motion.div
                  className="shrink-0 flex justify-center md:justify-end"
                  initial={anim ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    anim ? { duration: 0.25, delay: 0.2 } : { duration: 0 }
                  }
                >
                  <Button
                    className="cursor-pointer gap-2"
                    size="lg"
                    disabled={files.length === 0 || loading || needsClass}
                    onClick={handleImport}
                  >
                    <FileUp className="w-4 h-4" />
                    {files.length === 1
                      ? "Datei importieren"
                      : `${files.length} Dateien importieren`}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Overlay - fullscreen */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={anim ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={anim ? { opacity: 0 } : undefined}
            transition={anim ? { duration: 0.2 } : { duration: 0 }}
          >
            <ImportProgressOverlay
              current={progress.current}
              total={progress.total}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons - only in empty state */}
      <AnimatePresence>
        {files.length === 0 && (
          <motion.div
            className="w-full flex justify-center gap-3 mt-4 shrink-0 max-w-3xl self-center"
            initial={anim ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={anim ? { opacity: 0, y: 8 } : undefined}
            transition={anim ? { duration: 0.25 } : { duration: 0 }}
          >
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={openFileDialog}
              disabled={needsClass || loading}
            >
              <Upload className="w-4 h-4" />
              <span>Dateien auswählen</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
