import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
