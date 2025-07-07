import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeState = {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
};

export const useThemeStore = create(
  persist<ThemeState>(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme: theme }),
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Fehler beim Rehydrieren des Theme-Speichers:", error);
          return { theme: "system" };
        }
        return state || { theme: "system" };
      },
    },
  ),
);
