import { turso } from "@/lib/tursoClient";
import { ResultSet } from "@libsql/client";

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

export function mapRows(result: ResultSet) {
  return result.rows.map((row) =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]])),
  );
}
