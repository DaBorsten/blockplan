import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type WeekIDState = {
  weekID: string | null;
  setWeekID: (id: string | null) => void;
};

export const useWeekIDStore = create(
  persist<WeekIDState>(
    (set) => ({
      weekID: null,
      setWeekID: (id) => set({ weekID: id }),
    }),
    {
      name: "week-id-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
