import { getAllWeekIdsWithNames } from "./db";
import * as SQLite from "expo-sqlite";

export const sortWeeksByName = (weeks) => {
  return weeks
    .map((item) => ({
      label: item.week_title,
      value: item.week_id,
    }))
    .sort((a, b) => {
      return b.label.localeCompare(a.label);
    });
};

export const fetchWeekIDsWithNames = async (db: SQLite.SQLiteDatabase) => {
  const result = await getAllWeekIdsWithNames(db);
  if (result.length > 0) {
    const sortedWeeks = sortWeeksByName(result);
    return [
      {
        label: "Keine Woche",
        value: null,
      },
      ...sortedWeeks,
    ];
  }
};
