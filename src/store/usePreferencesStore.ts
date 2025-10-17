import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type PreferencesState = {
  autoLatestWeek: boolean;
  setAutoLatestWeek: (auto: boolean) => void;
};

export const usePreferencesStore = create(
  persist<PreferencesState>(
    (set) => ({
      autoLatestWeek: true,
      setAutoLatestWeek: (auto) => set({ autoLatestWeek: !!auto }),
    }),
    {
      name: "preferences-storage",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
export const useAutoLatestWeek = () =>
  usePreferencesStore((s) => s.autoLatestWeek);
export const useSetAutoLatestWeek = () =>
  usePreferencesStore((s) => s.setAutoLatestWeek);
