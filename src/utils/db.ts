import { Specialization } from "@/store/useSpecializationStore";
import {
  DayScheduleForImport,
  LessonForImport,
  TimetableForClassForImport,
  TimetableForImport,
} from "@/types/timetableData";
import { TimetableDatabase } from "@/types/timetableDatabase";
import { turso } from "@/lib/tursoClient";
import { getTimeForHour } from "./times";
import { v4 } from "uuid";

export async function InitializeDatabase(): Promise<{
  dbInitialized: boolean;
}> {
  try {
    await turso.execute(`
    CREATE TABLE IF NOT EXISTS timetable_week (
      id TEXT PRIMARY KEY NOT NULL,
      week_title TEXT NOT NULL,
      class TEXT NOT NULL
    );`);

    await turso.execute(`
        CREATE TABLE IF NOT EXISTS timetable (
          id TEXT PRIMARY KEY NOT NULL, 
          week_id TEXT NOT NULL,
          day TEXT NOT NULL,
          hour INT NOT NULL,
          startTime TEXT NOT NULL,
          endTime TEXT NOT NULL,
          subject TEXT NOT NULL,
          teacher TEXT NOT NULL,
          room TEXT NOT NULL,
          notes TEXT,
          FOREIGN KEY (week_id) REFERENCES timetable_week(id) ON DELETE CASCADE
        );`);

    await turso.execute(`
        CREATE TABLE IF NOT EXISTS timetable_specialization (
          id TEXT PRIMARY KEY NOT NULL,
          timetable_id TEXT NOT NULL,
          specialization INTEGER NOT NULL,
          FOREIGN KEY (timetable_id) REFERENCES timetable(id) ON DELETE CASCADE,
          UNIQUE(timetable_id, specialization)
        );`);

    await turso.execute("PRAGMA foreign_keys = ON");

    return { dbInitialized: true };
  } catch (error) {
    console.error("Error initializing database:", error);
    return { dbInitialized: false };
  }
}

