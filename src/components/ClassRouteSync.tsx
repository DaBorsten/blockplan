"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

function mergeAndReplace(
  router: ReturnType<typeof useRouter>,
  searchParams: ReturnType<typeof useSearchParams>,
  patch: Record<string, string | null>,
) {
  const params = new URLSearchParams(searchParams?.toString() ?? "");
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "") params.delete(k);
    else params.set(k, v);
  }
  router.replace("?" + params.toString(), { scroll: false });
}

export default function ClassRouteSync() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  // No local stores; rely on URL params only

  const [validWeeks, setValidWeeks] = React.useState<Set<string> | null>(null);
  const syncingRef = React.useRef(false);

  // Load valid weeks for class in URL or store; requires user membership
  React.useEffect(() => {
    let cancelled = false;
    async function loadWeeks() {
      const classForValidation = searchParams?.get("class");
      if (!user?.id || !classForValidation) { if (!cancelled) setValidWeeks(null); return; }
      try {
        const url = `/api/class/weeks?class_id=${encodeURIComponent(classForValidation)}&user_id=${encodeURIComponent(user.id)}`;
        const res = await fetch(url);
        const data = await res.json();
        const rows: Array<{ week_id: string }> = data?.data || [];
        if (!cancelled) setValidWeeks(new Set(rows.map((r) => r.week_id)));
      } catch {
        // keep null on error to avoid clearing week from URL prematurely
        if (!cancelled) setValidWeeks(null);
      }
    }
    loadWeeks();
    return () => { cancelled = true; };
  }, [user?.id, searchParams]);

  // Sync URL <-> Store for class and week with validation (prefer URL values, update only after validation)
  React.useEffect(() => {
    if (!searchParams) return;
    if (syncingRef.current) return;
    if (!user?.id) return; // wait for auth to load

    const urlClass = searchParams.get("class");
    const urlWeek = searchParams.get("week");

    // For weeks, require validWeeks to be known for the class candidate; otherwise, don't touch week
    if (validWeeks === null) return; // wait until we know week validity for the candidate class
    const weekValid = urlWeek ? validWeeks?.has(urlWeek) : true;
    const desiredWeek: string | null = urlClass
      ? (weekValid && urlWeek ? urlWeek : null)
      : null;

    // Update URL
    const patch: Record<string, string | null> = {};
  const currentUrlWeek = urlWeek ?? null;
  if (currentUrlWeek !== desiredWeek) patch.week = desiredWeek;
    if (Object.keys(patch).length) {
      syncingRef.current = true;
      mergeAndReplace(router, searchParams, patch);
      syncingRef.current = false;
    }
  }, [searchParams, validWeeks, router, user?.id]);

  return null;
}
