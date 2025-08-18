import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ModeState = {
  mode: "notes" | "copy";
  setMode: (mode: "notes" | "copy") => void;
  toggleMode: () => void;
};

export const useModeStore = create(
  persist<ModeState>(
    (set) => ({
      mode: "notes",
      setMode: (mode) => set({ mode: mode }),
      toggleMode: () =>
        set((state) => ({
          mode: state.mode === "notes" ? "copy" : "notes",
        })),
    }),
    {
      name: "mode-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
