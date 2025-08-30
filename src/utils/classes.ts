
type ClassOption = { label: string; value: string | null };

export const fetchUserClassesWithNames = async (): Promise<ClassOption[]> => {
  const res = await fetch(
    `/api/class/classes`,
    { cache: "no-store" }
  );
  if (!res.ok) return [
    { label: "Keine Klasse", value: null },
  ];
  const data = await res.json();
  const rows: Array<{ class_id: string; class_title: string }> = data.data || [];
  const items = rows
    .map((r) => ({ label: r.class_title, value: r.class_id }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return [{ label: "Keine Klasse", value: null }, ...items];
};
