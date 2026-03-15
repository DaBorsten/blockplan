"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAnimationsEnabled } from "@/hooks/usePreferences";

const AnimationsContext = createContext<boolean | undefined>(undefined);

/**
 * Hook to check if animations are enabled.
 * Use this in components to conditionally apply motion props.
 * Throws error if used outside AnimationProvider.
 */
export const useIsAnimated = () => {
  const value = useContext(AnimationsContext);
  if (value === undefined) {
    throw new Error("useIsAnimated must be used within AnimationProvider");
  }
  return value;
};

function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

/**
 * Provides the animation-enabled flag to all child components via context.
 * Respects both the user preference and the OS-level prefers-reduced-motion setting.
 */
export function AnimationProvider({ children }: { children: ReactNode }) {
  const enabled = useAnimationsEnabled();
  const prefersReduced = useReducedMotion();

  return (
    <AnimationsContext.Provider value={enabled && !prefersReduced}>
      {children}
    </AnimationsContext.Provider>
  );
}
