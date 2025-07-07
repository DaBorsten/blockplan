import { hourToTimeMap } from "@/constants/hourToTimeMap";
import { Lesson, LessonForImport } from "@/types/timetableData";

type LessonWithHour = LessonForImport & { hour: number };

// Funktion zur Erkennung von Doppelstunden für eine bestimmte Spezialisierung
function hasDoubleLessonForSpecialization(
  lessons: Lesson[] | LessonWithHour[],
  specialization: number,
): boolean {
  const lesson3 = lessons.find(
    (l) => l.hour === 3 && l.specialization === specialization,
  );
  const lesson4 = lessons.find(
    (l) => l.hour === 4 && l.specialization === specialization,
  );

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
  // Wenn es Stunde 3 ist und für diese Spezialisierung eine Doppelstunde zwischen 3-4 existiert
  if (
    hour === 3 &&
    hasDoubleLessonForSpecialization(
      allLessonsForDay,
      currentLesson.specialization,
    )
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

    // Nach Spezialisierung sortieren und dann unique Zeiten sammeln
    const spec1Time = hourData.lessons.find((l) => l.specialization === 1)?.[
      timeType
    ];

    const spec2Time = hourData.lessons.find((l) => l.specialization === 2)?.[
      timeType
    ];
    const spec3Time = hourData.lessons.find((l) => l.specialization === 3)?.[
      timeType
    ];

    const times = [];
    if (spec1Time) times.push(spec1Time);
    if (spec2Time && spec2Time !== spec1Time) times.push(spec2Time);
    if (spec3Time && spec3Time !== spec1Time && spec3Time !== spec2Time)
      times.push(spec3Time);

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
