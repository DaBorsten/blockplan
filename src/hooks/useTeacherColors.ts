import { useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

export type TeacherColorRecord = {
  id?: string;
  teacher: string;
  color: string;
  subjects?: { id: string; subject: string; color: string }[];
};

export function useTeacherColors(classId: Id<"classes"> | undefined) {
  const data = useQuery(
    api.teacherColors.listTeacherColors,
    classId ? { classId } : "skip",
  );

  const colorMap = useMemo(() => {
    const map = new Map<
      string,
      { base: string; subjects: Map<string, string> }
    >();
    for (const d of data ?? []) {
      const subjectMap = new Map<string, string>();
      if (d.subjects) {
        for (const s of d.subjects) {
          subjectMap.set(s.subject, s.color);
        }
      }
      map.set(d.teacher, { base: d.color, subjects: subjectMap });
    }
    return map;
  }, [data]);

  const getColor = useCallback(
    (
      teacher: string | null | undefined,
      subject?: string | null,
    ): { base: string | null; subject: string | null } => {
      if (!teacher) return { base: null, subject: null };
      const entry = colorMap.get(teacher);
      if (!entry) return { base: null, subject: null };

      const subjectColor = subject ? (entry.subjects.get(subject) ?? null) : null;
      return { base: entry.base, subject: subjectColor };
    },

    [colorMap],
  );

  return {
    data: data ?? [],
    loading: classId ? data === undefined : false,
    error: null,
    reload: () => {},
    getColor,
  };
}
