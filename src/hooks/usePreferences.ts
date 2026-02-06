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
    }) => {
      await updateMutation(updates);
    },
    [updateMutation],
  );

  return {
    preferences: {
      autoLatestWeek: preferences?.autoLatestWeek ?? true,
      showSubjectColors: preferences?.showSubjectColors ?? true,
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
    async (value: boolean) => {
      try {
        await updatePreferences({ autoLatestWeek: value });
      } catch (error) {
        console.error("[useSetAutoLatestWeek] Failed to update preference:", error);
        toast.error("Einstellung konnte nicht gespeichert werden", {
          description: error instanceof Error ? error.message : String(error),
        });
        throw error; // Re-throw so callers can handle if needed
      }
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
    async (value: boolean) => {
      try {
        await updatePreferences({ showSubjectColors: value });
      } catch (error) {
        console.error("[useSetShowSubjectColors] Failed to update preference:", error);
        toast.error("Einstellung konnte nicht gespeichert werden", {
          description: error instanceof Error ? error.message : String(error),
        });
        throw error; // Re-throw so callers can handle if needed
      }
    },
    [updatePreferences],
  );
}
