import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ClassIDState = {
  classID: string | null;
  setClassID: (id: string | null) => void;
};

export const useClassIDStore = create(
  persist<ClassIDState>(
    (set) => ({
      classID: null,
      setClassID: (id) => set({ classID: id }),
    }),
    {
      name: "class-id-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
