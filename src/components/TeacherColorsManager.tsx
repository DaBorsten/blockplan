"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type TeacherColor = { id?: string; teacher: string; color: string };

interface Props {
  classId: string;
  userId: string;
}

export function TeacherColorsManager({ classId, userId }: Props) {
  const [items, setItems] = useState<TeacherColor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/class/teacherColors?class_id=${classId}&user_id=${userId}`,
      );
      const data = await res.json();
      if (Array.isArray(data.data)) {
        type Row = { id: string; teacher: string; color: string };
        setItems(
          (data.data as Row[]).map((r) => ({
            id: r.id,
            teacher: r.teacher,
            color: r.color,
          })),
        );
      }
    } catch {
      // load error
      toast.error("Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (classId && userId) {
      void load();
    }
    // intentionally excluding load from deps to avoid recreating; load only depends on classId/userId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, userId]);

  function updateItem(idx: number, patch: Partial<TeacherColor>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  }

  function addRow() {
    setItems((prev) => [...prev, { teacher: "", color: "#ffffff" }]);
  }

  async function remove(id?: string, index?: number) {
    if (!id) {
      setItems((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    try {
      const res = await fetch(
        `/api/class/teacherColors?id=${id}&class_id=${classId}&user_id=${userId}`,
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
      const res = await fetch(`/api/class/teacherColors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: classId, user_id: userId, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      toast.success("Gespeichert");
      if (data.data) setItems(data.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Speichern fehlgeschlagen";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Farben & Kürzel</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addRow}>
            Neu
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "Speichert..." : "Speichern"}
          </Button>
        </div>
      </div>
      <Separator />
      {loading ? (
        <div className="text-sm text-muted-foreground">Lade...</div>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Noch keine Einträge
            </div>
          )}
          {items.map((item, idx) => (
            <div key={item.id || idx} className="flex gap-2 items-center">
              <Input
                placeholder="Lehrerkürzel"
                value={item.teacher}
                className="w-32"
                onChange={(e) => updateItem(idx, { teacher: e.target.value })}
              />
              <Input
                type="color"
                className="w-16 h-9 p-1"
                value={item.color}
                onChange={(e) => updateItem(idx, { color: e.target.value })}
              />
              <div
                className="flex-1 h-9 rounded border"
                style={{ background: item.color }}
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => remove(item.id, idx)}
              >
                Entfernen
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
