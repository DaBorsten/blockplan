"use client";

import { ReactNode, createContext, useContext } from "react";
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

/**
 * Provides the animation-enabled flag to all child components via context.
 */
export function AnimationProvider({ children }: { children: ReactNode }) {
  const enabled = useAnimationsEnabled();

  return (
    <AnimationsContext.Provider value={enabled}>
      {children}
    </AnimationsContext.Provider>
  );
}
