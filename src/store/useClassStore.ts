import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useWeekStore } from "./useWeekStore";

// Class Store
type ClassState = {
  classId: string | null;
  setClass: (id: string | null) => void;
  clearClass: () => void;
};

export const useClassStore = create<ClassState>()(
  persist(
    (set, get) => ({
      classId: null,
      setClass: (id) => {
        const currentClassId = get().classId;
        // Nur wenn sich die Klasse tatsächlich ändert
        if (currentClassId !== id) {
          set({ classId: id ?? null });
          // Week Store zurücksetzen wenn sich die Klasse ändert
          useWeekStore.getState().clearWeek();
        }
      },
      clearClass: () => {
        set({ classId: null });
        // Week Store auch bei clearClass zurücksetzen
        useWeekStore.getState().clearWeek();
      },
    }),
    {
      name: "class-storage",
      version: 1,
    },
  ),
);

// Convenience hooks
export const useCurrentClass = () => useClassStore((s) => s.classId);
export const useSetClass = () => useClassStore((s) => s.setClass);
