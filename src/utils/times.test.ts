import { describe, test, expect } from "bun:test";
import { getTimeForHour, getTimesForTimetable } from "./times";
import type { Lesson } from "@/types/timetableData";

// Factory helper to create Lesson objects with sensible defaults
function createLesson(
  overrides: Partial<Lesson> & Pick<Lesson, "id" | "hour" | "day">
): Lesson {
  return {
    subject: "Fach",
    teacher: "Lehrer",
    room: "Raum",
    notes: null,
    group: 1 as Lesson["group"],
    startTime: "08:00",
    endTime: "08:45",
    week_id: "w1",
    ...overrides,
  };
}

describe("getTimeForHour", () => {
  test("sollte normale Zeiten für Stunde 1 zurückgeben", () => {
    const currentLesson = createLesson({
      id: "l1",
      hour: 1,
      day: "Montag",
      subject: "Mathe",
      teacher: "Schmidt",
      room: "101",
      startTime: "08:00",
      endTime: "08:45",
    });
    const allLessonsForDay: Lesson[] = [currentLesson];

    const result = getTimeForHour(1, currentLesson, allLessonsForDay);
    expect(result).toEqual({ start: "07:55", end: "08:40" });
  });

  test("sollte normale Zeiten für Stunde 2 zurückgeben", () => {
    const currentLesson = createLesson({
      id: "l2",
      hour: 2,
      day: "Montag",
      subject: "Deutsch",
      teacher: "Müller",
      room: "102",
      startTime: "08:50",
      endTime: "09:35",
    });
    const allLessonsForDay: Lesson[] = [currentLesson];

    const result = getTimeForHour(2, currentLesson, allLessonsForDay);
    expect(result).toEqual({ start: "08:40", end: "09:25" });
  });

  test("sollte angepasste Zeiten für Stunde 3 bei Doppelstunde zurückgeben", () => {
    const currentLesson = createLesson({
      id: "l3",
      hour: 3,
      day: "Dienstag",
      subject: "Physik",
      teacher: "Weber",
      room: "201",
      startTime: "09:45",
      endTime: "10:30",
      week_id: "w2",
    });

    const allLessonsForDay: Lesson[] = [
      currentLesson,
      createLesson({
        id: "l4",
        hour: 4,
        day: "Dienstag",
        subject: "Physik",
        teacher: "Weber",
        room: "201",
        startTime: "10:30",
        endTime: "11:15",
        week_id: "w2",
      }),
    ];

    const result = getTimeForHour(3, currentLesson, allLessonsForDay);
    expect(result).toEqual({ start: "09:45", end: "10:30" });
  });

  test("sollte normale Zeiten für Stunde 3 ohne Doppelstunde zurückgeben", () => {
    const currentLesson = createLesson({
      id: "l5",
      hour: 3,
      day: "Mittwoch",
      subject: "Englisch",
      teacher: "Meyer",
      room: "103",
      startTime: "09:25",
      endTime: "10:10",
      week_id: "w3",
    });

    const allLessonsForDay: Lesson[] = [
      currentLesson,
      createLesson({
        id: "l6",
        hour: 4,
        day: "Mittwoch",
        subject: "Geschichte",
        teacher: "Fischer",
        room: "104",
        startTime: "10:30",
        endTime: "11:15",
        week_id: "w3",
      }),
    ];

    const result = getTimeForHour(3, currentLesson, allLessonsForDay);
    expect(result).toEqual({ start: "09:25", end: "10:10" });
  });

  test("sollte Doppelstunden nur für die spezifische Gruppe erkennen", () => {
    const currentLesson = createLesson({
      id: "l7",
      hour: 3,
      day: "Donnerstag",
      subject: "Sport",
      teacher: "Wagner",
      room: "Halle",
      group: 2 as Lesson["group"],
      startTime: "10:10",
      endTime: "10:55",
      week_id: "w4",
    });

    const allLessonsForDay: Lesson[] = [
      currentLesson,
      createLesson({
        id: "l8",
        hour: 3,
        day: "Donnerstag",
        subject: "Chemie",
        teacher: "Schulz",
        room: "301",
        startTime: "09:45",
        endTime: "10:30",
        week_id: "w4",
      }),
      createLesson({
        id: "l9",
        hour: 4,
        day: "Donnerstag",
        subject: "Chemie",
        teacher: "Schulz",
        room: "301",
        startTime: "10:30",
        endTime: "11:15",
        week_id: "w4",
      }),
      createLesson({
        id: "l10",
        hour: 4,
        day: "Donnerstag",
        subject: "Kunst",
        teacher: "Becker",
        room: "Atelier",
        group: 2 as Lesson["group"],
        startTime: "11:00",
        endTime: "11:45",
        week_id: "w4",
      }),
    ];

    // Gruppe 2 hat KEINE Doppelstunde, also normale Zeiten
    const result = getTimeForHour(3, currentLesson, allLessonsForDay);
    expect(result).toEqual({ start: "09:25", end: "10:10" });
  });

  // Edge Cases Tests
  test("sollte mit hour = 0 umgehen (ungültiger Wert)", () => {
    const currentLesson = createLesson({
      id: "l_edge1",
      hour: 0,
      day: "Montag",
    });
    const allLessonsForDay: Lesson[] = [currentLesson];

    const result = getTimeForHour(0, currentLesson, allLessonsForDay);
    // hourToTimeMap hat keinen Eintrag für 0, daher sollte undefined zurückgegeben werden
    expect(result).toBeUndefined();
  });

  test("sollte mit negativer hour umgehen", () => {
    const currentLesson = createLesson({
      id: "l_edge2",
      hour: -1,
      day: "Montag",
    });
    const allLessonsForDay: Lesson[] = [currentLesson];

    const result = getTimeForHour(-1, currentLesson, allLessonsForDay);
    // hourToTimeMap hat keinen Eintrag für negative Zahlen
    expect(result).toBeUndefined();
  });

  test("sollte mit hour > 10 (außerhalb des definierten Bereichs) umgehen", () => {
    const currentLesson = createLesson({
      id: "l_edge3",
      hour: 100,
      day: "Montag",
    });
    const allLessonsForDay: Lesson[] = [currentLesson];

    const result = getTimeForHour(100, currentLesson, allLessonsForDay);
    // hourToTimeMap hat keinen Eintrag für 100
    expect(result).toBeUndefined();
  });

  test("sollte mit null currentLesson umgehen", () => {
    const allLessonsForDay: Lesson[] = [
      createLesson({
        id: "l_edge4",
        hour: 3,
        day: "Montag",
      }),
    ];

    // TypeScript würde dies normalerweise verhindern, aber zur Laufzeit könnte es passieren
    // Bei hour=3 greift die Funktion auf currentLesson.group zu
    expect(() => {
      getTimeForHour(3, null as unknown as Lesson, allLessonsForDay);
    }).toThrow(TypeError);
  });

  test("sollte mit undefined currentLesson umgehen", () => {
    const allLessonsForDay: Lesson[] = [
      createLesson({
        id: "l_edge5",
        hour: 3,
        day: "Montag",
      }),
    ];

    // Bei hour=3 greift die Funktion auf currentLesson.group zu
    expect(() => {
      getTimeForHour(3, undefined as unknown as Lesson, allLessonsForDay);
    }).toThrow(TypeError);
  });

  test("sollte mit leerem allLessonsForDay Array umgehen", () => {
    const currentLesson = createLesson({
      id: "l_edge6",
      hour: 1,
      day: "Montag",
    });
    const allLessonsForDay: Lesson[] = [];

    const result = getTimeForHour(1, currentLesson, allLessonsForDay);
    // Mit leerem Array sollte keine Doppelstunde erkannt werden, normale Zeiten zurückgegeben
    expect(result).toEqual({ start: "07:55", end: "08:40" });
  });

  test("sollte mit null allLessonsForDay umgehen", () => {
    const currentLesson = createLesson({
      id: "l_edge7",
      hour: 1,
      day: "Montag",
    });

    // Die Funktion gibt bei null/undefined die Standardzeiten aus hourToTimeMap zurück
    // da hasDoubleLessonForGroup false zurückgibt wenn das Array nicht durchsuchbar ist
    const result = getTimeForHour(1, currentLesson, null as unknown as Lesson[]);
    expect(result).toEqual({ start: "07:55", end: "08:40" });
  });

  test("sollte mit undefined allLessonsForDay umgehen", () => {
    const currentLesson = createLesson({
      id: "l_edge8",
      hour: 1,
      day: "Montag",
    });

    // Ähnlich wie null, gibt die Funktion die Standardzeiten zurück
    const result = getTimeForHour(1, currentLesson, undefined as unknown as Lesson[]);
    expect(result).toEqual({ start: "07:55", end: "08:40" });
  });

  test("sollte mit Stunde 11 (gerade außerhalb des definierten Bereichs) umgehen", () => {
    const currentLesson = createLesson({
      id: "l_edge9",
      hour: 11,
      day: "Montag",
    });
    const allLessonsForDay: Lesson[] = [currentLesson];

    const result = getTimeForHour(11, currentLesson, allLessonsForDay);
    // hourToTimeMap geht nur bis 10
    expect(result).toBeUndefined();
  });
});

