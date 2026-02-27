import { useState, useCallback } from "react";
import type { DragEvent } from "react";

export function useDragAndDrop() {
  const [isDragOverFileList, setIsDragOverFileList] = useState(false);

  const handleDragEnterFileList = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (
        e.dataTransfer.types.includes("Files") &&
        !e.dataTransfer.types.includes("text/plain")
      ) {
        setIsDragOverFileList(true);
      }
    },
    [],
  );

  const handleDragLeaveFileList = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
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
    },
    [],
  );

  const handleDragOverFileList = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (
        !e.dataTransfer.types.includes("Files") ||
        e.dataTransfer.types.includes("text/plain")
      ) {
        return;
      }
      e.preventDefault();
    },
    [],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (
        !e.dataTransfer.types.includes("Files") ||
        e.dataTransfer.types.includes("text/plain")
      ) {
        return;
      }
      setIsDragOverFileList(false);
    },
    [],
  );

  return {
    isDragOverFileList,
    setIsDragOverFileList,
    handleDragEnterFileList,
    handleDragLeaveFileList,
    handleDragOverFileList,
    handleDrop,
  };
}
