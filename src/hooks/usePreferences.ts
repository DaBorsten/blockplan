/**
 * Custom hooks for user preferences stored in Convex database
 * These replace the localStorage-based usePreferencesStore
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook for user's global preferences
 * Returns preferences and update function
 */
export function useUserPreferences() {
  const preferences = useQuery(api.preferences.getUserPreferences);
  const updateMutation = useMutation(api.preferences.updateUserPreferences);

  const updatePreferences = useCallback(
    async (updates: {
      autoLatestWeek?: boolean;
      showSubjectColors?: boolean;
      animationsEnabled?: boolean;
    }) => {
      await updateMutation(updates);
    },
    [updateMutation],
  );

  return {
    preferences: {
      autoLatestWeek: preferences?.autoLatestWeek ?? true,
      showSubjectColors: preferences?.showSubjectColors ?? true,
      animationsEnabled: preferences?.animationsEnabled ?? true,
    },
    loading: preferences === undefined,
    updatePreferences,
  };
}

/**
 * Convenience hooks that match the old store API
 */
export function useAutoLatestWeek() {
  const { preferences } = useUserPreferences();
  return preferences.autoLatestWeek;
}

export function useSetAutoLatestWeek() {
  const { updatePreferences } = useUserPreferences();
  return useCallback(
    (value: boolean) => {
      // Fire-and-forget pattern with error handling
      void (async () => {
        try {
          await updatePreferences({ autoLatestWeek: value });
        } catch (error) {
          console.error("[useSetAutoLatestWeek] Failed to update preference:", error);
          toast.error("Einstellung konnte nicht gespeichert werden", {
            description: error instanceof Error ? error.message : String(error),
          });
        }
      })();
    },
    [updatePreferences],
  );
}

export function useShowSubjectColors() {
  const { preferences } = useUserPreferences();
  return preferences.showSubjectColors;
}

export function useSetShowSubjectColors() {
  const { updatePreferences } = useUserPreferences();
  return useCallback(
    (value: boolean) => {
      // Fire-and-forget pattern with error handling
      void (async () => {
        try {
          await updatePreferences({ showSubjectColors: value });
        } catch (error) {
          console.error("[useSetShowSubjectColors] Failed to update preference:", error);
          toast.error("Einstellung konnte nicht gespeichert werden", {
            description: error instanceof Error ? error.message : String(error),
          });
        }
      })();
    },
    [updatePreferences],
  );
}

export function useAnimationsEnabled() {
  const { preferences } = useUserPreferences();
  return preferences.animationsEnabled;
}

export function useSetAnimationsEnabled() {
  const { updatePreferences } = useUserPreferences();
  return useCallback(
    (value: boolean) => {
      // Fire-and-forget pattern with error handling
      void (async () => {
        try {
          await updatePreferences({ animationsEnabled: value });
        } catch (error) {
          console.error("[useSetAnimationsEnabled] Failed to update preference:", error);
          toast.error("Einstellung konnte nicht gespeichert werden", {
            description: error instanceof Error ? error.message : String(error),
          });
        }
      })();
    },
    [updatePreferences],
  );
}
