import { getAllWeekIdsWithNames } from "./db";

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

export const fetchWeekIDsWithNames = async () => {
  const res = await fetch("/api/weeks");
  if (!res.ok) return [];
  const data = await res.json();
  if (data.weeks && data.weeks.length > 0) {
    const sortedWeeks = sortWeeksByName(data.weeks);
    return [
      {
        label: "Keine Woche",
        value: null,
      },
      ...sortedWeeks,
    ];
  }
  return [];
};
