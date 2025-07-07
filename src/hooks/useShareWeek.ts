import { Specialization } from "@/store/useSpecializationStore";
import * as SQLite from "expo-sqlite";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { ToastAndroid } from "react-native";
import { getWeekNotes } from "@/utils/db";
import { Specializations } from "@/types/specialization";
import { weekIDWithName } from "@/types/weekIDWithName";

export function useShareWeek() {
  return async function shareWeek(
    db: SQLite.SQLiteDatabase,
    week_id: string | null,
    specialization: Specialization,
    specializations: Specializations,
    weekIDsWithNames: weekIDWithName[],
  ) {
    if (!week_id) {
      ToastAndroid.show("Keine Woche ausgewählt", ToastAndroid.SHORT);
      return;
    }
    try {
      if (await Sharing.isAvailableAsync) {
        const allNotes = await getWeekNotes(db, week_id, specialization);

        if (!allNotes || allNotes.length === 0) {
          ToastAndroid.show("Keine Notizen gefunden", ToastAndroid.SHORT);
          return;
        }

        const WEEKDAYS_ORDER = [
          "Montag",
          "Dienstag",
          "Mittwoch",
          "Donnerstag",
          "Freitag",
        ];

        const grouped = new Map<string, typeof allNotes>();

        for (const row of allNotes) {
          if (!grouped.has(row.day)) grouped.set(row.day, []);
          grouped.get(row.day)!.push(row);
        }

        let output = "";

        for (const day of WEEKDAYS_ORDER) {
          const notesOfDay = grouped.get(day);
          if (!notesOfDay) continue;

          const sorted = notesOfDay.sort((a, b) => a.hour - b.hour);
          output += `${day}:\n`;
          for (const entry of sorted) {
            output += `${entry.subject}/${entry.teacher}: ${entry.notes}\n`;
          }
          output += `\n`;
        }

        output.trim();

        const activeWeek = weekIDsWithNames.find((w) => w.value === week_id);
        const activeSpecialization = specializations.find(
          (s) => s.value === specialization,
        );

        const fileUri =
          FileSystem.documentDirectory +
            (activeWeek?.label +
              " - " +
              activeSpecialization?.label +
              ".txt") || "week.txt";

        // Datei mit Inhalt erstellen
        await FileSystem.writeAsStringAsync(fileUri, output);

        await Sharing.shareAsync(fileUri);

        await FileSystem.deleteAsync(fileUri);
      }
    } catch (err) {
      console.error(err);
    }
  };
}
