import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";

// Bei Änderung Auswahl → URL aktualisieren
export const updateUrl = (router: AppRouterInstance, week: string | null, spec: number) => {
  const params = new URLSearchParams();
  if (week) params.set("week", week);
  if (spec && spec !== 1) params.set("spec", String(spec));
  router.replace("?" + params.toString(), { scroll: false });
};
