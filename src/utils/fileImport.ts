import { toast } from "sonner";

export type FileItem = {
  id: string;
  file: File;
  name: string;
  displayName: string;
};

export function getId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function extractFileName(fullName: string): string {
  const regex = /KW\s*\d+_\d+/i;
  const match = fullName.match(regex);
  return match ? match[0].replace(/\s+/, " ") : fullName;
}

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export function validateAndCreateFileItems(
  fileList: FileList | null,
  existingFiles: FileItem[],
): FileItem[] {
  if (!fileList) return [];

  const newFiles: FileItem[] = [];
  const existing = new Set(existingFiles.map((f) => `${f.name}-${f.file.size}`));

  Array.from(fileList).forEach((file) => {
    if (file.type !== "application/pdf") {
      toast.warning(`Übersprungen (kein PDF): ${file.name}`);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.warning(`Zu groß (> ${MAX_MB} MB): ${file.name}`);
      return;
    }

    const key = `${file.name}-${file.size}`;
    if (existing.has(key)) {
      toast.message(`Bereits hinzugefügt: ${file.name}`);
      return;
    }

    newFiles.push({
      id: getId(),
      file,
      name: file.name,
      displayName: extractFileName(file.name),
    });

    existing.add(key);
  });

  return newFiles;
}
