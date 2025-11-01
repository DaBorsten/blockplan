"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Pencil,
  Plus,
  Trash2,
  SearchIcon,
  RotateCw,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "./ui/shadcn-io/spinner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useIsMobile } from "@/hooks/use-mobile";

type RowState = {
  id?: Id<"colors">;
  teacher: string;
  color: string;
  _editing?: boolean;
};

interface Props {
  classId: string | null;
}

export function TeacherColorsManager({ classId }: Props) {
  const isMobile = useIsMobile();
  const colorsData = useQuery(
    api.teacherColors.listTeacherColors,
    classId ? { classId: classId as Id<"classes"> } : "skip",
  );
  const saveColors = useMutation(api.teacherColors.saveTeacherColors);
  const deleteColor = useMutation(api.teacherColors.deleteTeacherColor);
  const resetColors = useMutation(api.teacherColors.resetTeacherColors);

  const [items, setItems] = useState<RowState[]>([]);
  const [saving, setSaving] = useState(false);
  const loading = colorsData === undefined;

  useEffect(() => {
    if (!colorsData) return;
    setItems(
      colorsData.map((r) => ({
        ...r,
        _editing: false,
      })),
    );
  }, [colorsData]);

  function updateItem(idx: number, patch: Partial<RowState>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      { teacher: "", color: "#ffffff", _editing: true },
    ]);
  }

  async function remove(id?: string, index?: number) {
    if (!id) {
      setItems((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    try {
      if (!classId) {
        toast.error("Keine Klasse gewählt");
        return;
      }
      await deleteColor({
        classId: classId as Id<"classes">,
        colorId: id as Id<"colors">,
      });
      toast.success("Gelöscht");
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e: unknown) {
      toast.error("Löschen fehlgeschlagen", { description: String(e) });
    }
  }

  async function saveItems(itemsToSave: RowState[]) {
    if (!classId) {
      toast.error("Keine Klasse gewählt");
      return;
    }

    try {
      await saveColors({
        classId: classId as Id<"classes">,
        items: itemsToSave.map((it) => ({
          id: it.id ? it.id : undefined,
          teacher: it.teacher.trim(),
          color: it.color,
        })),
      });
    } catch (err) {
      throw new Error("Speichern fehlgeschlagen", { cause: err });
    }
  }

  // Save only one row (used when pressing Fertig) for quicker feedback
  async function saveSingle(index: number) {
    const row = items[index];
    if (!row) return;

    try {
      await saveItems([row]);
      updateItem(index, { _editing: false });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      toast.success("Gespeichert");
    }
  }

  async function reset() {
    if (!classId) {
      toast.error("Keine Klasse gewählt");
      return;
    }
    setSaving(true);
    try {
      await resetColors({
        classId: classId as Id<"classes">,
      });
      toast.success("Zurückgesetzt");
    } catch (e) {
      toast.error("Zurücksetzen fehlgeschlagen", {
        description: String(e),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col gap-2 flex-wrap shrink-0 sm:flex-row sm:items-center sm:justify-between">
        <Button
          size="lg"
          onClick={addRow}
          className="flex items-center gap-1"
          aria-label="Neue Lehrerkürzel-Farbe hinzufügen"
        >
          <Plus className="w-4 h-4" />
          <span>Neuen Lehrer hinzufügen</span>
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={reset}
          disabled={saving}
          className="flex items-center gap-1"
        >
          <RotateCw className="w-4 h-4" />
          <span>Alle zurücksetzen</span>
        </Button>
      </div>
      <Separator />
      {loading ? (
        <div className="flex flex-1 justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-1">
          {items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-muted-foreground flex items-center flex-col gap-2">
                <SearchIcon className="mr-2" aria-hidden />
                Noch keine Einträge
              </div>
            </div>
          ) : (
            <div className="space-y-2 flex flex-1 flex-col w-full">
              {items.map((item, idx) => {
                const editing = item._editing;
                return (
                  <div
                    key={item.id || idx}
                    className="flex items-center gap-3 rounded-lg border bg-card/40 px-3 py-2"
                  >
                    <label
                      className="relative inline-flex h-12 w-12 items-center justify-center"
                      title="Farbe wählen"
                    >
                      <input
                        type="color"
                        defaultValue={item.color}
                        onBlur={(e) =>
                          updateItem(idx, { color: e.target.value })
                        }
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={editing && !item.teacher.trim()}
                        aria-label="Farbe"
                      />
                      <span
                        className="h-10 w-10 rounded-full ring-2 ring-background"
                        style={{
                          background: item.color,
                          boxShadow:
                            "0 0 0 2px var(--background), 0 0 0 3px var(--foreground)",
                        }}
                      />
                    </label>
                    <div className="flex-1 min-w-0">
                      {editing ? (
                        <Input
                          value={item.teacher}
                          placeholder="Kürzel"
                          className="w-28 sm:w-40"
                          onChange={(e) =>
                            updateItem(idx, { teacher: e.target.value })
                          }
                          autoFocus
                        />
                      ) : (
                        <div className="font-medium truncate text-sm">
                          {item.teacher || (
                            <span className="italic">(leer)</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editing ? (
                        <Button
                          size={isMobile ? "icon" : "sm"}
                          variant="secondary"
                          className="flex items-center gap-1"
                          onClick={() => saveSingle(idx)}
                          disabled={!item.teacher.trim()}
                        >
                          <Check className="w-4 h-4" />
                          <span className="hidden md:inline">Fertig</span>
                        </Button>
                      ) : (
                        <Button
                          size={isMobile ? "icon" : "sm"}
                          variant="outline"
                          className="flex items-center gap-1"
                          onClick={() => updateItem(idx, { _editing: true })}
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="hidden md:inline">Bearbeiten</span>
                        </Button>
                      )}
                      <Button
                        size={isMobile ? "icon" : "sm"}
                        variant="destructive"
                        className="flex items-center gap-1"
                        onClick={() => remove(item.id, idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden md:inline">Löschen</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
