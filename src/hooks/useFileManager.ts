import { useState, useCallback } from "react";
import { toast } from "sonner";

export type FileItem = {
  id: string;
  file: File;
  name: string;
  displayName: string;
};

export function useFileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleDelete = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleEdit = useCallback((id: string, displayName: string) => {
    setEditId(id);
    setEditName(displayName);
  }, []);

  const handleEditSave = useCallback(() => {
    const next = editName.trim();
    if (!next) {
      toast.warning("Der Name darf nicht leer sein");
      return;
    }
    setFiles((prev) =>
      prev.map((f) => (f.id === editId ? { ...f, displayName: next } : f)),
    );
    setEditId(null);
    setEditName("");
  }, [editName, editId]);

  const handleEditCancel = useCallback(() => {
    setEditId(null);
    setEditName("");
  }, []);

  const removeSuccessfulFiles = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setFiles((prev) => prev.filter((f) => !idSet.has(f.id)));
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
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
    clearAllFiles,
  };
}
