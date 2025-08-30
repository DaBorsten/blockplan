import { weekIDWithTitle } from "@/types/weekIDWithTitle";

export const sortWeeksByName = (weeks: weekIDWithTitle[]) => {
  return weeks
    .map((item) => ({
      label: item.week_title,
      value: item.week_id,
    }))
    .sort((a, b) => {
      return b.label.localeCompare(a.label);
    });
};

export const fetchWeekIDsWithNames = async (classId: string) => {
  const params = new URLSearchParams({ class_id: classId });
  const res = await fetch(`/api/week/weeks?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  const result = data.data || [];
  if (result && result.length > 0) {
    const sortedWeeks = sortWeeksByName(result);
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
