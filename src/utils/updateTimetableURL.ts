import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// Bei Änderung Auswahl → URL aktualisieren
export const updateUrl = (router: AppRouterInstance, week: string | null, spec: number, classId: string | null) => {
  const params = new URLSearchParams();
  if (week) params.set("week", week);
  if (spec && spec !== 1) params.set("spec", String(spec));
  if (classId) params.set("class", classId);
  router.replace("?" + params.toString(), { scroll: false });
};
