import { NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

export const runtime = "nodejs";

export async function POST() {
  try {
    await turso.execute(`
		CREATE TABLE IF NOT EXISTS user (
			id TEXT PRIMARY KEY NOT NULL
		);`);

    await turso.execute(`
		CREATE TABLE IF NOT EXISTS class (
			id TEXT PRIMARY KEY NOT NULL,
			owner_id TEXT NOT NULL,
			title TEXT NOT NULL,
			FOREIGN KEY (owner_id) REFERENCES user(id) ON DELETE CASCADE
		);`);

    await turso.execute(`
		CREATE TABLE IF NOT EXISTS user_class (
			user_id TEXT NOT NULL,
			class_id TEXT NOT NULL,
			role TEXT NOT NULL,
			PRIMARY KEY (user_id, class_id),
			FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
			FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE CASCADE
		);`);

    await turso.execute(`
		CREATE TABLE IF NOT EXISTS invitation (
			id TEXT PRIMARY KEY NOT NULL,
			user_id TEXT NOT NULL,
			class_id TEXT NOT NULL,
			expiration_date TEXT NOT NULL,
			FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
			FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE CASCADE
		);`);

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

    return NextResponse.json({ dbInitialized: true });
  } catch (error) {
    console.error("Error initializing database:", error);
    return NextResponse.json(
      { dbInitialized: false, error: String(error) },
      { status: 500 },
    );
  }
}
