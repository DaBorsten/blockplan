"use client";
import { useEffect, useRef, useState, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useCurrentClass, useSetClass } from "@/store/useClassStore";
import { useCurrentWeek, useSetWeek } from "@/store/useWeekStore";

/**
 * UnifiedValidityGuard
 *
 * Vereinheitlicht die Validierung von classId und weekId.
 * - Prüft zuerst Klassenmitgliedschaften über listClassesSafe (wirft nie) und setzt ungültige classId -> null.
 * - Wenn classId vorhanden und gültig, lädt die Wochenliste (listWeeks) und validiert weekId.
 * - Ungültige weekId (nicht zur Klasse oder gelöscht) -> reset auf null.
 * - Rendert Kinder erst nach abgeschlossener Validierung, um Convex Fehler durch ungültige IDs zu vermeiden.
 */
export function StoresValidityGuard({ children }: { children: ReactNode }) {
  const classId = useCurrentClass();
  const weekId = useCurrentWeek();
  const setClass = useSetClass();
  const setWeek = useSetWeek();

  const classesSafe = useQuery(api.classes.listClassesSafe, {});

  // Wir triggern die Weeks Query erst, wenn wir sicher wissen, dass classId gültig ist.
  const [classValidated, setClassValidated] = useState(false);
  const [isValidClass, setIsValidClass] = useState(false);

  // Phase 1: Klassenvalidierung
  useEffect(() => {
    if (!classesSafe) return; // lädt
    const validClassIds = new Set(classesSafe.classes.map((c) => c.class_id));
    if (classId && !validClassIds.has(classId)) {
      if (!classInvalidRef.current) {
        classInvalidRef.current = true;
        setClass(null);
        setWeek(null);
      }
      setIsValidClass(false);
    } else {
      classInvalidRef.current = false;
      setIsValidClass(!!classId); // true nur wenn eine (gültige) Klasse gewählt ist
    }
    setClassValidated(true);
  }, [classesSafe, classId, setClass, setWeek]);

  const weeksRaw = useQuery(
    api.weeks.listWeeks,
    classValidated && isValidClass && classId ? { classId } : "skip",
  );

  const [validated, setValidated] = useState(false);
  const classInvalidRef = useRef(false);
  const weekInvalidRef = useRef(false);

  // Schritt 2: Wochen validieren (nur wenn Klasse gültig & vorhanden und bereits validiert)
  useEffect(() => {
    if (!classValidated) return; // warten bis Phase 1 abgeschlossen
    if (classInvalidRef.current) {
      // Klasse wurde ungültig gemacht
      setValidated(true);
      return;
    }
    if (!isValidClass || !classId) {
      // Keine Klasse gewählt => weekId egal, aber wir sind fertig
      if (!validated) setValidated(true);
      return;
    }
    if (weeksRaw === undefined) return; // Wochenliste lädt
    if (weeksRaw === null) {
      // Sollte nicht passieren (Query wirft eher), aber failsafe
      if (weekId) setWeek(null);
      setValidated(true);
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
    setValidated(true);
  }, [
    classValidated,
    isValidClass,
    classId,
    weeksRaw,
    weekId,
    setWeek,
    validated,
  ]);

  if (!validated) return null; // Optional: Placeholder möglich
  return <>{children}</>;
}
