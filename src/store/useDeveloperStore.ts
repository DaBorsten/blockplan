import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type DeveloperState = {
  isDeveloper: boolean;
  toggleDeveloper: () => void;
};

export const useDeveloperStore = create(
  persist<DeveloperState>(
    (set) => ({
      isDeveloper: false,
      toggleDeveloper: () => {
        set((state) => ({
          isDeveloper: !state.isDeveloper,
        }));
      },
    }),
    {
      name: "developer-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
