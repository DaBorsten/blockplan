"use client";
/**
 * Erzwingt folgende URL-Parameter-Regeln:
 * - "woche" und "gruppe" nur auf /stundenplan und Unterseiten.
 * - Auf allen anderen Routen werden diese beiden Parameter entfernt.
 * - "klasse" bleibt auf allen *geschützten* Routen erhalten (alle außer /, /datenschutzhinweis, /impressum).
 * - Default-Spezialisierung (gruppe=1) bleibt sichtbar (wird also nie entfernt, solange wir auf /stundenplan sind).
 */
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { PROTECTED_PATH_PREFIXES, ROUTE_STUNDENPLAN } from "@/constants/routes";

const PUBLIC_PATHS = new Set(["/", "/datenschutzhinweis", "/impressum"]);

function isProtected(path: string) {
  if (PUBLIC_PATHS.has(path)) return false;
  return PROTECTED_PATH_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

export default function ParamPolicySync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  React.useEffect(() => {
    if (!pathname || !searchParams) return;

    const isTimetable = pathname === ROUTE_STUNDENPLAN || pathname.startsWith(ROUTE_STUNDENPLAN + "/");
    const params = new URLSearchParams(searchParams.toString());
    let mutated = false;

    // Enforce removal of woche & gruppe when not on timetable
    if (!isTimetable) {
      if (params.has("woche")) { params.delete("woche"); mutated = true; }
      if (params.has("gruppe")) { params.delete("gruppe"); mutated = true; }
    }

    // On timetable ensure gruppe exists (default 1). Woche nur behalten, wenn Klasse vorhanden.
    if (isTimetable) {
      const hasClass = params.has("klasse");
      if (!params.has("gruppe")) { params.set("gruppe", "1"); mutated = true; }
      if (params.get("gruppe") === "") { params.set("gruppe", "1"); mutated = true; }
      if (!hasClass && params.has("woche")) { params.delete("woche"); mutated = true; }
    }

    const hasKlasse = params.has("klasse");
    const protectedRoute = isProtected(pathname);

    // Entferne klasse auf öffentlichen Seiten
    if (!protectedRoute && hasKlasse) { params.delete("klasse"); mutated = true; }

    // Auf geschützten Seiten: nichts erzwingen (Klasse kann auch fehlen). Optional könnte man redirecten.

    if (mutated) {
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }
  }, [pathname, searchParams, router]);

  return null;
}
