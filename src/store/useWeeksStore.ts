import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type WeeksState = {
  weeksUpdate: number;
  setWeeksUpdate: () => void;
};

export const useWeeksStore = create(
  persist<WeeksState>(
    (set) => ({
      weeksUpdate: 0,
      setWeeksUpdate: () => {
        set((state) => ({
          weeksUpdate: state.weeksUpdate + 1,
        }));
      },
    }),
    {
      name: "week-id-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
