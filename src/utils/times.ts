import { hourToTimeMap } from "@/constants/hourToTimeMap";
import { Lesson, LessonForImport } from "@/types/timetableData";

type LessonWithHour = LessonForImport & { hour: number };

// Funktion zur Erkennung von Doppelstunden für eine bestimmte Gruppe
function hasDoubleLessonForGroup(
  lessons: Lesson[] | LessonWithHour[],
  group: number,
): boolean {
  const lesson3 = lessons.find((l) => l.hour === 3 && l.group === group);
  const lesson4 = lessons.find((l) => l.hour === 4 && l.group === group);

  if (!lesson3 || !lesson4) return false;

  return (
    lesson3.subject === lesson4.subject && lesson3.teacher === lesson4.teacher
  );
}

// Funktion zur Generierung der angepassten Zeiten
export function getTimeForHour(
  hour: number,
  currentLesson: Lesson | LessonForImport,
  allLessonsForDay: Lesson[] | LessonWithHour[],
): { start: string; end: string } {
  // Wenn es Stunde 3 ist und für diese Gruppe eine Doppelstunde zwischen 3-4 existiert
  if (
    hour === 3 &&
    hasDoubleLessonForGroup(allLessonsForDay, currentLesson.group)
  ) {
    return { start: "09:45", end: "10:30" };
  }

  // Ansonsten normale Zeiten verwenden
  return hourToTimeMap[hour as keyof typeof hourToTimeMap];
}

export function getTimesForTimetable(
  groupedByDay: {
    day: string;
    hours: {
      day: string;
      hour: number;
      lessons: Lesson[];
    }[];
  }[],
  currentDayIndex: number,
  hour: number,
) {
  const hourData = groupedByDay[currentDayIndex]?.hours.find(
    (h) => h.hour === hour,
  );

  const getOrderedUniqueTimes = (timeType: "startTime" | "endTime") => {
    if (!hourData?.lessons) return [];

    const groups = [1, 2, 3] as const;
    const times: string[] = [];
    for (const g of groups) {
      const t = hourData.lessons.find((l) => l.group === g)?.[timeType];
      if (t && !times.includes(t)) times.push(t);
    }

    return times;
  };

  const startTimes = getOrderedUniqueTimes("startTime");
  const endTimes = getOrderedUniqueTimes("endTime");

  const startTime =
    startTimes.length > 0
      ? startTimes.join(" | ")
      : hourToTimeMap[hour as keyof typeof hourToTimeMap].start;

  const endTime =
    endTimes.length > 0
      ? endTimes.join(" | ")
      : hourToTimeMap[hour as keyof typeof hourToTimeMap].end;

  return { startTime, endTime };
}
