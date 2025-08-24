"use client";
import { useCallback, useEffect, useState } from "react";

export type TeacherColorRecord = { id?: string; teacher: string; color: string };

export function useTeacherColors(classId: string | undefined, userId: string | undefined) {
  const [data, setData] = useState<TeacherColorRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!classId || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/class/teacherColors?class_id=${classId}&user_id=${userId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler beim Laden");
      if (Array.isArray(json.data)) setData(json.data as TeacherColorRecord[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, [classId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const getColor = useCallback(
    (teacher: string | null | undefined): string | null => {
      if (!teacher) return null;
      return (
        data.find((t) => t.teacher === teacher)?.color ?? null
      );
    },
    [data],
  );

  return { data, loading, error, reload: load, getColor };
}
