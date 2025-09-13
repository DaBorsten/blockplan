import { useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

export type TeacherColorRecord = {
  id?: string;
  teacher: string;
  color: string;
};

export function useTeacherColors(classId: Id<"classes"> | undefined) {
  const data = useQuery(
    api.teacherColors.listTeacherColors,
    classId ? { classId } : "skip",
  );

  const colorByTeacher = useMemo(
    () =>
      new Map<string, string>((data ?? []).map((d) => [d.teacher, d.color])),
    [data],
  );

  const getColor = useCallback(
    (teacher: string | null | undefined): string | null =>
      teacher ? (colorByTeacher.get(teacher) ?? null) : null,

    [colorByTeacher],
  );

  return {
    data: data ?? [],
    loading: classId ? data === undefined : false,
    error: null,
    reload: () => {},
    getColor,
  };
}
