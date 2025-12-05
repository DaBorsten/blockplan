import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type PreferencesState = {
  autoLatestWeek: boolean;
  setAutoLatestWeek: (auto: boolean) => void;
  showSubjectColors: boolean;
  setShowSubjectColors: (show: boolean) => void;
};

export const usePreferencesStore = create(
  persist<PreferencesState>(
    (set) => ({
      autoLatestWeek: true,
      setAutoLatestWeek: (auto) => set({ autoLatestWeek: !!auto }),
      showSubjectColors: true,
      setShowSubjectColors: (show) => set({ showSubjectColors: !!show }),
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
export const useShowSubjectColors = () =>
  usePreferencesStore((s) => s.showSubjectColors);
export const useSetShowSubjectColors = () =>
  usePreferencesStore((s) => s.setShowSubjectColors);