export async function CreateTimetable(
  timetable: TimetableForImport,
  week: string,
) {
  try {
    const week_id = v4();
    const className = timetable.class;
    const timetableData = timetable.timetable;

    await turso.execute(
      `INSERT INTO timetable_week (id, week_title, class) VALUES (?, ?, ?)`,
      [week_id, week, className],
    );

    for (const day in timetableData) {
      const daySchedule =
        timetableData[day as keyof TimetableForClassForImport];

      // Alle Lessons des Tages sammeln
      type LessonWithHour = LessonForImport & { hour: number };

      const allLessonsForDay: LessonWithHour[] = [];

      for (const hourStr in daySchedule) {
        const lessons = daySchedule[hourStr as keyof DayScheduleForImport];
        if (lessons) {
          allLessonsForDay.push(
            ...lessons.map((l) => ({ ...l, hour: parseInt(hourStr, 10) })),
          );
        }
      }

      for (const hourStr in daySchedule) {
        const hour = parseInt(hourStr, 10);
        const lessons = daySchedule[hourStr as keyof DayScheduleForImport];

        if (lessons) {
          for (const lesson of lessons) {
            const lessonId = v4();

            const timeSlot = getTimeForHour(hour, lesson, allLessonsForDay);

            // Haupteintrag in timetable Tabelle
            await turso.execute(
              `INSERT INTO timetable (id, week_id, day, hour, startTime, endTime, subject, teacher, room, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                lessonId,
                week_id,
                day,
                hour,
                timeSlot.start,
                timeSlot.end,
                lesson.subject,
                lesson.teacher,
                lesson.room,
                null,
              ],
            );

            // Spezialisierungen in separate Tabelle
            const specialization = lesson.specialization;

            const specializationId = v4();

            await turso.execute(
              `INSERT INTO timetable_specialization (id, timetable_id, specialization)
                 VALUES (?, ?, ?);`,
              [specializationId, lessonId, specialization],
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error creating timetable data:", error);
  }
}

export async function LoadDB() {
  try {
    const result = await turso.execute(`SELECT * FROM timetable;`);
    const result2 = await turso.execute(
      `SELECT * FROM timetable_specialization;`,
    );
    const result3 = await turso.execute(`SELECT * FROM timetable_week;`);
    return [result, result2, result3];
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
}

export async function LoadSpecificTimetables(
  WeekID: string,
  specialization: Specialization,
) {
  try {
    // Bestimme welche Spezialisierungen geladen werden sollen
    let specializationIds: number[];
    if (specialization === 1) {
      specializationIds = [1, 2, 3];
    } else if (specialization === 2) {
      specializationIds = [1, 2];
    } else if (specialization === 3) {
      specializationIds = [1, 3];
    } else {
      specializationIds = [specialization];
    }

    const placeholders = specializationIds.map(() => "?").join(",");

    const result: TimetableDatabase[] = await turso.execute(
      `SELECT timetable.*, timetable_specialization.specialization
       FROM timetable 
       JOIN timetable_specialization ON timetable.id = timetable_specialization.timetable_id 
       WHERE timetable.week_id = ? AND timetable_specialization.specialization IN (${placeholders});`,
      [WeekID, ...specializationIds],
    );
    return result;
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
}

export async function DeleteTimetablesInDB() {
  try {
    await turso.execute(`DELETE FROM timetable;`);
    await turso.execute(`DELETE FROM timetable_specialization;`);
    await turso.execute(`DELETE FROM timetable_week;`);
    console.log("All timetables deleted successfully.");
  } catch (error) {
    console.error("Error deleting timetables:", error);
  }
}

export async function DeleteTimetableDB() {
  try {
    await turso.execute(`DROP TABLE IF EXISTS timetable;`);
    await turso.execute(`DROP TABLE IF EXISTS timetable_specialization;`);
    await turso.execute(`DROP TABLE IF EXISTS timetable_week;`);
    console.log("timetable table deleted successfully.");
  } catch (error) {
    console.error("Error deleting timetable table:", error);
  }
}

export async function getAllWeekIdsWithNames() {
  try {
    const result = await turso.execute(
      `SELECT id as week_id, MIN(week_title) as week_title FROM timetable_week GROUP BY id;`,
    );
    return result.rows;
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
}

export async function DeleteImportsFromDatabase(weekID: string) {
  try {
    await turso.execute(`DELETE from timetable_week where id = ?;`, [weekID]);
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
}

export async function updateWeekName(weekID: string, newWeekName: string) {
  try {
    await turso.execute(
      `UPDATE timetable_week SET week_title = ? WHERE id = ?;`,
      [newWeekName, weekID],
    );
  } catch (error) {
    console.error("Error updating week name:", error);
    return [];
  }
}

export async function getNotes(lessonID: string) {
  try {
    const result: { notes: string | null } | null = await turso.execute(
      `SELECT notes from timetable WHERE id = ?;`,
      [lessonID],
    );

    if (!result) {
      return null;
    } else {
      return result.notes || null;
    }
  } catch (error) {
    console.error("Error selecting notes:", error);
    return null;
  }
}

export async function updateNotes(lessonID: string, notes: string | null) {
  try {
    console.log(lessonID);
    const trimmedNotes = notes?.trim() ?? null;
    const changedNotes = trimmedNotes === "" ? null : trimmedNotes;
    await turso.execute(`UPDATE timetable SET notes = ? WHERE id = ?;`, [
      changedNotes,
      lessonID,
    ]);
  } catch (error) {
    console.error("Error updating notes:", error);
    return [];
  }
}

export async function getWeekNotes(
  week_id: string,
  specialization: Specialization,
) {
  try {
    // Bestimme welche Spezialisierungen geladen werden sollen
    let specializationIds: number[];
    if (specialization === 1) {
      specializationIds = [1, 2, 3];
    } else if (specialization === 2) {
      specializationIds = [1, 2];
    } else if (specialization === 3) {
      specializationIds = [1, 3];
    } else {
      specializationIds = [specialization];
    }

    const placeholders = specializationIds.map(() => "?").join(",");

    const result = await turso.execute(
      `SELECT timetable.day, timetable.hour, timetable.subject, timetable.teacher, timetable.notes, timetable_specialization.specialization
       FROM timetable 
       JOIN timetable_specialization ON timetable.id = timetable_specialization.timetable_id 
       WHERE timetable.week_id = ? AND timetable_specialization.specialization IN (${placeholders}) AND timetable.notes IS NOT NULL AND TRIM(timetable.notes) != '';`,
      [week_id, ...specializationIds],
    );
    return result;
  } catch (error) {
    console.error("Error loading week notes:", error);
    return [];
  }
}

export async function getAllRelevantWeeksForNotesImport(
  excludeWeekId: string,
  specialization: Specialization,
) {
  try {
    // Bestimme welche Spezialisierungen geladen werden sollen
    let specializationIds: number[];
    if (specialization === 1) {
      specializationIds = [1, 2, 3];
    } else if (specialization === 2) {
      specializationIds = [1, 2];
    } else if (specialization === 3) {
      specializationIds = [1, 3];
    } else {
      specializationIds = [specialization];
    }

    const placeholders = specializationIds.map(() => "?").join(",");

    const result = await turso.execute(
      `
      SELECT 
        timetable.week_id,
        timetable_specialization.specialization,
        timetable_week.week_title,
        timetable_week.class,
        COUNT(*) AS noteCount,
        TRIM(SUBSTR(
          timetable_week.week_title,
          INSTR(timetable_week.week_title, 'KW'),
          INSTR(timetable_week.week_title || ' ', '_') - INSTR(timetable_week.week_title, 'KW')
        )) AS calendarWeek
      FROM timetable
      JOIN timetable_specialization ON timetable.id = timetable_specialization.timetable_id
      JOIN timetable_week ON timetable.week_id = timetable_week.id
      WHERE 
        timetable.week_id != ? AND
        timetable_specialization.specialization IN (${placeholders}) AND
        timetable.notes IS NOT NULL AND
        TRIM(timetable.notes) != ''
      GROUP BY 
        timetable.week_id,
        timetable_specialization.specialization,
        timetable_week.week_title,
        timetable_week.class
      `,
      [excludeWeekId, ...specializationIds],
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting relevant weeks for notes import:", error);
    return [];
  }
}

export async function copyNotesToCurrentWeek(
  currentWeekId: string,
  specialization: Specialization,
  selectedWeekID: string,
): Promise<number> {
  try {
    // 1. Einträge mit Notes aus der ausgewählten Woche + Spezialisierung laden
    const sourceNotes = await db.getAllAsync<
      TimetableDatabase & { class: string }
    >(
      `
      SELECT t.*, tw.class
      FROM timetable t
      JOIN timetable_specialization ts ON t.id = ts.timetable_id
      JOIN timetable_week tw ON t.week_id = tw.id
      WHERE
        t.week_id = ? AND
        ts.specialization = ? AND
        NULLIF(TRIM(t.notes), '') IS NOT NULL
      `,
      [selectedWeekID, specialization],
    );

    let updatedCount = 0;

    console.log(sourceNotes);

    for (const entry of sourceNotes) {
      // 2. Entsprechenden Eintrag in der aktuellen Woche suchen
      const matchingEntry = await turso.execute<
        TimetableDatabase & { id: string }
      >(
        `
        SELECT t.id
        FROM timetable t
        JOIN timetable_specialization ts ON t.id = ts.timetable_id
        JOIN timetable_week tw ON t.week_id = tw.id
        WHERE
          t.week_id = ? AND
          ts.specialization = ? AND
          t.day = ? AND
          t.hour = ? AND
          tw.class = ? AND
          t.subject = ? AND
          t.teacher = ? AND
          NULLIF(TRIM(t.notes), '') IS NULL
        `,
        [
          currentWeekId,
          specialization,
          entry.day,
          entry.hour,
          entry.class,
          entry.subject,
          entry.teacher,
        ],
      );

      // 3. Wenn Eintrag vorhanden, Notes übernehmen
      if (matchingEntry) {
        await turso.execute(
          `
          UPDATE timetable
          SET notes = ?
          WHERE id = ?
          `,
          [entry.notes, matchingEntry.id],
        );
        updatedCount++;
      }
    }

    return updatedCount;
  } catch (error) {
    console.error("Fehler beim Kopieren der Notizen:", error);
    return 0;
  }
}
