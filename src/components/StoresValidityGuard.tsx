"use client";
import { useEffect, useRef, useMemo, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useCurrentClass, useSetClass } from "@/store/useClassStore";
import { useCurrentWeek, useSetWeek } from "@/store/useWeekStore";

export function StoresValidityGuard({ children }: { children: ReactNode }) {
  const classId = useCurrentClass();
  const weekId = useCurrentWeek();
  const setClass = useSetClass();
  const setWeek = useSetWeek();

  const classesSafe = useQuery(api.classes.listClassesSafe, {});

  // Phase 1: Klassenvalidierung - nur Berechnungen
  const { isValidClass, classValidated, shouldResetClass } = useMemo(() => {
    if (!classesSafe) {
      return { isValidClass: false, classValidated: false, shouldResetClass: false };
    }
    const validClassIds = new Set(classesSafe.classes.map((c) => c.class_id));
    const isValidClass = classId ? validClassIds.has(classId) : false;
    const shouldResetClass = Boolean(classId && !isValidClass);
    return { isValidClass, classValidated: true, shouldResetClass };
  }, [classesSafe, classId]);

  const weeksRaw = useQuery(
    api.weeks.listWeeks,
    classValidated && isValidClass && classId ? { classId } : "skip",
  );

  const shouldResetWeek = useMemo(() => {
    if (!classValidated) return false;
    if (!isValidClass || !classId) return false;
    if (weeksRaw === undefined) return false;
    if (weeksRaw === null) return Boolean(weekId);
    if (!weekId) return false;
    const validWeekIds = new Set(weeksRaw.map((w) => String(w.id)));
    return !validWeekIds.has(String(weekId));
  }, [classValidated, isValidClass, classId, weeksRaw, weekId]);

  // Phase 2: Gesamtvalidierung - nur Berechnungen
  const isFullyValidated = useMemo(() => {
    if (!classValidated) return false;
    if (shouldResetClass) return false;
    if (!isValidClass || !classId) return true;

    if (weeksRaw === undefined) return false;

    if (weeksRaw === null) return true;

    if (shouldResetWeek) return false;

    return true;
  }, [classValidated, isValidClass, classId, weeksRaw, shouldResetClass, shouldResetWeek]);

  const classInvalidRef = useRef(false);
  const weekInvalidRef = useRef(false);

  // Side-Effect 1: Klassenvalidierung
  useEffect(() => {
    if (!classesSafe) return;
    const validClassIds = new Set(classesSafe.classes.map((c) => c.class_id));
    if (classId && !validClassIds.has(classId)) {
      if (!classInvalidRef.current) {
        classInvalidRef.current = true;
        setClass(null);
        setWeek(null);
      }
    } else {
      classInvalidRef.current = false;
    }
  }, [classesSafe, classId, setClass, setWeek]);

  // Side-Effect 2: Wochenvalidierung
  useEffect(() => {
    if (!classValidated || !isValidClass || !classId) return;
    if (weeksRaw === undefined) return;

    if (weeksRaw === null) {
      if (weekId) setWeek(null);
      return;
    }
    const validWeekIds = new Set(weeksRaw.map((w) => String(w.id)));
    if (weekId && !validWeekIds.has(String(weekId))) {
      if (!weekInvalidRef.current) {
        weekInvalidRef.current = true;
        setWeek(null);
      }
    } else {
      weekInvalidRef.current = false;
    }
  }, [classValidated, isValidClass, classId, weeksRaw, weekId, setWeek]);

  if (!isFullyValidated) return null;
  return <>{children}</>;
}
