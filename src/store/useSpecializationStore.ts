import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Specialization = 1 | 2 | 3;

type SpecializationState = {
  specialization: Specialization;
  setSpecialization: (specialization: Specialization) => void;
};

export const useSpecializationStore = create(
  persist<SpecializationState>(
    (set) => ({
      specialization: 1,
      setSpecialization: (specialization) =>
        set({ specialization: specialization }),
    }),
    {
      name: "specialization-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
