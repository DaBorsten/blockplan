"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Pencil, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { Spinner } from "./ui/shadcn-io/spinner";

type RowState = {
  id?: string;
  teacher: string;
  color: string;
  _editing?: boolean;
};

interface Props {
  classId: string;
}

export function TeacherColorsManager({ classId }: Props) {
  const [items, setItems] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch(`/api/class/teacherColors?class_id=${classId}`);
      const data = await res.json();
      if (Array.isArray(data.data)) {
        type Row = { id?: string; teacher: string; color: string };
        setItems((data.data as Row[]).map((r) => ({ ...r, _editing: false })));
      }
    } catch {
      toast.error("Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (classId) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load only depends on classId and is recreated when it changes
  }, [classId]);

  function updateItem(idx: number, patch: Partial<RowState>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      { id: uuid(), teacher: "", color: "#ffffff", _editing: true },
    ]);
  }

  async function remove(id?: string, index?: number) {
    if (!id) {
      setItems((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    try {
      const res = await fetch(
        `/api/class/teacherColors?id=${encodeURIComponent(
          id,
        )}&class_id=${classId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      toast.success("Gelöscht");
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e: unknown) {
      toast.error("Löschen fehlgeschlagen", { description: String(e) });
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        class_id: classId,
        items: items.map((it) => ({
          id: it.id,
          teacher: it.teacher.trim(),
          color: it.color,
        })),
      };
      const res = await fetch(`/api/class/teacherColors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      toast.success("Gespeichert");
      if (data.data)
        setItems(
          data.data.map(
            (d: { id?: string; teacher: string; color: string }) => ({
              ...d,
              _editing: false,
            }),
          ),
        );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Speichern fehlgeschlagen";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 h-full flex-1">
      <div className="flex flex-col gap-2 flex-wrap sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          size="default"
          onClick={addRow}
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span>Neu</span>
        </Button>
        <Button
          size="default"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Speichert..." : "Speichern"}</span>
        </Button>
      </div>
      <Separator />
      {loading ? (
        <div className="flex flex-1 justify-center items-center h-full">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Noch keine Einträge
            </div>
          )}
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
                    value={item.color}
                    onChange={(e) => updateItem(idx, { color: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
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
                      {item.teacher || <span className="italic">(leer)</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editing ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex items-center gap-1"
                      onClick={() => updateItem(idx, { _editing: false })}
                    >
                      <CheckIcon />
                      <span className="hidden md:inline">Fertig</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => updateItem(idx, { _editing: true })}
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden md:inline">Bearbeiten</span>
                    </Button>
                  )}
                  <Button
                    size="sm"
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
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
