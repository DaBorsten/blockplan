"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

/**
 * Component to migrate localStorage preferences to database
 * This should be mounted once in the app layout
 * It will automatically migrate preferences on first load if they don't exist in the DB yet
 */
export function PreferencesMigration() {
  const { isLoaded, isSignedIn } = useUser();
  const currentPreferences = useQuery(api.preferences.getUserPreferences);
  const updatePreferences = useMutation(api.preferences.updateUserPreferences);
  const hasRun = useRef(false);

  useEffect(() => {
    // Only run once per session
    if (hasRun.current) return;
    if (!isLoaded || !isSignedIn) return;
    // Wait for DB query to load (undefined = loading, null = error)
    if (currentPreferences == null) return;

    // Check if preferences are already set in the database
    // If they are explicitly set (not undefined), skip migration
    const dbHasPreferences =
      currentPreferences.autoLatestWeek !== undefined ||
      currentPreferences.showSubjectColors !== undefined;

    if (dbHasPreferences) {
      hasRun.current = true;
      return;
    }

    // Try to read old localStorage values
    try {
      const preferencesStorage = localStorage.getItem("preferences-storage");

      if (preferencesStorage) {
        const parsed = JSON.parse(preferencesStorage);
        const state = parsed?.state;

        if (state && typeof state === "object") {
          const autoLatestWeek = state.autoLatestWeek;
          const showSubjectColors = state.showSubjectColors;

          // Migrate to database only if we have actual values
          if (
            typeof autoLatestWeek === "boolean" ||
            typeof showSubjectColors === "boolean"
          ) {
            // Mark as run synchronously BEFORE starting the async operation
            // to prevent double execution if the effect re-runs
            hasRun.current = true;

            void updatePreferences({
              autoLatestWeek:
                typeof autoLatestWeek === "boolean"
                  ? autoLatestWeek
                  : undefined,
              showSubjectColors:
                typeof showSubjectColors === "boolean"
                  ? showSubjectColors
                  : undefined
            }).catch((error) => {
              console.error(
                "[PreferencesMigration] Failed to migrate preferences:",
                error
              );
            });
          } else {
            // No values to migrate, mark as done
            hasRun.current = true;
          }
        } else {
          // No valid state object, mark as done
          hasRun.current = true;
        }
      } else {
        // No localStorage data found, mark as done
        hasRun.current = true;
      }
    } catch (error) {
      console.error("[PreferencesMigration] Error during migration:", error);
      hasRun.current = true;
    }
  }, [isLoaded, isSignedIn, currentPreferences, updatePreferences]);

  // This component doesn't render anything
  return null;
}