describe("getTimesForTimetable", () => {
  test("sollte Zeiten für einzelne Stunde korrekt zurückgeben", () => {
    const groupedByDay = [
      {
        day: "Montag",
        hours: [
          {
            day: "Montag",
            hour: 1,
            lessons: [
              createLesson({
                id: "l11",
                hour: 1,
                day: "Montag",
                subject: "Mathe",
                teacher: "Schmidt",
                room: "101",
                startTime: "08:00",
                endTime: "08:45",
              }),
            ],
          },
        ],
      },
    ];

    const result = getTimesForTimetable(groupedByDay, 0, 1);
    expect(result).toEqual({ startTime: "08:00", endTime: "08:45" });
  });

  test("sollte mehrere unterschiedliche Zeiten mit | trennen", () => {
    const groupedByDay = [
      {
        day: "Dienstag",
        hours: [
          {
            day: "Dienstag",
            hour: 3,
            lessons: [
              createLesson({
                id: "l12",
                hour: 3,
                day: "Dienstag",
                subject: "Physik",
                teacher: "Weber",
                room: "201",
                startTime: "09:45",
                endTime: "10:30",
                week_id: "w2",
              }),
              createLesson({
                id: "l13",
                hour: 3,
                day: "Dienstag",
                subject: "Englisch",
                teacher: "Meyer",
                room: "103",
                group: 2 as Lesson["group"],
                startTime: "10:10",
                endTime: "10:55",
                week_id: "w2",
              }),
            ],
          },
        ],
      },
    ];

    const result = getTimesForTimetable(groupedByDay, 0, 3);
    expect(result).toEqual({ startTime: "09:45 | 10:10", endTime: "10:30 | 10:55" });
  });

  test("sollte Standardzeiten verwenden wenn keine Lessons vorhanden sind", () => {
    const groupedByDay = [
      {
        day: "Mittwoch",
        hours: [
          {
            day: "Mittwoch",
            hour: 5,
            lessons: [],
          },
        ],
      },
    ];

    const result = getTimesForTimetable(groupedByDay, 0, 5);
    expect(result).toEqual({ startTime: "11:15", endTime: "12:00" });
  });

  test("sollte Standardzeiten verwenden wenn Stunde nicht existiert", () => {
    const groupedByDay = [
      {
        day: "Donnerstag",
        hours: [],
      },
    ];

    const result = getTimesForTimetable(groupedByDay, 0, 2);
    expect(result).toEqual({ startTime: "08:40", endTime: "09:25" });
  });

  test("sollte identische Zeiten nicht duplizieren", () => {
    const groupedByDay = [
      {
        day: "Freitag",
        hours: [
          {
            day: "Freitag",
            hour: 1,
            lessons: [
              createLesson({
                id: "l14",
                hour: 1,
                day: "Freitag",
                subject: "Mathe",
                teacher: "Schmidt",
                room: "101",
                week_id: "w5",
              }),
              createLesson({
                id: "l15",
                hour: 1,
                day: "Freitag",
                subject: "Deutsch",
                teacher: "Müller",
                room: "102",
                group: 2 as Lesson["group"],
                week_id: "w5",
              }),
              createLesson({
                id: "l16",
                hour: 1,
                day: "Freitag",
                subject: "Englisch",
                teacher: "Meyer",
                room: "103",
                group: 3 as Lesson["group"],
                week_id: "w5",
              }),
            ],
          },
        ],
      },
    ];

    const result = getTimesForTimetable(groupedByDay, 0, 1);
    expect(result).toEqual({ startTime: "08:00", endTime: "08:45" });
  });
});
