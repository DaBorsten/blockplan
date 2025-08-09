import { Specialization } from "@/store/useSpecializationStore";
import {
  DayScheduleForImport,
  LessonForImport,
  TimetableForClassForImport,
  TimetableForImport,
} from "@/types/timetableData";
import { randomUUID } from "crypto";
import { getTimeForHour } from "./times";
import { supabase } from "@/lib/supabaseClient";

export async function CreateTimetable(
  timetable: TimetableForImport,
  week: string,
) {
  try {
    const week_id = randomUUID().toString();
    const className = timetable.class;
    const timetableData = timetable.timetable;

    await supabase.from("timetable_week").insert({
      id: week_id,
      week_title: week,
      class: className,
    });

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
            const lessonId = randomUUID.toString();

            const timeSlot = getTimeForHour(hour, lesson, allLessonsForDay);

            await supabase.from("timetable").insert({
              id: lessonId,
              week_id,
              day,
              hour,
              startTime: timeSlot.start,
              endTime: timeSlot.end,
              subject: lesson.subject,
              teacher: lesson.teacher,
              room: lesson.room,
              notes: null,
            });

            // Spezialisierungen in separate Tabelle
            const specialization = lesson.specialization;

            const specializationId = randomUUID.toString();

            await supabase.from("timetable_specialization").insert({
              id: specializationId,
              timetable_id: lessonId,
              specialization,
            });
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
    const result = await supabase.from("timetable").select("*");
    const result2 = await supabase.from("timetable_specialization").select("*");
    const result3 = await supabase.from("timetable_week").select("*");
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

    // const placeholders = specializationIds.map(() => "?").join(",");

    /* const result: TimetableDatabase[] = await db.getAllAsync(
      `SELECT timetable.*, timetable_specialization.specialization
       FROM timetable 
       JOIN timetable_specialization ON timetable.id = timetable_specialization.timetable_id 
       WHERE timetable.week_id = ? AND timetable_specialization.specialization IN (${placeholders});`,
      [WeekID, ...specializationIds],
    ); */

    const { data, error } = await supabase
      .from("timetable")
      .select(
        `
    *,
    timetable_specialization (
      specialization
    )
  `,
      )
      .eq("week_id", WeekID)
      .in("timetable_specialization.specialization", specializationIds);

    return data;
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
}

export async function DeleteTimetablesInDB() {
  try {
    await supabase.from("timetable").delete().neq("id", "");
    await supabase.from("timetable_specialization").delete().neq("id", "");
    await supabase.from("timetable_week").delete().neq("id", "");
    console.log("All timetables deleted successfully.");
  } catch (error) {
    console.error("Error deleting timetables:", error);
  }
}

export async function getAllWeekIdsWithNames() {
  try {
    const result = await supabase
      .from("timetable_week")
      .select("id, week_title")
      .order("id", { ascending: true });
    /* const result = await db.getAllAsync(
      `SELECT id as week_id, MIN(week_title) as week_title FROM timetable_week GROUP BY id;`,
    ); */
    return result;
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
}

export async function DeleteImportsFromDatabase(weekID: string) {
  try {
    await supabase.from("timetable_week").delete().eq("id", weekID);
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
}

export async function updateWeekName(weekID: string, newWeekName: string) {
  try {
    await supabase
      .from("timetable_week")
      .update({ week_title: newWeekName })
      .eq("id", weekID);
  } catch (error) {
    console.error("Error updating week name:", error);
    return [];
  }
}

export async function getNotes(lessonID: string) {
  try {
    const result = await await supabase
      .from("timetable")
      .select("notes")
      .eq("id", lessonID)
      .single();

    if (!result) {
      return null;
    } else {
      return result.data?.notes || null;
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
    await supabase
      .from("timetable")
      .update({ notes: changedNotes })
      .eq("id", lessonID);
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

    // const placeholders = specializationIds.map(() => "?").join(",");

    const { data, error } = await supabase
      .from("timetable")
      .select(
        `
        day,
        hour,
        subject,
        teacher,
        notes,
        timetable_specialization:specialization (
        specialization
        )
      `,
      )
      .eq("week_id", week_id)
      .in("timetable_specialization.specialization", specializationIds)
      .not("notes", "is", null)
      .not("notes", "eq", "");

    if (error) {
      throw error;
    }
    const result =
      data?.map((row) => ({
        day: row.day,
        hour: row.hour,
        subject: row.subject,
        teacher: row.teacher,
        notes: row.notes,
        specialization: Array.isArray(row.timetable_specialization)
          ? row.timetable_specialization[0]?.specialization
          : row.timetable_specialization?.specialization,
      })) ?? [];
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

    const result = await db.getAllAsync(
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
    return result;
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

    const sourceNotes = await supabase
      .from("timetable")
      .select(
        `
        *,
        timetable_specialization:specialization (
          specialization
        ),
        timetable_week (
          class
        )
      `,
      )
      .eq("week_id", selectedWeekID)
      .eq("timetable_specialization.specialization", specialization)
      .not("notes", "is", null)
      .not("notes", "eq", "")
      .order("day, hour");

    /* const sourceNotes = await db.getAllAsync<
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
    ); */

    let updatedCount = 0;

    console.log(sourceNotes);

    for (const entry of sourceNotes) {
      // 2. Entsprechenden Eintrag in der aktuellen Woche suchen

      const { data: matchingEntry, error } = await supabase
        .from("timetable")
        .select(
          `
    id,
    timetable_specialization!inner(specialization),
    timetable_week!inner(class)
  `,
        )
        .eq("week_id", currentWeekId)
        .eq("day", entry.day)
        .eq("hour", entry.hour)
        .eq("subject", entry.subject)
        .eq("teacher", entry.teacher)
        .eq("timetable_specialization.specialization", specialization)
        .eq("timetable_week.class", entry.class)
        .or("notes.is.null,notes.eq.''") // NULL oder leer
        .maybeSingle(); // gibt `null` zurück statt Fehler, wenn kein Eintrag gefunden

      if (error) {
        console.error("Fehler bei der Abfrage:", error);
      }

      /* const matchingEntry = await db.getFirstAsync<
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
      ); */

      // 3. Wenn Eintrag vorhanden, Notes übernehmen
      if (matchingEntry) {
        await supabase
          .from("timetable")
          .update({ notes: entry.notes })
          .eq("id", matchingEntry.id);
        updatedCount++;
      }
    }

    return updatedCount;
  } catch (error) {
    console.error("Fehler beim Kopieren der Notizen:", error);
    return 0;
  }
}
