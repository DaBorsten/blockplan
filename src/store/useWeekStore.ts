import { create } from "zustand";
import { persist } from "zustand/middleware";

// Week Store - stores currently selected week
type WeekState = {
  weekId: string | null;
  setWeek: (weekId: string | null) => void;
  clearWeek: () => void;
};

export const useWeekStore = create<WeekState>()(
  persist(
    (set) => ({
      weekId: null,
      setWeek: (weekId) => set({ weekId: weekId ?? null }),
      clearWeek: () => set({ weekId: null }),
    }),
    {
      name: "week-storage",
      version: 1,
    },
  ),
);

// Convenience hooks
export const useCurrentWeek = () => useWeekStore((s) => s.weekId);
export const useSetWeek = () => useWeekStore((s) => s.setWeek);
